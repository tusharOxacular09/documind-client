import type { ApiErrorBody, ApiSuccess, AuthPayload, SafeUser } from "@/types/api";
import { authStorage } from "@/store/auth-storage";

const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error("Empty response");
  }
  return JSON.parse(text) as T;
}

type RequestInitWithBody = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, init: RequestInitWithBody = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof window !== "undefined" ? authStorage.getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload = await parseJson<ApiSuccess<T> | ApiErrorBody>(res);

  if (payload.status === "error") {
    throw new Error(payload.message || "Request failed");
  }

  if (!res.ok) {
    throw new Error(payload.message || `HTTP ${res.status}`);
  }

  return payload.data;
}

export const api = {
  baseUrl,

  async login(body: { email: string; password: string }): Promise<AuthPayload> {
    return request<AuthPayload>("/api/auth/login", { method: "POST", body });
  },

  async signup(body: { name: string; email: string; password: string }): Promise<AuthPayload> {
    return request<AuthPayload>("/api/auth/register", { method: "POST", body });
  },

  async me(): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>("/api/auth/me", { method: "GET" });
  },
};
