import { db } from '../database';
import type { SyncQueueItem } from '../syncModels';

export const syncQueueRepository = {

  async add(item: SyncQueueItem,): Promise<number> {
    return await db.syncQueue.add(item,);
  },

  async getAll(): Promise<SyncQueueItem[]> {
    return await db.syncQueue
      .orderBy('createdAt')
      .toArray();
  },

  async getById(id: number,): Promise<SyncQueueItem | undefined> {
    return await db.syncQueue.get(id,);
  },

  async remove(id: number,): Promise<void> {
    await db.syncQueue.delete(id,);
  },

  async upsertCardUpdate(
    item: SyncQueueItem,
  ): Promise<void> {

    const queue =
      await db.syncQueue
        .where('entityId')
        .equals(item.entityId)
        .toArray();

    const createItem =
      queue.find(x =>
        x.entity === 'card' &&
        x.operation === 'create',
      );


    if (createItem?.id !== undefined) {
      await db.syncQueue.update(
        createItem.id,
        {
          payload: item.payload,
          createdAt: item.createdAt,
        },
      );
      return;
    }

    const updateItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'update',
      );

    if (updateItem?.id !== undefined) {
      await db.syncQueue.update(
        updateItem.id,
        {
          payload: item.payload,
          createdAt: item.createdAt,
        },
      );

      return;
    }

    await db.syncQueue.add(item,);
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
      queue.find(x =>
        x.entity === 'card' &&
        x.operation === 'create',
      );


    if (createItem?.id !== undefined) {
      await db.syncQueue.delete(createItem.id,);
      return;
    }

    const updateItem =
      queue.find(x =>
        x.entity === 'card' &&
        x.operation === 'update',
      );


    if (updateItem?.id !== undefined) {
      await db.syncQueue.delete(updateItem.id,);
    }

    const deleteItem =
      queue.find(
        x =>
          x.entity === 'card' &&
          x.operation === 'delete',
      );

    if (deleteItem) {
      return;
    }

    await db.syncQueue.add({
      entity: 'card',
      entityId,
      operation: 'delete',
      createdAt: new Date().toISOString(),
    });
  },

};