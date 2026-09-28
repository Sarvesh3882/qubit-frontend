"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useExplorerProgressStore } from "@/store/explorerProgressStore";
import {
  ArrowLeftIcon,
  LockClosedIcon,
  StarIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import {
  MapIcon,
  BeakerIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────────────────────────────────────
   QUANTUM GAMES - Virtual Lab Style (Quantum Flytrap Grid)
───────────────────────────────────────────────────────────────────────────── */

interface GameLevel {
  id: number;
  title: string;
  description: string;
  stars: number;
  unlocked: boolean;
  section: string;
}

const GAME_SECTIONS = [
  {
    id: "superposition",
    title: "Superposition Games",
    emoji: "🌊",
    color: "#4f8ef7",
    levels: [
      { id: 1, title: "Coin Flip Challenge", description: "Master quantum randomness", stars: 0, unlocked: true,  section: "superposition" },
      { id: 2, title: "Both At Once",         description: "Create superposition states", stars: 0, unlocked: true,  section: "superposition" },
      { id: 3, title: "Wave Rider",           description: "Navigate quantum waves",      stars: 0, unlocked: true,  section: "superposition" },
      { id: 4, title: "Quantum Maze",         description: "Find all paths at once",      stars: 0, unlocked: false, section: "superposition" },
    ],
  },
  {
    id: "gates",
    title: "Gate Games",
    emoji: "⚡",
    color: "#f7c94f",
    levels: [
      { id: 5, title: "Flip Master",    description: "Apply X gates correctly",        stars: 0, unlocked: true,  section: "gates" },
      { id: 6, title: "Hadamard Hero",  description: "Create perfect superposition",   stars: 0, unlocked: true,  section: "gates" },
      { id: 7, title: "Gate Race",      description: "Speed challenge with gates",     stars: 0, unlocked: false, section: "gates" },
      { id: 8, title: "Circuit Builder",description: "Design your own circuits",       stars: 0, unlocked: false, section: "gates" },
    ],
  },
  {
    id: "entanglement",
    title: "Entanglement Games",
    emoji: "🔗",
    color: "#c44ff7",
    levels: [
      { id: 9,  title: "Link Up",            description: "Create entangled pairs",       stars: 0, unlocked: false, section: "entanglement" },
      { id: 10, title: "Bell State Builder", description: "Master Bell states",           stars: 0, unlocked: false, section: "entanglement" },
      { id: 11, title: "Spooky Action",      description: "Test quantum correlations",    stars: 0, unlocked: false, section: "entanglement" },
      { id: 12, title: "Teleportation",      description: "Quantum teleportation puzzle", stars: 0, unlocked: false, section: "entanglement" },
    ],
  },
  {
    id: "measurement",
    title: "Measurement Games",
    emoji: "🔭",
    color: "#4ff7a4",
    levels: [
      { id: 13, title: "Peek-a-Qubit",        description: "Predict outcomes",         stars: 0, unlocked: false, section: "measurement" },
      { id: 14, title: "Wave Collapse",        description: "Time your measurements",   stars: 0, unlocked: false, section: "measurement" },
      { id: 15, title: "Probability Master",   description: "Calculate probabilities",  stars: 0, unlocked: false, section: "measurement" },
      { id: 16, title: "Born Rule Challenge",  description: "Master the Born rule",     stars: 0, unlocked: false, section: "measurement" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   GAME LEVEL CARD
───────────────────────────────────────────────────────────────────────────── */

interface GameCardProps {
  level: GameLevel;
  color: string;
  onClick: () => void;
}

function GameCard({ level, color, onClick }: GameCardProps) {
  return (
    <motion.button
      whileHover={level.unlocked ? { scale: 1.03, y: -4 } : {}}
      whileTap={level.unlocked ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={!level.unlocked}
      className="relative w-full rounded-2xl text-left transition-all group overflow-hidden"
      style={{
        background: level.unlocked
          ? `linear-gradient(145deg, ${color}18 0%, ${color}08 100%)`
          : "#0d0b1e",
        border: level.unlocked ? `1.5px solid ${color}50` : "1.5px solid #2a1f4e",
        boxShadow: level.unlocked ? `0 4px 24px ${color}30` : "none",
        minHeight: "180px",
      }}
    >
      {/* Subtle dot grid background */}
      {level.unlocked && (
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
            backgroundSize: "18px 18px",
          }}
        />
      )}

      {/* Lock overlay */}
      {!level.unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[2px] z-10 gap-2">
          <LockClosedIcon className="w-8 h-8 text-[#3a3560]" />
          <span className="text-[10px] text-[#4a4570] font-bold uppercase tracking-widest">Locked</span>
        </div>
      )}

      <div className="relative z-10 p-5 flex flex-col gap-3 h-full">
        {/* Top row: number badge + stars */}
        <div className="flex items-center justify-between">
          {/* Number badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md"
            style={{
              background: level.unlocked ? color : "#2d1b5e",
            }}
          >
            {level.id}
          </div>

          {/* Stars (if earned) */}
          {level.unlocked && (
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <StarIcon
                  key={i}
                  className="w-3.5 h-3.5"
                  style={{ color: i < level.stars ? "#f7c94f" : "#2d2060" }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title & description */}
        <div className="flex-1">
          <h4
            className="text-sm font-black text-white mb-1.5 leading-tight"
            style={{ opacity: level.unlocked ? 1 : 0.3 }}
          >
            {level.title}
          </h4>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: level.unlocked ? "#9ca3b8" : "#3a3560" }}
          >
            {level.description}
          </p>
        </div>

        {/* Play button row */}
        {level.unlocked && (
          <div className="flex items-center gap-2 pt-1">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100"
              style={{ background: `${color}25`, color }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN GAMES PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function GamesPage() {
  const router = useRouter();

  const handleLevelClick = (level: GameLevel) => {
    if (level.unlocked) {
      router.push("/explorer/level/what-is-a-qubit");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1a0b3e" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: "#0f0628", borderBottom: "1px solid #2d1b5e" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/explorer")}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: "#9ca3b8" }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Virtual Lab</h1>
            <p className="text-xs text-[#7d8590]">Interactive quantum games & challenges</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "#1a173060" }}>
          <TrophyIcon className="w-5 h-5 text-[#f7c94f]" />
          <span className="text-sm font-bold text-white">16 Games</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
        {/* Hero illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-5xl mx-auto mb-12 relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #4f8ef720 0%, #f7c94f20 100%)",
            border: "2px solid #4f8ef740",
            boxShadow: "0 20px 60px rgba(79, 142, 247, 0.3)",
          }}
        >
          <div className="flex items-center gap-8 p-8">
            {/* Left: Image */}
            <div className="w-64 h-64 shrink-0 relative rounded-2xl overflow-hidden">
              <img
                src="/illustrations/curiouskidjpg.jpg"
                alt="Quantum Games"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right: Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-8 h-8 text-[#f7c94f]" />
                <h2 className="text-3xl font-black text-white">
                  Test Your Quantum Skills
                </h2>
              </div>
              <p className="text-lg text-white/90 leading-relaxed mb-6">
                Challenge yourself with interactive games designed to test and sharpen your quantum computing knowledge. 
                From simple coin flips to complex circuit building!
              </p>
              <div className="flex gap-3">
                <div className="px-4 py-2 rounded-xl" style={{ background: "#1a173060" }}>
                  <div className="text-xs text-[#9ca3b8]">Available</div>
                  <div className="text-xl font-black text-white">16 Games</div>
                </div>
                <div className="px-4 py-2 rounded-xl" style={{ background: "#1a173060" }}>
                  <div className="text-xs text-[#9ca3b8]">Categories</div>
                  <div className="text-xl font-black text-white">4 Zones</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-12">
          {GAME_SECTIONS.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: `${section.color}25`, border: `2px solid ${section.color}60` }}
                >
                  {section.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white">{section.title}</h3>
                  <p className="text-xs text-[#7d8590]">{section.levels.filter(l => l.unlocked).length}/{section.levels.length} unlocked</p>
                </div>
              </div>

              {/* Grid of level cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {section.levels.map((level, idx) => (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: sectionIdx * 0.1 + idx * 0.05 }}
                  >
                    <GameCard level={level} color={section.color} onClick={() => handleLevelClick(level)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Bottom message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl p-6 text-center"
            style={{ background: "#0f0628", border: "1px solid #2d1b5e" }}
          >
            <p className="text-sm text-[#9ca3b8] leading-relaxed">
              💡 <span className="font-semibold text-white">Tip:</span> Complete levels in the Explorer to unlock more
              games!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-6 py-5"
        style={{
          background: "#0f0628",
          borderTop: "1px solid #2d1b5e",
        }}
      >
        {[
          { href: "/explorer", icon: MapIcon, label: "Map", active: false, color: "#4f8ef7" },
          { href: "/explorer/lab", icon: BeakerIcon, label: "Composer", active: false, color: "#c44ff7" },
          { href: "/explorer/games", icon: RocketLaunchIcon, label: "Games", active: true, color: "#f7c94f" },
          { href: "/explorer/journey", icon: TrophyIcon, label: "Progress", active: false, color: "#4ff7a4" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: item.active ? `${item.color}15` : "transparent",
                    border: item.active ? `1.5px solid ${item.color}60` : "1.5px solid transparent",
                    boxShadow: item.active ? `0 4px 20px ${item.color}30` : "none",
                  }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ 
                      color: item.active ? item.color : "#484f68",
                      strokeWidth: item.active ? 2.5 : 2 
                    }} 
                  />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: item.active ? item.color : "#484f68" }}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
