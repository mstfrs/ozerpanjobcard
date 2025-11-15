import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { FaCheckCircle } from 'react-icons/fa';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import { Dialog } from 'primereact/dialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { 
  getWorkOrderProducts, 
  getFiyat2ItemsForSalesOrder, 
  getSalesOrderItemsWithWorkOrderStatus, 
  getTotalCuttingForSalesOrders,
  createDeliveryNote, 
  getCustomersWithUndeliveredPVCItems,
  getDeliveredItemsByCustomerAndSalesOrders,
  getDeliveredItemCountsByCustomerAndSalesOrders
} from '../../../services/deliveryNoteService';

export default function PVCSevkiyat() {
  const toast = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedSalesOrders, setSelectedSalesOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fiyat2Items, setFiyat2Items] = useState([]);
  const [pozlar, setPozlar] = useState([]);
  const [selectedPozlar, setSelectedPozlar] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Miktar değişikliklerini takip etmek için state
  const [quantityChanges, setQuantityChanges] = useState({});
  // Toplam doğrama ve teslim edilen doğrama için state
  const [totalCuttingFromAPI, setTotalCuttingFromAPI] = useState(0);
  const [initialTotalCutting, setInitialTotalCutting] = useState(0);
  const [initialRemainingCutting, setInitialRemainingCutting] = useState(0);
  const [remainingCutting, setRemainingCutting] = useState(0);
  const [deliveredCutting, setDeliveredCutting] = useState(0);
  // Teslim Alan, Araç Plakası, Fotoğraf ve Sevkiyat Tipi için state
  const [teslimAlan, setTeslimAlan] = useState('');
  const [aracPlaka, setAracPlaka] = useState('');
  const [plakaError, setPlakaError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [sevkiyatTipi, setSevkiyatTipi] = useState(null); // "PVC" veya "Camlar"
  const [isAuxiliaryMaterialsDelivered, setIsAuxiliaryMaterialsDelivered] = useState(false); // Yardımcı malzemeler teslim edildi
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // Teslim edilen ürünler için state'ler
  const [deliveredItems, setDeliveredItems] = useState([]);
  const [showDeliveredItemsDialog, setShowDeliveredItemsDialog] = useState(false);
  const [isLoadingDeliveredItems, setIsLoadingDeliveredItems] = useState(false);

  // Teslimat fişi oluşturma işlemi
  const handleTeslimatFisOlustur = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCustomer || !sevkiyatTipi) return;
    if (!teslimAlan || plakaError) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Teslim alan ve plaka bilgisi geçerli olmalı.', life: 4000 });
      return;
    }
    
    // Seçili ürün kontrolü
    if (selectedPozlar.length === 0) {
      toast.current.show({ severity: 'error', summary: 'Hata', detail: 'Teslim edilecek ürün seçiniz.', life: 4000 });
      return;
    }
    
    setIsCreating(true);
    try {
      let photoUrl = null;
      if (photo) {
        // Fotoğrafı önce dosya olarak upload et
        const { uploadPhotoBase64 } = await import('../../../services/deliveryNoteService');
        photoUrl = await uploadPhotoBase64(photo, `delivery_${Date.now()}.png`);
      }
      
      // Seçili ürünlerin detaylarını al (değiştirilen miktarları kullan)
      const itemDetails = selectedPozlar.map(p => {
        const changedQty = quantityChanges[p.item_code];
        const finalQty = changedQty !== undefined ? changedQty : parseInt(p.qty) || 0;
        
        return {
          item_code: p.item_code,
          qty: finalQty,
          parent: p.parent
        };
      });
      
      // Seçili ürünlerin Sales Order'larını al
      const salesOrdersGroup = Array.from(new Set(selectedPozlar.map(p => p.parent)));
      const itemCodesGroup = selectedPozlar.map(p => p.item_code);
      
      // createDeliveryNote fonksiyonuna ek alanları da gönder
      const dnName = await createDeliveryNote(
        salesOrdersGroup,
        selectedCustomer,
        sevkiyatTipi,
        itemCodesGroup,
        null, // PVC için grand total hesaplanmıyor
        { 
          custom_recipient: teslimAlan, 
          custom_vehicle: aracPlaka, 
          custom_delivery_photo: photoUrl,
          custom_is_auxiliary_materials_delivered: isAuxiliaryMaterialsDelivered
        },
        itemDetails
      );
      toast.current.show({ severity: 'success', summary: 'Başarılı', detail: `Teslimat fişi oluşturuldu.`, life: 4000 });
      
      // Müşteri listesini yenile
      try {
        const updatedCustomers = await getCustomersWithUndeliveredPVCItems();
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
      setIsAuxiliaryMaterialsDelivered(false);
      setQuantityChanges({});
      setInitialTotalCutting(0);
      setInitialRemainingCutting(0);
      setRemainingCutting(0);
      setDeliveredCutting(0);
    } catch (error) {
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
        const data = await getCustomersWithUndeliveredPVCItems();
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
      setSelectedPozlar([]);
      return;
    }
    const customerObj = customers.find(c => c.value === selectedCustomer);
    setSalesOrders(customerObj ? customerObj.sales_orders : []);
    setSelectedSalesOrders([]);
    setProducts([]);
    setSelectedPozlar([]);
  }, [selectedCustomer, customers]);

  // Sales order seçilince ürünleri getir (tüm seçili siparişler için)
  useEffect(() => {
    async function fetchProducts() {
      if (!selectedSalesOrders.length) {
        setProducts([]);
        setSelectedPozlar([]);
        return;
      }
      setLoading(true);
      setSelectedPozlar([]);
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

  // Sales order seçilince API'den toplam doğrama alanını getir
  useEffect(() => {
    async function fetchTotalCuttingFromAPI() {
      if (!selectedSalesOrders.length) {
        setTotalCuttingFromAPI(0);
        setInitialTotalCutting(0);
        return;
      }
      try {
        const data = await getTotalCuttingForSalesOrders(selectedSalesOrders);
        setTotalCuttingFromAPI(data);
        setInitialTotalCutting(data);
      } catch (e) {
        setTotalCuttingFromAPI(0);
        setInitialTotalCutting(0);
      }
    }
    fetchTotalCuttingFromAPI();
  }, [selectedSalesOrders]);

  // PVC pozları değişince kalan doğrama hesapla (sadece ilk geldiğinde)
  useEffect(() => {
    const pvcPozlar = pozlar.filter(p => p.item_group === 'PVC');
    const initialRemaining = pvcPozlar.reduce((total, poz) => {
      const finalQty = parseInt(poz.qty) || 0;
      return total + finalQty;
    }, 0);
    setInitialRemainingCutting(initialRemaining);
    setRemainingCutting(initialRemaining);
  }, [pozlar]); // quantityChanges dependency'sini kaldırdık

  // Teslim edilen PVC sayılarını API'den al
  useEffect(() => {
    async function fetchDeliveredCounts() {
      if (!selectedCustomer || !selectedSalesOrders.length) {
        setDeliveredCutting(0);
        return;
      }
      
      try {
        const deliveredCounts = await getDeliveredItemCountsByCustomerAndSalesOrders(selectedCustomer, selectedSalesOrders);
        const pvcDelivered = deliveredCounts['PVC'] || 0;
        setDeliveredCutting(pvcDelivered);
      } catch (error) {
        console.error("Teslim edilen sayılar getirilirken hata:", error);
        setDeliveredCutting(0);
      }
    }
    
    fetchDeliveredCounts();
  }, [selectedCustomer, selectedSalesOrders]);

  // Sadece ilgili gruptaki siparişleri backend'e gönder
  const getGroupSalesOrders = (groupPozlar) => {
    // Her pozun parent'ı Sales Order kodu
    return Array.from(new Set(groupPozlar.map(p => p.parent)));
  };

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

  // Sevkiyat butonları sidebar açar
  const handleSevkiyatClick = (tip) => {
    setSevkiyatTipi(tip);
    setSidebarVisible(true);
  };

  // Teslim edilen ürünleri getir
  const handleShowDeliveredItems = async () => {
    if (!selectedCustomer || !selectedSalesOrders.length) {
      toast.current.show({ 
        severity: 'error', 
        summary: 'Hata', 
        detail: 'Müşteri ve sipariş seçiniz.', 
        life: 4000 
      });
      return;
    }

    setIsLoadingDeliveredItems(true);
    try {
      const data = await getDeliveredItemsByCustomerAndSalesOrders(selectedCustomer, selectedSalesOrders);
      setDeliveredItems(data);
      setShowDeliveredItemsDialog(true);
    } catch (error) {
      console.error("Teslim edilen ürünler getirilirken hata:", error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Hata', 
        detail: 'Teslim edilen ürünler getirilemedi.', 
        life: 4000 
      });
    } finally {
      setIsLoadingDeliveredItems(false);
    }
  };

  // Miktar değişikliklerini handle et
  const handleQuantityChange = (itemCode, newQuantity, maxQuantity) => {
    console.log('handleQuantityChange called:', { itemCode, newQuantity, maxQuantity });
    
    const numQuantity = parseInt(newQuantity) || 0;
    const numMaxQuantity = parseInt(maxQuantity) || 0;
    
    console.log('Parsed values:', { numQuantity, numMaxQuantity });
    
    // Minimum değer kontrolü
    if (numQuantity < 1) {
      toast.current.show({ 
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: 'Minimum değer 1 olmalıdır.', 
        life: 3000 
      });
      return;
    }
    
    // State'i güncelle
    setQuantityChanges(prev => {
      const newState = {
        ...prev,
        [itemCode]: numQuantity
      };
      console.log('New quantityChanges state:', newState);
      return newState;
    });
    
    // Maksimum değeri aştıysa uyarı ver (ama değeri kaydet)
    if (numQuantity > numMaxQuantity) {
      toast.current.show({ 
        severity: 'warn', 
        summary: 'Uyarı', 
        detail: `Önerilen maksimum değer: ${maxQuantity}`, 
        life: 3000 
      });
    }
  };

  const [activeAccordionIndex, setActiveAccordionIndex] = useState(0);

  // Pozlar tablosu için sadece sıralı veri (grup başlığı yok)
  const groupedPozlar = [...pvcPozlar, ...camPozlar];

  return (
    <div className='w-full h-screen flex relative bg-gray-50'>
      <Toast ref={toast} />
      
      {/* Teslimat Modal */}
      <Sidebar 
        visible={sidebarVisible} 
        position="right" 
        className="w-full sm:w-96"
        onHide={() => {
          setSidebarVisible(false);
          setSelectedPozlar([]);
          setCameraActive(false);
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        }}
        pt={{
          root: { className: 'h-screen' },
          content: { className: 'h-full overflow-y-auto' }
        }}
      >
        <form className="flex flex-col gap-3 h-full" onSubmit={e => { e.preventDefault(); handleTeslimatFisOlustur(); }}>
          <div className="flex-1 overflow-y-auto space-y-3">
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
                <Button 
                  label="Kamerayı Aç" 
                  className="p-button-info w-full" 
                  size="small"
                  onClick={() => setCameraActive(true)} 
                />
              )}
              {cameraActive && (
                <div className="flex flex-col items-center gap-2">
                  <video ref={videoRef} className="w-full max-w-xs rounded border" autoPlay />
                  <div className="flex gap-2 w-full">
                    <Button label="Çek" className="p-button-success flex-1" size="small" onClick={handleTakePhoto} />
                    <Button label="Kapat" className="p-button-secondary flex-1" size="small" onClick={() => setCameraActive(false)} />
                  </div>
                </div>
              )}
              {photo && (
                <div className="flex flex-col items-center gap-2">
                  <img src={photo} alt="Teslim Fotoğrafı" className="rounded border w-full max-w-xs object-contain" />
                  <Button label="Fotoğrafı Sil" className="p-button-danger w-full" size="small" onClick={() => setPhoto(null)} />
                </div>
              )}
              <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-red-600">
                <input
                  type="checkbox"
                  checked={isAuxiliaryMaterialsDelivered}
                  onChange={e => setIsAuxiliaryMaterialsDelivered(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                Yardımcı Malzemeler Teslim Edildi
              </label>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-3 border-t">
            <Button
              label="Teslimat Fişi Oluştur"
              className="p-button-success w-full"
              type="submit"
              loading={isCreating}
              disabled={isCreating || !teslimAlan || !!plakaError}
            />
          </div>
        </form>
      </Sidebar>

      {/* Sidebar - Sadece MD ve üstü ekranlarda */}
      <div className="hidden md:flex flex-col bg-gray-100 p-2" style={{ minWidth: 300 }}>
        <div className='space-y-3'>
          <div>
            <label className='text-red-500 font-bold text-sm'>Müşteri</label>
            <Dropdown
              value={selectedCustomer}
              options={customers}
              onChange={e => setSelectedCustomer(e.value)}
              placeholder="Müşteri seçin"
              style={{ width: '100%' }}
              loading={loading}
              className='text-sm'
            />
          </div>
          <div>
            <label className='text-red-500 font-bold text-sm'>Sales Order</label>
            <MultiSelect
              value={selectedSalesOrders}
              options={salesOrders}
              onChange={e => setSelectedSalesOrders(e.value)}
              placeholder="Sales Order seçin"
              style={{ width: '100%' }}
              disabled={!selectedCustomer}
              loading={loading}
              className='text-sm'
              display="chip"
            />
          </div>
        </div>
        
        {selectedSalesOrders.length > 0 && (
          <div className='flex-1 mt-3 flex flex-col gap-3 overflow-y-auto'>
            <div className='flex flex-col'>
              <h3 className='text-center text-sm font-bold text-red-500 mb-2'>POZLAR</h3>
              <DataTable 
                    value={pvcPozlar.filter(p => (parseFloat(p.qty) || 0) > 0)} 
                    emptyMessage="Ürün yok" 
                    loading={loading} 
                    className="text-xs" 
                dataKey="item_code"
                    selection={selectedPozlar}
                onSelectionChange={(e) => {
                  const validSelection = (e.value || []).filter(item => item.is_ready === 'Hazır' && (parseFloat(item.qty) || 0) > 0);
                  setSelectedPozlar(validSelection);
                }}
                    selectionMode="multiple"
                    rowSelectable={(data) => data.is_ready === 'Hazır' && (parseFloat(data.qty) || 0) > 0}
                rowClassName={(data) => data.is_ready !== 'Hazır' ? 'opacity-50' : ''}
                    scrollable
                scrollHeight="250px"
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column field="item_code" header="Ürün Kodu" />
                    <Column 
                      header="Miktar" 
                      body={rowData => {
                        if (rowData.item_group === 'Camlar') return '';
                    const isReady = rowData.is_ready === 'Hazır';
                        
                        return (
                          <input
                            key={`qty-${rowData.item_code}`}
                            type="number"
                            defaultValue={parseInt(rowData.qty) || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value < 1) {
                                toast.current.show({ 
                                  severity: 'warn', 
                                  summary: 'Uyarı', 
                                  detail: 'Minimum değer 1 olmalıdır.', 
                                  life: 3000 
                                });
                                return;
                              }
                              setQuantityChanges(prev => ({
                                ...prev,
                                [rowData.item_code]: value
                              }));
                            }}
                            min="1"
                            max={parseInt(rowData.qty) || 1}
                            step="1"
                        disabled={!isReady}
                        className={`w-16 text-xs border rounded px-1 py-0.5 text-center ${!isReady ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                          />
                        );
                      }}
                    />
                <Column 
                  header="Durum" 
                  body={rowData => rowData.is_ready === 'Hazır' ? (
                    <FaCheckCircle color="#22c55e" size={16} title="Hazır" />
                  ) : (
                    <span className="text-xs text-gray-500">Hazır Değil</span>
                  )} 
                  style={{ textAlign: 'center' }} 
                />
                  </DataTable>
                </div>
            
            <div className='flex flex-col'>
              <h3 className='text-center text-sm font-bold text-red-500 mb-2'>YARDIMCI ÜRÜNLER</h3>
                  <DataTable 
                    value={groupFiyat2Items(fiyat2Items)} 
                emptyMessage="Yardımcı Malzeme bulunamadı"
                    loading={loading}
                    scrollable
                    scrollHeight="200px"
                    className='text-xs'
                  >
                    <Column field="stock_code" header="Stok Kodu" />
                    <Column field="stock_name" header="Stok Adı" />
                    <Column field="qty" header="Miktar" />
                  </DataTable>
                </div>
              </div>
        )}
      </div>

      {/* Main Content - MD ve üstü için */}
      <div className='hidden md:flex flex-1 flex-col p-2 relative'>
        <div className='flex flex-row justify-between items-center mb-3'>
          <h3 className='text-red-500 text-lg font-bold'>Ürün Görselleri</h3>
              <Button
            label={`PVC Sevkiyat${selectedPozlar.length > 0 ? ` (${selectedPozlar.length})` : ''}`}
            className="p-button-success"
            size="small"
                onClick={() => handleSevkiyatClick("PVC")}
                disabled={selectedPozlar.length === 0}
              />
            </div>
        
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 bg-white p-4 rounded-lg shadow-sm'>
            {products
              .filter(prod => prod.item_group === 'PVC' && pozItemCodes.includes(prod.item_code))
              .map((prod, idx) => {
                const imgName = prod.item_code ? prod.item_code.replace(/-/g, '') + '.jpg' : '';
                const imgSrc = imgName ? `/files/share/${imgName}` : '';
                return (
                  <div key={prod.item_code + idx} className='text-center'>
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
        
        {selectedSalesOrders.length > 0 && pvcPozlar.length > 0 && (
          <div className='w-full sticky bottom-0 left-0 z-20 p-2 flex flex-row justify-between items-center rounded-lg bg-slate-300 mt-2'>
            <div className='flex-1 flex flex-row justify-between gap-2 text-sm font-bold text-red-700'>
                <div>Toplam Doğrama: {initialTotalCutting}</div>
                <div>Kalan Doğrama: {initialRemainingCutting}</div>
                <div 
                  className="cursor-pointer hover:underline hover:text-blue-700"
                  onClick={handleShowDeliveredItems}
                  title="Teslim edilen ürünleri görüntüle"
                >
                  Teslim Edilen Doğrama: {deliveredCutting}
              </div>
                </div>
              </div>
            )}
          </div>

      {/* Mobil Görünüm - Sadece MD altı ekranlarda Accordion */}
      <div className="md:hidden w-full p-2 space-y-3">
        {/* Üst Bilgi ve Buton */}
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <Button
              label={`Sevkiyat Yap${selectedPozlar.length > 0 ? ` (${selectedPozlar.length})` : ''}`}
              className="p-button-success w-full sm:w-auto"
              size="small"
                onClick={() => handleSevkiyatClick("PVC")}
                disabled={selectedPozlar.length === 0}
              />
          </div>
        </div>

        {/* Accordion Yapısı */}
        <Accordion activeIndex={activeAccordionIndex} onTabChange={(e) => setActiveAccordionIndex(e.index)}>
          {/* Müşteri Seçimi */}
          <AccordionTab header={
            <span className="font-bold text-red-600">
              Müşteri Seçimi {selectedCustomer && '✓'}
            </span>
          }>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-2 text-red-500">Müşteri</label>
                <Dropdown
                  value={selectedCustomer}
                  options={customers}
                  onChange={e => setSelectedCustomer(e.value)}
                  placeholder="Müşteri seçin"
                  className="w-full text-sm"
                  loading={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-red-500">Sales Order</label>
                <MultiSelect
                  value={selectedSalesOrders}
                  options={salesOrders}
                  onChange={e => setSelectedSalesOrders(e.value)}
                  placeholder="Sales Order seçin"
                  className="w-full text-sm"
                  disabled={!selectedCustomer}
                  loading={loading}
                  display="chip"
                />
              </div>
            </div>
          </AccordionTab>

          {/* Pozlar */}
          {selectedSalesOrders.length > 0 && (
            <AccordionTab header={
              <span className="font-bold text-red-600">
                PVC Pozlar ({pvcPozlar.filter(p => (parseFloat(p.qty) || 0) > 0).length})
              </span>
            }>
              <DataTable 
                value={pvcPozlar.filter(p => (parseFloat(p.qty) || 0) > 0)} 
                emptyMessage="Ürün yok" 
                loading={loading} 
                className="text-xs"
                dataKey="item_code"
                selection={selectedPozlar}
                onSelectionChange={(e) => {
                  const validSelection = (e.value || []).filter(item => item.is_ready === 'Hazır' && (parseFloat(item.qty) || 0) > 0);
                  setSelectedPozlar(validSelection);
                }}
                selectionMode="multiple"
                rowSelectable={(data) => data.is_ready === 'Hazır' && (parseFloat(data.qty) || 0) > 0}
                rowClassName={(data) => data.is_ready !== 'Hazır' ? 'opacity-50' : ''}
                scrollable
                scrollHeight="300px"
                responsiveLayout="scroll"
              >
                <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                <Column field="item_code" header="Ürün Kodu" style={{ minWidth: '120px' }} />
                <Column 
                  header="Miktar" 
                  style={{ minWidth: '80px' }}
                  body={rowData => {
                    if (rowData.item_group === 'Camlar') return '';
                    const isReady = rowData.is_ready === 'Hazır';
                    
                    return (
                      <input
                        key={`qty-${rowData.item_code}`}
                        type="number"
                        defaultValue={parseInt(rowData.qty) || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value < 1) {
                            toast.current.show({ 
                              severity: 'warn', 
                              summary: 'Uyarı', 
                              detail: 'Minimum değer 1 olmalıdır.', 
                              life: 3000 
                            });
                            return;
                          }
                          setQuantityChanges(prev => ({
                            ...prev,
                            [rowData.item_code]: value
                          }));
                        }}
                        min="1"
                        max={parseInt(rowData.qty) || 1}
                        step="1"
                        disabled={!isReady}
                        className={`w-16 text-xs border rounded px-1 py-0.5 text-center ${!isReady ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                      />
                    );
                  }}
                />
                <Column 
                  header="Durum" 
                  body={rowData => rowData.is_ready === 'Hazır' ? (
                    <FaCheckCircle color="#22c55e" size={16} title="Hazır" />
                  ) : (
                    <span className="text-xs text-gray-500">Hazır Değil</span>
                  )} 
                  style={{ textAlign: 'center', width: '80px' }} 
                />
              </DataTable>
            </AccordionTab>
          )}

          {/* Yardımcı Ürünler */}
          {selectedSalesOrders.length > 0 && (
            <AccordionTab header={
              <span className="font-bold text-red-600">
                Yardımcı Ürünler ({groupFiyat2Items(fiyat2Items).length})
              </span>
            }>
              <DataTable 
                value={groupFiyat2Items(fiyat2Items)} 
                emptyMessage="Yardımcı Malzeme bulunamadı"
                loading={loading}
                scrollable
                scrollHeight="300px"
                className="text-xs"
                responsiveLayout="scroll"
              >
                <Column field="stock_code" header="Stok Kodu" style={{ minWidth: '100px' }} />
                <Column field="stock_name" header="Stok Adı" style={{ minWidth: '150px' }} />
                <Column field="qty" header="Miktar" style={{ minWidth: '80px' }} />
              </DataTable>
            </AccordionTab>
          )}

          {/* Doğrama Bilgileri */}
          {selectedSalesOrders.length > 0 && pvcPozlar.length > 0 && (
            <AccordionTab header={
              <span className="font-bold text-red-600">
                Doğrama Bilgileri
              </span>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Toplam Doğrama</div>
                  <div className="text-xl font-bold text-blue-600">{initialTotalCutting}</div>
                  </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Kalan Doğrama</div>
                  <div className="text-xl font-bold text-orange-600">{initialRemainingCutting}</div>
        </div>
                <div 
                  className="bg-green-50 p-3 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={handleShowDeliveredItems}
                  title="Teslim edilen ürünleri görüntüle"
                >
                  <div className="text-xs text-gray-600 mb-1">Teslim Edilen</div>
                  <div className="text-xl font-bold text-green-600">{deliveredCutting}</div>
                </div>
              </div>
            </AccordionTab>
            )}
        </Accordion>
      </div>
      {/* Teslim Edilen Ürünler Dialog */}
      <Dialog 
        header="Teslim Edilen Ürünler" 
        visible={showDeliveredItemsDialog} 
        onHide={() => setShowDeliveredItemsDialog(false)}
        className="w-full mx-2 sm:w-11/12 lg:w-10/12"
        style={{ maxWidth: '1200px', maxHeight: '90vh' }}
        modal
        closable={true}
        contentClassName="overflow-y-auto"
        pt={{
          root: { className: 'max-h-screen' },
          content: { className: 'max-h-[70vh] overflow-y-auto' }
        }}
      >
        {deliveredItems.length > 0 ? (
          <div className="space-y-1">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-gray-200 border-b">
                    <th className="p-1 text-left whitespace-nowrap">Tarih</th>
                    <th className="p-1 text-left whitespace-nowrap">Teslim Alan</th>
                    <th className="p-1 text-left whitespace-nowrap">Araç Plakası</th>
                    <th className="p-1 text-center whitespace-nowrap">Yardımcı Malzemeler</th>
                    <th className="p-1 text-left whitespace-nowrap">Ürün Adı</th>
                    <th className="p-1 text-left whitespace-nowrap">Seri No</th>
                    <th className="p-1 text-left whitespace-nowrap">Renk</th>
                    <th className="p-1 text-left whitespace-nowrap">Son Müşteri</th>
                    <th className="p-1 text-center whitespace-nowrap">Ürün Sayısı</th>
                    <th className="p-1 text-right whitespace-nowrap">Toplam Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveredItems.map((dn, index) => {
                    const totalQty = dn.items.reduce((sum, item) => sum + (item.delivered_qty || 0), 0);
                    const postingDate = dn.posting_date ? new Date(dn.posting_date).toLocaleDateString('tr-TR') : '-';
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-1 whitespace-nowrap">{postingDate}</td>
                        <td className="p-1">{dn.custom_recipient || '-'}</td>
                        <td className="p-1 whitespace-nowrap">{dn.custom_vehicle || '-'}</td>
                        <td className="p-1 text-center">
                          <span className={`px-1 py-0.5 rounded text-xs whitespace-nowrap ${
                            dn.custom_is_auxiliary_materials_delivered 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dn.custom_is_auxiliary_materials_delivered ? 'Teslim Edildi' : 'Teslim Edilmedi'}
                          </span>
                        </td>
                        <td className="p-1">
                          {dn.items.length > 1 
                            ? `${dn.items[0]?.item_name || '-'} (+${dn.items.length - 1} ürün)` 
                            : dn.items[0]?.item_name || '-'
                          }
                        </td>
                        <td className="p-1">{dn.items[0]?.custom_serial || '-'}</td>
                        <td className="p-1">{dn.items[0]?.custom_color || '-'}</td>
                        <td className="p-1">{dn.items[0]?.custom_end_customer || '-'}</td>
                        <td className="p-1 text-center">{dn.items.length}</td>
                        <td className="p-1 text-right font-medium">{totalQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            Teslim edilen ürün bulunamadı.
          </div>
        )}
      </Dialog>
    </div>
  );
}