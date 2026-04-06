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
