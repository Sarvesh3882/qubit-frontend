"use client";
import React, { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ChevronDown,
  BookOpen,
  Zap,
  Cpu,
  Network,
  Users,
  Newspaper,
  Code2,
  Sparkles,
  Play,
  Bot,
} from "lucide-react";
import Image from "next/image";

/* ══════════════════════════════════════════════════════════════════════════
   STAR FIELD — Subtle astronomical background
   ══════════════════════════════════════════════════════════════════════════ */

function StarField() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    delay: number;
  }>>([]);

  // Only generate stars on the client side after mounting
  React.useEffect(() => {
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.5,
        delay: Math.random() * 3,
      }))
    );
    setMounted(true);
  }, []);

  // Don't render stars during SSR
  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-amber-100"
          style={{ 
            left: `${star.x}%`, 
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVIGATION — Dark glass scientific observatory
   ══════════════════════════════════════════════════════════════════════════ */

function Navigation() {
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 border-b border-slate-800/30"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <button onClick={() => router.push("/")} className="flex items-center gap-4">
            {/* QUBIT Icon SVG - Larger */}
            <div className="relative w-28 h-28">
              <Image
                src="/illustrations/QUBIT_icon.svg"
                alt="QUBIT"
                width={112}
                height={112}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-4xl font-black tracking-widest text-slate-100 uppercase font-orbitron">QUBIT</span>
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <button className="text-slate-400 hover:text-slate-200 transition-colors tracking-wide">Platform</button>
            <button className="text-slate-400 hover:text-slate-200 transition-colors tracking-wide">Experiences</button>
            <button className="text-slate-400 hover:text-slate-200 transition-colors tracking-wide">Discover</button>
            <button className="text-slate-400 hover:text-slate-200 transition-colors tracking-wide">Community</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/auth/login")} 
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors tracking-wide"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/select")}
            className="px-5 py-2 border border-amber-600/40 bg-amber-950/10 text-amber-100 hover:bg-amber-950/20 transition-all text-sm font-medium tracking-wide"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO — Editorial split: text left, large illustration right
   ══════════════════════════════════════════════════════════════════════════ */

function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0f]">
      <StarField />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT: Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="inline-block px-3 py-1.5 border border-amber-600/20 bg-amber-950/10 mb-8"
          >
            <span className="text-xs font-medium text-amber-100/70 tracking-[0.15em] uppercase">
              The Complete Quantum Computing Platform
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-[#f8f8f2] leading-[0.9] mb-8 tracking-tight">
            Learn. Build.<br />
            Experiment.<br />
            <span className="text-amber-100/95">
              Run Quantum.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl font-light">
            From your first qubit to running algorithms on real quantum hardware.
            An integrated platform for the complete quantum computing journey.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push("/select")}
              className="group px-8 py-4 border border-amber-600/40 bg-amber-950/15 text-amber-100 hover:bg-amber-950/30 hover:border-amber-600/60 transition-all text-base font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm"
            >
              Start Your Journey 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => document.getElementById('product-showcase')?.scrollIntoView({ behavior: 'smooth' })}
              className="group px-8 py-4 border border-slate-700/40 bg-slate-900/20 text-slate-300 hover:border-slate-600/60 hover:text-slate-200 hover:bg-slate-900/40 transition-all text-base font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm"
            >
              <Play size={16} className="group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* RIGHT: Hero Illustration - Professional Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative hidden lg:block"
        >
          {/* Subtle background glow - much more restrained */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[120px]" />
          </div>

          <div className="relative w-full aspect-[4/3]">
            {/* Main image with subtle enhancement */}
            <div className="relative w-full h-full">
              <Image
                src="/illustrations/herosectionart.png"
                alt="Quantum computing platform"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain opacity-90"
                style={{
                  filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.4))',
                }}
                priority
              />
            </div>

            {/* Minimal floating particles - just 4 for subtlety */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-cyan-400/40 rounded-full"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${30 + i * 10}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Very subtle vignette to blend edges naturally */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, transparent 40%, rgba(10, 10, 15, 0.3) 100%)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <p className="text-xs text-slate-600 uppercase tracking-widest">Explore</p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCT SHOWCASE — Dark glass scientific demonstration
   ══════════════════════════════════════════════════════════════════════════ */

function ProductShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="product-showcase" ref={ref} className="py-32 bg-[#0f0f14] relative overflow-hidden border-t border-slate-800/30">
      <StarField />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <p className="text-xs font-medium text-teal-400/70 uppercase tracking-[0.15em] mb-4">In Action</p>
          <h2 className="text-4xl md:text-6xl font-black text-[#f8f8f2] mb-6">
            See QUBIT in action
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            Watch how learners build quantum circuits, run experiments, and analyze results
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* YouTube video embed container */}
          <div className="relative border border-slate-700/30 bg-slate-950/40 backdrop-blur-sm overflow-hidden shadow-2xl aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/SruS1qkbM0A?autoplay=1&mute=1&loop=1&playlist=SruS1qkbM0A&controls=0&showinfo=0&rel=0&modestbranding=1"
              title="QUBIT Interactive Quantum Learning"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 border border-teal-600/20 bg-slate-950/60 backdrop-blur-md">
                  <div className="w-1.5 h-1.5 bg-teal-400/80" />
                  <span className="text-xs font-medium text-teal-100/80 tracking-wide">Interactive Lesson</span>
                </div>
                <p className="text-sm font-medium text-slate-200 px-3">Codebook: Quantum Gates & Circuits</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CORE FEATURES — Scientific editorial plates with dark glass
   ══════════════════════════════════════════════════════════════════════════ */

function CoreFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-32 bg-[#0a0a0f] relative overflow-hidden border-t border-slate-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <p className="text-xs font-medium text-amber-400/70 uppercase tracking-[0.15em] mb-4">Complete Platform</p>
          <h2 className="text-5xl md:text-6xl font-black text-[#f8f8f2] mb-6">
            Everything you need to master<br />quantum computing
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* CODEBOOK — Vertical editorial plate */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="group relative border border-slate-700/30 bg-slate-950/30 backdrop-blur-sm p-8 overflow-hidden hover:border-teal-600/40 hover:bg-slate-950/50 transition-all duration-500 flex flex-col min-h-[600px]"
          >
            {/* Illustration area - top portion */}
            <div className="relative h-64 -mx-8 -mt-8 mb-8 overflow-hidden opacity-20 group-hover:opacity-30 transition-opacity duration-500 border-b border-slate-800/30">
              <Image
                src="/illustrations/studentstudying.svg"
                alt="Learning"
                fill
                className="object-cover object-center"
              />
            </div>

            {/* Content */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 border border-teal-600/30 bg-teal-950/20 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-teal-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#f8f8f2] mb-1">Codebook</h3>
                <p className="text-xs font-medium text-teal-400/70 tracking-[0.1em] uppercase">Interactive Learning</p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed mb-8 font-light text-[15px]">
              Structured curriculum with LaTeX math rendering, live code exercises, 
              and visual roadmap tracking. Learn quantum gates, algorithms, and theory 
              through interactive lessons.
            </p>

            {/* Technical progress representation with dark glass */}
            <div className="mt-auto space-y-3 pt-6 border-t border-slate-800/30 bg-slate-950/20 -mx-8 -mb-8 px-8 pb-8 backdrop-blur-sm">
              {[
                { name: "Quantum Basics", value: 100 },
                { name: "Gates & Circuits", value: 67 },
                { name: "Algorithms", value: 12 },
              ].map((module) => (
                <div key={module.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium tracking-wide">{module.name}</span>
                    <span className="text-slate-400 font-mono">{module.value}%</span>
                  </div>
                  <div className="h-px bg-slate-800/50 overflow-hidden">
                    <div className="h-full bg-teal-500/50" style={{ width: `${module.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* COMPOSER — Large illustration with dark glass overlay */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="group relative border border-slate-700/30 bg-slate-950/30 backdrop-blur-sm overflow-hidden hover:border-amber-600/40 hover:bg-slate-950/50 transition-all duration-500 min-h-[600px] flex flex-col"
          >
            {/* Large composer illustration */}
            <div className="absolute inset-0 opacity-12 group-hover:opacity-20 transition-opacity duration-500">
              <Image
                src="/illustrations/composer.svg"
                alt="Circuit Composer"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="relative z-10 p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 border border-amber-600/30 bg-amber-950/20 flex items-center justify-center flex-shrink-0">
                  <Zap size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#f8f8f2] mb-1">Composer</h3>
                  <p className="text-xs font-medium text-amber-400/70 tracking-[0.1em] uppercase">Visual Circuit Builder</p>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed mb-8 font-light text-[15px]">
                Drag-and-drop quantum circuit designer with live Qiskit code generation.
                Run on Aer simulator, visualize states with Bloch sphere, Q-sphere, and analyze results.
              </p>

              {/* Circuit visualization with dark glass */}
              <div className="mt-auto border border-slate-700/30 bg-slate-950/40 backdrop-blur-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 border border-amber-500/30 bg-amber-950/20 flex items-center justify-center text-amber-100 text-xs font-bold">H</div>
                  <div className="flex-1 h-px bg-slate-700/50" />
                  <div className="w-8 h-8 border border-amber-500/30 bg-amber-950/20 flex items-center justify-center text-amber-100 text-xs font-bold">X</div>
                  <div className="flex-1 h-px bg-slate-700/50" />
                  <div className="w-8 h-8 border border-amber-500/30 bg-amber-950/20 flex items-center justify-center text-amber-100 text-xs font-bold">M</div>
                </div>
                <div className="text-xs font-mono text-slate-500 bg-black/30 p-3 space-y-1 border border-slate-800/30">
                  <div className="text-teal-400">qc = QuantumCircuit(2)</div>
                  <div className="text-amber-400">qc.h(0)</div>
                  <div className="text-teal-400">qc.cx(0, 1)</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ALGORITHMS — Horizontal editorial split */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="group relative border border-slate-700/30 bg-slate-950/30 backdrop-blur-sm overflow-hidden hover:border-teal-600/40 hover:bg-slate-950/50 transition-all duration-500 min-h-[500px] flex"
          >
            {/* Left: Content */}
            <div className="relative z-10 p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 border border-teal-600/30 bg-teal-950/20 flex items-center justify-center flex-shrink-0">
                  <Network size={20} className="text-teal-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#f8f8f2] mb-1">Algorithms</h3>
                  <p className="text-xs font-medium text-teal-400/70 tracking-[0.1em] uppercase">Experimentation</p>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed mb-8 font-light text-[15px]">
                Explore Deutsch-Jozsa, Grover, QFT, VQE, and more. 
                Compare quantum vs classical complexity and visualize quantum advantage.
              </p>

              {/* Algorithm list with dark glass */}
              <div className="mt-auto space-y-2 border border-slate-700/30 bg-slate-950/40 backdrop-blur-md p-4">
                {[
                  { name: "Deutsch-Jozsa", complexity: "O(1)" },
                  { name: "Grover Search", complexity: "O(√N)" },
                  { name: "QFT", complexity: "O(n²)" },
                  { name: "VQE", complexity: "Hybrid" },
                ].map((algo) => (
                  <div key={algo.name} className="flex items-center justify-between border-b border-slate-800/30 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-300">{algo.name}</p>
                    <p className="text-xs font-mono text-teal-400/70">{algo.complexity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="relative w-64 opacity-20 group-hover:opacity-30 transition-opacity duration-500 hidden lg:block">
              <Image
                src="/illustrations/hand-drawn-flat-design-quantum-illustration_23-2149261563.svg"
                alt="Quantum algorithms"
                fill
                className="object-cover object-center"
              />
            </div>
          </motion.div>

          {/* INFRASTRUCTURE — Horizontal layout with illustration background */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="group relative border border-slate-800/50 bg-[#0f0f14] p-8 overflow-hidden hover:border-amber-700/30 transition-all duration-500 min-h-[500px] flex flex-col"
          >
            {/* Infrastructure illustration background */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Image
                src="/illustrations/clouad based quantum access.svg"
                alt="Quantum infrastructure"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 border border-amber-600/30 flex items-center justify-center flex-shrink-0">
                  <Cpu size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-100 mb-1">Infrastructure</h3>
                  <p className="text-sm font-medium text-amber-400/80 tracking-wide">Real Quantum Hardware</p>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed mb-8 font-light">
                Connect to Origin Quantum Cloud and execute on superconducting QPUs.
                From local simulation to real quantum processors (72-180 qubits).
              </p>

              {/* Infrastructure flow */}
              <div className="mt-auto space-y-3">
                {[
                  { stage: "Simulate", desc: "Qiskit Aer", status: null },
                  { stage: "Connect", desc: "Origin Cloud", status: null },
                  { stage: "Execute", desc: "72-180 Qubits", status: "Live" },
                ].map((item) => (
                  <div key={item.stage} className="flex items-center gap-4 border border-slate-800/50 bg-black/20 p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{item.stage}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {item.status && (
                      <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
                        <div className="w-1.5 h-1.5 bg-teal-400" />
                        {item.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


function ExperienceSelector() {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [selectedExp, setSelectedExp] = useState<string | null>(null);

  const experiences = [
    {
      id: "explorer",
      title: "Explorer",
      subtitle: "For kids & beginners",
      desc: "Gamified quantum discovery through interactive levels. Visual experiments, zero jargon, pure exploration.",
      illustration: "/illustrations/21742841_6505070.svg",
      features: ["Interactive games", "Visual learning", "No prerequisites", "Progress tracking"],
    },
    {
      id: "learner",
      title: "Learner",
      subtitle: "For students & professionals",
      desc: "Complete quantum education platform. Structured curriculum, circuit builder, algorithms, and hardware access.",
      illustration: "/illustrations/studentquantumcomputing.svg",
      features: ["Codebook curriculum", "Circuit composer", "Real hardware", "AI tutor"],
    },
    {
      id: "researcher",
      title: "Researcher",
      subtitle: "For advanced users",
      desc: "Research workspace with experiment management, analysis tools, literature access, and full infrastructure.",
      illustration: "/illustrations/researcher.jpg",
      features: ["Research workspace", "Experiment management", "Literature database", "Full QPU access"],
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-[#0a0a0f] relative overflow-hidden border-t border-slate-800/50">
      <StarField />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-4">Personalized Paths</p>
          <h2 className="text-5xl md:text-6xl font-black text-slate-100 mb-6">
            Choose your quantum journey
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            QUBIT adapts to your experience level, learning style, and goals
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              onClick={() => {
                setSelectedExp(exp.id);
                setTimeout(() => router.push("/select"), 600);
              }}
              onMouseEnter={() => setSelectedExp(exp.id)}
              onMouseLeave={() => setSelectedExp(null)}
              className="group relative border border-slate-800/50 bg-[#0f0f14] overflow-hidden cursor-pointer transition-all duration-500 hover:border-amber-700/30"
            >
              {/* Illustration background */}
              <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-500">
                <Image
                  src={exp.illustration}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="relative p-8 min-h-[500px] flex flex-col">
                <div className="mb-6">
                  <h3 className="text-3xl font-black text-slate-100 mb-2">{exp.title}</h3>
                  <p className="text-sm font-medium text-amber-400/80 tracking-wide">
                    {exp.subtitle}
                  </p>
                </div>

                <p className="text-slate-400 leading-relaxed mb-8 font-light">
                  {exp.desc}
                </p>

                <div className="mt-auto space-y-2.5 pt-6 border-t border-slate-800/50">
                  {exp.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-1 h-1 bg-amber-500/60" />
                      <span className="text-sm text-slate-500">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 text-slate-300 font-medium group-hover:gap-3 transition-all group-hover:text-amber-100">
                  Choose {exp.title} <ArrowRight size={16} />
                </div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {selectedExp === exp.id && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute top-6 right-6 w-8 h-8 border border-amber-500/50 bg-amber-950/40 flex items-center justify-center"
                    >
                      <ArrowRight size={16} className="text-amber-200" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   QUANTUM JOURNEY — Star-chart workflow diagram
   ══════════════════════════════════════════════════════════════════════════ */

function QuantumJourney() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const journey = [
    { label: "Learn", icon: BookOpen, desc: "Concepts & theory" },
    { label: "Build", icon: Code2, desc: "Circuits & gates" },
    { label: "Experiment", icon: Zap, desc: "Algorithms" },
    { label: "Execute", icon: Cpu, desc: "Quantum hardware" },
    { label: "Analyze", icon: Network, desc: "Results & insights" },
  ];

  return (
    <section ref={ref} className="py-32 bg-[#0f0f14] relative overflow-hidden border-t border-slate-800/50">
      {/* Technical grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <p className="text-xs font-medium text-teal-400/80 uppercase tracking-wider mb-4">The Workflow</p>
          <h2 className="text-5xl md:text-6xl font-black text-slate-100 mb-6">
            Learn → Build → Execute
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl font-light">
            A connected journey from quantum concepts to real hardware execution
          </p>
        </motion.div>

        {/* Visual journey with connecting lines */}
        <div className="relative">
          {/* Connection paths - thin technical lines */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-slate-700/50" />

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8">
            {journey.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.6, type: "spring" }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-20 h-20 border border-teal-600/30 bg-[#0a0a0f] flex items-center justify-center mb-4 relative"
                  >
                    <Icon size={28} className="text-teal-400" />
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-500/40" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-amber-500/40" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-amber-500/40" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-amber-500/40" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">{step.label}</h3>
                  <p className="text-sm text-slate-500 font-light">{step.desc}</p>

                  {/* Technical number label */}
                  <div className="absolute -top-3 -right-3 w-6 h-6 border border-teal-600/40 bg-[#0a0a0f] flex items-center justify-center text-xs font-bold text-teal-400">
                    {i + 1}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AI INTEGRATION — Technical assistance
   ══════════════════════════════════════════════════════════════════════════ */

function AIIntegration() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-32 bg-[#0a0a0f] relative overflow-hidden border-t border-slate-800/50">
      <StarField />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-3 py-1 border border-teal-600/30 mb-6">
              <span className="text-xs font-medium text-teal-400/80 tracking-wider uppercase flex items-center gap-2">
                <Bot size={14} />
                AI-Powered
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-6">
              AI assistant throughout<br />your quantum journey
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 font-light">
              Intelligent help embedded across the platform. Understand concepts, 
              debug circuits, analyze results, and accelerate your learning.
            </p>

            <div className="space-y-3">
              {[
                "Explain quantum concepts in natural language",
                "Debug and optimize quantum circuits",
                "Generate code and suggest improvements",
                "Interpret measurement results",
                "Guide research and exploration",
              ].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1 h-1 bg-teal-500/60 mt-2 flex-shrink-0" />
                  <p className="text-slate-400 font-light">{feature}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            {/* AI Chat interface mockup */}
            <div className="border border-slate-700/50 bg-black/40 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/50">
                <div className="w-10 h-10 border border-teal-600/30 flex items-center justify-center">
                  <Bot size={20} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">QUBIT AI</p>
                  <p className="text-xs text-slate-500">Always here to help</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/60 p-4 border-l-2 border-slate-700">
                  <p className="text-sm text-slate-300 font-light">
                    Can you explain what a Hadamard gate does?
                  </p>
                </div>

                <div className="bg-teal-950/20 border border-teal-800/30 p-4 border-l-2 border-l-teal-600/50">
                  <p className="text-sm text-slate-200 leading-relaxed font-light">
                    The Hadamard gate creates superposition. It transforms |0⟩ into an equal combination 
                    of |0⟩ and |1⟩, and vice versa. Think of it as putting a qubit in both states at once.
                  </p>
                  <div className="mt-3 pt-3 border-t border-teal-800/20">
                    <p className="text-xs text-teal-400/80">Would you like to see it in action?</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMMUNITY & DISCOVER — Editorial layout
   ══════════════════════════════════════════════════════════════════════════ */

function CommunitySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-32 bg-[#0f0f14] relative overflow-hidden border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative border border-slate-700/50 overflow-hidden">
              <Image
                src="/illustrations/newsupdate.jpg"
                alt="Quantum community and discovery"
                width={600}
                height={400}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-600/30 bg-black/60 mb-3">
                  <Newspaper size={14} className="text-amber-400" />
                  <span className="text-xs font-medium text-amber-100/90">Latest Updates</span>
                </div>
                <p className="text-slate-100 font-medium text-lg">Quantum news, research, and breakthroughs</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-3 py-1 border border-amber-600/30 mb-6">
              <span className="text-xs font-medium text-amber-400/80 tracking-wider uppercase flex items-center gap-2">
                <Users size={14} />
                Community
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-6">
              Discover & connect with the quantum community
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 font-light">
              Stay updated with quantum computing news, research papers, hardware developments, 
              and connect with learners and researchers worldwide.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Quantum News", icon: Newspaper },
                { label: "Research Papers", icon: BookOpen },
                { label: "Algorithm Library", icon: Code2 },
                { label: "Community Forum", icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 p-4 border border-slate-800/50 bg-black/20 hover:border-teal-700/30 transition-all">
                    <Icon size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-300">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FINAL CTA — Dark astronomical composition
   ══════════════════════════════════════════════════════════════════════════ */

function FinalCTA() {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section ref={ref} className="py-32 bg-[#0a0a0f] relative overflow-hidden border-t border-slate-800/50">
      <StarField />

      {/* Large background illustration - subtle */}
      <div className="absolute inset-0 opacity-5">
        <Image
          src="/illustrations/hand-drawn-flat-design-quantum-illustration_23-2149261563.svg"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.9 }}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <h2 className="text-5xl md:text-7xl font-black text-slate-100 mb-6 leading-tight">
            Start your quantum<br />computing journey
          </h2>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
            Join learners, students, and researchers exploring the future of computing
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push("/select")}
              className="group px-10 py-5 border border-amber-600/50 bg-amber-950/20 text-amber-100 hover:bg-amber-950/40 transition-all text-lg font-medium tracking-wide flex items-center gap-3"
            >
              Get Started Free 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push("/auth/login")}
              className="px-10 py-5 border border-slate-700/50 text-slate-300 hover:border-slate-600 hover:text-slate-200 transition-all text-lg font-medium tracking-wide"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <Navigation />
      <Hero />
      <ProductShowcase />
      <CoreFeatures />
      <QuantumJourney />
      <ExperienceSelector />
      <AIIntegration />
      <CommunitySection />
      <FinalCTA />
    </main>
  );
}

