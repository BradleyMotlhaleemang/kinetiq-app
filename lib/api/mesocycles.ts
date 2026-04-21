import api from './client';

export interface RecommendedTemplate {
  id: string;
  name: string;
  splitType: string;
  splitTypeLabel: string;
  daysPerWeek: number;
  splits: Array<{
    id: string;
    splitLabel: string;
    days: Array<{
      id: string;
      dayNumber: number;
      label: string;
      exercises: Array<{
        id: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
      }>;
    }>;
  }>;
}

export interface MesocycleRecommendation {
  recommended: RecommendedTemplate | null;
  alternatives: RecommendedTemplate[];
  rationale: string;
  profile: {
    goalModeLabel: string | null;
    experienceLevelLabel: string | null;
  };
}

export const mesocyclesApi = {
  generate: (data: { name: string; totalWeeks: number; templateId?: string }) =>
    api.post('/api/v1/mesocycles/generate', data),

  active: () => api.get('/api/v1/mesocycles/active'),
  recommend: () => api.get('/api/v1/mesocycles/recommend'),
  all: () => api.get('/api/v1/mesocycles/all'),

  findOne: (id: string) => api.get(`/api/v1/mesocycles/${id}`),
  volumeStatus: (id: string) => api.get(`/api/v1/mesocycles/${id}/volume-status`),
  close: (id: string) => api.patch(`/api/v1/mesocycles/${id}/close`),
};
