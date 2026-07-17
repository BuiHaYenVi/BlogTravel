import httpClient from './api/httpClient';

export const dashboardService = {
  getStats: () => httpClient.get('/admin/stats'),
};
