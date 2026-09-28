# QUBIT — Frontend

> AI-Based Interactive Quantum Algorithm Learning Platform

QUBIT is a gamified, adaptive quantum computing education platform built for students, researchers, and curious minds. It combines structured learning with hands-on circuit simulation, AI tutoring, and research tools.

**Live Demo**: [qubit-henna.vercel.app](https://qubit-henna.vercel.app)  
**Backend API**: [qubit-backend-fbli.onrender.com](https://qubit-backend-fbli.onrender.com/api/health)

---

## Features

- **Codebook** — Structured quantum lessons with interactive code challenges, quizzes, and a visual curriculum map
- **AI Tutor** — Mistral-powered assistant with context-aware help, lesson RAG, and conversation history
- **Explorer** — Gamified learning world with zones, levels, XP, and achievements
- **Composer** — Drag-and-drop quantum circuit editor (Qiskit Aer, PennyLane, QASM3 backends)
- **Playground** — Gate-model simulator and D-Wave quantum annealing playground
- **Research Intelligence** — Papers from arXiv, OpenAlex, Semantic Scholar + live news feed
- **Adaptive Learning** — Placement assessment, skill tracking, personalised learning paths
- **Certification** — Auto-issued certificates on course completion with unique IDs
- **Classroom** — Teacher dashboard, student assignments, progress tracking
- **Infrastructure** — Origin Quantum QPanda3 real QPU access

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| HTTP | Axios |
| Icons | Lucide React, Heroicons |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- QUBIT backend running (see [qubit-backend](https://github.com/Sarvesh3882/qubit-backend))

### Installation

```bash
git clone https://github.com/Sarvesh3882/qubit-frontend.git
cd qubit-frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production, point this to your deployed backend:

```env
NEXT_PUBLIC_API_URL=https://qubit-backend-fbli.onrender.com/api
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── codebook/           # Curriculum map + lesson viewer
│   ├── explorer/           # Gamified learning world
│   ├── composer/           # Circuit editor
│   ├── playground/         # Quantum simulators
│   ├── research/           # Research intelligence
│   ├── assessment/         # Placement test
│   ├── certification/      # Certificate viewer + claim
│   ├── classroom/          # Teacher + student dashboards
│   ├── profile/            # User profile + achievements
│   └── auth/               # Login + signup
├── components/             # Shared UI components
├── store/                  # Zustand state stores
├── hooks/                  # Custom React hooks
├── lib/                    # API client + utilities
└── contexts/               # React contexts
```

---

## Deployment

Deployed on **Vercel** with automatic deployments on push to `main`.

Set the following environment variable in Vercel dashboard:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://qubit-backend-fbli.onrender.com/api` |

---

## Related

- [qubit-backend](https://github.com/Sarvesh3882/qubit-backend) — FastAPI backend (Python)

---

## License

MIT
