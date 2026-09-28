"use client";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, Sparkles, Zap, Layers, Globe,
  Activity, ChevronRight, Check, Cpu, FlaskConical,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   QUANTUM PARTICLE FIELD
   ══════════════════════════════════════════════════════════════════════════ */

function QuantumField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
    scale: 0.3 + Math.random() * 0.7,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-indigo-400"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [p.scale, p.scale * 1.5, p.scale],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════════════════════════════ */

function Hero() {
  const router = useRouter();
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <QuantumField />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.15),transparent_50%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Sparkles size={14} className="text-indigo-300" />
            <span className="text-xs font-medium text-indigo-200 tracking-wide">SIH 2026 · Quantum Computing Platform</span>
          </motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.08] mb-6 tracking-tight">
            Learn. Build.<br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Experiment. Run
            </span>
            <br />
            <span className="text-indigo-100">Quantum.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            From your first qubit to running algorithms on real quantum hardware —
            an integrated platform for learning, building, and experimenting with quantum computing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push("/select")}
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Exploring <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => router.push("/select")}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              Choose Your Experience
            </button>
          </div>
        </motion.div>

        {/* Product Video Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="mt-20 relative"
        >
          <div className="relative max-w-5xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl opacity-60" />

            {/* Video container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 backdrop-blur aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/Kr07RNJdxwU?autoplay=1&mute=1&loop=1&playlist=Kr07RNJdxwU&controls=0&showinfo=0&rel=0&modestbranding=1"
                title="QUBIT Interactive Quantum Learning"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoReady(true)}
              />

              {/* Video overlay UI elements */}
              <AnimatePresence>
                {videoReady && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white">Live Demo</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating UI badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute -left-8 top-1/4 hidden lg:block"
            >
              <div className="px-4 py-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-xl">
                <p className="text-xs text-slate-400 mb-1">Codebook</p>
                <p className="text-sm font-bold text-white">Interactive Learning</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute -right-8 top-1/3 hidden lg:block"
            >
              <div className="px-4 py-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-xl">
                <p className="text-xs text-slate-400 mb-1">Composer</p>
                <p className="text-sm font-bold text-white">Circuit Builder</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <p className="text-xs text-slate-400 uppercase tracking-widest">Scroll to explore</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight size={20} className="text-slate-400 rotate-90" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WHAT QUBIT IS — Visual Journey
   ══════════════════════════════════════════════════════════════════════════ */

function JourneySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    { icon: "📚", label: "Learn", desc: "Structured quantum concepts" },
    { icon: "🔧", label: "Build", desc: "Visual circuit composer" },
    { icon: "⚗️", label: "Experiment", desc: "Algorithm playground" },
    { icon: "🚀", label: "Execute", desc: "Real quantum hardware" },
    { icon: "🌐", label: "Discover", desc: "Research & community" },
  ];

  return (
    <section ref={ref} className="py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">The Platform</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            End-to-end quantum workflow
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From concept to execution in one integrated platform
          </p>
        </motion.div>

        {/* Visual Journey */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 flex items-center justify-center text-3xl mb-4 shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{step.label}</h3>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHOWCASE — Large Feature Sections
   ══════════════════════════════════════════════════════════════════════════ */

function PlatformShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      title: "Codebook",
      subtitle: "Structured learning with visual roadmap",
      desc: "Interactive lessons with LaTeX math, live code exercises, and progress tracking through a visual learning map.",
      gradient: "from-blue-500 to-indigo-600",
      icon: "📚",
    },
    {
      title: "Composer",
      subtitle: "Build and simulate quantum circuits",
      desc: "Drag-and-drop circuit builder with live Qiskit code generation. Run simulations on Aer, inspect states with Bloch sphere and Q-sphere.",
      gradient: "from-purple-500 to-pink-600",
      icon: "🎵",
    },
    {
      title: "Algorithm Playground",
      subtitle: "Experiment with quantum algorithms",
      desc: "Run Deutsch-Jozsa, Grover, QFT, and more. Compare quantum vs classical complexity and visualize algorithmic advantage.",
      gradient: "from-cyan-500 to-blue-600",
      icon: "⚗️",
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${feature.gradient} text-white text-4xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-lg font-semibold text-indigo-600 mb-4">{feature.subtitle}</p>
                <p className="text-base text-slate-600 leading-relaxed mb-6">{feature.desc}</p>
                <button className="group inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all">
                  Learn more <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Visual */}
              <div className="flex-1">
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-br ${feature.gradient} p-1`}>
                  <div className="bg-white rounded-xl p-8 min-h-[300px] flex items-center justify-center">
                    <p className="text-slate-400 text-sm">Product Screenshot · {feature.title}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THREE EXPERIENCES
   ══════════════════════════════════════════════════════════════════════════ */

function ExperienceSelector() {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const experiences = [
    {
      id: "explorer",
      icon: "🎮",
      title: "Explorer",
      subtitle: "For kids & beginners",
      desc: "Gamified quantum discovery through interactive levels, visual experiments, and zero jargon.",
      color: "from-blue-400 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      id: "learner",
      icon: "📚",
      title: "Learner",
      subtitle: "For students & professionals",
      desc: "Structured curriculum, circuit composer, algorithms, real hardware, AI tutor, and community.",
      color: "from-indigo-500 to-purple-600",
      bg: "bg-indigo-50",
    },
    {
      id: "researcher",
      icon: "🔬",
      title: "Researcher",
      subtitle: "For advanced users",
      desc: "Research workspace, experiment management, analysis tools, literature, and infrastructure access.",
      color: "from-purple-500 to-pink-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-slate-900 to-indigo-950 relative overflow-hidden">
      <QuantumField />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-3">Personalized</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Three ways to explore quantum
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            QUBIT adapts to your experience level and learning style
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              onClick={() => router.push("/select")}
              className="group relative rounded-2xl p-8 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <div className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${exp.color} text-white text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                {exp.icon}
              </div>
              <h3 className="text-2xl font-black text-white mb-1">{exp.title}</h3>
              <p className="text-sm font-semibold text-indigo-300 mb-4">{exp.subtitle}</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{exp.desc}</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all">
                Choose {exp.title} <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => router.push("/select")}
            className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            Choose Your Experience
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REAL QUANTUM HARDWARE
   ══════════════════════════════════════════════════════════════════════════ */

function QuantumInfrastructure() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">Quantum Infrastructure</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            From simulation to real quantum hardware
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Connect your circuits to Origin Quantum Cloud and run on superconducting QPUs
          </p>
        </motion.div>

        {/* Visual flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Simulate", desc: "Test on Qiskit Aer", icon: "💻", color: "bg-blue-500" },
            { step: "02", title: "Connect", desc: "Origin Quantum Cloud", icon: "☁️", color: "bg-indigo-500" },
            { step: "03", title: "Execute", desc: "Real QPU (72-180 qubits)", icon: "⚛️", color: "bg-purple-500" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className={`${item.color} text-white rounded-2xl p-8 shadow-xl`}>
                <div className="text-6xl mb-4">{item.icon}</div>
                <p className="text-xs font-bold opacity-60 mb-2">{item.step}</p>
                <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                <p className="text-sm opacity-90">{item.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight size={24} className="text-slate-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ══════════════════════════════════════════════════════════════════════════ */

function FinalCTA() {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section ref={ref} className="py-32 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      <QuantumField />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          The quantum world<br />
          is waiting to be explored
        </h2>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Join thousands learning, building, and experimenting with quantum computing
        </p>
        <button
          onClick={() => router.push("/select")}
          className="group relative px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50"
        >
          <span className="relative z-10 flex items-center gap-3">
            Start Exploring QUBIT <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <JourneySection />
      <PlatformShowcase />
      <ExperienceSelector />
      <QuantumInfrastructure />
      <FinalCTA />
    </main>
  );
}
