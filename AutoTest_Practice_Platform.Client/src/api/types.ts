// ==========================================
// 枚举类型 (常量对象 + 类型推导模式)
// ==========================================

export const TaskPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3
} as const;
// 提取对应的值作为类型 (0 | 1 | 2 | 3)
export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const WorkTaskStatus = {
  Todo: 0,
  InProgress: 1,
  Blocked: 2,
  Done: 3,
  Cancelled: 4
} as const;
// 提取对应的值作为类型 (0 | 1 | 2 | 3 | 4)
export type WorkTaskStatus = typeof WorkTaskStatus[keyof typeof WorkTaskStatus];

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: WorkTaskStatus;
  dueDate?: string;
  assigneeId?: string;
  resourceId?: string;
}

// 更新请求的结构通常与创建一致，或者允许部分字段更新
export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id?: string;
}

// ==========================================
// 鉴权模块请求与响应模型 (Auth) 保持不变 👇
// ==========================================
// ... 下面的接口代码原样保留 ...

// ==========================================
// 鉴权模块请求与响应模型 (Auth)
// ==========================================
export interface LoginRequest {
  identity?: string;
  password?: string;
}

export interface AuthResponse {
  userId?: string;
  userName?: string;
  email?: string;
  role?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface UserResponse {
  id?: string;
  userName?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface RefreshTokenRequest {
  userId?: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  userName?: string;
  email?: string;
  password?: string;
}

// ==========================================
// 任务模块模型 (Tasks)
// ==========================================
export interface TaskResponse {
  id?: string;
  title?: string;
  description?: string;
  status?: WorkTaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  resourceId?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 文件模块模型 (Files)
// ==========================================
export interface FileAssetResponse {
  id?: string;
  originalFileName?: string;
  contentType?: string;
  size?: number;
  category?: string;
  createdAt?: string;
}

// ==========================================
// 报表模块模型 (Reports)
// ==========================================

export interface GenerateReportRequest {
  title?: string;
}

export interface ReportResponse {
  id?: string;
  title?: string;
  status?: string;
  durationMs?: number;
  summary?: string;
  createdAt?: string;
}

// ==========================================
// 资源模块模型 (Resources)
// ==========================================

export const ResourceStatus = {
  Available: 0,
  InUse: 1,
  Maintenance: 2,
  Offline: 3
} as const;

export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];

export interface ResourceResponse {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  status?: ResourceStatus;
  tags?: string;
  ownerId?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreateResourceRequest {
  name: string;
  type?: string;
  url?: string;
  status?: ResourceStatus;
  tags?: string;
  ownerId?: string;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id?: string;
}

// ==========================================
// 信用卡模块模型 (Cards)
// ==========================================
export interface CardResponse {
  id?: string;
  cardNumber?: string;
  expiryDate?: string;
  ccv?: string;
  formattedInfo: string;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt? :string;
}

export interface CreateCardRequest {
  cardNumber: string;
  expiryDate: string;
  ccv: string;
  isDeleted: boolean;
}

export interface UpdateCardRequest extends CreateCardRequest {}