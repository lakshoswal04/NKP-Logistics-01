import { API_URL, ApiError } from "@/lib/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // non-JSON body
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  return fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

function get<T>(path: string, token?: string): Promise<T> {
  return fetch(`${API_URL}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then((r) => handle<T>(r));
}

// ---------- types ----------

export interface ModelMetrics {
  eta: { mae_hours: number; r2: number; residual_std_hours: number; n_test: number };
  delay: { roc_auc: number; precision: number; recall: number; delay_rate: number };
  fraud: { roc_auc: number; precision_at_top5pct: number; fraud_rate: number };
  forecast: { mape_mean: number; lanes: number; holdout_days: number };
  trained_on: string;
}

export interface ShipmentInput {
  origin_city: string;
  destination_city: string;
  shipment_type: string;
  weight_kg: number;
  pickup_at?: string;
}

export interface EtaResult {
  predicted_hours: number;
  window_low_hours: number;
  window_high_hours: number;
  planned_hours: number;
  distance_km: number;
  disclaimer: string;
}

export interface FactorItem {
  label: string;
  impact: number;
}

export interface DelayResult {
  delay_probability: number;
  risk_level: "low" | "medium" | "high";
  factors: FactorItem[];
  disclaimer: string;
}

export interface FraudInput {
  account_age_days: number;
  bookings_last_24h: number;
  declared_value_inr: number;
  weight_kg: number;
  payment_cod: boolean;
  address_mismatch: boolean;
  night_booking: boolean;
  claims_ratio: number;
  new_lane_for_customer: boolean;
}

export interface FraudResult {
  fraud_probability: number;
  risk_level: "low" | "medium" | "high";
  reasons: FactorItem[];
  disclaimer: string;
}

export interface ForecastPoint {
  date: string;
  volume: number;
  low?: number;
  high?: number;
}

export interface ForecastResult {
  lane: string;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  disclaimer: string;
}

export interface RouteStop {
  order: number;
  shipment_ref: string;
  city: string;
  load_kg: number;
  lat: number;
  lng: number;
}

export interface RoutePlan {
  depot: string;
  depot_lat: number;
  depot_lng: number;
  solver: string;
  routes: {
    vehicle: string;
    capacity_kg: number;
    load_kg: number;
    utilization: number;
    distance_km: number;
    stops: RouteStop[];
  }[];
  total_distance_km: number;
  naive_distance_km: number;
  distance_saved_km: number;
  unassigned: number;
}

export interface CopilotResult {
  answer: string;
  data?: Record<string, unknown>[];
  detail?: string[];
  chart?: { type: "bar" | "line"; series: { label: string; value: number }[] };
  suggestions: string[];
}

export interface DelayQueueItem {
  tracking_id: string;
  lane: string;
  status: string;
  delay_probability: number;
  risk_level: string;
  top_factor: string | null;
}

// ---------- calls ----------

export const fetchModelMetrics = () => get<ModelMetrics>("/ai/models");
export const fetchEta = (input: ShipmentInput) => post<EtaResult>("/ai/eta", input);
export const fetchDelayRisk = (input: ShipmentInput) => post<DelayResult>("/ai/delay-risk", input);
export const fetchFraudRisk = (input: FraudInput) => post<FraudResult>("/ai/fraud-risk", input);
export const fetchForecastLanes = () => get<{ lanes: string[] }>("/ai/forecast/lanes");
export const fetchForecast = (lane: string) =>
  get<ForecastResult>(`/ai/forecast?lane=${encodeURIComponent(lane)}`);
export const fetchRoutePlan = (body: {
  depot: string;
  stops: { shipment_ref: string; city: string; load_kg: number }[];
  vehicles: { name: string; capacity_kg: number }[];
}) => post<RoutePlan>("/ai/route-optimize", body);
export const askCopilot = (question: string) => post<CopilotResult>("/ai/copilot", { question });
export const fetchDelayQueue = (token: string) =>
  get<DelayQueueItem[]>("/ai/insights/delay-queue", token);
