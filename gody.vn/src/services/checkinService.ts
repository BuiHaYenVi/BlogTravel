import api from '../shared/services/api';

export type CheckinStatus = 'visited' | 'planning' | null;

export const checkinService = {
  toggleCheckin: async (destinationId: number, status: 'visited' | 'planning') => {
    const response = await api.post(`/checkins/toggle`, {
      destination_id: destinationId,
      status: status
    });
    return response.data;
  },

  getStatus: async (destinationId: number) => {
    const response = await api.get(`/checkins/status/${destinationId}`);
    return response.data;
  },

  getCount: async () => {
    const response = await api.get(`/checkins/count`);
    return response.data;
  }
};
