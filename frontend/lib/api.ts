export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ShipmentStatus =
  | "booked"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "failed";

export interface TrackingEvent {
  status: ShipmentStatus;
  description: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string;
}

export interface TrackingResult {
  tracking_id: string;
  status: ShipmentStatus;
  shipment_type: string;
  origin_city: string;
  destination_city: string;
  pickup_date: string | null;
  eta: string | null;
  vehicle_type: string | null;
  driver_name: string | null;
  events: TrackingEvent[];
}

export interface QuoteResult {
  origin_city: string;
  destination_city: string;
  distance_km: number;
  price_min: number;
  price_max: number;
  currency: string;
  disclaimer: string;
}

export interface LeadPayload {
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  message?: string;
  service?: string;
  industry?: string;
  origin_city?: string;
  destination_city?: string;
  weight_kg?: number;
  shipment_type?: string;
  urgency?: string;
}

export interface LeadResult {
  id: number;
  full_name: string;
  email: string;
  status: string;
  quote: QuoteResult | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchTracking(trackingId: string): Promise<TrackingResult> {
  const res = await fetch(`${API_URL}/api/v1/tracking/${encodeURIComponent(trackingId.trim())}`);
  return handle<TrackingResult>(res);
}

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  const res = await fetch(`${API_URL}/api/v1/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<LeadResult>(res);
}
