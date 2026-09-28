"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  LevelUpCelebration,
  AchievementUnlock,
  StreakNotification,
  ZoneUnlock,
  XPGainFloat,
} from "@/components/explorer/ProgressNotifications";
import { useExplorerProgressStore, ACHIEVEMENTS } from "@/store/explorerProgressStore";

/* ─────────────────────────────────────────────────────────────────────────────
   NOTIFICATION QUEUE TYPES
───────────────────────────────────────────────────────────────────────────── */

type NotificationItem =
  | { type: "xp"; amount: number; color?: string }
  | { type: "levelup"; newLevel: number }
  | { type: "achievement"; achievementId: string }
  | { type: "streak"; days: number }
  | { type: "unlock"; zoneName: string; emoji: string; color: string };

interface ProgressNotificationContextType {
  showXPGain: (amount: number, color?: string) => void;
  showLevelUp: (newLevel: number) => void;
  showAchievement: (achievementId: string) => void;
  showStreak: (days: number) => void;
  showZoneUnlock: (zoneName: string, emoji: string, color: string) => void;
}

const ProgressNotificationContext = createContext<ProgressNotificationContextType | undefined>(undefined);

/* ─────────────────────────────────────────────────────────────────────────────
   PROVIDER COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export function ProgressNotificationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<NotificationItem[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);
  const [showXP, setShowXP] = useState<{ amount: number; color: string; id: number } | null>(null);

  // Auto-detect level ups by watching XP changes
  const { getLevel, xp } = useExplorerProgressStore();
  const [previousLevel, setPreviousLevel] = useState(getLevel());

  useEffect(() => {
    const currentLevel = getLevel();
    if (currentLevel > previousLevel && previousLevel > 0) {
      // Level up detected!
      showLevelUp(currentLevel);
    }
    setPreviousLevel(currentLevel);
  }, [xp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process queue
  useEffect(() => {
    if (!currentNotification && queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrentNotification(next);

      // XP notifications are instant and don't block the queue
      if (next.type === "xp") {
        setShowXP({ amount: next.amount, color: next.color || "#f7c94f", id: Date.now() });
        setCurrentNotification(null);
      }
    }
  }, [currentNotification, queue]);

  const closeCurrentNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const showXPGain = useCallback((amount: number, color?: string) => {
    setQueue((prev) => [...prev, { type: "xp", amount, color }]);
  }, []);

  const showLevelUp = useCallback((newLevel: number) => {
    setQueue((prev) => [...prev, { type: "levelup", newLevel }]);
  }, []);

  const showAchievement = useCallback((achievementId: string) => {
    setQueue((prev) => [...prev, { type: "achievement", achievementId }]);
  }, []);

  const showStreak = useCallback((days: number) => {
    setQueue((prev) => [...prev, { type: "streak", days }]);
  }, []);

  const showZoneUnlock = useCallback((zoneName: string, emoji: string, color: string) => {
    setQueue((prev) => [...prev, { type: "unlock", zoneName, emoji, color }]);
  }, []);

  return (
    <ProgressNotificationContext.Provider
      value={{ showXPGain, showLevelUp, showAchievement, showStreak, showZoneUnlock }}
    >
      {children}

      {/* XP Gain Float */}
      <AnimatePresence>
        {showXP && (
          <XPGainFloat
            key={showXP.id}
            amount={showXP.amount}
            color={showXP.color}
          />
        )}
      </AnimatePresence>

      {/* Other notifications */}
      <AnimatePresence>
        {currentNotification && currentNotification.type === "levelup" && (
          <LevelUpCelebration
            newLevel={currentNotification.newLevel}
            onClose={closeCurrentNotification}
          />
        )}
        {currentNotification && currentNotification.type === "achievement" && (
          <AchievementUnlock
            icon={ACHIEVEMENTS[currentNotification.achievementId]?.icon || "🏆"}
            title={ACHIEVEMENTS[currentNotification.achievementId]?.title || "Achievement"}
            description={ACHIEVEMENTS[currentNotification.achievementId]?.description || ""}
            xpReward={ACHIEVEMENTS[currentNotification.achievementId]?.xpReward || 0}
            onClose={closeCurrentNotification}
          />
        )}
        {currentNotification && currentNotification.type === "streak" && (
          <StreakNotification
            days={currentNotification.days}
            onClose={closeCurrentNotification}
          />
        )}
        {currentNotification && currentNotification.type === "unlock" && (
          <ZoneUnlock
            zoneName={currentNotification.zoneName}
            emoji={currentNotification.emoji}
            color={currentNotification.color}
            onClose={closeCurrentNotification}
          />
        )}
      </AnimatePresence>
    </ProgressNotificationContext.Provider>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK
───────────────────────────────────────────────────────────────────────────── */

export function useProgressNotifications() {
  const context = useContext(ProgressNotificationContext);
  if (!context) {
    throw new Error("useProgressNotifications must be used within ProgressNotificationProvider");
  }
  return context;
}
