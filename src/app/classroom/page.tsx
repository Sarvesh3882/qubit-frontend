"use client";
/**
 * /classroom  — Unified Classroom Dashboard
 *
 * A single page with two independent sections:
 *
 *   ── TEACHER PANEL  (always shown when is_instructor=true)
 *      My Classes list + Create Classroom modal
 *
 *   ── STUDENT PANEL  (always shown to all users)
 *      Enrolled classrooms + Join by invite code
 *
 * Both sections load simultaneously. An instructor sees both.
 * A pure student sees only the student section.
 * There are no redirects — everyone lands here from the nav.
 */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, Plus, Users, BookOpen, Copy, Check,
  ArrowRight, Loader2, AlertCircle, KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { classroomApi } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface ClassroomSummary {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  student_count: number;
  assignment_count: number;
  created_at: string;
  is_active: boolean;
}

interface EnrolledClassroom extends ClassroomSummary {
  instructor_name?: string;
  joined_at?: string;
}

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const C = {
  bg: "#fafafa", card: "#ffffff", border: "#e4e4e7",
  text: "#111118", muted: "#52525b", subtle: "#a1a1aa",
  brand: "#4f46e5", brandH: "#4338ca", brandSub: "#eef2ff",
  success: "#16a34a", successBg: "#f0fdf4",
  divider: "#f0f0f2",
};

