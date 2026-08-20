import { create } from 'zustand';
import { cardService } from '@/api/cardService';
import type { CardQuery, CardResponse, CreateCardRequest, UpdateCardRequest } from '@/api/types';
import { cardRepository } from '../db/repositories/CardRepository';
import type { DbCard } from '../db/models';

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
  fetchCards: (query?: CardQuery) => Promise<void>;
  addCard: (card: CreateCardRequest) => Promise<void>;
  updateCard: (id: string, changes: UpdateCardRequest) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

export const useCardStore =
  create<CardStore>((set) => ({
    cards: [],
    isLoading: false,

    fetchCards: async (query) => {
      set({ isLoading: true });

      try {
        const localCards =
          await cardRepository.getAll(query);

        if (localCards.length > 0) {
          const cards = await cardRepository.getAll(query);
          set({
            cards: cards.map(toCardResponse),
            isLoading: false,
          });

          return;
        }

        const remoteCards =
          await cardService.getCards();

        await cardRepository.bulkPut(
          remoteCards.map(toDbCard),
        );

        const cards =
          await cardRepository.getAll(query);

        set({
          cards: cards.map(toCardResponse),
          isLoading: false,
        });
      } catch (error) {
        console.error(
          'Failed to fetch cards:',
          error,
        );

        set({
          isLoading: false,
        });

        throw error;
      }
    },

    addCard: async (card) => {
      const now =
        new Date().toISOString();

      const newCard: DbCard = {
        id: crypto.randomUUID(),

        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        ccv: card.ccv,

        isDeleted:
          card.isDeleted ?? false,

        createdAt: now
      };

      await cardRepository.insert(
        newCard,
      );

      set(state => ({
        cards: [
          ...state.cards,
          toCardResponse(newCard),
        ],
      }));
    },

    updateCard: async (
      id,
      changes,
    ) => {
      await cardRepository.update(
        id,
        changes,
      );

      const cards =
        await cardRepository.getAll();

      set({
        cards:
          cards.map(
            toCardResponse,
          ),
      });
    },

    deleteCard: async (id) => {
      await cardRepository.delete(id);

      set(state => ({
        cards: state.cards.filter(
          card => card.id !== id,
        ),
      }));
    },
  }));