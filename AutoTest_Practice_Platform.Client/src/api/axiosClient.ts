import axios from 'axios';
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

// ==========================================
// 响应拦截器 (Response Interceptor)
// ==========================================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status } = error.response;
      
      // 当发生 401 且该请求还没有重试过时
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // 标记为已重试，防止死循环
        
        const userId = localStorage.getItem('auth_user_id');
        const refreshToken = localStorage.getItem('auth_refresh_token');

        // 如果存在刷新凭证，则尝试静默刷新
        if (userId && refreshToken) {
          try {
            // 注意：这里必须使用全新的 axios 实例，避免触发当前的拦截器形成死循环
            const refreshRes = await axios.post<{ token: string; refreshToken: string }>(
              `${originalRequest.baseURL}/api/auth/refresh`, 
              { userId, refreshToken }
            );

            const newToken = refreshRes.data.token;
            const newRefreshToken = refreshRes.data.refreshToken;

            // 存入新的凭证
            localStorage.setItem('auth_token', newToken);
            localStorage.setItem('auth_refresh_token', newRefreshToken);

            // 修改原请求的 Header，并重新发送
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);

          } catch (refreshError) {
            // 如果刷新也失败了（比如 refreshToken 也过期了），强制踢回登录页
            console.error('刷新 Token 失败，身份已彻底过期');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_user_id');
            window.location.href = '/login'; 
          }
        } else {
          // 根本没有刷新凭证，直接踢出
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
      
      // 处理 500 服务器错误
      if (status === 500) {
        console.error('服务器遇到了未知的错误 (500)');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;