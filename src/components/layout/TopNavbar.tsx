"use client";

import { Menu, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useDashboardUser } from "@/components/auth/dashboard-session";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/store/auth-storage";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const TopNavbar = ({ onMenuClick }: TopNavbarProps) => {
  const router = useRouter();
  const sessionUser = useDashboardUser();

  const logout = () => {
    authStorage.clear();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center gap-2 px-3 sm:px-4 shrink-0 pt-safe">
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-1" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </Button>

      <Link
        href="/dashboard"
        className="font-semibold text-sm sm:text-base tracking-tight truncate text-foreground hover:text-primary transition-colors"
      >
        DocuMind
      </Link>

      <div className="flex-1 min-w-2" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            {sessionUser?.name ?? "Account"}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopNavbar;
