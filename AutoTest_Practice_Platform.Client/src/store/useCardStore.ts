import { create } from 'zustand';

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


// ============================================================
// CardResponse -> DbCard
// ============================================================
//
// IndexedDB 不保存 formattedInfo。
// formattedInfo 只在 CardResponse 层动态生成。
// ============================================================

function toDbCard(
  card: CardResponse,
): DbCard {
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
// 修改原因：
// formattedInfo 是展示/Copy 用的数据，不需要持久化到 IndexedDB。
// 每次从 IndexedDB 读取后重新生成即可。
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
   * 初始化本地数据库。
   *
   * IndexedDB 有数据：
   *     IndexedDB -> UI
   *
   * IndexedDB 为空：
   *     API -> IndexedDB -> UI
   */
  initialize: () => Promise<void>;

  /**
   * 查询本地 IndexedDB。
   *
   * 不访问服务器。
   */
  fetchCards: (
    query?: CardQuery,
  ) => Promise<void>;

  /**
   * Local-First 新增。
   */
  addCard: (
    card: CreateCardRequest,
  ) => Promise<void>;

  /**
   * Local-First 修改。
   */
  updateCard: (
    id: string,
    changes: UpdateCardRequest,
  ) => Promise<void>;

  /**
   * Local-First 软删除。
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
      //
      // 修改原因：
      //
      // 初始化只发生一次：
      //
      // IndexedDB 有数据
      //     ↓
      // IndexedDB
      //
      // IndexedDB 为空
      //     ↓
      // API
      //     ↓
      // IndexedDB
      //
      // 不在这里执行 SyncService。
      // 同步职责由 SyncService 自己管理。
      // ======================================================

      initialize: async () => {

        set({
          isLoading: true,
        });

        try {

          const isEmpty =
            await cardRepository.isEmpty();


          if (isEmpty) {

            try {

              // ==================================================
              // 第一次初始化：
              //
              // Server -> IndexedDB
              // ==================================================

              const remoteCards =
                await cardService.getCards();

              await cardRepository.bulkPut(
                remoteCards.map(
                  toDbCard,
                ),
              );

            } catch (error) {

              // ==================================================
              // 修改原因：
              //
              // API 不可用时不能阻止 Local-First 应用启动。
              //
              // 如果本地确实为空，则没有数据可以展示。
              // ==================================================

              console.error(
                'Failed to initialize cards from server:',
                error,
              );
            }
          }


          // ====================================================
          // 初始化完成：
          // 只从 IndexedDB 获取一次。
          // ====================================================

          const cards =
            await cardRepository.getAll();

          set({
            cards:
              cards.map(
                toCardResponse,
              ),
          });

        } catch (error) {

          console.error(
            'Card initialization failed:',
            error,
          );

        } finally {

          set({
            isLoading: false,
          });
        }
      },


      // ======================================================
      // 本地查询
      // ======================================================
      //
      // 修改原因：
      //
      // fetchCards 的职责只有一个：
      //
      // IndexedDB -> Store
      //
      // 绝对不请求 API。
      // ======================================================

      fetchCards: async (
        query,
      ) => {

        const cards =
          await cardRepository.getAll(
            query,
          );

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
        // Local UUID。
        //
        // 这个 ID 只用于本地 Queue 关联。
        //
        // 后端 Create API 不使用这个 ID。
        // ====================================================

        const localId =
          crypto.randomUUID();


        const newCard: DbCard = {

          id:
            localId,

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
        // IndexedDB
        // ====================================================

        await cardRepository.insert(
          newCard,
        );


        // ====================================================
        // 第二步：
        // 创建 Sync Queue。
        //
        // 注意：
        // 不直接调用 API。
        // ====================================================

        await syncQueueRepository.add({

          entity:
            'card',

          entityId:
            localId,

          operation:
            'create',

          createdAt:
            now,

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
        // 立即刷新 UI。
        // ====================================================

        await get().fetchCards();
      },


      // ======================================================
      // Local-First Update
      // ======================================================

      updateCard: async (
        id,
        changes,
      ) => {

        // ====================================================
        // 第一步：
        // 修改 IndexedDB
        // ====================================================

        await cardRepository.update(
          id,
          changes,
        );


        // ====================================================
        // 第二步：
        // 更新/合并 Queue
        // ====================================================

        await syncQueueRepository.upsertCardUpdate({

          entity:
            'card',

          entityId:
            id,

          operation:
            'update',

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
        // 第三步：
        // IndexedDB -> UI
        // ====================================================

        await get().fetchCards();
      },


      // ======================================================
      // Local-First Delete
      // ======================================================

      deleteCard: async (
        id,
      ) => {

        // ====================================================
        // 第一步：
        // IndexedDB Soft Delete
        // ====================================================

        await cardRepository.delete(
          id,
        );


        // ====================================================
        // 第二步：
        // Queue
        // ====================================================

        await syncQueueRepository.upsertCardDelete(
          id,
        );

        // ====================================================
        // 第三步：
        // 当前 UI 直接隐藏。
        // ====================================================

        set(state => ({

          cards:
            state.cards.filter(
              card =>
                card.id !== id,
            ),

        }));
      },
    }),
  );