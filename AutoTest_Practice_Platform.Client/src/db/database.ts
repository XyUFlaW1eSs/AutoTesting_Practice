import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DbCard } from './models';

export class LocalDatabase extends Dexie {
  cards!: Table<DbCard, string | number>;

  constructor() {
    super('Autotest_Platform_LocalDB');
    
    // 版本 1：定义 stores 和 需要建立索引的字段
    // 注意：没有在这里声明的字段依然会存入 IndexedDB，只是不能被用于快速查询（如 db.cards.where(...)）
    this.version(1).stores({
      cards: 'id, cardNumber, expiryDate, ccv, isDeleted, createdAt, updatedAt'
    });
  }
}

export const db = new LocalDatabase();