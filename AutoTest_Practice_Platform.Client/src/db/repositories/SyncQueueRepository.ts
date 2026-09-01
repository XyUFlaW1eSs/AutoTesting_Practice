import { db } from '../database';
import type { SyncQueueItem } from '../syncModels';
import { getChinaNow } from '@/utils/dateTime';

const CARD_ENTITY = 'card';

/**
 * 获取 Queue 的持久化 ID，不存在时直接抛出异常。
 */
function getQueueId(item: SyncQueueItem): number {
  if (item.id === undefined) {
    throw new Error('Sync queue item is missing id');
  }
  return item.id;
}

export const syncQueueRepository = {

  async getAll(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.orderBy('createdAt').toArray();
  },

  async add(item: SyncQueueItem,): Promise<void> {
    const queue = await db.syncQueue.toArray();

    // 创建卡片时，如果同一张卡片已经存在 create Queue，则直接更新原 Queue。
    const existingCreate = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === item.entityId && x.operation === 'create',
    );

    if (item.operation === 'create' && existingCreate) {
      await db.syncQueue.update(getQueueId(existingCreate), {
        createdAt: item.createdAt,
        payload: item.payload,
      });
      return;
    }

    // create + delete 表示这张卡片从未真正同步到服务器，因此无需向服务器发送任何操作。
    if (item.operation === 'delete') {
      const existingCreateQueue = queue.find(
        x => x.entity === CARD_ENTITY && x.entityId === item.entityId && x.operation === 'create',
      );

      if (existingCreateQueue) {
        await db.syncQueue.delete(getQueueId(existingCreateQueue));
        return;
      }
    }

    await db.syncQueue.add(item);
  },

  async upsertCardUpdate(item: SyncQueueItem): Promise<void> {

    const queue = await db.syncQueue.toArray();

    const existingCreate = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === item.entityId && x.operation === 'create',
    );

    // create + update：仍然只需要 create，但 payload 必须更新成最新 Card。
    if (existingCreate) {
      await db.syncQueue.update(getQueueId(existingCreate), {
        payload: item.payload,
      });
      return;
    }

    const existingUpdate = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === item.entityId && x.operation === 'update',
    );

    // update + update：保留一个 update Queue，并使用最新的 Card 数据。
    if (existingUpdate) {
      await db.syncQueue.update(getQueueId(existingUpdate), {
        createdAt: item.createdAt,
        payload: item.payload,
      });
      return;
    }

    const existingDelete = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === item.entityId && x.operation === 'delete',
    );

    // 如果当前已经存在 delete Queue，不应该再追加 update。
    if (existingDelete) {
      return;
    }

    await db.syncQueue.add(item);
  },

  async upsertCardDelete(entityId: string): Promise<void> {
    const queue = await db.syncQueue.toArray();

    const existingCreate = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === entityId && x.operation === 'create',
    );

    // create + delete：卡片从未同步到服务器，直接取消 create Queue。
    if (existingCreate) {
      await db.syncQueue.delete(getQueueId(existingCreate));
      return;
    }

    const existingDelete = queue.find(
      x => x.entity === CARD_ENTITY && x.entityId === entityId && x.operation === 'delete',
    );

    // delete + delete：已经存在删除任务，不需要重复创建。
    if (existingDelete) {
      return;
    }

    const now = getChinaNow();

    const deleteItem: Omit<SyncQueueItem, 'id'> = {
      entity: CARD_ENTITY,
      entityId,
      operation: 'delete',
      createdAt: now,
      payload: null,
    };

    // update + delete：删除操作覆盖之前的 update。
    const existingUpdate = queue.find(
      x =>
        x.entity === CARD_ENTITY &&
        x.entityId === entityId &&
        x.operation === 'update',
    );

    if (existingUpdate) {
      await db.syncQueue.update(getQueueId(existingUpdate), {
        operation: 'delete',
        createdAt: now,
        payload: null,
      });
      return;
    }

    await db.syncQueue.add(deleteItem as SyncQueueItem);
  },

  async remove(id: number,): Promise<void> {
    await db.syncQueue.delete(id,);
  },

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  },

  async getQueueId(item: SyncQueueItem): Promise<number> {
    if (item.id === undefined) {
      throw new Error('Sync queue item is missing id');
    }
    return item.id;
  }
};