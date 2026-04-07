"use client";

import { Activity, ArrowRight, Clock, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useDashboardSession } from "@/components/auth/dashboard-session";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { ChatSummary, DocumentItem, DocumentStatus } from "@/types/api";

const docStatusLabel = (status: DocumentStatus): string => {
  if (status === "ready") return "Ready";
  if (status === "failed") return "Failed";
  if (status === "uploaded") return "Queued";
  return "Processing";
};

const formatRelative = (iso: string): string => {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

export function DashboardView() {
  const { user } = useDashboardSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [docRes, chatRes] = await Promise.all([api.listDocuments(), api.listChats()]);
        if (!cancelled) {
          setDocuments(docRes.documents);
          setChats(chatRes.chats);
        }
      } catch {
        if (!cancelled) {
          setDocuments([]);
          setChats([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const readyCount = documents.filter((d) => d.status === "ready").length;
    const totalQueriesApprox = chats.reduce((acc, c) => acc + Math.max(0, Math.floor(c.messageCount / 2)), 0);
    const activityToday =
      documents.filter((d) => isToday(d.updatedAt)).length + chats.filter((c) => isToday(c.lastMessageAt)).length;
    return [
      {
        label: "Documents",
        value: loading ? "—" : String(documents.length),
        sub: loading ? "" : `${readyCount} ready`,
        icon: FileText,
        color: "text-primary",
      },
      {
        label: "Conversations",
        value: loading ? "—" : String(chats.length),
        sub: loading ? "" : `~${totalQueriesApprox} questions asked`,
        icon: MessageSquare,
        color: "text-info",
      },
      {
        label: "Activity today",
        value: loading ? "—" : String(activityToday),
        sub: "uploads & chat updates",
        icon: Activity,
        color: "text-success",
      },
    ];
  }, [documents, chats, loading]);

  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [documents]);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-fade-in pb-safe">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Here is a live snapshot of your workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/documents">
              Documents <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/chat">
              New chat <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{s.value}</p>
                {s.sub ? <p className="text-xs text-muted-foreground mt-1 truncate">{s.sub}</p> : null}
              </div>
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Recent documents</h2>
          <Link href="/documents" className="text-sm text-primary hover:underline shrink-0">
            View all
          </Link>
        </div>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : recentDocs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No documents yet.{" "}
              <Link href="/documents" className="text-primary font-medium hover:underline">
                Upload your first file
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-secondary/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatRelative(doc.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      doc.status === "ready"
                        ? "bg-accent text-accent-foreground"
                        : doc.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {docStatusLabel(doc.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
