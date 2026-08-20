import { db } from '../database';
import type { DbCard } from '../models';

export const cardRepository = {
  /**
   * 获取所有未删除的本地 Card。
   */
  async getAll(): Promise<DbCard[]> {
    const cards = await db.cards.toArray();
    return cards.filter(card => !card.isDeleted);
  },

  /**
   * 根据 ID 获取单个 Card。
   */
  async getById(id: string): Promise<DbCard | undefined> {
    return db.cards.get(id);
  },

  /**
   * 新增本地 Card。
   */
  async insert(card: DbCard): Promise<string> {
    await db.cards.add(card);
    return card.id;
  },

  /**
   * 更新本地 Card。
   */
  async update(
    id: string,
    changes: Partial<DbCard>,
  ): Promise<void> {
    await db.cards.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * 软删除本地 Card。
   *
   * 不进行物理删除，因为后续 Phase 4 需要知道该记录曾经存在并被删除。
   */
  async delete(id: string): Promise<void> {
    await db.cards.update(id, {
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * 批量写入本地 Card。
   *
   * 用于首次从服务器初始化 IndexedDB。
   */
  async bulkPut(cards: DbCard[]): Promise<void> {
    await db.cards.bulkPut(cards);
  },
};