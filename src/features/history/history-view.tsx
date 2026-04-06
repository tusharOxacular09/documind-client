"use client";

import { MessageSquare, Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const conversations = [
  {
    id: "1",
    title: "Q4 Revenue Analysis",
    lastMessage: "The total revenue for Q4 was $4.2M, showing a 15% increase...",
    date: "2 hours ago",
    messages: 8,
  },
  {
    id: "2",
    title: "Product Roadmap Discussion",
    lastMessage: "Three major releases are planned for Q1: AI search, batch...",
    date: "5 hours ago",
    messages: 12,
  },
  {
    id: "3",
    title: "Meeting Action Items",
    lastMessage: "Here are the key action items from the last team meeting...",
    date: "1 day ago",
    messages: 5,
  },
  {
    id: "4",
    title: "Marketing Strategy Review",
    lastMessage: "The marketing strategy focuses on three core channels...",
    date: "2 days ago",
    messages: 15,
  },
  {
    id: "5",
    title: "Technical Architecture",
    lastMessage: "The system uses a microservices architecture with...",
    date: "3 days ago",
    messages: 20,
  },
];

export function HistoryView() {
  const router = useRouter();

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
            onClick={() => router.push("/chat")}
            className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{conv.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{conv.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {conv.date}
                    </span>
                    <span>{conv.messages} messages</span>
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
