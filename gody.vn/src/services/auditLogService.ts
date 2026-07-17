import httpClient from './api/httpClient';

export const auditLogService = {
  getLogs: (page = 1, limit = 20, search = '', type = 'All') => 
    httpClient.get('/admin/audit-logs', { params: { page, limit, search, type } }),
    
  getLogStats: () =>
    httpClient.get('/admin/audit-logs/stats'),

  exportLogs: (params: any) =>
    httpClient.get('/admin/audit-logs/export', { params, responseType: 'blob' }),
};
