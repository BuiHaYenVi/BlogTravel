import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../../../shared/types';
import api from '../../../shared/services/api';
import { userApi } from '../../user/services/userApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginAPI: (email: string, pass: string) => Promise<any>;
  registerAPI: (data: any) => Promise<any>;
  sendRegisterOTPAPI: (email: string) => Promise<any>;
  verifyOTPAPI: (email: string, otp: string) => Promise<any>;
  googleLoginAPI: (data: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  saveDestination: (id: string) => void;
  unsaveDestination: (id: string) => void;
  toggleFollow: (userId: string, currentStatus?: boolean) => Promise<void>;
  isFriend: (userId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      loginAPI: async (email, password) => {
        try {
          const response = await api.post('auth/login', { email, password });
          const { token, user } = response.data.data;
          
          localStorage.setItem('token', token);
          
          const normalizedUser: User = {
            id: String(user.id),
            name: user.name || user.full_name || user.username || '',
            email: user.email || '',
            avatar: user.avatar || '',
            role: user.role || 'user',
            role_id: parseInt(user.role_id) || 3,
            role_level: parseInt(user.role_level) || 1,
            permissions: user.permissions || [],
            bio: user.bio || '',
            location: user.location || user.hometown || '',
            interests: Array.isArray(user.interests) 
              ? user.interests 
              : (typeof user.interests === 'string' ? user.interests.split(', ') : []),
            savedDestinations: [],
            following: user.following || [],
          };

          set({ user: normalizedUser, token: token, isAuthenticated: true });
          return response.data;
        } catch (error: any) {
          const errorData = error.response?.data;
          if (errorData && typeof errorData === 'object' && errorData.message) {
            throw errorData;
          }
          throw new Error(error.message || 'Lỗi kết nối server');
        }
      },

      registerAPI: async (userData) => {
        try {
          const response = await api.post('auth/register', userData);
          
          // Sau khi đăng ký thành công (trong luồng mới), 
          // endpoint register sẽ trả về token và user giống như login
          const { token, user } = response.data.data;
          if (token && user) {
            localStorage.setItem('token', token);
            const normalizedUser: User = {
                id: String(user.id),
                name: user.name || user.full_name || user.username || '',
                email: user.email || '',
                avatar: user.avatar || '',
                role: user.role || 'user',
                role_id: parseInt(user.role_id) || 3,
                role_level: parseInt(user.role_level) || 1,
                permissions: user.permissions || [],
                bio: user.bio || '',
                location: user.location || user.hometown || '',
                interests: Array.isArray(user.interests) 
                  ? user.interests 
                  : (typeof user.interests === 'string' ? user.interests.split(', ') : []),
                savedDestinations: [],
                following: user.following || [],
            };
            set({ user: normalizedUser, token: token, isAuthenticated: true });
          }
          
          return response.data;
        } catch (error: any) {
          const errorData = error.response?.data;
          throw new Error(errorData?.message || error.message || 'Lỗi đăng ký');
        }
      },

      sendRegisterOTPAPI: async (email) => {
        try {
          const response = await api.post('auth/send-register-otp', { email });
          return response.data;
        } catch (error: any) {
          const errorData = error.response?.data;
          throw new Error(errorData?.message || error.message || 'Lỗi gửi mã xác thực');
        }
      },

      verifyOTPAPI: async (email, otp) => {
        try {
          const response = await api.post('auth/verify-otp', { email, otp });
          return response.data;
        } catch (error: any) {
          const errorData = error.response?.data;
          throw new Error(errorData?.message || error.message || 'Mã xác thực OTP không đúng hoặc đã hết hạn');
        }
      },

      googleLoginAPI: async (googleData) => {
        try {
          const response = await api.post('auth/google-login', googleData);
          const { token, user } = response.data.data;
          
          localStorage.setItem('token', token);
          
          const normalizedUser: User = {
            id: String(user.id),
            name: user.name || user.full_name || user.username || '',
            email: user.email || '',
            avatar: user.avatar || '',
            role: user.role || 'user',
            role_id: parseInt(user.role_id) || 3,
            role_level: parseInt(user.role_level) || 1,
            permissions: user.permissions || [],
            bio: user.bio || '',
            location: user.location || user.hometown || '',
            interests: Array.isArray(user.interests) 
              ? user.interests 
              : (typeof user.interests === 'string' ? user.interests.split(', ') : []),
            savedDestinations: [],
            following: user.following || [],
          };

          set({ user: normalizedUser, token: token, isAuthenticated: true });
          return response.data;
        } catch (error: any) {
          const errorData = error.response?.data;
          throw new Error(errorData?.message || error.message || 'Lỗi Google Login');
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: (newData) => set((state) => ({
        user: state.user ? { ...state.user, ...newData } : null
      })),

      saveDestination: (id) => set((state) => ({
        user: state.user ? {
          ...state.user,
          savedDestinations: [...new Set([...(state.user.savedDestinations || []), id])],
        } : null
      })),
      unsaveDestination: (id) => set((state) => ({
        user: state.user ? {
          ...state.user,
          savedDestinations: state.user.savedDestinations?.filter(destId => destId !== id) || [],
        } : null
      })),
      toggleFollow: async (userId, currentStatus) => {
        const state = get();
        if (!state.user) return;
        
        // Ưu tiên sử dụng trạng thái truyền vào, nếu không có mới dùng list trong store
        const isFollowing = currentStatus !== undefined 
          ? currentStatus 
          : state.user.following?.includes(userId);
        
        try {
          if (isFollowing) {
            await userApi.unfollow(userId);
          } else {
            await userApi.follow(userId);
          }
          
          set((state) => {
            if (!state.user) return state;
            const newFollowing = isFollowing
              ? (state.user.following || []).filter(id => String(id) !== String(userId))
              : [...(state.user.following || []), String(userId)];
            
            return { user: { ...state.user, following: newFollowing } };
          });
        } catch (error) {
          console.error('Toggle follow failed:', error);
          throw error;
        }
      },
      isFriend: (userId) => {
        const user = get().user;
        if (!user) return false;
        return (user.following || []).includes(userId);
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
