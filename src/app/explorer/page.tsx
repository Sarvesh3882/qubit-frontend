"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useExperienceStore } from "@/store/experienceStore";
import { useExplorerProgressStore } from "@/store/explorerProgressStore";
import {
  Volume2, VolumeX, Layers
} from "lucide-react";
import {
  StarIcon,
  TrophyIcon,
  BoltIcon,
  FireIcon,
  SparklesIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import {
  MapIcon,
  BeakerIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────────────────────────────────────
   ZONE DATA — Each zone contains multiple levels
───────────────────────────────────────────────────────────────────────────── */

const ZONES = [
  {
    id: "superposition",
    name: "Superposition Island",
    tagline: "Discover the power of being in two states at once",
    emoji: "🌊",
    illustration: "/illustrations/studentquantumcomputing.svg",
    color: "#4f8ef7",
    glow: "#4f8ef740",
    x: 20, y: 30,
    levelIds: ["what-is-a-qubit", "both-at-once", "coin-flip-quantum"],
  },
  {
    id: "gates",
    name: "Gate Galaxy",
    tagline: "Master the building blocks of quantum circuits",
    emoji: "⚡",
    illustration: "/illustrations/composer.svg",
    color: "#f7c94f",
    glow: "#f7c94f40",
    x: 50, y: 20,
    levelIds: ["flip-it", "spin-it", "hadamard-hero"],
  },
  {
    id: "entanglement",
    name: "Entanglement Cave",
    tagline: "Connect qubits in mysterious ways",
    emoji: "🔗",
    illustration: "/illustrations/personlearning quantum computing.svg",
    color: "#c44ff7",
    glow: "#c44ff740",
    x: 70, y: 45,
    levelIds: ["connected", "bell-state", "spooky-action"],
  },
  {
    id: "measurement",
    name: "Measurement Mountain",
    tagline: "Observe quantum states and reveal their secrets",
    emoji: "🔭",
    illustration: "/illustrations/hand-drawn-flat-design-quantum-illustration_23-2149261563.svg",
    color: "#4ff7a4",
    glow: "#4ff7a440",
    x: 35, y: 65,
    levelIds: ["peek-a-qubit", "wave-collapse", "born-rule"],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED BACKGROUND
───────────────────────────────────────────────────────────────────────────── */

function StarField() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; dur: number; delay: number }>>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        dur: Math.random() * 3 + 2,
        delay: Math.random() * 4,
      }))
    );
    setMounted(true);
  }, []);

  if (!mounted) return <div className="absolute inset-0" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ZONE NODE — Large, illustration-based zone cards
───────────────────────────────────────────────────────────────────────────── */

interface ZoneNodeProps {
  zone: typeof ZONES[0];
  idx: number;
  isUnlocked: boolean;
  completion: { completed: number; total: number };
}

