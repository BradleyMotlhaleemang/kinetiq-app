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
  workoutId: string | null;
  sets: Record<string, SetLog[]>;
  prescriptions: Record<string, Prescription>;
  setWorkoutId: (id: string) => void;

  // Used in app/workout/[id]/page.tsx (handleSetComplete) to append a logged set
  // to the in-memory session after a successful POST /workouts/:id/sets.
  addSet: (exerciseId: string, set: SetLog) => void;

  // Used in app/workout/[id]/page.tsx (fetchPrescriptionForExercise) to cache
  // the engine's per-exercise prescription returned by
  // GET /workouts/:id/prescription.
  setPrescription: (exerciseId: string, prescription: Prescription) => void;

  rehydrate: (workoutId: string) => void;

  // Used in app/workout/[id]/page.tsx (completeSession) to reset the session
  // state before navigating away after a workout is finished.
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  workoutId: null,
  sets: {},
  prescriptions: {},

  setWorkoutId: (id) =>
    set({
      workoutId: id,
    }),

  addSet: (exerciseId, newSet) => {
    set((state) => ({
      sets: {
        ...state.sets,
        [exerciseId]: [...(state.sets[exerciseId] ?? []), newSet],
      },
    }));

    const currentWorkoutId = get().workoutId;
    if (currentWorkoutId) {
      const updatedSets = get().sets;
      sessionStorage.setItem(
        `kinetiq_session_sets_${currentWorkoutId}`,
        JSON.stringify(updatedSets)
      );
    }
  },

  setPrescription: (exerciseId, prescription) =>
    set((state) => ({
      prescriptions: { ...state.prescriptions, [exerciseId]: prescription },
    })),

  rehydrate: (workoutId) => {
    try {
      const stored = sessionStorage.getItem(
        `kinetiq_session_sets_${workoutId}`
      );
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!parsed) return;
      set({
        sets: parsed,
      });
    } catch {
      return;
    }
  },

  clearSession: () => {
    set({
      sets: {},
      prescriptions: {},
    });
    const currentWorkoutId = get().workoutId;
    if (currentWorkoutId) {
      sessionStorage.removeItem(
        `kinetiq_session_sets_${currentWorkoutId}`
      );
    }
    set({
      workoutId: null,
    });
  },
}));