/* ════════════════════════════════════════════════════════════════════════════ */
export default function ClassroomPage() {
  const { user } = useAuthStore();

  /* ── Teacher state ────────────────────────────────────────────────────── */
  const [myClasses,     setMyClasses]     = useState<ClassroomSummary[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError,   setTeacherError]   = useState<string | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [formName,      setFormName]      = useState("");
  const [formDesc,      setFormDesc]      = useState("");
  const [copiedId,      setCopiedId]      = useState<number | null>(null);

  /* ── Student state ────────────────────────────────────────────────────── */
  const [enrolled,       setEnrolled]       = useState<EnrolledClassroom[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError,   setStudentError]   = useState<string | null>(null);
  const [code,           setCode]           = useState("");
  const [joining,        setJoining]        = useState(false);

  /* ── Load teacher classrooms ──────────────────────────────────────────── */
  const loadTeacher = useCallback(async () => {
    if (!user?.is_instructor) return;
    setTeacherLoading(true); setTeacherError(null);
    try {
      const res = await classroomApi.mine();
      setMyClasses(res.data ?? []);
    } catch {
      setTeacherError("Could not load your classrooms.");
    } finally {
      setTeacherLoading(false);
    }
  }, [user]);

  /* ── Load enrolled classrooms ────────────────────────────────────────── */
  const loadEnrolled = useCallback(async () => {
    setStudentLoading(true); setStudentError(null);
    try {
      const res = await classroomApi.enrolled();
      setEnrolled(res.data ?? []);
    } catch {
      setStudentError("Could not load enrolled classrooms.");
    } finally {
      setStudentLoading(false);
    }
  }, []);

  useEffect(() => { loadTeacher(); }, [loadTeacher]);
  useEffect(() => { loadEnrolled(); }, [loadEnrolled]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const res = await classroomApi.create({ name: formName.trim(), description: formDesc.trim() || undefined });
      setMyClasses(prev => [res.data, ...prev]);
      setShowCreate(false); setFormName(""); setFormDesc("");
      toast.success(`"${res.data.name}" created`);
    } catch {
      toast.error("Failed to create classroom");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (cls: ClassroomSummary) => {
    navigator.clipboard.writeText(cls.invite_code).then(() => {
      setCopiedId(cls.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Invite code copied");
    });
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    try {
      const res = await classroomApi.join(code.trim().toUpperCase());
      if (!enrolled.find(c => c.id === res.data.id)) {
        setEnrolled(prev => [{ ...res.data, instructor_name: "", joined_at: new Date().toISOString() }, ...prev]);
      }
      // If instructor, also refresh teacher list (they may have re-joined their own class — not possible but refresh anyway)
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

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-48px)]" style={{ background: C.bg }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-8 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: C.subtle }}>
            QUBIT · Classroom
          </p>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>Classroom</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            {user.is_instructor
              ? "Manage your classes and join others as a student."
              : "Join classrooms and complete assigned content."}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-10">

        {/* ══════════════════════════════════════════════════════════════
            TEACHER PANEL — only rendered for instructors
        ══════════════════════════════════════════════════════════════ */}
        {user.is_instructor && (
          <section>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: C.text }}>
                  <GraduationCap size={17} style={{ color: C.brand }} />
                  My Classes
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ background: C.brandSub, color: C.brand }}>Instructor</span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: C.subtle }}>
                  Classrooms you created and manage.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: C.brand }}
                onMouseEnter={e => (e.currentTarget.style.background = C.brandH)}
                onMouseLeave={e => (e.currentTarget.style.background = C.brand)}
              >
                <Plus size={13} /> New Classroom
              </button>
            </div>

            {/* Teacher error */}
            {teacherError && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-3"
                   style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                <AlertCircle size={13} /> {teacherError}
              </div>
            )}

            {/* Loading */}
            {teacherLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: C.subtle }} />
              </div>
            )}

            {/* Empty */}
            {!teacherLoading && !teacherError && myClasses.length === 0 && (
              <div className="rounded-2xl py-12 text-center"
                   style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                     style={{ background: C.brandSub }}>
                  <GraduationCap size={22} style={{ color: C.brand }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: C.text }}>No classrooms yet</p>
                <p className="text-xs mb-4" style={{ color: C.muted }}>
                  Create one and share the invite code with your students.
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-semibold text-white"
                  style={{ background: C.brand }}
                >
                  <Plus size={12} /> Create classroom
                </button>
              </div>
            )}

            {/* Classroom grid */}
            {!teacherLoading && myClasses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myClasses.map(cls => (
                  <div key={cls.id} className="rounded-2xl p-5 flex flex-col gap-3"
                       style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    {/* Name + icon */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: C.brandSub }}>
                        <GraduationCap size={16} style={{ color: C.brand }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: C.text }}>{cls.name}</h3>
                        {cls.description && (
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.muted }}>{cls.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                        <Users size={11} /> {cls.student_count}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                        <BookOpen size={11} /> {cls.assignment_count}
                      </span>
                    </div>

                    {/* Invite code */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                         style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <code className="flex-1 text-xs font-mono font-bold tracking-widest text-center"
                            style={{ color: C.brand }}>{cls.invite_code}</code>
                      <button onClick={() => copyCode(cls)} className="p-1 rounded hover:bg-[#f0f0f2]"
                              title="Copy">
                        {copiedId === cls.id
                          ? <Check size={12} style={{ color: C.success }} />
                          : <Copy size={12} style={{ color: C.subtle }} />}
                      </button>
                    </div>

                    {/* Open */}
                    <Link href={`/classroom/${cls.id}`}
                          className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: C.brandSub, color: C.brand }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e0e7ff"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brandSub; }}>
                      Manage <ArrowRight size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Divider between sections (only when instructor) */}
        {user.is_instructor && (
          <hr style={{ borderColor: C.divider }} />
        )}

        {/* ══════════════════════════════════════════════════════════════
            STUDENT PANEL — shown to everyone
        ══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: C.text }}>
                <BookOpen size={16} style={{ color: C.muted }} />
                {user.is_instructor ? "Enrolled as Student" : "My Classrooms"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: C.subtle }}>
                Classrooms you joined using an invite code.
              </p>
            </div>
          </div>

          <div className="flex gap-6 flex-col md:flex-row">

            {/* Join card */}
            <div className="w-full md:w-64 shrink-0">
              <div className="rounded-2xl p-5 sticky top-20"
                   style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                       style={{ background: C.brandSub }}>
                    <KeyRound size={13} style={{ color: C.brand }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: C.text }}>Join a Classroom</h3>
                </div>
                <p className="text-xs mb-3" style={{ color: C.muted }}>
                  Enter the invite code from your instructor.
                </p>
                <form onSubmit={handleJoin} className="space-y-2">
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="QUBIT-XXXX"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono text-center focus:outline-none"
                    style={{ borderColor: C.border, color: C.brand, letterSpacing: "0.12em" }}
                    autoComplete="off" spellCheck={false}
                  />
                  <button
                    type="submit"
                    disabled={joining || !code.trim()}
                    className="w-full h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                    style={{ background: C.brand }}
                    onMouseEnter={e => { if (!joining) (e.currentTarget as HTMLElement).style.background = C.brandH; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brand; }}
                  >
                    {joining ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Enrolled list */}
            <div className="flex-1 min-w-0">
              {studentError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm mb-3"
                     style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  <AlertCircle size={13} /> {studentError}
                </div>
              )}

              {studentLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin" style={{ color: C.subtle }} />
                </div>
              ) : enrolled.length === 0 ? (
                <div className="rounded-2xl py-12 text-center"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <p className="text-sm font-medium mb-1" style={{ color: C.muted }}>
                    Not enrolled in any classroom
                  </p>
                  <p className="text-xs" style={{ color: C.subtle }}>
                    Enter an invite code on the left to join.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolled.map(cls => (
                    <div key={cls.id}
                         className="rounded-xl p-4 flex items-center gap-3"
                         style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: C.brandSub }}>
                        <GraduationCap size={16} style={{ color: C.brand }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: C.text }}>{cls.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {cls.instructor_name && (
                            <span className="text-xs" style={{ color: C.muted }}>by {cls.instructor_name}</span>
                          )}
                          <span className="flex items-center gap-1 text-xs" style={{ color: C.subtle }}>
                            <BookOpen size={10} /> {cls.assignment_count}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: C.subtle }}>
                            <Users size={10} /> {cls.student_count}
                          </span>
                        </div>
                      </div>
                      <Link href={`/classroom/student/${cls.id}`}
                            className="flex items-center gap-1 px-3 h-7 rounded-lg text-xs font-semibold shrink-0"
                            style={{ background: C.brandSub, color: C.brand }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e0e7ff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brandSub; }}>
                        View <ArrowRight size={10} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* ── Create classroom modal ───────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.35)" }}
             onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); }}}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6"
               style={{ background: C.card }}>
            <h2 className="text-base font-bold mb-1" style={{ color: C.text }}>New Classroom</h2>
            <p className="text-xs mb-5" style={{ color: C.muted }}>
              A unique invite code will be generated automatically.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: C.muted }}>
                  Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  autoFocus value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Quantum Foundations 101"
                  maxLength={80}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ borderColor: C.border, color: C.text }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: C.muted }}>
                  Description <span style={{ color: C.subtle }}>(optional)</span>
                </label>
                <textarea
                  value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  placeholder="Brief description…"
                  rows={2} maxLength={300}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none"
                  style={{ borderColor: C.border, color: C.text }}
                />
              </div>
              <div className="flex gap-3">
                <button type="button"
                        onClick={() => { setShowCreate(false); setFormName(""); setFormDesc(""); }}
                        className="flex-1 h-9 rounded-lg border text-sm font-medium"
                        style={{ borderColor: C.border, color: C.muted }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating || !formName.trim()}
                        className="flex-1 h-9 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: C.brand }}
                        onMouseEnter={e => { if (!creating) (e.currentTarget as HTMLElement).style.background = C.brandH; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.brand; }}>
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
