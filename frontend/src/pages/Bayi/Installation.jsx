import React, { useState, useEffect } from 'react';
import { getDeliveredOrdersWithoutInstallation, getDeliveredItemsByOrder } from '../../services/DelaerServices';
import InstallationTable from '../../components/InstallationTable';
import CompletedInstallations from '../../components/DelaerPage/CompletedInstallations';
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
  const [activeView, setActiveView] = useState('pending'); // 'pending' veya 'completed'

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

  const handleViewChange = (view) => {
    setActiveView(view);
    // View değiştiğinde formu temizle
    setSelectedOrder(null);
    setOrderItems([]);
    setSelectedItems([]);
    setError('');
  };

  const testInstallationFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/method/ozerpanjobcard.dealerApi.test_installation_note_fields`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.message && result.message.success) {
        console.log("Installation Note fields:", result.message.data);
        alert(`Installation Note Alanları:\n\nAna Alanlar: ${result.message.data.installation_note_fields.join(', ')}\n\nItem Alanları: ${result.message.data.installation_note_item_fields.join(', ')}`);
      } else {
        setError('Test fonksiyonu çalıştırılamadı');
      }
    } catch (err) {
      setError('Test fonksiyonu çalıştırılırken hata oluştu');
      console.error('Error testing installation fields:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* View Seçim Butonları */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <Button
              label="Bekleyen Montajlar"
              icon="pi pi-clock"
              className={`${activeView === 'pending' ? 'bg-blue-600' : 'bg-gray-400'} text-white border-0 p-2`}
              onClick={() => handleViewChange('pending')}
            />
            <Button
              label="Tamamlanan Montajlar"
              icon="pi pi-check-circle"
              className={`${activeView === 'completed' ? 'bg-green-600' : 'bg-gray-400'} text-white border-0 p-2`}
              onClick={() => handleViewChange('completed')}
            />
          </div>
        </div>

        {/* Bekleyen Montajlar View */}
        {activeView === 'pending' && (
          <>
            {/* Sipariş Seçimi */}
            <div className="mb-6">
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
          </>
        )}

        {/* Tamamlanan Montajlar View */}
        {activeView === 'completed' && (
          <div className="mb-6">
            
            <CompletedInstallations />
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

