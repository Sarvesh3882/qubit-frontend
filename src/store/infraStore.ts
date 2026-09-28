import { create } from "zustand";
import { persist } from "zustand/middleware";
import { infraApi } from "@/lib/api";

/* ─── Types matching backend models ─────────────────────────────────────── */
export type CapabilityLevel =
  | "available"
  | "unavailable"
  | "requires_auth"
  | "requires_enterprise"
  | "not_in_public_api"
  | "coming_later";

export interface ProviderCapabilities {
  job_submit: CapabilityLevel;
  job_cancel: CapabilityLevel;
  job_status: CapabilityLevel;
  job_result: CapabilityLevel;
  backend_list: CapabilityLevel;
  queue_info: CapabilityLevel;
  calibration_data: CapabilityLevel;
  noise_mitigation: CapabilityLevel;
  hybrid_session: CapabilityLevel;
  batch_submit: CapabilityLevel;
  circuit_compilation: CapabilityLevel;
  resource_monitoring: CapabilityLevel;
}

export interface ProviderMeta {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
}

export interface ProviderStatus {
  provider_id: string;
  connected: boolean;
  authenticated: boolean;
  account: string | null;
  edition: string;
  error: string | null;
  latency_ms: number | null;
}

export interface BackendInfo {
  id: string;
  name: string;
  provider_id: string;
  backend_type: "simulator" | "qpu" | "annealer";
  architecture: string;
  max_qubits: number;
  available: boolean;
  status: "online" | "offline" | "maintenance" | "unknown";
  queue_depth: number | null;
  description: string;
  [key: string]: unknown;
}

export interface JobRecord {
  id: string;
  provider_id: string;
  backend_id: string;
  status:
    | "submitted" | "queued" | "compiling" | "scheduled"
    | "running" | "completed" | "failed" | "cancelled" | "expired";
  shots: number;
  num_qubits: number;
  circuit_qasm: string | null;
  submitted_at: string;
  completed_at: string | null;
  result: {
    probabilities: Record<string, number>;
    counts: Record<string, number>;
    statevector: { re: number; im: number }[];
    bloch_spheres: Record<string, { x: number; y: number; z: number }>;
    qsphere: { state: string; prob: number; phase: number }[];
    circuit_qasm: string;
    shots: number;
    num_qubits: number;
  } | null;
  error: string | null;
  raw_provider_id: string | null;
  provider_meta: Record<string, unknown>;
}

/* ─── Store shape ────────────────────────────────────────────────────────── */
export type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface InfraState {
  /* Provider metadata */
  providers: ProviderMeta[];
  providerStatuses: Record<string, ProviderStatus>;
  connectionState: Record<string, ConnectionState>;

  /* Backends */
  backends: Record<string, BackendInfo[]>;        // keyed by provider_id
  selectedProviderId: string;
  selectedBackendId: string;

  /* Jobs */
  jobs: JobRecord[];
  activeJobId: string | null;

  /* Execution config */
  shots: number;

  /* Loading flags */
  isLoadingProviders: boolean;
  isLoadingBackends: boolean;
  isLoadingJobs: boolean;
  isSubmitting: boolean;

  /* Actions */
  loadProviders: () => Promise<void>;
  connectProvider: (providerId: string) => Promise<void>;
  loadBackends: (providerId: string) => Promise<void>;
  selectProvider: (providerId: string) => void;
  selectBackend: (backendId: string) => void;
  setShots: (n: number) => void;
  loadJobs: () => Promise<void>;
  submitJob: (circuitQasm: string, numQubits: number) => Promise<JobRecord | null>;
  cancelJob: (jobId: string) => Promise<void>;
  refreshJob: (jobId: string) => Promise<void>;
  setActiveJob: (jobId: string | null) => void;
}

