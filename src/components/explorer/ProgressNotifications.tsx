"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, Award, Trophy, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION TYPES
───────────────────────────────────────────────────────────────────────────── */

export type NotificationType = "xp" | "levelup" | "achievement" | "streak" | "unlock";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  xpAmount?: number;
  level?: number;
  icon?: string;
  color?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   XP GAIN ANIMATION (Floating +XP)
───────────────────────────────────────────────────────────────────────────── */

interface XPGainProps {
  amount: number;
  color?: string;
}

export function XPGainFloat({ amount, color = "#f7c94f" }: XPGainProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: -80, scale: 1.2 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-50"
    >
      <div
        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-lg"
        style={{
          background: `${color}30`,
          border: `2px solid ${color}`,
          boxShadow: `0 8px 32px ${color}60`,
          color: color,
        }}
      >
        <Zap size={20} fill={color} stroke={color} />
        <span>+{amount} XP</span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL UP CELEBRATION
───────────────────────────────────────────────────────────────────────────── */

interface LevelUpProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpCelebration({ newLevel, onClose }: LevelUpProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none"
      style={{ background: "rgba(10, 5, 32, 0.8)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative text-center"
      >
        {/* Radiating circles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "#f7c94f" }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2 + i * 0.5, opacity: 0 }}
            transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
          />
        ))}

        {/* Main content */}
        <div className="relative z-10">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.2, 1.1, 1.2, 1],
            }}
            transition={{ duration: 0.6, repeat: 3 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-black text-white mb-2">Level Up!</h1>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Star size={28} fill="#f7c94f" stroke="#f7c94f" />
              <span className="text-5xl font-black text-[#f7c94f]">{newLevel}</span>
              <Star size={28} fill="#f7c94f" stroke="#f7c94f" />
            </div>
            <p className="text-sm text-[#9ca3b8]">You're getting stronger!</p>
          </motion.div>

          {/* Floating particles */}
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl pointer-events-none"
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: (Math.cos((i * Math.PI * 2) / 16) * 200),
                y: (Math.sin((i * Math.PI * 2) / 16) * 200),
                scale: 0.3,
              }}
              transition={{ duration: 2, delay: 0.5 }}
              style={{ left: "50%", top: "50%" }}
            >
              {["⭐", "✨", "💫"][i % 3]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACHIEVEMENT UNLOCK NOTIFICATION
───────────────────────────────────────────────────────────────────────────── */

interface AchievementUnlockProps {
  icon: string;
  title: string;
  description: string;
  xpReward: number;
  onClose: () => void;
}

export function AchievementUnlock({ icon, title, description, xpReward, onClose }: AchievementUnlockProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="fixed top-20 right-6 z-50 w-80 rounded-2xl p-5 cursor-pointer"
      onClick={onClose}
      style={{
        background: "linear-gradient(135deg, #4f8ef720 0%, #c44ff720 100%)",
        border: "2px solid #4f8ef760",
        boxShadow: "0 12px 48px #4f8ef740",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-[#f7c94f]" />
          <span className="text-xs font-bold text-[#f7c94f] uppercase tracking-wider">
            Achievement Unlocked!
          </span>
        </div>

        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl shrink-0"
          >
            {icon}
          </motion.div>
          <div className="flex-1">
            <h3 className="text-base font-black text-white mb-1">{title}</h3>
            <p className="text-xs text-[#9ca3b8] leading-relaxed mb-2">{description}</p>
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-[#f7c94f]" />
              <span className="text-xs font-bold text-[#f7c94f]">+{xpReward} XP</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ZONE UNLOCK NOTIFICATION
───────────────────────────────────────────────────────────────────────────── */

interface ZoneUnlockProps {
  zoneName: string;
  emoji: string;
  color: string;
  onClose: () => void;
}

export function ZoneUnlock({ zoneName, emoji, color, onClose }: ZoneUnlockProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl p-5 cursor-pointer"
      onClick={onClose}
      style={{
        background: `${color}20`,
        border: `2px solid ${color}`,
        boxShadow: `0 12px 48px ${color}60`,
        backdropFilter: "blur(12px)",
        minWidth: "320px",
      }}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp size={14} style={{ color }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            New Zone Unlocked!
          </span>
        </div>

        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="text-5xl mb-2"
        >
          {emoji}
        </motion.div>

        <h3 className="text-lg font-black text-white mb-1">{zoneName}</h3>
        <p className="text-xs text-[#9ca3b8]">Ready to explore!</p>
      </div>

      {/* Sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xl pointer-events-none"
          initial={{ opacity: 1, scale: 0 }}
          animate={{
            opacity: 0,
            scale: 1.5,
            x: (Math.cos((i * Math.PI * 2) / 8) * 60),
            y: (Math.sin((i * Math.PI * 2) / 8) * 60),
          }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ left: "50%", top: "50%" }}
        >
          ✨
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STREAK NOTIFICATION
───────────────────────────────────────────────────────────────────────────── */

interface StreakNotificationProps {
  days: number;
  onClose: () => void;
}

export function StreakNotification({ days, onClose }: StreakNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed bottom-32 right-6 z-50 rounded-2xl p-4 cursor-pointer"
      onClick={onClose}
      style={{
        background: "linear-gradient(135deg, #f77f7f20 0%, #f7c94f20 100%)",
        border: "2px solid #f77f7f60",
        boxShadow: "0 8px 32px #f77f7f40",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          className="text-3xl"
        >
          🔥
        </motion.div>
        <div>
          <div className="text-sm font-black text-white">{days} Day Streak!</div>
          <div className="text-xs text-[#9ca3b8]">Keep it going!</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION MANAGER (Context Provider)
───────────────────────────────────────────────────────────────────────────── */

interface NotificationManagerProps {
  children: React.ReactNode;
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  return (
    <>
      {children}
      <AnimatePresence>
        {notifications.map((notif) => {
          const handleClose = () => {
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          };

          switch (notif.type) {
            case "levelup":
              return <LevelUpCelebration key={notif.id} newLevel={notif.level!} onClose={handleClose} />;
            case "achievement":
              return (
                <AchievementUnlock
                  key={notif.id}
                  icon={notif.icon!}
                  title={notif.title}
                  description={notif.description!}
                  xpReward={notif.xpAmount!}
                  onClose={handleClose}
                />
              );
            case "streak":
              return <StreakNotification key={notif.id} days={notif.xpAmount!} onClose={handleClose} />;
            case "unlock":
              return (
                <ZoneUnlock
                  key={notif.id}
                  zoneName={notif.title}
                  emoji={notif.icon!}
                  color={notif.color!}
                  onClose={handleClose}
                />
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </>
  );
}
