import { create } from 'zustand';

interface SetLog {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  e1rm?: number;
}

interface Prescription {
  exerciseId: string;
  action: string;
  actionLabel: string;
  weightTarget: number;
  sessionMode: string;
  sessionModeLabel: string;
  sessionModeColor: string;
  reason: string;
}

interface SessionState {
  currentWorkoutId: string | null;
  currentExerciseIndex: number;
  sessionMode: string | null;
  sessionModeLabel: string | null;
  sets: Record<string, SetLog[]>;
  prescriptions: Record<string, Prescription>;
  setWorkout: (workoutId: string) => void;
  setSessionMode: (mode: string, label: string) => void;
  addSet: (exerciseId: string, set: SetLog) => void;
  setPrescription: (exerciseId: string, prescription: Prescription) => void;
  nextExercise: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentWorkoutId: null,
  currentExerciseIndex: 0,
  sessionMode: null,
  sessionModeLabel: null,
  sets: {},
  prescriptions: {},

  setWorkout: (workoutId) => set({ currentWorkoutId: workoutId }),

  setSessionMode: (mode, label) =>
    set({ sessionMode: mode, sessionModeLabel: label }),

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

  nextExercise: () =>
    set((state) => ({
      currentExerciseIndex: state.currentExerciseIndex + 1,
    })),

  clearSession: () =>
    set({
      currentWorkoutId: null,
      currentExerciseIndex: 0,
      sessionMode: null,
      sessionModeLabel: null,
      sets: {},
      prescriptions: {},
    }),
}));