import httpClient from '../../../services/api/httpClient';

export const adminTripService = {
  getTrips: (page = 1, limit = 20, search = '', status = 'All') =>
    httpClient.get('/admin/trips', { params: { page, limit, search, status } }),
  
  updateStatus: (id: string | number, status: string) =>
    httpClient.put(`/admin/trips/${id}/status`, { status }),

  deleteTrip: (id: string | number) =>
    httpClient.delete(`/admin/trips/${id}`),
};