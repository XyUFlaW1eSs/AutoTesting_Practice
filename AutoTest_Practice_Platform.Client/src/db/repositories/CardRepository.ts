import { db } from '../database';
import type { DbCard } from '../models';

export class CardRepository {

  async getAll(): Promise<DbCard[]> {
    return db.cards.filter(card => !card.isDeleted).toArray();
  }

  async insert(card: DbCard): Promise<string | number> {
    card.createdAt = new Date().toISOString();
    return db.cards.add(card);
  }

  async update(id: string | number, changes: Partial<DbCard>): Promise<number> {
    changes.updatedAt = new Date().toISOString();
    return db.cards.update(id, changes);
  }

  async delete(id: string | number): Promise<number> {
    return db.cards.update(id, { isDeleted: true, updatedAt: new Date().toISOString() });
  }

  async bulkPut(cards: DbCard[]): Promise<string | number> {
    return db.cards.bulkPut(cards);
  }
}

export const cardRepository = new CardRepository();