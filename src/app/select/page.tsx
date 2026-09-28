"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useExperienceStore, type Experience } from "@/store/experienceStore";
import { ArrowRight, Gamepad2, BookOpen, Microscope } from "lucide-react";

const EXPERIENCES: {
  id: Experience;
  label: string;
  tagline: string;
  description: string;
  audience: string;
  icon: React.ElementType;
  href: string;
  illustration: string;
  bg: string;
  border: string;
  accent: string;
  textAccent: string;
  tag: string;
}[] = [
  {
    id: "explorer",
    label: "Explorer",
    tagline: "Quantum is a game.",
    description:
      "Drag particles, build light experiments, discover superposition by playing — no formulas required.",
    audience: "Kids · Beginners · Curious minds",
    icon: Gamepad2,
    href: "/explorer",
    illustration: "/illustrations/startkid.jpg",
    bg: "#0f0c29",
    border: "#3b3aff",
    accent: "#3b3aff",
    textAccent: "#7b7bff",
    tag: "Play & Discover",
  },
  {
    id: "learner",
    label: "Learner",
    tagline: "Learn by building.",
    description:
      "Structured curriculum, interactive codercises, a full circuit composer, algorithm experiments, and quantum hardware access.",
    audience: "Students · Developers · Professionals",
    icon: BookOpen,
    href: "/codebook",
    illustration: "/illustrations/studentstudying.svg",
    bg: "#ffffff",
    border: "#4f46e5",
    accent: "#4f46e5",
    textAccent: "#4f46e5",
    tag: "Learn & Experiment",
  },
  {
    id: "researcher",
    label: "Researcher",
    tagline: "Benchmark. Analyze. Discover.",
    description:
      "Multi-experiment workspace, circuit comparison, parameter sweeps, hardware benchmarking, and a research intelligence feed.",
    audience: "Researchers · PhD students · Quantum engineers",
    icon: Microscope,
    href: "/research",
    illustration: "/illustrations/researcher.jpg",
    bg: "#0d1117",
    border: "#30363d",
    accent: "#58a6ff",
    textAccent: "#58a6ff",
    tag: "Research & Analyze",
  },
];

export default function SelectPage() {
  const router = useRouter();
  const { setExperience } = useExperienceStore();

  const choose = (xp: typeof EXPERIENCES[0]) => {
    setExperience(xp.id);
    router.push(xp.href);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 py-12">
      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-3"
      >
        <span className="text-2xl font-bold tracking-tight text-white">QUBIT</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-[#7d8590] text-sm mb-10 text-center"
      >
        Choose your experience to get started
      </motion.p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
        {EXPERIENCES.map((xp, i) => (
          <motion.button
            key={xp.id}
            onClick={() => choose(xp)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.25, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            className="group relative flex flex-col rounded-2xl overflow-hidden text-left cursor-pointer focus:outline-none"
            style={{
              background: xp.id === "learner" ? "#111118" : xp.bg,
              border: `1px solid ${xp.border}`,
              boxShadow: `0 0 0 0 ${xp.accent}`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${xp.accent}40`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Illustration area */}
            <div
              className="h-44 w-full overflow-hidden relative shrink-0"
              style={{ background: xp.id === "explorer" ? "#1a1560" : xp.id === "researcher" ? "#161b22" : "#1e1b4b" }}
            >
              <Image
                src={xp.illustration}
                alt={xp.label}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={i === 0}
              />
              {/* Tag pill */}
              <div
                className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                style={{ background: `${xp.accent}22`, color: xp.textAccent, border: `1px solid ${xp.accent}44` }}
              >
                {xp.tag}
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2 p-5 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${xp.accent}18` }}
                >
                  <xp.icon size={15} style={{ color: xp.textAccent }} />
                </div>
                <span className="text-base font-bold text-white">{xp.label}</span>
              </div>

              <p className="text-sm font-semibold" style={{ color: xp.textAccent }}>
                {xp.tagline}
              </p>

              <p className="text-xs text-[#7d8590] leading-relaxed flex-1">
                {xp.description}
              </p>

              <p className="text-[10px] text-[#484f58] mt-1">{xp.audience}</p>

              {/* CTA row */}
              <div
                className="flex items-center gap-1.5 mt-3 text-xs font-semibold transition-all duration-150 group-hover:gap-2.5"
                style={{ color: xp.textAccent }}
              >
                Start <ArrowRight size={13} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="mt-10 text-[11px] text-[#484f58] text-center"
      >
        You can switch experiences at any time from the navigation menu.
      </motion.p>
    </div>
  );
}
