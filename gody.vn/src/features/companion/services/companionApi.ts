import api from '../../../services/api/httpClient';

export interface CompanionSuggestion {
  id: string;
  username: string;
  full_name: string;
  avatar: string;
  interests: string[];
  mutual_friends_count: number;
  mutual_friends_avatars: string[];
  common_tags_count: number;
  common_tags: string[];
  matching_score: number;
}

export const companionApi = {
  getSuggestions: async (filter?: string, search?: string, limit: number = 10): Promise<any> => {
    const params: any = { limit };
    if (filter && filter !== 'Tất cả') {
      params.filter = filter;
    }
    if (search) {
      params.search = search;
    }
    
    const response = await api.get('/companions/suggestions', { params });
    return response;
  },

  followUser: async (userId: string): Promise<any> => {
    const response = await api.post(`/follow/${userId}`);
    return response;
  },

  getMutualFriends: async (): Promise<any> => {
    const response = await api.get('/follow/mutual');
    return response;
  }
};
