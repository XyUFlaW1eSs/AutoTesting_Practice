import { syncService } from '@/api/SyncService';

// ============================================================
// Sync Initializer
// ============================================================
//
// 职责：
//
// 1. 页面启动后尝试同步一次。
// 2. 网络从 Offline -> Online 时同步。
// 3. 不负责数据查询。
// 4. 不负责 UI。
// ============================================================

let initialized = false;

export const initializeSync = (): void => {
  if (initialized) {
    return;
  }

  initialized = true;

  const handleOnline = () => {
    void syncService.sync();
  };

  window.addEventListener('online', handleOnline);

  if (navigator.onLine) {
    void syncService.sync();
  }
};