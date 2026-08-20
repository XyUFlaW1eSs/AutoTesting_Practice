import axios, {type AxiosError, type AxiosRequestConfig} from 'axios';
import type { AuthResponse } from './types';
import { useAuthStore } from '../store/useAuthStore';


// 创建 axios 实例
// 注意：这里的 baseURL 请替换为你本地真实运行的后端端口（比如 5289 或 7143）
const currentHost = window.location.hostname; // 获取当前浏览器地址栏的 IP 或域名
const apiPort = '5289'; // 后端固定的端口号
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ||`http://${currentHost}:${apiPort}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 超时时间 10 秒
});

// ============================================================
// Refresh Token 请求专用 Axios 实例
// ============================================================
const refreshClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    `http://${currentHost}:${apiPort}`,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 10000,
});

// ============================================================
// Axios Request Config 类型扩展
// ============================================================
type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};
let refreshPromise: Promise<string | null> | null = null;

// ==========================================
// 请求拦截器 (Request Interceptor)
// ==========================================
axiosClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 中读取我们登录后存入的 token
    const token = useAuthStore.getState().token;
    if (token) {
      // 自动在所有请求头中附加 Bearer Token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// 执行 Refresh Token
// ============================================================
const refreshAccessToken = async (): Promise<string | null> => {
  // 如果当前已经有一个 Refresh 请求正在执行，
  // 其他 401 请求直接等待这个 Promise。
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const userId = localStorage.getItem('auth_user_id');
    const refreshToken = localStorage.getItem('auth_refresh_token');

    // 没有 Refresh Token，说明无法恢复登录状态。
    if (!userId || !refreshToken) {
      return null;
    }

    try {
      // 修改：
      // 使用独立 refreshClient 请求 Refresh API。
      const response = await refreshClient.post<AuthResponse>(
        '/api/auth/refresh',
        {
          userId,
          refreshToken,
        }
      );

      const authData = response.data;

      // Refresh 成功后必须统一通过 AuthStore 更新状态。
      //
      // 不能只修改 localStorage。
      //
      // 否则：
      // localStorage = 新 Token
      // Zustand = 旧 Token
      //
      // 下一次 Request Interceptor 仍然会拿到旧 Token。
      useAuthStore.getState().setAuth(authData);

      return authData.token ?? null;
    } catch (error) {
      // 注意：
      // 这里不能简单认为“请求失败 = Refresh Token 失效”。
      //
      // 如果没有 error.response：
      // 通常代表网络错误、电脑关机、Tailscale 断开等情况。
      //
      // 这种情况下不要清理 Token。
      if (!axios.isAxiosError(error) || !error.response) {
        console.error(
          'Refresh Token 请求失败：当前可能处于离线状态。',
          error
        );

        return null;
      }

      // Refresh API 明确返回 401 / 403，
      // 才认为 Refresh Token 本身已经失效。
      if (
        error.response.status === 401 ||
        error.response.status === 403
      ) {
        console.error(
          'Refresh Token 已失效，需要重新登录。'
        );

        useAuthStore.getState().clearAuth();

        return null;
      }

      // 其他服务器错误不直接清理登录状态。
      console.error(
        'Refresh Token 请求发生服务器错误:',
        error
      );

      return null;
    } finally {
      // 当前 Refresh 请求结束后释放锁。
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ==========================================
// 响应拦截器 (Response Interceptor)
// ==========================================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // 没有原始 Request Config，无法进行重试。
    if (!originalRequest) {
      return Promise.reject(error);
    }
    const status = error.response?.status;

    // ========================================================
    // 401：Access Token 失效
    // ========================================================
    if ( status === 401 && !originalRequest._retry) {
      // 标记当前请求已经进行过一次 Refresh。
      originalRequest._retry = true;

      try {
        // 尝试刷新 Access Token。
        const newToken = await refreshAccessToken();

        // ====================================================
        // Refresh 成功
        // ====================================================
        if (newToken) {
          // 使用新的 Token 重试原请求。
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };

          return axiosClient(originalRequest);
        }
        // ====================================================
        // Refresh 没有成功
        // ====================================================
        //
        // 注意：
        //
        // 如果只是网络错误：
        //   refreshAccessToken() 不会 clearAuth()
        //
        // 如果 Refresh Token 真正失效：
        //   refreshAccessToken() 已经 clearAuth()
        //
        // 这里不再重复清理。
        return Promise.reject(error);
      } catch (refreshError) {
        console.error(
          'Token 自动刷新失败:',
          refreshError
        );

        return Promise.reject(refreshError);
      }
    }

    // ========================================================
    // 500：服务器错误
    // ========================================================

    if (status === 500) {
      console.error(
        '服务器遇到了未知错误 (500)'
      );
    }
    return Promise.reject(error);
  }
);

export default axiosClient;