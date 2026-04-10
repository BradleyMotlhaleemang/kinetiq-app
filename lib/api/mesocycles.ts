import api from './client';

export const mesocyclesApi = {
  generate: (data: { name: string; totalWeeks: number; templateId?: string }) =>
    api.post('/api/v1/mesocycles/generate', data),

  active: () => api.get('/api/v1/mesocycles/active'),
};