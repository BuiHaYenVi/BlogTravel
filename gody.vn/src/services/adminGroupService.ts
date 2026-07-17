import httpClient from './api/httpClient';

export const adminGroupService = {
  // ── Danh sách & tổng quan ──────────────────────────────────────────
  getGroups: (page = 1, limit = 20, search = '') =>
    httpClient.get(`/admin/groups`, { params: { page, limit, search } }),

  getGroupById: (id: string | number) =>
    httpClient.get(`/admin/groups/${id}`),

  getGroupStats: () =>
    httpClient.get('/admin/groups/stats'),

  // ── Trạng thái nhóm ───────────────────────────────────────────────
  updateGroupStatus: (id: string | number, status: string) =>
    httpClient.put(`/admin/groups/${id}/status`, { status }),

  approveGroup: (id: string | number) =>
    httpClient.put(`/admin/groups/${id}/approve`),

  deleteGroup: (id: string | number) =>
    httpClient.delete(`/admin/groups/${id}`),

  // ── Bài viết trong nhóm ───────────────────────────────────────────
  getGroupPosts: (id: string | number, page = 1, limit = 10) =>
    httpClient.get(`/admin/groups/${id}/posts`, { params: { page, limit } }),

  // ── Thành viên ────────────────────────────────────────────────────
  getGroupMembers: (id: string | number, page = 1, limit = 20, search = '') =>
    httpClient.get(`/admin/groups/${id}/members`, { params: { page, limit, search } }),

  removeMember: (groupId: string | number, userId: string | number) =>
    httpClient.delete(`/admin/groups/${groupId}/members/${userId}`),

  updateMemberRole: (groupId: string | number, userId: string | number, role: string) =>
    httpClient.put(`/admin/groups/${groupId}/members/${userId}/role`, { role }),

  // ── Báo cáo vi phạm ───────────────────────────────────────────────
  getGroupReports: (id: string | number, page = 1, limit = 20) =>
    httpClient.get(`/admin/groups/${id}/reports`, { params: { page, limit } }),

  processGroupReport: (groupId: string | number, reportId: string | number, action: string, note = '') =>
    httpClient.put(`/admin/groups/${groupId}/reports/${reportId}`, { action, note }),

  // ── Thống kê ──────────────────────────────────────────────────────
  getGroupAnalytics: (id: string | number) =>
    httpClient.get(`/admin/groups/${id}/analytics`),
};
