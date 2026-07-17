import api from '../../../shared/services/api';
import { User } from '../../../shared/types';

export const userApi = {
  getProfile: async (id: string) => {
    const response = await api.get(`users/${id}`);
    return response.data;
  },

  updateProfile: async (id: string, data: any) => {
    const response = await api.put(`users/${id}`, data);
    return response.data;
  },

  updateAvatar: async (id: string, avatarUrl: string) => {
    const response = await api.put(`users/${id}/avatar`, { avatar: avatarUrl });
    return response.data;
  },

  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`users/${id}/avatar/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSuggestions: async () => {
    // Tạm thời trả về mock data vì backend chưa có endpoint /api/recommendation/friends
    return [
      { id: 'u1', name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=a', mutuals: 5 },
      { id: 'u2', name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?u=b', mutuals: 3 },
      { id: 'u3', name: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?u=c', mutuals: 8 },
    ];
  },

  getPosts: async (id: string) => {
    const response = await api.get(`users/${id}/posts`);
    return response.data;
  },

  getPhotos: async (id: string) => {
    const response = await api.get(`users/${id}/photos`);
    return response.data;
  },

  getGroups: async (id: string) => {
    const response = await api.get(`users/${id}/groups`);
    return response.data;
  },

  getUserStories: async (id: string) => {
    const response = await api.get(`users/${id}/stories`);
    return response.data;
  },

  getLocations: async (id: string) => {
    const response = await api.get(`users/${id}/locations`);
    return response.data;
  },

  getReviews: async (id: string) => {
    const response = await api.get(`users/${id}/reviews`);
    return response.data;
  },

  follow: async (id: string) => {
    const response = await api.post(`follow/${id}`);
    return response.data;
  },

  unfollow: async (id: string) => {
    const response = await api.delete(`follow/${id}`);
    return response.data;
  },

  getFollowers: async (id: string) => {
    const response = await api.get(`users/${id}/followers`);
    return response.data;
  },

  getFollowing: async (id: string) => {
    const response = await api.get(`users/${id}/following`);
    return response.data;
  },

  getFriends: async (id: string) => {
    const response = await api.get(`follow/mutual?user_id=${id}`);
    return response.data;
  }
};

