import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { getCustomersWithSalesOrdersAndWorkOrders, getWorkOrderProducts, getFiyat2ItemsForSalesOrder, getSalesOrderItemsWithWorkOrderStatus, getTotalCuttingForSalesOrders, createDeliveryNote } from '../services/deliveryNoteService';
import { FaCheckCircle } from 'react-icons/fa';
import { Button } from 'primereact/button';

import { Toast } from 'primereact/toast';

export default function DeliveryNoteCreate() {
  const toast = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fiyat2Items, setFiyat2Items] = useState([]);
  const [pozlar, setPozlar] = useState([]);
  const [totalCutting, setTotalCutting] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Sayfa ilk açıldığında müşteri ve sales orderları çek
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const data = await getCustomersWithSalesOrdersAndWorkOrders();
        setCustomers(data.map(c => ({ label: c.label, value: c.value, sales_orders: c.sales_orders })));
      } catch (e) {
        setCustomers([]);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  // Müşteri seçilince ilgili sales orderları getir
  useEffect(() => {
    if (!selectedCustomer) {
      setSalesOrders([]);
      setSelectedSalesOrders([]);
      setProducts([]);
      return;
    }
    const customerObj = customers.find(c => c.value === selectedCustomer);
    setSalesOrders(customerObj ? customerObj.sales_orders : []);
    setSelectedSalesOrders([]);
    setProducts([]);
  }, [selectedCustomer, customers]);

  // Sales order seçilince ürünleri getir (tüm seçili siparişler için)
  useEffect(() => {
    async function fetchProducts() {
      if (!selectedSalesOrders.length) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getWorkOrderProducts(selectedSalesOrders);
        setProducts(data);
      } catch (e) {
        setProducts([]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [selectedSalesOrders]);

  // Sales order seçilince Fiyat2 ürünlerini getir (tüm seçili siparişler için)
  useEffect(() => {
    async function fetchFiyat2Items() {
      if (!selectedSalesOrders.length) {
        setFiyat2Items([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getFiyat2ItemsForSalesOrder(selectedSalesOrders);
        setFiyat2Items(data);
      } catch (e) {
        setFiyat2Items([]);
      }
      setLoading(false);
    }
    fetchFiyat2Items();
  }, [selectedSalesOrders]);

  // Sales order seçilince pozları getir (tüm seçili siparişler için)
  useEffect(() => {
    async function fetchPozlar() {
      if (!selectedSalesOrders.length) {
        setPozlar([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getSalesOrderItemsWithWorkOrderStatus(selectedSalesOrders);
        setPozlar(data);
      } catch (e) {
        setPozlar([]);
      }
      setLoading(false);
    }
    fetchPozlar();
  }, [selectedSalesOrders]);

  // Sales order seçilince toplam doğrama alanını getir
  useEffect(() => {
    async function fetchTotalCutting() {
      if (!selectedSalesOrders.length) {
        setTotalCutting(0);
        return;
      }
      const data = await getTotalCuttingForSalesOrders(selectedSalesOrders);
      setTotalCutting(data);
    }
    fetchTotalCutting();
  }, [selectedSalesOrders]);

  // Yardımcı ürünleri aynı stock_code'a göre grupla ve miktarları topla
  function groupFiyat2Items(items) {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.stock_code]) {
        grouped[item.stock_code] = { ...item };
      } else {
        grouped[item.stock_code].qty += item.qty;
      }
    });
    return Object.values(grouped);
  }

  // Pozlar tablosundaki ürün kodlarını al
  const pozItemCodes = pozlar.map(p => p.item_code);

  // Pozları gruplara ayır
  const pvcPozlar = pozlar.filter(p => p.item_group === 'PVC');
  const camPozlar = pozlar.filter(p => p.item_group === 'Camlar');
  const allPvcReady = pvcPozlar.length > 0 && pvcPozlar.every(p => p.is_ready === 'Hazır');
  const allCamReady = camPozlar.length > 0 && camPozlar.every(p => p.is_ready === 'Hazır');

  // Sadece ilgili gruptaki siparişleri backend'e gönder
  const getGroupSalesOrders = (groupPozlar) => {
    // Her pozun parent'ı Sales Order kodu
    return Array.from(new Set(groupPozlar.map(p => p.parent)));
  };

  // PVC için Delivery Note
  const handleCreateDeliveryNotePVC = async () => {
    if (!selectedCustomer || !allPvcReady) return;
    setIsCreating(true);
    try {
      const pvcSalesOrders = getGroupSalesOrders(pvcPozlar);
      const pvcItemCodes = pvcPozlar.map(p => p.item_code);
      const dnName = await createDeliveryNote(pvcSalesOrders, selectedCustomer, "PVC", pvcItemCodes);
      toast.current.show({ severity: 'success', summary: 'Başarılı', detail: `${dnName} numaralı teslimat fişi oluşturuldu.`, life: 4000 });
      setSelectedCustomer(null);
      setSelectedSalesOrders([]);
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: error.message || error.toString(), life: 4000 });
    } finally {
      setIsCreating(false);
    }
  };

  // Camlar için Delivery Note
  const handleCreateDeliveryNoteCamlar = async () => {
    if (!selectedCustomer) return;
    setIsCreating(true);
    try {
      const camSalesOrders = getGroupSalesOrders(camPozlar);
      const camItemCodes = camPozlar.map(p => p.item_code);
      const dnName = await createDeliveryNote(camSalesOrders, selectedCustomer, "Camlar", camItemCodes);
      toast.current.show({ severity: 'success', summary: 'Başarılı', detail: `${dnName} numaralı teslimat fişi oluşturuldu.`, life: 4000 });
      setSelectedCustomer(null);
      setSelectedSalesOrders([]);
    } catch (error) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: error.message || error.toString(), life: 4000 });
    } finally {
      setIsCreating(false);
    }
  };

  // Pozlar tablosu için sadece sıralı veri (grup başlığı yok)
  const groupedPozlar = [...pvcPozlar, ...camPozlar];

  return (
    <div className='w-screen h-screen flex relative'>
      <Toast ref={toast} />
      {/* Sidebar */}
      <div style={{ width: 600, background: '#f4f4f4', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {/* Dropdownlar */}
        <div className='text-sm' style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
          <div style={{ minWidth: 240 }}>
            <label className='text-red-500 font-bold text-sm'>Müşteri</label>
            <Dropdown
              value={selectedCustomer}
              options={customers}
              onChange={e => {
                setSelectedCustomer(e.value);
              }}
              placeholder="Müşteri seçin"
              style={{ width: '100%' }}
              loading={loading}
              className='text-xs'
            />
          </div>
          <div style={{ minWidth: 320 }}>
            <label className=' text-red-500 font-bold text-sm'>Sales Order</label>
            <MultiSelect
              value={selectedSalesOrders}
              options={salesOrders}
              onChange={e => setSelectedSalesOrders(e.value)}
              placeholder="Sales Order seçin"
              style={{ width: '100%' }}
              disabled={!selectedCustomer}
              loading={loading}
            />
          </div>
        </div>
        {/* Tablolar ve toplam doğrama alanı sadece sipariş seçiliyse görünsün */}
        {selectedSalesOrders.length > 0 && (
          <>
            {/* Tablolar alt alta ve scroll'lu */}
            <div className='h-full' style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className='text-center text-red-500 font-bold'>POZLAR</h3>
                <div style={{ fontSize: 13, flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <DataTable value={groupedPozlar} emptyMessage="Ürün yok" loading={loading} className="text-xs" style={{ fontSize: 12 }}>
                    <Column field="item_code" header="Ürün Kodu" />
                    <Column field="item_name" header="Ürün Adı" />
                    <Column field="qty" header="Miktar" body={rowData => rowData.item_group === 'Camlar' ? '' : rowData.qty} />
                    <Column header="Durum" body={rowData => rowData.is_ready === 'Hazır' ? (<FaCheckCircle color="#22c55e" size={18} title="Hazır" />) : null} style={{ textAlign: 'center' }} />
                  </DataTable>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className='text-center text-red-500 font-bold'>YARDIMCI ÜRÜNLER</h3>
                <div style={{  flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <DataTable 
                    value={groupFiyat2Items(fiyat2Items)} 
                    emptyMessage="Yardımcı Malzeme bulunamadı "
                    loading={loading}
                    scrollable
                    className='text-xs'
                  >
                    <Column field="stock_code" header="Stok Kodu" />
                    <Column field="stock_name" header="Stok Adı" />
                    <Column field="qty" header="Miktar" />
                  </DataTable>
                </div>
              </div>
            </div>
          
          </>
        )}
      </div>
      {/* Main Content */}
      <div className='w-full flex-1 p-2 flex flex-col justify-between relative'>
        <div>
          <h3>Ürün Görselleri</h3>
          <div
            className='grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 bg-white p-4 rounded-lg shadow-sm overflow-y-auto max-h-svh pb-24'
          >
            {products
              .filter(prod => prod.item_group === 'PVC' && pozItemCodes.includes(prod.item_code))
              .map((prod, idx) => {
                const imgName = prod.item_code ? prod.item_code.replace(/-/g, '') + '.jpg' : '';
                const imgSrc = imgName ? `/files/share/${imgName}` : '';
                return (
                  <div key={prod.item_code + idx} className='text-center overflow-auto'>
                    <img
                      src={imgSrc}
                      alt={prod.item_code}
                      className='w-[140px] h-[140px] object-contain border border-gray-200 rounded-lg bg-gray-50 mx-auto'
                      onError={e => { e.target.onerror = null; e.target.src = '/files/share/default.jpg'; }}
                    />
                    <div className='text-xs text-gray-500 mt-2'>{prod.item_code}</div>
                    {prod.custom_width && prod.custom_height && (
                      <div className='text-xs text-gray-500'>{prod.custom_width} x {prod.custom_height}</div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        {/* Sticky toplam doğrama alanı ve butonlar */}
        {selectedSalesOrders.length > 0 && (
          <div className='w-full sticky bottom-0 left-0 z-20 mt-8 p-0 flex flex-row items-end justify-between rounded-lg gap-4 bg-slate-300'>
            {/* Sol: Toplam Doğrama (sadece PVC varsa) */}
            {pvcPozlar.length > 0 && (
              <div className='flex-1 p-4 rounded-lg text font-bold text-sm text-red-700 '>
                Toplam Doğrama : {totalCutting}
              </div>
            )}
            {/* Sağ: Butonlar */}
            <div className='flex-1 flex-col gap-2 justify-between w-full p-2 '>
              <Button
                label="PVC Sevkiyat"
                className="p-button-success  p-1"
                onClick={handleCreateDeliveryNotePVC}
                loading={isCreating}
                disabled={!allPvcReady || pvcPozlar.length === 0}
              />
              <Button
                label="Camlar Sevkiyat"
                className="p-button-info p-1"
                onClick={handleCreateDeliveryNoteCamlar}
                loading={isCreating}
                disabled={!allCamReady || camPozlar.length === 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 