import { create } from 'zustand';
import type { Prescription } from '@/lib/api/workouts';

export type { Prescription };

type ServerSet = {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  setNumber: number;
};

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

  hydrateFromServer: (serverSets: ServerSet[]) => void;

  // Used in app/workout/[id]/page.tsx (completeSession) to reset the session
  // state before navigating away after a workout is finished.
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  workoutId: null,
  sets: {},
  prescriptions: {},

  setWorkoutId: (id) => {
    const prev = get().workoutId;
    if (prev !== id) {
      set({ workoutId: id, prescriptions: {} });
    } else {
      set({ workoutId: id });
    }
  },

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

  hydrateFromServer: (serverSets) => {
    if (serverSets.length === 0) return;

    const state = get();
    const serverIds = new Set(serverSets.map((s) => s.id));

    const merged: Record<string, SetLog[]> = {};
    for (const [exerciseId, logs] of Object.entries(state.sets)) {
      const kept = logs.filter((log) => !serverIds.has(log.id));
      if (kept.length > 0) {
        merged[exerciseId] = kept;
      }
    }

    for (const server of serverSets) {
      const entry: SetLog = {
        id: server.id,
        exerciseId: server.exerciseId,
        setNumber: server.setNumber,
        weight: server.weight,
        reps: server.reps,
      };

      const bucket = merged[server.exerciseId] ?? [];
      const idx = bucket.findIndex((log) => log.id === server.id);
      if (idx !== -1) {
        bucket[idx] = entry;
        merged[server.exerciseId] = bucket;
      } else {
        merged[server.exerciseId] = [...bucket, entry];
      }
    }

    set({ sets: merged });

    const currentWorkoutId = get().workoutId;
    if (currentWorkoutId) {
      sessionStorage.setItem(
        `kinetiq_session_sets_${currentWorkoutId}`,
        JSON.stringify(get().sets)
      );
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
