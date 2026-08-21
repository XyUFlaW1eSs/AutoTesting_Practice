import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  initialize: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  initialize: () => {
    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 方法返回清理函数，避免重复注册事件。
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
}));