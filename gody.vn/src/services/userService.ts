import httpClient from './api/httpClient';

export const userService = {
  getUsers: (page = 1, limit = 20, search = '', status = 'All', role = 'All') => 
    httpClient.get(`/admin/users`, { params: { page, limit, search, status, role } }),

  
  getUserById: (id: string | number) => 
    httpClient.get(`/admin/users/${id}`),

  createUser: (data: any) => 
    httpClient.post(`/admin/users`, data),

  updateUser: (id: string | number, data: any) => 
    httpClient.put(`/admin/users/${id}`, data),

  banUser: (id: string | number) => 
    httpClient.put(`/admin/users/${id}/ban`),

  unbanUser: (id: string | number) => 
    httpClient.put(`/admin/users/${id}/unban`),

  deleteUser: (id: string | number) => 
    httpClient.delete(`/admin/users/${id}`),

  getRoles: () => 
    httpClient.get(`/admin/all-roles`),

  getUserContent: (id: string | number, limit = 10) =>
    httpClient.get(`/admin/users/${id}/content`, { params: { limit } }),

  getUserReports: (id: string | number) =>
    httpClient.get(`/admin/users/${id}/reports`),

  verifyUser: (id: string | number, isVerified: boolean) =>
    httpClient.put(`/admin/users/${id}/verify`, { is_verified: isVerified }),
};

