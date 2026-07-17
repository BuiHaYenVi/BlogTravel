import { create } from 'zustand';
import { Trip, tripService } from '../../services/api/tripService';

interface TripState {
  trips: Trip[];
  isLoading: boolean;
  filters: {
    tag: string | null;
    location: string | null;
  };
  setFilter: (key: 'tag' | 'location', value: string | null) => void;
  fetchTrips: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  isLoading: false,
  filters: {
    tag: null,
    location: null,
  },
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value }
    }));
    get().fetchTrips();
  },
  fetchTrips: async () => {
    set({ isLoading: true });
    try {
      const { tag, location } = get().filters;
      const response = await tripService.getAvailableTrips({ 
        tag: tag || undefined, 
        location: location || undefined 
      });
      if (response.success) {
        set({ trips: response.data });
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
