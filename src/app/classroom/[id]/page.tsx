"use client";
/**
 * /classroom/[id]  — Teacher classroom detail
 *
 * Four tabs:
 *   Overview    — name, invite code, quick stats
 *   Students    — enrolled list with per-student progress
 *   Assignments — assign content; manage existing assignments
 *   Analytics   — class-wide mastery, quiz, codercise, attention list
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, ArrowLeft, Users, BookOpen, BarChart2,
  LayoutGrid, Copy, Check, Plus, Trash2, Loader2,
  AlertCircle, ChevronDown, Calendar, CheckCircle2,
  Clock, AlertTriangle, TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { classroomApi } from "@/lib/api";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface ClassroomDetail {
  id: number; name: string; description: string | null;
  invite_code: string; student_count: number; assignment_count: number;
  created_at: string; is_active: boolean;
}
interface Student {
  student_id: number; username: string; full_name: string | null;
  email: string; joined_at: string; completed_lessons: number;
  passed_codercises: number; avg_quiz_score: number; quizzes_attempted: number;
}
interface Assignment {
  id: number; content_type: string; content_id: string;
  title: string; due_date: string | null; assigned_at: string;
}
interface Analytics {
  total_students: number; active_students: number;
  module_mastery: { module_id: string; title: string; mastery_pct: number; mastered: number; total: number }[];
  quiz_performance: { quiz_id: string; module_title: string; attempted: number; avg_score: number; passed: number; total: number }[];
  codercise_performance: { module_id: string; title: string; completion_pct: number; avg_passed: number; total_in_module: number; total_students: number }[];
  assignment_completion: { assignment_id: number; content_type: string; content_id: string; title: string; due_date: string | null; completed: number; total: number; completion_pct: number }[];
  needs_attention: { student_id: number; username: string; completion_pct: number; completed: number; total_assigned: number }[];
}

/* ── Colour tokens ───────────────────────────────────────────────────────── */
const C = {
  bg: "#fafafa", card: "#ffffff", border: "#e4e4e7",
  text: "#111118", muted: "#52525b", subtle: "#a1a1aa",
  brand: "#4f46e5", brandH: "#4338ca", brandSub: "#eef2ff",
  success: "#16a34a", successBg: "#f0fdf4",
  warning: "#d97706", warningBg: "#fffbeb",
  error: "#dc2626", errorBg: "#fef2f2",
};

const CONTENT_TYPES = [
  { value: "module",    label: "Module"     },
  { value: "lesson",    label: "Lesson"     },
  { value: "quiz",      label: "Quiz"       },
  { value: "codercise", label: "Codercise"  },
] as const;

