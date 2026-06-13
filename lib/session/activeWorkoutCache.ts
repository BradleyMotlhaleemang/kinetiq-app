export type PendingSetPayload = {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  idempotencyKey: string;
  clientId: string;
  createdAt: string;
};

export type ActiveWorkoutSnapshot = {
  workoutId: string;
  sets: Record<string, Array<{
    id: string;
    exerciseId: string;
    setNumber: number;
    weight: number;
    reps: number;
    rpe?: number;
    e1rm?: number;
  }>>;
  pendingSets: PendingSetPayload[];
  updatedAt: string;
};

const STORAGE_PREFIX = 'kinetiq_active_workout_';

function storageKey(workoutId: string) {
  return `${STORAGE_PREFIX}${workoutId}`;
}

export function loadActiveWorkout(workoutId: string): ActiveWorkoutSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(storageKey(workoutId)) ??
      sessionStorage.getItem(`kinetiq_session_sets_${workoutId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkoutSnapshot | Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && 'workoutId' in parsed) {
      return parsed as ActiveWorkoutSnapshot;
    }
    return {
      workoutId,
      sets: parsed as ActiveWorkoutSnapshot['sets'],
      pendingSets: [],
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveActiveWorkout(snapshot: ActiveWorkoutSnapshot) {
  if (typeof window === 'undefined') return;
  const payload: ActiveWorkoutSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);
  localStorage.setItem(storageKey(snapshot.workoutId), serialized);
  sessionStorage.setItem(`kinetiq_session_sets_${snapshot.workoutId}`, JSON.stringify(payload.sets));
}

export function clearActiveWorkout(workoutId: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(workoutId));
  sessionStorage.removeItem(`kinetiq_session_sets_${workoutId}`);
}

export function buildIdempotencyKey(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
): string {
  return `${workoutId}-${exerciseId}-${setNumber}`;
}

export function enqueuePendingSet(
  workoutId: string,
  pending: PendingSetPayload,
  sets: ActiveWorkoutSnapshot['sets'],
) {
  const existing = loadActiveWorkout(workoutId);
  const pendingSets = [...(existing?.pendingSets ?? [])];
  const idx = pendingSets.findIndex((item) => item.idempotencyKey === pending.idempotencyKey);
  if (idx === -1) {
    pendingSets.push(pending);
  } else {
    pendingSets[idx] = pending;
  }
  saveActiveWorkout({
    workoutId,
    sets,
    pendingSets,
    updatedAt: new Date().toISOString(),
  });
}

export function dequeuePendingSet(workoutId: string, idempotencyKey: string) {
  const existing = loadActiveWorkout(workoutId);
  if (!existing) return;
  saveActiveWorkout({
    ...existing,
    pendingSets: existing.pendingSets.filter((item) => item.idempotencyKey !== idempotencyKey),
  });
}

export function getPendingSets(workoutId: string): PendingSetPayload[] {
  return loadActiveWorkout(workoutId)?.pendingSets ?? [];
}
