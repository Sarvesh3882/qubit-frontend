"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { certificationApi } from "@/lib/api";
import { Trophy, CheckCircle, Shield, ExternalLink, Calendar, User, BookOpen, Code2 } from "lucide-react";

export default function CertificatePage() {
  const { certId } = useParams<{ certId: string }>();
  const [cert, setCert] = useState<any | null | "loading">("loading");

  useEffect(() => {
    // Use backend as the source of truth — no localStorage
    certificationApi.verify(certId)
      .then((res) => setCert(res.data))
      .catch(() => setCert(null));
  }, [certId]);

  if (cert === "loading") return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cert) return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fef2f2] flex items-center justify-center">
          <Shield size={28} className="text-[#dc2626]" />
        </div>
        <h1 className="text-xl font-black text-[#111118] mb-2">Certificate Not Found</h1>
        <p className="text-sm text-[#71717a] mb-6">
          No certificate exists for ID <code className="font-mono bg-[#f0f0f2] px-1.5 py-0.5 rounded">{certId}</code>.
          It may have been issued on a different device or may not exist.
        </p>
        <Link href="/codebook" className="text-sm text-[#4f46e5] hover:underline">
          → Go to Codebook
        </Link>
      </div>
    </div>
  );

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-[calc(100vh-48px)] bg-gradient-to-br from-[#f0f0ff] via-white to-[#fafff4] flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full">

        {/* ── Certificate card ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border-2 border-[#e4e4e7] shadow-2xl overflow-hidden mb-6"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8f7ff 50%, #f0fdf4 100%)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-2"
            style={{ background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #16a34a 100%)" }}
          />

          <div className="px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image src="/illustrations/QUBIT_icon.svg" alt="QUBIT" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6366f1] uppercase tracking-widest">QUBIT</p>
                  <p className="text-[10px] text-[#a1a1aa]">Quantum Learning Platform</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0]">
                <CheckCircle size={13} className="text-[#16a34a]" />
                <span className="text-xs font-bold text-[#15803d]">Verified</span>
              </div>
            </div>

            {/* Certificate body */}
            <div className="text-center mb-8">
              <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest mb-4">
                Certificate of Completion
              </p>

              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#fffbeb] border-2 border-[#fde68a] flex items-center justify-center">
                <Trophy size={36} className="text-[#f59e0b]" />
              </div>

              <h1 className="text-3xl font-black text-[#111118] mb-2">
                {cert.learner_name}
              </h1>
              <p className="text-[#71717a] mb-6">has successfully completed</p>

              <div className="inline-block px-6 py-3 rounded-2xl bg-[#eef2ff] border border-[#c7d2fe] mb-6">
                <p className="text-lg font-black text-[#4f46e5]">{cert.path_title}</p>
              </div>

              <p className="text-sm text-[#71717a]">
                Demonstrating knowledge of quantum computing fundamentals,
                circuit design, and algorithm implementation.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: BookOpen, label: "Lessons", value: cert.lessons_completed, color: "#6366f1" },
                { icon: Code2,    label: "Codercises", value: cert.codercises_passed, color: "#8b5cf6" },
                { icon: Trophy,   label: "Score", value: cert.final_score > 0 ? `${cert.final_score}%` : "—", color: "#f59e0b" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white border border-[#f0f0f2]">
                  <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                  <p className="text-lg font-black text-[#111118]">{value}</p>
                  <p className="text-[10px] text-[#a1a1aa]">{label}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-[#f0f0f2]">
              <div className="flex items-center gap-2 text-xs text-[#71717a]">
                <Calendar size={12} />
                Issued {issuedDate}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#a1a1aa]">Certificate ID</p>
                <p className="text-xs font-mono font-bold text-[#374151]">{cert.cert_id}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Verification section ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-[#4f46e5]" />
            <h2 className="text-sm font-bold text-[#111118]">Verification</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#f0f0f2]">
              <span className="text-[#71717a] flex items-center gap-1.5"><User size={11} /> Learner</span>
              <span className="font-medium text-[#111118]">{cert.learner_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#f0f0f2]">
              <span className="text-[#71717a]">Certificate ID</span>
              <span className="font-mono font-bold text-[#374151]">{cert.cert_id}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#f0f0f2]">
              <span className="text-[#71717a]">Issued</span>
              <span className="font-medium text-[#111118]">{issuedDate}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#71717a]">Storage</span>
              <span className="text-[#52525b]">Database (server)</span>
            </div>
          </div>

          {/* Blockchain placeholder — honest about current state */}
          <div className="mt-4 p-3 rounded-xl bg-[#f7f7f8] border border-[#e4e4e7]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#f7c94f]" />
              <span className="text-xs font-semibold text-[#52525b]">Blockchain Verification</span>
            </div>
            <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
              On-chain credential issuance is planned for a future release.
              This certificate is currently stored and verified locally.
              The certificate ID and learning record are authentic.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/profile"
            className="flex-1 py-3 text-center border border-[#e4e4e7] text-sm text-[#71717a] rounded-xl hover:bg-[#f7f7f8] transition-colors font-medium"
          >
            Back to Profile
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4f46e5] text-white text-sm font-bold rounded-xl hover:bg-[#4338ca] transition-colors"
          >
            <ExternalLink size={14} /> Save / Print
          </button>
        </div>

        {/* Public verify link */}
        <p className="text-center text-xs text-[#a1a1aa] mt-4">
          Share verification link:{" "}
          <span className="font-mono text-[#6366f1]">
            {typeof window !== "undefined" ? window.location.href : `qubit.app/certification/${cert.certId}`}
          </span>
        </p>
      </div>
    </div>
  );
}
