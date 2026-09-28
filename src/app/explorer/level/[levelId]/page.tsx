"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { getLevel } from "@/lib/explorerLevels";
import { useExplorerProgressStore } from "@/store/explorerProgressStore";
import { useProgressNotifications } from "@/contexts/ProgressNotificationContext";
import { ConfettiBurst } from "@/components/explorer/Confetti";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  BookOpen,
  Beaker,
  Brain,
  Sparkles,
  Award,
  Trophy,
} from "lucide-react";

const CoinFlip = dynamic(() => import("@/components/explorer/CoinFlip"), { ssr: false });
const WaveCollapse = dynamic(() => import("@/components/explorer/WaveCollapse"), { ssr: false });
const GateDemo = dynamic(() => import("@/components/explorer/GateDemo"), { ssr: false });

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY MODE ENUM
───────────────────────────────────────────────────────────────────────────── */

type ActivityMode = "learn" | "experiment" | "quiz";

/* ─────────────────────────────────────────────────────────────────────────────
   STAR RATING COMPONENT
───────────────────────────────────────────────────────────────────────────── */

function StarRating({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -30 }}
          animate={i < count ? { scale: 1, rotate: 0 } : { scale: 1, rotate: 0, opacity: 0.3 }}
          transition={{ delay: i * 0.15, type: "spring", stiffness: 300 }}
        >
          <Star size={32} fill={i < count ? color : "transparent"} stroke={color} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPLETION CELEBRATION OVERLAY
───────────────────────────────────────────────────────────────────────────── */

interface CompletionOverlayProps {
  level: ReturnType<typeof getLevel>;
  stars: number;
  xpEarned: number;
  onContinue: () => void;
  onReturnToMap: () => void;
}

