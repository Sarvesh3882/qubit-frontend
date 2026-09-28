/**
 * Certification utilities for QUBIT.
 *
 * Architecture is blockchain-ready:
 *  - generateCertId() produces a deterministic, collision-resistant ID
 *  - CertRecord carries a blockchainRef field (null until a real chain integration
 *    is wired in — do NOT fill this with fake data)
 *  - verifyCertificate() validates locally; a future implementation can
 *    additionally call an on-chain verification RPC here
 *
 * To add real blockchain verification later:
 *   1. Replace the localStorage store with a backend endpoint
 *      POST /certification/issue  →  {certId, userId, pathId, txHash}
 *   2. Implement GET /certification/verify/{certId}  →  verifies on-chain
 *   3. Replace the LOCAL_CERTS map below with an API call
 */

export interface CertRecord {
  certId: string;                   // e.g. "QUBIT-FQC-20260924-A3F7"
  userId: string;                   // learner's user ID or email
  userName: string;                 // display name
  pathId: string;
  pathTitle: string;
  issuedAt: string;                 // ISO datetime
  score: number;                    // final assessment score 0–100
  lessonsCompleted: number;
  codercisesPassed: number;
  finalAssessmentScore: number;

  // Blockchain integration — INTENTIONALLY null until real chain is connected.
  // Never populate with fake hashes or dummy data.
  blockchainRef: null | {
    network: string;                // e.g. "ethereum-sepolia"
    transactionHash: string;
    contractAddress: string;
    tokenId: string;
    verificationUrl: string;
  };
}

/** Deterministic cert ID: QUBIT-{PATH}-{YYYYMMDD}-{4-char hex} */
export function generateCertId(pathId: string, userId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // simple hash of userId for uniqueness (not security-sensitive)
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = ((h << 5) - h + userId.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(h).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
  return `QUBIT-${pathId.toUpperCase()}-${date}-${hex}`;
}

const STORAGE_KEY = "qubit-certificates";

/** Persist cert record to localStorage (replace with API call when backend exists) */
export function storeCertLocally(cert: CertRecord): void {
  if (typeof window === "undefined") return;
  const existing = loadAllCerts();
  existing[cert.certId] = cert;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/** Load all certs from localStorage */
export function loadAllCerts(): Record<string, CertRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Look up a cert by ID — local only (extend with API call for server-side) */
export function verifyCertificate(certId: string): CertRecord | null {
  const certs = loadAllCerts();
  return certs[certId] ?? null;
}

// ── Path metadata for certificates ────────────────────────────────────────

export const CERT_PATH_META: Record<string, {
  title: string;
  fullTitle: string;
  color: string;
  requiredLessons: number;
  requiredCodercises: number;
  requiredQuizScore: number;
}> = {
  fqc: {
    title: "Foundations of QC",
    fullTitle: "Foundations of Quantum Computing",
    color: "#6366f1",
    requiredLessons: 7,
    requiredCodercises: 10,
    requiredQuizScore: 70,
  },
  fqa: {
    title: "Foundations of QA",
    fullTitle: "Foundations of Quantum Algorithms",
    color: "#8b5cf6",
    requiredLessons: 9,
    requiredCodercises: 12,
    requiredQuizScore: 75,
  },
};
