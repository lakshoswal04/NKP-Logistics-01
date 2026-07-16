"use client";

import { API_URL, ApiError } from "@/lib/api";

const ACCESS_KEY = "nkp_access_token";
const REFRESH_KEY = "nkp_refresh_token";

export interface SessionUser {
  id: number;
  role: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

/** Decode the JWT payload (no verification — the API verifies; this is for routing only). */
export function getSessionUser(): SessionUser | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { id: Number(payload.sub), role: payload.role ?? "customer" };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = "Login failed";
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      // keep default
    }
    throw new ApiError(res.status, detail);
  }
  const tokens = await res.json();
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  const user = getSessionUser();
  if (!user) throw new ApiError(500, "Could not read session");
  return user;
}

export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
