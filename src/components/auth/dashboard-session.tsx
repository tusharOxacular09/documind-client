"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/services/api";
import { authStorage } from "@/store/auth-storage";
import type { SafeUser } from "@/types/api";

const DashboardUserContext = createContext<SafeUser | null>(null);

export const useDashboardUser = (): SafeUser | null => useContext(DashboardUserContext);

export function DashboardSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SafeUser | null>(() => authStorage.getUser());
  const [ready, setReady] = useState(false);

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
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardUserContext.Provider value={user}>{children}</DashboardUserContext.Provider>;
}
