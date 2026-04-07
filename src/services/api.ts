import type {
  ApiErrorBody,
  ApiSuccess,
  AuthPayload,
  DocumentItem,
  RefreshTokenPayload,
  SafeUser,
} from "@/types/api";
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

function isNoAuthPath(path: string): boolean {
  return path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/refresh";
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseJson<ApiSuccess<RefreshTokenPayload> | ApiErrorBody>(res);
    if (payload.status !== "success" || !res.ok) {
      return false;
    }
    authStorage.setAccessToken(payload.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInitWithBody = {}, retried = false): Promise<T> {
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

  let payload: ApiSuccess<T> | ApiErrorBody;
  try {
    payload = await parseJson<ApiSuccess<T> | ApiErrorBody>(res);
  } catch {
    throw new Error("Invalid response from server");
  }

  if (res.status === 401 && !retried && !isNoAuthPath(path) && authStorage.getRefreshToken()) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    authStorage.clear();
  }

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

  async refresh(refreshToken: string): Promise<RefreshTokenPayload> {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseJson<ApiSuccess<RefreshTokenPayload> | ApiErrorBody>(res);
    if (payload.status === "error") {
      throw new Error(payload.message || "Refresh failed");
    }
    if (!res.ok) {
      throw new Error(payload.message || `HTTP ${res.status}`);
    }
    return payload.data;
  },

  async me(): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>("/api/auth/me", { method: "GET" });
  },

  async updateProfile(body: { name: string; email: string }): Promise<{ user: SafeUser }> {
    return request<{ user: SafeUser }>("/api/auth/profile", { method: "PUT", body });
  },

  async listDocuments(): Promise<{ documents: DocumentItem[] }> {
    return request<{ documents: DocumentItem[] }>("/api/documents", { method: "GET" });
  },

  async createDocument(body: { name: string; type: "pdf" | "docx" | "ppt" | "pptx"; sizeBytes: number }): Promise<{
    document: DocumentItem;
  }> {
    return request<{ document: DocumentItem }>("/api/documents", { method: "POST", body });
  },

  async deleteDocument(documentId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(`/api/documents/${documentId}`, { method: "DELETE" });
  },
};
