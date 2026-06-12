import api from './client';

export type ClassificationResult = {
  totalScore: number;
  recommendedLevel: string;
  recommendationBand: string;
  selectedLevel: string;
  overrideDirection: 'UP' | 'DOWN' | 'NONE';
  domainScores: Record<string, number>;
  weightedDomainScores: Record<string, number>;
  strongestDomains: string[];
  weakestDomain: string;
};

export const usersApi = {
  me: () => api.get('/api/v1/users/me'),

  submitClassification: (body: {
    answers: number[];
    selectedLevel?: string;
    levelOverrideAcknowledged?: boolean;
  }) =>
    api.patch('/api/v1/users/me/classification', body) as Promise<{
      data: { user: unknown; classification: ClassificationResult };
    }>,

  updateProfile: (body: { displayName: string }) =>
    api.patch('/api/v1/users/me/profile', body),

  completeOnboarding: (body: {
    goalMode?: string;
    gender?: string;
    dateOfBirth?: string;
    bodyweightKg?: number;
    daysPerWeek?: number;
  }) => api.patch('/api/v1/users/me/onboarding', body),
};
