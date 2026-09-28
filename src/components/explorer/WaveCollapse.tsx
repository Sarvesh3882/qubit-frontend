"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WaveCollapse({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const timeRef   = useRef(0);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsePos, setCollapsePos] = useState<{ x: number; y: number } | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Draw the wave (superposition)
  const drawWave = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0d0928";
    ctx.fillRect(0, 0, W, H);

    // Draw multiple wave layers for a rich interference pattern
    const waves = [
      { amp: 28, freq: 0.04, speed: 1.2, phase: 0,    color: "#4f8ef7" },
      { amp: 18, freq: 0.06, speed: 0.8, phase: 1.5,  color: "#c44ff7" },
      { amp: 12, freq: 0.08, speed: 1.5, phase: 3.1,  color: "#4ff7c4" },
    ];

    waves.forEach(({ amp, freq, speed, phase, color }, wi) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 - wi * 0.4;
      ctx.globalAlpha = 0.6 - wi * 0.1;
      for (let x = 0; x <= W; x++) {
        const y = H / 2 + amp * Math.sin(freq * x + speed * t + phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Central glow blob (the "qubit" position)
    const blobX = W / 2 + 30 * Math.sin(0.5 * t);
    const blobY = H / 2 + 20 * Math.cos(0.7 * t);
    const grd = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, 30);
    grd.addColorStop(0, "#4f8ef790");
    grd.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(blobX, blobY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Instruction text
    ctx.fillStyle = "#484f6880";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Click anywhere to measure!", W / 2, H - 12);
  }, []);

  // Draw collapsed state
  const drawCollapsed = useCallback((px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d0928";
    ctx.fillRect(0, 0, W, H);

    // Ripple from click point
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.arc(px, py, 20 + r * 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(79,142,247,${0.3 - r * 0.06})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Collapsed point
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 24);
    grd.addColorStop(0, "#4f8ef7");
    grd.addColorStop(0.5, "#4f8ef740");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📍 Collapsed here!", W / 2, H - 14);
  }, []);

  // Animation loop
  useEffect(() => {
    if (collapsed) return;
    const loop = (ts: number) => {
      timeRef.current = ts * 0.001;
      drawWave(timeRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [collapsed, drawWave]);

  // Click to collapse
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (collapsed) {
      // Reset
      setCollapsed(false);
      setCollapsePos(null);
      return;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);
    cancelAnimationFrame(animRef.current);
    setCollapsed(true);
    setCollapsePos({ x, y });
    drawCollapsed(x, y);
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 2 && onComplete) onComplete();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={320}
        height={180}
        onClick={handleClick}
        className="rounded-xl cursor-crosshair"
        style={{ border: "1px solid #2d2a45", maxWidth: "100%" }}
      />
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-sm font-bold text-[#4f8ef7]">💥 Wave collapsed!</p>
            <p className="text-xs text-[#7d8590] mt-1">The qubit picked one spot when you looked.</p>
            <button
              onClick={() => { setCollapsed(false); setCollapsePos(null); }}
              className="mt-2 text-xs text-[#484f68] hover:text-[#7d8590] transition-colors"
            >
              ↺ Reset and try again
            </button>
          </motion.div>
        ) : (
          <motion.p key="wave" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-[#7d8590] text-center"
          >
            🌊 The qubit is in superposition — spread everywhere!
          </motion.p>
        )}
      </AnimatePresence>
      {attempts > 0 && (
        <p className="text-[11px] text-[#484f68]">Collapsed {attempts} time{attempts !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
