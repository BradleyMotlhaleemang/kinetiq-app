import api from './client';

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    api.post('/api/v1/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),

  me: () => api.get('/api/v1/auth/me'),
};