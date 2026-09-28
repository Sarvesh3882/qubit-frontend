"use client";
import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  title: string;
  description?: string;
}

export default function LessonVideo({ src, title, description }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [muted,   setMuted]     = useState(false);
  const [progress,setProgress]  = useState(0);
  const [duration,setDuration]  = useState(0);
  const [hovered, setHovered]   = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const onLoaded = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const onEnded = () => setPlaying(false);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const fullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <div className="rounded-lg overflow-hidden border border-[#e4e4e7] bg-[#0d1117]">
      {/* Video */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={toggle}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full block"
          style={{ maxHeight: 320, background: "#000" }}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoaded}
          onEnded={onEnded}
          muted={muted}
          playsInline
        />

        {/* Play/pause overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
            (!playing || hovered) ? "opacity-100" : "opacity-0"
          )}
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            {playing
              ? <Pause size={20} className="text-white" />
              : <Play  size={20} className="text-white ml-1" />
            }
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2.5" style={{ background: "#161b22" }}>
        {/* Progress bar */}
        <div
          className="h-1 rounded-full cursor-pointer mb-2.5 overflow-hidden"
          style={{ background: "#30363d" }}
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: "#4589ff" }}
          />
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="text-[#7d8590] hover:text-[#e6edf3] transition-colors">
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
            className="text-[#7d8590] hover:text-[#e6edf3] transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <span className="text-[10px] font-mono text-[#484f58]">
            {fmt(duration * progress / 100)} / {fmt(duration)}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-[#7d8590] truncate block">{title}</span>
          </div>
          <button onClick={fullscreen} className="text-[#7d8590] hover:text-[#e6edf3] transition-colors">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-2.5 border-t border-[#21262d]" style={{ background: "#0d1117" }}>
          <p className="text-xs text-[#7d8590] leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
