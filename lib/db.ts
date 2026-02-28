import Dexie, { Table } from 'dexie';
import { Order, OrderItem, ServicePrice, BackupData } from '@/types';

class LaundryDatabase extends Dexie {
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;
  servicePrices!: Table<ServicePrice>;

  constructor() {
    super('LaundryPOS');
    this.version(1).stores({
      orders: 'id, orderNumber, customerName, phoneNumber, status, pickupDate, createdAt, updatedAt',
      orderItems: 'id, orderId',
      servicePrices: 'id, itemType, serviceType, createdAt, updatedAt',
    });
  }

  // Helper method to generate unique order number
  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.getFullYear().toString().slice(-2) +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const todayOrders = await this.orders
      .where('orderNumber')
      .startsWith(datePrefix)
      .count();

    const sequenceNumber = (todayOrders + 1).toString().padStart(4, '0');
    return `${datePrefix}-${sequenceNumber}`;
  }

  // Get orders by status
  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    return this.orders.where('status').equals(status).reverse().sort('createdAt').toArray();
  }

  // Get orders by date range
  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    return this.orders
      .where('createdAt')
      .between(startDate, endDate, true, true)
      .reverse()
      .sort('createdAt')
      .toArray();
  }

  // Get orders by pickup date
  async getOrdersByPickupDate(pickupDate: string): Promise<Order[]> {
    return this.orders
      .where('pickupDate')
      .equals(pickupDate)
      .reverse()
      .sort('createdAt')
      .toArray();
  }

  // Get daily report
  async getDailyReport(date: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    piecesProcessed: number;
    ordersByStatus: Record<Order['status'], number>;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await this.orders
      .where('createdAt')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status !== 'delivered').length;
    const piecesProcessed = orders.reduce((sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    const ordersByStatus: Record<Order['status'], number> = {
      received: 0,
      processing: 0,
      ready: 0,
      delivered: 0,
    };

    orders.forEach(order => {
      ordersByStatus[order.status]++;
    });

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      piecesProcessed,
      ordersByStatus,
    };
  }

  // Export all data for backup
  async exportData(): Promise<BackupData> {
    const orders = await this.orders.toArray();
    const servicePrices = await this.servicePrices.toArray();
    return {
      orders,
      servicePrices,
      backupDate: new Date().toISOString(),
      version: '1.0',
    };
  }

  // Import data from backup
  async importData(data: BackupData): Promise<void> {
    await this.transaction('rw', this.orders, this.servicePrices, async () => {
      await this.orders.clear();
      await this.servicePrices.clear();
      await this.orders.bulkAdd(data.orders);
      await this.servicePrices.bulkAdd(data.servicePrices);
    });
  }

  // Initialize default service prices
  async initializeDefaultPrices(): Promise<void> {
    const existingPrices = await this.servicePrices.count();
    if (existingPrices > 0) return;

    const defaultPrices: Omit<ServicePrice, 'id'>[] = [
      // ثوب - Thobe
      { itemType: 'thobe', serviceType: 'wash_iron', price: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'thobe', serviceType: 'iron_only', price: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'thobe', serviceType: 'dry_clean', price: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // قميص - Shirt
      { itemType: 'shirt', serviceType: 'wash_iron', price: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'shirt', serviceType: 'iron_only', price: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'shirt', serviceType: 'dry_clean', price: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // بدلة - Suit
      { itemType: 'suit', serviceType: 'wash_iron', price: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'suit', serviceType: 'iron_only', price: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'suit', serviceType: 'dry_clean', price: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // بطانية - Blanket
      { itemType: 'blanket', serviceType: 'wash_iron', price: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'blanket', serviceType: 'iron_only', price: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'blanket', serviceType: 'dry_clean', price: 40, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // جاكيت - Jacket
      { itemType: 'jacket', serviceType: 'wash_iron', price: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'jacket', serviceType: 'iron_only', price: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'jacket', serviceType: 'dry_clean', price: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // بنطلون - Pants
      { itemType: 'pants', serviceType: 'wash_iron', price: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'pants', serviceType: 'iron_only', price: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'pants', serviceType: 'dry_clean', price: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // فستان - Dress
      { itemType: 'dress', serviceType: 'wash_iron', price: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'dress', serviceType: 'iron_only', price: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'dress', serviceType: 'dry_clean', price: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

      // أخرى - Other
      { itemType: 'other', serviceType: 'wash_iron', price: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'other', serviceType: 'iron_only', price: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { itemType: 'other', serviceType: 'dry_clean', price: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    await this.servicePrices.bulkAdd(defaultPrices);
  }

  // Get price for service
  async getPrice(itemType: ServicePrice['itemType'], serviceType: ServicePrice['serviceType']): Promise<number> {
    const price = await this.servicePrices
      .where('[itemType+serviceType]')
      .equals([itemType, serviceType])
      .first();
    return price?.price ?? 5; // Default price if not found
  }

  // Update price
  async updatePrice(id: string, newPrice: number): Promise<void> {
    await this.servicePrices.update(id, {
      price: newPrice,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const db = new LaundryDatabase();
