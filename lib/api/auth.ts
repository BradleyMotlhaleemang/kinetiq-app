import api from './client';

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    api.post('/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
};