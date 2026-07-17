import api from '../../../shared/services/api';

export const notificationApi = {
  getNotifications: () => api.get('notifications'),
  getAllNotifications: (page = 1, limit = 20) => api.get(`notifications/all?page=${page}&limit=${limit}`),
  markAsRead: (id: number) => api.put(`notifications/${id}/read`),
  markAllRead: () => api.put('notifications/read-all'),
  deleteNotification: (id: number) => api.delete(`notifications/${id}`),
};
