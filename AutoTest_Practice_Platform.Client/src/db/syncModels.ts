export type SyncOperation =
  | 'create'
  | 'update'
  | 'delete';
export interface SyncQueueItem {
  id?: number;
  entity: 'card';
  entityId: string;
  operation: SyncOperation;
  createdAt: string;
  payload?: {
    cardNumber: string;
    expiryDate: string;
    ccv: string;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}