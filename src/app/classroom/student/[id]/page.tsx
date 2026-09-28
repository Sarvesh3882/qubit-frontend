"use client";
/**
 * /classroom/student/[id]  — Student view of a single classroom
 *
 * Shows:
 *   - Classroom name + instructor
 *   - All assignments with the student's own completion status
 *   - Direct links into the existing Learner experience to complete work
 */
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, BookOpen, CheckCircle2,
  Clock, Loader2, AlertCircle, Calendar, ChevronRight,
  Layers, HelpCircle, Code2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { classroomApi } from "@/lib/api";

interface ClassroomDetail {
  id: number; name: string; description: string | null;
  invite_code: string; student_count: number; assignment_count: number;
  instructor_name?: string;
}
interface StudentAssignment {
  id: number;
  content_type: string;
  content_id: string;
  title: string;
  due_date: string | null;
  assigned_at: string;
  // student-specific fields
  completed?: boolean;
  status?: "done" | "in_progress" | "pending";
  lessons_done?: number;
  lessons_total?: number;
  best_score?: number;
}

const C = {
  bg: "#fafafa", card: "#ffffff", border: "#e4e4e7",
  text: "#111118", muted: "#52525b", subtle: "#a1a1aa",
  brand: "#4f46e5", brandH: "#4338ca", brandSub: "#eef2ff",
  success: "#16a34a", successBg: "#f0fdf4",
  warning: "#d97706", warningBg: "#fffbeb",
};

/** Map content_type → Codebook URL */
function contentUrl(type: string, id: string): string | null {
  // All paths in the Codebook: /codebook/[pathId]/[moduleId]/[lessonId]
  // module  → /codebook/fqc/iqc  (navigate into module)
  // lesson  → /codebook/fqc/iqc/iqc-1
  // quiz    → we navigate to the first lesson of the module; quiz is at end
  // codercise → lesson page where the codercise lives
  if (type === "module") {
    // Map known module IDs to their paths
    const pathMap: Record<string, string> = {
      iqc: "fqc", sq: "fqc", mq: "fqc",
      "qalgo-dj": "fqa", "qalgo-grover": "fqa",
    };
    const pathId = pathMap[id] ?? "fqc";
    return `/codebook/${pathId}/${id}`;
  }
  if (type === "lesson") {
    // lesson ID format: "iqc-1", "sq-2", "dj-1", "grover-1"
    const moduleMap: Record<string, string> = {
      "iqc-1": "iqc", "iqc-2": "iqc", "iqc-3": "iqc",
      "sq-1": "sq", "sq-2": "sq",
      "mq-1": "mq", "mq-2": "mq",
      "dj-1": "qalgo-dj",
      "grover-1": "qalgo-grover",
    };
    const pathMap: Record<string, string> = {
      iqc: "fqc", sq: "fqc", mq: "fqc",
      "qalgo-dj": "fqa", "qalgo-grover": "fqa",
    };
    const moduleId = moduleMap[id];
    if (!moduleId) return null;
    const pathId = pathMap[moduleId];
    return `/codebook/${pathId}/${moduleId}/${id}`;
  }
  if (type === "quiz") {
    // quiz ID: "iqc-quiz", "sq-quiz" etc. → go to module which hosts the quiz
    const moduleId = id.replace("-quiz", "");
    const pathMap: Record<string, string> = {
      iqc: "fqc", sq: "fqc", mq: "fqc",
      "qalgo-dj": "fqa", "qalgo-grover": "fqa",
    };
    const pathId = pathMap[moduleId] ?? "fqc";
    return `/codebook/${pathId}/${moduleId}`;
  }
  if (type === "codercise") {
    // codercise ID: "iqc-1-c1" → lesson "iqc-1" in module "iqc"
    const parts = id.split("-");
    // e.g. ["iqc","1","c1"] → lesson = iqc-1, module = iqc
    const lessonId = parts.slice(0, 2).join("-");
    const moduleMap: Record<string, string> = {
      "iqc": "fqc", "sq": "fqc", "mq": "fqc",
      "dj": "fqa", "grover": "fqa",
    };
    const moduleId = parts[0] === "grover" ? "qalgo-grover" : parts[0] === "dj" ? "qalgo-dj" : parts[0];
    const pathId = moduleMap[parts[0]] ?? "fqc";
    return `/codebook/${pathId}/${moduleId}/${lessonId}`;
  }
  return null;
}

