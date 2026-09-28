"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useAdaptiveStore } from "@/store/adaptiveStore";
import { certificationApi } from "@/lib/api";
import { useCurriculumMetaStore } from "@/store/curriculumMetaStore";
import { CheckCircle, ArrowRight, Trophy, AlertCircle, Info } from "lucide-react";

/* ── requirement row ─────────────────────────────────────────────────── */
type ReqStatus = "met" | "in_progress" | "not_started" | "locked";

function Req({
  label, detail, met, required, status,
}: {
  label: string; detail: string; met: boolean; required: boolean; status?: ReqStatus;
}) {
  const color = met ? "#16a34a" : required ? "#dc2626" : "#f59e0b";
  const bg    = met ? "#f0fdf4"  : required ? "#fef2f2"  : "#fffbeb";
  const icon  = met ? "✓" : required ? "!" : "○";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f0f0f2] last:border-0">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
        style={{ background: bg, color, border: `1.5px solid ${color}` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${met ? "text-[#15803d]" : "text-[#111118]"}`}>
          {label}
        </p>
        <p className="text-xs text-[#71717a] mt-0.5">{detail}</p>
      </div>
      {!required && !met && (
        <span className="text-[10px] text-[#a1a1aa] bg-[#f7f7f8] border border-[#e4e4e7] px-2 py-0.5 rounded-full shrink-0 self-center">
          advisory
        </span>
      )}
    </div>
  );
}

import { Suspense } from "react";

function ClaimCertPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const pathId = params.get("path") ?? "";
  const { user } = useAuthStore();
  const { issueCertification } = useAdaptiveStore();
  const { meta, fetchMeta } = useCurriculumMetaStore();
  const [step, setStep] = useState<"loading" | "check" | "issued">("loading");
  const [eligibility, setEligibility] = useState<any>(null);
  const [cert, setCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure meta is loaded; redirect if pathId unknown once meta arrives
  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => {
    if (!meta) return;
    if (pathId && !meta.cert_requirements[pathId]) router.replace("/profile");
  }, [meta, pathId]);

  // The cert requirement title comes from meta — no hardcoding
  const pathTitle = meta?.cert_requirements[pathId]?.path_title ?? pathId;

  // Load eligibility from backend
  useEffect(() => {
    if (!user || !meta || !pathId) return;
    certificationApi.checkEligibility(pathId)
      .then((res) => { setEligibility(res.data); setStep("check"); })
      .catch(() => {
        setError("Could not check eligibility — make sure you are signed in and the backend is running.");
        setStep("check");
      });
  }, [user?.id, pathId, meta]);

  if (!meta) return null;

  const handleClaim = async () => {
    if (!user) return;
    try {
      const res = await certificationApi.issue(pathId);
      const issued = res.data;
      // Update local adaptive store so UI reflects the cert
      issueCertification(pathId, issued.cert_id);
      setCert(issued);
      setStep("issued");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "object"
          ? "Requirements not yet met — see checklist above."
          : detail ?? "Failed to issue certificate."
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#fafafa] flex items-start justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {step === "loading" && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {step === "check" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fffbeb] border-2 border-[#fde68a] flex items-center justify-center mb-5">
                <Trophy size={30} className="text-[#f59e0b]" />
              </div>
              <h1 className="text-2xl font-black text-[#111118] mb-1">Claim Your Certificate</h1>
              <p className="text-sm text-[#71717a]">{pathTitle}</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#dc2626]">
                {error}
              </div>
            )}

            {eligibility && (
              <>
                {/* Progress summary bar */}
                <div className="mb-5 bg-white rounded-2xl border border-[#e4e4e7] px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#111118]">Requirements met</span>
                    <span className="text-xs font-bold" style={{ color: eligibility.eligible ? "#16a34a" : "#f59e0b" }}>
                      {Object.values(eligibility.requirements as Record<string, any>).filter((r: any) => r.met).length}/{Object.keys(eligibility.requirements).length}
                    </span>
                  </div>
                  <div className="h-2 bg-[#f0f0f2] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: eligibility.eligible ? "#16a34a" : "#6366f1" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(Object.values(eligibility.requirements as Record<string, any>).filter((r: any) => r.met).length / Object.keys(eligibility.requirements).length) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                {/* Requirements from backend */}
                <div className="bg-white rounded-2xl border border-[#e4e4e7] px-5 mb-5">
                  <Req
                    label={eligibility.requirements.lessons.label}
                    detail={eligibility.requirements.lessons.evidence}
                    met={eligibility.requirements.lessons.met}
                    required={true}
                  />
                  <Req
                    label={eligibility.requirements.codercises.label}
                    detail={eligibility.requirements.codercises.evidence}
                    met={eligibility.requirements.codercises.met}
                    required={true}
                  />
                  <Req
                    label={eligibility.requirements.quizzes.label}
                    detail={eligibility.requirements.quizzes.evidence}
                    met={eligibility.requirements.quizzes.met}
                    required={true}
                  />
                </div>

                {/* Quiz breakdown — shows per-module quiz status */}
                {eligibility.requirements.quizzes.details?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#e4e4e7] px-5 py-4 mb-5">
                    <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest mb-3">
                      Module Quizzes
                    </p>
                    <div className="space-y-2">
                      {eligibility.requirements.quizzes.details.map((d: any) => (
                        <div key={d.quiz_id} className="flex items-center justify-between">
                          <span className="text-xs text-[#374151] font-medium">{d.quiz_id.replace("-quiz", "").toUpperCase()}</span>
                          <div className="flex items-center gap-2">
                            {d.attempted ? (
                              <span
                                className="text-xs font-bold"
                                style={{ color: d.passed ? "#16a34a" : "#f59e0b" }}
                              >
                                {d.best_score}% {d.passed ? "✓" : `(need ${d.passing_score}%)`}
                              </span>
                            ) : (
                              <span className="text-xs text-[#a1a1aa]">Not attempted</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Prototype notice — always visible */}
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#f7f7f8] border border-[#e4e4e7]">
              <Info size={14} className="text-[#a1a1aa] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#52525b] mb-0.5">Local certificate · Blockchain pending</p>
                <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                  Certificate records are stored in the database. Blockchain verification
                  is planned for a future release. The learning record is real — the
                  on-chain credential is not yet issued.
                </p>
              </div>
            </div>

            {!user ? (
              <div className="text-center">
                <p className="text-sm text-[#71717a] mb-4">Sign in to claim your certificate</p>
                <Link href="/auth/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white font-semibold text-sm rounded-xl">Sign In</Link>
              </div>
            ) : eligibility?.eligible ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleClaim}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4f46e5] text-white font-bold rounded-xl hover:bg-[#4338ca] transition-colors shadow-md shadow-[#4f46e5]/20"
              >
                <Trophy size={16} /> Issue Certificate
              </motion.button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3 text-[#f59e0b]">
                  <AlertCircle size={15} />
                  <span className="text-sm font-medium">Complete the required lessons first</span>
                </div>
                <Link href={`/codebook/${pathId}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#4f46e5] text-white font-semibold text-sm rounded-xl">
                  Continue Learning <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {step === "issued" && cert && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0fdf4] border-2 border-[#bbf7d0] flex items-center justify-center">
              <CheckCircle size={36} className="text-[#16a34a]" />
            </div>
            <h1 className="text-2xl font-black text-[#111118] mb-2">Certificate Issued</h1>
            <p className="text-sm text-[#71717a] mb-5">Congratulations, <strong>{user?.username}</strong>!</p>
            <div className="inline-block px-5 py-3 bg-[#f7f7f8] rounded-xl border border-[#e4e4e7] mb-7">
              <p className="text-[10px] text-[#a1a1aa] mb-0.5">Certificate ID</p>
              <p className="text-sm font-mono font-bold text-[#111118]">{cert.cert_id}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={`/certification/${cert.cert_id}`} className="flex items-center justify-center gap-2 py-3 bg-[#4f46e5] text-white font-bold text-sm rounded-xl hover:bg-[#4338ca] transition-colors">
                View Certificate <ArrowRight size={14} />
              </Link>
              <Link href="/profile" className="py-3 text-sm text-[#71717a] hover:text-[#111118] transition-colors">Back to Profile</Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ClaimCertPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
        <div className="text-[#71717a] text-sm">Loading...</div>
      </div>
    }>
      <ClaimCertPageInner />
    </Suspense>
  );
}
