import api from './client';

export interface TemplateListItem {
  id: string;
  slug: string;
  name: string;
  goal: string;
  level: string;
  splitStyle: string;
  splitStyleLabel: string;
  daysPerWeek: number;
  durationWeeks: string;
  primaryFocus: string;
  featured: boolean;
  badge: string | null;
  difficultyWarning: string | null;
  progressionType: string;
  days: string[];
  stats: Array<{ label: string; value: string }>;
}

export interface TemplateDetail extends TemplateListItem {
  description: string | null;
  goalTags: string[];
  experienceTags: string[];
  splitConfigs: Array<{
    id: string;
    splitLabel: string;
    days: Array<{
      dayNumber: number;
      label: string;
      exercises: Array<{
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
        rpeTarget: number;
        exercise: {
          id: string;
          name: string;
          primaryMuscle: string | null;
        } | null;
      }>;
    }>;
  }>;
  programSummary: {
    mesocycleBlocks: number;
    workoutTemplates: number;
    totalWeeks: number;
    sessionCount: number;
  };
}

export const templatesApi = {
  all: (params?: {
    goal?: string;
    level?: string;
    splitStyle?: string;
    daysPerWeekMin?: number;
    daysPerWeekMax?: number;
    featuredOnly?: boolean;
    search?: string;
  }) => {
    if (!params) return api.get('/api/v1/templates');
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value));
      }
    });
    const query = search.toString();
    return api.get(`/api/v1/templates${query ? `?${query}` : ''}`);
  },
  recommended: (daysAvailable?: number) =>
    api.get(
      `/api/v1/templates/recommended${
        daysAvailable ? `?daysAvailable=${daysAvailable}` : ''
      }`,
    ),
  findOne: (idOrSlug: string) => api.get(`/api/v1/templates/${idOrSlug}`),
  mine: () => api.get('/api/v1/templates/mine'),
  fork: (idOrSlug: string) => api.post(`/api/v1/templates/${idOrSlug}/fork`),
  scratch: (body?: {
    name?: string;
    daysPerWeek?: number;
    days?: Array<{ dayNumber: number; dayType: 'WORKOUT' | 'REST'; label: string }>;
  }) => api.post('/api/v1/templates/scratch', body ?? {}),
  update: (
    id: string,
    body: {
      name?: string;
      description?: string;
      daysPerWeek?: number;
      splitType?: string;
      level?: string;
      goal?: string;
    },
  ) => api.patch(`/api/v1/templates/${id}`, body),
  remove: (id: string) => api.delete(`/api/v1/templates/${id}`),
  replaceDays: (
    id: string,
    days: Array<{
      dayNumber: number;
      dayType: 'WORKOUT' | 'REST';
      label: string;
      exercises?: Array<{
        exerciseId: string;
        orderIndex: number;
        setsTarget: number;
        repRangeMin: number;
        repRangeMax: number;
        rpeTarget?: number;
      }>;
    }>,
  ) => api.patch(`/api/v1/templates/${id}/days`, { days }),
  validate: (id: string) => api.post(`/api/v1/templates/${id}/validate`),
};
