import type {
  CardQuery,
} from '../../api/types';

import {
  db,
} from '../database';

import type {
  DbCard,
} from '../models';


export const cardRepository = {

  // ==========================================================
  // 获取所有本地 Card
  // ==========================================================
  //
  // 这里只访问 IndexedDB。
  // ==========================================================

  async getAll(
    query?: CardQuery,
  ): Promise<DbCard[]> {

    let cards =
      await db.cards.toArray();


    // ========================================================
    // Card Number 模糊查询
    // ========================================================

    if (
      query?.cardNumber?.trim()
    ) {

      const value =
        query.cardNumber.trim();

      cards =
        cards.filter(
          card =>
            card.cardNumber.includes(value),
        );
    }


    // ========================================================
    // Expiry Date 模糊查询
    // ========================================================

    if (
      query?.expiryDate?.trim()
    ) {

      const value =
        query.expiryDate.trim();

      cards =
        cards.filter(
          card =>
            card.expiryDate.includes(value),
        );
    }


    // ========================================================
    // 删除状态过滤
    // ========================================================

    if (
      query?.isDeleted !== undefined
    ) {

      cards =
        cards.filter(
          card =>
            card.isDeleted ===
            query.isDeleted,
        );
    }


    // ========================================================
    // 未删除：
    // CreatedAt ASC
    // ========================================================

    const activeCards =
      cards
        .filter(
          card =>
            !card.isDeleted,
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime(),
        );


    // ========================================================
    // 已删除：
    // UpdatedAt DESC
    // ========================================================

    const deletedCards =
      cards
        .filter(
          card =>
            card.isDeleted,
        )
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ??
              b.createdAt,
            ).getTime() -
            new Date(
              a.updatedAt ??
              a.createdAt,
            ).getTime(),
        );


    return [
      ...activeCards,
      ...deletedCards,
    ];
  },


  // ==========================================================
  // 判断本地数据库是否为空
  // ==========================================================

  async isEmpty(): Promise<boolean> {

    return (
      await db.cards.count()
    ) === 0;
  },


  // ==========================================================
  // 新增
  // ==========================================================

  async insert(
    card: DbCard,
  ): Promise<void> {

    await db.cards.add(
      card,
    );
  },


  // ==========================================================
  // 更新
  // ==========================================================

  async update(
    id: string,
    changes: Partial<DbCard>,
  ): Promise<void> {

    await db.cards.update(
      id,
      {

        ...changes,

        // 每次修改自动更新时间。
        updatedAt:
          new Date().toISOString(),

      },
    );
  },


  // ==========================================================
  // 软删除
  // ==========================================================

  async delete(
    id: string,
  ): Promise<void> {

    await db.cards.update(
      id,
      {

        isDeleted:
          true,

        // 删除时更新时间。
        updatedAt:
          new Date().toISOString(),

      },
    );
  },


  // ==========================================================
  // 批量写入
  // ==========================================================

  async bulkPut(
    cards: DbCard[],
  ): Promise<void> {

    await db.cards.bulkPut(
      cards,
    );
  },

};