function CompletionOverlay({ level, stars, xpEarned, onContinue, onReturnToMap }: CompletionOverlayProps) {
  if (!level) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(10, 5, 32, 0.95)", backdropFilter: "blur(12px)" }}
    >
      {/* Confetti */}
      <ConfettiBurst count={80} duration={4} />

      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative max-w-md w-full text-center"
      >
        {/* Celebration particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl pointer-events-none"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: (Math.random() - 0.5) * 400,
              y: -150 - Math.random() * 150,
              scale: 0.3,
              rotate: Math.random() * 720,
            }}
            transition={{ duration: 1.5, delay: i * 0.05 }}
            style={{ left: "50%", top: "30%" }}
          >
            {["⭐", "✨", "🎊", "🎉"][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}

        {/* Main card */}
        <motion.div
          className="rounded-3xl p-8 flex flex-col items-center gap-6"
          style={{
            background: `linear-gradient(135deg, ${level.zoneColor}15 0%, ${level.zoneColor}05 100%)`,
            border: `2px solid ${level.zoneColor}60`,
            boxShadow: `0 20px 60px ${level.zoneColor}40`,
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8 }}
            className="text-6xl"
          >
            🎉
          </motion.div>

          <div>
            <h1 className="text-2xl font-black text-white mb-2">Level Complete!</h1>
            <p className="text-sm text-[#9ca3b8]">{level.title}</p>
          </div>

          <StarRating count={stars} color={level.zoneColor} />

          {/* XP Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl"
            style={{
              background: `${level.zoneColor}20`,
              border: `1px solid ${level.zoneColor}60`,
            }}
          >
            <Sparkles size={18} style={{ color: level.zoneColor }} />
            <span className="text-base font-black" style={{ color: level.zoneColor }}>
              +{xpEarned} XP
            </span>
          </motion.div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${level.zoneColor}, #c44ff7)`,
                boxShadow: `0 8px 24px ${level.zoneColor}60`,
              }}
            >
              Continue to Next Level →
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onReturnToMap}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: "#1a1730",
                color: "#9ca3b8",
                border: "1px solid #2d2a45",
              }}
            >
              🗺️ Return to World Map
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN LEVEL PAGE
───────────────────────────────────────────────────────────────────────────── */

export default function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const router = useRouter();
  const { markLevelComplete, isLevelComplete, getLevelStars } = useExplorerProgressStore();
  const { showXPGain, showAchievement } = useProgressNotifications();
  const level = getLevel(levelId);

  // Activity mode selection
  const [mode, setMode] = useState<ActivityMode | null>(null);

  // Step progression within each mode
  const [stepIndex, setStepIndex] = useState(0);
  const [interactComplete, setInteractComplete] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Completion tracking
  const [activitiesComplete, setActivitiesComplete] = useState({
    learn: false,
    experiment: false,
    quiz: false,
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [finalStars, setFinalStars] = useState(0);

  useEffect(() => {
    // Check if already complete
    if (isLevelComplete(levelId)) {
      const existingStars = getLevelStars(levelId);
      setFinalStars(existingStars);
    }
  }, [levelId, isLevelComplete, getLevelStars]);

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0520" }}>
        <div className="text-center text-white">
          <p className="text-4xl mb-3">🚧</p>
          <p className="text-lg font-bold">Level not found</p>
          <button
            onClick={() => router.push("/explorer")}
            className="mt-4 text-sm text-[#7fb3ff] hover:underline"
          >
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  const learnSteps = level.steps.filter((s) => s.type === "story");
  const experimentSteps = level.steps.filter((s) => s.type === "interact");
  const quizSteps = level.steps.filter((s) => s.type === "quiz");

  const handleModeSelect = (selectedMode: ActivityMode) => {
    setMode(selectedMode);
    setStepIndex(0);
    setInteractComplete(false);
    setQuizAnswered(false);
    setSelectedAnswer(null);
  };

  const handleNext = () => {
    if (mode === "learn") {
      if (stepIndex < learnSteps.length - 1) {
        setStepIndex(stepIndex + 1);
      } else {
        // Learn mode complete
        setActivitiesComplete((prev) => ({ ...prev, learn: true }));
        setMode(null);
        setStepIndex(0);
      }
    } else if (mode === "experiment") {
      if (interactComplete) {
        setActivitiesComplete((prev) => ({ ...prev, experiment: true }));
        setMode(null);
        setStepIndex(0);
        setInteractComplete(false);
      }
    } else if (mode === "quiz") {
      if (quizAnswered) {
        setActivitiesComplete((prev) => ({ ...prev, quiz: true }));
        setMode(null);
        setStepIndex(0);
        setQuizAnswered(false);
        setSelectedAnswer(null);
      }
    }
  };

  const handleQuizAnswer = (choiceIndex: number) => {
    if (quizAnswered) return;
    setSelectedAnswer(choiceIndex);
    setQuizAnswered(true);
  };

  // Check if all activities complete
  useEffect(() => {
    if (activitiesComplete.learn && activitiesComplete.experiment && activitiesComplete.quiz) {
      // Calculate stars (3 if all correct, 2 otherwise, minimum 1 for completion)
      const stars = 3; // Simplified - would calculate based on quiz performance
      setFinalStars(stars);

      // Mark complete in store
      markLevelComplete(levelId, stars, level.xpReward, activitiesComplete);

      // Show XP gain animation
      showXPGain(level.xpReward, level.zoneColor);

      // Show celebration
      setTimeout(() => {
        setShowCompletion(true);
      }, 1500); // Delay to show XP animation first
    }
  }, [activitiesComplete, levelId, level.xpReward, level.zoneColor, markLevelComplete, showXPGain]);

  const handleContinue = () => {
    // Navigate to next level (simplified - would determine actual next level)
    router.push("/explorer");
  };

  const handleReturnToMap = () => {
    router.push("/explorer");
  };

  // ─── MODE SELECTION SCREEN ────────────────────────────────────────────────

  if (!mode) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: `radial-gradient(ellipse at top, ${level.zoneColor}20 0%, #0a0520 50%, #0a0520 100%)`,
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
            <span className="text-2xl">{level.emoji}</span>
            <div>
              <h1 className="text-sm font-black text-white">{level.title}</h1>
              <p className="text-[10px] text-[#7d8590]">{level.zone}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Choose Your Activity</h2>
              <p className="text-sm text-[#9ca3b8]">{level.subtitle}</p>
            </div>

            {/* Activity cards */}
            <div className="space-y-3">
              {/* Learn */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect("learn")}
                disabled={activitiesComplete.learn}
                className="w-full rounded-2xl p-5 text-left transition-all relative overflow-hidden"
                style={{
                  background: activitiesComplete.learn ? "#0d2b1a" : "#1a1730",
                  border: activitiesComplete.learn ? "2px solid #4ff7a4" : "2px solid #2d2a45",
                  opacity: activitiesComplete.learn ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#7fb3ff20" }}
                    >
                      <BookOpen size={20} className="text-[#7fb3ff]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Learn</h3>
                      <p className="text-xs text-[#9ca3b8]">
                        Understand the concepts through storytelling
                      </p>
                    </div>
                  </div>
                  {activitiesComplete.learn && <CheckCircle2 size={20} className="text-[#4ff7a4]" />}
                </div>
              </motion.button>

              {/* Experiment */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect("experiment")}
                disabled={activitiesComplete.experiment}
                className="w-full rounded-2xl p-5 text-left transition-all"
                style={{
                  background: activitiesComplete.experiment ? "#0d2b1a" : "#1a1730",
                  border: activitiesComplete.experiment ? "2px solid #4ff7a4" : "2px solid #2d2a45",
                  opacity: activitiesComplete.experiment ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#c44ff720" }}
                    >
                      <Beaker size={20} className="text-[#c44ff7]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Experiment</h3>
                      <p className="text-xs text-[#9ca3b8]">
                        Try it yourself with interactive simulations
                      </p>
                    </div>
                  </div>
                  {activitiesComplete.experiment && <CheckCircle2 size={20} className="text-[#4ff7a4]" />}
                </div>
              </motion.button>

              {/* Quiz */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelect("quiz")}
                disabled={activitiesComplete.quiz}
                className="w-full rounded-2xl p-5 text-left transition-all"
                style={{
                  background: activitiesComplete.quiz ? "#0d2b1a" : "#1a1730",
                  border: activitiesComplete.quiz ? "2px solid #4ff7a4" : "2px solid #2d2a45",
                  opacity: activitiesComplete.quiz ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#f7c94f20" }}
                    >
                      <Brain size={20} className="text-[#f7c94f]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Quiz</h3>
                      <p className="text-xs text-[#9ca3b8]">Test your understanding</p>
                    </div>
                  </div>
                  {activitiesComplete.quiz && <CheckCircle2 size={20} className="text-[#4ff7a4]" />}
                </div>
              </motion.button>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {Object.values(activitiesComplete).map((complete, i) => (
                <div
                  key={i}
                  className="w-8 h-1.5 rounded-full transition-all"
                  style={{
                    background: complete ? "#4ff7a4" : "#2d2a45",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Completion overlay */}
        {showCompletion && (
          <CompletionOverlay
            level={level}
            stars={finalStars}
            xpEarned={level.xpReward}
            onContinue={handleContinue}
            onReturnToMap={handleReturnToMap}
          />
        )}
      </div>
    );
  }

  // ─── LEARN MODE ──────────────────────────────────────────────────────────

  if (mode === "learn") {
    const step = learnSteps[stepIndex];
    const progress = ((stepIndex + 1) / learnSteps.length) * 100;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0520" }}>
        {/* Progress bar */}
        <div className="h-1 bg-[#1a1730]">
          <motion.div
            className="h-full"
            style={{ background: level.zoneColor }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setMode(null)}
            className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1730]">
            <BookOpen size={14} className="text-[#7fb3ff]" />
            <span className="text-xs font-bold text-white">
              {stepIndex + 1}/{learnSteps.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="max-w-lg w-full"
            >
              <div
                className="rounded-3xl p-8 text-center"
                style={{
                  background: "linear-gradient(135deg, #1a1730 0%, #110d2e 100%)",
                  border: "2px solid #2d2a45",
                }}
              >
                <span className="text-6xl mb-6 block">{step.emoji}</span>
                <h2 className="text-xl font-black text-white mb-4">{step.title}</h2>
                <p className="text-sm text-[#9ca3b8] leading-relaxed whitespace-pre-line">{step.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-5 backdrop-blur-xl"
          style={{ background: "linear-gradient(0deg, #080318 80%, transparent)" }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="w-full max-w-lg mx-auto py-4 rounded-2xl text-base font-bold text-white transition-all block"
            style={{
              background: `linear-gradient(135deg, ${level.zoneColor}, #c44ff7)`,
              boxShadow: `0 8px 32px ${level.zoneColor}60`,
            }}
          >
            {stepIndex < learnSteps.length - 1 ? "Continue →" : "Complete ✓"}
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── EXPERIMENT MODE ─────────────────────────────────────────────────────

  if (mode === "experiment") {
    const step = experimentSteps[0]; // Single experiment per level for now

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0520" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a173080]">
          <button
            onClick={() => setMode(null)}
            className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1730]">
            <Beaker size={14} className="text-[#c44ff7]" />
            <span className="text-xs font-bold text-white">Experiment</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-white mb-2">{step.title}</h2>
              <p className="text-sm text-[#9ca3b8]">{step.body}</p>
            </div>

            <div
              className="rounded-3xl p-8 flex items-center justify-center min-h-[320px]"
              style={{
                background: "linear-gradient(135deg, #1a1730 0%, #110d2e 100%)",
                border: "2px solid #2d2a45",
              }}
            >
              {step.interactType === "coin_flip" && <CoinFlip onComplete={() => setInteractComplete(true)} />}
              {step.interactType === "bloch_drag" && <WaveCollapse onComplete={() => setInteractComplete(true)} />}
              {step.interactType === "gate_demo" && <GateDemo onComplete={() => setInteractComplete(true)} />}
            </div>

            {interactComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm font-bold text-[#4ff7a4]"
              >
                <CheckCircle2 size={18} />
                <span>Great work! You've completed the experiment.</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-5 backdrop-blur-xl"
          style={{ background: "linear-gradient(0deg, #080318 80%, transparent)" }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!interactComplete}
            className="w-full max-w-lg mx-auto py-4 rounded-2xl text-base font-bold text-white transition-all block disabled:opacity-30"
            style={{
              background: interactComplete
                ? `linear-gradient(135deg, ${level.zoneColor}, #c44ff7)`
                : "#1a1730",
              boxShadow: interactComplete ? `0 8px 32px ${level.zoneColor}60` : "none",
            }}
          >
            Complete ✓
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── QUIZ MODE ───────────────────────────────────────────────────────────

  if (mode === "quiz") {
    const step = quizSteps[0]; // Single quiz per level

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#0a0520" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a173080]">
          <button
            onClick={() => setMode(null)}
            className="flex items-center gap-2 text-sm text-[#7d8590] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1a1730]">
            <Brain size={14} className="text-[#f7c94f]" />
            <span className="text-xs font-bold text-white">Quiz</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
          <div className="max-w-lg w-full space-y-6">
            <div
              className="rounded-3xl p-6 text-center"
              style={{
                background: "linear-gradient(135deg, #1a1730 0%, #110d2e 100%)",
                border: "2px solid #2d2a45",
              }}
            >
              <p className="text-xs text-[#f7c94f] font-bold mb-3 uppercase tracking-wider">
                Quick Quiz ⚡
              </p>
              <h2 className="text-base font-bold text-white">{step.question}</h2>
            </div>

            <div className="space-y-3">
              {step.choices?.map((choice, idx) => {
                const isSelected = selectedAnswer === idx;
                const showResult = quizAnswered;
                let bg = "#1a1730";
                let border = "#2d2a45";
                let textColor = "#9ca3b8";

                if (showResult && isSelected && choice.correct) {
                  bg = "#0d2b1a";
                  border = "#4ff7a4";
                  textColor = "#4ff7a4";
                }
                if (showResult && isSelected && !choice.correct) {
                  bg = "#2b0d0d";
                  border = "#f74f4f";
                  textColor = "#f74f4f";
                }
                if (showResult && !isSelected && choice.correct) {
                  bg = "#0d2b1a";
                  border = "#4ff7a430";
                  textColor = "#4ff7a480";
                }

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuizAnswer(idx)}
                    className="w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition-all"
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      color: textColor,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-lg">
                        {!showResult
                          ? "○"
                          : isSelected
                          ? choice.correct
                            ? "✅"
                            : "❌"
                          : choice.correct
                          ? "✅"
                          : "○"}
                      </span>
                      <span className="flex-1">{choice.label}</span>
                    </div>
                    {showResult && isSelected && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs mt-2 ml-8 leading-relaxed"
                        style={{ color: choice.correct ? "#4ff7a4" : "#f7a04f" }}
                      >
                        {choice.feedback}
                      </motion.p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 px-6 py-5 backdrop-blur-xl"
          style={{ background: "linear-gradient(0deg, #080318 80%, transparent)" }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!quizAnswered}
            className="w-full max-w-lg mx-auto py-4 rounded-2xl text-base font-bold text-white transition-all block disabled:opacity-30"
            style={{
              background: quizAnswered
                ? `linear-gradient(135deg, ${level.zoneColor}, #c44ff7)`
                : "#1a1730",
              boxShadow: quizAnswered ? `0 8px 32px ${level.zoneColor}60` : "none",
            }}
          >
            Complete ✓
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
}
