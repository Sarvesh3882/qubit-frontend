import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Experience = "explorer" | "learner" | "researcher";

interface ExperienceState {
  experience: Experience | null; // null = not yet chosen
  setExperience: (e: Experience) => void;
  clearExperience: () => void;
}

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set) => ({
      experience: null,
      setExperience: (e) => set({ experience: e }),
      clearExperience: () => set({ experience: null }),
    }),
    { name: "qubit-experience" }
  )
);
