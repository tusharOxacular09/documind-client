"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/services/api";
import { authStorage } from "@/store/auth-storage";
import type { SafeUser } from "@/types/api";

type DashboardSessionValue = {
  user: SafeUser;
  refreshProfile: () => Promise<void>;
};

const DashboardUserContext = createContext<DashboardSessionValue | null>(null);

export const useDashboardUser = (): SafeUser | null => useContext(DashboardUserContext)?.user ?? null;

export function useDashboardSession(): DashboardSessionValue {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error("useDashboardSession must be used inside DashboardSession");
  }
  return ctx;
}

export function DashboardSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SafeUser | null>(() => authStorage.getUser());
  const [ready, setReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    const { user: u } = await api.me();
    authStorage.setUser(u);
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { user: u } = await api.me();
        if (cancelled) return;
        authStorage.setUser(u);
        setUser(u);
      } catch {
        if (cancelled) return;
        authStorage.clear();
        setUser(null);
        const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${next}`);
        return;
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardUserContext.Provider value={{ user, refreshProfile }}>{children}</DashboardUserContext.Provider>
  );
}
