import React, { useState, useEffect, useCallback } from 'react';
import { getDeliveredOrdersWithoutInstallation } from '../services/DelaerServices';
import InstallationTable from '../components/InstallationTable';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';

const Installation = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getDeliveredOrdersWithoutInstallation();
      if (result && result.orders) {
        setOrders(result.orders);
      } else {
        setError('Siparişler yüklenemedi');
      }
    } catch (err) {
      setError('Siparişler yüklenirken hata oluştu');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = async (order) => {
    if (!order) {
      setOrderItems([]);
      setSelectedItems([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await getDeliveredItemsByOrder(order.sales_order);
      if (result && result.delivered_items) {
        setOrderItems(result.delivered_items);
      } else {
        setError('Ürün detayları yüklenemedi');
        setOrderItems([]);
      }
    } catch (err) {
      setError('Ürün detayları yüklenirken hata oluştu');
      console.error('Error loading order items:', err);
      setSelectedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = useCallback((selectedItemCodes) => {
    // Ensure selectedItemCodes is always an array
    const safeSelection = Array.isArray(selectedItemCodes) ? selectedItemCodes : [];
    
    // Only update if selection actually changed
    if (JSON.stringify(safeSelection) !== JSON.stringify(selectedItems)) {
      setSelectedItems(safeSelection);
    }
  }, [selectedItems]);

  const handleInstallationNoteCreated = (installationNote) => {
    // Başarı mesajı göster
    if (toast) {
      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: `Montaj Kaydı oluşturuldu: ${installationNote.name}`,
        life: 5000
      });
    }
    
    // Siparişleri yeniden yükle
    loadOrders();
  };

  const orderTemplate = (option) => {
    if (!option) return null;
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold">{option.sales_order}</span>
        <span className="text-sm text-gray-600">
          {option.custom_end_customer} - {option.total_items} ürün
        </span>
      </div>
    );
  };

  const selectedOrderTemplate = (option) => {
    if (!option) return null;
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold">{option.sales_order}</span>
        <span className="text-sm text-gray-600">{option.custom_end_customer}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toast ref={toast} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Montaj Kaydı Oluştur</h1>
          <p className="mt-2 text-gray-600">
            Teslim edilen ürünler için Montaj Kaydı oluşturun
          </p>
        </div>

        {/* Sipariş Seçimi */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sipariş Numarası
              </label>
              <Dropdown
                value={selectedOrder}
                onChange={(e) => {
                  setSelectedOrder(e.value);
                  handleOrderChange(e.value);
                }}
                options={orders}
                optionLabel="sales_order"
                placeholder="Sipariş seçin"
                itemTemplate={orderTemplate}
                valueTemplate={selectedOrderTemplate}
                className="w-full"
                disabled={loading}
                showClear
              />
            </div>
            
            {selectedOrder && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Seçilen Sipariş Bilgileri</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Son Müşteri:</strong> {selectedOrder.custom_end_customer}</p>
                  <p><strong>Toplam Ürün:</strong> {selectedOrder.total_items}</p>
                  <p><strong>Teslimat Sayısı:</strong> {selectedOrder.delivery_count}</p>
                  <p><strong>Sipariş Tarihi:</strong> {new Date(selectedOrder.transaction_date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Hata Mesajı */}
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="mb-6"
            onClose={() => setError('')}
          />
        )}

        {/* Ürün Tablosu */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <InstallationTable 
              items={orderItems} 
              onSelectionChange={handleItemSelection}
              onInstallationNoteCreated={handleInstallationNoteCreated}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="flex flex-col items-center">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <span className="mt-4 text-gray-700">Yükleniyor...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Installation; 