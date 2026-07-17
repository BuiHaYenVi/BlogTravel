import api from '../../../shared/services/api';

export const searchApi = {
  searchAll: async (query: string, type: string = 'all', limit: number = 20) => {
    const response = await api.get('/search', {
      params: { q: query, type, limit }
    });
    return response.data;
  }
};
