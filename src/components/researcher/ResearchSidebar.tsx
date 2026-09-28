"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useExperienceStore } from "@/store/experienceStore";
import { cn } from "@/lib/utils";
import {
  FlaskConical, BarChart2, Cpu, Layers2, BookOpen,
  Newspaper, Layers,
} from "lucide-react";

const NAV = [
  { href: "/research",               icon: FlaskConical, label: "Workbench",      section: "workspace" },
  { href: "/research/experiments",   icon: Layers2,      label: "Experiments",    section: "workspace" },
  { href: "/research/analysis",      icon: BarChart2,    label: "Analysis",       section: "workspace" },
  { href: "/research/algorithms",    icon: Cpu,          label: "Algorithms",     section: "workspace" },
  { href: "/research/infrastructure",icon: Layers,       label: "Infrastructure", section: "workspace" },
  { href: "/research/literature",    icon: BookOpen,     label: "Literature",     section: "intelligence" },
  { href: "/research/intel",         icon: Newspaper,    label: "Research Intel", section: "intelligence" },
];

const SECTIONS = [
  { id: "workspace",    label: "Workspace"   },
  { id: "intelligence", label: "Intelligence" },
];

export default function ResearchSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { setExperience } = useExperienceStore();

  return (
    <aside
      className="w-[196px] shrink-0 flex flex-col border-r h-screen sticky top-0 overflow-y-auto"
      style={{ borderColor: "#21262d", background: "#010409" }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-4 h-12 border-b shrink-0" style={{ borderColor: "#21262d" }}>
        <span className="text-sm font-bold text-[#e6edf3] tracking-tight">QUBIT</span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded ml-auto shrink-0"
          style={{ background: "#58a6ff15", color: "#58a6ff", border: "1px solid #58a6ff30" }}
        >
          Research
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {SECTIONS.map((sec) => {
          const items = NAV.filter((n) => n.section === sec.id);
          return (
            <div key={sec.id}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
                style={{ color: "#484f58" }}
              >
                {sec.label}
              </p>
              {items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/research" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className={cn(
                        "flex items-center gap-2.5 px-2 h-8 rounded-md text-xs font-medium transition-colors",
                        active
                          ? "bg-[#1f2937] text-[#e6edf3]"
                          : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#161b22]"
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom — switch experience */}
      <div className="px-2 pb-4 border-t pt-3 space-y-1" style={{ borderColor: "#21262d" }}>
        <button
          onClick={() => { setExperience("learner"); router.push("/codebook"); }}
          className="w-full flex items-center gap-2.5 px-2 h-8 rounded-md text-xs text-[#484f58] hover:text-[#7d8590] hover:bg-[#161b22] transition-colors"
        >
          <Layers size={12} /> Switch to Learner
        </button>
      </div>
    </aside>
  );
}