function ZoneNode({ zone, idx, isUnlocked, completion }: ZoneNodeProps) {
  const [hovered, setHovered] = useState(false);
  const progress = completion.total > 0 ? (completion.completed / completion.total) * 100 : 0;
  const isComplete = progress === 100;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
    >
      <Link href={isUnlocked ? `/explorer/zone/${zone.id}` : "#"}>
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={isUnlocked ? { scale: 1.05, y: -8 } : {}}
          whileTap={isUnlocked ? { scale: 0.98 } : {}}
          animate={
            isUnlocked && !hovered
              ? {
                  y: [0, -6, 0],
                }
              : {}
          }
          transition={
            isUnlocked && !hovered
              ? {
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.3,
                  },
                }
              : {}
          }
          className="relative cursor-pointer"
          style={{
            filter: isUnlocked ? "none" : "grayscale(80%)",
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          {/* Card Container */}
          <div
            className="relative w-44 h-56 rounded-3xl p-4 flex flex-col items-center justify-between transition-all duration-300"
            style={{
              background: isUnlocked
                ? `linear-gradient(135deg, ${zone.color}18 0%, ${zone.color}08 100%)`
                : "linear-gradient(135deg, #1a1730 0%, #0f0d1f 100%)",
              border: isUnlocked ? `2px solid ${zone.color}60` : "2px solid #2d2a45",
              boxShadow: hovered && isUnlocked
                ? `0 12px 48px ${zone.glow}, 0 0 0 1px ${zone.color}60`
                : isUnlocked
                ? `0 8px 24px ${zone.glow}`
                : "none",
            }}
          >
            {/* Lock overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-2">
                  <LockClosedIcon className="w-7 h-7 text-[#484f68]" />
                  <span className="text-xs text-[#7d8590] font-semibold">Locked</span>
                </div>
              </div>
            )}

            {/* Illustration with completion glow */}
            <div className="w-full h-32 mb-2 relative overflow-hidden rounded-2xl">
              <motion.img
                src={zone.illustration}
                alt={zone.name}
                className="w-full h-full object-contain"
                animate={
                  isComplete
                    ? {
                        filter: [
                          `drop-shadow(0 0 10px ${zone.color})`,
                          `drop-shadow(0 0 20px ${zone.color})`,
                          `drop-shadow(0 0 10px ${zone.color})`,
                        ],
                      }
                    : {}
                }
                transition={
                  isComplete
                    ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : {}
                }
              />
            </div>

            {/* Zone name */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center px-2">
              <div className="text-2xl mb-1">{zone.emoji}</div>
              <h3 className="text-sm font-black text-white leading-tight">{zone.name}</h3>
              {isComplete && (
                <div className="flex items-center gap-1 text-xs" style={{ color: zone.color }}>
                  <TrophyIcon className="w-3 h-3" />
                  <span className="font-bold">Complete!</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {isUnlocked && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#7d8590] font-medium">
                    {completion.completed}/{completion.total} levels
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: zone.color }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1a1730] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: zone.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.15 + 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hovered && isUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-48 px-4 py-3 rounded-2xl backdrop-blur-xl z-20 text-center"
                style={{
                  background: `linear-gradient(135deg, #1a1730ee 0%, #0f0d1fee 100%)`,
                  border: `1px solid ${zone.color}80`,
                  boxShadow: `0 8px 32px ${zone.glow}`,
                }}
              >
                <p className="text-xs text-[#9ca3b8] leading-relaxed">{zone.tagline}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPLORER HUB
───────────────────────────────────────────────────────────────────────────── */

export default function ExplorerHub() {
  const router = useRouter();
  const { setExperience } = useExperienceStore();
  const {
    xp,
    getLevel,
    getLevelProgress,
    getXpInCurrentLevel,
    getXpForNextLevel,
    getTotalStars,
    getZoneCompletion,
    isZoneUnlocked,
    streak,
  } = useExplorerProgressStore();

  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const level = getLevel();
  const levelProgress = getLevelProgress();
  const xpInLevel = getXpInCurrentLevel();
  const xpNeeded = getXpForNextLevel();
  const totalStars = getTotalStars();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center" style={{ background: "radial-gradient(ellipse at top, #1a1060 0%, #0a0520 50%, #0a0520 100%)" }}>
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{
        background: "radial-gradient(ellipse at top, #1a1060 0%, #0a0520 50%, #0a0520 100%)",
      }}
    >
      <StarField />

      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl"
          style={{ background: "#4f8ef7", top: "10%", left: "10%" }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl"
          style={{ background: "#c44ff7", top: "40%", right: "15%" }}
        />
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl"
          style={{ background: "#4ff7a4", bottom: "20%", left: "40%" }}
        />
      </div>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-[#1a173080]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image src="/illustrations/QUBIT_icon.svg" alt="QUBIT" width={40} height={40} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-tight font-orbitron">QUBIT</span>
            <span className="text-[9px] text-[#7d8590] font-semibold uppercase tracking-wider">Explorer</span>
          </div>
        </div>

        {/* Level & XP */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Streak */}
          {streak.current > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1730]">
              <FireIcon className="w-4 h-4 text-[#ff6b35]" />
              <span className="text-xs font-bold text-white">{streak.current}</span>
            </div>
          )}

          {/* Level badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1730]">
            <StarIcon className="w-4 h-4 text-[#f7c94f]" />
            <span className="text-xs font-bold text-white">Level {level}</span>
          </div>

          {/* XP bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#7d8590] font-medium">{xpInLevel} / {xpNeeded} XP</span>
            </div>
            <div className="w-32 h-2 rounded-full bg-[#1a1730] overflow-hidden relative">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: "linear-gradient(90deg, #4f8ef7, #c44ff7)" }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: "#7d8590" }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => {
              setExperience("learner");
              router.push("/codebook");
            }}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl transition-all hover:bg-white/5 text-xs font-medium"
            style={{ color: "#9ca3af", border: "1px solid #2a2a3a" }}
            title="Switch to Learner Dashboard"
          >
            <Layers size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── Hero Banner with Curious Kid as Background ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 mx-6 mt-6 mb-4 rounded-3xl overflow-hidden"
        style={{
          minHeight: "400px",
          border: "2px solid #4f8ef760",
          boxShadow: "0 20px 60px rgba(79, 142, 247, 0.4)",
        }}
      >
        {/* Full Banner Background Image */}
        <div className="absolute inset-0">
          <img
            src="/illustrations/curiouskidjpg.jpg"
            alt="Quantum Explorer"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div 
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(15, 6, 40, 0.85) 0%, rgba(26, 11, 62, 0.75) 50%, rgba(79, 142, 247, 0.3) 100%)",
            }}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-center items-start h-full p-8 lg:p-12 min-h-[400px]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl space-y-6"
          >
            {/* Title with Icon */}
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <SparklesIcon className="w-10 h-10 text-[#f7c94f]" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl">
                Welcome, Quantum Explorer!
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed font-medium drop-shadow-lg">
              Embark on an adventure through the quantum realm. Explore zones, complete challenges, 
              and unlock the mysteries of quantum computing — one level at a time!
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 pt-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl"
                style={{ 
                  background: "rgba(26, 11, 62, 0.8)",
                  border: "2px solid rgba(247, 201, 79, 0.5)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
              >
                <StarIcon className="w-6 h-6 text-[#f7c94f]" />
                <div>
                  <div className="text-xs text-[#9ca3b8] uppercase tracking-wider">Level</div>
                  <div className="text-2xl font-black text-white">{level}</div>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl"
                style={{ 
                  background: "rgba(26, 11, 62, 0.8)",
                  border: "2px solid rgba(79, 142, 247, 0.5)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
              >
                <BoltIcon className="w-6 h-6 text-[#4f8ef7]" />
                <div>
                  <div className="text-xs text-[#9ca3b8] uppercase tracking-wider">Total XP</div>
                  <div className="text-2xl font-black text-white">{xp}</div>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl"
                style={{ 
                  background: "rgba(26, 11, 62, 0.8)",
                  border: "2px solid rgba(79, 247, 164, 0.5)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                }}
              >
                <TrophyIcon className="w-6 h-6 text-[#4ff7a4]" />
                <div>
                  <div className="text-xs text-[#9ca3b8] uppercase tracking-wider">Stars</div>
                  <div className="text-2xl font-black text-white">{totalStars}</div>
                </div>
              </motion.div>
              
              {streak.current > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl"
                  style={{ 
                    background: "rgba(26, 11, 62, 0.8)",
                    border: "2px solid rgba(255, 107, 53, 0.5)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <FireIcon className="w-6 h-6 text-[#ff6b35]" />
                  <div>
                    <div className="text-xs text-[#9ca3b8] uppercase tracking-wider">Streak</div>
                    <div className="text-2xl font-black text-white">{streak.current} days</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          className="absolute top-8 right-12 text-7xl opacity-30 pointer-events-none"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ⚛️
        </motion.div>
        <motion.div
          className="absolute bottom-12 right-1/4 text-5xl opacity-25 pointer-events-none"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          🚀
        </motion.div>
      </motion.div>

      {/* ── Welcome Section ───────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-8 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-xl md:text-2xl font-black text-white mb-3">Choose Your Zone</h3>
          <p className="text-sm text-[#9ca3b8] leading-relaxed max-w-md mx-auto">
            Explore zones, complete levels, and unlock the mysteries of quantum computing one step at a time.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a173080]">
              <TrophyIcon className="w-4 h-4 text-[#f7c94f]" />
              <span className="text-xs font-bold text-white">{totalStars} Stars</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a173080]">
              <SparklesIcon className="w-4 h-4 text-[#c44ff7]" />
              <span className="text-xs font-bold text-white">{xp} Total XP</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── World Map ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 z-10 px-4 pb-32">
        <div className="relative w-full h-full min-h-[540px] max-w-5xl mx-auto">
          {/* Connection paths */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {[
              [ZONES[0], ZONES[1]],
              [ZONES[1], ZONES[2]],
              [ZONES[0], ZONES[3]],
            ].map(([a, b], i) => (
              <motion.line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2d2a55"
                strokeWidth="0.3"
                strokeDasharray="1 1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.5, delay: i * 0.2 + 0.5 }}
              />
            ))}
          </svg>

          {/* Zone nodes */}
          {ZONES.map((zone, i) => (
            <ZoneNode
              key={zone.id}
              zone={zone}
              idx={i}
              isUnlocked={isZoneUnlocked(zone.id)}
              completion={getZoneCompletion(zone.levelIds)}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-6 py-5 backdrop-blur-xl"
        style={{
          background: "linear-gradient(180deg, transparent 0%, #080318ee 25%, #080318 100%)",
          borderTop: "1px solid #1a173080",
        }}
      >
        {[
          { href: "/explorer",         icon: MapIcon,          label: "Map",      active: true,  color: "#4f8ef7", isExit: false },
          { href: "/explorer/lab",     icon: BeakerIcon,       label: "Composer", active: false, color: "#c44ff7", isExit: false },
          { href: "/explorer/games",   icon: RocketLaunchIcon, label: "Games",    active: false, color: "#f7c94f", isExit: false },
          { href: "/explorer/journey", icon: TrophyIcon,       label: "Progress", active: false, color: "#4ff7a4", isExit: false },
          { href: "/codebook",         icon: Layers,           label: "Dashboard",active: false, color: "#9ca3af", isExit: true  },
        ].map((item) => {
          const Icon = item.icon;
          if (item.isExit) {
            return (
              <motion.div
                key="exit"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
                onClick={() => { setExperience("learner"); router.push("/codebook"); }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={{ border: "1.5px solid #2a2a3a" }}
                >
                  <Icon size={22} style={{ color: "#6b7280" }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: "#6b7280" }}>
                  Dashboard
                </span>
              </motion.div>
            );
          }
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
                      strokeWidth: item.active ? 2.5 : 2,
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
