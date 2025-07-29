import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
// import { getCustomersWithSalesOrdersAndWorkOrders, getWorkOrderProducts, getFiyat2ItemsForSalesOrder, getSalesOrderItemsWithWorkOrderStatus, getTotalCuttingForSalesOrders, createDeliveryNote } from '../services/deliveryNoteService';
import { FaCheckCircle } from 'react-icons/fa';
import { Button } from 'primereact/button';

import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
// import { InputMask } from 'primereact/inputmask';
import { getCustomersWithSalesOrdersAndWorkOrders, getWorkOrderProducts, getFiyat2ItemsForSalesOrder, getSalesOrderItemsWithWorkOrderStatus, getTotalCuttingForSalesOrders, createDeliveryNote, getCustomersWithUndeliveredCamItems  } from '../../../services/deliveryNoteService';

export default function CamSevkiyat() {
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Teslim Alan, Araç Plakası, Fotoğraf ve Sevkiyat Tipi için state
  const [teslimAlan, setTeslimAlan] = useState('');
  const [aracPlaka, setAracPlaka] = useState('');
  const [plakaError, setPlakaError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [sevkiyatTipi, setSevkiyatTipi] = useState(null); // "PVC" veya "Camlar"
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedPozlar, setSelectedPozlar] = useState([]); // <-- yeni eklendi

  // Grand total hesapla (seçili cam pozlar için)
  const calculateGrandTotal = () => {
    const total = selectedPozlar.reduce((sum, poz) => {
      // amount alanı Sales Order'dan geliyor!
      const amount = Number(poz.amount) || 0;
      console.log(`Poz: ${poz.item_code}, Amount: ${amount}`);
      return sum + amount;
    }, 0);
    
    console.log(`Calculated total: ${total}`);
    
    // Eğer toplam 0 ise, varsayılan bir değer kullan (ERPNext validasyonu için)
    const finalTotal = total > 0 ? total : 1.0;
    console.log(`Final grand total: ${finalTotal}`);
    return finalTotal;
  };

  // Teslimat fişi oluşturma işlemi
  const handleTeslimatFisOlustur = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCustomer || !sevkiyatTipi) return;
    if (!teslimAlan || plakaError) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Teslim alan ve plaka bilgisi geçerli olmalı.', life: 4000 });
      return;
    }
    if (!selectedPozlar.length) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Lütfen en az bir ürün seçin.', life: 4000 });
      return;
    }
    if (selectedPozlar.some(p => p.is_ready !== 'Hazır')) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Sadece "Hazır" ürünler için teslimat oluşturabilirsiniz.', life: 4000 });
      return;
    }
    setIsCreating(true);
    try {
      let photoUrl = null;
      if (photo) {
        const { uploadPhotoBase64 } = await import('../../../services/deliveryNoteService');
        photoUrl = await uploadPhotoBase64(photo, `delivery_${Date.now()}.png`);
      }
      const pozlarGroup = selectedPozlar;
      const salesOrdersGroup = getGroupSalesOrders(pozlarGroup);
      // Sadece item_code ve qty içeren dizi oluştur
      const itemDetails = pozlarGroup.map(p => ({
        item_code: p.item_code,
        qty: p.qty || 1
      }));
      await createDeliveryNote(
        salesOrdersGroup,
        selectedCustomer,
        sevkiyatTipi,
        null, // itemCodes - kullanılmıyor
        null, // grandTotal - kullanılmıyor
        { custom_recipient: teslimAlan, custom_vehicle: aracPlaka, custom_delivery_photo: photoUrl },
        itemDetails // itemDetails parametresi
      );
      toast.current.show({ severity: 'success', summary: 'Başarılı', detail: `Teslimat fişi oluşturuldu.`, life: 4000 });
      
      // Müşteri listesini yenile
      try {
        const updatedCustomers = await getCustomersWithUndeliveredCamItems();
        setCustomers(updatedCustomers);
      } catch (e) {
        console.error('Müşteri listesi yenilenirken hata:', e);
      }
      
      setSelectedCustomer(null);
      setSelectedSalesOrders([]);
      setSidebarVisible(false);
      setTeslimAlan('');
      setAracPlaka('');
      setPhoto(null);
      setSevkiyatTipi(null);
      setSelectedPozlar([]);
    } catch (error) {
      console.error("Teslimat oluşturma hatası:", error);
      toast.current.show({ severity: 'error', summary: 'Hata', detail: error.message || error.toString(), life: 4000 });
    } finally {
      setIsCreating(false);
    }
  };

  // Kamera başlat
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => {
          setCameraActive(false);
        });
    } else if (videoRef.current && videoRef.current.srcObject) {
      // Kamera kapatılırsa stream'i durdur
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    // Kamera kapatıldığında temizlik
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive]);

  // Fotoğraf çek
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setPhoto(dataUrl);
      setCameraActive(false);
    }
  };

  // Sayfa ilk açıldığında müşteri ve sales orderları çek
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const data = await getCustomersWithUndeliveredCamItems();
        setCustomers(data);
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

  // Sevkiyat butonları sidebar açar
  const handleSevkiyatClick = (tip) => {
    setSevkiyatTipi(tip);
    setSidebarVisible(true);
  };

  // Pozlar tablosı için sadece sıralı veri (grup başlığı yok)
  const groupedPozlar = [...pvcPozlar, ...camPozlar];

  return (
    <div className='w-screen h-screen flex relative'>
      <Toast ref={toast} />
      {/* Sidebar */}
      <div style={{ width: 600, background: '#f4f4f4', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {/* Dropdownlar */}
        <div className='text-sm' style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
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
                  <DataTable
                    value={camPozlar}
                    emptyMessage="Ürün yok"
                    loading={loading}
                    className="text-xs"
                    style={{ fontSize: 12 }}
                    selection={selectedPozlar}
                    onSelectionChange={e => setSelectedPozlar(e.value)}
                    selectionMode="multiple"
                    rowSelectable={rowData => rowData.is_ready === 'Hazır'} // <-- sadece Hazır olanlar seçilebilir
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column field="item_code" header="Ürün Kodu" />
                    <Column field="item_name" header="Ürün Adı" />
                    <Column field="qty" header="Miktar" body={rowData =>  rowData.qty} />                    
                    <Column header="Durum" body={rowData => rowData.is_ready === 'Hazır' ? (<FaCheckCircle color="#22c55e" size={18} title="Hazır" />) : null} style={{ textAlign: 'center' }} />
                  </DataTable>
                </div>
              </div>
              {/* <div className='min-h-80' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
              </div> */}
            </div>
          
          </>
        )}
      </div>
      {/* Main Content */}
      <div className='w-full h-full flex-1 p-2 flex flex-col justify-between relative'>
        {/* PrimeReact Sidebar */}
        <Sidebar visible={sidebarVisible} position="right" style={{ width: 400 }} onHide={() => setSidebarVisible(false)}>
          <h3 className="text-lg font-bold mb-2">Teslim Formu</h3>
          <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleTeslimatFisOlustur(); }}>
            <div>
              <label className="block text-sm font-bold mb-1 text-red-600">Teslim Alan</label>
              <input
                type="text"
                value={teslimAlan}
                onChange={e => setTeslimAlan(e.target.value)}
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Teslim alan kişi adı"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-red-600">Araç Plakası</label>
              <input
                type="text"
                value={aracPlaka}
                onChange={e => {
                  const value = e.target.value.toUpperCase().replace(/\s+/g, '');
                  setAracPlaka(value);
                  // Plaka regex: 2 rakam, 1-3 harf, 3-4 rakam, boşluksuz
                  const regex = /^\d{2}[A-ZÇĞİÖŞÜ]{1,3}\d{3,4}$/;
                  if (value.length > 0 && !regex.test(value)) {
                    setPlakaError('Plaka formatı geçersiz. Örnek: 38AAA123 veya 34AB1234');
                  } else {
                    setPlakaError('');
                  }
                }}
                className={`border rounded px-2 py-1 w-full text-sm ${plakaError ? 'border-red-500' : ''}`}
                placeholder="38AAA123 veya 34AB1234"
                maxLength={9}
              />
              {plakaError && <span className="text-xs text-red-600 mt-1 block">{plakaError}</span>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-red-600">Teslim Fotoğrafı</label>
              {!photo && !cameraActive && (
                <Button label="Kamerayı Aç" className="p-button-info p-1 mb-2" onClick={() => setCameraActive(true)} />
              )}
              {cameraActive && (
                <div className="flex flex-col items-center gap-2">
                  <video ref={videoRef} width={320} height={240} autoPlay className="rounded border" />
                  <Button label="Fotoğraf Çek" className="p-button-success p-1" onClick={handleTakePhoto} />
                  <Button label="Kapat" className="p-button-secondary p-1" onClick={() => setCameraActive(false)} />
                </div>
              )}
              {photo && (
                <div className="flex flex-col items-center gap-2">
                  <img src={photo} alt="Teslim Fotoğrafı" className="rounded border w-[320px] h-[240px] object-contain" />
                  <Button label="Fotoğrafı Sil" className="p-button-danger p-1" onClick={() => setPhoto(null)} />
                </div>
              )}
              {/* Canvas gizli, sadece fotoğraf almak için */}
              <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
            </div>
            <div className="mt-4">
              <Button
                label="Teslimat Fişi Oluştur"
                className="p-button-success w-full"
                type="submit"
                loading={isCreating}
                disabled={isCreating || !teslimAlan || !!plakaError || selectedPozlar.length === 0}
              />
            </div>
          </form>
        </Sidebar>
        <div className=''>
          <h3>Ürün Görselleri</h3>
          <div
            className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6 bg-white p-4 rounded-lg shadow-sm overflow-y-auto 'style={{ maxHeight: 'calc(100svh - 120px)' }}
          >
            {products
              .filter(prod => prod.item_group === 'Cam' && pozItemCodes.includes(prod.item_code))
              .map((prod, idx) => {
                const imgName = prod.item_code ? prod.item_code.replace(/-/g, '') + '.jpg' : '';
                const imgSrc = imgName ? `/files/share/${imgName}` : '';
                return (
                  <div key={prod.item_code + idx} className='text-center overflow-auto'>
                    <img
                      src={imgSrc}
                      alt={prod.item_code}
                      className='w-[120px] h-[120px] object-contain border border-gray-200 rounded-lg bg-gray-50 mx-auto'
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
          <div className='w-full sticky bottom-0 left-0 z-20 p-0 flex flex-row justify-between items-center rounded-lg bg-slate-300'>
            {/* Sol: Toplam Doğrama (sadece PVC varsa) */}
            {pvcPozlar.length > 0 && (
              <div className='flex-1 p-1 rounded-lg lg:text-md text-xs font-bold text-red-700 '>
                Toplam Cam : --
              </div>
            )}
            {/* Sağ: Butonlar */}
            <div className=' flex-1 w-full p-2 md:text-md text-xs text-right items-center '>
              <Button
                label="Cam Sevkiyat"
                className="p-button-success  p-1"
                onClick={() => handleSevkiyatClick("Camlar")}
              />
              {/* <Button
                label="Camlar Sevkiyat"
                className="p-button-info p-1"
                onClick={() => handleSevkiyatClick("Camlar")}
              />
              <Button
                label="Detay"
                className="p-button-help p-1"
                onClick={() => setSidebarVisible(true)}
              /> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}