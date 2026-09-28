import { create } from "zustand";

export interface AgentContext {
  path_id?: string;
  path_title?: string;
  module_id?: string;
  module_title?: string;
  lesson_id?: string;
  lesson_title?: string;
  current_code?: string;
  simulation_result?: Record<string, unknown>;
  completed_lessons?: string[];
  current_concept?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AgentState {
  open: boolean;
  context: AgentContext;
  messages: ChatMessage[];
  isLoading: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  setContext: (ctx: Partial<AgentContext>) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLoading: (v: boolean) => void;
  clearHistory: () => void;
}

let msgCounter = 0;

export const useAgentStore = create<AgentState>((set) => ({
  open: false,
  context: {},
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm QUBIT's AI assistant. I know where you are in the platform and can help with:\n\n" +
        "- **Concept explanations** — ask me anything about qubits, gates, algorithms\n" +
        "- **Code help** — paste your code and I'll guide you\n" +
        "- **Result interpretation** — I can explain simulation outputs\n" +
        "- **Next steps** — personalized learning recommendations\n\n" +
        "What would you like to explore?",
      timestamp: new Date(),
      suggestions: [
        "What is superposition?",
        "Explain the Hadamard gate",
        "How does Grover's algorithm work?",
        "What is the Bloch sphere?",
      ],
    },
  ],
  isLoading: false,

  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
  setContext: (ctx) => set((s) => ({ context: { ...s.context, ...ctx } })),
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: `msg-${++msgCounter}`, timestamp: new Date() },
      ],
    })),
  setLoading: (v) => set({ isLoading: v }),
  clearHistory: () =>
    set((s) => ({
      messages: [s.messages[0]], // keep welcome
    })),
}));
