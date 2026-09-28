"use client";
import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

interface Props {
  x: number;
  y: number;
  z: number;
  label?: string;
  size?: number;
}

/**
 * Interactive 3D Bloch sphere using Three.js.
 * - Orbit controls (mouse drag to rotate)
 * - Smooth animated state vector transition
 * - Latitude/longitude circles
 * - Axes with labels |0⟩, |1⟩, |+⟩, |-⟩
 */
export default function BlochSphere3D({ x, y, z, label, size = 160 }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const stateRef  = useRef({ renderer: null as THREE.WebGLRenderer | null,
                             arrow: null as THREE.ArrowHelper | null,
                             scene: null as THREE.Scene | null,
                             camera: null as THREE.PerspectiveCamera | null,
                             animId: 0 });
  const targetRef = useRef({ x, y, z });
  const currentRef= useRef({ x: 0, y: 0, z: 1 });
  const isDragging= useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ theta: 0.4, phi: 1.1 }); // camera orbit angles

  // Update target when props change
  useEffect(() => {
    targetRef.current = { x, y, z };
  }, [x, y, z]);

  const updateCamera = useCallback(() => {
    const s = stateRef.current;
    if (!s.camera) return;
    const r = 2.8;
    const { theta, phi } = sphericalRef.current;
    s.camera.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    s.camera.lookAt(0, 0, 0);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = size, H = size;

    /* ── Renderer ──────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    /* ── Scene & camera ────────────────────────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    stateRef.current.scene  = scene;
    stateRef.current.camera = camera;
    updateCamera();

    /* ── Sphere wireframe ──────────────────────────────────────────── */
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x1a2332,
      wireframe: false,
      transparent: true,
      opacity: 0.18,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Outer ring (equator)
    const addRing = (axis: "x" | "y" | "z", color: number, opacity = 0.3) => {
      const g = new THREE.TorusGeometry(1, 0.003, 8, 80);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const t = new THREE.Mesh(g, m);
      if (axis === "x") t.rotation.y = Math.PI / 2;
      if (axis === "z") t.rotation.x = Math.PI / 2;
      scene.add(t);
    };
    addRing("y", 0x3d5a80, 0.5);  // equator (horizontal)
    addRing("x", 0x2a3f55, 0.3);  // vertical meridian
    addRing("z", 0x2a3f55, 0.25); // other meridian

    /* ── Axes ──────────────────────────────────────────────────────── */
    const axisLength = 1.35;
    // Z axis (|0⟩ top, |1⟩ bottom)
    scene.add(new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -axisLength, 0),
      axisLength * 2, 0x444d56, 0.12, 0.06
    ));
    // X axis
    scene.add(new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-axisLength, 0, 0),
      axisLength * 2, 0x2d333b, 0.08, 0.04
    ));
    // Y axis
    scene.add(new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -axisLength),
      axisLength * 2, 0x2d333b, 0.08, 0.04
    ));

    /* ── Axis labels (sprites) ─────────────────────────────────────── */
    const makeLabel = (text: string, pos: [number, number, number], color = "#7d8590") => {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 32;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.font = "bold 18px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, 32, 22);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...pos);
      sprite.scale.set(0.3, 0.15, 1);
      scene.add(sprite);
    };
    makeLabel("|0⟩",  [0,  1.55, 0], "#e6edf3");
    makeLabel("|1⟩",  [0, -1.55, 0], "#e6edf3");
    makeLabel("|+⟩",  [1.6, 0,  0], "#7d8590");
    makeLabel("|-⟩",  [-1.6, 0, 0], "#7d8590");
    makeLabel("|i⟩",  [0,  0, 1.6], "#7d8590");
    makeLabel("|-i⟩", [0,  0,-1.6], "#7d8590");

    /* ── State vector arrow ────────────────────────────────────────── */
    const arrowDir    = new THREE.Vector3(0, 1, 0).normalize();
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 1, 0x4589ff, 0.18, 0.09);
    scene.add(arrow);
    stateRef.current.arrow = arrow;

    /* ── Animate ───────────────────────────────────────────────────── */
    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);

      // Smooth lerp current → target
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const LERP = 0.08;
      cur.x += (tgt.x - cur.x) * LERP;
      cur.y += (tgt.y - cur.y) * LERP;
      cur.z += (tgt.z - cur.z) * LERP;

      // Map Bloch (x,y,z) to Three.js coords:
      // Bloch z → Three y (vertical), Bloch x → Three x, Bloch y → Three z
      const dir = new THREE.Vector3(cur.x, cur.z, cur.y);
      const len = dir.length();
      if (len > 0.001) {
        dir.normalize();
        arrow.setDirection(dir);
        arrow.setLength(Math.min(len, 1), 0.18, 0.09);
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── Mouse orbit controls ──────────────────────────────────────── */
    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      sphericalRef.current.theta -= dx * 0.008;
      sphericalRef.current.phi   = Math.max(0.1, Math.min(Math.PI - 0.1,
        sphericalRef.current.phi + dy * 0.008
      ));
      updateCamera();
    };
    const onUp = () => { isDragging.current = false; };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={mountRef}
        style={{ width: size, height: size, cursor: "grab" }}
        title="Drag to rotate"
      />
      {label && (
        <span className="text-[10px] text-[#7d8590] font-mono">{label}</span>
      )}
      {/* Bloch coordinates */}
      <div className="text-[9px] text-[#484f58] font-mono flex gap-2">
        <span>x={x.toFixed(2)}</span>
        <span>y={y.toFixed(2)}</span>
        <span>z={z.toFixed(2)}</span>
      </div>
    </div>
  );
}
