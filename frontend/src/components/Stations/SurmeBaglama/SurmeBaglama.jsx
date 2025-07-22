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
import { getOrderDetails, getPozList, getPozDetails, updatePozStatus, getSurmeOrderJobcard, getFiyat2List } from "../../../services/SurmeHazirlamaServices";
import { surmeLabelPrint } from "../../../services/PrintServices";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import CustomerInfoSurmeCard from "../../Cards/CustomerInfoSurme";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';


const PozCard = ({ poz, isSelected, onClick, orderNo }) => {
// console.log(poz)
  
  // Status için renk belirleme
  const getStatusColor = (status) => {
    const colors = {
      "Open": "border-yellow-400",
      "Work In Progress": "border-blue-400",
      "Completed": "border-green-400"
    };
    return colors[status] || "border-gray-400";
  };

  return (
    <div 
      className={`flex flex-col p-2 cursor-pointer transition-all duration-200  rounded-lg mb-2
        ${isSelected ? 'bg-red-300' : 'bg-white'} border-l-4 ${getStatusColor(poz?.job_card?.status)}`}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <img
          src={`/files/share/${(poz.poz_no).replace("-", "")}.jpg`}
          alt={`Poz ${poz.poz_no}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = "/files/share/noimage.png";
          }}
        />
        <div className="absolute top-2 right-2">
          {/* <Tag 
             value={poz?.job_card?.status === "Open" ? "Yeni" : poz?.job_card?.status=== "Work In Progress" ? "İşlemde" : poz?.job_card?.status=== "On Hold" ? "Duraklatıldı":"Tamamlandı"} 
             severity={poz?.job_card?.status === "Open" ? "warning" : poz?.job_card?.status === "Work In Progress" ? "info" : poz?.job_card?.status === "On Hold" ? "help": "success"}
          /> */}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-lg">Poz {(poz.poz_no).split("-")[1]}</span>
      
      </div>
    </div>
  );
};

const SurmeBaglama = () => {
  const {
    employee,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
    setCurrentJobcardStatus,
    currentJobcardStatus,
    refetchPozDetailsFlag
  } = useJobcardsStore();

  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPoz, setSelectedPoz] = useState(null);
  const [surmeItems, setSurmeItems] = useState()
  const queryClient = useQueryClient();
  const [pdfUrl, setPdfUrl] = useState(null);

  // Siparişleri getiren query
  const { data: ordersData, isLoading: isOrdersLoading, refetch: refetchSurmeOrders } = useQuery({
    queryKey: ['surmeOrders', currentOperation],
    queryFn: async () => {
      const response = await fetch('/api/method/ozerpan_ercom_sync.custom_api.api.get_surme_orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation_type: currentOperation.operations,
        }),
      });
      const data = await response.json();
      return data.message.orders;
    },
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  });

  // Poz detaylarını getiren query
  const { data: pozDetails, isLoading: isPozDetailsLoading, refetch: refetchPozDetails } = useQuery({
    queryKey: ['surmePozDetails', searchInput],
    queryFn: async () => {
      if (!searchInput) return null;
      const response = await fetch('/api/method/ozerpan_ercom_sync.custom_api.api.get_surme_poz_by_order_no', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          operation_type: currentOperation.operations,
          order_no: searchInput
        }),
      });
      const data = await response.json();
   
      return data.message;
    },
    enabled: !!searchInput,
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  });

  // // Dropdown değişikliğinde otomatik arama
  // useEffect(() => {
  //   const handleJobcardOnHold = async () => {
  //     if (currentJobcard?.status === "Work In Progress") {
  //       await JobCardAction(currentJobcard, employee, "Başka işe geçildi");
  //       toast.current.show({
  //         severity: "info",
  //         summary: "Duraklatıldı",
  //         detail: "Önceki iş kartı duraklatıldı: Başka işe geçildi",
  //         life: 3000,
  //       });
  //     }
  //   };

  //   if (searchInput) {
  //     handleJobcardOnHold();
  //     setSelectedPoz(null); // Yeni sipariş seçildiğinde seçili pozu sıfırla
  //   }
  // }, [searchInput, currentJobcard, employee]);

  // Poz seçildiğinde detayları gösterme ve PDF'i yükleme
  const handlePozSelect = useCallback((poz) => {
    setSelectedPoz(poz);
    // PDF URL'ini oluştur
    const pdfPath = `/files/share/${(poz.poz_no).split("-")[0]}.pdf`;
    setPdfUrl(pdfPath);
    
    // Poz seçildiğinde jobcard bilgilerini güncelle
    queryClient.setQueryData(['surmePozDetails', searchInput], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        job_card: {
          ...oldData.job_card,
          name: poz.job_card_name
        }
      };
    });

      
     refetchPozDetails(); // Poz seçildiğinde detayları tekrar fetch et
     setCurrentJobcard([poz?.job_card?.name])
      setCurrentJobcardStatus(poz?.job_card?.status)
  }, [searchInput, queryClient, refetchPozDetails]);

  const handleOrderSelect = useCallback(async(order_no) => {
  const data=await getFiyat2List(order_no)
  setSurmeItems(data)
      
   
  }, []);

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
      
      await surmeLabelPrint(printData,surmeItems?.items);
      
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

  useEffect(() => {
    refetchPozDetails();
    refetchSurmeOrders();
  }, [refetchPozDetailsFlag]);

  return (
    <div className="flex h-screen p-4 gap-4">
      <Toast ref={toast} />
      
      {/* Sol Panel - Arama ve Sipariş Bilgileri */}
      <div className="w-1/6 flex flex-col gap-4 overflow-auto">
        <div className="flex flex-col gap-2">
          <Dropdown
            value={searchInput}
            onChange={(e) => {setSearchInput(e.value),
              handleOrderSelect(e.value),
              setPdfUrl(),
              setSelectedPoz()
            }}
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
              className="bg-green-500 w-full text-white p-1 rounded-md"
            />
          )}
        </div>

        {searchInput &&  (
       <>
          <CustomerInfoSurmeCard pozNo={selectedPoz?.poz_no} selectedPoz={pozDetails?.order_poz_details && Object.keys(pozDetails?.order_poz_details).length > 0 
            ? pozDetails.order_poz_details[Object.keys(pozDetails?.order_poz_details)[0]]
            : null} />
            <DataTable value={surmeItems?.items} className="text-xs w-full"  >
    <Column field="stock_code" header="Stok Kodu"></Column>
    <Column field="stock_name" header="Ürün Adı"></Column>
    <Column field="qty" header="Miktar"></Column>
</DataTable></>
        )}
      </div>

      {/* Orta Panel - Seçili Poz Detayları ve PDF */}
      <div className="w-4/6 bg-white rounded-lg p-4 overflow-auto">
        {loading ? (
          <Loading />
        ) : selectedPoz ? (
          <div className="flex flex-col gap-4">
            {pdfUrl ? (
              <iframe
                src={pdfUrl + "#toolbar=0"}
                title="Poz PDF"
                className="w-full"
                style={{ minHeight: "80vh", border: "none" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                PDF bulunamadı
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Poz seçimi yapınız
          </div>
        )}
      </div>

      {/* Sağ Panel - Poz Listesi */}
      <div className="w-1/6 bg-slate-50 rounded-lg p-2 pb-16 overflow-hidden flex flex-col">
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

export default SurmeBaglama;