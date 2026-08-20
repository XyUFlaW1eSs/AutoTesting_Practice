// 定义本地数据库专用的卡片实体模型
export interface DbCard {
  id: string | number; // 兼容 GUID 字符串或自增 ID
  cardNumber?: string;
  expiryDate?: string;
  ccv?: string;
  isDeleted?: boolean; // 软删除标记，便于离线同步时的冲突解决
  createdAt?: string;
  updatedAt?: string;
}