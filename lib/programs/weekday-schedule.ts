export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
export type DayType = 'WORKOUT' | 'REST';

export type ScheduleDay = {
  dayNumber: number;
  dayType: DayType;
  label: string;
};

export function buildDefaultSchedule(trainingDays: number): ScheduleDay[] {
  return WEEKDAYS.map((label, index) => {
    const dayNumber = index + 1;
    const isWorkout = dayNumber <= trainingDays;
    return {
      dayNumber,
      dayType: isWorkout ? 'WORKOUT' : 'REST',
      label: isWorkout ? label : 'Rest',
    };
  });
}

export function countWorkoutDays(schedule: ScheduleDay[]): number {
  return schedule.filter((day) => day.dayType === 'WORKOUT').length;
}

export function toggleScheduleDay(
  schedule: ScheduleDay[],
  dayNumber: number,
  maxWorkoutDays: number,
): ScheduleDay[] {
  return schedule.map((day) => {
    if (day.dayNumber !== dayNumber) return day;
    if (day.dayType === 'WORKOUT') {
      return { ...day, dayType: 'REST', label: 'Rest' };
    }
    if (countWorkoutDays(schedule) >= maxWorkoutDays) return day;
    const weekday = WEEKDAYS[dayNumber - 1] ?? `Day ${dayNumber}`;
    return { ...day, dayType: 'WORKOUT', label: weekday };
  });
}
