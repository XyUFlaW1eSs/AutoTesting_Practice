import axiosClient from './axiosClient';
import type { CardResponse, CreateCardRequest, UpdateCardRequest } from './types';

export const cardService = {
  getCards: async (params?: { cardNumber?: string; expiryDate?: string }): Promise<CardResponse[]> => {
    const response = await axiosClient.get<CardResponse[]>('/api/cards', { params });
    return response.data;
  },

  createCard: async (data: CreateCardRequest): Promise<CardResponse> => {
    const response = await axiosClient.post<CardResponse>('/api/cards', data);
    return response.data;
  },

  updateCard: async (id: string, data: UpdateCardRequest): Promise<void> => {
    await axiosClient.put(`/api/cards/${id}`, data);
  },

  deleteCard: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/cards/${id}`);
  }
};