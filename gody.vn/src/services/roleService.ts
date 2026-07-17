import httpClient from './api/httpClient';

export const roleService = {
  getRoles: () => 
    httpClient.get('/admin/roles'),
  
  getRoleById: (id: string | number) =>
    httpClient.get(`/admin/roles/${id}`),

  getPermissions: () =>
    httpClient.get('/admin/permissions'),

  updateRolePermissions: (roleId: string | number, permissions: string[]) =>
    httpClient.put(`/admin/roles/${roleId}/permissions`, { permissions }),

  createRole: (data: any) =>
    httpClient.post('/admin/roles', data),

  updateRole: (id: string | number, data: any) =>
    httpClient.put(`/admin/roles/${id}`, data),

  deleteRole: (id: string | number) =>
    httpClient.delete(`/admin/roles/${id}`),
};
