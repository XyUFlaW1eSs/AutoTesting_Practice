import Dexie, { type Table } from 'dexie';
import type { DbCard } from './models';
import type { SyncQueueItem} from './syncModels';

export class AppDatabase extends Dexie {
  cards!: Table<DbCard, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('AutoTestPracticePlatform');

    this.version(1).stores({
      cards: 'id, isDeleted, createdAt, updatedAt',
    });
    this.version(2).stores({
      cards: 'id, isDeleted, createdAt, updatedAt',
      syncQueue: '++id, entity, entityId, operation, createdAt',
    });
  }
}

export const db = new AppDatabase();