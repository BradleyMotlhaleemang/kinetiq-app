import api from './client';

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    api.post('/api/v1/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }, { auth: false, credentials: true }),

  logout: () => api.post('/api/v1/auth/logout', undefined, { credentials: true }),

  refresh: () => api.post('/api/v1/auth/refresh', undefined, { auth: false, credentials: true }),

  verifyEmail: (token: string) =>
    api.get(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, { auth: false }),

  resendVerification: (email: string) =>
    api.post('/api/v1/auth/resend-verification', { email }, { auth: false }),

  forgotPassword: (email: string) =>
    api.post('/api/v1/auth/forgot-password', { email }, { auth: false }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/v1/auth/reset-password', { token, newPassword }, { auth: false }),

  me: () => api.get('/api/v1/auth/me'),
};
