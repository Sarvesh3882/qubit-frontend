"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   CONFETTI PARTICLE
───────────────────────────────────────────────────────────────────────────── */

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
  shape: "circle" | "square" | "star";
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEFAULT COLORS
───────────────────────────────────────────────────────────────────────────── */

const DEFAULT_COLORS = ["#4f8ef7", "#f7c94f", "#c44ff7", "#4ff7a4", "#f77f7f"];

/* ─────────────────────────────────────────────────────────────────────────────
   CONFETTI BURST COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface ConfettiBurstProps {
  count?: number;
  duration?: number;
  colors?: string[];
}

export function ConfettiBurst({
  count = 50,
  duration = 3,
  colors,
}: ConfettiBurstProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const colorArray = colors || DEFAULT_COLORS;

  useEffect(() => {
    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800),
        y: -20,
        color: colorArray[Math.floor(Math.random() * colorArray.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
        shape: ["circle", "square", "star"][Math.floor(Math.random() * 3)] as ConfettiParticle["shape"],
      });
    }
    setParticles(newParticles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => {
        const endY = (typeof window !== "undefined" ? window.innerHeight : 800) + 100;
        const drift = (Math.random() - 0.5) * 200;

        return (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.shape === "circle" ? "50%" : particle.shape === "square" ? "0%" : undefined,
              clipPath: particle.shape === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : undefined,
            }}
            initial={{ y: particle.y, x: particle.x, rotate: particle.rotation, opacity: 1 }}
            animate={{
              y: endY,
              x: particle.x + drift,
              rotate: particle.rotation + 720,
              opacity: 0,
            }}
            transition={{
              duration: duration,
              ease: "easeIn",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAR BURST (Radial explosion of stars)
───────────────────────────────────────────────────────────────────────────── */

interface StarBurstProps {
  count?: number;
  duration?: number;
  color?: string;
}

export function StarBurst({ count = 12, duration = 1.5, color = "#f7c94f" }: StarBurstProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i * 360) / count;
        const distance = 150;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;

        return (
          <motion.div
            key={i}
            className="absolute text-3xl"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x,
              y,
              scale: [0, 1.2, 0.8],
              opacity: [1, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: duration,
              ease: "easeOut",
            }}
            style={{ color }}
          >
            ⭐
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FIREWORKS (Multiple bursts)
───────────────────────────────────────────────────────────────────────────── */

export function Fireworks({ duration = 4 }: { duration?: number }) {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    const burstCount = 5;
    const newBursts = [];
    for (let i = 0; i < burstCount; i++) {
      newBursts.push({
        id: i,
        x: Math.random() * 60 + 20, // 20-80% of screen width
        y: Math.random() * 40 + 10, // 10-50% of screen height
        delay: i * 0.4,
      });
    }
    setBursts(newBursts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {bursts.map((burst) => (
        <motion.div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: burst.delay }}
        >
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i * 360) / 20;
            const distance = 80 + Math.random() * 40;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            const colors = ["#4f8ef7", "#f7c94f", "#c44ff7", "#4ff7a4", "#f77f7f"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x,
                  y,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.2,
                  delay: burst.delay,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
