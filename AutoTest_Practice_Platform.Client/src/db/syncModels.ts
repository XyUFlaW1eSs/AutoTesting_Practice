// ============================================================
// Phase 4 - Sync Queue
// ============================================================
//
// Sync Queue 用于保存：
//
// 本地操作
//     ↓
// IndexedDB
//     ↓
// Sync Queue
//     ↓
// 网络恢复
//     ↓
// API
//
// 注意：
// Queue 本身只负责记录操作。
// 真正的同步逻辑放在 SyncService。
// ============================================================

export type SyncOperation =
  | 'create'
  | 'update'
  | 'delete';

export interface SyncQueueItem {
  /**
   * Dexie 自增主键。
   */
  id?: number;

  /**
   * 当前同步实体。
   *
   * 目前只有 Card。
   */
  entity: 'card';

  /**
   * 本地 Card ID。
   *
   * 在 Create 尚未同步之前，
   * 它可能是 Local UUID。
   */
  entityId: string;

  /**
   * 操作类型。
   */
  operation: SyncOperation;

  /**
   * 操作发生时间。
   */
  createdAt: string;

  /**
   * 当前操作所需要的数据。
   *
   * Create / Update 使用。
   */
  payload?: {
    cardNumber: string;
    expiryDate: string;
    ccv: string;
    isDeleted: boolean;
  };
}