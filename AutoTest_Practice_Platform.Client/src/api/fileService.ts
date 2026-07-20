import axiosClient from './axiosClient';
import type { FileAssetResponse } from './types';

export const fileService = {
  // 获取文件列表
  getFiles: async (): Promise<FileAssetResponse[]> => {
    const response = await axiosClient.get<FileAssetResponse[]>('/api/files');
    return response.data;
  },

  // 上传文件 (重点测试靶点)
  uploadFile: async (file: File): Promise<FileAssetResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<FileAssetResponse>('/api/files/upload', formData, {
      headers: {
        // 覆盖默认的 application/json
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 下载文件
  downloadFile: async (id: string, fileName: string): Promise<void> => {
    // 针对下载，我们需要告诉 axios 将响应作为二进制 Blob 处理
    const response = await axiosClient.get(`/api/files/${id}/download`, {
      responseType: 'blob', 
    });
    
    // 创建一个隐藏的 a 标签来触发浏览器的下载行为
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // 删除文件 (用于测试数据清理)
  deleteFile: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/files/${id}`);
  }
};