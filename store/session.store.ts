import { create } from 'zustand';
import type { Prescription } from '@/lib/api/workouts';
import {
  clearActiveWorkout,
  loadActiveWorkout,
  saveActiveWorkout,
} from '@/lib/session/activeWorkoutCache';

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
  addSet: (exerciseId: string, set: SetLog) => void;
  replaceSet: (exerciseId: string, clientId: string, set: SetLog) => void;
  setPrescription: (exerciseId: string, prescription: Prescription) => void;
  rehydrate: (workoutId: string) => void;
  hydrateFromServer: (serverSets: ServerSet[]) => void;
  clearSession: () => void;
  persistSnapshot: () => void;
  getSetsSnapshot: () => Record<string, SetLog[]>;
}

function persistToStorage(workoutId: string, sets: Record<string, SetLog[]>) {
  const existing = loadActiveWorkout(workoutId);
  saveActiveWorkout({
    workoutId,
    sets,
    pendingSets: existing?.pendingSets ?? [],
    updatedAt: new Date().toISOString(),
  });
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
      persistToStorage(currentWorkoutId, get().sets);
    }
  },

  replaceSet: (exerciseId, clientId, nextSet) => {
    set((state) => {
      const bucket = state.sets[exerciseId] ?? [];
      const withoutDupes = bucket.filter(
        (item) => item.id !== clientId && item.setNumber !== nextSet.setNumber,
      );
      return {
        sets: {
          ...state.sets,
          [exerciseId]: [...withoutDupes, nextSet],
        },
      };
    });

    const currentWorkoutId = get().workoutId;
    if (currentWorkoutId) {
      persistToStorage(currentWorkoutId, get().sets);
    }
  },

  setPrescription: (exerciseId, prescription) =>
    set((state) => ({
      prescriptions: { ...state.prescriptions, [exerciseId]: prescription },
    })),

  rehydrate: (workoutId) => {
    const snapshot = loadActiveWorkout(workoutId);
    if (!snapshot?.sets) return;
    set({ sets: snapshot.sets, workoutId });
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
      persistToStorage(currentWorkoutId, get().sets);
    }
  },

  clearSession: () => {
    const currentWorkoutId = get().workoutId;
    if (currentWorkoutId) {
      clearActiveWorkout(currentWorkoutId);
    }
    set({
      sets: {},
      prescriptions: {},
      workoutId: null,
    });
  },

  persistSnapshot: () => {
    const currentWorkoutId = get().workoutId;
    if (!currentWorkoutId) return;
    persistToStorage(currentWorkoutId, get().sets);
  },

  getSetsSnapshot: () => get().sets,
}));
