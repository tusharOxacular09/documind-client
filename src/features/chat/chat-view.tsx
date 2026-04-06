"use client";

import { useEffect, useRef, useState } from "react";
import { Send, FileText, ThumbsUp, ThumbsDown, Sparkles, Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: { doc: string; snippet: string }[];
}

const mockDocuments = [
  { id: "1", name: "Q4 Financial Report.pdf" },
  { id: "2", name: "Product Roadmap.docx" },
  { id: "3", name: "Marketing Pitch.pptx" },
  { id: "4", name: "Team Meeting Notes.pdf" },
];

const suggestedQueries = [
  "Summarize the Q4 report",
  "What are the key milestones?",
  "Compare revenue trends",
  "List action items from meetings",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content:
      "Hello! I'm DocuMind AI. Select some documents and ask me anything about them. I'll provide answers with source references.",
    timestamp: "10:00 AM",
  },
];

export function ChatView() {
  const messageIdRef = useRef(100);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>(["1"]);
  const [searchAll, setSearchAll] = useState(false);
  const [typing, setTyping] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = {
      id: String(++messageIdRef.current),
      role: "user",
      content: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: String(++messageIdRef.current),
        role: "ai",
        content: `Based on the selected documents, here's what I found:\n\nThe Q4 Financial Report shows a **15% revenue increase** compared to Q3, driven primarily by enterprise client expansion. The product roadmap indicates three major feature releases planned for the next quarter.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [
          {
            doc: "Q4 Financial Report.pdf",
            snippet: "Revenue increased by 15% quarter-over-quarter, reaching $4.2M in total...",
          },
          {
            doc: "Product Roadmap.docx",
            snippet: "Three major feature releases are planned for Q1 2026: AI search, batch processing...",
          },
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      <div
        className={cn(
          "border-r bg-card flex flex-col transition-all duration-300 shrink-0",
          docPanelOpen ? "w-64" : "w-0 overflow-hidden",
          "hidden md:flex"
        )}
      >
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3">Select Documents</h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Search all</span>
            <Switch checked={searchAll} onCheckedChange={setSearchAll} />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1 scrollbar-thin">
          {mockDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => toggleDoc(doc.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                selectedDocs.includes(doc.id) || searchAll ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
              )}
            >
              {selectedDocs.includes(doc.id) || searchAll ? (
                <Check className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] lg:max-w-[65%] animate-slide-up",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                    : "space-y-3"
                )}
              >
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">DocuMind AI</span>
                  </div>
                )}
                <div className={cn(msg.role === "ai" && "bg-card border rounded-2xl rounded-tl-md px-4 py-3")}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {msg.sources && msg.sources.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Search className="w-3 h-3" /> Sources
                    </p>
                    {msg.sources.map((src, i) => (
                      <div key={i} className="bg-secondary/50 border rounded-lg px-3 py-2">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {src.doc}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{src.snippet}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {msg.role === "ai" && msg.id !== "1" ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : null}

                <p
                  className={cn(
                    "text-[10px] mt-1",
                    msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {typing ? (
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-gentle" />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-gentle"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-gentle"
                    style={{ animationDelay: "0.6s" }}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 ? (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-t bg-card p-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setDocPanelOpen(!docPanelOpen)}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center gap-2 border rounded-xl bg-background px-4 py-2 focus-within:ring-2 focus-within:ring-ring">
              <input
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                placeholder="Ask about your documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <Button
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
                disabled={!input.trim() || typing}
                onClick={() => handleSend()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
