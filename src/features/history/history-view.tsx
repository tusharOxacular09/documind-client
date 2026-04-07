"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import type { ChatSummary } from "@/types/api";

export function HistoryView() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listChats();
        setConversations(data.chats);
      } catch {
        setConversations([]);
      }
    };
    void load();
  }, []);

  const formatWhen = (iso: string): string =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Conversation History</h1>
        <p className="text-muted-foreground mt-1">{conversations.length} past conversations</p>
      </div>

      <div className="space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => router.push(`/chat?chatId=${conv.id}`)}
            className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{conv.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{conv.lastMessagePreview}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatWhen(conv.lastMessageAt)}
                    </span>
                    <span>{conv.messageCount} messages</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
