"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Cpu, Server, Map, Layers } from "lucide-react";
import Button from "@/components/ui/Button";
import { useTourStore } from "@/store/tourStore";
import { useExperienceStore } from "@/store/experienceStore";

const NAV_LINKS = [
  { href: "/codebook",       label: "Codebook"                },
  { href: "/composer",       label: "Composer"                },
  { href: "/playground",     label: "Playground"              },
  { href: "/infrastructure", label: "Quantum Infrastructure"  },
];

const AREAS = [
  {
    icon: BookOpen,
    title: "Codebook",
    href: "/codebook",
    tag: "Learn",
    desc: "Structured curriculum with a visual learning map, interactive codercises, LaTeX math, and progress tracking.",
  },
  {
    icon: FlaskConical,
    title: "Composer",
    href: "/composer",
    tag: "Build & Simulate",
    desc: "Visual circuit builder with live Qiskit code. Simulate on Aer, inspect Bloch spheres and Q-sphere in 3D.",
  },
  {
    icon: Cpu,
    title: "Algorithm Playground",
    href: "/playground",
    tag: "Experiment",
    desc: "Run Deutsch-Jozsa, Grover, QFT, and Bernstein-Vazirani. Compare classical vs quantum complexity.",
  },
  {
    icon: Server,
    title: "Quantum Infrastructure",
    href: "/infrastructure",
    tag: "Real Hardware",
    desc: "Submit circuits to real quantum hardware via Origin Quantum Cloud. Backed by Origin Pilot OS and QPanda3 Runtime.",
  },
];

export default function HomePage() {
  const { seen, openTour } = useTourStore();
  const { experience } = useExperienceStore();
  const router = useRouter();

  useEffect(() => {
    // First-time visitor with no experience chosen → show selector
    if (!experience && !seen) {
      const t = setTimeout(() => router.push("/select"), 300);
      return () => clearTimeout(t);
    }
    // Returning learner who hasn't taken the tour → open tour
    if (!seen && experience === "learner") {
      const t = setTimeout(openTour, 600);
      return () => clearTimeout(t);
    }
  }, [experience, seen, openTour, router]);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="border-b border-[#e4e4e7]">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-14">
          <p className="text-[11px] font-semibold text-[#4f46e5] uppercase tracking-widest mb-4">
            SIH 2026 · Quantum Learning Platform
          </p>
          <h1 className="text-[2.5rem] font-bold tracking-tight text-[#111118] leading-[1.18] mb-4">
            Learn quantum computing<br />
            by building quantum circuits.
          </h1>
          <p className="text-base text-[#52525b] max-w-lg leading-relaxed mb-7">
            From your first qubit to running real algorithms on Origin Wukong —
            through structured lessons, a visual circuit composer, and a context-aware AI tutor.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/codebook">
              <Button size="lg">Start learning <ArrowRight size={14} /></Button>
            </Link>
            <Link href="/composer">
              <Button variant="outline" size="lg">Try the Composer</Button>
            </Link>
            <button
              onClick={openTour}
              className="flex items-center gap-1.5 px-4 h-10 rounded text-sm text-[#71717a] hover:text-[#111118] hover:bg-[#f0f0f2] transition-colors"
            >
              <Map size={14} /> Platform tour
            </button>
            <Link href="/select">
              <button className="flex items-center gap-1.5 px-4 h-10 rounded text-sm text-[#71717a] hover:text-[#111118] hover:bg-[#f0f0f2] transition-colors border border-[#e4e4e7]">
                <Layers size={14} /> Switch experience
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform areas ────────────────────────────────────────────── */}
      <section className="bg-[#f7f7f8] border-b border-[#e4e4e7]">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-5">Platform</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#e4e4e7]">
            {AREAS.map(({ icon: Icon, title, href, tag, desc }) => (
              <Link key={title} href={href}>
                <div className="group bg-white p-5 hover:bg-[#fafafa] transition-colors flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#f0f0f2] flex items-center justify-center shrink-0 group-hover:bg-[#eef2ff] transition-colors">
                        <Icon size={14} className="text-[#52525b] group-hover:text-[#4f46e5] transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-[#111118]">{title}</span>
                    </div>
                    <span className="text-[10px] text-[#a1a1aa] border border-[#e4e4e7] rounded px-1.5 py-0.5 shrink-0 leading-none mt-0.5">
                      {tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#71717a] leading-relaxed">{desc}</p>
                  <span className="text-xs text-[#4f46e5] font-medium flex items-center gap-1 mt-auto group-hover:gap-1.5 transition-all">
                    Open <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-b border-[#e4e4e7]">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-5">How it works</p>
          <div className="space-y-0">
            {[
              ["Codebook",               "Study a concept — theory, math, and live coding exercises in one workspace"],
              ["Composer",               "Build the corresponding circuit and run it on Qiskit Aer"],
              ["Visualize",              "Inspect measurement probabilities, 3D Bloch sphere, and Q-sphere"],
              ["AI Agent",               "Ask the tutor to explain results or help debug — it knows your context"],
              ["Playground",             "Run complete algorithms and compare classical vs quantum approaches"],
              ["Quantum Infrastructure", "Submit circuits to Origin Wukong — real superconducting quantum hardware"],
            ].map(([stage, detail], i, arr) => (
              <div
                key={stage}
                className={`flex items-baseline gap-6 py-3 ${i < arr.length - 1 ? "border-b border-[#f7f7f8]" : ""}`}
              >
                <span className="text-[11px] text-[#d4d4d8] tabular-nums w-4 shrink-0">{i + 1}</span>
                <span className="text-sm font-semibold text-[#111118] w-44 shrink-0">{stage}</span>
                <span className="text-sm text-[#71717a]">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Infrastructure callout ────────────────────────────────────── */}
      <section className="border-b border-[#e4e4e7]">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-4">Quantum Infrastructure</p>
              <h2 className="text-xl font-bold text-[#111118] leading-snug mb-3">
                Real quantum hardware via Origin Quantum Cloud.
              </h2>
              <p className="text-sm text-[#52525b] leading-relaxed mb-2">
                QUBIT's Quantum Infrastructure connects to{" "}
                <strong className="text-[#111118]">Origin Quantum Cloud</strong> — backed by
                Origin Pilot OS and the QPanda3 Runtime. Circuits built in the Composer
                can be submitted directly to Origin Wukong QPUs.
              </p>
              <p className="text-sm text-[#52525b] leading-relaxed">
                Origin Pilot is not a QUBIT product — it is the external quantum OS that
                powers the infrastructure layer QUBIT integrates with.
              </p>
            </div>
            <div className="shrink-0 hidden sm:flex flex-col items-end gap-3 pt-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-[#111118]">72–180</p>
                <p className="text-xs text-[#a1a1aa]">qubits (Wukong)</p>
              </div>
              <Link href="/infrastructure">
                <Button variant="outline" size="sm">
                  Open Infrastructure <ArrowRight size={11} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tour CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[#f7f7f8]">
        <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#111118] mb-1">New to QUBIT?</p>
            <p className="text-sm text-[#71717a]">Take the 2-minute platform tour to understand every section before you start.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openTour}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium border border-[#d4d4d8] text-[#111118] hover:bg-white transition-colors"
            >
              <Map size={14} /> Start tour
            </button>
            <Link href="/codebook">
              <Button size="md">Open Codebook <ArrowRight size={13} /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e4e4e7] py-7">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-[#a1a1aa]">
          <span className="font-semibold text-[#111118]">QUBIT</span>
          <div className="flex gap-5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-[#111118] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
