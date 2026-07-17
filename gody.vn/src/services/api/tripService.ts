import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  departure_date: string;
  category_tag: string;
  max_members: number;
  current_members: number;
  status: string;
  full_name: string;
  avatar: string;
  username: string;
}

export const tripService = {
  getAvailableTrips: async (params?: { tag?: string; location?: string; limit?: number }) => {
    const response = await axios.get(`${API_URL}/trips`, { params });
    return response.data;
  }
};
