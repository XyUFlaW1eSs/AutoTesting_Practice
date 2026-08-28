import { create } from 'zustand';
import { cardService } from '@/api/cardService';
import { syncService } from '@/api/SyncService';
import type { CardQuery, CardResponse, CreateCardRequest, UpdateCardRequest, } from '@/api/types';
import { cardRepository } from '@/db/repositories/CardRepository';
import { syncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { DbCard } from '@/db/models';

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

  initialize: () => Promise<void>;
  fetchCards: (query?: CardQuery,) => Promise<void>;
  addCard: (card: CreateCardRequest,) => Promise<void>;
  updateCard: (id: string, changes: UpdateCardRequest,) => Promise<void>;
  deleteCard: (id: string,) => Promise<void>;
  sync: () => Promise<void>;
}


export const useCardStore = create<CardStore>((set, get) => ({

  cards: [],
  isLoading: false,
  initialize: async () => {
    set({ isLoading: true, });
    try {
      const isEmpty = await cardRepository.isEmpty();

      if (isEmpty) {
        try {
          const remoteCards = await cardService.getCards();
          await cardRepository.bulkPut(remoteCards.map(toDbCard),);

        } catch (error) {
          console.error('Failed to initialize cards from server:', error,);
        }
      }

      const cards = await cardRepository.getAll();
      set({ cards: cards.map(toCardResponse), });

    } catch (error) {
      console.error('Card initialization failed:', error,);
    } finally {
      set({ isLoading: false, });
    }
  },

  fetchCards: async (query) => {

    const cards = await cardRepository.getAll(query);
    set({ cards: cards.map(toCardResponse) });
  },

  addCard: async (card: CreateCardRequest) => {

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newCard: DbCard = {
      id,
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      ccv: card.ccv,
      isDeleted: card.isDeleted ?? false,
      createdAt: now,
      updatedAt: null,
    };

    await cardRepository.insert(newCard);

    await syncQueueRepository.add({
      entity: 'card',
      entityId: id,
      operation: 'create',
      createdAt: now,
      payload: newCard,
    });

    await get().sync();
  },

  updateCard: async (id: string, changes: UpdateCardRequest) => {
    const currentCards = await cardRepository.getAll();
    const currentCard = currentCards.find(card => card.id === id);

    if (!currentCard) {
      throw new Error(`Card not found`);
    }

    const updatedAt = new Date().toISOString();

    await cardRepository.update(id, {
      ...changes,
      updatedAt
    });

    const updateCard: DbCard = {
      ...currentCard,
      ...changes,
      updatedAt
    }

    await syncQueueRepository.upsertCardUpdate({
      entity: 'card',
      entityId: id,
      operation: 'update',
      createdAt: new Date().toISOString(),
      payload: updateCard,
    });

    await get().sync();
  },

  deleteCard: async (id) => {
    await cardRepository.delete(id);
    await syncQueueRepository.upsertCardDelete(id);

    await get().sync();
  },

  sync: async () => {
    await syncService.sync();
    await get().fetchCards();
  },
})
);