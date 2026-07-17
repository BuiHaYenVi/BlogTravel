import api from '../../../services/api/httpClient';

export interface TripResponse {
  id: string | number;
  user_id: string | number;
  title: string;
  destination_id: string | number;
  destination_name: string;
  start_date: string;
  end_date: string;
  budget: string | number;
  description: string;
  status: string;
  max_participants: number;
  current_participants: number;
  creator_name: string;
  creator_avatar?: string;
  category_tag?: string;
  itinerary?: string | any[];
  participants?: any[];
  created_at: string;
  matching_score?: number;
}

export const tripApi = {
  getTrips: async (status?: string, location?: string, limit: number = 20): Promise<any> => {
    const params: any = { location, limit };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/trips', { params });
    return response;
  },

  getMyTrips: async (): Promise<any> => {
    const response = await api.get('/trips/me');
    return response;
  },

  getTags: async (): Promise<any> => {
    const response = await api.get('/trips/tags');
    return response;
  },

  getTripDetail: async (id: string | number): Promise<any> => {
    const response = await api.get(`/trips/${id}`);
    return response;
  },

  joinTrip: async (tripId: string | number, note?: string): Promise<any> => {
    const response = await api.post(`/trips/${tripId}/join`, { note });
    return response;
  },

  createTrip: async (tripData: any): Promise<any> => {
    const response = await api.post('/trips', tripData);
    return response;
  },

  updateTrip: async (tripId: string | number, tripData: any): Promise<any> => {
    const response = await api.put(`/trips/${tripId}`, tripData);
    return response;
  },

  getJoinRequests: async (tripId: string | number): Promise<any> => {
    const response = await api.get(`/trips/${tripId}/requests`);
    return response;
  },

  handleJoinRequest: async (tripId: string | number, participantUserId: string | number, action: 'accept' | 'reject'): Promise<any> => {
    const response = await api.put(`/trips/${tripId}/participants/${participantUserId}/${action}`);
    return response;
  },

  leaveTrip: async (tripId: string | number): Promise<any> => {
    const response = await api.delete(`/trips/${tripId}/leave`);
    return response;
  },

  removeParticipant: async (tripId: string | number, userId: string | number): Promise<any> => {
    const response = await api.delete(`/trips/${tripId}/participants/${userId}`);
    return response;
  },

  deleteTrip: async (tripId: string | number): Promise<any> => {
    const response = await api.delete(`/trips/${tripId}`);
    return response;
  },

  toggleActivity: async (tripId: string | number, activityId: string | number, completed: boolean): Promise<any> => {
    const response = await api.put(`/trips/${tripId}/itinerary/activities/${activityId}/toggle`, { completed });
    return response;
  },

  inviteFriend: async (tripId: string | number, friendId: string | number): Promise<any> => {
    const response = await api.post(`/trips/${tripId}/invite/${friendId}`);
    return response;
  },

  acceptInvitation: async (tripId: string | number): Promise<any> => {
    const response = await api.post(`/trips/${tripId}/invitations/accept`);
    return response;
  },

  rejectInvitation: async (tripId: string | number): Promise<any> => {
    const response = await api.post(`/trips/${tripId}/invitations/reject`);
    return response;
  }
};
