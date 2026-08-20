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

const loadStoredUser = (): UserResponse | null => {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    return JSON.parse(raw) as UserResponse;
  } catch {
    localStorage.removeItem('auth_user');
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: loadStoredUser(),
  isFetchingUser: false,
  
  setAuth: (data) => {
    if (data.token) localStorage.setItem('auth_token', data.token);
    if (data.refreshToken) localStorage.setItem('auth_refresh_token', data.refreshToken);
    if (data.userId) localStorage.setItem('auth_user_id', data.userId);

    const user: UserResponse = {
      id: data.userId,
      userName: data.userName,
      email: data.email,
      role: data.role,
    };

    localStorage.setItem('auth_user', JSON.stringify(user));
    
    set({
      token: data.token ?? null,
      user
    });
  },
  
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null });
  },

  // 核心逻辑：使用本地的 Token 向后端换取最新的用户完整信息
  fetchUser: async () => {
    const { token } = get();
    // 如果没有 Token，或者已经有了 user 信息，则不需要拉取
    if (!token) return;

    set({ isFetchingUser: true });
    try {
      const userData = await authService.getMe();
      localStorage.setItem('auth_user', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      console.error('无法从服务器获取当前用户，继续使用本地认证状态', error);

      const currentState = get();

      if ( currentState.token && !currentState.user ) {
        const storedUser = loadStoredUser();
        if (storedUser) {
          set({ user: storedUser });
        }
      }
    } finally {
      set({ isFetchingUser: false });
    }
  }
}));