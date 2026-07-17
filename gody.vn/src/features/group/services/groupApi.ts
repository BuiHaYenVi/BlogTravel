import api from '../../../services/api/httpClient';

export interface Group {
  id: number;
  name: string;
  slug: string;
  description: string;
  owner_id: number;
  location?: string;
  max_members?: number;
  is_private: boolean;
  cover_image?: string;
  member_count: number;
  owner_name?: string;
  owner_avatar?: string;
  created_at: string;
}

export const groupApi = {
  getGroups: async (search?: string) => {
    const response = await api.get('/api/groups', {
      params: { search }
    });
    return response.data.data as Group[];
  },

  getGroupDetail: async (id: string | number) => {
    const response = await api.get(`/api/groups/${id}`);
    return response.data.data as Group;
  },

  createGroup: async (data: Partial<Group>) => {
    const response = await api.post('/api/groups', data);
    return response.data.data;
  },

  updateGroup: async (id: string | number, data: Partial<Group>) => {
    const response = await api.put(`/api/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string | number) => {
    const response = await api.delete(`/api/groups/${id}`);
    return response.data;
  },

  joinGroup: async (id: string | number) => {
    const response = await api.post(`/api/groups/${id}/join`);
    return response.data;
  },

  leaveGroup: async (id: string | number) => {
    const response = await api.delete(`/api/groups/${id}/leave`);
    return response.data;
  },

  getMembers: async (id: string | number) => {
    const response = await api.get(`/api/groups/${id}/members`);
    return response.data.data;
  },

  assignModerator: async (groupId: string | number, userId: number) => {
    const response = await api.post(`/api/groups/${groupId}/members/${userId}/moderator`);
    return response.data;
  },

  getPendingPosts: async (groupId: string | number) => {
    const response = await api.get(`/api/groups/${groupId}/posts/pending`);
    return response.data.data;
  },

  processPost: async (groupId: string | number, postId: number, action: 'approved' | 'rejected') => {
    const response = await api.post(`/api/groups/${groupId}/posts/${postId}/process`, { action });
    return response.data;
  }
};
