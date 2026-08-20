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


// ============================================================
// 判断 Queue 在同步过程中是否发生变化
//
// 注意：
//
// 这里只比较会影响同步内容的字段。
// id 本身不会变化。
// ============================================================

const isQueueUnchanged = (
  original: SyncQueueItem,
  current: SyncQueueItem | undefined,
): boolean => {

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

          // 当前任务失败后停止后续任务，
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
      // P0：
      //
      // 保存当前 Queue 快照。
      //
      // API 请求期间用户可能再次修改这张 Card。
      // ======================================================

      const originalQueue = {
        ...item,
        payload: item.payload
          ? { ...item.payload }
          : undefined,
      };


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
      // P0：
      //
      // API 返回后重新检查 Queue。
      // ======================================================

      const currentQueue =
        item.id !== undefined
          ? await syncQueueRepository.getById(
              item.id,
            )
          : undefined;


      if (
        !isQueueUnchanged(
          originalQueue,
          currentQueue,
        )
      ) {

        // ====================================================
        // 用户在 API 请求期间修改了 Card。
        //
        // 旧 API Response 不能覆盖本地最新数据。
        //
        // Server 当前保存的是旧版本，
        // 新版本仍然留在 Queue 中。
        //
        // 下一次 sync 会继续处理。
        // ====================================================

        console.info(
          'Card was modified during Create sync. ' +
          'Keep the latest local version and Queue.',
        );

        return;
      }


      // ======================================================
      // Queue 没有变化：
      //
      // Server Response 可以安全写入 IndexedDB。
      // ======================================================

      await cardRepository.bulkPut([{

        id:
          item.entityId,

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


      // ======================================================
      // P0：
      // 保存 Queue 快照。
      // ======================================================

      const originalQueue = {
        ...item,
        payload: item.payload
          ? { ...item.payload }
          : undefined,
      };


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
      // P0：
      // API 返回后重新检查 Queue。
      // ======================================================

      const currentQueue =
        item.id !== undefined
          ? await syncQueueRepository.getById(
              item.id,
            )
          : undefined;


      if (
        !isQueueUnchanged(
          originalQueue,
          currentQueue,
        )
      ) {

        // ====================================================
        // 用户已经产生新的修改。
        //
        // 不使用旧 Response 覆盖 IndexedDB。
        // 新 Queue 会在下一轮继续同步。
        // ====================================================

        console.info(
          'Card was modified during Update sync. ' +
          'Keep the latest local version and Queue.',
        );

        return;
      }


      // ======================================================
      // Queue 没有变化：
      //
      // Server Response 可以安全写入 IndexedDB。
      // ======================================================

      await cardRepository.bulkPut([{

        id:
          item.entityId,

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

      // ======================================================
      // P0：
      //
      // 删除请求期间如果用户又产生了新的操作，
      // Queue 会发生变化。
      // ======================================================

      const originalQueue = {
        ...item,
      };


      await cardService.deleteCard(
        item.entityId,
      );


      const currentQueue =
        item.id !== undefined
          ? await syncQueueRepository.getById(
              item.id,
            )
          : undefined;


      if (
        !isQueueUnchanged(
          originalQueue,
          currentQueue,
        )
      ) {

        // ====================================================
        // Queue 已经发生变化。
        //
        // 不删除新的 Queue。
        // ====================================================

        console.info(
          'Card was modified during Delete sync. ' +
          'Keep the latest Queue.',
        );

        return;
      }


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