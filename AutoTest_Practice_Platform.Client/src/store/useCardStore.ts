import { create } from 'zustand';

import { cardService } from '@/api/cardService';

import type {
  CardQuery,
  CardResponse,
  CreateCardRequest,
  UpdateCardRequest,
} from '@/api/types';

import { cardRepository } from '@/db/repositories/CardRepository';

import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';

import type { DbCard } from '@/db/models';


// ============================================================
// CardResponse -> DbCard
// ============================================================
//
// IndexedDB 不保存 formattedInfo。
// formattedInfo 只是 UI / Copy 使用的数据。
// ============================================================

function toDbCard(card: CardResponse): DbCard {
  return {
    id: card.id,
    cardNumber: card.cardNumber,
    expiryDate: card.expiryDate,
    ccv: card.ccv,
    isDeleted: card.isDeleted,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}


// ============================================================
// DbCard -> CardResponse
// ============================================================
//
// formattedInfo 不进入 IndexedDB。
// 从 IndexedDB 读取后动态生成。
// ============================================================

function toCardResponse(card: DbCard): CardResponse {
  return {
    id: card.id,
    cardNumber: card.cardNumber,
    expiryDate: card.expiryDate,
    ccv: card.ccv,

    formattedInfo:
      `Card Number: ${card.cardNumber}\n` +
      `Expires: ${card.expiryDate}\n` +
      `CCV: ${card.ccv}`,

    isDeleted: card.isDeleted,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}


interface CardStore {
  cards: CardResponse[];

  isLoading: boolean;

  /**
   * 首次初始化：
   *
   * IndexedDB 有数据
   *     ↓
   * IndexedDB → UI
   *
   * IndexedDB 为空
   *     ↓
   * API → IndexedDB → UI
   */
  initialize: () => Promise<void>;

  /**
   * 只查询 IndexedDB。
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


export const useCardStore = create<CardStore>(
  (set, get) => ({

    cards: [],

    isLoading: false,


    // ==========================================================
    // 初始化
    // ==========================================================
    //
    // 这是整个 Local-First 数据初始化的唯一入口。
    //
    // 注意：
    // 后续页面刷新不再请求 Card API。
    // ==========================================================

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
            // Server → IndexedDB
            // ==================================================

            const remoteCards =
              await cardService.getCards();

            await cardRepository.bulkPut(
              remoteCards.map(toDbCard),
            );

          } catch (error) {

            // ==================================================
            // API 不可用时：
            //
            // 不破坏 Local-First。
            //
            // 如果本地为空，则最终显示空列表。
            // ==================================================

            console.error(
              'Failed to initialize cards from server:',
              error,
            );
          }
        }


        // ======================================================
        // 初始化完成后只从 IndexedDB 读取。
        // ======================================================

        const cards =
          await cardRepository.getAll();

        set({
          cards:
            cards.map(toCardResponse),
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


    // ==========================================================
    // 本地查询
    // ==========================================================
    //
    // 修改原因：
    //
    // fetchCards 只做：
    //
    // IndexedDB → Zustand
    //
    // 不再执行任何 API 请求。
    // ==========================================================

    fetchCards: async (query) => {

      const cards =
        await cardRepository.getAll(query);

      set({
        cards:
          cards.map(toCardResponse),
      });
    },


    // ==========================================================
    // 新增
    // ==========================================================

    addCard: async (card) => {

      const now =
        new Date().toISOString();


      // ========================================================
      // 生成 UUID。
      //
      // 当前后端 Create API 支持客户端传入 Guid。
      //
      // 因此：
      //
      // Local ID === Server ID
      //
      // 不再需要 Local ID → Server ID 映射。
      // ========================================================

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
          card.isDeleted ?? false,

        createdAt:
          now,

        updatedAt:
          now,
      };


      // ========================================================
      // 第一步：
      // IndexedDB
      // ========================================================

      await cardRepository.insert(
        newCard,
      );


      // ========================================================
      // 第二步：
      // Sync Queue
      //
      // 注意：
      // 此处不直接访问服务器。
      // ========================================================

      await syncQueueRepository.add({

        entity:
          'card',

        entityId:
          id,

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


      // ========================================================
      // 第三步：
      // 立即刷新 UI。
      // ========================================================

      await get().fetchCards();
    },


    // ==========================================================
    // 修改
    // ==========================================================

    updateCard: async (id, changes,) => {

      // Phase 4：先从 IndexedDB 获取当前完整数据，
      // 再将本次修改合并进去，保证 Sync Queue 始终保存完整 Card 数据。
      const currentCards = await cardRepository.getAll();

      const currentCard = currentCards.find(card => card.id === id);

      if (!currentCard) {
        throw new Error(`Card not found`);
      }

      const updatedCard = {
        ...currentCard,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      // ========================================================
      // 第一步：
      // IndexedDB
      // ========================================================

      await cardRepository.update(id, {
        cardNumber: updatedCard.cardNumber,
        expiryDate: updatedCard.expiryDate,
        ccv: updatedCard.ccv,
        isDeleted: updatedCard.isDeleted,
        updatedAt: updatedCard.updatedAt,
      });

      // ========================================================
      // 第二步：
      // 合并 Sync Queue
      // ========================================================

      await syncQueueRepository.upsertCardUpdate({
        entity: 'card',
        entityId: id,
        operation: 'update',
        createdAt: updatedCard.updatedAt ?? new Date().toISOString(),
        payload: {
          cardNumber: updatedCard.cardNumber,
          expiryDate: updatedCard.expiryDate,
          ccv: updatedCard.ccv,
          isDeleted: updatedCard.isDeleted
        },
      });
      // ========================================================
      // 第三步：
      // IndexedDB → UI
      // ========================================================
      await get().fetchCards();
    },


    // ==========================================================
    // 删除
    // ==========================================================

    deleteCard: async (
      id,
    ) => {

      // ========================================================
      // 第一步：
      // IndexedDB Soft Delete
      // ========================================================

      await cardRepository.delete(
        id,
      );


      // ========================================================
      // 第二步：
      // 合并 Delete Queue
      // ========================================================

      await syncQueueRepository.upsertCardDelete(
        id,
      );


      // ========================================================
      // 第三步：
      // 当前列表立即隐藏。
      //
      // 注意：
      // IndexedDB 中的数据仍然存在。
      // ========================================================

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