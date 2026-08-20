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


// ============================================================
// SyncService
// ============================================================
//
// 职责：
//
// IndexedDB
//     ↓
// Sync Queue
//     ↓
// API
//     ↓
// IndexedDB
//
// Store 不负责调用 SyncService。
// SyncService 自己负责网络恢复后的同步。
// ============================================================

let syncing = false;


export const syncService = {

  // ==========================================================
  // 执行一次同步
  // ==========================================================

  async sync(): Promise<void> {

    // 防止多个同步任务并发执行。
    if (syncing) {
      return;
    }


    // 没有网络直接退出。
    if (!navigator.onLine) {
      return;
    }


    syncing = true;


    try {

      const queue =
        await syncQueueRepository.getAll();


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
          //
          // Queue 不删除。
          //
          // 下一次同步继续处理。
          // ==================================================

          console.error(
            'Card sync failed:',
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


  // ==========================================================
  // 处理单个 Queue
  // ==========================================================

  async process(
    item: SyncQueueItem,
  ): Promise<void> {

    if (
      item.entity !==
      'card'
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


      // ======================================================
      // 修改原因：
      //
      // 后端 Create API 自己生成 Guid。
      //
      // 因此不能把 Local UUID 当作 Server ID 传给后端。
      //
      // Local UUID：
      //     只用于 IndexedDB / Queue
      //
      // Server UUID：
      //     由后端创建
      // ======================================================

      const response =
        await cardService.createCard({

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
      // 修改原因：
      //
      // Server 已经生成最终 ID。
      //
      // 删除本地 Local UUID，
      // 保存服务器返回的正式 Card。
      // ======================================================

      await cardRepository.deletePhysical(
        item.entityId,
      );


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
      // Queue 完成
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


      // ======================================================
      // Server 返回最新数据。
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

        await syncQueueRepository.remove(
          item.id,
        );
      }
    }
  },
};