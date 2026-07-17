import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header của mỗi request nếu có
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  
  // Thử lấy từ auth-storage nếu không có token riêng lẻ
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        token = state?.token || state?.user?.token;
      } catch (e) {
        console.error('Lỗi khi phân giải auth-storage:', e);
      }
    }
  }

  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    // Sử dụng cách thiết lập header tương thích với nhiều phiên bản Axios
    config.headers.Authorization = `Bearer ${token}`;
    // Một số server yêu cầu viết thường
    // config.headers['authorization'] = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Xử lý lỗi tập trung (vd: token hết hạn hoặc bị khóa)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token và trạng thái login
      useAuthStore.getState().logout();
      // Chuyển hướng về login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
