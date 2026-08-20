// 定义本地数据库专用的卡片实体模型
export interface DbCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  ccv: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}