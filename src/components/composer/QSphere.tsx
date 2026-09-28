"use client";
import { useEffect, useRef } from "react";

interface Point { state: string; prob: number; phase: number }
interface Props { points: Point[]; size?: number }

/**
 * Canvas-based Q-sphere visualization.
 * Plots each basis state as a sphere on a unit sphere surface,
 * sized by probability and colored by phase angle.
 */
export default function QSphere({ points, size = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = size;
    const cx = s / 2, cy = s / 2;
    const r = s * 0.4;
    ctx.clearRect(0, 0, s, s);

    // Sphere outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#0d1117";
    ctx.fill();

    // Latitude circles
    for (const lat of [-0.5, 0, 0.5]) {
      const ry = r * Math.sqrt(1 - lat * lat);
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * lat, ry, ry * 0.25, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    const significant = points.filter((p) => p.prob > 0.001);
    const n = significant[0]?.state.length ?? 1;

    for (const pt of significant) {
      // Map to sphere position based on Hamming weight (latitude) and index (longitude)
      const hammingWeight = pt.state.split("").filter((b) => b === "1").length;
      const lat = Math.PI * (hammingWeight / n) - Math.PI / 2;
      const lon = (parseInt(pt.state, 2) / Math.pow(2, n)) * Math.PI * 2;

      const sx = cx + r * Math.cos(lat) * Math.sin(lon) * 0.9;
      const sy = cy - r * Math.sin(lat);
      const dotR = Math.max(3, Math.sqrt(pt.prob) * r * 0.6);

      // Color by phase
      const hue = ((pt.phase + Math.PI) / (Math.PI * 2)) * 360;
      ctx.beginPath();
      ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // State label for significant states
      if (pt.prob > 0.05 && dotR > 6) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = `${Math.max(8, dotR * 0.7)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`|${pt.state}⟩`, sx, sy - dotR - 2);
      }
    }

    // Phase legend
    const lgx = s - 36, lgy = s - 20;
    for (let i = 0; i < 30; i++) {
      const hue = (i / 30) * 360;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(lgx - 30 + i, lgy, 1, 8);
    }
    ctx.fillStyle = "#64748b";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("0", lgx - 30, lgy + 18);
    ctx.fillText("2π", lgx - 4, lgy + 18);
    ctx.fillText("Phase", lgx - 24, lgy - 2);
  }, [points, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
    </div>
  );
}
