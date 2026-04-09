"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import AppSidebar from "./AppSidebar";
import TopNavbar from "./TopNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isChatRoute = pathname === "/chat" || pathname?.startsWith("/chat/");

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />
        <main
          className={cn(
            "min-h-0 flex-1",
            isChatRoute ? "flex flex-col overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
