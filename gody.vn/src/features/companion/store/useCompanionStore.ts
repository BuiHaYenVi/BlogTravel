import { create } from 'zustand';
import { companionApi, CompanionSuggestion } from '../services/companionApi';
import { tripApi, TripResponse } from '../services/tripApi';
import { locationService } from '../../../services/locationService';

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  activities: Activity[];
  completed?: boolean;
}

export interface Trip {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  participants: number;
  currentParticipants: number;
  status: 'preparing' | 'ongoing' | 'completed' | 'open' | 'closed';
  tags: string[];
  itinerary: DayPlan[];
  bannerImage: string;
  creator?: {
    id?: string | number;
    name: string;
    avatar: string;
  };
  description?: string;
  userStatus?: 'pending' | 'accepted' | 'rejected' | 'invited' | null;
  user_id?: string | number;
  participantList?: any[];
  matching_score?: number;
  budget?: number;
}

interface CompanionState {
  // Suggestion State (BE Integrated)
  suggestions: CompanionSuggestion[];
  loading: boolean;
  tripsLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Trip State
  trips: Trip[];
  myTrips: Trip[];
  availableTags: string[];
  availableInterests: string[];
  
  // Suggestion Actions
  setSearchQuery: (query: string) => void;
  fetchSuggestions: (filter?: string) => Promise<void>;
  followCompanion: (userId: string) => Promise<void>;
  fetchInterests: () => Promise<void>;
  
  // Trip Actions
  fetchTrips: (status?: string) => Promise<void>;
  fetchMyTrips: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchTripDetail: (id: string) => Promise<Trip | null>;
  createTrip: (tripData: any) => Promise<string | number | boolean>;
  updateTripAction: (tripId: string | number, tripData: any) => Promise<boolean>;
  addTrip: (trip: Trip) => void;
  joinTrip: (tripId: string, note?: string) => Promise<boolean>;
  
  // Participant Actions
  fetchJoinRequests: (tripId: string) => Promise<any[]>;
  handleRequest: (tripId: string, userId: string, action: 'accept' | 'reject') => Promise<boolean>;
  leaveTripAction: (tripId: string) => Promise<boolean>;
  removeMemberAction: (tripId: string, userId: string) => Promise<boolean>;
  deleteTripAction: (tripId: string) => Promise<boolean>;
  toggleActivityAction: (tripId: string, activityId: string, completed: boolean) => Promise<boolean>;
  inviteFriendAction: (tripId: string | number, friendId: string | number) => Promise<boolean>;
  acceptInvitationAction: (tripId: string | number) => Promise<boolean>;
  rejectInvitationAction: (tripId: string | number) => Promise<boolean>;
  fetchMutualFriends: () => Promise<any[]>;
}

