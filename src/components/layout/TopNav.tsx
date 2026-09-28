"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useExperienceStore } from "@/store/experienceStore";
import Button from "@/components/ui/Button";
import { ChevronDown, LogOut, User, Menu, X, Layers, GraduationCap } from "lucide-react";

const BASE_NAV = [
  { href: "/codebook",       label: "Codebook"       },
  { href: "/learning-path",  label: "Learning Path"  },
  { href: "/composer",       label: "Composer"       },
  { href: "/playground",     label: "Playground"     },
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/discover",       label: "Discover"       },
  { href: "/community",      label: "Community"      },
];

// Instructor-only nav item — appended when user.is_instructor === true
const INSTRUCTOR_NAV = { href: "/classroom", label: "Classroom", instructor: true };

export default function TopNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout }         = useAuthStore();
  const { experience, setExperience } = useExperienceStore();
  const [menuOpen, setMenuOpen]  = useState(false);
  const [userOpen, setUserOpen]  = useState(false);
  const [xpOpen,   setXpOpen]    = useState(false);

  // Build nav — everyone goes to /classroom (unified dashboard)
  const NAV = user
    ? [...BASE_NAV, { href: "/classroom", label: "Classroom", instructor: user.is_instructor }]
    : BASE_NAV;

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 h-12 bg-white border-b border-[#e4e4e7] flex items-center">
      <div className="w-full max-w-screen-2xl mx-auto px-5 flex items-center gap-6">

        {/* Wordmark */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[#111118] shrink-0 select-none"
        >
          QUBIT
        </Link>

        <div className="h-4 w-px bg-[#e4e4e7]" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto">
          {NAV.map(({ href, label, ...rest }) => {
            const isInstructor = (rest as { instructor?: boolean }).instructor;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 h-8 flex items-center gap-1.5 text-sm rounded whitespace-nowrap transition-colors duration-100",
                  active
                    ? "text-[#111118] font-medium bg-[#f0f0f2]"
                    : "text-[#52525b] hover:text-[#111118] hover:bg-[#f7f7f8]"
                )}
              >
                {isInstructor && <GraduationCap size={13} className="shrink-0 text-[#4f46e5]" />}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">

          {/* Experience switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setXpOpen(!xpOpen)}
              className="flex items-center gap-1 px-2 h-7 rounded text-xs text-[#52525b] hover:bg-[#f0f0f2] hover:text-[#111118] transition-colors border border-[#e4e4e7]"
              title="Switch experience"
            >
              <Layers size={12} />
              <span className="hidden lg:block">
                {experience === "explorer" ? "Explorer" : experience === "researcher" ? "Researcher" : "Learner"}
              </span>
              <ChevronDown size={10} className="text-[#a1a1aa]" />
            </button>
            {xpOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setXpOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-[#e4e4e7] shadow-md py-1 z-50">
                  {[
                    { id: "learner"    as const, label: "Learner",    href: "/codebook",  desc: "Students & professionals" },
                    { id: "explorer"   as const, label: "Explorer",   href: "/explorer",  desc: "Kids & beginners" },
                    { id: "researcher" as const, label: "Researcher", href: "/research",  desc: "Advanced users" },
                  ].map((xp) => (
                    <button
                      key={xp.id}
                      onClick={() => { setExperience(xp.id); setXpOpen(false); router.push(xp.href); }}
                      className={cn(
                        "w-full flex flex-col px-3 py-2 text-left hover:bg-[#f7f7f8] transition-colors",
                        experience === xp.id || (!experience && xp.id === "learner")
                          ? "bg-[#f0f0f2]" : ""
                      )}
                    >
                      <span className="text-xs font-semibold text-[#111118]">{xp.label}</span>
                      <span className="text-[10px] text-[#a1a1aa]">{xp.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-1.5 px-2 h-8 rounded text-sm text-[#52525b] hover:bg-[#f0f0f2] hover:text-[#111118] transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-[#4f46e5] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {user.username[0].toUpperCase()}
                </span>
                <span className="hidden sm:block">{user.username}</span>
                <ChevronDown size={12} className="text-[#a1a1aa]" />
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#e4e4e7] shadow-md py-1 z-50">
                    <div className="px-3 py-2 border-b border-[#f0f0f2]">
                      <p className="text-[11px] text-[#a1a1aa]">Signed in as</p>
                      <p className="text-xs font-medium text-[#111118] truncate">{user.email}</p>
                      {user.is_instructor && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#eef2ff] text-[#4338ca]">
                          <GraduationCap size={9} /> Instructor
                        </span>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#52525b] hover:bg-[#f7f7f8] hover:text-[#111118] transition-colors"
                      onClick={() => setUserOpen(false)}
                    >
                      <User size={13} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/register"><Button size="sm">Get started</Button></Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 rounded text-[#52525b] hover:bg-[#f0f0f2] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white border-b border-[#e4e4e7] px-5 py-2 flex flex-col gap-0.5 shadow-sm z-50">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded text-sm transition-colors",
                  active ? "text-[#111118] font-medium bg-[#f0f0f2]" : "text-[#52525b] hover:bg-[#f7f7f8]"
                )}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-[#f0f0f2] mt-1 pt-1">
            {[
              { id: "learner"    as const, label: "Switch to Learner",    href: "/codebook"  },
              { id: "explorer"   as const, label: "Switch to Explorer",   href: "/explorer" },
              { id: "researcher" as const, label: "Switch to Researcher", href: "/research" },
            ].map((xp) => (
              <button
                key={xp.id}
                onClick={() => { setExperience(xp.id); setMenuOpen(false); router.push(xp.href); }}
                className="w-full text-left px-3 py-2 text-xs text-[#52525b] hover:bg-[#f7f7f8] rounded transition-colors"
              >
                {xp.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
