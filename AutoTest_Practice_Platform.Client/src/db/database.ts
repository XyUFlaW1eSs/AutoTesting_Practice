import Dexie, { type Table } from 'dexie';
import type { DbCard } from './models';

export class AppDatabase extends Dexie {
  cards!: Table<DbCard, string>;

  constructor() {
    super('AutoTestPracticePlatform');

    this.version(1).stores({
      cards: 'id, isDeleted, createdAt, updatedAt',
    });
  }
}

export const db = new AppDatabase();