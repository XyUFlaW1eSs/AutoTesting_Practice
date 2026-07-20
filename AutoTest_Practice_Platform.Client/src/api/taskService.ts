import axiosClient from './axiosClient';
import type { TaskResponse, WorkTaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, ReportResponse, GenerateReportRequest } from './types';

// 定义查询参数的类型
export interface TaskQueryParams {
  status?: WorkTaskStatus;
  priority?: TaskPriority;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 定义局部分页相应接口
export interface PaginatedTasks {
  total: number;
  page: number;
  pageSize: number;
  items: TaskResponse[];
}

export const taskService = {
  // 获取任务列表
  getTasks: async (params: TaskQueryParams): Promise<PaginatedTasks> => {
    // 将泛型指定为我们刚才定义的 PaginatedTasks
    const response = await axiosClient.get<PaginatedTasks>('/api/tasks', { params });
    return response.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<TaskResponse> => {
    const response = await axiosClient.post<TaskResponse>('/api/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<void> => {
    await axiosClient.put(`/api/tasks/${id}`, data);
  },

  deleteTask: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/tasks/${id}`);
  },

  // 触发 Flaky 测试接口 (20% 概率 500 错误)
  triggerFlakyTask: async (): Promise<void> => {
    await axiosClient.get('/api/tasks/flaky');
  },

  // ==========================================
  // 报表相关接口 (对应 ReportController)
  // ==========================================
  generateReport: async (data: GenerateReportRequest): Promise<ReportResponse> => {
    const response = await axiosClient.post<ReportResponse>('/api/report/generate', data);
    return response.data;
  },

  getReports: async (): Promise<ReportResponse[]> => {
    const response = await axiosClient.get<ReportResponse[]>('/api/report/history');
    return response.data;
  },

  getReportById: async (id: string): Promise<ReportResponse> => {
    const response = await axiosClient.get<ReportResponse>(`/api/report/${id}`);
    return response.data;
  }
};