export const useCompanionStore = create<CompanionState>((set, get) => ({
  // Suggestion State
  suggestions: [],
  loading: false,
  tripsLoading: false,
  error: null,
  searchQuery: '',
  
  // Trip State
  trips: [],
  myTrips: [],
  availableTags: ['Phượt', 'Nghỉ dưỡng', 'Biển', 'Leo núi', 'Camping', 'Ẩm thực', 'Nhiếp ảnh', 'Thiên nhiên'],
  availableInterests: ['Leo núi', 'Camping (Cắm trại)', 'Nhiếp ảnh', 'Phượt bụi', 'Nghỉ dưỡng', 'Du lịch biển', 'Café lê la', 'Street Food'],
  
  // Suggestion Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  fetchSuggestions: async (filter) => {
    set({ loading: true, error: null });
    try {
      const response = await companionApi.getSuggestions(filter, get().searchQuery);
      const data = response.data || [];
      set({ suggestions: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải gợi ý bạn đồng hành', loading: false });
    }
  },
  
  followCompanion: async (userId) => {
    try {
      await companionApi.followUser(userId);
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi khi follow');
    }
  },
  
  // Trip Actions
  fetchTrips: async (status?: string) => {
    set({ tripsLoading: true, error: null });
    try {
      const response = await tripApi.getTrips(status, get().searchQuery);
      const tripsData = response.data || [];
      
      const mappedTrips: Trip[] = tripsData.map((t: TripResponse) => {
        let itinerary: any[] = [];
        if (t.itinerary) {
          try {
            itinerary = typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : t.itinerary;
          } catch (e) {
            console.error('Error parsing itinerary', e);
          }
        }

        return {
          id: String(t.id),
          title: t.title,
          location: t.destination_name,
          startDate: t.start_date,
          endDate: t.end_date,
          participants: t.max_participants,
          currentParticipants: t.current_participants,
          status: t.status as any,
          tags: t.category_tag ? t.category_tag.split(',') : [], 
          description: t.description,
          bannerImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
          creator: {
            id: t.user_id,
            name: t.creator_name,
            avatar: t.creator_avatar || `https://i.pravatar.cc/150?u=${t.user_id}`
          },
          user_id: t.user_id,
          itinerary: itinerary,
          matching_score: t.matching_score,
          budget: t.budget ? Number(t.budget) : 0
        };
      });
      
      set({ trips: mappedTrips, tripsLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải danh sách chuyến đi', tripsLoading: false });
    }
  },

  fetchMyTrips: async () => {
    set({ tripsLoading: true, error: null });
    try {
      const response = await tripApi.getMyTrips();
      const tripsData = response.data || [];
      
      const mappedTrips: Trip[] = tripsData.map((t: TripResponse) => {
        let itinerary: any[] = [];
        if (t.itinerary) {
          try {
            itinerary = typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : t.itinerary;
          } catch (e) {
            console.error('Error parsing itinerary', e);
          }
        }

        return {
          id: String(t.id),
          title: t.title,
          location: t.destination_name,
          startDate: t.start_date,
          endDate: t.end_date,
          participants: t.max_participants,
          currentParticipants: t.current_participants,
          status: t.status as any,
          tags: t.category_tag ? t.category_tag.split(',') : [], 
          description: t.description,
          bannerImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
          creator: {
            id: t.user_id,
            name: t.creator_name,
            avatar: t.creator_avatar || `https://i.pravatar.cc/150?u=${t.user_id}`
          },
          user_id: t.user_id,
          itinerary: itinerary,
          matching_score: t.matching_score,
          budget: t.budget ? Number(t.budget) : 0
        };
      });
      
      set({ myTrips: mappedTrips, tripsLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi tải chuyến đi của tôi', tripsLoading: false });
    }
  },

  fetchTags: async () => {
    try {
      const response = await tripApi.getTags();
      if (response.success && Array.isArray(response.data)) {
        // Merge with existing default tags and remove duplicates
        const defaultTags = ['Phượt', 'Nghỉ dưỡng', 'Biển', 'Leo núi', 'Camping', 'Ẩm thực', 'Nhiếp ảnh', 'Thiên nhiên'];
        const apiTags = response.data.map((t: string) => t.replace(/^#/, ''));
        const uniqueTags = Array.from(new Set([...defaultTags, ...apiTags]));
        set({ availableTags: uniqueTags });
      }
    } catch (err) {
      console.error('Fetch tags failed:', err);
    }
  },

  fetchInterests: async () => {
    try {
      const response: any = await locationService.getOnboardingTags();
      if (response.success && Array.isArray(response.data)) {
        const interests: string[] = [];
        response.data.forEach((cat: any) => {
          if (Array.isArray(cat.tags)) {
            cat.tags.forEach((tag: any) => {
              const name = typeof tag === 'string' ? tag : tag.name;
              if (name && !interests.includes(name)) {
                interests.push(name);
              }
            });
          }
        });
        if (interests.length > 0) {
          set({ availableInterests: interests });
        }
      }
    } catch (err) {
      console.error('Fetch interests failed:', err);
    }
  },

  fetchTripDetail: async (id: string) => {
    try {
      const response = await tripApi.getTripDetail(id);
      if (response.success && response.data) {
        const t = response.data;
        let itinerary: any[] = [];
        if (t.itinerary) {
          try {
            itinerary = typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : t.itinerary;
          } catch (e) {
            console.error('Error parsing itinerary', e);
          }
        }

        const mappedTrip: Trip = {
          id: String(t.id),
          title: t.title,
          location: t.destination_name || 'Địa điểm',
          startDate: t.start_date,
          endDate: t.end_date,
          participants: t.max_participants,
          currentParticipants: t.current_participants || 1,
          status: t.status as any,
          tags: t.category_tag ? t.category_tag.split(',') : [], 
          description: t.description,
          bannerImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
          creator: {
            id: t.user_id,
            name: t.creator_name || 'Người dùng',
            avatar: t.creator_avatar || `https://i.pravatar.cc/150?u=${t.user_id}`
          },
          itinerary: itinerary,
          userStatus: t.user_status,
          user_id: t.user_id,
          participantList: t.participants || [],
          matching_score: t.matching_score,
          budget: t.budget ? Number(t.budget) : 0
        };

        set((state) => ({
          trips: state.trips.some(trip => trip.id === mappedTrip.id)
            ? state.trips.map(trip => trip.id === mappedTrip.id ? mappedTrip : trip)
            : [...state.trips, mappedTrip]
        }));
        return mappedTrip;
      }
    } catch (err) {
      console.error('Fetch trip detail failed:', err);
    }
    return null;
  },

  createTrip: async (tripData: any) => {
    try {
      set({ tripsLoading: true });
      const response = await tripApi.createTrip(tripData);
      
      // Bóc tách an toàn để tránh crash nếu interceptor thay đổi cấu trúc
      const responseData = response.data || response;
      const success = responseData?.success || response?.success;
      
      if (success) {
        await get().fetchTrips();
        // Lấy trip_id linh hoạt từ nhiều cấp độ
        const tripId = responseData?.data?.trip_id || responseData?.trip_id;
        return tripId;
      }
      
      // Ném lỗi nếu success === false
      throw new Error(responseData?.message || 'Có lỗi xảy ra khi tạo chuyến đi');
    } catch (err: any) {
      console.error('Create trip failed:', err);
      throw err;
    } finally {
      set({ tripsLoading: false });
    }
  },

  updateTripAction: async (tripId: string | number, tripData: any) => {
    try {
      set({ tripsLoading: true });
      const response = await tripApi.updateTrip(tripId, tripData);
      const responseData = response.data || response;
      const success = responseData?.success || response?.success;
      
      if (success) {
        await get().fetchTripDetail(String(tripId));
        return true;
      }
      throw new Error(responseData?.message || 'Có lỗi xảy ra khi cập nhật chuyến đi');
    } catch (err: any) {
      console.error('Update trip failed:', err);
      throw err;
    } finally {
      set({ tripsLoading: false });
    }
  },

  joinTrip: async (tripId, note) => {
    try {
      const response = await tripApi.joinTrip(tripId, note);
      return response.success;
    } catch (err) {
      console.error('Join trip failed:', err);
      return false;
    }
  },

  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),

  fetchJoinRequests: async (tripId: string) => {
    try {
      const response = await tripApi.getJoinRequests(tripId);
      return response.data || [];
    } catch (err) {
      console.error('Fetch join requests failed:', err);
      return [];
    }
  },

  handleRequest: async (tripId: string, userId: string, action: 'accept' | 'reject') => {
    try {
      const response = await tripApi.handleJoinRequest(tripId, userId, action);
      if (response.success) {
        await get().fetchTripDetail(tripId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Handle join request failed:', err);
      return false;
    }
  },

  leaveTripAction: async (tripId: string) => {
    try {
      const response = await tripApi.leaveTrip(tripId);
      if (response.success) {
        await get().fetchTripDetail(tripId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Leave trip failed:', err);
      return false;
    }
  },

  removeMemberAction: async (tripId: string, userId: string) => {
    try {
      const response = await tripApi.removeParticipant(tripId, userId);
      if (response.success) {
        await get().fetchTripDetail(tripId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Remove member failed:', err);
      return false;
    }
  },

  deleteTripAction: async (tripId: string) => {
    try {
      const response = await tripApi.deleteTrip(tripId);
      if (response.success) {
        set((state) => ({ trips: state.trips.filter(t => t.id !== tripId) }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete trip failed:', err);
      return false;
    }
  },

  toggleActivityAction: async (tripId: string, activityId: string, completed: boolean) => {
    try {
      const response = await tripApi.toggleActivity(tripId, activityId, completed);
      if (response.success) {
        await get().fetchTripDetail(tripId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Toggle activity failed:', err);
      return false;
    }
  },

  inviteFriendAction: async (tripId, friendId) => {
    try {
      const response = await tripApi.inviteFriend(tripId, friendId);
      if (response.success) {
        await get().fetchTripDetail(String(tripId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Invite friend failed:', err);
      return false;
    }
  },

  acceptInvitationAction: async (tripId) => {
    try {
      const response = await tripApi.acceptInvitation(tripId);
      if (response.success) {
        await get().fetchTripDetail(String(tripId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Accept invitation failed:', err);
      return false;
    }
  },

  rejectInvitationAction: async (tripId) => {
    try {
      const response = await tripApi.rejectInvitation(tripId);
      if (response.success) {
        await get().fetchTripDetail(String(tripId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Reject invitation failed:', err);
      return false;
    }
  },

  fetchMutualFriends: async () => {
    try {
      const response = await companionApi.getMutualFriends();
      if (response.success && response.data) {
        return response.data.friends || [];
      }
      return [];
    } catch (err) {
      console.error('Fetch mutual friends failed:', err);
      return [];
    }
  },
}));
