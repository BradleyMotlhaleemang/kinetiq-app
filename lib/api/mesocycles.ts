import api from './client';

export const mesocyclesApi = {
  generate: (data: { name: string; totalWeeks: number; templateId?: string }) =>
    api.post('/mesocycles/generate', data),

  active: () => api.get('/mesocycles/active'),
};