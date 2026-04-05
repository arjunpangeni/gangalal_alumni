"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { NETWORK_NAME } from "@/lib/brand";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 z-50 w-[min(380px,calc(100vw-2rem))] md:bottom-6"
          >
            <div className="flex flex-col rounded-2xl border shadow-2xl bg-background overflow-hidden max-h-[70vh]">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 gradient-primary text-white">
                <Bot className="size-6" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{NETWORK_NAME} Assistant</p>
                  <p className="text-xs opacity-80">
                    {session?.user ? "Full access enabled" : "Basic questions only"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="size-7 text-white hover:bg-white/20"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-48">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <Bot className="size-10 mx-auto mb-3 opacity-30" />
                    <p>
                      Hi! Ask about articles, events, jobs, notices, or search members by profession, city, or batch year.
                      Sign in as an approved member for richer answers including profiles.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {msg.role === "assistant" && (
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-violet-600 text-white text-xs">AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
                        msg.role === "user"
                          ? "gradient-primary text-white rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2">
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-violet-600 text-white text-xs">AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask something..."
                  rows={1}
                  className="resize-none text-sm min-h-[36px] max-h-24 overflow-y-auto"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="shrink-0 gradient-primary text-white border-0"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 z-50 md:bottom-6 flex size-14 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-violet-500/30 md:right-6"
        aria-label="Open AI chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="size-6" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="size-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
