import { workoutsApi } from '@/lib/api/workouts';

export type ExpandDay = {
  id: string;
  dayNumber: number | null;
  dayLabel?: string;
  muscleSummary?: string | null;
  sessionType: string;
  date: string;
  completed: boolean;
  prescription: unknown;
};

export type ExpandWeek = {
  weekNumber: number;
  isDeloadWeek?: boolean;
  label: string;
  days: ExpandDay[];
};

export type ExpandProgram = {
  id: string;
  name: string;
  status?: string;
  weekCount?: number;
  currentWeek: number;
  totalWeeks?: number;
  startDate: string;
  volumeTargets?: Record<string, { mev: number; mrv: number; current: number }>;
  weeks: ExpandWeek[];
};

export function computeTodayDayNumber(startDate: string, currentWeek: number): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (currentWeek - 1) * 7);
  const diffDays = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  return (diffDays % 7) + 1;
}

export function findTodayWorkout(program: ExpandProgram): ExpandDay | null {
  const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeek);
  if (!currentWeek) return null;
  const todayDayNumber = computeTodayDayNumber(program.startDate, program.currentWeek);
  return currentWeek.days.find((d) => d.dayNumber === todayDayNumber) ?? null;
}

export function findNextPlannedDay(program: ExpandProgram): ExpandDay | null {
  const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeek);
  if (!currentWeek) return null;
  return currentWeek.days.find((d) => !d.completed) ?? null;
}

export function computeSessionProgress(program: ExpandProgram | null): {
  completed: number;
  total: number;
  pct: number;
} {
  if (!program?.weeks?.length) return { completed: 0, total: 0, pct: 0 };
  const allDays = program.weeks.flatMap((w) => w.days);
  const completed = allDays.filter((d) => d.completed).length;
  const total = allDays.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

export function computeCalendarWeek(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

export function resolveSessionTarget(program: ExpandProgram): ExpandDay | null {
  const todayWorkout = findTodayWorkout(program);
  return todayWorkout && !todayWorkout.completed ? todayWorkout : findNextPlannedDay(program);
}

export async function startMesocycleSession(
  mesocycleId: string,
  program: ExpandProgram,
): Promise<string> {
  const targetDay = resolveSessionTarget(program);
  if (targetDay?.id) {
    await workoutsApi.start(targetDay.id);
    return targetDay.id;
  }

  const res = await workoutsApi.create({ mesocycleId });
  const workoutId = (res.data as { id?: string })?.id;
  if (!workoutId) throw new Error('Failed to create workout');
  return workoutId;
}

export type WeekOneWorkout = {
  splitDayLabel?: string;
  weekNumber?: number;
  dayNumber?: number;
};

export function deriveWeekOneDayLetters(workouts: WeekOneWorkout[]): string[] {
  if (!Array.isArray(workouts) || workouts.length === 0) return [];
  return [...workouts]
    .filter((w) => (w.weekNumber ?? 1) === 1)
    .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))
    .map((w) => {
      const label = w.splitDayLabel ?? '';
      const match = label.match(/-\s*(.+)$/);
      const dayName = match?.[1] ?? label;
      return dayName.trim().charAt(0).toUpperCase() || '?';
    })
    .filter((letter, index, list) => list.indexOf(letter) === index);
}

export function formatGoalLabel(goal?: string | null): string | null {
  if (!goal?.trim()) return null;
  return goal
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
