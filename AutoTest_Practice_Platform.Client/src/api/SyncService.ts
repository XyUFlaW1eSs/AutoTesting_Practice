import { cardService } from '@/api/cardService';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { DbCard } from '@/db/models';
import type { CardResponse } from '@/api/types';
import type { SyncQueueItem } from '@/db/syncModels';

let syncing = false;

const isQueueUnchanged = (original: SyncQueueItem, current: SyncQueueItem | undefined): boolean => {
  if (!current) return false;

  return (
    current.id === original.id &&
    current.entity === original.entity &&
    current.entityId === original.entityId &&
    current.operation === original.operation &&
    current.createdAt === original.createdAt &&
    JSON.stringify(current.payload) === JSON.stringify(original.payload)
  );
};

const toDbCard = (card: CardResponse): DbCard => ({
  id: card.id,
  cardNumber: card.cardNumber,
  expiryDate: card.expiryDate,
  ccv: card.ccv,
  isDeleted: card.isDeleted,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
});

export const syncService = {
  /**
   * 执行一次完整同步：先 Push 本地待同步操作，再 Pull 服务器最新数据。
   */
  async sync(): Promise<void> {
    if (syncing || !navigator.onLine) return;

    syncing = true;

    try {
      await this.push();
      await this.pull();
    } finally {
      syncing = false;
    }
  },

  /**
   * 将 IndexedDB Sync Queue 中的本地操作同步到服务器。
   */
  async push(): Promise<void> {
    const queue = await syncQueueRepository.getAll();

    for (const item of queue) {
      try {
        await this.process(item);
      } catch (error) {
        console.error('Card sync failed:', item, error);
        break;
      }
    }
  },

  /**
   * 将服务器最新数据合并到 IndexedDB。
   *
   * 有本地 Pending Queue 的 Card 以本地数据为准，
   * 避免 Pull 时覆盖尚未同步完成的离线新增、修改或删除。
   */
  async pull(): Promise<void> {
    const [serverCards, localCards, queue] = await Promise.all([
      cardService.getCards(),
      cardRepository.getAll(),
      syncQueueRepository.getAll(),
    ]);

    const pendingIds = new Set(
      queue
        .filter(item => item.entity === 'card')
        .map(item => item.entityId),
    );

    const serverIds = new Set(serverCards.map(card => card.id));

    const cardsToPut = serverCards
      .filter(card => !pendingIds.has(card.id))
      .map(toDbCard);

    if (cardsToPut.length > 0) {
      await cardRepository.bulkPut(cardsToPut);
    }

    const cardsToRemove = localCards.filter(
      card => !serverIds.has(card.id) && !pendingIds.has(card.id),
    );

    for (const card of cardsToRemove) {
      await cardRepository.remove(card.id);
    }
  },

  /**
   * 处理单条 Sync Queue 操作。
   */
  async process(item: SyncQueueItem): Promise<void> {
    if (item.entity !== 'card') return;

    if (item.operation === 'create') {
      if (!item.payload) {
        throw new Error('Create sync payload missing.');
      }

      const originalQueue = {
        ...item,
        payload: { ...item.payload },
      };

      const response = await cardService.createCard({
        id: item.entityId,
        cardNumber: item.payload.cardNumber,
        expiryDate: item.payload.expiryDate,
        ccv: item.payload.ccv,
        isDeleted: item.payload.isDeleted,
      });

      const currentQueue = item.id !== undefined
        ? await syncQueueRepository.getById(item.id)
        : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue)) {
        console.info('Card was modified during Create sync. Keep the latest local version and Queue.');
        return;
      }

      await cardRepository.bulkPut([toDbCard(response)]);

      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id);
      }

      return;
    }

    if (item.operation === 'update') {
      if (!item.payload) {
        throw new Error('Update sync payload missing.');
      }

      const originalQueue = {
        ...item,
        payload: { ...item.payload },
      };

      const response = await cardService.updateCard(item.entityId, {
        cardNumber: item.payload.cardNumber,
        expiryDate: item.payload.expiryDate,
        ccv: item.payload.ccv,
        isDeleted: item.payload.isDeleted,
      });

      const currentQueue = item.id !== undefined
        ? await syncQueueRepository.getById(item.id)
        : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue)) {
        console.info('Card was modified during Update sync. Keep the latest local version and Queue.');
        return;
      }

      await cardRepository.bulkPut([toDbCard(response)]);

      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id);
      }

      return;
    }

    if (item.operation === 'delete') {
      const originalQueue = { ...item };

      await cardService.deleteCard(item.entityId);

      const currentQueue = item.id !== undefined
        ? await syncQueueRepository.getById(item.id)
        : undefined;

      if (!isQueueUnchanged(originalQueue, currentQueue)) {
        console.info('Card was modified during Delete sync. Keep the latest Queue.');
        return;
      }

      if (item.id !== undefined) {
        await syncQueueRepository.remove(item.id);
      }
    }
  },
};