function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    module:    <Layers    size={14} />,
    lesson:    <BookOpen  size={14} />,
    quiz:      <HelpCircle size={14} />,
    codercise: <Code2     size={14} />,
  };
  const colors: Record<string, string> = {
    module: "#16a34a", lesson: "#4f46e5", quiz: "#d97706", codercise: "#0891b2",
  };
  return (
    <span style={{ color: colors[type] ?? C.muted }}>
      {icons[type] ?? <BookOpen size={14} />}
    </span>
  );
}

function StatusChip({ status, score, lessonsDone, lessonsTotal }: {
  status?: string; score?: number; lessonsDone?: number; lessonsTotal?: number;
}) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: C.successBg, color: C.success }}>
        <CheckCircle2 size={11} /> Done{score != null ? ` · ${score}%` : ""}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: C.warningBg, color: C.warning }}>
        <Clock size={11} /> {lessonsDone ?? 0}/{lessonsTotal ?? "?"} lessons
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "#f4f4f5", color: C.subtle }}>
      <Clock size={11} /> Pending
    </span>
  );
}

export default function StudentClassroomDetail() {
  const params        = useParams();
  const { user }      = useAuthStore();
  const id            = Number(params.id);

  const [classroom,   setClassroom]   = useState<ClassroomDetail | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [cls, assg] = await Promise.all([
        classroomApi.get(id),
        classroomApi.assignments(id),
      ]);
      setClassroom(cls.data);
      setAssignments(assg.data ?? []);
    } catch {
      setError("Could not load classroom. Make sure you are enrolled.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const done    = assignments.filter(a => a.status === "done").length;
  const total   = assignments.length;
  const pctDone = total > 0 ? Math.round(done / total * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-48px)]" style={{ background: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-3xl mx-auto px-8 py-5">
          <Link href="/classroom/student"
                className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline"
                style={{ color: C.muted }}>
            <ArrowLeft size={13} /> My Classrooms
          </Link>

          {loading ? (
            <div className="h-7 w-56 rounded animate-pulse" style={{ background: "#f0f0f2" }} />
          ) : error ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#dc2626" }}>
              <AlertCircle size={14} /> {error}
            </div>
          ) : classroom ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: C.brandSub }}>
                  <GraduationCap size={18} style={{ color: C.brand }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: C.text }}>{classroom.name}</h1>
                  {(classroom as EnrolledClassroom & { instructor_name?: string }).instructor_name && (
                    <p className="text-sm" style={{ color: C.muted }}>
                      Instructor: {(classroom as EnrolledClassroom & { instructor_name?: string }).instructor_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress summary */}
              {total > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ background: "#f0f0f2" }}>
                    <div className="h-2 rounded-full transition-all"
                         style={{ width: `${pctDone}%`, background: C.brand }} />
                  </div>
                  <span className="text-sm font-semibold shrink-0" style={{ color: C.brand }}>
                    {done}/{total} done
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Assignments ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: C.subtle }} />
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={28} className="mx-auto mb-3" style={{ color: C.subtle }} />
            <p className="text-sm font-medium" style={{ color: C.muted }}>
              No assignments yet — check back later.
            </p>
          </div>
        )}

        {!loading && assignments.length > 0 && (
          <div className="space-y-3">
            {assignments.map(a => {
              const url = contentUrl(a.content_type, a.content_id);
              return (
                <div key={a.id}
                     className="rounded-xl p-4 flex items-center gap-4 transition-shadow hover:shadow-sm"
                     style={{ background: C.card, border: `1px solid ${C.border}` }}>

                  {/* Type icon */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                       style={{ background: "#f4f4f5" }}>
                    <ContentTypeIcon type={a.content_type} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.text }}>{a.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] uppercase font-semibold tracking-wide"
                            style={{ color: C.subtle }}>{a.content_type}</span>
                      {a.due_date && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                          <Calendar size={10} />
                          Due {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <StatusChip
                    status={a.status}
                    score={a.best_score}
                    lessonsDone={a.lessons_done}
                    lessonsTotal={a.lessons_total}
                  />

                  {/* Go to content */}
                  {url ? (
                    <Link
                      href={url}
                      className="flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                      style={{
                        background: a.status === "done" ? C.successBg : C.brandSub,
                        color:      a.status === "done" ? C.success   : C.brand,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      {a.status === "done" ? "Review" : "Start"} <ChevronRight size={11} />
                    </Link>
                  ) : (
                    <span className="px-3 h-8 flex items-center text-xs rounded-lg"
                          style={{ background: "#f4f4f5", color: C.subtle }}>
                      In Codebook
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Allow the instructor_name property that comes from the enrolled endpoint
interface EnrolledClassroom extends ClassroomDetail {
  instructor_name?: string;
  joined_at?: string;
}
