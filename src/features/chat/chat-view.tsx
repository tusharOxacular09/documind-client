"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Search, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/services/api";
import type { ChatMessage, DocumentItem } from "@/types/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: { doc: string; snippet: string }[];
  feedback?: "none" | "up" | "down";
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchAll, setSearchAll] = useState(false);
  const [typing, setTyping] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    setChatId(searchParams.get("chatId"));
  }, [searchParams]);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await api.listDocuments();
        setDocuments(data.documents);
        if (data.documents.length > 0) {
          setSelectedDocs((prev) => (prev.length > 0 ? prev : [data.documents[0].id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      }
    };
    void loadDocs();
  }, []);

  useEffect(() => {
    if (!chatId) {
      setMessages(initialMessages);
      return;
    }
    const loadChat = async () => {
      try {
        const data = await api.getChat(chatId);
        const mapped: Message[] = data.chat.messages.map((m: ChatMessage) => ({
          id: m.id,
          role: m.role === "assistant" ? "ai" : "user",
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: m.citations.map((c) => ({ doc: c.documentName, snippet: c.snippet })),
          feedback: m.feedback,
        }));
        setMessages(mapped.length ? mapped : initialMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
      }
    };
    void loadChat();
  }, [chatId]);

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setTyping(true);
    setError(null);
    try {
      const payload = await api.askChat({
        chatId: chatId ?? undefined,
        message: msg,
        documentIds: searchAll ? undefined : selectedDocs,
      });
      const userMsg: Message = {
        id: payload.userMessage.id,
        role: "user",
        content: payload.userMessage.content,
        timestamp: new Date(payload.userMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const aiMsg: Message = {
        id: payload.assistantMessage.id,
        role: "ai",
        content: payload.assistantMessage.content,
        timestamp: new Date(payload.assistantMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: payload.assistantMessage.citations.map((c) => ({ doc: c.documentName, snippet: c.snippet })),
        feedback: payload.assistantMessage.feedback,
      };
      setMessages((prev) => {
        const base = prev.length === 1 && prev[0].id === "1" ? [] : prev;
        return [...base, userMsg, aiMsg];
      });

      if (!chatId) {
        setChatId(payload.chat.id);
        router.replace(`/chat?chatId=${payload.chat.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setTyping(false);
    }
  };

  const handleFeedback = async (messageId: string, nextFeedback: "up" | "down") => {
    if (!chatId) return;
    const current = messages.find((m) => m.id === messageId)?.feedback ?? "none";
    const feedbackToSend = current === nextFeedback ? "none" : nextFeedback;
    try {
      await api.setMessageFeedback(chatId, messageId, feedbackToSend);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackToSend } : msg))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feedback");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Document selector panel */}
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
          {documents.map((doc) => (
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

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Chat error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {/* Messages */}
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

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
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
                )}

                {/* Feedback */}
                {msg.role === "ai" && msg.id !== "1" && (
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      variant={msg.feedback === "up" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => void handleFeedback(msg.id, "up")}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={msg.feedback === "down" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => void handleFeedback(msg.id, "down")}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

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

          {/* Typing indicator */}
          {typing && (
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
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested queries */}
        {messages.length <= 1 && (
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
        )}

        {/* Input */}
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
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void handleSend()}
              />
              <Button
                size="icon"
                className="h-8 w-8 rounded-lg shrink-0"
                disabled={!input.trim() || typing}
                onClick={() => void handleSend()}
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
