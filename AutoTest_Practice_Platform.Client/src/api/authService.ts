import axiosClient from './axiosClient';
import type { LoginRequest, AuthResponse, UserResponse, RegisterRequest, RefreshTokenRequest } from './types';

export const authService = {

  // 注册接口
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  // 登录接口
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  // 刷新 Token 接口
  refresh: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/api/auth/refresh', data);
    return response.data;
  },

  // 退出登录接口
  logout: async (): Promise<void> => {
    await axiosClient.post('/api/auth/logout');
  },

  // 获取当前登录用户信息接口
  getMe: async (): Promise<UserResponse> => {
    const response = await axiosClient.get<UserResponse>('/api/auth/me');
    return response.data;
  }
};