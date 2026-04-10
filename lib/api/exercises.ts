import api from './client';

export const exercisesApi = {
  findAll: (filters?: { primaryMuscle?: string; movementPattern?: string }) => {
    const params = new URLSearchParams();
    if (filters?.primaryMuscle) params.append('primaryMuscle', filters.primaryMuscle);
    if (filters?.movementPattern) params.append('movementPattern', filters.movementPattern);
    const query = params.toString();
    return api.get(`/api/v1/exercises${query ? `?${query}` : ''}`);
  },

  findOne: (id: string) => api.get(`/api/v1/exercises/${id}`),
};