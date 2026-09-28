import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  seen: boolean;
  open: boolean;
  step: number;
  total: number;
  openTour: () => void;
  closeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (n: number) => void;
  markSeen: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      seen: false,
      open: false,
      step: 0,
      total: 7,

      openTour:  () => set({ open: true, step: 0 }),
      closeTour: () => set({ open: false }),
      markSeen:  () => set({ seen: true, open: false }),

      nextStep: () => {
        const { step, total } = get();
        if (step < total - 1) set({ step: step + 1 });
        else set({ open: false, seen: true });
      },
      prevStep: () => {
        const { step } = get();
        if (step > 0) set({ step: step - 1 });
      },
      goToStep: (n) => set({ step: n }),
    }),
    { name: "qubit-tour", partialize: (s) => ({ seen: s.seen }) }
  )
);
