import { create } from 'zustand';
import { User } from '../../../shared/types';
import { userApi } from '../services/userApi';

interface UserProfile extends User {
  isFollowing?: boolean;
  followers?: number;
  stats?: {
    posts_count: number;
    followers_count: number;
    following_count: number;
  };
}

interface UserState {
  profile: UserProfile | null;
  posts: any[];
  photos: any[];
  locations: any[];
  groups: any[];
  userStories: any[];
  reviews: any[];
  suggestions: User[];
  followers: User[];
  following: User[];
  friends: User[];
  visitedCount: number;
  loading: boolean;
  setVisitedCount: (count: number) => void;
  clearProfile: () => void;
  loadProfile: (id: string, silent?: boolean) => Promise<void>;
  loadUserContent: (id: string) => Promise<void>;
  loadUserStories: (id: string) => Promise<void>;
  loadFollowers: (id: string) => Promise<void>;
  loadFollowing: (id: string) => Promise<void>;
  loadFriends: (id: string) => Promise<void>;
  loadSuggestions: () => Promise<void>;
  toggleFollow: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  posts: [],
  photos: [],
  groups: [],
  locations: [],
  userStories: [],
  reviews: [],
  suggestions: [],
  followers: [],
  following: [],
  friends: [],
  visitedCount: 0,
  loading: false,

  setVisitedCount: (count: number) => set({ visitedCount: count }),

  clearProfile: () => set({ 
    profile: null, 
    posts: [], 
    photos: [], 
    groups: [], 
    locations: [],
    userStories: [],
    reviews: [],
    followers: [],
    following: [],
    friends: []
  }),

  loadProfile: async (id) => {
    set({ loading: true, profile: null }); // Clear previous profile immediately
    try {
      const response = await userApi.getProfile(id);
      set({ profile: response.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  loadUserContent: async (id) => {
    set({ posts: [], photos: [], groups: [], locations: [], userStories: [], reviews: [] }); // Clear previous content
    
    // Hàm phụ trợ giúp tải dữ liệu an toàn, nếu một module bị lỗi thì các module khác vẫn hiển thị bình thường
    const fetchSafe = async (promise: Promise<any>) => {
      try {
        const response = await promise;
        return response?.data || [];
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu module:', err);
        return [];
      }
    };

    try {
      const [posts, photos, groups, locations, userStories, reviews] = await Promise.all([
        fetchSafe(userApi.getPosts(id)),
        fetchSafe(userApi.getPhotos(id)),
        fetchSafe(userApi.getGroups(id)),
        fetchSafe(userApi.getLocations(id)),
        fetchSafe(userApi.getUserStories(id)),
        fetchSafe(userApi.getReviews(id))
      ]);
      set({ posts, photos, groups, locations, userStories, reviews });
    } catch (err) {
      console.error('Load user content promise group failed:', err);
    }
  },

  loadUserStories: async (id) => {
    try {
      const response = await userApi.getUserStories(id);
      set({ userStories: response.data || [] });
    } catch (err) {
      console.error('Load user stories failed:', err);
      set({ userStories: [] });
    }
  },

  loadFollowers: async (id) => {
    try {
      const response = await userApi.getFollowers(id);
      set({ followers: response.data?.followers || (Array.isArray(response.data) ? response.data : []) });
    } catch (err) {
      console.error('Load followers failed:', err);
    }
  },

  loadFollowing: async (id) => {
    try {
      const response = await userApi.getFollowing(id);
      set({ following: response.data?.following || (Array.isArray(response.data) ? response.data : []) });
    } catch (err) {
      console.error('Load following failed:', err);
    }
  },

  loadFriends: async (id) => {
    try {
      const response = await userApi.getFriends(id);
      set({ friends: response.data?.friends || (Array.isArray(response.data) ? response.data : []) });
    } catch (err) {
      console.error('Load friends failed:', err);
    }
  },

  loadSuggestions: async () => {
    try {
      const response = await userApi.getSuggestions() as any;
      // Nếu API trả về trực tiếp mảng (mock) hoặc object {data: []}
      const suggestions = Array.isArray(response) ? response : (response.data || []);
      set({ suggestions });
    } catch (err) {
      console.error('Load suggestions failed:', err);
    }
  },

  toggleFollow: (id) => set((state) => {
    if (state.profile && state.profile.id === id) {
      const isNowFollowing = !state.profile.isFollowing;
      return {
        profile: {
          ...state.profile,
          isFollowing: isNowFollowing,
          followers: isNowFollowing ? (state.profile.followers || 0) + 1 : (state.profile.followers || 0) - 1
        }
      };
    }
    return state;
  })
}));

