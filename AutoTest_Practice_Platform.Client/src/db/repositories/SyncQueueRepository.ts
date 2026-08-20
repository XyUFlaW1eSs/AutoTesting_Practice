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
  async upsertCardUpdate(
    item: SyncQueueItem,
  ): Promise<void> {

    const existing =
      await db.syncQueue
        .where({
          entity: 'card',
          entityId: item.entityId,
          operation: 'update',
        })
        .first();

    if (
      existing?.id !== undefined
    ) {
      await db.syncQueue.update(
        existing.id,
        {
          payload: item.payload,
          createdAt: item.createdAt,
        },
      );

      return;
    }

    await db.syncQueue.add(
      item,
    );
  }
};