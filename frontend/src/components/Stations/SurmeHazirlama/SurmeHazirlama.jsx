import React, { useState, useCallback, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import useJobcardsStore from "../../../store/jobcardStore";
import Loading from "../../Loading";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import KitInfoCard from "../../Cards/KitInfo";
import RemarksInfo from "../../Cards/RemarksInfo";
import { getOrderDetails, getPozList, getPozDetails, updatePozStatus } from "../../../services/SurmeHazirlamaServices";
import { surmeLabelPrint } from "../../../services/PrintServices";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import CustomerInfoSurmeCard from "../../Cards/CustomerInfoSurme";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const PozCard = ({ poz, isSelected, onClick, orderNo }) => {
  // Status için renk belirleme
  const getStatusColor = (status) => {
    const colors = {
      "Pending": "border-yellow-400",
      "In Progress": "border-blue-400",
      "Completed": "border-green-400"
    };
    return colors[status] || "border-gray-400";
  };

  return (
    <div 
      className={`flex flex-col p-2 cursor-pointer transition-all duration-200 hover:bg-slate-100 rounded-lg mb-2
        ${isSelected ? 'bg-slate-200' : 'bg-white'} border-l-4 ${getStatusColor(poz.status)}`}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden rounded-lg">
        <img
          src={`/files/share/${(poz.poz_no).replace("-", "")}.jpg`}
          alt={`Poz ${poz.poz_no}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/files/share/noimage.png";
          }}
        />
        <div className="absolute top-2 right-2">
          <Tag 
            value={poz.status === "Pending" ? "Bekliyor" : poz.status === "In Progress" ? "İşlemde" : "Tamamlandı"} 
            severity={poz.status === "Pending" ? "warning" : poz.status === "In Progress" ? "info" : "success"}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-lg">Poz {(poz.poz_no).split("-")[1]}</span>
      
      </div>
    </div>
  );
};

const SurmeHazirlama = () => {
  const {
    employee,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
  } = useJobcardsStore();

  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPoz, setSelectedPoz] = useState(null);
  const queryClient = useQueryClient();

  // Siparişleri getiren query
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['surmeOrders'],
    queryFn: async () => {
      const response = await fetch('/api/method/ozerpan_ercom_sync.custom_api.api.get_surme_orders');
      const data = await response.json();
      return data.message.orders;
    },
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  });

  // Poz detaylarını getiren query
  const { data: pozDetails, isLoading: isPozDetailsLoading } = useQuery({
    queryKey: ['surmePozDetails', searchInput],
    queryFn: async () => {
      if (!searchInput) return null;
      const response = await fetch(`/api/method/ozerpan_ercom_sync.custom_api.api.get_surme_poz_by_order_no?order_no=${searchInput}`);
      const data = await response.json();
      return data.message;
    },
    enabled: !!searchInput,
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  });

  // Sipariş numarasına göre sorgu yapma
  const handleSearch = useCallback(async () => {
    if (!searchInput) {
      toast.current.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen sipariş numarası seçiniz',
        life: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      const [details, list] = await Promise.all([
        getOrderDetails(searchInput),
        // getPozList(searchInput)
      ]);
      
      setSelectedPoz(null);
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Sipariş bilgileri alınamadı',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [searchInput]);

  // Dropdown değişikliğinde otomatik arama
  useEffect(() => {
    if (searchInput) {
      setSelectedPoz(null); // Yeni sipariş seçildiğinde seçili pozu sıfırla
    }
  }, [searchInput]);

  // Poz seçildiğinde detayları gösterme
  const handlePozSelect = useCallback((poz) => {
    setSelectedPoz(poz);
  }, []);

  // İşlem durumunu güncelleme
  const handleStatusUpdate = useCallback(async (status) => {
    if (!selectedPoz) return;

    try {
      const response = await fetch('/api/method/ozerpan_ercom_sync.custom_api.api.update_surme_poz_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_no: searchInput,
          poz_no: selectedPoz.poz_no,
          status: status,
          employee: employee?.name
        })
      });

      if (!response.ok) {
        throw new Error('Status update failed');
      }

      // Query'yi yenile
      queryClient.invalidateQueries(['surmePozDetails', searchInput]);

      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'İşlem durumu güncellendi',
        life: 3000
      });
    } catch (error) {
      console.error('Status update error:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Durum güncellenemedi',
        life: 3000
      });
    }
  }, [searchInput, selectedPoz, employee, queryClient]);

  // Status için renk ve etiket belirleme
  const getStatusTag = (status) => {
    const statusConfig = {
      "Pending": { severity: "warning", label: "Bekliyor" },
      "In Progress": { severity: "info", label: "İşlemde" },
      "Completed": { severity: "success", label: "Tamamlandı" }
    };
    const config = statusConfig[status] || { severity: "secondary", label: status };
    return <Tag value={config.label} severity={config.severity} />;
  };

  // Etiket yazdırma fonksiyonu
  const handlePrintLabel = useCallback(async () => {
    if (!selectedPoz) {
      toast.current.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen bir poz seçiniz',
        life: 3000
      });
      return;
    }

    try {
      const printData = {
        ...pozDetails.order_poz_details[selectedPoz.poz_no],
        siparis_no: searchInput,
        poz_no: selectedPoz.poz_no
      };
      
      await surmeLabelPrint(printData);
      
      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Etiket yazdırma işlemi başarılı',
        life: 3000
      });
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Etiket yazdırma işlemi başarısız',
        life: 3000
      });
    }
  }, [selectedPoz, pozDetails, searchInput]);

  return (
    <div className="flex h-[calc(100vh-100px)] p-4 gap-4">
      <Toast ref={toast} />
      
      {/* Sol Panel - Arama ve Sipariş Bilgileri */}
      <div className="w-1/6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Dropdown
            value={searchInput}
            onChange={(e) => setSearchInput(e.value)}
            options={ordersData || []}
            placeholder="Sipariş No Seçiniz"
            className="w-full"
            loading={isOrdersLoading}
            filter
            showClear
          />
          
          {selectedPoz && (
            <Button 
              icon="pi pi-print" 
              label="Etiket Yazdır"
              onClick={handlePrintLabel}
              className="p-button-sm"
            />
          )}
        </div>

        {searchInput && (
          <CustomerInfoSurmeCard pozNo={selectedPoz?.poz_no} selectedPoz={pozDetails?.order_poz_details && Object.keys(pozDetails?.order_poz_details).length > 0 
            ? pozDetails.order_poz_details[Object.keys(pozDetails?.order_poz_details)[0]]
            : null} />
        )}

        {/* {pozDetails?.order_poz_details && Object.keys(pozDetails.order_poz_details).length > 0 && (
          <Card className="mt-2">
            <h3 className="text-lg font-semibold mb-2">Sipariş Bilgileri</h3>
            <div className="text-sm">
              {Object.entries(pozDetails.order_poz_details).map(([pozNo, details]) => (
                <div key={pozNo} className="mb-4">
                  <p><strong>Poz No:</strong> {pozNo}</p>
                  <p><strong>Cari Kod:</strong> {details.cari_kod}</p>
                  <p><strong>Bayi:</strong> {details.bayi_adi}</p>
                  <p><strong>Seri:</strong> {details.seri}</p>
                  <p><strong>Renk:</strong> {details.renk}</p>
                  <p><strong>Sipariş Tarihi:</strong> {details.siparis_tarihi}</p>
                  <p><strong>Sevkiyat Tarihi:</strong> {details.sevkiyat_tarihi}</p>
                </div>
              ))}
            </div>
          </Card>
        )} */}

        {/* {pozDetails?.job_card && (
          <Card className="mt-2">
            <h3 className="text-lg font-semibold mb-2">İş Emri Bilgileri</h3>
            <div className="text-sm">
              <p><strong>İş Emri No:</strong> {pozDetails.job_card.name}</p>
              <p><strong>Üretim Emri:</strong> {pozDetails.job_card.work_order}</p>
              <p><strong>BOM No:</strong> {pozDetails.job_card.bom_no}</p>
              <p><strong>Durum:</strong> {pozDetails.job_card.status}</p>
              <p><strong>Miktar:</strong> {pozDetails.job_card.for_quantity.parsedValue}</p>
              <p><strong>İş İstasyonu:</strong> {pozDetails.job_card.workstation}</p>
            </div>
          </Card>
        )} */}
      </div>

      {/* Orta Panel - Seçili Poz Detayları */}
      <div className="w-4/6 bg-white rounded-lg p-4 overflow-auto">
        {loading ? (
          <Loading />
        ) : selectedPoz && pozDetails?.order_poz_details?.[selectedPoz.poz_no]?.tesdetay ? (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg">
              <h2 className="text-xl font-bold mb-4 text-center">PROFİL KESİM LİSTESİ</h2>
              <DataTable
                value={pozDetails.order_poz_details[selectedPoz.poz_no].tesdetay}
                scrollable
                scrollHeight="calc(100vh - 200px)"
                showGridlines
                stripedRows
                size="small"
                className="p-datatable-sm text-xs"
              >
                <Column field="stok_kodu" header="Stok Kodu" style={{ width: '100px', fontSize: '0.75rem' }} />
                <Column field="profil" header="Açıklama" style={{ width: '300px', fontSize: '0.75rem' }} />
                <Column field="sanal_adet" header="Adet" style={{ width: '80px', fontSize: '0.75rem' }} />
                <Column header="Yatay" style={{ width: '100px', fontSize: '0.75rem' }} 
                  body={(rowData) => rowData.pozisyon === 'Y' ? rowData.olcu : ''} />
                <Column header="Dikey" style={{ width: '100px', fontSize: '0.75rem' }} 
                  body={(rowData) => rowData.pozisyon === 'D' ? rowData.olcu : ''} />
                <Column header="K.Açısı" style={{ width: '100px', fontSize: '0.75rem' }} 
                  body={(rowData) => `${rowData.aci1}°/${rowData.aci2}°`} />
                <Column field="ds_boyu" header="D.Sacı" style={{ width: '100px', fontSize: '0.75rem' }} />
              </DataTable>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Poz seçimi yapınız
          </div>
        )}
      </div>

      {/* Sağ Panel - Poz Listesi */}
      <div className="w-1/6 bg-slate-50 rounded-lg p-2 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {isPozDetailsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loading />
            </div>
          ) : pozDetails?.order_poz_details ? (
            <div className="space-y-2 px-2">
              {Object.entries(pozDetails.order_poz_details).map(([pozNo, details]) => (
                <PozCard
                  key={pozNo}
                  poz={{
                    poz_no: pozNo,
                    ...details
                  }}
                  isSelected={selectedPoz?.poz_no === pozNo}
                  onClick={() => handlePozSelect({
                    poz_no: pozNo,
                    ...details
                  })}
                  orderNo={searchInput}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Poz bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurmeHazirlama; 