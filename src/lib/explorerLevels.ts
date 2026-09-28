/**
 * Explorer level content — each level is a self-contained concept experience.
 * Content is intentionally non-technical: zero jargon, pure interaction.
 */

export interface ExplorerStep {
  type: "story" | "interact" | "quiz";
  title: string;
  body: string;
  emoji?: string;
  interactType?: "coin_flip" | "bloch_drag" | "split_beam" | "gate_demo";
  question?: string;
  choices?: { label: string; correct: boolean; feedback: string }[];
}

export interface ExplorerLevel {
  id: string;
  zone: string;
  zoneColor: string;
  title: string;
  subtitle: string;
  emoji: string;
  xpReward: number;
  steps: ExplorerStep[];
}

export const LEVELS: Record<string, ExplorerLevel> = {

  /* ── SUPERPOSITION ISLAND ─────────────────────────────────────────────── */

  "what-is-a-qubit": {
    id: "what-is-a-qubit",
    zone: "Superposition Island",
    zoneColor: "#4f8ef7",
    title: "What is a Qubit?",
    subtitle: "The tiniest piece of quantum information",
    emoji: "🔵",
    xpReward: 30,
    steps: [
      {
        type: "story",
        emoji: "💡",
        title: "Meet the Qubit",
        body: "You know a regular computer bit — it's like a light switch. Either ON or OFF. That's it.\n\nA qubit is different. It's like a magic coin that can be heads, tails, or BOTH AT THE SAME TIME while it's spinning in the air.",
      },
      {
        type: "story",
        emoji: "🪙",
        title: "Spinning in mid-air",
        body: "While a coin is spinning, it's not heads and it's not tails. It's kind of… both!\n\nA qubit works the same way. It stays in this in-between state — called superposition — until you look at it.",
      },
      {
        type: "interact",
        title: "Flip the Quantum Coin",
        body: "Tap SPIN to put the coin in superposition. Then tap PEEK to see what it becomes!",
        interactType: "coin_flip",
      },
      {
        type: "quiz",
        title: "Quick check! ⚡",
        body: "",
        question: "A qubit that hasn't been measured yet is…",
        choices: [
          { label: "Definitely 0",          correct: false, feedback: "Not quite — it hasn't decided yet!" },
          { label: "Definitely 1",          correct: false, feedback: "Not quite — it hasn't decided yet!" },
          { label: "Both 0 and 1 at once",  correct: true,  feedback: "Yes! That's superposition! 🎉" },
          { label: "Neither 0 nor 1",       correct: false, feedback: "Close — it's actually both!" },
        ],
      },
    ],
  },

  "both-at-once": {
    id: "both-at-once",
    zone: "Superposition Island",
    zoneColor: "#4f8ef7",
    title: "Both At Once!",
    subtitle: "Superposition is quantum magic",
    emoji: "✨",
    xpReward: 30,
    steps: [
      {
        type: "story",
        emoji: "😸",
        title: "Schrödinger's Cat",
        body: "Imagine a cat in a sealed box. You don't know if the cat is asleep or awake until you open the box.\n\nBefore you look — according to quantum physics — the cat is BOTH asleep and awake at the same time!",
      },
      {
        type: "story",
        emoji: "🌊",
        title: "Waves and Particles",
        body: "Tiny particles like electrons behave like waves when no one is looking. They spread out everywhere.\n\nThe moment you measure one — SNAP — it picks one spot and becomes a particle again.",
      },
      {
        type: "interact",
        title: "Watch the Wave Collapse",
        body: "The glowing wave is a qubit in superposition. Click anywhere on it — watch it collapse!",
        interactType: "bloch_drag",
      },
      {
        type: "quiz",
        title: "You got this! 🌟",
        body: "",
        question: "What happens when you MEASURE a qubit in superposition?",
        choices: [
          { label: "It stays both 0 and 1",         correct: false, feedback: "Nope! Measuring forces it to choose." },
          { label: "It collapses to either 0 or 1", correct: true,  feedback: "Exactly right! The wave collapses! 🎊" },
          { label: "It disappears",                 correct: false, feedback: "Not quite — it just picks a value!" },
          { label: "It becomes 0.5",                correct: false, feedback: "Computers use 0 and 1, not decimals!" },
        ],
      },
    ],
  },

  "coin-flip-quantum": {
    id: "coin-flip-quantum",
    zone: "Superposition Island",
    zoneColor: "#4f8ef7",
    title: "Quantum Coin Flip",
    subtitle: "Why quantum randomness is different",
    emoji: "🎲",
    xpReward: 40,
    steps: [
      {
        type: "story",
        emoji: "🎰",
        title: "True randomness",
        body: "When you flip a normal coin, the result depends on how hard you flipped it, the air currents, the surface… it's complicated, but technically predictable.\n\nA quantum measurement is TRULY random. Not just complicated — genuinely unpredictable even in principle.",
      },
      {
        type: "story",
        emoji: "🔬",
        title: "Scientists tested this",
        body: "Physicists have run millions of quantum experiments and confirmed it: the outcomes are fundamentally random — not just random because we don't know enough.\n\nThis is what Einstein famously didn't like — he said 'God does not play dice.' But the experiments proved he was wrong!",
      },
      {
        type: "interact",
        title: "Flip 10 quantum coins",
        body: "Each time you PEEK at this qubit, the universe randomly decides 0 or 1. See how unpredictable it is!",
        interactType: "coin_flip",
      },
      {
        type: "quiz",
        title: "True or false? 🤔",
        body: "",
        question: "Quantum randomness is different from regular randomness because…",
        choices: [
          { label: "It uses a better random number generator",   correct: false, feedback: "Nope — it's not a software thing!" },
          { label: "It's fundamentally unpredictable — even in principle", correct: true, feedback: "Exactly! Physics itself is random at the quantum level. 🎊" },
          { label: "We just don't have fast enough computers to predict it", correct: false, feedback: "Einstein thought this, but experiments proved otherwise!" },
          { label: "It's the same as regular randomness",        correct: false, feedback: "Quantum randomness is genuinely different." },
        ],
      },
    ],
  },

  /* ── GATE GALAXY ─────────────────────────────────────────────────────── */

  "flip-it": {
    id: "flip-it",
    zone: "Gate Galaxy",
    zoneColor: "#f7c94f",
    title: "Flip It!",
    subtitle: "The quantum NOT gate",
    emoji: "🔄",
    xpReward: 35,
    steps: [
      {
        type: "story",
        emoji: "💡",
        title: "Quantum Gates",
        body: "Just like regular computers use logic gates (AND, OR, NOT) to process bits, quantum computers use QUANTUM GATES to process qubits.\n\nGates are operations that change the state of a qubit. The simplest one is the X gate — the quantum NOT.",
      },
      {
        type: "story",
        emoji: "🔄",
        title: "The X Gate — Quantum NOT",
        body: "The X gate flips a qubit upside down:\n• If it was |0⟩, it becomes |1⟩\n• If it was |1⟩, it becomes |0⟩\n\nIt's just like pressing NOT on your calculator, but for qubits!",
      },
      {
        type: "interact",
        title: "Apply the X Gate",
        body: "Watch what the X gate does to a qubit. Try applying it multiple times — notice anything?",
        interactType: "gate_demo",
      },
      {
        type: "quiz",
        title: "Gate check! ⚡",
        body: "",
        question: "What does the X gate do to a qubit that is |0⟩?",
        choices: [
          { label: "Keeps it as |0⟩",               correct: false, feedback: "The X gate always flips!" },
          { label: "Turns it into |1⟩",              correct: true,  feedback: "Yes! X flips 0 → 1 and 1 → 0. 🎉" },
          { label: "Puts it in superposition",        correct: false, feedback: "That's what the H gate does, not X!" },
          { label: "Makes it disappear",              correct: false, feedback: "Gates never destroy a qubit." },
        ],
      },
    ],
  },

  "hadamard-hero": {
    id: "hadamard-hero",
    zone: "Gate Galaxy",
    zoneColor: "#f7c94f",
    title: "Hadamard Hero",
    subtitle: "The gate that creates superposition",
    emoji: "⚡",
    xpReward: 45,
    steps: [
      {
        type: "story",
        emoji: "🌟",
        title: "The most important gate",
        body: "The Hadamard gate (H gate) is one of the most important in quantum computing. It does something no regular gate can do: it creates superposition from a definite state.\n\nApply it to |0⟩ and you get an equal mix of 0 and 1 — exactly 50% chance for each!",
      },
      {
        type: "story",
        emoji: "🎯",
        title: "A perfect coin flip",
        body: "The H gate is like the ultimate fair coin flip.\n\nApply it once: |0⟩ → 50/50 superposition\nApply it twice: back to |0⟩ (it undoes itself!)\n\nThis self-cancelling property is what makes quantum algorithms powerful.",
      },
      {
        type: "interact",
        title: "Use the H gate",
        body: "Spin the coin with H — then spin it again to cancel the superposition and get |0⟩ back!",
        interactType: "coin_flip",
      },
      {
        type: "quiz",
        title: "H gate mastery! 🌟",
        body: "",
        question: "What happens when you apply the H gate TWICE to |0⟩?",
        choices: [
          { label: "You get |1⟩",                                   correct: false, feedback: "Nope! H cancels itself." },
          { label: "You get back to |0⟩",                          correct: true,  feedback: "Yes! H applied twice is the same as doing nothing. 🎊" },
          { label: "You get a 50/50 superposition",                 correct: false, feedback: "That's what one H does — two Hs cancel out!" },
          { label: "The qubit explodes",                            correct: false, feedback: "Ha! Qubits don't explode — they just change state." },
        ],
      },
    ],
  },

  /* ── ENTANGLEMENT CAVE ───────────────────────────────────────────────── */

  "connected": {
    id: "connected",
    zone: "Entanglement Cave",
    zoneColor: "#c44ff7",
    title: "Connected!",
    subtitle: "Qubits that feel each other",
    emoji: "🔗",
    xpReward: 50,
    steps: [
      {
        type: "story",
        emoji: "🔗",
        title: "Quantum entanglement",
        body: "Imagine you have two magic gloves in separate boxes. You open one box and find a left glove — instantly you KNOW the other box has the right glove, no matter how far away it is!\n\nEntangled qubits work similarly. Measuring one instantly tells you something about the other.",
      },
      {
        type: "story",
        emoji: "🌌",
        title: "Spooky action at a distance",
        body: "Einstein called entanglement 'spooky action at a distance' because he couldn't believe it was real.\n\nBut experiment after experiment has confirmed it: entangled particles really do affect each other instantaneously, regardless of distance.",
      },
      {
        type: "story",
        emoji: "🔮",
        title: "Making entanglement",
        body: "To entangle two qubits in a quantum computer, you:\n1. Apply the H gate to the first qubit (superposition)\n2. Apply the CNOT gate between them\n\nNow they're linked — measuring one forces the other to a definite state too!",
      },
      {
        type: "quiz",
        title: "Entanglement check! 🔗",
        body: "",
        question: "Two entangled qubits are measured separately. The first one collapses to |1⟩. What can you say about the second one?",
        choices: [
          { label: "Nothing — they're independent",   correct: false, feedback: "That's what makes entanglement special — they ARE linked!" },
          { label: "Its state is now determined by the entanglement", correct: true, feedback: "Exactly! The correlation is instant and certain. 🎊" },
          { label: "It also becomes |1⟩ (always)",   correct: false, feedback: "The exact outcome depends on the type of entangled state." },
          { label: "It disappears",                   correct: false, feedback: "Measurement collapses state, but doesn't destroy the qubit!" },
        ],
      },
    ],
  },

};

export function getLevel(id: string): ExplorerLevel | null {
  return LEVELS[id] ?? null;
}
