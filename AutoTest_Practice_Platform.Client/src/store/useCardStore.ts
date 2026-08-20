import { create } from 'zustand';
import { cardRepository } from '../db/repositories/CardRepository';
import type { DbCard } from '../db/models';

interface CardStore {
  cards: DbCard[];
  isLoading: boolean;
  fetchCards: () => Promise<void>;
  addCard: (card: Omit<DbCard, 'id' | 'isDeleted'>) => Promise<void>;
  updateCard: (id: string | number, changes: Partial<DbCard>) => Promise<void>;
  deleteCard: (id: string | number) => Promise<void>;
}

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  isLoading: false,

  // 1. 获取列表：从 IndexedDB 读取
  fetchCards: async () => {
    set({ isLoading: true });
    const data = await cardRepository.getAll();
    set({ cards: data, isLoading: false });
  },

  // 2. 新增卡片：优先写 IndexedDB，立即更新 UI
  addCard: async (card) => {
    // 离线模式下生成临时 ID (前缀 temp_ 方便以后网络恢复时识别并替换)
    const tempId = `temp_${Date.now()}`;
    const newCard: DbCard = { ...card, id: tempId, isDeleted: false };
    
    await cardRepository.insert(newCard);
    
    // UI 立即响应，无需等待网络
    set((state) => ({ cards: [...state.cards, newCard] }));
  },

  // 3. 更新卡片：优先写 IndexedDB，立即更新 UI
  updateCard: async (id, changes) => {
    await cardRepository.update(id, changes);
    
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...changes } : c)),
    }));
  },

  // 4. 删除卡片：触发 IndexedDB 软删除，立即从 UI 剔除
  deleteCard: async (id) => {
    await cardRepository.delete(id);
    
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    }));
  },
}));