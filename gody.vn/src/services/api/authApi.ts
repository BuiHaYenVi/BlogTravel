import httpClient from './httpClient';
import { AuthResponse, LoginCredentials, RegisterData } from '../../shared/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await httpClient.post<any, { data: AuthResponse }>('/auth/login', credentials);
    // httpClient interceptor already returns response.data
    return response as any;
  },
  
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await httpClient.post<any, { data: AuthResponse }>('/auth/register', {
      username: data.fullName.toLowerCase().replace(/\s+/g, ''),
      email: data.email,
      password: data.password,
      full_name: data.fullName
    });
    return response as any;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return httpClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: any): Promise<{ message: string }> => {
    return httpClient.post('/auth/reset-password', data);
  }
};