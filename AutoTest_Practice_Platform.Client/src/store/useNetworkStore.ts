import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  initialize: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: navigator.onLine,

  initialize: () => {
    // Phase 5：统一监听浏览器网络状态，供整个应用显示 Offline 状态。
    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  },
}));