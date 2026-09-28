"use client";
import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { agentApi } from "@/lib/api";
import { useAgentStore, ChatMessage } from "@/store/agentStore";
import { cn } from "@/lib/utils";
import { X, Send, Trash2, Loader2 } from "lucide-react";

const KatexMath = dynamic(() => import("@/components/KatexMath"), { ssr: false });

export default function AgentPanel() {
  const { open, messages, context, isLoading, setOpen, addMessage, setLoading, clearHistory } =
    useAgentStore();
  const [input, setInput]     = useState("");
  const bottomRef             = useRef<HTMLDivElement>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setInput("");
    addMessage({ role: "user", content: msg });
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await agentApi.chat({ message: msg, context, history });
      addMessage({
        role: "assistant",
        content: res.data.reply,
        suggestions: res.data.suggestions,
      });
    } catch {
      addMessage({
        role: "assistant",
        content:
          "Cannot reach the backend. Start it with:\n\n" +
          "`uvicorn app.main:app --reload` in `qubit-backend/`",
      });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="agent"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0,  scale: 1     }}
          exit={{ opacity: 0, y: 12,    scale: 0.98  }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed bottom-16 right-4 z-50 w-[360px] max-h-[68vh] flex flex-col bg-white rounded-lg border border-[#e4e4e7]"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3.5 h-10 border-b border-[#e4e4e7] shrink-0">
            <span className="text-sm font-semibold text-[#111118] flex-1">AI Tutor</span>
            {/* Context breadcrumb */}
            {context.lesson_title && (
              <span className="text-[11px] text-[#a1a1aa] truncate max-w-[140px]">
                {context.lesson_title}
              </span>
            )}
            <button
              onClick={clearHistory}
              title="Clear chat"
              className="p-1 rounded text-[#a1a1aa] hover:bg-[#f0f0f2] hover:text-[#111118] transition-colors"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded text-[#a1a1aa] hover:bg-[#f0f0f2] hover:text-[#111118] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Context pill — shown when on a lesson */}
          {(context.path_title || context.module_title) && (
            <div className="px-3.5 py-1.5 bg-[#f7f7ff] border-b border-[#e4e4e7] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
              <span className="text-[11px] text-[#4f46e5] truncate">
                {[context.path_title, context.module_title, context.lesson_title]
                  .filter(Boolean)
                  .join(" / ")}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 min-h-0">
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} onSuggestion={send} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-[#a1a1aa]">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-xs">Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#e4e4e7] px-3 py-2.5 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask anything quantum…"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none text-sm border border-[#d4d4d8] rounded px-2.5 py-1.5 focus:outline focus:outline-2 focus:outline-[#4f46e5] focus:outline-offset-[-1px] max-h-20 overflow-y-auto placeholder:text-[#a1a1aa] text-[#111118] bg-white"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded bg-[#4f46e5] text-white flex items-center justify-center hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={12} />
              </button>
            </div>
            <p className="text-[10px] text-[#a1a1aa] mt-1">Enter to send · Shift+Enter for newline</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────────────── */
function Bubble({ msg, onSuggestion }: { msg: ChatMessage; onSuggestion: (t: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex flex-col", isUser && "items-end")}>
      <div
        className={cn(
          "max-w-[88%] px-3 py-2 rounded text-sm leading-relaxed",
          isUser
            ? "bg-[#4f46e5] text-white"
            : "bg-[#f7f7f8] border border-[#e4e4e7] text-[#111118]"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="text-[#111118]">
            <KatexMath content={msg.content} />
          </div>
        )}
      </div>

      {/* Suggestion chips — assistant only */}
      {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[88%]">
          {msg.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-[11px] px-2 py-0.5 rounded border border-[#e4e4e7] bg-white text-[#52525b] hover:bg-[#f0f0f2] hover:text-[#111118] transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
