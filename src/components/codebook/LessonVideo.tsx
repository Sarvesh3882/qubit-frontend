"use client";
import { useState } from "react";
import { Play } from "lucide-react";

interface Props {
  src: string;        // YouTube video ID, e.g. "R_Gk9k4-bv8"
  title: string;
  description?: string;
}

export default function LessonVideo({ src, title, description }: Props) {
  const [started, setStarted] = useState(false);

  // Build a clean embed URL — all branding/UI stripped
  const embedUrl = [
    `https://www.youtube-nocookie.com/embed/${src}`,
    "?autoplay=1",
    "&rel=0",           // no related videos
    "&modestbranding=1",// minimal branding
    "&controls=1",      // keep native controls (scrubber, volume)
    "&showinfo=0",      // no title bar
    "&iv_load_policy=3",// no annotations
    "&disablekb=0",     // keep keyboard shortcuts
    "&color=white",     // white progress bar (less YouTube-branded)
    "&playsinline=1",
  ].join("");

  return (
    <div className="rounded-lg overflow-hidden border border-[#e4e4e7] bg-[#0d1117]">

      {/* Video area */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" /* 16:9 */ }}>

        {/* Thumbnail / click-to-play screen shown before user starts */}
        {!started && (
          <button
            onClick={() => setStarted(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#0d1117] group"
            aria-label={`Play ${title}`}
          >
            {/* Thumbnail image from YouTube */}
            <img
              src={`https://img.youtube.com/vi/${src}/hqdefault.jpg`}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            {/* Play button overlay */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Play size={22} className="text-white ml-1" />
            </div>
          </button>
        )}

        {/* Iframe — only mounted after click so no autoplay on page load */}
        {started && (
          <>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/*
              Overlay strip that covers the YouTube logo watermark
              (bottom-right corner, ~60×18px).
              Pointer-events are none so the iframe controls still work everywhere else.
            */}
            <div
              className="absolute bottom-0 right-0 pointer-events-none"
              style={{
                width: 80,
                height: 28,
                background: "#0d1117",
                borderTopLeftRadius: 4,
              }}
            />
          </>
        )}
      </div>

      {/* Title + description bar */}
      <div className="px-4 py-3 border-t border-[#21262d]" style={{ background: "#161b22" }}>
        <p className="text-xs font-semibold text-[#e6edf3] truncate">{title}</p>
        {description && (
          <p className="text-[11px] text-[#7d8590] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
