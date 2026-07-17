import httpClient from './api/httpClient';

export const systemService = {
  getStats: () => httpClient.get('/admin/stats'),
  
  getLocations: (page = 1, limit = 10) => 
    httpClient.get('/admin/locations', { params: { page, limit } }),
    
  getReports: (page = 1, limit = 10, status = 'pending') => 
    httpClient.get('/admin/reports', { params: { page, limit, status } }),
    
  processReport: (id: string | number, action: string, note: string) => 
    httpClient.post(`/admin/reports/${id}/process`, { action, note }),
    
  broadcast: (title: string, content: string) => 
    httpClient.post('/admin/broadcast', { title, content }),

  // Settings management
  getSettings: () =>
    httpClient.get('/admin/settings'),

  updateSettings: (category: string, data: any) =>
    httpClient.put(`/admin/settings/${category}`, data),

  // System maintenance
  clearCache: () =>
    httpClient.post('/admin/system/clear-cache'),

  backupDatabase: () =>
    httpClient.post('/admin/system/backup', {}, { responseType: 'blob' }),

  getServerInfo: () =>
    httpClient.get('/admin/system/info'),
};
