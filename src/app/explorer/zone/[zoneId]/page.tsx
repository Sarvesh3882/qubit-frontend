"use client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useExplorerProgressStore } from "@/store/explorerProgressStore";
import { useExperienceStore } from "@/store/experienceStore";
import { ArrowLeft, Star, Lock, BookOpen, Beaker, Brain, Gamepad2, Layers } from "lucide-react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────────────────────
   ZONE & LEVEL DATA
───────────────────────────────────────────────────────────────────────────── */

const ZONES = {
  superposition: {
    id: "superposition",
    name: "Superposition Island",
    emoji: "🌊",
    color: "#4f8ef7",
    glow: "#4f8ef740",
    description: "Discover what it means for a qubit to be in multiple states simultaneously. Build your quantum intuition!",
    illustration: "/illustrations/studentquantumcomputing.svg",
    levels: [
      {
        id: "what-is-a-qubit",
        title: "What is a Qubit?",
        description: "Meet your first quantum bit",
        xpReward: 50,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "both-at-once",
        title: "Both At Once!",
        description: "Experience superposition firsthand",
        xpReward: 75,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "coin-flip-quantum",
        title: "Quantum Coin Flip",
        description: "Compare classical and quantum randomness",
        xpReward: 100,
        activities: { learn: true, experiment: true, quiz: true, game: true },
      },
    ],
  },
  gates: {
    id: "gates",
    name: "Gate Galaxy",
    emoji: "⚡",
    color: "#f7c94f",
    glow: "#f7c94f40",
    description: "Master quantum gates — the operations that transform qubits and build quantum algorithms.",
    illustration: "/illustrations/composer.svg",
    levels: [
      {
        id: "flip-it",
        title: "Flip It!",
        description: "The X gate and bit flips",
        xpReward: 60,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "spin-it",
        title: "Spin It!",
        description: "Rotate qubits on the Bloch sphere",
        xpReward: 80,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "hadamard-hero",
        title: "Hadamard Hero",
        description: "Create superposition with H gates",
        xpReward: 120,
        activities: { learn: true, experiment: true, quiz: true, game: true },
      },
    ],
  },
  entanglement: {
    id: "entanglement",
    name: "Entanglement Cave",
    emoji: "🔗",
    color: "#c44ff7",
    glow: "#c44ff740",
    description: "Connect qubits in ways that defy classical physics. Explore spooky action at a distance!",
    illustration: "/illustrations/personlearning quantum computing.svg",
    levels: [
      {
        id: "connected",
        title: "Connected!",
        description: "Create your first entangled pair",
        xpReward: 100,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "bell-state",
        title: "The Bell State",
        description: "Maximum entanglement achieved",
        xpReward: 150,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "spooky-action",
        title: "Spooky Action",
        description: "Measure and observe correlations",
        xpReward: 200,
        activities: { learn: true, experiment: true, quiz: true, game: true },
      },
    ],
  },
  measurement: {
    id: "measurement",
    name: "Measurement Mountain",
    emoji: "🔭",
    color: "#4ff7a4",
    glow: "#4ff7a440",
    description: "Observe quantum states and watch the wave function collapse. Understand the Born rule!",
    illustration: "/illustrations/hand-drawn-flat-design-quantum-illustration_23-2149261563.svg",
    levels: [
      {
        id: "peek-a-qubit",
        title: "Peek a Qubit!",
        description: "Your first quantum measurement",
        xpReward: 90,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "wave-collapse",
        title: "Wave Collapse",
        description: "See superposition vanish",
        xpReward: 120,
        activities: { learn: true, experiment: true, quiz: true },
      },
      {
        id: "born-rule",
        title: "The Born Rule",
        description: "Predict measurement probabilities",
        xpReward: 180,
        activities: { learn: true, experiment: true, quiz: true, game: true },
      },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface LevelCardProps {
  level: (typeof ZONES)["superposition"]["levels"][0];
  zoneColor: string;
  zoneGlow: string;
  isUnlocked: boolean;
  stars: number;
  isComplete: boolean;
}

function LevelCard({ level, zoneColor, zoneGlow, isUnlocked, stars, isComplete }: LevelCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isUnlocked) {
      router.push(`/explorer/level/${level.id}`);
    }
  };

  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.02, y: -4 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      onClick={handleClick}
      className="relative rounded-2xl p-5 transition-all duration-300 cursor-pointer"
      style={{
        background: isUnlocked ? `${zoneColor}10` : "#110d2e",
        border: isUnlocked ? `2px solid ${zoneColor}40` : "2px solid #2d2a45",
        boxShadow: isUnlocked ? `0 4px 16px ${zoneGlow}` : "none",
        opacity: isUnlocked ? 1 : 0.6,
      }}
    >
      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <Lock size={24} className="text-[#484f68]" />
            <span className="text-xs text-[#7d8590] font-semibold">Complete previous level</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-white mb-1">{level.title}</h3>
          <p className="text-xs text-[#9ca3b8] leading-relaxed">{level.description}</p>
        </div>

        {/* Stars */}
        {isUnlocked && (
          <div className="flex gap-1 ml-3">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                size={14}
                fill={i < stars ? zoneColor : "transparent"}
                stroke={i < stars ? zoneColor : "#2d2a45"}
                strokeWidth={1.5}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="flex items-center gap-2 flex-wrap">
        {level.activities.learn && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1730]">
            <BookOpen size={12} className="text-[#7fb3ff]" />
            <span className="text-[10px] font-semibold text-[#7fb3ff]">Learn</span>
          </div>
        )}
        {level.activities.experiment && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1730]">
            <Beaker size={12} className="text-[#c44ff7]" />
            <span className="text-[10px] font-semibold text-[#c44ff7]">Experiment</span>
          </div>
        )}
        {level.activities.quiz && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1730]">
            <Brain size={12} className="text-[#f7c94f]" />
            <span className="text-[10px] font-semibold text-[#f7c94f]">Quiz</span>
          </div>
        )}
        {level.activities.game && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1730]">
            <Gamepad2 size={12} className="text-[#4ff7a4]" />
            <span className="text-[10px] font-semibold text-[#4ff7a4]">Game</span>
          </div>
        )}
      </div>

      {/* XP reward */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star size={12} fill={zoneColor} stroke={zoneColor} />
          <span className="text-xs font-bold" style={{ color: zoneColor }}>
            +{level.xpReward} XP
          </span>
        </div>
        {isComplete && (
          <span className="text-[10px] font-bold text-[#4ff7a4]">✓ Complete</span>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ZONE PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function ZonePage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();
  const { setExperience } = useExperienceStore();
  const { isLevelComplete, getLevelStars } = useExplorerProgressStore();

  const zone = ZONES[zoneId as keyof typeof ZONES];

  if (!zone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0520" }}>
        <div className="text-center text-white">
          <p className="text-4xl mb-3">🚧</p>
          <p className="text-lg font-bold">Zone not found</p>
          <button
            onClick={() => router.push("/explorer")}
            className="mt-4 text-sm text-[#7fb3ff] hover:underline"
          >
            ← Back to World Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `radial-gradient(ellipse at top, ${zone.color}20 0%, #0a0520 50%, #0a0520 100%)`,
      }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a173080]">
        <button
          onClick={() => router.push("/explorer")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: "#7d8590" }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{zone.emoji}</span>
          <div>
            <h1 className="text-base font-black text-white">{zone.name}</h1>
            <p className="text-[10px] text-[#7d8590] font-medium">{zone.levels.length} levels</p>
          </div>
        </div>

        {/* Back to Learner Dashboard */}
        <button
          onClick={() => { setExperience("learner"); router.push("/codebook"); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
          style={{ color: "#9ca3af", border: "1px solid #2a2a3a" }}
          title="Return to Learner Dashboard"
        >
          <Layers size={13} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>

      {/* ── Zone Header ───────────────────────────────────────────────────── */}
      <div className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-8">
            {/* Illustration */}
            <div className="w-48 h-48 shrink-0 relative">
              <img
                src={zone.illustration}
                alt={zone.name}
                className="w-full h-full object-contain"
                style={{
                  filter: `drop-shadow(0 8px 24px ${zone.glow})`,
                }}
              />
            </div>
            
            {/* Description */}
            <div className="flex-1">
              <p className="text-base text-white/90 leading-relaxed">{zone.description}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Level List ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {zone.levels.map((level, idx) => {
            const isComplete = isLevelComplete(level.id);
            const stars = getLevelStars(level.id);
            const isUnlocked = idx === 0 || isLevelComplete(zone.levels[idx - 1].id);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <LevelCard
                  level={level}
                  zoneColor={zone.color}
                  zoneGlow={zone.glow}
                  isUnlocked={isUnlocked}
                  stars={stars}
                  isComplete={isComplete}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
