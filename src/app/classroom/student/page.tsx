"use client";
/**
 * /classroom/student  — Student: enrolled classrooms + join with code
 *
 * Instructors are redirected to /classroom.
 *
 * Layout:
 *   Left panel  — join with invite code
 *   Right panel — list of enrolled classrooms
 */
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Plus, ArrowRight, Loader2,
  AlertCircle, BookOpen, Users, KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { classroomApi } from "@/lib/api";

interface EnrolledClassroom {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  student_count: number;
  assignment_count: number;
  instructor_name: string;
  joined_at: string;
  is_active: boolean;
}

const C = {
  bg: "#fafafa", card: "#ffffff", border: "#e4e4e7",
  text: "#111118", muted: "#52525b", subtle: "#a1a1aa",
  brand: "#4f46e5", brandH: "#4338ca", brandSub: "#eef2ff",
};

export default function StudentClassroomPage() {
  const router        = useRouter();
  const { user }      = useAuthStore();
  const [classrooms, setClassrooms] = useState<EnrolledClassroom[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Join form
  const [code,    setCode]    = useState("");
  const [joining, setJoining] = useState(false);

  // No redirect — both instructors and students can visit the student detail page

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await classroomApi.enrolled();
      setClassrooms(res.data ?? []);
    } catch {
      setError("Could not load classrooms. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    try {
      const res = await classroomApi.join(code.trim().toUpperCase());
      const cls: EnrolledClassroom = { ...res.data, instructor_name: "", joined_at: new Date().toISOString() };
      // If already in list, skip; otherwise prepend
      if (!classrooms.find(c => c.id === cls.id)) {
        setClassrooms(prev => [cls, ...prev]);
      }
      setCode("");
      toast.success(`Joined "${res.data.name}"!`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail ?? "Could not join classroom";
      toast.error(typeof msg === "string" ? msg : "Could not join classroom");
    } finally {
      setJoining(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-48px)]" style={{ background: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-8 py-7">
          <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-widest mb-1.5">
            QUBIT · Learner
          </p>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>My Classrooms</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            Join a class with an invite code, then complete assigned content to track your progress.
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-8 flex gap-8 flex-col md:flex-row">

        {/* ── Left: join card ───────────────────────────────────────── */}
        <div className="w-full md:w-72 shrink-0">
          <div className="rounded-2xl p-6 sticky top-20"
               style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: C.brandSub }}>
                <KeyRound size={15} style={{ color: C.brand }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: C.text }}>Join a Classroom</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: C.muted }}>
              Ask your instructor for the invite code — it looks like <code className="font-mono font-semibold" style={{ color: C.brand }}>QUBIT-XXXX</code>.
            </p>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="QUBIT-XXXX"
                maxLength={10}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2"
                style={{ borderColor: C.border, color: C.brand, letterSpacing: "0.15em" }}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={joining || !code.trim()}
                className="w-full h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{ background: C.brand }}
                onMouseEnter={e => { if (!joining) (e.currentTarget as HTMLElement).style.background = C.brandH; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brand; }}
              >
                {joining ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Join Classroom
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: enrolled list ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl border mb-4 text-sm"
                 style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin" style={{ color: C.subtle }} />
            </div>
          ) : classrooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                   style={{ background: C.brandSub }}>
                <GraduationCap size={26} style={{ color: C.brand }} />
              </div>
              <h2 className="text-base font-semibold mb-2" style={{ color: C.text }}>No classrooms yet</h2>
              <p className="text-sm" style={{ color: C.muted }}>
                Enter an invite code on the left to join your first class.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classrooms.map(cls => (
                <div key={cls.id}
                     className="rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-sm"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: C.brandSub }}>
                    <GraduationCap size={20} style={{ color: C.brand }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: C.text }}>{cls.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {cls.instructor_name && (
                        <span className="text-xs" style={{ color: C.muted }}>
                          by {cls.instructor_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.subtle }}>
                        <BookOpen size={11} /> {cls.assignment_count} assignment{cls.assignment_count !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.subtle }}>
                        <Users size={11} /> {cls.student_count} student{cls.student_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/classroom/student/${cls.id}`}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    style={{ background: C.brandSub, color: C.brand }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e0e7ff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brandSub; }}
                  >
                    View <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
