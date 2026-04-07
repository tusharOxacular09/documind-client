"use client";

import { AUTH_SESSION_COOKIE } from "@/lib/auth-constants";

const ACCESS = "documind_access_token";
const REFRESH = "documind_refresh_token";
const USER_KEY = "documind_user";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export { AUTH_SESSION_COOKIE };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

function setSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0`;
}

export const authStorage = {
  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setSessionCookie();
  },

  setAccessToken(accessToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS, accessToken);
  },

  setUser(user: AuthUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER_KEY);
    clearSessionCookie();
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH);
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
};
