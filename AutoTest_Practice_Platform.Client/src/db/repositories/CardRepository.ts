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

  /**
   * 获取本地 Card。
   *
   * 修改：
   * 这里只负责 IndexedDB 查询。
   *
   * 不调用 API。
   */
  async getAll(
    query?: CardQuery,
  ): Promise<DbCard[]> {

    let cards =
      await db.cards.toArray();

    // ========================================================
    // cardNumber 模糊查询
    // ========================================================
    if (
      query?.cardNumber?.trim()
    ) {
      const value =
        query.cardNumber.trim();

      cards =
        cards.filter(card =>
          card.cardNumber.includes(
            value,
          ),
        );
    }

    // ========================================================
    // expiryDate 模糊查询
    // ========================================================
    if (
      query?.expiryDate?.trim()
    ) {
      const value =
        query.expiryDate.trim();

      cards =
        cards.filter(card =>
          card.expiryDate.includes(
            value,
          ),
        );
    }

    // ========================================================
    // isDeleted 查询
    // ========================================================
    if (
      query?.isDeleted !== undefined
    ) {
      cards =
        cards.filter(card =>
          card.isDeleted ===
          query.isDeleted,
        );
    }

    // ========================================================
    // 与后端保持一致：
    //
    // 未删除：
    // CreatedAt ASC
    // ========================================================
    const activeCards =
      cards
        .filter(card =>
          !card.isDeleted,
        )
        .sort(
          (a, b) =>
            new Date(
              a.createdAt,
            ).getTime() -
            new Date(
              b.createdAt,
            ).getTime(),
        );

    // ========================================================
    // 删除：
    // UpdatedAt DESC
    // ========================================================
    const deletedCards =
      cards
        .filter(card =>
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

  /**
   * 获取数据库是否为空。
   *
   * 修改：
   * 初始化流程不再通过：
   *
   * getAll()
   * → 再 getAll()
   *
   * 判断数据库状态。
   */
  async isEmpty(): Promise<boolean> {
    return (
      await db.cards.count()
    ) === 0;
  },

  /**
   * 新增。
   */
  async insert(
    card: DbCard,
  ): Promise<void> {
    await db.cards.add(card);
  },

  /**
   * 更新。
   */
  async update(
    id: string,
    changes: Partial<DbCard>,
  ): Promise<void> {

    await db.cards.update(
      id,
      {
        ...changes,

        // 修改：
        // 每次本地修改自动更新时间。
        updatedAt:
          new Date().toISOString(),
      },
    );
  },

  /**
   * 软删除。
   */
  async delete(
    id: string,
  ): Promise<void> {

    await db.cards.update(
      id,
      {
        isDeleted: true,

        // 修改：
        // 删除操作更新时间。
        updatedAt:
          new Date().toISOString(),
      },
    );
  },

  /**
   * 批量写入。
   *
   * 用于：
   *
   * API
   * ↓
   * IndexedDB
   */
  async bulkPut(
    cards: DbCard[],
  ): Promise<void> {
    await db.cards.bulkPut(
      cards,
    );
  },

  /**
   * 本地 ID → Server ID。
   *
   * Phase 4 Create 同步成功后使用。
   */
  async replaceId(
    localId: string,
    serverId: string,
  ): Promise<void> {

    if (
      localId === serverId
    ) {
      return;
    }

    const card =
      await db.cards.get(
        localId,
      );

    if (!card) {
      return;
    }

    await db.transaction(
      'rw',
      db.cards,
      async () => {

        await db.cards.delete(
          localId,
        );

        await db.cards.put({
          ...card,
          id: serverId,
        });
      },
    );
  },
  
  /**
   * 物理删除本地记录。
   *
   * 修改原因：
   *
   * 正常业务删除必须使用 delete() 的 Soft Delete。
   *
   * 只有 Local-Only Create 已经成功同步到服务器，
   * 并且服务器生成了新的正式 UUID 时，
   * 才允许删除原来的 Local UUID。
   *
   * 此方法禁止 UI 直接使用。
   */
  async deletePhysical( id : string) : Promise<void> {
    await db.cards.delete(id);
  }

};