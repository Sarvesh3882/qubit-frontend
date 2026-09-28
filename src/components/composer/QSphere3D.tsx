"use client";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

interface Point { state: string; prob: number; phase: number }
interface Props { points: Point[]; size?: number }

/**
 * Interactive 3D Q-sphere using Three.js.
 * Matches IBM Quantum Composer's Q-sphere visualization:
 * - Dark translucent sphere
 * - Latitude rings
 * - State dots sized by probability, colored by phase
 * - Phase legend ring
 * - Drag to rotate (orbit)
 */
export default function QSphere3D({ points, size = 280 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendRef  = useRef<{ renderer: THREE.WebGLRenderer | null; animId: number }>({
    renderer: null, animId: 0,
  });
  const spherical  = useRef({ theta: 0.3, phi: 1.2 });
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });

  const updateCamera = useCallback((camera: THREE.PerspectiveCamera) => {
    const r = 3;
    const { theta, phi } = spherical.current;
    camera.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, 0, 0);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const significant = points.filter((p) => p.prob > 0.001);

    /* ── Renderer ──────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    rendRef.current.renderer = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    updateCamera(camera);

    /* ── Main sphere ─────────────────────────────────────────────── */
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x131a24,
      transparent: true,
      opacity: 0.55,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), sphereMat));

    /* ── Latitude rings (like IBM) ───────────────────────────────── */
    const n = significant[0]?.state.length ?? 1;
    for (let hw = 0; hw <= n; hw++) {
      const lat = (hw / n) * Math.PI - Math.PI / 2;  // -π/2 to +π/2
      const cosLat = Math.cos(lat + Math.PI / 2);
      const ringR  = Math.sqrt(Math.max(0, 1 - cosLat * cosLat)) * 0.99;
      if (ringR < 0.05) continue;
      const g = new THREE.TorusGeometry(ringR, 0.003, 8, 64);
      const m = new THREE.MeshBasicMaterial({ color: 0x263040, transparent: true, opacity: 0.6 });
      const t = new THREE.Mesh(g, m);
      t.position.y = cosLat;
      scene.add(t);
    }

    /* ── Equator ring (thicker, brighter) ────────────────────────── */
    const eqGeo = new THREE.TorusGeometry(1, 0.005, 8, 80);
    const eqMat = new THREE.MeshBasicMaterial({ color: 0x3d5a80, transparent: true, opacity: 0.7 });
    const eq = new THREE.Mesh(eqGeo, eqMat);
    eq.rotation.x = Math.PI / 2;
    scene.add(eq);

    /* ── Vertical axis ───────────────────────────────────────────── */
    scene.add(new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1.3, 0),
      2.6, 0x30363d, 0.1, 0.05
    ));

    /* ── State dots ──────────────────────────────────────────────── */
    significant.forEach((pt) => {
      const hammingWeight = pt.state.split("").filter((b) => b === "1").length;
      // Latitude based on Hamming weight: 0 at top, n at bottom
      const cosLat = 1 - (2 * hammingWeight / n);
      const lat    = Math.acos(Math.max(-1, Math.min(1, cosLat)));

      // Longitude based on index within same Hamming weight
      const stateInt = parseInt(pt.state, 2);
      const lon = (stateInt / Math.pow(2, n)) * 2 * Math.PI;

      const sx = Math.sin(lat) * Math.cos(lon);
      const sy = Math.cos(lat);
      const sz = Math.sin(lat) * Math.sin(lon);

      // Phase → hue (matches IBM's rainbow phase wheel)
      const hue = ((pt.phase + Math.PI) / (2 * Math.PI)) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 0.85, 0.58);

      // Size based on probability (min 0.04, max 0.18)
      const r = Math.max(0.04, Math.sqrt(pt.prob) * 0.22);

      /* Sphere dot */
      const dotGeo = new THREE.SphereGeometry(r, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(sx, sy, sz);
      scene.add(dot);

      /* Vertical stem from axis to dot */
      const stemPoints = [
        new THREE.Vector3(0, sy, 0),
        new THREE.Vector3(sx, sy, sz),
      ];
      const stemGeo = new THREE.BufferGeometry().setFromPoints(stemPoints);
      const stemMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
      scene.add(new THREE.Line(stemGeo, stemMat));

      /* Vertical line from equator to dot height */
      if (Math.abs(sy) > 0.05) {
        const vPoints = [new THREE.Vector3(sx, 0, sz), new THREE.Vector3(sx, sy, sz)];
        const vGeo = new THREE.BufferGeometry().setFromPoints(vPoints);
        scene.add(new THREE.Line(vGeo,
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })
        ));
      }

      /* State label for significant states */
      if (pt.prob > 0.05) {
        const canvas = document.createElement("canvas");
        canvas.width = 96; canvas.height = 32;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = `hsl(${hue},70%,70%)`;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`|${pt.state}⟩`, 48, 22);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, transparent: true })
        );
        sprite.position.set(sx * 1.25, sy * 1.25 + 0.1, sz * 1.25);
        sprite.scale.set(0.35, 0.12, 1);
        scene.add(sprite);
      }
    });

    /* ── Pole labels ─────────────────────────────────────────────── */
    const addPoleLabel = (text: string, pos: [number, number, number]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 24;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#7d8590";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, 32, 18);
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
      );
      sprite.position.set(...pos);
      sprite.scale.set(0.3, 0.12, 1);
      scene.add(sprite);
    };
    addPoleLabel(`|${"0".repeat(n)}⟩`, [0,  1.45, 0]);
    addPoleLabel(`|${"1".repeat(n)}⟩`, [0, -1.45, 0]);

    /* ── Animate ─────────────────────────────────────────────────── */
    const animate = () => {
      rendRef.current.animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    /* ── Mouse orbit ─────────────────────────────────────────────── */
    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      spherical.current.theta -= dx * 0.008;
      spherical.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
        spherical.current.phi + dy * 0.008
      ));
      updateCamera(camera);
    };
    const onUp = () => { isDragging.current = false; };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(rendRef.current.animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={mountRef}
        style={{ width: size, height: size, cursor: "grab" }}
        title="Drag to rotate"
      />
      {/* Phase wheel legend (SVG — matches IBM's phase disk) */}
      <div className="flex items-center gap-2">
        <svg width="56" height="56" viewBox="-28 -28 56 56">
          {Array.from({ length: 360 }, (_, i) => {
            const a1 = (i - 90) * (Math.PI / 180);
            const a2 = (i - 89) * (Math.PI / 180);
            const x1 = 24 * Math.cos(a1), y1 = 24 * Math.sin(a1);
            const x2 = 24 * Math.cos(a2), y2 = 24 * Math.sin(a2);
            const x3 = 14 * Math.cos(a2), y3 = 14 * Math.sin(a2);
            const x4 = 14 * Math.cos(a1), y4 = 14 * Math.sin(a1);
            const hue = i;
            return (
              <polygon
                key={i}
                points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                fill={`hsl(${hue},75%,55%)`}
              />
            );
          })}
          <text x="0" y="-26" textAnchor="middle" fill="#7d8590" fontSize="7">π/2</text>
          <text x="0"  y="30" textAnchor="middle" fill="#7d8590" fontSize="7">3π/2</text>
          <text x="27" y="3"  textAnchor="start"  fill="#7d8590" fontSize="7">0</text>
          <text x="-27" y="3" textAnchor="end"    fill="#7d8590" fontSize="7">π</text>
          <text x="0" y="3" textAnchor="middle" fill="#484f58" fontSize="6">Phase</text>
        </svg>
      </div>
    </div>
  );
}
