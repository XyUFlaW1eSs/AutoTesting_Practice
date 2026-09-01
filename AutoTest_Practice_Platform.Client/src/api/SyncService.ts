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

let syncPromise: Promise<void> | null = null;

export const syncService = {
  /**
   * 执行单实例同步，重复调用时复用当前正在执行的同步任务。
   */
  async sync(): Promise<void> {
    if (syncPromise) {
      return syncPromise;
    }

    syncPromise = this.executeSync();

    try {
      await syncPromise;
    } finally {
      syncPromise = null;
    }
  },

  /**
   * 执行待同步 Queue，并在成功同步后使用服务器数据与本地未同步数据合并。
   */
  async executeSync(): Promise<void> {
    const queue = await syncQueueRepository.getAll();

    for (const item of queue) {
      try {
        await this.processQueueItem(item);

        if (item.id !== undefined) {
          await syncQueueRepository.remove(item.id);
        }
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
      }
    }

    await this.refreshServerData();
  },

  /**
   * 根据 Queue 操作类型调用对应的 Card API，DELETE 目标不存在时视为操作已经达到最终状态。
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
      try {
        await cardService.deleteCard(item.entityId);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return;
        }

        throw error;
      }

      return;
    }

    throw new Error(`Unsupported sync operation: ${item.operation}`);
  },

  /**
   * 获取服务器最新数据，与仍待同步的本地数据合并，并清理已经不存在于服务器且没有待同步任务的本地数据。
   */
  async refreshServerData(): Promise<void> {
    const remoteCards = await cardService.getCards();
    const queue = await syncQueueRepository.getAll();
    const localCards = await cardRepository.getAll();

    const pendingCardIds = new Set(
      queue
        .filter(item => item.entity === 'card')
        .map(item => item.entityId)
    );

    const remoteCardIds = new Set(remoteCards.map(card => card.id));

    const cardsToDelete = localCards
      .filter(card => !remoteCardIds.has(card.id) && !pendingCardIds.has(card.id))
      .map(card => card.id);

    await cardRepository.bulkDelete(cardsToDelete);

    const cardsToPut = remoteCards
      .filter(card => !pendingCardIds.has(card.id))
      .map(toDbCard);

    await cardRepository.bulkPut(cardsToPut);
  },
};