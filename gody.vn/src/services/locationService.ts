import httpClient from './api/httpClient';

export const locationService = {
  getLocations: (page = 1, limit = 10, search = '', status = 'active', type = '') => 
    httpClient.get(`/admin/locations`, { params: { page, limit, search, status, type } }),

  getLocationById: (id: string | number) => 
    httpClient.get(`/locations/${id}`),

  createLocation: (data: any) =>
    httpClient.post(`/admin/locations`, data),

  updateLocation: (id: string | number, data: any) => {
    const cleanId = String(id).split(':')[0]; // Loại bỏ các ký tự lạ sau dấu hai chấm nếu có
    return httpClient.put(`/admin/locations/${cleanId}`, data);
  },

  deleteLocation: (id: string | number) => {
    const cleanId = String(id).split(':')[0];
    return httpClient.delete(`/admin/locations/${cleanId}`);
  },

  // Hashtag services
  getHashtags: (page = 1, limit = 20, type = '', categoryId = '') =>
    httpClient.get(`/admin/hashtags`, { params: { page, limit, type, categoryId } }),

  createHashtag: (data: any) =>
    httpClient.post(`/admin/hashtags`, data),

  searchHashtags: (q: string) =>
    httpClient.get(`/tags/search`, { params: { q } }),

  updateHashtag: (id: string | number, data: any) =>
    httpClient.put(`/admin/hashtags/${id}`, data),

  deleteHashtag: (id: string | number) =>
    httpClient.delete(`/admin/hashtags/${id}`),

  getOnboardingTags: () =>
    httpClient.get(`/tags/onboarding`),

  // Tag Category management
  getTagCategories: () =>
    httpClient.get(`/admin/tag-categories`),

  createTagCategory: (data: any) =>
    httpClient.post(`/admin/tag-categories`, data),

  updateTagCategory: (id: string | number, data: any) =>
    httpClient.put(`/admin/tag-categories/${id}`, data),

  deleteTagCategory: (id: string | number) =>
    httpClient.delete(`/admin/tag-categories/${id}`),
};
