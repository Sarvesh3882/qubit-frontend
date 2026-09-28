/**
 * AssessmentGate
 *
 * Wraps any Learner page. On first visit by a new learner who has never
 * done the placement assessment, shows a prompt banner encouraging them
 * to take it. Does NOT hard-block — a learner can always dismiss and proceed.
 *
 * Shown once per session (dismisses itself after the user acts).
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAssessmentStore } from "@/store/assessmentStore";
import { Sparkles, X, ArrowRight } from "lucide-react";

export default function AssessmentGate() {
  const router = useRouter();
  const { completed, skipped } = useAssessmentStore();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // auto-dismiss if already completed
    if (completed) setDismissed(true);
  }, [completed]);

  const show = mounted && !completed && !skipped && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="relative bg-[#eef2ff] border-b border-[#c7d2fe] px-5 py-3 flex items-center gap-4"
        >
          <Sparkles size={15} className="text-[#4f46e5] shrink-0" />
          <p className="flex-1 text-sm text-[#3730a3]">
            <strong>New here?</strong> Take the 5-minute placement assessment and we'll
            personalise your learning path based on what you already know.
          </p>
          <button
            onClick={() => router.push("/assessment")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-bold rounded-lg hover:bg-[#4338ca] transition-colors shrink-0"
          >
            Start <ArrowRight size={12} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-[#a1a1aa] hover:text-[#52525b] transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
