import axios from "axios";
import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const apiClient = axios.create({ baseURL: BASE });

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("qubit_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    apiClient.post("/auth/register", data),
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  me: () => apiClient.get("/auth/me"),
};

// ── Curriculum ───────────────────────────────────────────────────────────────
export const curriculumApi = {
  getPaths: () => apiClient.get("/curriculum/paths"),
  getPath: (pathId: string) => apiClient.get(`/curriculum/paths/${pathId}`),
  getModule: (pathId: string, moduleId: string) =>
    apiClient.get(`/curriculum/paths/${pathId}/modules/${moduleId}`),
  getLesson: (pathId: string, moduleId: string, lessonId: string) =>
    apiClient.get(`/curriculum/paths/${pathId}/modules/${moduleId}/lessons/${lessonId}`),
  getMapData: () => apiClient.get("/curriculum/map"),
  getMeta: () => apiClient.get("/curriculum/meta"),
};

// ── Progress ─────────────────────────────────────────────────────────────────
export const progressApi = {
  myProgress: () => apiClient.get("/progress/me"),
  completeLesson: (lessonId: string, data: { module_id: string; path_id: string; score?: number }) =>
    apiClient.post(`/progress/lesson/${lessonId}/complete`, { ...data, completed: true }),
  trackAccess: (lessonId: string, data: { module_id: string; path_id: string }) =>
    apiClient.post(`/progress/lesson/${lessonId}/access`, { ...data }),
  submitCode: (coderciseId: string, data: { lesson_id: string; code: string; passed: boolean; module_id?: string }) =>
    apiClient.post(`/progress/codercise/${coderciseId}/submit`, data),
  getModuleStatus: () => apiClient.get("/progress/module-status"),
  getQuizQuestions: (quizId: string) =>
    apiClient.get(`/progress/quiz/${quizId}/questions`),
  submitQuiz: (quizId: string, data: { answers: Record<string, number>; module_id: string; path_id: string }) =>
    apiClient.post(`/progress/quiz/${quizId}/submit`, data),
  myQuizResults: () => apiClient.get("/progress/quiz/me"),
};

// ── Composer ─────────────────────────────────────────────────────────────────
export const composerApi = {
  simulate: (payload: {
    num_qubits: number;
    gates: { gate: string; qubits: number[]; params?: number[]; moment?: number }[];
    shots?: number;
    include_statevector?: boolean;
    framework?: string;   // qiskit | pennylane | openqasm3 | cirq | qbraid | qpiai
  }) => apiClient.post("/composer/simulate", { shots: 1024, include_statevector: true, framework: "qiskit", ...payload }),
};

// ── Code Runner ───────────────────────────────────────────────────────────────
export const runnerApi = {
  execute: (code: string, test_code: string) =>
    apiClient.post("/run/execute", { code, test_code }),
  executeQiskit: (code: string, test_code: string) =>
    apiClient.post("/run/execute-qiskit", { code, test_code }),
  executePennylane: (code: string, test_code: string) =>
    apiClient.post("/run/execute-pennylane", { code, test_code }),
};

// ── Algorithms ───────────────────────────────────────────────────────────────
export const algorithmsApi = {
  list: () => apiClient.get("/algorithms/"),
  get: (id: string) => apiClient.get(`/algorithms/${id}`),
  run: (id: string, parameters: Record<string, unknown>) =>
    apiClient.post(`/algorithms/${id}/run`, { parameters }),
};

// ── AI Agent ──────────────────────────────────────────────────────────────────
export const agentApi = {
  chat: (payload: {
    message: string;
    context?: {
      path_id?: string; path_title?: string;
      module_id?: string; module_title?: string;
      lesson_id?: string; lesson_title?: string;
      current_code?: string;
      simulation_result?: Record<string, unknown>;
      completed_lessons?: string[];
      current_concept?: string;
    };
    history?: { role: string; content: string }[];
  }) => apiClient.post("/agent/chat", payload),
};

// ── Placement Assessment ──────────────────────────────────────────────────────
export const assessmentApi = {
  submit: (data: {
    score: number;
    level: string;
    suggested_difficulty: string;
    recommended_path_id: string;
    recommended_module_id: string;
    strong_concepts: string[];
    weak_concepts: string[];
    per_concept_scores: Record<string, number>;
    total_questions: number;
    correct_answers: number;
    skipped?: boolean;
  }) => apiClient.post("/assessment/submit", data),

  getMe: () => apiClient.get("/assessment/me"),

  retake: () => apiClient.delete("/assessment/me"),
};

