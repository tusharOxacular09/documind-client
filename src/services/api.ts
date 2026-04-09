import type {
  ApiErrorBody,
  ApiSuccess,
  AuthPayload,
  ChatMessage,
  ChatSuggestion,
  ChatSummary,
  DocumentItem,
  DocumentProcessingWorkerStats,
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

async function requestFormData<T>(path: string, formData: FormData, retried = false): Promise<T> {
  const headers = new Headers();
  const token = typeof window !== "undefined" ? authStorage.getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: formData,
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
      return requestFormData<T>(path, formData, true);
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

async function requestBlob(
  path: string,
  init: Omit<RequestInit, "body"> = {},
  retried = false
): Promise<{ blob: Blob; contentType: string; filename: string; isPdf: boolean }> {
  const headers = new Headers(init.headers);
  const token = typeof window !== "undefined" ? authStorage.getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (res.status === 401 && !retried && !isNoAuthPath(path) && authStorage.getRefreshToken()) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return requestBlob(path, init, true);
    }
    authStorage.clear();
  }

  if (!res.ok) {
    // Attempt to parse standard API envelope error, otherwise fall back.
    try {
      const payload = await parseJson<ApiSuccess<unknown> | ApiErrorBody>(res);
      if (payload && (payload as ApiErrorBody).status === "error") {
        throw new Error((payload as ApiErrorBody).message || `HTTP ${res.status}`);
      }
    } catch {
      // ignore JSON parsing failure
    }
    throw new Error(`HTTP ${res.status}`);
  }

  const contentType = res.headers.get("Content-Type") ?? "application/octet-stream";
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] ? decodeURIComponent(match[1]) : "download";
  const blob = await res.blob();
  const isPdf = contentType.toLowerCase().includes("application/pdf") || disposition.toLowerCase().includes("inline");

  return { blob, contentType, filename, isPdf };
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

  async deleteAccount(body: { password: string }): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>("/api/auth/account/delete", { method: "POST", body });
  },

  async getDocumentProcessingHealth(): Promise<{ worker: DocumentProcessingWorkerStats }> {
    return request<{ worker: DocumentProcessingWorkerStats }>("/api/documents/processing/health", {
      method: "GET",
    });
  },

  async listDocuments(): Promise<{ documents: DocumentItem[] }> {
    return request<{ documents: DocumentItem[] }>("/api/documents", { method: "GET" });
  },

  async createDocument(body: { name: string; type: "pdf" | "docx" | "ppt" | "pptx"; sizeBytes: number }): Promise<{
    document: DocumentItem;
  }> {
    return request<{ document: DocumentItem }>("/api/documents", { method: "POST", body });
  },

  async uploadDocument(body: {
    name: string;
    type: "pdf" | "docx" | "ppt" | "pptx";
    sizeBytes: number;
    contentBase64: string;
  }): Promise<{ document: DocumentItem }> {
    return request<{ document: DocumentItem }>("/api/documents/upload", { method: "POST", body });
  },

  async uploadDocumentFile(file: File): Promise<{ document: DocumentItem }> {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData<{ document: DocumentItem }>("/api/documents/upload/multipart", formData);
  },

  async deleteDocument(documentId: string): Promise<{ deleted: boolean }> {
    return request<{ deleted: boolean }>(`/api/documents/${documentId}`, { method: "DELETE" });
  },

  async getDocumentFile(documentId: string): Promise<{ blob: Blob; contentType: string; filename: string; isPdf: boolean }> {
    return requestBlob(`/api/documents/${documentId}/file`, { method: "GET" });
  },

  async listChats(): Promise<{ chats: ChatSummary[] }> {
    return request<{ chats: ChatSummary[] }>("/api/chats", { method: "GET" });
  },

  async listChatSuggestions(): Promise<{ suggestions: ChatSuggestion[] }> {
    return request<{ suggestions: ChatSuggestion[] }>("/api/chats/suggestions", { method: "GET" });
  },

  async getChat(chatId: string): Promise<{ chat: { id: string; title: string; lastMessageAt: string; messages: ChatMessage[] } }> {
    return request<{ chat: { id: string; title: string; lastMessageAt: string; messages: ChatMessage[] } }>(
      `/api/chats/${chatId}`,
      { method: "GET" }
    );
  },

  async askChat(body: {
    message: string;
    chatId?: string;
    documentIds?: string[];
  }): Promise<{
    chat: { id: string; title: string; lastMessageAt: string };
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    return request<{
      chat: { id: string; title: string; lastMessageAt: string };
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }>("/api/chats/ask", { method: "POST", body });
  },

  async setMessageFeedback(chatId: string, messageId: string, feedback: "up" | "down" | "none"): Promise<{
    chatId: string;
    messageId: string;
    feedback: "up" | "down" | "none";
  }> {
    return request<{ chatId: string; messageId: string; feedback: "up" | "down" | "none" }>(
      `/api/chats/${chatId}/messages/${messageId}/feedback`,
      { method: "POST", body: { feedback } }
    );
  },
};
