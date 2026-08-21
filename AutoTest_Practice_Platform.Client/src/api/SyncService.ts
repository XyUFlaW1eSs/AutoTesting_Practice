import { cardService } from '@/api/cardService';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { SyncQueueItem } from '@/db/syncModels';

let syncing = false;

const isQueueUnchanged = (original: SyncQueueItem, current: SyncQueueItem | undefined,): boolean => {

  if (!current) {
    return false;
  }

  return (
    current.id === original.id &&
    current.entity === original.entity &&
    current.entityId === original.entityId &&
    current.operation === original.operation &&
    current.createdAt === original.createdAt &&
    JSON.stringify(current.payload) ===
    JSON.stringify(original.payload)
  );
};


export const syncService = {

  async sync(): Promise<void> {
    if (syncing) {
      return;
    }
    if (!navigator.onLine) {
      return;
    }
    syncing = true;
    try {
      const queue = await syncQueueRepository.getAll();

      for (const item of queue) {
        try {
          await this.process(item);
        } catch (error) {
          console.error('Card sync failed:', item, error,);
          break;
        }
      }

    } finally {
      syncing = false;
    }
  },

  async process(item: SyncQueueItem,): Promise<void> {
    if (item.entity !== 'card') {
      return;
    }

    if (item.operation === 'create') {
      if (!item.payload) {
        throw new Error('Create sync payload missing.',);
      }

      const originalQueue = {
        ...item,
        payload: item.payload
          ? { ...item.payload }
          : undefined,
      };

      const response =
        await cardService.createCard({
          id: item.entityId,
          cardNumber: item.payload.cardNumber,
          expiryDate: item.payload.expiryDate,
          ccv: item.payload.ccv,
          isDeleted: item.payload.isDeleted,
        });

      const currentQueue = item.id !== undefined ? await syncQueueRepository.getById(item.id,) : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue,)) {
        console.info(
          'Card was modified during Create sync. ' +
          'Keep the latest local version and Queue.',
        );
        return;
      }

      await cardRepository.bulkPut([{
        id: item.entityId,
        cardNumber: response.cardNumber,
        expiryDate: response.expiryDate,
        ccv: response.ccv,
        isDeleted: response.isDeleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      }]);


      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id,);
      }
      return;
    }

    if (item.operation === 'update') {
      if (!item.payload) {
        throw new Error('Update sync payload missing.',);
      }

      const originalQueue = {
        ...item,
        payload: item.payload
          ? { ...item.payload }
          : undefined,
      };

      const response = await cardService.updateCard(item.entityId, {
        cardNumber: item.payload.cardNumber,
        expiryDate: item.payload.expiryDate,
        ccv: item.payload.ccv,
        isDeleted: item.payload.isDeleted,
      },
      );

      const currentQueue = item.id !== undefined ? await syncQueueRepository.getById(item.id,) : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue,)) {
        console.info(
          'Card was modified during Update sync. ' +
          'Keep the latest local version and Queue.',
        );

        return;
      }
      await cardRepository.bulkPut([{
        id: item.entityId,
        cardNumber: response.cardNumber,
        expiryDate: response.expiryDate,
        ccv: response.ccv,
        isDeleted: response.isDeleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      }]);

      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id,);
      }
      return;
    }

    if (item.operation === 'delete') {

      const originalQueue = { ...item, };
      await cardService.deleteCard(item.entityId,);
      const currentQueue = item.id !== undefined ? await syncQueueRepository.getById(item.id,) : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue,)) {
        console.info(
          'Card was modified during Delete sync. ' +
          'Keep the latest Queue.',
        );
        return;
      }

      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id,);
      }
    }
  },
};