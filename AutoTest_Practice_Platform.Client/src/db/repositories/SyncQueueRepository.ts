import {
  db,
} from '../database';

import type {
  SyncQueueItem,
} from '../syncModels';


export const syncQueueRepository = {

  // ==========================================================
  // 添加任务
  // ==========================================================

  async add(
    item: SyncQueueItem,
  ): Promise<number> {

    return await db.syncQueue.add(
      item,
    );
  },


  // ==========================================================
  // 获取全部任务
  //
  // 按创建时间顺序执行。
  // ==========================================================

  async getAll(): Promise<
    SyncQueueItem[]
  > {

    return await db.syncQueue
      .orderBy('createdAt')
      .toArray();
  },


  // ==========================================================
  // 删除已完成任务
  // ==========================================================

  async remove(
    id: number,
  ): Promise<void> {

    await db.syncQueue.delete(
      id,
    );
  },


  // ==========================================================
  // 合并 Update
  // ==========================================================

  async upsertCardUpdate(
    item: SyncQueueItem,
  ): Promise<void> {

    const queue =
      await db.syncQueue
        .where('entityId')
        .equals(item.entityId)
        .toArray();


    // ========================================================
    // Create 尚未同步：
    //
    // Create + Update
    //
    // 直接更新 Create payload。
    // ========================================================

    const createItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'create',
      );


    if (
      createItem?.id !== undefined
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


    // ========================================================
    // 已存在 Update：
    //
    // Update A
    // Update B
    // Update C
    //
    // 最终只保留 Update C。
    // ========================================================

    const updateItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'update',
      );


    if (
      updateItem?.id !== undefined
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


    // ========================================================
    // 第一次 Update
    // ========================================================

    await db.syncQueue.add(
      item,
    );
  },


  // ==========================================================
  // 合并 Delete
  // ==========================================================

  async upsertCardDelete(
    entityId: string,
  ): Promise<void> {

    const queue =
      await db.syncQueue
        .where('entityId')
        .equals(entityId)
        .toArray();


    // ========================================================
    // Create + Delete
    //
    // Server 根本还没有这张卡。
    //
    // 因此无需请求 Create，也无需请求 Delete。
    // ========================================================

    const createItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'create',
      );


    if (
      createItem?.id !== undefined
    ) {

      await db.syncQueue.delete(
        createItem.id,
      );

      return;
    }


    // ========================================================
    // 删除已有 Update
    // ========================================================

    const updateItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'update',
      );


    if (
      updateItem?.id !== undefined
    ) {

      await db.syncQueue.delete(
        updateItem.id,
      );
    }


    // ========================================================
    // 如果已经有 Delete Queue，
    // 不重复创建。
    // ========================================================

    const deleteItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'delete',
      );


    if (deleteItem) {
      return;
    }


    // ========================================================
    // 创建 Delete Queue
    // ========================================================

    await db.syncQueue.add({

      entity:
        'card',

      entityId,

      operation:
        'delete',

      createdAt:
        new Date().toISOString(),

    });
  },

};