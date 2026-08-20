import {
  cardService,
} from '@/api/cardService';

import {
  cardRepository,
} from '@/db/repositories/CardRepository';

import {
  syncQueueRepository,
} from '@/db/repositories/SyncQueueRepository';

import type {
  SyncQueueItem,
} from '@/db/syncModels';

let syncing = false;

export const syncService = {

  /**
   * 执行一次同步。
   *
   * 防止多个 sync 同时运行。
   */
  async sync(): Promise<void> {

    if (syncing) {
      return;
    }

    // ========================================================
    // 修改：
    // 没网络时直接退出。
    //
    // 不产生任何 API 请求。
    // ========================================================
    if (!navigator.onLine) {
      return;
    }

    syncing = true;

    try {

      const queue =
        await syncQueueRepository
          .getAll();

      for (
        const item of queue
      ) {

        try {

          await this.process(
            item,
          );

        } catch (error) {

          // ==================================================
          // 单个任务失败：
          // 停止本轮同步。
          //
          // Queue 保留，
          // 下一次网络恢复继续。
          // ==================================================
          console.error(
            'Sync failed:',
            item,
            error,
          );

          break;
        }
      }

    } finally {
      syncing = false;
    }
  },

  /**
   * 处理单个同步任务。
   */
  async process(
    item: SyncQueueItem,
  ): Promise<void> {

    if (
      item.entity !== 'card'
    ) {
      return;
    }

    // ========================================================
    // Create
    // ========================================================
    if (
      item.operation ===
      'create'
    ) {

      if (!item.payload) {
        throw new Error(
          'Create sync payload missing.',
        );
      }

      const response =
        await cardService
          .createCard({
            ...item.payload,

            // ==================================================
            // 修改：
            // 将 Local UUID 直接传给服务器。
            //
            // 后端 Create 会使用这个 UUID。
            // ==================================================
            id: item.entityId,
          });

      // ======================================================
      // Server 返回最终数据。
      //
      // 用 Server Response 覆盖本地数据。
      // ======================================================
      await cardRepository
        .bulkPut([
          {
            id: response.id,
            cardNumber:
              response.cardNumber,
            expiryDate:
              response.expiryDate,
            ccv:
              response.ccv,
            isDeleted:
              response.isDeleted,
            createdAt:
              response.createdAt,
            updatedAt:
              response.updatedAt,
          },
        ]);

      // ======================================================
      // 如果服务器 ID 与 Local ID 不同，
      // 替换本地记录。
      // ======================================================
      if (
        response.id !==
        item.entityId
      ) {

        await cardRepository
          .replaceId(
            item.entityId,
            response.id,
          );

        await syncQueueRepository
          .replaceEntityId(
            item.entityId,
            response.id,
          );
      }

      if (
        item.id !== undefined
      ) {
        await syncQueueRepository
          .remove(item.id);
      }

      return;
    }

    // ========================================================
    // Update
    // ========================================================
    if (
      item.operation ===
      'update'
    ) {

      if (!item.payload) {
        throw new Error(
          'Update sync payload missing.',
        );
      }

      const response =
        await cardService.updateCard(
          item.entityId,
          {
            cardNumber:
              item.payload.cardNumber,
            expiryDate:
              item.payload.expiryDate,
            ccv:
              item.payload.ccv,
            isDeleted:
              item.payload.isDeleted,
          },
        );

      await cardRepository.bulkPut([
        {
          id: response.id,
          cardNumber:
            response.cardNumber,
          expiryDate:
            response.expiryDate,
          ccv:
            response.ccv,
          isDeleted:
            response.isDeleted,
          createdAt:
            response.createdAt,
          updatedAt:
            response.updatedAt,
        },
      ]);

      if (
        item.id !== undefined
      ) {
        await syncQueueRepository
          .remove(item.id);
      }

      return;
    }

    // ========================================================
    // Delete
    // ========================================================
    if (
      item.operation ===
      'delete'
    ) {

      await cardService.deleteCard(
        item.entityId,
      );

      if (
        item.id !== undefined
      ) {
        await syncQueueRepository
          .remove(item.id);
      }
    }
  },
};