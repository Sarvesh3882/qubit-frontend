"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useExplorerProgressStore, ACHIEVEMENTS } from "@/store/explorerProgressStore";
import {
  ArrowLeft,
  Star,
  Trophy,
  Award,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Map,
  Beaker,
  Gamepad2,
  Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  glow: string;
}

function StatCard({ icon, label, value, color, glow }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      className="rounded-2xl p-5 transition-all"
      style={{
        background: `${color}10`,
        border: `2px solid ${color}40`,
        boxShadow: `0 4px 16px ${glow}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-[#9ca3b8] font-medium">{label}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACHIEVEMENT CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface AchievementCardProps {
  achievement: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS];
  isUnlocked: boolean;
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      animate={
        isUnlocked
          ? {
              boxShadow: [
                "0 0 0px rgba(79, 142, 247, 0)",
                "0 0 20px rgba(79, 142, 247, 0.3)",
                "0 0 0px rgba(79, 142, 247, 0)",
              ],
            }
          : {}
      }
      transition={
        isUnlocked
          ? {
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }
          : {}
      }
      className="rounded-2xl p-4 transition-all"
      style={{
        background: isUnlocked ? "linear-gradient(135deg, #1a1730 0%, #110d2e 100%)" : "#0f0d1f",
        border: isUnlocked ? "2px solid #4f8ef740" : "2px solid #1a1730",
        opacity: isUnlocked ? 1 : 0.5,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
          style={{
            background: isUnlocked ? "#4f8ef715" : "#1a1730",
            filter: isUnlocked ? "none" : "grayscale(100%)",
          }}
        >
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1">{achievement.title}</h3>
          <p className="text-xs text-[#9ca3b8] leading-relaxed">{achievement.description}</p>
          {isUnlocked && (
            <div className="flex items-center gap-1.5 mt-2">
              <Sparkles size={12} className="text-[#f7c94f]" />
              <span className="text-xs font-bold text-[#f7c94f]">+{achievement.xpReward} XP</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS/JOURNEY PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function JourneyPage() {
  const router = useRouter();
  const {
    xp,
    getLevel,
    getLevelProgress,
    getXpInCurrentLevel,
    getXpForNextLevel,
    getTotalStars,
    getCompletionCount,
    getExperimentCount,
    getUnlockedAchievements,
    unlockedAchievements,
    streak,
  } = useExplorerProgressStore();

  const level = getLevel();
  const levelProgress = getLevelProgress();
  const xpInLevel = getXpInCurrentLevel();
  const xpNeeded = getXpForNextLevel();
  const totalStars = getTotalStars();
  const completedLevels = getCompletionCount();
  const experimentsCompleted = getExperimentCount();
  const unlockedAchs = getUnlockedAchievements();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(ellipse at top, #1a1060 0%, #0a0520 50%, #0a0520 100%)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a173080]">
        <button
          onClick={() => router.push("/explorer")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: "#7d8590" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[#4ff7a4]" />
          <h1 className="text-base font-black text-white">Your Journey</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 pb-32 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* ── Hero Card ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #4f8ef720 0%, #c44ff720 100%)",
              border: "2px solid #4f8ef740",
              boxShadow: "0 12px 48px #4f8ef730",
            }}
          >
            {/* Background illustration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <img
                src="/illustrations/studentquantumcomputing.svg"
                alt="Journey"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star size={24} fill="#f7c94f" stroke="#f7c94f" />
                <h2 className="text-3xl font-black text-white">Level {level}</h2>
              </div>
              <p className="text-sm text-[#9ca3b8] mb-6">Quantum Explorer</p>

              {/* XP Progress */}
              <div className="max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#9ca3b8] font-medium">
                    {xpInLevel} / {xpNeeded} XP
                  </span>
                  <span className="text-xs font-bold text-[#7fb3ff]">
                    {Math.round(levelProgress)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a1730] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #4f8ef7, #c44ff7)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="mt-6 text-2xl font-black text-white">{xp} Total XP</div>
            </div>
          </motion.div>

          {/* ── Stats Grid ────────────────────────────────────────────────── */}
          <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#7fb3ff]" />
              Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Trophy size={20} className="text-[#f7c94f]" />}
                label="Stars Earned"
                value={totalStars}
                color="#f7c94f"
                glow="#f7c94f40"
              />
              <StatCard
                icon={<Target size={20} className="text-[#4ff7a4]" />}
                label="Levels Complete"
                value={completedLevels}
                color="#4ff7a4"
                glow="#4ff7a440"
              />
              <StatCard
                icon={<Zap size={20} className="text-[#c44ff7]" />}
                label="Experiments"
                value={experimentsCompleted}
                color="#c44ff7"
                glow="#c44ff740"
              />
              <StatCard
                icon={<Calendar size={20} className="text-[#f77f7f]" />}
                label="Day Streak"
                value={streak.current > 0 ? `${streak.current} 🔥` : 0}
                color="#f77f7f"
                glow="#f77f7f40"
              />
            </div>
          </div>

          {/* ── Achievements ───────────────────────────────────────────────── */}
          <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Award size={18} className="text-[#7fb3ff]" />
              Achievements
              <span className="text-xs text-[#7d8590] font-medium">
                {unlockedAchs.length}/{Object.keys(ACHIEVEMENTS).length}
              </span>
            </h3>
            <div className="space-y-3">
              {Object.values(ACHIEVEMENTS).map((ach) => (
                <AchievementCard
                  key={ach.id}
                  achievement={ach}
                  isUnlocked={unlockedAchievements.has(ach.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Motivational Section ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #1a1730 0%, #110d2e 100%)",
              border: "2px solid #2d2a45",
            }}
          >
            <div className="text-4xl mb-3">🌟</div>
            <h3 className="text-base font-bold text-white mb-2">Keep Going!</h3>
            <p className="text-sm text-[#9ca3b8] leading-relaxed max-w-sm mx-auto">
              You're on an amazing quantum journey. Every level brings you closer to mastering the quantum realm!
            </p>
          </motion.div>
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
          { href: "/explorer", icon: Map, label: "Map", active: false, color: "#4f8ef7" },
          { href: "/explorer/lab", icon: Beaker, label: "Composer", active: false, color: "#c44ff7" },
          { href: "/explorer/games", icon: Gamepad2, label: "Games", active: false, color: "#f7c94f" },
          { href: "/explorer/journey", icon: Trophy, label: "Progress", active: true, color: "#4ff7a4" },
        ].map((item) => (
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
                <item.icon
                  size={20}
                  style={{ color: item.active ? item.color : "#484f68", strokeWidth: item.active ? 2.5 : 2 }}
                />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: item.active ? item.color : "#484f68" }}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
