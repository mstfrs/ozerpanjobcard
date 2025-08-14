import React, { useState, useEffect } from 'react';
import { getDeliveredOrdersWithoutInstallation, getDeliveredItemsByOrder } from '../../services/DelaerServices';
import InstallationTable from '../../components/InstallationTable';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

export const Installation = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (selectedItemCodes) => {
    setSelectedItems(selectedItemCodes);
  };

  const handleCreateInstallationNote = async () => {
    if (selectedItems.length === 0) {
      setError('Lütfen en az bir ürün seçin');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Installation Note oluştur
      const response = await fetch(`/api/method/ozerpanjobcard.dealerApi.create_installation_note`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sales_order: selectedOrder.sales_order,
          selected_items: selectedItems
        }),
      });

      const result = await response.json();
      if (result.message && result.message.success) {
        alert('Installation Note başarıyla oluşturuldu!');
        // Formu temizle
        setSelectedOrder(null);
        setOrderItems([]);
        setSelectedItems([]);
        // Siparişleri yeniden yükle
        loadOrders();
      } else {
        setError(result.message?.message || 'Installation Note oluşturulamadı');
      }
    } catch (err) {
      setError('Installation Note oluşturulurken hata oluştu');
      console.error('Error creating installation note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallationNoteCreated = (installationNote) => {
    // Başarı mesajı göster
    alert(`Installation Note başarıyla oluşturuldu!\n\n` +
      `Doküman No: ${installationNote.name}\n` +
      `Müşteri: ${installationNote.customer}\n` +
      `Toplam Ürün: ${installationNote.total_qty || 0}\n` +
      `Toplam Tutar: ${(installationNote.grand_total || 0).toLocaleString('tr-TR')} TL\n` +
      `Montaj Tarihi: ${new Date(installationNote.inst_date).toLocaleDateString('tr-TR')}`);
    
    // Formu temizle
    setSelectedOrder(null);
    setOrderItems([]);
    setSelectedItems([]);
    
    // Siparişleri yeniden yükle (sayfa yenilenmeden)
    loadOrders();
    
    // Hata mesajını temizle
    setError('');
  };

  const testInstallationFiltering = async (salesOrderName) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/method/ozerpanjobcard.dealerApi.test_installation_filtering`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_order_name: salesOrderName }),
      });

      const result = await response.json();
      if (result.message && result.message.success) {
        console.log("Test result:", result.message);
        alert(`Test sonucu:\nToplam teslim edilen ürün: ${result.message.summary.total_delivered_items}\nInstallation'ı olan: ${result.message.summary.items_with_installation}\nInstallation'ı olmayan: ${result.message.summary.items_without_installation}`);
      } else {
        setError('Test fonksiyonu çalıştırılamadı');
      }
    } catch (err) {
      setError('Test fonksiyonu çalıştırılırken hata oluştu');
      console.error('Error testing installation filtering:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       

        {/* Sipariş Seçimi */}
     
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
              
              {/* Test Butonu - Debug için */}
              {/* {orders.length > 0 && (
                <div className="mt-2">
                  <Button
                    label="Installation Filtreleme Test Et"
                    icon="pi pi-search"
                    onClick={() => testInstallationFiltering(orders[0].sales_order)}
                    disabled={loading}
                    className="p-button-secondary p-button-sm"
                    size="small"
                  />
                  <span className="ml-2 text-xs text-gray-500">
                    İlk sipariş için test et
                  </span>
                </div>
              )} */}
            </div>
        
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

        {/* Installation Note Oluştur Butonu */}
        {/* {selectedItems.length > 0 && (
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Installation Note Oluştur
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedItems.length} ürün seçildi
                </p>
              </div>
              <Button
                label="Installation Note Oluştur"
                icon="pi pi-plus"
                onClick={handleCreateInstallationNote}
                disabled={loading}
                className="p-button-primary"
                size="large"
              />
            </div>
          </Card>
        )} */}

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