type Tab = "overview" | "students" | "assignments" | "analytics";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function pctColor(pct: number) {
  if (pct >= 75) return C.success;
  if (pct >= 40) return C.warning;
  return C.error;
}
function MasteryBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 rounded-full" style={{ background: "#f0f0f2" }}>
        <div className="h-2 rounded-full transition-all" style={{
          width: `${pct}%`, background: pctColor(pct),
        }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right" style={{ color: pctColor(pct) }}>{pct}%</span>
    </div>
  );
}
function StatusBadge({ status }: { status: "done" | "in_progress" | "pending" }) {
  const map = {
    done:        { bg: C.successBg, color: C.success, label: "Done" },
    in_progress: { bg: C.warningBg, color: C.warning, label: "In progress" },
    pending:     { bg: "#f4f4f5",   color: C.subtle,  label: "Pending" },
  };
  const s = map[status];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function ClassroomDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user } = useAuthStore();
  const { meta, fetchMeta } = useCurriculumMetaStore();

  const id = Number(params.id);
  const [tab, setTab]             = useState<Tab>("overview");
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [students,  setStudents]  = useState<Student[]>([]);
  const [assignments, setAssigns] = useState<Assignment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState<string | null>(null);
  const [copied,  setCopied]      = useState(false);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [aType,  setAType]  = useState<string>("module");
  const [aId,    setAId]    = useState("");
  const [aTitle, setATitle] = useState("");
  const [aDue,   setADue]   = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  // Gate non-instructors
  useEffect(() => {
    if (user && !user.is_instructor) router.replace("/classroom/student");
  }, [user, router]);

  const loadAll = useCallback(async () => {
    if (!user?.is_instructor || !id) return;
    setLoading(true); setError(null);
    try {
      const [cls, stud, assg] = await Promise.all([
        classroomApi.get(id),
        classroomApi.students(id),
        classroomApi.assignments(id),
      ]);
      setClassroom(cls.data);
      setStudents(stud.data ?? []);
      setAssigns(assg.data ?? []);
    } catch {
      setError("Could not load classroom data.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const loadAnalytics = useCallback(async () => {
    if (!user?.is_instructor || !id) return;
    try {
      const res = await classroomApi.analytics(id);
      setAnalytics(res.data);
    } catch { /* silent */ }
  }, [id, user]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (tab === "analytics" && !analytics) loadAnalytics();
  }, [tab, analytics, loadAnalytics]);

  const copyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invite code copied");
    });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aId.trim() || !aTitle.trim()) return;
    setAssigning(true);
    try {
      const res = await classroomApi.addAssignment(id, {
        content_type: aType,
        content_id: aId.trim(),
        title: aTitle.trim(),
        due_date: aDue ? new Date(aDue).toISOString() : null,
      });
      setAssigns(prev => [...prev, res.data]);
      setClassroom(c => c ? { ...c, assignment_count: c.assignment_count + 1 } : c);
      setShowAssignForm(false);
      setAId(""); setATitle(""); setADue("");
      toast.success("Assignment added");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail ?? "Failed to add assignment";
      toast.error(typeof msg === "string" ? msg : "Failed to add assignment");
    } finally {
      setAssigning(false);
    }
  };

  const removeAssign = async (a: Assignment) => {
    try {
      await classroomApi.removeAssignment(id, a.id);
      setAssigns(prev => prev.filter(x => x.id !== a.id));
      setClassroom(c => c ? { ...c, assignment_count: Math.max(0, c.assignment_count - 1) } : c);
      toast.success("Assignment removed");
    } catch {
      toast.error("Failed to remove assignment");
    }
  };

  // Build content-ID options from curriculum meta based on selected type
  const contentOptions: { value: string; label: string }[] = (() => {
    if (!meta) return [];
    if (aType === "module") {
      return meta.module_order.map(mid => ({
        value: mid,
        label: meta.module_meta[mid]?.title ?? mid,
      }));
    }
    if (aType === "lesson") {
      return meta.module_order.flatMap(mid => {
        const m = meta.module_meta[mid];
        return (m?.lesson_ids ?? []).map(lid => ({
          value: lid, label: `${m?.title ?? mid} → ${lid}`,
        }));
      });
    }
    if (aType === "quiz") {
      return meta.module_order.map(mid => ({
        value: meta.module_meta[mid]?.quiz_id ?? "",
        label: `${meta.module_meta[mid]?.title ?? mid} Quiz`,
      })).filter(o => o.value);
    }
    if (aType === "codercise") {
      return meta.module_order.flatMap(mid => {
        const m = meta.module_meta[mid];
        return (m?.codercise_ids ?? []).map(cid => ({
          value: cid, label: `${m?.title ?? mid} → ${cid}`,
        }));
      });
    }
    return [];
  })();

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",    label: "Overview",    icon: <LayoutGrid size={14} /> },
    { id: "students",    label: `Students (${classroom?.student_count ?? 0})`, icon: <Users size={14} /> },
    { id: "assignments", label: `Assignments (${assignments.length})`, icon: <BookOpen size={14} /> },
    { id: "analytics",   label: "Analytics",   icon: <BarChart2 size={14} /> },
  ];

  if (!user?.is_instructor) return null;

  return (
    <div className="min-h-[calc(100vh-48px)]" style={{ background: C.bg }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-8 py-5">
          <Link href="/classroom"
                className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline"
                style={{ color: C.muted }}>
            <ArrowLeft size={13} /> All Classrooms
          </Link>
          {loading ? (
            <div className="h-8 w-64 rounded-lg animate-pulse" style={{ background: "#f0f0f2" }} />
          ) : error ? (
            <p style={{ color: C.error }}>{error}</p>
          ) : classroom ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold" style={{ color: C.text }}>{classroom.name}</h1>
                {classroom.description && (
                  <p className="text-sm mt-0.5" style={{ color: C.muted }}>{classroom.description}</p>
                )}
              </div>
              {/* Invite code pill */}
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors hover:bg-[#f7f7f8]"
                style={{ borderColor: C.border, color: C.brand }}
                title="Click to copy invite code"
              >
                {copied ? <Check size={13} style={{ color: C.success }} /> : <Copy size={13} />}
                {classroom.invite_code}
              </button>
            </div>
          ) : null}

          {/* Tab bar */}
          <div className="flex gap-1 mt-5 -mb-[1px]">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-t-lg text-xs font-medium border-b-2 transition-colors"
                style={{
                  background:   tab === t.id ? C.bg : "transparent",
                  borderColor:  tab === t.id ? C.brand : "transparent",
                  color:        tab === t.id ? C.brand : C.muted,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: C.subtle }} />
          </div>
        )}

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {!loading && tab === "overview" && classroom && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Students",    value: classroom.student_count,    icon: <Users size={18} /> },
                { label: "Assignments", value: classroom.assignment_count, icon: <BookOpen size={18} /> },
                { label: "Active",      value: analytics?.active_students ?? "–", icon: <TrendingUp size={18} /> },
                { label: "Avg mastery", value: analytics
                    ? `${Math.round(analytics.module_mastery.reduce((s, m) => s + m.mastery_pct, 0) / Math.max(analytics.module_mastery.length, 1))}%`
                    : "–",
                  icon: <BarChart2 size={18} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-xl p-4 flex flex-col gap-1"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: C.subtle }}>
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: C.text }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Invite code block */}
            <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Share with students</h2>
              <p className="text-sm mb-4" style={{ color: C.muted }}>
                Students enter this code on their <strong>Classroom → Join</strong> page.
                It never expires unless you deactivate the classroom.
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-3 rounded-xl text-xl font-mono font-bold tracking-[0.25em] text-center"
                      style={{ background: C.brandSub, color: C.brand }}>
                  {classroom.invite_code}
                </code>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-4 h-12 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: C.brandSub, color: C.brand }}
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ──────────────────────────────────────────────────── */}
        {!loading && tab === "students" && (
          <div className="rounded-2xl overflow-hidden"
               style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {students.length === 0 ? (
              <div className="text-center py-16">
                <Users size={32} className="mx-auto mb-3" style={{ color: C.subtle }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>No students enrolled yet</p>
                <p className="text-xs mt-1" style={{ color: C.subtle }}>
                  Share the invite code so students can join.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Student", "Joined", "Lessons done", "Codercises passed", "Avg quiz"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold"
                          style={{ color: C.subtle }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.student_id}
                        style={{ borderBottom: i < students.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#eef2ff] text-[#4338ca] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {s.username[0]?.toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium" style={{ color: C.text }}>{s.username}</p>
                            {s.full_name && <p className="text-xs" style={{ color: C.subtle }}>{s.full_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>
                        {new Date(s.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: C.text }}>{s.completed_lessons}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: C.text }}>{s.passed_codercises}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.quizzes_attempted > 0 ? (
                          <span className="font-semibold" style={{ color: pctColor(s.avg_quiz_score) }}>
                            {s.avg_quiz_score}%
                          </span>
                        ) : (
                          <span style={{ color: C.subtle }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS ───────────────────────────────────────────────── */}
        {!loading && tab === "assignments" && (
          <div className="space-y-4">
            {/* Add assignment button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: C.brand }}
                onMouseEnter={e => (e.currentTarget.style.background = C.brandH)}
                onMouseLeave={e => (e.currentTarget.style.background = C.brand)}
              >
                <Plus size={14} /> Add Assignment
              </button>
            </div>

            {/* Assignment form */}
            {showAssignForm && (
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Assign Content</h3>
                <form onSubmit={handleAssign} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Type</label>
                      <select
                        value={aType}
                        onChange={e => { setAType(e.target.value); setAId(""); setATitle(""); }}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: C.border, color: C.text }}
                      >
                        {CONTENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Content</label>
                      <select
                        value={aId}
                        onChange={e => {
                          setAId(e.target.value);
                          const opt = contentOptions.find(o => o.value === e.target.value);
                          if (opt) setATitle(opt.label);
                        }}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: C.border, color: C.text }}
                        required
                      >
                        <option value="">Select…</option>
                        {contentOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>
                        Display title
                      </label>
                      <input
                        value={aTitle}
                        onChange={e => setATitle(e.target.value)}
                        placeholder="Auto-filled from selection"
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: C.border, color: C.text }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>
                        Due date <span style={{ color: C.subtle }}>(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={aDue}
                        onChange={e => setADue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: C.border, color: C.text }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowAssignForm(false)}
                            className="px-4 h-8 rounded-lg border text-xs font-medium"
                            style={{ borderColor: C.border, color: C.muted }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={assigning || !aId || !aTitle}
                            className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: C.brand }}>
                      {assigning ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      Assign
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assignment list */}
            {assignments.length === 0 ? (
              <div className="text-center py-14 rounded-2xl"
                   style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <BookOpen size={28} className="mx-auto mb-3" style={{ color: C.subtle }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>No assignments yet</p>
                <p className="text-xs mt-1" style={{ color: C.subtle }}>
                  Add modules, lessons, quizzes, or codercises.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden"
                   style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {assignments.map((a, i) => (
                  <div key={a.id}
                       className="flex items-center gap-4 px-5 py-4"
                       style={{ borderBottom: i < assignments.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    {/* Type badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            background: a.content_type === "module" ? "#f0fdf4" : a.content_type === "quiz" ? C.brandSub : "#f4f4f5",
                            color: a.content_type === "module" ? C.success : a.content_type === "quiz" ? C.brand : C.muted,
                          }}>
                      {a.content_type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: C.text }}>{a.title}</p>
                      <p className="text-xs" style={{ color: C.subtle }}>ID: {a.content_id}</p>
                    </div>
                    {a.due_date && (
                      <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: C.muted }}>
                        <Calendar size={11} />
                        {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <button onClick={() => removeAssign(a)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[#fef2f2]"
                            title="Remove assignment">
                      <Trash2 size={13} style={{ color: C.error }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ─────────────────────────────────────────────────── */}
        {!loading && tab === "analytics" && (
          <>
            {!analytics ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin" style={{ color: C.subtle }} />
              </div>
            ) : (
              <div className="space-y-6">

                {/* Summary bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total students",  value: analytics.total_students },
                    { label: "Active students", value: analytics.active_students },
                    { label: "Assignments",     value: analytics.assignment_completion.length },
                    { label: "Need attention",  value: analytics.needs_attention.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-4"
                         style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <p className="text-xs font-medium mb-1" style={{ color: C.subtle }}>{label}</p>
                      <p className="text-2xl font-bold" style={{ color: C.text }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Module mastery */}
                <div className="rounded-2xl p-5"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <h2 className="text-sm font-semibold mb-4" style={{ color: C.text }}>
                    Module Mastery <span className="font-normal text-xs ml-1" style={{ color: C.subtle }}>
                      (% of class who completed all lessons)
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {analytics.module_mastery.map(m => (
                      <div key={m.module_id} className="flex items-center gap-3">
                        <span className="text-sm w-52 shrink-0 truncate" style={{ color: C.muted }}>{m.title}</span>
                        <MasteryBar pct={m.mastery_pct} />
                        <span className="text-xs shrink-0" style={{ color: C.subtle }}>
                          {m.mastered}/{m.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz performance */}
                <div className="rounded-2xl p-5"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <h2 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Quiz Performance</h2>
                  {analytics.quiz_performance.filter(q => q.attempted > 0).length === 0 ? (
                    <p className="text-sm" style={{ color: C.subtle }}>No quiz attempts yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.quiz_performance.map(q => (
                        <div key={q.quiz_id} className="flex items-center gap-3">
                          <span className="text-sm w-52 shrink-0 truncate" style={{ color: C.muted }}>
                            {q.module_title}
                          </span>
                          <MasteryBar pct={q.attempted > 0 ? q.avg_score : 0} />
                          <span className="text-xs shrink-0" style={{ color: C.subtle }}>
                            {q.attempted} attempted · {q.passed} passed
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignment completion */}
                {analytics.assignment_completion.length > 0 && (
                  <div className="rounded-2xl p-5"
                       style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <h2 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Assignment Completion</h2>
                    <div className="space-y-3">
                      {analytics.assignment_completion.map(a => (
                        <div key={a.assignment_id} className="flex items-center gap-3">
                          <div className="w-52 shrink-0">
                            <p className="text-sm truncate" style={{ color: C.muted }}>{a.title}</p>
                            <p className="text-[10px]" style={{ color: C.subtle }}>{a.content_type}</p>
                          </div>
                          <MasteryBar pct={a.completion_pct} />
                          <span className="text-xs shrink-0" style={{ color: C.subtle }}>
                            {a.completed}/{a.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Needs attention */}
                {analytics.needs_attention.length > 0 && (
                  <div className="rounded-2xl p-5"
                       style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={15} style={{ color: C.warning }} />
                      <h2 className="text-sm font-semibold" style={{ color: C.text }}>
                        Students who may need attention
                      </h2>
                      <span className="text-xs" style={{ color: C.muted }}>(below 50% completion)</span>
                    </div>
                    <div className="space-y-2">
                      {analytics.needs_attention.map(s => (
                        <div key={s.student_id}
                             className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white"
                             style={{ border: `1px solid #fde68a` }}>
                          <span className="w-7 h-7 rounded-full bg-[#fef3c7] text-[#b45309] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {s.username[0]?.toUpperCase()}
                          </span>
                          <span className="flex-1 text-sm font-medium" style={{ color: C.text }}>{s.username}</span>
                          <span className="text-xs" style={{ color: C.muted }}>
                            {s.completed}/{s.total_assigned} assigned lessons
                          </span>
                          <span className="text-xs font-semibold" style={{ color: C.warning }}>
                            {s.completion_pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
