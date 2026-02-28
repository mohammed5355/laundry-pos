// Order Status Enum
export type OrderStatus = 'received' | 'processing' | 'ready' | 'delivered';

// Service Type Enum
export type ServiceType = 'wash_iron' | 'iron_only' | 'dry_clean';

// Item Type Enum
export type ItemType = 'thobe' | 'shirt' | 'suit' | 'blanket' | 'jacket' | 'pants' | 'dress' | 'other';

// Order Item Interface
export interface OrderItem {
  id?: string;
  itemType: ItemType;
  serviceType: ServiceType;
  price: number;
  quantity: number;
}

// Order Interface
export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  items: OrderItem[];
  totalAmount: number;
  pickupDate: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Service Price Interface
export interface ServicePrice {
  id?: string;
  itemType: ItemType;
  serviceType: ServiceType;
  price: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Daily Report Interface
export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  piecesProcessed: number;
  ordersByStatus: Record<OrderStatus, number>;
}

// Backup Data Interface
export interface BackupData {
  orders: Order[];
  servicePrices: ServicePrice[];
  backupDate: string;
  version: string;
}
