'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Order, OrderItem, ItemType, ServiceType, OrderStatus } from '@/types';
import {
  ShoppingCart,
  Package,
  Settings,
  BarChart3,
  Download,
  Upload,
  Plus,
  Minus,
  Trash2,
  Printer,
  Save,
  ArrowLeft,
} from 'lucide-react';

// Arabic labels
const itemTypes: Record<ItemType, string> = {
  thobe: 'ثوب',
  shirt: 'قميص',
  suit: 'بدلة',
  blanket: 'بطانية',
  jacket: 'جاكيت',
  pants: 'بنطلون',
  dress: 'فستان',
  other: 'أخرى',
};

const serviceTypes: Record<ServiceType, string> = {
  wash_iron: 'غسيل وكوي',
  iron_only: 'كوي فقط',
  dry_clean: 'تنظيف جاف',
};

const statusLabels: Record<OrderStatus, string> = {
  received: 'استلم',
  processing: 'قيد المعالجة',
  ready: 'جاهز',
  delivered: 'تم التسليم',
};

type View = 'pos' | 'orders' | 'settings' | 'reports';

export default function Home() {
  const [view, setView] = useState<View>('pos');
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({
    orderNumber: '',
    customerName: '',
    phoneNumber: '',
    items: [],
    totalAmount: 0,
    pickupDate: new Date().toISOString().split('T')[0],
    status: 'received',
    notes: '',
  });
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ itemType: ItemType; serviceType: ServiceType }>({
    itemType: 'thobe',
    serviceType: 'wash_iron',
  });

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (view === 'reports') {
      loadReport();
    }
  }, [view, reportDate]);

  const initializeApp = async () => {
    await db.initializeDefaultPrices();
    await loadPrices();
  };

  const loadPrices = async () => {
    const allPrices = await db.servicePrices.toArray();
    const priceMap: Record<string, number> = {};
    allPrices.forEach(p => {
      priceMap[`${p.itemType}-${p.serviceType}`] = p.price;
    });
    setPrices(priceMap);
  };

  const getCurrentPrice = (itemType: ItemType, serviceType: ServiceType): number => {
    return prices[`${itemType}-${serviceType}`] || 5;
  };

  const addItem = () => {
    const price = getCurrentPrice(selectedItem.itemType, selectedItem.serviceType);
    const newItem: OrderItem = {
      itemType: selectedItem.itemType,
      serviceType: selectedItem.serviceType,
      price,
      quantity: 1,
    };

    setCurrentOrder(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
      totalAmount: (prev.totalAmount || 0) + price,
    }));
  };

  const removeItem = (index: number) => {
    setCurrentOrder(prev => {
      const newItems = prev.items?.filter((_, i) => i !== index) || [];
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, totalAmount };
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCurrentOrder(prev => {
      const newItems = [...(prev.items || [])];
      const item = newItems[index];
      item.quantity = Math.max(1, item.quantity + delta);
      const totalAmount = newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return { ...prev, items: newItems, totalAmount };
    });
  };

  const saveOrder = async () => {
    if (!currentOrder.customerName || !currentOrder.phoneNumber || (currentOrder.items?.length ?? 0) === 0) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const orderNumber = await db.generateOrderNumber();
    const now = new Date().toISOString();

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      customerName: currentOrder.customerName!,
      phoneNumber: currentOrder.phoneNumber!,
      items: currentOrder.items!,
      totalAmount: currentOrder.totalAmount!,
      pickupDate: currentOrder.pickupDate!,
      status: 'received',
      notes: currentOrder.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.orders.add(order);
    setCurrentOrder({
      orderNumber: '',
      customerName: '',
      phoneNumber: '',
      items: [],
      totalAmount: 0,
      pickupDate: new Date().toISOString().split('T')[0],
      status: 'received',
      notes: '',
    });
    alert(`تم حفظ الطلب بنجاح! رقم الطلب: ${orderNumber}`);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    await db.orders.update(orderId, { status: newStatus, updatedAt: new Date().toISOString() });
    await loadOrders();
  };

  const loadOrders = async () => {
    const allOrders = await db.orders.reverse().sort('createdAt').toArray();
    setOrders(allOrders);
  };

  useEffect(() => {
    if (view === 'orders') {
      loadOrders();
    }
  }, [view]);

  const handleBackup = async () => {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laundry-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await db.importData(data);
        await loadPrices();
        await loadOrders();
        alert('تم استعادة البيانات بنجاح!');
      } catch (error) {
        alert('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };

  const renderPOS = () => (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">نقطة بيع جديدة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">بيانات العميل</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">اسم العميل *</label>
              <input
                type="text"
                value={currentOrder.customerName || ''}
                onChange={(e) => setCurrentOrder({ ...currentOrder, customerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="أدخل اسم العميل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                value={currentOrder.phoneNumber || ''}
                onChange={(e) => setCurrentOrder({ ...currentOrder, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="05xxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ الاستلام</label>
              <input
                type="date"
                value={currentOrder.pickupDate || ''}
                onChange={(e) => setCurrentOrder({ ...currentOrder, pickupDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ملاحظات</label>
              <textarea
                value={currentOrder.notes || ''}
                onChange={(e) => setCurrentOrder({ ...currentOrder, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="ملاحظات إضافية"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">إضافة قطعة</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">نوع القطعة</label>
                <select
                  value={selectedItem.itemType}
                  onChange={(e) => setSelectedItem({ ...selectedItem, itemType: e.target.value as ItemType })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Object.entries(itemTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">نوع الخدمة</label>
                <select
                  value={selectedItem.serviceType}
                  onChange={(e) => setSelectedItem({ ...selectedItem, serviceType: e.target.value as ServiceType })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Object.entries(serviceTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary-50 rounded-lg p-4">
              <div className="text-primary-700 font-medium">
                السعر: {getCurrentPrice(selectedItem.itemType, selectedItem.serviceType)} ريال
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus size={20} />
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">ملخص الطلب</h2>

          {currentOrder.items && currentOrder.items.length > 0 ? (
            <>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {itemTypes[item.itemType]} - {serviceTypes[item.serviceType]}
                      </div>
                      <div className="text-sm text-gray-500">{item.price} ريال</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mr-4">
                      <div className="w-20 text-left font-semibold text-gray-800">
                        {item.price * item.quantity} ريال
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                  <span>المجموع الكلي:</span>
                  <span className="text-primary-600">{currentOrder.totalAmount} ريال</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveOrder}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  <Save size={20} />
                  حفظ الطلب
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart size={64} className="mx-auto mb-4" />
              <p>لم تتم إضافة أي قطع بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">إدارة الطلبات</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {(['received', 'processing', 'ready', 'delivered'] as OrderStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => filterOrdersByStatus(status)}
            className={`p-4 rounded-xl transition-all ${
              orders.some(o => o.status === status)
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-gray-400'
            }`}
          >
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === status).length}
            </div>
            <div className="text-sm">{statusLabels[status]}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={64} className="mx-auto mb-4" />
            <p>لا توجد طلبات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">رقم الطلب</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">العميل</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الهاتف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium">{order.customerName}</td>
                    <td className="px-4 py-3">{order.phoneNumber}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{order.totalAmount} ريال</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value as OrderStatus)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'received' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'ready' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {Object.entries(statusLabels).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => printReceipt(order)}
                        className="text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const filterOrdersByStatus = async (status: OrderStatus) => {
    const filtered = await db.getOrdersByStatus(status);
    setOrders(filtered);
  };

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="border-bottom: 1px dashed #ccc; padding: 5px;">${itemTypes[item.itemType]} - ${serviceTypes[item.serviceType]}</td>
        <td style="border-bottom: 1px dashed #ccc; padding: 5px; text-align: center;">${item.quantity}</td>
        <td style="border-bottom: 1px dashed #ccc; padding: 5px; text-align: left;">${item.price * item.quantity} ريال</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .info { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          table { width: 100%; margin-bottom: 15px; }
          th { text-align: right; background: #f5f5f5; padding: 8px; }
          td { padding: 5px; }
          .total { font-weight: bold; font-size: 18px; text-align: left; }
          .tag { border: 2px dashed #000; padding: 10px; margin-top: 20px; }
          @media print { body { font-size: 12px; } }
        </style>
      </head>
      <body>
        <h1>🧺 مغسلة الملابس</h1>
        <div class="info">
          <strong>رقم الطلب:</strong> ${order.orderNumber}<br>
          <strong>العميل:</strong> ${order.customerName}<br>
          <strong>الهاتف:</strong> ${order.phoneNumber}<br>
          <strong>تاريخ الاستلام:</strong> ${order.pickupDate}
        </div>
        <table>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>السعر</th>
          </tr>
          ${itemsHtml}
        </table>
        <div class="total">المجموع: ${order.totalAmount} ريال</div>
        ${order.notes ? `<div style="margin-top: 10px; padding: 5px; background: #f5f5f5;"><strong>ملاحظات:</strong> ${order.notes}</div>` : ''}
        <div class="tag">
          <strong>🏷️ بطاقة التعريف</strong><br>
          رقم: ${order.orderNumber}<br>
          العميل: ${order.customerName}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">الإعدادات</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">الأسعار</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الصنف</th>
                {Object.values(serviceTypes).map(service => (
                  <th key={service} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">{service}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(itemTypes).map(([itemTypeKey, itemTypeLabel]) => (
                <tr key={itemTypeKey}>
                  <td className="px-4 py-3 font-medium">{itemTypeLabel}</td>
                  {Object.keys(serviceTypes).map(serviceTypeKey => (
                    <td key={`${itemTypeKey}-${serviceTypeKey}`} className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={prices[`${itemTypeKey}-${serviceTypeKey}`] || 0}
                        onChange={async (e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          const priceEntry = await db.servicePrices
                            .where('[itemType+serviceType]')
                            .equals([itemTypeKey as ItemType, serviceTypeKey as ServiceType])
                            .first();
                          if (priceEntry?.id) {
                            await db.updatePrice(priceEntry.id, newPrice);
                          }
                          setPrices({ ...prices, [`${itemTypeKey}-${serviceTypeKey}`]: newPrice });
                        }}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-center focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">النسخ الاحتياطي</h2>
        <div className="flex gap-4">
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Download size={20} />
            تصدير البيانات
          </button>
          <label className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
            <Upload size={20} />
            استعادة البيانات
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );

  const loadReport = async () => {
    const data = await db.getDailyReport(reportDate);
    setReport(data);
  };

  const renderReports = () => (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">التقارير اليومية</h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-600">التاريخ:</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {report && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="text-sm text-primary-600 mb-1">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold text-primary-700">{report.totalRevenue} ريال</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600 mb-1">عدد الطلبات</div>
              <div className="text-2xl font-bold text-blue-700">{report.totalOrders}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="text-sm text-yellow-600 mb-1">الطلبات المعلقة</div>
              <div className="text-2xl font-bold text-yellow-700">{report.pendingOrders}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600 mb-1">القطع المعالجة</div>
              <div className="text-2xl font-bold text-green-700">{report.piecesProcessed}</div>
            </div>
          </div>
        )}
      </div>

      {report && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">توزيع الطلبات حسب الحالة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 rounded-xl bg-gray-50">
                <div className="text-3xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-500 mt-1">{statusLabels[status as OrderStatus]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-primary-600">
              <ShoppingCart size={28} />
              <span className="text-xl font-bold">نظام المغاسل</span>
            </div>

            <div className="flex gap-2">
              {[
                { id: 'pos', label: 'طلب جديد', icon: ShoppingCart },
                { id: 'orders', label: 'الطلبات', icon: Package },
                { id: 'reports', label: 'التقارير', icon: BarChart3 },
                { id: 'settings', label: 'الإعدادات', icon: Settings },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    view === item.id
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {view === 'pos' && renderPOS()}
        {view === 'orders' && renderOrders()}
        {view === 'settings' && renderSettings()}
        {view === 'reports' && renderReports()}
      </main>
    </div>
  );
}