// ── Adaptive Learning ─────────────────────────────────────────────────────────
export const adaptiveApi = {
  getState: () => apiClient.get("/adaptive/state"),
  recordConceptAnswer: (concept: string, correct: boolean, source = "quiz") =>
    apiClient.post("/adaptive/concept", { concept, correct, source }),
};

// ── Certification ─────────────────────────────────────────────────────────────
export const certificationApi = {
  checkEligibility: (pathId: string) =>
    apiClient.get(`/certification/eligibility/${pathId}`),

  issue: (pathId: string, finalScore = 0) =>
    apiClient.post("/certification/issue", { path_id: pathId, final_score: finalScore }),

  getMyCerts: () => apiClient.get("/certification/me"),

  verify: (certId: string) =>
    apiClient.get(`/certification/${certId}`),
};

// ── Research Intelligence ─────────────────────────────────────────────────────
export const researchApi = {
  search: (params: { q: string; page?: number; per_page?: number; sources?: string; from_date?: string }) =>
    apiClient.get("/research/search", { params }),
  latest: (params?: { topic?: string; per_page?: number }) =>
    apiClient.get("/research/latest", { params }),
  getById: (id: string) =>
    apiClient.get(`/research/${encodeURIComponent(id)}`),
  getRelated: (id: string, limit = 5) =>
    apiClient.get(`/research/${encodeURIComponent(id)}/related`, { params: { limit } }),
  getCitations: (id: string, limit = 20) =>
    apiClient.get(`/research/${encodeURIComponent(id)}/citations`, { params: { limit } }),
};

// ── News ──────────────────────────────────────────────────────────────────────
export const newsApi = {
  latest: (params?: { topic?: string; max_results?: number }) =>
    apiClient.get("/news/latest", { params }),
  search: (params: { q: string; max_results?: number; from_date?: string }) =>
    apiClient.get("/news/search", { params }),
};
export const infraApi = {
  listProviders: () =>
    apiClient.get("/infrastructure/providers"),
  getProviderStatus: (id: string) =>
    apiClient.get(`/infrastructure/providers/${id}/status`),
  listBackends: (providerId: string) =>
    apiClient.get(`/infrastructure/providers/${providerId}/backends`),
  getJobs: () =>
    apiClient.get("/infrastructure/jobs"),
  submitJob: (payload: {
    provider_id: string;
    backend_id: string;
    circuit_qasm: string;
    shots: number;
    num_qubits: number;
  }) => apiClient.post("/infrastructure/jobs", payload),
  getJob: (jobId: string) =>
    apiClient.get(`/infrastructure/jobs/${jobId}`),
  cancelJob: (jobId: string) =>
    apiClient.post(`/infrastructure/jobs/${jobId}/cancel`),
  refreshJob: (jobId: string) =>
    apiClient.post(`/infrastructure/jobs/${jobId}/refresh`),
};

// ── Classroom ─────────────────────────────────────────────────────────────────
export const classroomApi = {
  // Teacher
  create: (data: { name: string; description?: string }) =>
    apiClient.post("/classroom/", data),
  mine: () =>
    apiClient.get("/classroom/mine"),
  get: (id: number) =>
    apiClient.get(`/classroom/${id}`),
  deactivate: (id: number) =>
    apiClient.delete(`/classroom/${id}`),
  students: (id: number) =>
    apiClient.get(`/classroom/${id}/students`),
  addAssignment: (id: number, data: {
    content_type: string;
    content_id: string;
    title: string;
    due_date?: string | null;
  }) => apiClient.post(`/classroom/${id}/assignments`, data),
  removeAssignment: (classroomId: number, assignmentId: number) =>
    apiClient.delete(`/classroom/${classroomId}/assignments/${assignmentId}`),
  analytics: (id: number) =>
    apiClient.get(`/classroom/${id}/analytics`),

  // Student
  join: (invite_code: string) =>
    apiClient.post("/classroom/join", { invite_code }),
  enrolled: () =>
    apiClient.get("/classroom/enrolled"),
  assignments: (id: number) =>
    apiClient.get(`/classroom/${id}/assignments`),
};
