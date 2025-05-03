import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  getProfilTeminOptDetails,
  updateProfilList,
} from "../../../services/OptServices";
import { getItemDetails } from "../../../services/ItemServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "../../Loading";
import useJobcardsStore from "../../../store/jobcardStore";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from 'primereact/toast';
import { useRef } from "react";
import { Button } from "primereact/button";

const ProfilTemin = () => {
  const { currentOpt, currentJobcard, setIsAllProfileTransferred,currentJobcardStatus } = useJobcardsStore();
  const toast = useRef(null);
  const queryClient = useQueryClient();

  // Profil Temin Opt Detayları Query
  const {
    data: profileOptInfo,
    isLoading: isProfileTeminOptLoading,
    isError: isOptError,
  } = useQuery({
    queryKey: ["profileOptInfo", currentOpt?.custom_opti_no],
    queryFn: () => getProfilTeminOptDetails(currentOpt?.custom_opti_no),
    enabled: !!currentOpt?.custom_opti_no,
    staleTime: 30000, // 30 saniye boyunca cache'den kullan
    cacheTime: 1000 * 60 * 5, // 5 dakika cache'de tut
  });

  // Ürün Görselleri Query
  const { data: images, isLoading: isImageLoading, error: imageError } = useQuery({
    queryKey: ["productImages", profileOptInfo?.profile_list],
    queryFn: async () => {
      if (!profileOptInfo?.profile_list) return [];

      console.log("Fetching images for profile list:", profileOptInfo.profile_list);
      const uniqueItems = [...new Set(profileOptInfo.profile_list.map(item => item.item_code))];
      console.log("Unique items to fetch:", uniqueItems);
      
      const imageRequests = uniqueItems.map(async (item) => {
        try {
          console.log(`Fetching details for item: ${item}`);
          const itemData = await getItemDetails(item);
          console.log(`Received data for item ${item}:`, itemData);
          return { item, image: itemData.image };
        } catch (error) {
          console.error(`Error fetching image for item ${item}:`, error);
          return { item, image: null };
        }
      });

      return Promise.all(imageRequests);
    },
    enabled: !!profileOptInfo?.profile_list && profileOptInfo.profile_list.length > 0,
    staleTime: 1000 * 60 * 5, // 5 dakika boyunca cache'den kullan
    cacheTime: 1000 * 60 * 30, // 30 dakika cache'de tut
    retry: 2,
    onError: (error) => {
      console.error("Error fetching product images:", error);
    }
  });

  // Profil Listesi Güncelleme Mutation
  const { mutate: updateProfile } = useMutation({
    mutationFn: (profilePayload) => updateProfilList(profilePayload.name, profilePayload),
    onSuccess: () => {
      queryClient.invalidateQueries(["profileOptInfo", currentOpt?.custom_opti_no]);
      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Profil bilgileri güncellendi',
        life: 3000
      });
    },
    onError: (error) => {
      console.error("Güncelleme hatası:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Profil güncellenirken hata oluştu',
        life: 3000
      });
    },
  });

  // Input değerlerini yönetmek için state
  const [localInputValues, setLocalInputValues] = useState({});
  const [isInputDisabled, setIsInputDisabled] = useState(true);

  // currentJobcardStatus değişikliğini takip et
  useEffect(() => {
    setIsInputDisabled(currentJobcardStatus !== "Work In Progress");
  }, [currentJobcardStatus]);

  // Input değerlerini yönetmek için memoized state
  const inputValues = useMemo(() => {
    if (!profileOptInfo?.profile_list) return {};
    return profileOptInfo.profile_list.reduce((acc, item) => {
      acc[item.item_code] = item.custom_transfered || "";
      return acc;
    }, {});
  }, [profileOptInfo?.profile_list]);

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((value, itemNo) => {
    if (value === null || value === undefined) return;
    setLocalInputValues(prev => ({
      ...prev,
      [itemNo]: value
    }));
  }, []);

  // Onaylama handler'ı
  const handleApprove = useCallback((itemNo) => {
    const value = localInputValues[itemNo];
    if (value === null || value === undefined) return;
    
    const profileItem = profileOptInfo?.profile_list.find(
      item => item.item_code === itemNo
    );
    
    if (!profileItem) return;

    const profilePayload = {
      name: profileItem.name,
      parent: profileItem.parent,
      parenttype: "Opt Genel",
      parentfield: "profile_list",
      custom_transfered: value,
    };

    updateProfile(profilePayload);
  }, [profileOptInfo?.profile_list, updateProfile, localInputValues]);

  // Input kolonu template'i
  const inputColumnTemplate = useCallback((rowData) => {
    return (
      <div className="flex items-center gap-2">
        <InputNumber
          inputStyle={{ width: "60px" }}
          mode="decimal"
          showButtons
          buttonLayout="horizontal"
          max={rowData.amountboy}
          min={0}
          disabled={isInputDisabled}
          onChange={(e) => handleInputChange(e.value, rowData.item_code)}
          value={localInputValues[rowData.item_code] ?? inputValues[rowData.item_code]}
          size="small"
          className="p-inputnumber-sm"
        />
        <Button
          icon="pi pi-check"
          className="p-button-success p-button-sm"
          onClick={() => handleApprove(rowData.item_code)}
          disabled={isInputDisabled}
        />
      </div>
    );
  }, [currentJobcardStatus, handleInputChange, handleApprove, inputValues, localInputValues, isInputDisabled]);

  // Ürün kodu template'i
  const productCodeTemplate = useCallback((rowData) => {
    // amountmt metre cinsinden, bunu santimetreye çeviriyoruz (1m = 100cm)
    const amountInMm = rowData.amountmt * 1000;
    const quantity = amountInMm / rowData.amountboy;
    return (
      <div className="flex flex-col">
        <span>{rowData.item_code}</span>
        <span className="text-xs text-gray-500">({quantity.toFixed(0)})</span>
      </div>
    );
  }, []);

  // Tüm profillerin transfer durumunu kontrol et
  useEffect(() => {
    if (profileOptInfo?.profile_list) {
      const allTransferred = profileOptInfo.profile_list.every(
        (row) => Number(row.amountboy) === Number(row.custom_transfered)
      );
      setIsAllProfileTransferred(allTransferred);
    }
  }, [profileOptInfo?.profile_list, setIsAllProfileTransferred]);

  if (isProfileTeminOptLoading || isImageLoading) return <Loading />;
  if (isOptError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <Toast ref={toast} />
      <div className="flex flex-1 px-3 py-2 gap-4">
        {/* Sol Panel - Profil Listesi */}
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden">
          <div className="bg-slate-200 p-3 flex justify-between items-center">
            <h3 className="text-lg font-medium">
              İstasyon: {profileOptInfo?.machine_no}
            </h3>
            {/* {currentJobcard && (
              <h3 className="text-lg font-medium">
                İş Kartı No: {currentJobcard?.name}
              </h3>
            )} */}
          </div>

          <DataTable
            value={profileOptInfo?.profile_list}
            scrollable
            scrollHeight="calc(100vh - 200px)"
            size="small"
            stripedRows
            responsiveLayout="scroll"
            emptyMessage="Profil bulunamadı"
          >
            <Column
              field="item_code"
              header="Ürün No"
              body={productCodeTemplate}
              sortable
              style={{ width: "15%" }}
            />
            <Column
              field="item_name"
              header="Ürün Adı"
              style={{ width: "40%" }}
            />
            <Column
              header="Çekilen"
              body={inputColumnTemplate}
              style={{ width: "15%" }}
              className="text-center"
            />
            <Column
              field="amountboy"
              header="Miktar (Boy)"
              style={{ width: "15%" }}
              className="text-center"
            />
            <Column
              field="amountmt"
              header="Miktar (Mt)"
              style={{ width: "15%" }}
              className="text-center"
            />
          </DataTable>
        </div>

        {/* Sağ Panel - Ürün Görselleri */}
        
        <div className="w-1/3 bg-slate-200 rounded-lg p-4">
          <div className="h-[calc(100vh-200px)] overflow-y-auto">
            {imageError && (
              <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">
                <h3 className="font-bold">Görsel yüklenirken hata oluştu:</h3>
                <p>{imageError.message}</p>
              </div>
            )}
            
            {images && images.length === 0 && !isImageLoading && (
              <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
                <p>Görsel bulunamadı veya yüklenemedi.</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {images?.map((img, index) =>
                img.image ? (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white">
                    <img
                      src={img.image}
                      alt={`Ürün ${img.item}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Image load error for ${img.item}`);
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle'%3EResim Yok%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1">
                      {img.item}
                    </div>
                  </div>
                ) : (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500 text-xs text-center">
                      {img.item} - Görsel Yok
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilTemin;
