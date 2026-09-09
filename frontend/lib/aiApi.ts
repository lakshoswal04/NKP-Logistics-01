import { API_URL, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.detail ?? message;
    } catch {
      /* keep the status text */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return handle<T>(
    await fetch(`${API_URL}/api/v1${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

export type AiMode = "live" | "demo";

export interface AiStatus {
  mode: AiMode;
  model: string | null;
  features: string[];
  suggestions: string[];
  note: string;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  return handle<AiStatus>(await fetch(`${API_URL}/api/v1/ai/status`));
}

export interface CopilotResponse {
  answer: string;
  mode: AiMode;
  model: string | null;
  tools_used: string[];
  data: Record<string, unknown> | null;
  disclaimer: string;
}

export async function askCopilot(question: string): Promise<CopilotResponse> {
  return post<CopilotResponse>("/ai/copilot", { question }, true);
}

/**
 * Stream a copilot answer over SSE.
 *
 * fetch + ReadableStream rather than EventSource: EventSource cannot send a
 * POST body or an Authorization header, both of which this endpoint needs.
 */
export async function streamCopilot(
  question: string,
  handlers: {
    onMeta?: (meta: { mode: AiMode; tools_used: string[]; model?: string }) => void;
    onText: (chunk: string) => void;
    onDone?: (meta: { mode: AiMode; model?: string }) => void;
    onError?: (message: string) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/api/v1/ai/copilot/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question }),
    signal: handlers.signal,
  });

  if (!res.ok || !res.body) {
    throw new ApiError(res.status, res.statusText || "Stream failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; a partial frame stays buffered.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "meta") handlers.onMeta?.(event);
        else if (event.type === "text") handlers.onText(event.value);
        else if (event.type === "done") handlers.onDone?.(event);
        else if (event.type === "error") handlers.onError?.(event.message);
      } catch {
        /* ignore a malformed frame rather than killing the stream */
      }
    }
  }
}

export interface AddressResult {
  normalised: {
    line1: string | null;
    locality: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
  };
  serviceable: boolean;
  confidence: number;
  rto_risk: number;
  risk_band: string;
  issues: string[];
  reasoning: string;
  mode: AiMode;
  model: string | null;
  disclaimer: string;
}

export async function analyseAddress(address: string): Promise<AddressResult> {
  return post<AddressResult>("/ai/address", { address });
}

export interface PlacementResult {
  recommended: {
    fulfilment_centre: string;
    orders: number;
    share_pct: number;
    rationale: string;
  }[];
  total_orders: number;
  coverage_pct: number;
  unmapped_orders: number;
  summary: string;
  reasoning: string;
  mode: AiMode;
  model: string | null;
  disclaimer: string;
}

export async function advisePlacement(
  distribution: { city: string; orders: number }[],
  notes?: string,
): Promise<PlacementResult> {
  return post<PlacementResult>("/ai/placement", { distribution, notes });
}

export interface TriageResult {
  category: string;
  urgency: string;
  summary: string;
  suggested_reply: string;
  needs_human: boolean;
  matched_topics: string[];
  mode: AiMode;
  model: string | null;
  disclaimer: string;
}

export async function triageMessage(message: string): Promise<TriageResult> {
  return post<TriageResult>("/ai/triage", { message });
}

export interface NarrativeResult {
  tracking_id: string;
  status: string;
  headline: string;
  explanation: string;
  next_step: string;
  revised_eta_note: string;
  email_subject: string;
  email_body: string;
  mode: AiMode;
  model: string | null;
  disclaimer: string;
}

export async function delayNarrative(trackingId: string): Promise<NarrativeResult> {
  return post<NarrativeResult>("/ai/delay-narrative", { tracking_id: trackingId });
}

export async function fetchDelayedConsignments(): Promise<{
  consignments: { tracking_id: string; status: string; lane: string }[];
}> {
  return handle(await fetch(`${API_URL}/api/v1/ai/delayed-consignments`));
}
