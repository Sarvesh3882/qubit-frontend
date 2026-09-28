"use client";
import { useEffect, useRef } from "react";

interface Props {
  x: number; y: number; z: number;
  size?: number;
}

/**
 * Canvas-based Bloch sphere renderer.
 * Draws the sphere outline, axes, equator, and the state vector.
 */
export default function BlochSphere({ x, y, z, size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = size;
    const cx = s / 2, cy = s / 2;
    const r = s * 0.42;

    ctx.clearRect(0, 0, s, s);

    // Sphere outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Equator ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    const axes = [
      { dx: r, dy: 0, label: "x", col: "#64748b" },
      { dx: 0, dy: -r, label: "z", col: "#64748b" },
    ];
    for (const a of axes) {
      ctx.beginPath();
      ctx.moveTo(cx - a.dx * 0.8, cy - a.dy * 0.8);
      ctx.lineTo(cx + a.dx * 1.05, cy + a.dy * 1.05);
      ctx.strokeStyle = a.col;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = a.col;
      ctx.font = `${s * 0.09}px monospace`;
      ctx.fillText(a.label, cx + a.dx * 1.12 - 4, cy + a.dy * 1.12 + 4);
    }

    // Poles
    ctx.fillStyle = "#475569";
    ctx.font = `${s * 0.09}px monospace`;
    ctx.fillText("|0⟩", cx + 3, cy - r - 4);
    ctx.fillText("|1⟩", cx + 3, cy + r + 12);

    // State vector: map (x, y, z) Bloch coords to 2D projection
    // Simple isometric-ish projection: screen_x = cx + r*(x - y*0.5), screen_y = cy - r*z
    const vx = cx + r * (x - y * 0.5) * 0.85;
    const vy = cy - r * z;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(vx, vy);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#6366f1";
    ctx.fill();

    // Dashed projection to equatorial plane
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx, cy);
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [x, y, z, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="rounded"
    />
  );
}
