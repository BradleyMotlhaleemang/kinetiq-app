import api from './client';

export const exercisesApi = {
  findAll: (filters?: { primaryMuscle?: string; movementPattern?: string }) =>
    api.get('/exercises', { params: filters }),

  findOne: (id: string) => api.get(`/exercises/${id}`),
};