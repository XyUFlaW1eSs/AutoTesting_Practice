import {
  db,
} from '../database';

import type {
  SyncQueueItem,
} from '../syncModels';

export const syncQueueRepository = {

  /**
   * 添加同步任务。
   */
  async add(
    item: SyncQueueItem,
  ): Promise<number> {

    return await db.syncQueue.add(
      item,
    );
  },

  /**
   * 获取所有同步任务。
   *
   * 按创建时间顺序处理。
   */
  async getAll(): Promise<
    SyncQueueItem[]
  > {

    return await db.syncQueue
      .orderBy('createdAt')
      .toArray();
  },

  /**
   * 删除已经完成的同步任务。
   */
  async remove(
    id: number,
  ): Promise<void> {

    await db.syncQueue.delete(
      id,
    );
  },

  /**
   * 修改 Queue 中的 entityId。
   *
   * Local UUID 同步为 Server UUID 后，
   * 后续 update/delete 必须使用 Server ID。
   */
  async replaceEntityId(
    oldId: string,
    newId: string,
  ): Promise<void> {

    const items =
      await db.syncQueue
        .where('entityId')
        .equals(oldId)
        .toArray();

    await db.transaction(
      'rw',
      db.syncQueue,
      async () => {

        for (
          const item of items
        ) {

          if (
            item.id === undefined
          ) {
            continue;
          }

          await db.syncQueue.update(
            item.id,
            {
              entityId: newId,
            },
          );
        }
      },
    );
  },
  /**
   * 合并 Card Update Queue。
   *
   * 修改原因：
   *
   * 用户可能连续修改同一张卡：
   *
   * Update A
   * Update B
   * Update C
   *
   * 没必要产生三个网络请求。
   *
   * 最终只需要：
   *
   * Update C
   *
   * 如果当前 Card 还存在 Create Queue，
   * 则直接把最终数据合并进 Create Queue。
   */
  async upsertCardUpdate(
    item: SyncQueueItem,
  ): Promise<void> {

    const queue =
      await db.syncQueue
        .where('entityId')
        .equals(item.entityId)
        .toArray();


    // ==========================================================
    // 如果存在 Create Queue
    // ==========================================================
    //
    // Create 尚未同步：
    //
    // Create
    // +
    // Update
    //
    // 最终只需要 Create，
    // 但 payload 使用最新数据。
    // ==========================================================

    const createItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'create',
      );


    if (
      createItem &&
      createItem.id !== undefined
    ) {

      await db.syncQueue.update(
        createItem.id,
        {
          payload:
            item.payload,

          createdAt:
            item.createdAt,
        },
      );

      return;
    }


    // ==========================================================
    // 已存在 Update Queue
    // ==========================================================

    const updateItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'update',
      );


    if (
      updateItem &&
      updateItem.id !== undefined
    ) {

      await db.syncQueue.update(
        updateItem.id,
        {
          payload:
            item.payload,

          createdAt:
            item.createdAt,
        },
      );

      return;
    }


    // ==========================================================
    // 没有现有任务
    // ==========================================================

    await db.syncQueue.add(
      item,
    );
  },
  async upsertCardDelete(
    entityId: string,
  ): Promise<void> {

    const queue =
      await db.syncQueue
        .where('entityId')
        .equals(entityId)
        .toArray();


    const createItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'create',
      );


    // ==========================================================
    // Create 尚未同步：
    //
    // Server 根本不存在这条数据。
    //
    // 所以不需要 Delete API。
    // ==========================================================

    if (
      createItem &&
      createItem.id !== undefined
    ) {

      await db.syncQueue.delete(
        createItem.id,
      );

      return;
    }


    // ==========================================================
    // 删除已有 Update Queue
    // ==========================================================

    const updateItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'update',
      );


    if (
      updateItem &&
      updateItem.id !== undefined
    ) {

      await db.syncQueue.delete(
        updateItem.id,
      );
    }


    // ==========================================================
    // 检查是否已经存在 Delete Queue
    // ==========================================================

    const deleteItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'delete',
      );


    if (deleteItem) {
      return;
    }


    // ==========================================================
    // 创建 Delete Queue
    // ==========================================================

    await db.syncQueue.add({

      entity:
        'card',

      entityId,

      operation:
        'delete',

      createdAt:
        new Date().toISOString(),
    });
  }
};