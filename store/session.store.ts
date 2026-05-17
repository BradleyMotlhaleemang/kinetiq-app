import { create } from 'zustand';
import type { Prescription } from '@/lib/api/workouts';

export type { Prescription };

interface SetLog {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  e1rm?: number;
}

interface SessionState {
  sets: Record<string, SetLog[]>;
  prescriptions: Record<string, Prescription>;

  // Used in app/workout/[id]/page.tsx (handleSetComplete) to append a logged set
  // to the in-memory session after a successful POST /workouts/:id/sets.
  addSet: (exerciseId: string, set: SetLog) => void;

  // Used in app/workout/[id]/page.tsx (fetchPrescriptionForExercise) to cache
  // the engine's per-exercise prescription returned by
  // GET /workouts/:id/prescription.
  setPrescription: (exerciseId: string, prescription: Prescription) => void;

  // Used in app/workout/[id]/page.tsx (completeSession) to reset the session
  // state before navigating away after a workout is finished.
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sets: {},
  prescriptions: {},

  addSet: (exerciseId, newSet) =>
    set((state) => ({
      sets: {
        ...state.sets,
        [exerciseId]: [...(state.sets[exerciseId] ?? []), newSet],
      },
    })),

  setPrescription: (exerciseId, prescription) =>
    set((state) => ({
      prescriptions: { ...state.prescriptions, [exerciseId]: prescription },
    })),

  clearSession: () =>
    set({
      sets: {},
      prescriptions: {},
    }),
}));
