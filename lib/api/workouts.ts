import api from './client';

export const workoutsApi = {
  create: (data: { mesocycleId?: string; splitDayLabel?: string }) =>
    api.post('/workouts', data),

  findOne: (id: string) => api.get(`/workouts/${id}`),

  history: () => api.get('/workouts/history'),

  getPrescription: (workoutId: string, exerciseId: string) =>
    api.get(`/workouts/${workoutId}/prescription`, {
      params: { exerciseId },
    }),

  addSet: (
    workoutId: string,
    data: {
      exerciseId: string;
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
    },
  ) => api.post(`/workouts/${workoutId}/sets`, data),

  complete: (workoutId: string) =>
    api.patch(`/workouts/${workoutId}/complete`),
};