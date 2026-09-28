"use client";
import { useAgentStore } from "@/store/agentStore";
import { MessageSquare, X } from "lucide-react";

/**
 * Minimal floating toggle button — no gradients, no glow.
 * Bottom-right corner, always visible.
 */
export default function AgentButton() {
  const { open, toggle, isLoading } = useAgentStore();

  return (
    <button
      onClick={toggle}
      aria-label={open ? "Close AI tutor" : "Open AI tutor"}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-lg bg-[#4f46e5] text-white flex items-center justify-center hover:bg-[#4338ca] active:bg-[#3730a3] transition-colors"
      style={{ boxShadow: "0 2px 8px rgba(79,70,229,0.35)" }}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : open ? (
        <X size={16} />
      ) : (
        <MessageSquare size={16} />
      )}
    </button>
  );
}
