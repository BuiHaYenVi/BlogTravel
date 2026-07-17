import Axios from 'axios';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

const httpClient = Axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json', },
});

// Interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => { 
    let token = localStorage.getItem('token');

    // Thử lấy từ auth-storage của Zustand nếu không có token riêng
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          token = state?.token || state?.user?.token;
        } catch (e) {
          console.error('Error parsing auth-storage', e);
        }
      }
    }

    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; 
  },
  (error) => Promise.reject(error)
);

// Interceptor for global error handling
httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => { // Add toast error or boundary
    console.error('API Error:', error.response?.data || error.message);
    
    // Nếu token hết hạn hoặc tài khoản bị khóa (401)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error); 
  }
);

export default httpClient;
