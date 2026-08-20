import { cardService } from '@/api/cardService';

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

  // ==========================================================
  // 执行同步
  // ==========================================================

  async sync(): Promise<void> {

    if (syncing) {
      return;
    }

    if (!navigator.onLine) {
      return;
    }


    syncing = true;

    try {

      const queue =
        await syncQueueRepository.getAll();


      for (const item of queue) {

        try {

          await this.process(item);

        } catch (error) {

          // ==================================================
          // 当前任务失败：
          //
          // 不删除 Queue。
          //
          // 下一次网络恢复时继续。
          // ==================================================

          console.error(
            'Card sync failed:',
            item,
            error,
          );

          // 当前任务失败后停止后续任务。
          // 保证 Queue 顺序。
          break;
        }
      }

    } finally {

      syncing = false;
    }
  },


  // ==========================================================
  // 单个任务
  // ==========================================================

  async process(
    item: SyncQueueItem,
  ): Promise<void> {

    if (
      item.entity !== 'card'
    ) {
      return;
    }


    // ========================================================
    // CREATE
    // ========================================================

    if (
      item.operation === 'create'
    ) {

      if (!item.payload) {

        throw new Error(
          'Create sync payload missing.',
        );
      }


      // ======================================================
      // 重要修改：
      //
      // 当前后端支持 CreateCardRequest.Id。
      //
      // 所以 Local UUID 直接作为 Server Guid。
      //
      // Local ID === Server ID
      // ======================================================

      const response =
        await cardService.createCard({

          id:
            item.entityId,

          cardNumber:
            item.payload.cardNumber,

          expiryDate:
            item.payload.expiryDate,

          ccv:
            item.payload.ccv,

          isDeleted:
            item.payload.isDeleted,
        });


      // ======================================================
      // Server 返回的数据作为最终本地数据。
      //
      // ID 必须保持一致。
      // ======================================================

      await cardRepository.bulkPut([{

        id:
          response.id,

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

      }]);


      // ======================================================
      // Queue 完成。
      // ======================================================

      if (
        item.id !== undefined
      ) {

        await syncQueueRepository.remove(
          item.id,
        );
      }


      return;
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (
      item.operation === 'update'
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


      // ======================================================
      // Server 返回值同步回 IndexedDB。
      // ======================================================

      await cardRepository.bulkPut([{

        id:
          response.id,

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

      }]);


      if (
        item.id !== undefined
      ) {

        await syncQueueRepository.remove(
          item.id,
        );
      }


      return;
    }


    // ========================================================
    // DELETE
    // ========================================================

    if (
      item.operation === 'delete'
    ) {

      await cardService.deleteCard(
        item.entityId,
      );


      if (
        item.id !== undefined
      ) {

        await syncQueueRepository.remove(
          item.id,
        );
      }
    }
  },
};