import axiosClient from './axiosClient';
import type { ResourceResponse, CreateResourceRequest, UpdateResourceRequest } from './types';

export const resourceService = {
  getResources: async (params?: { status?: number; type?: string }): Promise<ResourceResponse[]> => {
    // 对应 C# 中的 [HttpGet] /api/resources
    const response = await axiosClient.get<ResourceResponse[]>('/api/resources', { params });
    return response.data;
  },

  getResourceById: async (id: string): Promise<ResourceResponse> => {
    // 对应 C# 中的 [HttpGet("{id:guid}")]
    const response = await axiosClient.get<ResourceResponse>(`/api/resources/${id}`);
    return response.data;
  },

  createResource: async (data: CreateResourceRequest): Promise<ResourceResponse> => {
    // 对应 C# 中的 [HttpPost]
    const response = await axiosClient.post<ResourceResponse>('/api/resources', data);
    return response.data;
  },

  updateResource: async (id: string, data: UpdateResourceRequest): Promise<void> => {
    // 对应 C# 中的 [HttpPut("{id:guid}")]
    await axiosClient.put(`/api/resources/${id}`, data);
  },

  deleteResource: async (id: string): Promise<void> => {
    // 对应 C# 中的 [HttpDelete("{id:guid}")]
    await axiosClient.delete(`/api/resources/${id}`);
  }
};