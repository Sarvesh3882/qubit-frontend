"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CoinState = "superposition" | "heads" | "tails";

export default function CoinFlip({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<CoinState>("superposition");
  const [spinning, setSpinning] = useState(false);
  const [peeks, setPeeks] = useState(0);
  const [history, setHistory] = useState<("heads" | "tails")[]>([]);

  const putInSuperposition = () => {
    if (spinning) return;
    setState("superposition");
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
  };

  const peek = useCallback(() => {
    if (state !== "superposition") return;
    const result: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    setState(result);
    const next = [...history, result].slice(-8);
    setHistory(next);
    if (next.length >= 3 && onComplete) onComplete();
  }, [state, history, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Coin */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === "superposition" ? (
            <motion.div
              key="super"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: spinning ? [0, 360] : 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-32 rounded-full flex items-center justify-center text-5xl select-none"
              style={{
                background: "conic-gradient(from 0deg, #4f8ef7, #c44ff7, #4ff7a4, #f7c94f, #4f8ef7)",
                boxShadow: "0 0 40px #4f8ef780",
                animation: "spin 2s linear infinite",
              }}
            >
              🪙
            </motion.div>
          ) : (
            <motion.div
              key={state}
              initial={{ rotateY: 90, scale: 0.8 }}
              animate={{ rotateY: 0, scale: 1 }}
              exit={{ rotateY: -90, scale: 0.8 }}
              transition={{ duration: 0.35 }}
              className="w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 select-none"
              style={{
                background: state === "heads" ? "linear-gradient(135deg,#4f8ef7,#2563eb)" : "linear-gradient(135deg,#c44ff7,#7c3aed)",
                boxShadow: `0 0 32px ${state === "heads" ? "#4f8ef780" : "#c44ff780"}`,
              }}
            >
              <span className="text-4xl">{state === "heads" ? "😎" : "😜"}</span>
              <span className="text-sm font-bold text-white capitalize">{state}!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spinning glow ring when in superposition */}
        {state === "superposition" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid #4f8ef740" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* State label */}
      <div className="text-center">
        <p className="text-base font-bold text-white">
          {state === "superposition" ? "🌊 In superposition (both!)" : state === "heads" ? "Collapsed to HEADS! 😎" : "Collapsed to TAILS! 😜"}
        </p>
        <p className="text-xs text-[#7d8590] mt-1">
          {state === "superposition" ? "The qubit hasn't decided yet" : "Measuring forced it to choose"}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={putInSuperposition}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: "#1e1060",
            border: "1px solid #4f8ef750",
            color: "#7fb3ff",
            opacity: spinning ? 0.6 : 1,
          }}
        >
          🌀 Spin!
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={peek}
          disabled={state !== "superposition"}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: "#4f8ef7", color: "white" }}
        >
          👁️ Peek!
        </motion.button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[11px] text-[#484f68]">Your peeks so far:</p>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {history.map((h, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-7 h-7 rounded-full text-sm flex items-center justify-center"
                style={{ background: h === "heads" ? "#4f8ef730" : "#c44ff730" }}
              >
                {h === "heads" ? "😎" : "😜"}
              </motion.span>
            ))}
          </div>
          <p className="text-[11px] text-[#7d8590]">Notice how the result is random each time!</p>
        </div>
      )}
    </div>
  );
}
