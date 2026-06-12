import api from './client';

export type AdminStats = {
  templateCount: number;
  exerciseCount: number;
  activeUsers: number;
  workoutsLogged: number;
};

export type AdminActivity = {
  id: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string | null;
  createdAt: string;
  actor?: { id: string; displayName: string; email: string } | null;
};

export type AdminExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  movementPattern?: string;
  exerciseType?: string;
  movementClass: string | null;
  chestRegion: string | null;
  inclineAngleDegrees: number | null;
  category?: string;
  metadata?: {
    equipmentProfile?: { id: string; name: string; requiredEquipment: string[] };
    executionProfile?: { id: string; zone: string };
    fatigueScore?: number;
    stabilityDemand?: number;
    methodFatigueMultiplier?: number;
  } | null;
  substitutionPools?: Array<{
    id: string;
    priority: number;
    suitableWhenPain: string[];
    pool: { id: string; name: string };
  }>;
  _count?: { sets: number };
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  accountStatus: string;
  emailVerified: boolean;
  experienceLevel: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  lockedUntil: string | null;
  activeMesocycle: { id: string; name: string; currentWeek: number; totalWeeks: number } | null;
  programsCompleted: number;
  workoutsCompleted: number;
  workouts30d: number;
};

export type ProgramTemplate = {
  id: string;
  name: string;
  slug: string;
  featured: boolean;
  isPublished: boolean;
  progressionNotes: string | null;
  progressionType: string;
  level: string;
  goal: string;
  durationWeeksMin: number;
  durationWeeksMax: number;
  deloadWeek: number | null;
  deloadNotes: string | null;
  difficultyWarning: string | null;
  splitTemplate?: {
    id: string;
    name: string;
    daysPerWeek: number;
    isSystem: boolean;
    _count?: { days: number };
  };
  _count?: { mesocycles: number };
};

export const adminApi = {
  stats: () => api.get('/api/v1/admin/stats') as Promise<{ data: AdminStats }>,
  activity: () => api.get('/api/v1/admin/activity') as Promise<{ data: AdminActivity[] }>,
  listAudit: (params?: Record<string, string>) => {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    return api.get(`/api/v1/admin/audit${q}`);
  },
  getAnalytics: () => api.get('/api/v1/admin/analytics'),

  listUsers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get(`/api/v1/admin/users${q}`) as Promise<{ data: { items: AdminUser[]; total: number } }>;
  },
  getUser: (id: string) => api.get(`/api/v1/admin/users/${id}`),
  updateUser: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/users/${id}`, body),

  listExercises: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get(`/api/v1/admin/exercises${q}`) as Promise<{ data: AdminExercise[] }>;
  },
  getExercise: (id: string) =>
    api.get(`/api/v1/admin/exercises/${id}`) as Promise<{ data: AdminExercise }>,
  createExercise: (body: Record<string, unknown>) =>
    api.post('/api/v1/admin/exercises', body),
  updateExercise: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/exercises/${id}`, body),
  deleteExercise: (id: string) => api.delete(`/api/v1/admin/exercises/${id}`),
  listEquipmentProfiles: () => api.get('/api/v1/admin/exercises/profiles/equipment'),
  listExecutionProfiles: () => api.get('/api/v1/admin/exercises/profiles/execution'),

  listSubstitutionPools: () => api.get('/api/v1/admin/substitution-pools'),
  createSubstitutionPool: (body: Record<string, unknown>) =>
    api.post('/api/v1/admin/substitution-pools', body),
  updateSubstitutionPool: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/substitution-pools/${id}`, body),
  deleteSubstitutionPool: (id: string) => api.delete(`/api/v1/admin/substitution-pools/${id}`),
  upsertPoolExercise: (poolId: string, body: Record<string, unknown>) =>
    api.put(`/api/v1/admin/substitution-pools/${poolId}/exercises`, body),
  removePoolExercise: (poolId: string, exerciseId: string) =>
    api.delete(`/api/v1/admin/substitution-pools/${poolId}/exercises/${exerciseId}`),

  listPrograms: () =>
    api.get('/api/v1/admin/templates/programs') as Promise<{ data: ProgramTemplate[] }>,
  getProgram: (id: string) => api.get(`/api/v1/admin/templates/programs/${id}`),
  updateProgram: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/templates/programs/${id}`, body),
  duplicateProgram: (id: string) => api.post(`/api/v1/admin/templates/programs/${id}/duplicate`),
  deleteProgram: (id: string) => api.delete(`/api/v1/admin/templates/programs/${id}`),
  listRoutines: () => api.get('/api/v1/admin/templates/routines'),
  getRoutine: (id: string) => api.get(`/api/v1/admin/templates/routines/${id}`),
  updateRoutine: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/templates/routines/${id}`, body),
  replaceRoutineDays: (id: string, body: { days: unknown[] }) =>
    api.put(`/api/v1/admin/templates/routines/${id}/days`, body),

  listKnowledge: () => api.get('/api/v1/admin/knowledge'),
  createKnowledge: (body: Record<string, unknown>) => api.post('/api/v1/admin/knowledge', body),
  updateKnowledge: (id: string, body: Record<string, unknown>) =>
    api.patch(`/api/v1/admin/knowledge/${id}`, body),
  deleteKnowledge: (id: string) => api.delete(`/api/v1/admin/knowledge/${id}`),

  getAnnouncement: () => api.get('/api/v1/admin/announcement'),
  updateAnnouncement: (body: { message: string; enabled?: boolean }) =>
    api.patch('/api/v1/admin/announcement', body),
};
