"use client";

import { Brain, LayoutDashboard, FileText, MessageSquare, Settings, History, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "History", url: "/history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const AppSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) => {
  const sidebarContent = (
    <div className={cn(
      "h-full flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-sidebar-accent-foreground">DocuMind AI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            href={item.url}
            end={item.url === "/dashboard"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            onClick={onMobileClose}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden lg:block p-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 h-full w-60 animate-fade-in">
            {/* Force expanded for mobile */}
            <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground w-60">
              <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-sidebar-accent-foreground">DocuMind AI</span>
              </div>
              <nav className="flex-1 py-4 space-y-1 px-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.url}
                    href={item.url}
                    end={item.url === "/dashboard"}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    onClick={onMobileClose}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>
    </>
  );
};

export default AppSidebar;
