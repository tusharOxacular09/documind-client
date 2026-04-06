"use client";

import { Activity, Clock, FileText, MessageSquare } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { authStorage } from "@/store/auth-storage";

const stats = [
  { label: "Total Documents", value: "24", icon: FileText, color: "text-primary" },
  { label: "Total Queries", value: "142", icon: MessageSquare, color: "text-info" },
  { label: "Recent Activity", value: "12 today", icon: Activity, color: "text-success" },
];

const recentDocs = [
  { name: "Q4 Financial Report.pdf", date: "2 hours ago", status: "Ready" },
  { name: "Product Roadmap.docx", date: "5 hours ago", status: "Ready" },
  { name: "Team Meeting Notes.pdf", date: "1 day ago", status: "Processing" },
  { name: "Marketing Strategy.pptx", date: "2 days ago", status: "Ready" },
];

export function DashboardView() {
  const [firstName, setFirstName] = useState("there");

  useEffect(() => {
    const user = authStorage.getUser();
    if (user?.name) {
      startTransition(() => setFirstName(user.name.split(" ")[0] ?? user.name));
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your documents.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="divide-y">
            {recentDocs.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {doc.date}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    doc.status === "Ready" ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
