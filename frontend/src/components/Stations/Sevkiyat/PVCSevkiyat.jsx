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

  // Pozlar tablosu için sadece sıralı veri (grup başlığı yok)
  const groupedPozlar = [...pvcPozlar, ...camPozlar];

  return (
    <div className='w-screen h-screen flex relative'>
      <Toast ref={toast} />
      {/* Sidebar */}
      <div style={{  background: '#f4f4f4', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {/* Dropdownlar */}
        <div className='text-xs lg:text-sm' style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
          <div className='min-w-[200px] lg:min-w-[240px]'>
            <label className='text-red-500 font-bold text-xs lg:text-sm'>Müşteri</label>
            <Dropdown
              value={selectedCustomer}
              options={customers}
              onChange={e => {
                setSelectedCustomer(e.value);
              }}
              placeholder="Müşteri seçin"
              style={{ width: '100%' }}
              loading={loading}
              className='text-xs lg:text-sm'
              pt={{
                input: { className: 'text-xs lg:text-sm' },
                list: { className: 'text-xs lg:text-sm' },
                item: { className: 'text-xs lg:text-sm' }
              }}
            />
          </div>
          <div className='min-w-[280px] lg:min-w-[320px]'>
            <label className=' text-red-500 font-bold text-xs lg:text-sm'>Sales Order</label>
            <MultiSelect
              value={selectedSalesOrders}
              options={salesOrders}
              onChange={e => setSelectedSalesOrders(e.value)}
              placeholder="Sales Order seçin"
              style={{ width: '100%' }}
              disabled={!selectedCustomer}
              loading={loading}
              className='text-xs lg:text-sm'
              pt={{
                input: { className: 'text-xs lg:text-sm' },
                list: { className: 'text-xs lg:text-sm' },
                item: { className: 'text-xs lg:text-sm' },
                token: { className: 'text-xs lg:text-sm' }
              }}
            />
          </div>
        </div>
        {/* Tablolar ve toplam doğrama alanı sadece sipariş seçiliyse görünsün */}
        {selectedSalesOrders.length > 0 && (
          <>
            {/* Tablolar alt alta ve scroll'lu */}
            <div className='h-full' style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className='text-center text-sm lg:text-lg text-red-500 font-bold'>POZLAR</h3>
                <div style={{ fontSize: 13, flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <DataTable 
                    value={pvcPozlar} 
                    emptyMessage="Ürün yok" 
                    loading={loading} 
                    className="text-xs" 
                    style={{ fontSize: 12 }}
                    selection={selectedPozlar}
                    onSelectionChange={(e) => setSelectedPozlar(e.value)}
                    selectionMode="multiple"
                    rowSelectable={(data) => data.is_ready === 'Hazır'}
                    scrollable
                    scrollHeight="200px"
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column field="item_code" header="Ürün Kodu" />
                    <Column field="item_name" header="Ürün Adı" />
                    <Column 
                      header="Miktar" 
                      body={rowData => {
                        if (rowData.item_group === 'Camlar') return '';
                        
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
                            className="w-16 text-xs border rounded px-1 py-0.5 text-center"
                            style={{ fontSize: '11px' }}
                          />
                        );
                      }}
                    />
                    <Column header="Durum" body={rowData => rowData.is_ready === 'Hazır' ? (<FaCheckCircle color="#22c55e" size={18} title="Hazır" />) : null} style={{ textAlign: 'center' }} />
                  </DataTable>
                </div>
              </div>
              <div className='min-h-60' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className='text-center text-sm lg:text-lg text-red-500 font-bold'>YARDIMCI ÜRÜNLER</h3>
                <div style={{  flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <DataTable 
                    value={groupFiyat2Items(fiyat2Items)} 
                    emptyMessage="Yardımcı Malzeme bulunamadı "
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
            </div>
          
          </>
        )}
      </div>
      {/* Main Content */}
      <div className='w-full h-full flex-1 p-2 flex flex-col justify-between relative'>
        {/* PrimeReact Sidebar */}
        <Sidebar visible={sidebarVisible} position="right" style={{ width: 400 }} onHide={() => {
          setSidebarVisible(false);
          setSelectedPozlar([]);
          // Kamera kapatma işlemi
          setCameraActive(false);
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        }}>
        
            <form className="flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleTeslimatFisOlustur(); }}>
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
            <div className="mt-4">
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
        <div className=''>
         <div className='flex flex-row justify-between items-center'>
         <h3 className='text-red-500 text-sm lg:text-lg font-bold'>Ürün Görselleri</h3>
             {/* Sağ: Butonlar */}
             <div className=' flex-1 w-full p-2 md:text-md text-xs text-right items-center '>
              <Button
                label={`PVC Sevkiyat${selectedPozlar.length > 0 ? ` (${selectedPozlar.length} ürün)` : ''}`}
                className="p-button-success  p-1"
                onClick={() => handleSevkiyatClick("PVC")}
                disabled={selectedPozlar.length === 0}
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
          <div
            className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6 bg-white p-4 rounded-lg shadow-sm overflow-y-auto 'style={{ maxHeight: 'calc(100svh - 120px)' }}
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
            {/* Sol: Doğrama Bilgileri */}
            {pvcPozlar.length > 0 && (
              <div className='flex-1 p-1 rounded-lg lg:text-md text-xs font-bold text-red-700 flex flex-row justify-between gap-1'>
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
            )}
          </div>
        )}
      </div>
      {/* Teslim Edilen Ürünler Dialog */}
      <Dialog 
        header="Teslim Edilen Ürünler" 
        visible={showDeliveredItemsDialog} 
        onHide={() => setShowDeliveredItemsDialog(false)}
        style={{ width: '80vw', maxWidth: '1000px' }}
        modal
        closable={true}
        onMaskClick={() => setShowDeliveredItemsDialog(false)}
      >
        {deliveredItems.length > 0 ? (
          <div className="space-y-1">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-200 border-b">
                    <th className="p-1 text-left">Tarih</th>
                    <th className="p-1 text-left">Teslim Alan</th>
                    <th className="p-1 text-left">Araç Plakası</th>
                    <th className="p-1 text-center">Yardımcı Malzemeler</th>
                    <th className="p-1 text-left">Ürün Adı</th>
                    <th className="p-1 text-left">Seri No</th>
                    <th className="p-1 text-left">Renk</th>
                    <th className="p-1 text-left">Son Müşteri</th>
                    <th className="p-1 text-center">Ürün Sayısı</th>
                    <th className="p-1 text-right">Toplam Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveredItems.map((dn, index) => {
                    const totalQty = dn.items.reduce((sum, item) => sum + (item.delivered_qty || 0), 0);
                    const postingDate = dn.posting_date ? new Date(dn.posting_date).toLocaleDateString('tr-TR') : '-';
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-1">{postingDate}</td>
                        <td className="p-1">{dn.custom_recipient || '-'}</td>
                        <td className="p-1">{dn.custom_vehicle || '-'}</td>
                        <td className="p-1 text-center">
                          <span className={`px-1 py-0.5 rounded text-xs ${
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