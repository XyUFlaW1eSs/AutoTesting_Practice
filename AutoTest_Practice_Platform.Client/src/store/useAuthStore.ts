import { create } from 'zustand';
import type { UserResponse, AuthResponse } from '../api/types';
import { authService } from '../api/authService';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isFetchingUser: boolean;
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  isFetchingUser: false,
  
  setAuth: (data) => {
    if (data.token) localStorage.setItem('auth_token', data.token);
    if (data.refreshToken) localStorage.setItem('auth_refresh_token', data.refreshToken);
    if (data.userId) localStorage.setItem('auth_user_id', data.userId);
    
    set({
      token: data.token || null,
      user: {
        id: data.userId,
        userName: data.userName,
        email: data.email,
        role: data.role,
      }
    });
  },
  
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user_id');
    set({ token: null, user: null });
  },

  // 核心逻辑：使用本地的 Token 向后端换取最新的用户完整信息
  fetchUser: async () => {
    const { token, user } = get();
    // 如果没有 Token，或者已经有了 user 信息，则不需要拉取
    if (!token || user) return;

    set({ isFetchingUser: true });
    try {
      const userData = await authService.getMe();
      set({ user: userData });
    } catch (error) {
      console.error('获取当前用户信息失败', error);
    } finally {
      set({ isFetchingUser: false });
    }
  }
}));