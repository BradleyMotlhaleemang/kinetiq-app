import api from './client';

export const mesocyclesApi = {
  generate: (data: { name: string; totalWeeks: number; templateId?: string }) =>
    api.post('/api/v1/mesocycles/generate', data),

  active: () => api.get('/api/v1/mesocycles/active'),
  all: () => api.get('/api/v1/mesocycles/all'),

  findOne: (id: string) => api.get(`/api/v1/mesocycles/${id}`),
  volumeStatus: (id: string) => api.get(`/api/v1/mesocycles/${id}/volume-status`),
  close: (id: string) => api.patch(`/api/v1/mesocycles/${id}/close`),
};
