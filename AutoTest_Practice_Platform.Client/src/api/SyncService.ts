import { cardService } from '@/api/cardService';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { DbCard, SyncQueueItem } from '@/db/models';
import type { CardResponse } from '@/api/types';

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
   * 执行所有待同步 Queue。
   * 单条 Queue 同步成功后立即删除，失败则保留并继续处理其他 Queue。
   * 同步完成后使用服务器最新数据更新 IndexedDB，但不会清空本地未同步数据。
   */
  async sync(): Promise<void> {
    const queue = await syncQueueRepository.getAll();

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        await syncQueueRepository.remove(item.id)
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);
      }
    }

    await this.refreshLocalData();
  },

  /**
   * 根据 Queue 操作类型调用对应的 Card API。
   */
  async processQueueItem(item: SyncQueueItem): Promise<void> {
    if (item.operation === 'create') {
      await cardService.createCard(item.payload);
      return;
    }

    if (item.operation === 'update') {
      await cardService.updateCard(item.entityId, item.payload);
      return;
    }

    if (item.operation === 'delete') {
      await cardService.deleteCard(item.entityId);
      return;
    }

    throw new Error(`Unsupported sync operation: ${item.operation}`);
  },

  /**
   * 重新读取服务器有效数据，并让 IndexedDB 与服务器最终状态保持一致。
   */
  async refreshServerData(): Promise<void> {
    const remoteCards = await cardService.getCards();

    if (remoteCards.length === 0) {
      return;
    }

    await cardRepository.bulkPut(remoteCards.map(toDbCard));
  },
};