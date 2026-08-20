import {
  create,
} from 'zustand';

import {
  cardService,
} from '@/api/cardService';

import type {
  CardQuery,
  CardResponse,
  CreateCardRequest,
  UpdateCardRequest,
} from '@/api/types';

import {
  cardRepository,
} from '@/db/repositories/CardRepository';

import {
  syncQueueRepository,
} from '@/db/repositories/SyncQueueRepository';

import type {
  DbCard,
} from '@/db/models';

import {
  syncService,
} from '@/api/SyncService';

// ============================================================
// CardResponse -> DbCard
// ============================================================

function toDbCard( card: CardResponse): DbCard {
  return {
    id: card.id,

    cardNumber:
      card.cardNumber,

    expiryDate:
      card.expiryDate,

    ccv:
      card.ccv,

    isDeleted:
      card.isDeleted,

    createdAt:
      card.createdAt,

    updatedAt:
      card.updatedAt,
  };
}

// ============================================================
// DbCard -> CardResponse
// ============================================================
//
// formattedInfo 在这里动态生成。
// IndexedDB 不保存 formattedInfo。
// ============================================================

function toCardResponse(
  card: DbCard,
): CardResponse {

  return {
    id: card.id,

    cardNumber:
      card.cardNumber,

    expiryDate:
      card.expiryDate,

    ccv:
      card.ccv,

    // 修改：
    // 与后端 CardResponse.From() 保持一致。
    formattedInfo:
      `Card Number: ${card.cardNumber}\n` +
      `Expires: ${card.expiryDate}\n` +
      `CCV: ${card.ccv}`,

    isDeleted:
      card.isDeleted,

    createdAt:
      card.createdAt,

    updatedAt:
      card.updatedAt,
  };
}

// ============================================================
// Store
// ============================================================

interface CardStore {

  cards: CardResponse[];

  isLoading: boolean;

  /**
   * 首次初始化。
   */
  initialize: () => Promise<void>;

  /**
   * 本地查询。
   */
  queryCards: (
    query?: CardQuery,
  ) => Promise<void>;

  /**
   * 新增。
   */
  addCard: (
    card: CreateCardRequest,
  ) => Promise<void>;

  /**
   * 修改。
   */
  updateCard: (
    id: string,
    changes: UpdateCardRequest,
  ) => Promise<void>;

  /**
   * 删除。
   */
  deleteCard: (
    id: string,
  ) => Promise<void>;
}

export const useCardStore =
  create<CardStore>(
    (set, get) => ({

      cards: [],

      isLoading: false,

      // ======================================================
      // 初始化
      // ======================================================

      initialize: async () => {

        set({
          isLoading: true,
        });

        try {

          // ==================================================
          // 关键修改：
          //
          // 只判断 IndexedDB 是否为空。
          //
          // 不调用 getAll()。
          // 不做重复查询。
          // ==================================================
          const isEmpty =
            await cardRepository
              .isEmpty();

          if (isEmpty) {

            // ================================================
            // 只有第一次本地数据库为空：
            //
            // API → IndexedDB
            // ================================================
            const remoteCards =
              await cardService
                .getCards();

            await cardRepository
              .bulkPut(
                remoteCards.map(
                  toDbCard,
                ),
              );
          }

          // ==================================================
          // 初始化结束后：
          // 只读取一次 IndexedDB。
          // ==================================================
          const cards =
            await cardRepository
              .getAll();

          set({
            cards:
              cards.map(
                toCardResponse,
              ),
          });

          // ==================================================
          // 初始化完成后：
          // 如果有网络，尝试执行已有 Queue。
          //
          // 不阻塞 UI。
          // ==================================================
          void syncService.sync();

        } catch (error) {

          console.error(
            'Card initialization failed:',
            error,
          );

          // ==================================================
          // 修改：
          // API 失败时，如果 IndexedDB 有数据，
          // 仍然允许离线使用。
          // ==================================================
          const cards =
            await cardRepository
              .getAll();

          set({
            cards:
              cards.map(
                toCardResponse,
              ),
          });

        } finally {

          set({
            isLoading: false,
          });
        }
      },

      // ======================================================
      // 本地查询
      // ======================================================

      queryCards: async (
        query,
      ) => {

        const cards =
          await cardRepository
            .getAll(query);

        set({
          cards:
            cards.map(
              toCardResponse,
            ),
        });
      },

      // ======================================================
      // Local-First Create
      // ======================================================

      addCard: async (
        card,
      ) => {

        const now =
          new Date().toISOString();

        // ====================================================
        // 修改：
        // Local UUID。
        // ====================================================
        const id =
          crypto.randomUUID();

        const newCard: DbCard = {

          id,

          cardNumber:
            card.cardNumber,

          expiryDate:
            card.expiryDate,

          ccv:
            card.ccv,

          isDeleted:
            card.isDeleted ??
            false,

          createdAt:
            now,

          updatedAt:
            now,
        };

        // ====================================================
        // 第一步：
        // 写入本地数据库。
        // ====================================================
        await cardRepository.insert(
          newCard,
        );

        // ====================================================
        // 第二步：
        // 写入 Sync Queue。
        // ====================================================
        await syncQueueRepository.add({
          entity: 'card',

          entityId: id,

          operation: 'create',

          createdAt: now,

          payload: {
            cardNumber:
              newCard.cardNumber,

            expiryDate:
              newCard.expiryDate,

            ccv:
              newCard.ccv,

            isDeleted:
              newCard.isDeleted,
          },
        });

        // ====================================================
        // 第三步：
        // 立即更新 UI。
        // ====================================================
        await get()
          .queryCards();

        // ====================================================
        // 第四步：
        // 在线情况下后台同步。
        //
        // 不等待同步完成。
        // ====================================================
        void syncService.sync();
      },

      // ======================================================
      // Local-First Update
      // ======================================================

      updateCard: async (
        id,
        changes,
      ) => {

        // ====================================================
        // 先修改 IndexedDB。
        // ====================================================
        await cardRepository.update(
          id,
          changes,
        );

        const updated =
          await cardRepository
            .getAll();

        // ====================================================
        // UI 立即更新。
        // ====================================================
        set({
          cards:
            updated.map(
              toCardResponse,
            ),
        });

        // ====================================================
        // 添加同步任务。
        // ====================================================
        await syncQueueRepository.upsertCardUpdate({
          entity: 'card',

          entityId: id,

          operation: 'update',

          createdAt:
            new Date().toISOString(),

          payload: {
            cardNumber:
              changes.cardNumber,

            expiryDate:
              changes.expiryDate,

            ccv:
              changes.ccv,

            isDeleted:
              changes.isDeleted,
          },
        });

        // ====================================================
        // 在线后台同步。
        // ====================================================
        void syncService.sync();
      },

      // ======================================================
      // Local-First Delete
      // ======================================================

      deleteCard: async (
        id,
      ) => {

        // ====================================================
        // IndexedDB Soft Delete。
        // ====================================================
        await cardRepository.delete(
          id,
        );

        // ====================================================
        // UI 立即隐藏。
        // ====================================================
        set(state => ({
          cards:
            state.cards.filter(
              card =>
                card.id !== id,
            ),
        }));

        // ====================================================
        // Sync Queue。
        // ====================================================
        await syncQueueRepository.add({
          entity: 'card',

          entityId: id,

          operation: 'delete',

          createdAt:
            new Date().toISOString(),
        });

        // ====================================================
        // 在线后台同步。
        // ====================================================
        void syncService.sync();
      },
    }),
  );