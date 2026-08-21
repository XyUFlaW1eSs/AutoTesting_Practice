import { cardService } from '@/api/cardService';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { DbCard } from '@/db/models';
import type { CardResponse } from '@/api/types';

let syncing = false;

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
   * 执行一次完整同步：比较本地与服务器数据，完成必要的服务器写入，
   * 最后重新拉取服务器有效数据并重建 IndexedDB。
   */
  async sync(): Promise<void> {
    if (syncing || !navigator.onLine) return;

    syncing = true;

    try {
      const localCards = await cardRepository.getAll();
      const queue = await syncQueueRepository.getAll();
      const serverCards = await cardService.getCards({ isDeleted: false });

      await this.reconcile(localCards, serverCards, queue);
      await this.refreshLocalData();
    } finally {
      syncing = false;
    }
  },

  /**
   * 比较本地与服务器数据，并将本地发生过的变更同步到服务器。
   */
  async reconcile(
    localCards: DbCard[],
    serverCards: CardResponse[],
    queue: Awaited<ReturnType<typeof syncQueueRepository.getAll>>,
  ): Promise<void> {
    const localMap = new Map(localCards.map(card => [card.id, card]));
    const serverMap = new Map(serverCards.map(card => [card.id, card]));
    const pendingIds = new Set(
      queue
        .filter(item => item.entity === 'card')
        .map(item => item.entityId),
    );

    for (const localCard of localCards) {
      const serverCard = serverMap.get(localCard.id);
      const isPending = pendingIds.has(localCard.id);

      if (!serverCard) {
        if (localCard.isDeleted) {
          continue;
        }

        await cardService.createCard({
          id: localCard.id,
          cardNumber: localCard.cardNumber,
          expiryDate: localCard.expiryDate,
          ccv: localCard.ccv,
          isDeleted: false,
        });

        continue;
      }

      if (!isPending) {
        continue;
      }

      if (localCard.isDeleted) {
        await cardService.deleteCard(localCard.id);
        continue;
      }

      await cardService.updateCard(localCard.id, {
        cardNumber: localCard.cardNumber,
        expiryDate: localCard.expiryDate,
        ccv: localCard.ccv,
        isDeleted: false,
      });
    }

    for (const serverCard of serverCards) {
      if (!localMap.has(serverCard.id)) {
        await cardRepository.bulkPut([toDbCard(serverCard)]);
      }
    }
  },

  /**
   * 重新读取服务器有效数据，并让 IndexedDB 与服务器最终状态保持一致。
   */
  async refreshLocalData(): Promise<void> {
    const serverCards = await cardService.getCards({ isDeleted: false });

    const localCards = await cardRepository.getAll();
    const serverIds = new Set(serverCards.map(card => card.id));

    for (const localCard of localCards) {
      if (!serverIds.has(localCard.id)) {
        await cardRepository.remove(localCard.id);
      }
    }

    if (serverCards.length > 0) {
      await cardRepository.bulkPut(serverCards.map(toDbCard));
    }

    const queue = await syncQueueRepository.getAll();

    for (const item of queue) {
      if (item.entity === 'card' && item.id !== undefined) {
        await syncQueueRepository.remove(item.id);
      }
    }
  },
};