import { cardService } from '@/api/cardService';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { DbCard } from '@/db/models';
import type { SyncQueueItem } from '@/db/syncModels';
import type { CardResponse, CreateCardRequest, UpdateCardRequest } from '@/api/types';

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
   * 执行待同步 Queue，并在成功同步后使用服务器数据与本地未同步数据合并。
   */
  async sync(): Promise<void> {
    const queue = await syncQueueRepository.getAll();

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        if(item.id != undefined){
          await syncQueueRepository.remove(item.id)
        }
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
      }
    }

    await this.refreshServerData();
  },

  /**
   * 根据 Queue 操作类型调用对应的 Card API。
   */
  async processQueueItem(item: SyncQueueItem): Promise<void> {
    if (item.operation === 'create') {
      const payload: CreateCardRequest = {
        id: item.entityId,
        cardNumber: item.payload!.cardNumber,
        expiryDate: item.payload!.expiryDate,
        ccv: item.payload!.ccv,
        isDeleted: item.payload!.isDeleted,
        createdAt: item.payload!.createdAt,
      };
      await cardService.createCard(payload);
      return;
    }

    if (item.operation === 'update') {
      const payload: UpdateCardRequest = {
        cardNumber: item.payload!.cardNumber,
        expiryDate: item.payload!.expiryDate,
        ccv: item.payload!.ccv,
        isDeleted: item.payload!.isDeleted,
        createdAt: item.payload!.createdAt,
        updatedAt: item.payload!.updatedAt,
      };
      await cardService.updateCard(item.entityId, payload);
      return;
    }

    if (item.operation === 'delete') {
      await cardService.deleteCard(item.entityId);
      return;
    }

    throw new Error(`Unsupported sync operation: ${item.operation}`);
  },

  /**
   * 获取服务器最新数据并合并到 IndexedDB，保留仍存在同步 Queue 的本地数据。
   */
  async refreshServerData(): Promise<void> {
    const remoteCards = await cardService.getCards();
    const queue = await syncQueueRepository.getAll();
    const pendingCardIds = new Set(queue.filter(item => item.entity === 'card').map(item => item.entityId));
    const localCards = await cardRepository.getAll();

    const mergedCards = new Map(localCards.map(card => [card.id, card]));

    for (const remoteCard of remoteCards) {
      if (!pendingCardIds.has(remoteCard.id)) {
        mergedCards.set(remoteCard.id, toDbCard(remoteCard));
      }
    }

    await cardRepository.bulkPut(Array.from(mergedCards.values()));
  },
};