export const useInfraStore = create<InfraState>()(
  persist(
    (set, get) => ({
      providers: [],
      providerStatuses: {},
      connectionState: {},
      backends: {},
      selectedProviderId: "local_aer",
      selectedBackendId: "aer_statevector",
      jobs: [],
      activeJobId: null,
      shots: 1024,
      isLoadingProviders: false,
      isLoadingBackends: false,
      isLoadingJobs: false,
      isSubmitting: false,

      loadProviders: async () => {
        set({ isLoadingProviders: true });
        try {
          const res = await infraApi.listProviders();
          set({ providers: res.data });
        } catch {
          // non-fatal — providers list may be unavailable if backend is down
        } finally {
          set({ isLoadingProviders: false });
        }
      },

      connectProvider: async (providerId) => {
        set((s) => ({
          connectionState: { ...s.connectionState, [providerId]: "connecting" },
        }));
        try {
          const res = await infraApi.getProviderStatus(providerId);
          const status: ProviderStatus = res.data;
          set((s) => ({
            providerStatuses: { ...s.providerStatuses, [providerId]: status },
            connectionState: {
              ...s.connectionState,
              [providerId]: status.connected ? "connected" : "error",
            },
          }));
          // Auto-load backends on successful connect
          if (status.connected) {
            await get().loadBackends(providerId);
          }
        } catch (err: unknown) {
          const msg = (err as { message?: string })?.message ?? "Connection failed";
          set((s) => ({
            connectionState: { ...s.connectionState, [providerId]: "error" },
            providerStatuses: {
              ...s.providerStatuses,
              [providerId]: {
                provider_id: providerId,
                connected: false,
                authenticated: false,
                account: null,
                edition: "unknown",
                error: msg,
                latency_ms: null,
              },
            },
          }));
        }
      },

      loadBackends: async (providerId) => {
        set({ isLoadingBackends: true });
        try {
          const res = await infraApi.listBackends(providerId);
          set((s) => ({
            backends: { ...s.backends, [providerId]: res.data },
          }));
        } catch {
          // keep existing list
        } finally {
          set({ isLoadingBackends: false });
        }
      },

      selectProvider: (providerId) => {
        set({ selectedProviderId: providerId, selectedBackendId: "" });
        // Load backends if not yet fetched, then auto-select first available
        const existing = get().backends[providerId];
        if (!existing || existing.length === 0) {
          get().loadBackends(providerId).then(() => {
            const loaded = get().backends[providerId];
            if (loaded && loaded.length > 0) {
              // Auto-select first available backend for this provider
              const first = loaded.find((b) => b.available) ?? loaded[0];
              set({ selectedBackendId: first.id });
            }
          });
        } else {
          // Already loaded — auto-select first available
          const first = existing.find((b) => b.available) ?? existing[0];
          set({ selectedBackendId: first.id });
        }
      },

      selectBackend: (backendId) => set({ selectedBackendId: backendId }),

      setShots: (n) => set({ shots: Math.max(1, Math.min(8192, n)) }),

      loadJobs: async () => {
        set({ isLoadingJobs: true });
        try {
          const res = await infraApi.getJobs();
          set({ jobs: res.data });
        } catch {
          // not authenticated — keep empty
        } finally {
          set({ isLoadingJobs: false });
        }
      },

      submitJob: async (circuitQasm, numQubits) => {
        const { selectedProviderId, selectedBackendId, shots } = get();
        if (!selectedBackendId) return null;
        set({ isSubmitting: true });
        try {
          const res = await infraApi.submitJob({
            provider_id:  selectedProviderId,
            backend_id:   selectedBackendId,
            circuit_qasm: circuitQasm,
            shots,
            num_qubits:   numQubits,
          });
          const job: JobRecord = res.data;
          set((s) => ({ jobs: [job, ...s.jobs], activeJobId: job.id }));
          return job;
        } catch (err: unknown) {
          // Expose the actual server error so callers can show a meaningful message
          const axiosErr = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
          const status   = axiosErr?.response?.status;
          const detail   = axiosErr?.response?.data?.detail ?? axiosErr?.message ?? "Unknown error";
          // Re-throw a typed object so the call site can use it
          throw { httpStatus: status, detail };
        } finally {
          set({ isSubmitting: false });
        }
      },

      cancelJob: async (jobId) => {
        try {
          await infraApi.cancelJob(jobId);
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === jobId ? { ...j, status: "cancelled" as const } : j
            ),
          }));
        } catch {
          // surface error in UI via toast at call site
          throw new Error("Cancel failed");
        }
      },

      refreshJob: async (jobId) => {
        try {
          const res = await infraApi.refreshJob(jobId);
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === jobId ? res.data : j)),
          }));
        } catch {
          throw new Error("Refresh failed");
        }
      },

      setActiveJob: (jobId) => set({ activeJobId: jobId }),
    }),
    {
      name: "qubit-infra",
      partialize: (s) => ({
        selectedProviderId: s.selectedProviderId,
        selectedBackendId:  s.selectedBackendId,
        shots:              s.shots,
      }),
    }
  )
);
