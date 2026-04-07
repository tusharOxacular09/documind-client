export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T;
  error: null;
};

export type ApiErrorBody = {
  status: "error";
  message: string;
  data: null;
  error: Record<string, unknown>;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
};

export type RefreshTokenPayload = {
  accessToken: string;
};

export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export type DocumentType = "pdf" | "docx" | "ppt" | "pptx";

export type DocumentItem = {
  id: string;
  name: string;
  type: DocumentType;
  sizeBytes: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ChatCitation = {
  documentId?: string;
  documentName: string;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations: ChatCitation[];
  feedback: "none" | "up" | "down";
};

export type ChatSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessagePreview: string;
};
