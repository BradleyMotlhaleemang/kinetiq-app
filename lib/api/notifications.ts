import api from './client';

export const notificationsApi = {
  getFeed: () => api.get('/api/v1/notifications'),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/v1/notifications/read-all'),
};
