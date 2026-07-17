import httpClient from './api/httpClient';

export const adminStoryService = {
  /**
   * Get paginated list of stories with filter and search
   */
  getStories: (page = 1, limit = 20, search = '', status = 'All') =>
    httpClient.get('/admin/stories', { params: { page, limit, search, status } }),

  /**
   * Hide a story by ID (set is_active = false)
   */
  hideStory: (id: number | string) =>
    httpClient.put(`/admin/stories/${id}/hide`),

  /**
   * Delete a story by ID (set is_deleted = true)
   */
  deleteStory: (id: number | string) =>
    httpClient.delete(`/admin/stories/${id}`),

  /**
   * Grant or revoke VIP blue tick for a user
   */
  verifyUser: (userId: number | string, isVerified: boolean) =>
    httpClient.put(`/admin/users/${userId}/verify`, { is_verified: isVerified }),
};
