import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  xpReward: number;
}

export interface LevelCompletion {
  levelId: string;
  stars: number; // 1-3
  completedAt: number;
  xpEarned: number;
  activities: {
    learn: boolean;
    experiment: boolean;
    quiz: boolean;
  };
}

export interface DailyStreak {
  current: number;
  longest: number;
  lastActiveDate: string; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_steps: {
    id: "first_steps",
    title: "First Steps",
    description: "Complete your first level",
    icon: "🎯",
    xpReward: 50,
  },
  superposition_master: {
    id: "superposition_master",
    title: "Superposition Master",
    description: "Complete all Superposition Island levels",
    icon: "🌊",
    xpReward: 200,
  },
  gate_wizard: {
    id: "gate_wizard",
    title: "Gate Wizard",
    description: "Complete all Gate Galaxy levels",
    icon: "⚡",
    xpReward: 200,
  },
  perfect_quiz: {
    id: "perfect_quiz",
    title: "Quiz Champion",
    description: "Get all quiz questions correct in a level",
    icon: "🏆",
    xpReward: 100,
  },
  streak_3: {
    id: "streak_3",
    title: "3-Day Streak",
    description: "Practice quantum computing 3 days in a row",
    icon: "🔥",
    xpReward: 75,
  },
  streak_7: {
    id: "streak_7",
    title: "7-Day Streak",
    description: "Practice quantum computing 7 days in a row",
    icon: "🔥🔥",
    xpReward: 150,
  },
  explorer: {
    id: "explorer",
    title: "Quantum Explorer",
    description: "Unlock all zones",
    icon: "🗺️",
    xpReward: 300,
  },
  experimenter: {
    id: "experimenter",
    title: "Hands-On Learner",
    description: "Complete 10 experiments",
    icon: "⚗️",
    xpReward: 150,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Store State & Actions
// ─────────────────────────────────────────────────────────────────────────────

interface ExplorerProgressState {
  // Core progress
  xp: number;
  completedLevels: Map<string, LevelCompletion>;
  unlockedAchievements: Set<string>;
  streak: DailyStreak;
  
  // Computed getters
  getLevel: () => number;
  getXpForNextLevel: () => number;
  getXpInCurrentLevel: () => number;
  getLevelProgress: () => number;
  
  // Level completion
  markLevelComplete: (
    levelId: string,
    stars: number,
    xpEarned: number,
    activities: { learn: boolean; experiment: boolean; quiz: boolean }
  ) => void;
  isLevelComplete: (levelId: string) => boolean;
  getLevelStars: (levelId: string) => number;
  
  // Zone & unlocking
  getZoneCompletion: (levelIds: string[]) => { completed: number; total: number };
  isZoneUnlocked: (zoneId: string) => boolean;
  
  // XP & levels
  addXP: (amount: number, source: string) => void;
  
  // Achievements
  unlockAchievement: (achievementId: string) => boolean;
  getUnlockedAchievements: () => Achievement[];
  checkAndUnlockAchievements: () => void;
  
  // Streaks
  updateStreak: () => void;
  
  // Stats
  getTotalStars: () => number;
  getCompletionCount: () => number;
  getExperimentCount: () => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// XP & Level Calculations
// ─────────────────────────────────────────────────────────────────────────────

const XP_BASE = 100;
const XP_MULTIPLIER = 1.5;

function calculateLevel(xp: number): number {
  let level = 1;
  let requiredXP = XP_BASE;
  let accumulatedXP = 0;
  
  while (accumulatedXP + requiredXP <= xp) {
    accumulatedXP += requiredXP;
    level++;
    requiredXP = Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
  }
  
  return level;
}

function xpForLevel(level: number): number {
  if (level === 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, l - 1));
  }
  return total;
}

function xpNeededForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const xpForCurrentLevel = xpForLevel(currentLevel);
  const xpForNextLevel = xpForLevel(currentLevel + 1);
  return xpForNextLevel - currentXP;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Unlocking Logic
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_UNLOCK_REQUIREMENTS: Record<string, { requiredLevel?: number; requiredZones?: string[] }> = {
  superposition: {}, // Always unlocked
  gates: { requiredLevel: 2 },
  entanglement: { requiredLevel: 3, requiredZones: ["superposition"] },
  measurement: { requiredLevel: 5, requiredZones: ["gates", "entanglement"] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Store Implementation
// ─────────────────────────────────────────────────────────────────────────────

export const useExplorerProgressStore = create<ExplorerProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      completedLevels: new Map<string, LevelCompletion>(),
      unlockedAchievements: new Set<string>(),
      streak: {
        current: 0,
        longest: 0,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },

      // ── Computed getters ────────────────────────────────────────────────
      getLevel: () => calculateLevel(get().xp),
      
      getXpForNextLevel: () => {
        const level = get().getLevel();
        return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
      },
      
      getXpInCurrentLevel: () => {
        const totalXP = get().xp;
        const level = get().getLevel();
        const xpAtLevelStart = xpForLevel(level);
        return totalXP - xpAtLevelStart;
      },
      
      getLevelProgress: () => {
        const xpInLevel = get().getXpInCurrentLevel();
        const xpNeeded = get().getXpForNextLevel();
        return (xpInLevel / xpNeeded) * 100;
      },

      // ── Level completion ────────────────────────────────────────────────
      markLevelComplete: (levelId, stars, xpEarned, activities) => {
        const existing = get().completedLevels.get(levelId);
        const newCompletion: LevelCompletion = {
          levelId,
          stars: Math.max(stars, existing?.stars || 0),
          completedAt: Date.now(),
          xpEarned,
          activities,
        };
        
        set((state) => {
          const newMap = new Map(state.completedLevels);
          newMap.set(levelId, newCompletion);
          return { completedLevels: newMap };
        });
        
        get().addXP(xpEarned, `level:${levelId}`);
        get().updateStreak();
        get().checkAndUnlockAchievements();
      },

      isLevelComplete: (levelId) => {
        return get().completedLevels.has(levelId);
      },

      getLevelStars: (levelId) => {
        return get().completedLevels.get(levelId)?.stars || 0;
      },

      // ── Zone & unlocking ────────────────────────────────────────────────
      getZoneCompletion: (levelIds) => {
        const completed = levelIds.filter((id) => get().completedLevels.has(id)).length;
        return { completed, total: levelIds.length };
      },

      isZoneUnlocked: (zoneId) => {
        const requirements = ZONE_UNLOCK_REQUIREMENTS[zoneId];
        if (!requirements || Object.keys(requirements).length === 0) return true;
        
        const userLevel = get().getLevel();
        if (requirements.requiredLevel && userLevel < requirements.requiredLevel) {
          return false;
        }
        
        if (requirements.requiredZones) {
          // Check if required zones have at least 1 completed level
          // (In a real implementation, you'd check specific zone completion)
          return true; // Simplified for now
        }
        
        return true;
      },

      // ── XP & levels ─────────────────────────────────────────────────────
      addXP: (amount, source) => {
        const oldLevel = get().getLevel();
        set((state) => ({ xp: state.xp + amount }));
        const newLevel = get().getLevel();
        
        // Level up celebration would be triggered here
        if (newLevel > oldLevel) {
          console.log(`🎉 Level up! You're now level ${newLevel}`);
        }
      },

      // ── Achievements ────────────────────────────────────────────────────
      unlockAchievement: (achievementId) => {
        if (get().unlockedAchievements.has(achievementId)) {
          return false; // Already unlocked
        }
        
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;
        
        set((state) => ({
          unlockedAchievements: new Set(state.unlockedAchievements).add(achievementId),
        }));
        
        get().addXP(achievement.xpReward, `achievement:${achievementId}`);
        return true;
      },

      getUnlockedAchievements: () => {
        return Array.from(get().unlockedAchievements)
          .map((id) => ACHIEVEMENTS[id])
          .filter(Boolean)
          .map((ach) => ({
            ...ach,
            unlockedAt: Date.now(), // Would track actual unlock time in real impl
          }));
      },

      checkAndUnlockAchievements: () => {
        const state = get();
        
        // First steps
        if (state.completedLevels.size === 1) {
          state.unlockAchievement("first_steps");
        }
        
        // Streak achievements
        if (state.streak.current >= 3) {
          state.unlockAchievement("streak_3");
        }
        if (state.streak.current >= 7) {
          state.unlockAchievement("streak_7");
        }
        
        // Experiment count
        if (state.getExperimentCount() >= 10) {
          state.unlockAchievement("experimenter");
        }
      },

      // ── Streaks ─────────────────────────────────────────────────────────
      updateStreak: () => {
        const today = new Date().toISOString().split("T")[0];
        const lastActive = get().streak.lastActiveDate;
        
        if (lastActive === today) {
          return; // Already counted today
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        set((state) => {
          const newStreak = lastActive === yesterdayStr 
            ? state.streak.current + 1 
            : 1;
          
          return {
            streak: {
              current: newStreak,
              longest: Math.max(newStreak, state.streak.longest),
              lastActiveDate: today,
            },
          };
        });
        
        get().checkAndUnlockAchievements();
      },

      // ── Stats ───────────────────────────────────────────────────────────
      getTotalStars: () => {
        let total = 0;
        get().completedLevels.forEach((completion) => {
          total += completion.stars;
        });
        return total;
      },

      getCompletionCount: () => {
        return get().completedLevels.size;
      },

      getExperimentCount: () => {
        let count = 0;
        get().completedLevels.forEach((completion) => {
          if (completion.activities.experiment) count++;
        });
        return count;
      },
    }),
    {
      name: "qubit-explorer-progress-v2",
      partialize: (state) => ({
        xp: state.xp,
        completedLevels: Array.from(state.completedLevels.entries()),
        unlockedAchievements: Array.from(state.unlockedAchievements),
        streak: state.streak,
      }),
      merge: (persisted: any, current) => {
        const p = persisted as any;
        return {
          ...current,
          xp: p?.xp ?? 0,
          completedLevels: new Map(p?.completedLevels ?? []),
          unlockedAchievements: new Set(p?.unlockedAchievements ?? []),
          streak: p?.streak ?? current.streak,
        };
      },
    }
  )
);
