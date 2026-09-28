"use client";
import { motion } from "framer-motion";
import { ExternalLink, Users, MessageSquare, BookOpen, Calendar } from "lucide-react";

const COMMUNITIES: {
  category: string;
  icon: React.ElementType;
  color: string;
  items: { name: string; desc: string; url: string; members?: string }[];
}[] = [
  {
    category: "Reddit Communities",
    icon: MessageSquare,
    color: "#ff4500",
    items: [
      { name: "r/QuantumComputing",   desc: "The main quantum computing community on Reddit — news, discussions, beginner questions welcome.",    url: "https://reddit.com/r/quantumcomputing",  members: "90k+" },
      { name: "r/Qiskit",             desc: "Qiskit-specific discussions, help with IBM Quantum circuits and SDK questions.",                     url: "https://reddit.com/r/Qiskit",           members: "8k+"  },
      { name: "r/Physics",            desc: "Broader physics community — quantum mechanics questions fit naturally here.",                         url: "https://reddit.com/r/physics",          members: "2.4M+" },
    ],
  },
  {
    category: "Discord Servers",
    icon: Users,
    color: "#5865f2",
    items: [
      { name: "Qiskit Community",     desc: "Official Qiskit Discord — IBM Quantum engineers, educators, and learners. Active help channels.",     url: "https://discord.gg/IBM-Quantum",        members: "15k+" },
      { name: "PennyLane",            desc: "Xanadu's official server for PennyLane, quantum ML, and Strawberry Fields discussions.",              url: "https://discord.gg/pennylane",          members: "10k+" },
      { name: "The Quantum Insider",  desc: "Quantum computing news, jobs, and community discussions.",                                           url: "https://thequantuminsider.com",         members: "5k+"  },
    ],
  },
  {
    category: "Learning Resources",
    icon: BookOpen,
    color: "#4f46e5",
    items: [
      { name: "IBM Quantum Learning",     desc: "Free, structured quantum computing courses directly from IBM. Uses Qiskit throughout.",           url: "https://learning.quantum.ibm.com"  },
      { name: "PennyLane Codebook",       desc: "The interactive learning platform that inspired QUBIT's Codebook. 60+ lessons with codercises.",  url: "https://pennylane.ai/codebook"     },
      { name: "Quantum Country",          desc: "Spaced-repetition quantum computing course by Andy Matuschak and Michael Nielsen.",              url: "https://quantum.country"           },
      { name: "arXiv quant-ph",           desc: "Pre-print repository for quantum computing papers. Search for algorithms, hardware, error correction.", url: "https://arxiv.org/archive/quant-ph" },
      { name: "Nielsen & Chuang (QCQI)",  desc: "Quantum Computation and Quantum Information — the standard textbook. Available via university libraries.", url: "https://www.cambridge.org/9781107002173" },
    ],
  },
  {
    category: "Forums & Q&A",
    icon: MessageSquare,
    color: "#0891b2",
    items: [
      { name: "Quantum Computing Stack Exchange", desc: "Q&A for quantum computing researchers and practitioners — very high quality answers.",  url: "https://quantumcomputing.stackexchange.com" },
      { name: "Qiskit Slack",                     desc: "IBM Quantum Slack workspace — direct access to the Qiskit team and community.",        url: "https://qisk.it/slack"                     },
    ],
  },
  {
    category: "Conferences & Events",
    icon: Calendar,
    color: "#059669",
    items: [
      { name: "IEEE Quantum Week (QCE)",  desc: "Annual IEEE conference on quantum computing, communication and sensing.",                        url: "https://qce.quantum.ieee.org"       },
      { name: "QIP (Quantum Information Processing)", desc: "Premier annual conference for quantum information research.",                       url: "https://qipconference.org"          },
      { name: "Q2B Conference",          desc: "Practical quantum computing — focused on industry applications and near-term hardware.",         url: "https://q2b.qcware.com"             },
    ],
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f8]">

      {/* Header */}
      <div className="bg-white border-b border-[#e4e4e7]">
        <div className="max-w-4xl mx-auto px-8 py-7">
          <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-1.5">
            QUBIT · Learner
          </p>
          <h1 className="text-2xl font-bold text-[#111118]">Community</h1>
          <p className="text-sm text-[#52525b] mt-1 max-w-xl">
            The quantum computing community is genuinely welcoming to beginners.
            These are the best places to ask questions, find collaborators, and stay current.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-10">
        {COMMUNITIES.map((section, si) => (
          <motion.section
            key={section.category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                style={{ background: `${section.color}15` }}
              >
                <section.icon size={13} style={{ color: section.color }} />
              </div>
              <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest">
                {section.category}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[#e4e4e7] overflow-hidden">
              {section.items.map((item, ii) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-start gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors ${ii < section.items.length - 1 ? "border-b border-[#f0f0f2]" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#111118] group-hover:text-[#4f46e5] transition-colors">
                        {item.name}
                      </span>
                      {item.members && (
                        <span className="text-[10px] text-[#a1a1aa] border border-[#e4e4e7] rounded-full px-1.5 py-0.5">
                          {item.members}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#71717a] leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                  <ExternalLink size={12} className="text-[#d4d4d8] group-hover:text-[#4f46e5] shrink-0 mt-0.5 transition-colors" />
                </a>
              ))}
            </div>
          </motion.section>
        ))}

        <p className="text-[10px] text-[#a1a1aa] text-center pb-4">
          All links open their respective external platforms. QUBIT is not affiliated with these communities.
        </p>
      </div>
    </div>
  );
}
