import type { CardQuery, } from '../../api/types';
import { db } from '../database';
import type { DbCard, } from '../models';
import { getChinaNow } from '@/utils/dateTime';

export const cardRepository = {

  async getAll(query?: CardQuery): Promise<DbCard[]> {
    let cards = await db.cards.toArray();

    if (query?.cardNumber?.trim()) {
      const value = query.cardNumber.trim();
      cards = cards.filter(card => card.cardNumber.includes(value),);
    }

    if (query?.expiryDate?.trim()) {

      const value = query.expiryDate.trim();

      cards = cards.filter(card => card.expiryDate.includes(value),);
    }

    if (query?.isDeleted !== undefined) {
      cards = cards.filter(card => card.isDeleted === query.isDeleted,);
    }

    const activeCards = cards.filter(card => !card.isDeleted,)
      .sort((a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
      );

    const deletedCards = cards.filter(card => card.isDeleted,)
      .sort((a, b) =>
        new Date(b.updatedAt ?? b.createdAt,).getTime() -
        new Date(a.updatedAt ?? a.createdAt,).getTime(),
      );

    return [...activeCards, ...deletedCards,];
  },

  async isEmpty(): Promise<boolean> {
    return (await db.cards.count()) === 0;
  },

  async insert(card: DbCard): Promise<void> {
    await db.cards.add(card,);
  },

  async update(id: string, changes: Partial<DbCard>): Promise<void> {
    await db.cards.update(
      id,
      {
        ...changes
      },
    );
  },

  async delete(id: string): Promise<void> {
    await db.cards.update(
      id,
      {
        isDeleted: true,
        updatedAt: getChinaNow(),
      },
    );
  },

  async remove(id: string): Promise<void> {
    await db.cards.delete(id);
  },

  async bulkPut(cards: DbCard[]): Promise<void> {
    await db.cards.bulkPut(cards,);
  },

  /**
   * 物理删除指定的本地卡片，仅用于同步服务器数据后的本地数据清理。
   */
  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.cards.bulkDelete(ids);
  }
};