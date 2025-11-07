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
import { Dialog } from 'primereact/dialog';
// import { InputMask } from 'primereact/inputmask';
import { 
  getWorkOrderProducts, 
  getFiyat2ItemsForSalesOrder, 
  getSalesOrderItemsWithWorkOrderStatus, 
  getTotalCuttingForSalesOrders,
  createDeliveryNote, 
  getCustomersWithUndeliveredCamItems,
  getGlassTypesBySalesOrders,
  getCamListeItemsBySalesOrders,
  getDeliveredCamItemsByCustomerAndSalesOrders,
  getDeliveredItemCountsByCustomerAndSalesOrders,
  getDeliveredQtyByItemCodes
} from '../../../services/deliveryNoteService';

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
  const [glassTypes, setGlassTypes] = useState([]); // Cam çeşitleri için state
  const [camListeItems, setCamListeItems] = useState([]); // CamListe detaylı verileri için state
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
  const [isAuxiliaryMaterialsDelivered, setIsAuxiliaryMaterialsDelivered] = useState(false); // Yardımcı malzemeler teslim edildi
  // Miktar değişikliklerini takip etmek için state - PVCSevkiyat'tan kopyalandı
  const [quantityChanges, setQuantityChanges] = useState({});
  // Cam miktarlarını takip etmek için state'ler - PVCSevkiyat'tan kopyalandı
  const [totalCamQty, setTotalCamQty] = useState(0);
  const [initialTotalCamQty, setInitialTotalCamQty] = useState(0);
  const [initialRemainingCamQty, setInitialRemainingCamQty] = useState(0);
  const [remainingCamQty, setRemainingCamQty] = useState(0);
  const [deliveredCamQty, setDeliveredCamQty] = useState(0);
  // Teslim edilen ürünler için state'ler
  const [deliveredItems, setDeliveredItems] = useState([]);
  const [showDeliveredItemsDialog, setShowDeliveredItemsDialog] = useState(false);
  const [isLoadingDeliveredItems, setIsLoadingDeliveredItems] = useState(false);
  const [deliveredQtyByItem, setDeliveredQtyByItem] = useState({});

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
      
      // Seçili ürünlerin detaylarını al (değiştirilen miktarları kullan) - PVCSevkiyat'tan kopyalandı
      const itemDetails = selectedPozlar.map(p => {
        const changedQty = quantityChanges[p.item_code];
        const finalQty = changedQty !== undefined ? changedQty : parseInt(p.qty) || 0;
        
        return {
          item_code: p.item_code,
          qty: finalQty,
          parent: p.parent
        };
      });
      
      await createDeliveryNote(
        salesOrdersGroup,
        selectedCustomer,
        sevkiyatTipi,
        null, // itemCodes - kullanılmıyor
        null, // grandTotal - kullanılmıyor
        { 
          custom_recipient: teslimAlan, 
          custom_vehicle: aracPlaka, 
          custom_delivery_photo: photoUrl,
          custom_is_auxiliary_materials_delivered: isAuxiliaryMaterialsDelivered
        },
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
      setIsAuxiliaryMaterialsDelivered(false);
      setQuantityChanges({}); // Quantity changes'i temizle
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

  // Teslim edilen cam sayılarını API'den al
  useEffect(() => {
    async function fetchDeliveredCounts() {
      if (!selectedCustomer || !selectedSalesOrders.length) {
        setDeliveredCamQty(0);
        return;
      }
      
      try {
        const deliveredCounts = await getDeliveredItemCountsByCustomerAndSalesOrders(selectedCustomer, selectedSalesOrders);
        const camDelivered = deliveredCounts['Camlar'] || 0;
        setDeliveredCamQty(camDelivered);
      } catch (error) {
        console.error("Teslim edilen cam sayıları getirilirken hata:", error);
        setDeliveredCamQty(0);
      }
    }
    
    fetchDeliveredCounts();
  }, [selectedCustomer, selectedSalesOrders]);

  // Teslim edilen miktarları al
  useEffect(() => {
    async function fetchDeliveredQty() {
      if (!selectedCustomer || !selectedSalesOrders.length || !pozlar.length) {
        setDeliveredQtyByItem({});
        return;
      }
      
      try {
        const itemCodes = pozlar.map(item => item.item_code);
        const deliveredQty = await getDeliveredQtyByItemCodes(selectedCustomer, selectedSalesOrders, itemCodes);
        setDeliveredQtyByItem(deliveredQty);
      } catch (error) {
        console.error("Teslim edilen miktarlar getirilirken hata:", error);
        setDeliveredQtyByItem({});
      }
    }
    
    fetchDeliveredQty();
  }, [selectedCustomer, selectedSalesOrders, pozlar]);

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

  // Sales order seçilince cam çeşitlerini getir
  useEffect(() => {
    async function fetchGlassTypes() {
      if (!selectedSalesOrders.length) {
        setGlassTypes([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getGlassTypesBySalesOrders(selectedSalesOrders);
        setGlassTypes(data);
      } catch (e) {
        setGlassTypes([]);
      }
      setLoading(false);
    }
    fetchGlassTypes();
  }, [selectedSalesOrders]);

  // Sales order seçilince CamListe detaylı verilerini getir
  useEffect(() => {
    async function fetchCamListeItems() {
      if (!selectedSalesOrders.length) {
        setCamListeItems([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getCamListeItemsBySalesOrders(selectedSalesOrders);
        setCamListeItems(data);
      } catch (e) {
        setCamListeItems([]);
      }
      setLoading(false);
    }
    fetchCamListeItems();
  }, [selectedSalesOrders]);

  // Cam çeşitlerinden toplam cam miktarını hesapla
  useEffect(() => {
    if (glassTypes.length > 0) {
      const total = glassTypes.reduce((sum, item) => {
        return sum + (item.record_count || 0);
      }, 0);
      setInitialTotalCamQty(total);
      setTotalCamQty(total);
    } else {
      setInitialTotalCamQty(0);
      setTotalCamQty(0);
    }
  }, [glassTypes]);

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
  const allPvcReady = pozlar.filter(p => p.item_group === 'PVC').length > 0 && pozlar.filter(p => p.item_group === 'PVC').every(p => p.is_ready === 'Hazır');
  const allCamReady = pozlar.filter(p => p.item_group === 'Camlar').length > 0 && pozlar.filter(p => p.item_group === 'Camlar').every(p => p.is_ready === 'Hazır');

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
      const data = await getDeliveredCamItemsByCustomerAndSalesOrders(selectedCustomer, selectedSalesOrders);
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

  // Pozlar verisini teslim edilen miktarları düşürerek güncelle
  const updatedPozlar = pozlar.map(poz => {
    const deliveredQty = (deliveredQtyByItem && deliveredQtyByItem[poz.item_code]) || 0;
    const originalQty = parseInt(poz.qty) || 0;
    const remainingQty = Math.max(0, originalQty - deliveredQty);
  
    
    return {
      ...poz,
      qty: remainingQty.toString() // String olarak döndür çünkü orijinal veri de string
    };
  });

  // Güncellenmiş pozlar verisinden cam pozlarını al
  const camPozlar = updatedPozlar.filter(p => p.item_group === 'Camlar');
  const pvcPozlar = updatedPozlar.filter(p => p.item_group === 'PVC');

  // Kalan cam miktarını hesapla
  const totalRemainingCam = camPozlar.reduce((total, poz) => {
    return total + (parseInt(poz?.qty) || 0);
  }, 0);

 

  // Pozlar tablosı için sadece sıralı veri (grup başlığı yok)
  const groupedPozlar = [...pvcPozlar, ...camPozlar];

  // Kalan cam miktarını state'e set et
  React.useEffect(() => {
    console.log('Setting remainingCamQty to:', totalRemainingCam);
    setRemainingCamQty(totalRemainingCam);
  }, [totalRemainingCam]);

  // Kalan miktarı hesapla (teslim edilen miktarı çıkar)
  const calculateRemainingQty = (itemCode, originalQty) => {
    // Bu ürün kodunun teslim edilen miktarını bul
    const deliveredForThisItem = (deliveredQtyByItem && deliveredQtyByItem[itemCode]) || 0;
    const remaining = Math.max(0, originalQty - deliveredForThisItem);
    return remaining;
  };

  return (
    <div className='w-screen h-screen flex relative overflow-hidden'>
      <Toast ref={toast} />
      {/* Sidebar */}
      <div style={{ background: '#f4f4f4', padding: 10, display: 'flex', flexDirection: 'column' }}>
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
            {/* Cam Çeşitleri ve Adetleri */}
            <div className='min-h-40' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 className='text-center text-sm lg:text-lg text-red-500 font-bold'>CAM ÇEŞİTLERİ VE ADETLERİ</h3>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <DataTable 
                  value={glassTypes} 
                  emptyMessage="Cam çeşidi bulunamadı" 
                  loading={loading} 
                  className="text-xs" 
                  style={{ fontSize: 12 }}
                  scrollable
                  scrollHeight="150px"
                >
                  <Column field="type" header="Cam Çeşidi" />
                  <Column field="record_count" header="Miktar" />
          
                </DataTable>
              </div>
            </div>
            {/* Tablolar alt alta ve scroll'lu */}
            <div className='h-full' style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className='text-center text-sm lg:text-lg text-red-500 font-bold'>POZLAR</h3>
                <div style={{ fontSize: 13, flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <DataTable
                    value={camPozlar}
                    emptyMessage="Ürün yok"
                    loading={loading}
                    className="text-xs"
                    style={{ fontSize: 12 }}
                    selection={selectedPozlar}
                    onSelectionChange={(e) => {
                      // Sadece Hazır olan ürünleri seçime izin ver
                      const validSelection = e.value.filter(item => 
                        item.is_ready === 'Hazır' && (parseFloat(item.qty) || 0) > 0
                      );
                      setSelectedPozlar(validSelection);
                    }}
                    selectionMode="multiple"
                    dataKey="item_code"
                    rowClassName={(data) => data.is_ready !== 'Hazır' ? 'opacity-50 cursor-not-allowed' : ''}
                    scrollable
                    scrollHeight="200px"
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column field="item_code" header="Ürün Kodu" />
                    {/* <Column field="item_name" header="Ürün Adı" /> */}
                    <Column 
                      header="Miktar" 
                      body={rowData => {
                        if (rowData.item_group !== 'Camlar') return '';
                        
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
                            max={parseInt(rowData.qty) || 0}
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
      <div className='flex-1 p-2 flex flex-col justify-between relative overflow-hidden'>
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
                disabled={isCreating || !teslimAlan || !!plakaError || selectedPozlar.length === 0}
              />
            </div>
          </form>
        </Sidebar>
        <div className='flex flex-col gap-4 h-full overflow-hidden'>
          <div className='flex flex-row justify-between items-center'>
            <div className='flex flex-col'>
              <h3 className='text-red-500 text-sm lg:text-lg font-bold'>Cam Listesi</h3>
              {/* Cam Çeşitleri Bilgisi */}
              {/* {glassTypes.length > 0 && (
                <div className='text-xs text-gray-600 mt-1'>
                  <span className='font-semibold'>Cam Çeşitleri:</span>
                  {glassTypes.map((type, idx) => (
                    <span key={idx} className='ml-2'>
                      {type.type} ({type.remaining_qty}/{type.total_qty})
                    </span>
                  ))}
                </div>
              )} */}
            </div>
            {/* Sağ: Butonlar */}
            <div className=' flex-1 w-full p-2 md:text-md text-xs text-right items-center '>
              <Button
                label={`Cam Sevkiyat${selectedPozlar.length > 0 ? ` (${selectedPozlar.length} ürün)` : ''}`}
                className="p-button-success  p-1"
                onClick={() => handleSevkiyatClick("Camlar")}
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
          <div className='flex flex-col gap-4 flex-1 overflow-hidden'>
            {/* CamListe Detaylı Verileri */}
            {camListeItems.length > 0 && (
              <div className='bg-white p-4 rounded-lg shadow-sm flex-1 overflow-hidden'>
                {/* <h3 className='text-red-500 text-sm lg:text-lg font-bold mb-3'>CamListe Detayları</h3> */}
                <div className='overflow-x-auto h-full'>
                  <DataTable 
                    value={camListeItems} 
                    emptyMessage="Cam verisi bulunamadı" 
                    loading={loading} 
                    className="text-xs" 
                    style={{ fontSize: 12 }}
                    scrollable
                    scrollHeight={`calc(100vh - 80px)`}
                 
                  >
                    <Column field="poz_no" header="Poz No"  />
                    <Column field="stok_kodu" header="Stok Kodu"  />
                    <Column field="genislik" header="Genişlik"  body={rowData => rowData.genislik ? `${rowData.genislik} mm` : '-'} />
                    <Column field="yukseklik" header="Yükseklik"  body={rowData => rowData.yukseklik ? `${rowData.yukseklik} mm` : '-'} />
                    <Column field="aciklama" header="Cam Çeşidi" sortable />
              
                  </DataTable>
                </div>
              </div>
            )}
            
         
          </div>
        </div>
        {/* Sticky cam miktarları bildirim alanı */}
        {selectedSalesOrders.length > 0 && (
          <div className='w-full sticky bottom-0 left-0 z-20 p-0 flex flex-row justify-between items-center rounded-lg bg-slate-300'>
            {/* Sol: Cam Miktarları Bilgileri */}
            {camPozlar.length > 0 && (
              <div className='flex-1 p-1 rounded-lg lg:text-md text-xs font-bold text-red-700 flex flex-row justify-between gap-1'>
                <div>Toplam Cam: {initialTotalCamQty}</div>
                <div>Kalan Cam: {totalRemainingCam}</div>
                <div 
                  className="cursor-pointer hover:underline hover:text-blue-700"
                  onClick={handleShowDeliveredItems}
                  title="Teslim edilen cam ürünlerini görüntüle"
                >
                  Teslim Edilen Cam: {deliveredCamQty}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Teslim Edilen Ürünler Dialog */}
      <Dialog 
        header="Teslim Edilen Cam Ürünler" 
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
                    <th className="p-1 text-left">Müşteri</th>
              
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
            Teslim edilen cam ürün bulunamadı.
          </div>
        )}
      </Dialog>
    </div>
  );
}