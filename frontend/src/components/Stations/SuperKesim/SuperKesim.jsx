import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Image } from "primereact/image";
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
import { Button } from "primereact/button";
import { updateSuperKesimProfileList, getAllSuperKesimRecords, getSuperKesimProfilDetails, completeSuperKesim } from "../../../services/SuperKesimServices";
import { Dropdown } from "primereact/dropdown";

const SuperKesim = () => {
  const { currentOpt, currentJobcard, setIsAllProfileTransferred, setCurrentOpt, currentJobcardStatus } = useJobcardsStore();
  const toast = useRef(null);
  const queryClient = useQueryClient();
  const localInputValuesRef = useRef([]);
  const [tableData, setTableData] = useState([]);

  // Local states
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedOptiNo, setSelectedOptiNo] = useState(null);

  // Tüm Super Kesim kayıtlarını getir
  const { data: allRecords, isLoading: isRecordsLoading } = useQuery({
    queryKey: ["allSuperKesimRecords"],
    queryFn: getAllSuperKesimRecords,
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  // Benzersiz makine listesini oluştur
  const machines = useMemo(() => {
    if (!allRecords) return [];
    const uniqueMachines = new Set(allRecords.map(record => record.machine_no));
    return Array.from(uniqueMachines).map(machine => ({
      machine_no: machine
    }));
  }, [allRecords]);

  // Seçili makineye göre opti numaralarını filtrele
  const optiNumbers = useMemo(() => {
    if (!allRecords || !selectedMachine) return [];
    return allRecords
      .filter(record => 
        record.machine_no === selectedMachine.machine_no && 
        record.status !== "Tamamlandı"
      )
      .map(record => ({
        opti_no: record.opt_no,
        name: record.name
      }));
  }, [allRecords, selectedMachine]);

  // Super Kesim detayları query
  const {
    data: superKesimInfo,
    isLoading: isSuperKesimLoading,
    isError: isSuperKesimError,
  } = useQuery({
    queryKey: ["superKesimInfo", selectedOptiNo?.name],
    queryFn: () => getSuperKesimProfilDetails(selectedOptiNo?.name),
    enabled: !!selectedOptiNo?.name && !!selectedMachine,
    staleTime: 30000,
    onSuccess: (data) => {
      setTableData(data?.profile_list || []);
    },
    onError: (error) => {
      console.error("Super Kesim Details Error:", error);
    }
  });

  // Ürün görselleri query
  const { data: images, isLoading: isImageLoading } = useQuery({
    queryKey: ["productImages", superKesimInfo?.profile_list],
    queryFn: async () => {
      if (!superKesimInfo?.profile_list) return [];

      const uniqueItems = [...new Set(superKesimInfo.profile_list.map(item => item.item_code))];
      const imageRequests = uniqueItems.map(async (item) => {
        try {
          const itemData = await getItemDetails(item);
          return { item, image: itemData.image };
        } catch (error) {
          console.error(`Error fetching image for item ${item}:`, error);
          return { item, image: null };
        }
      });

      return Promise.all(imageRequests);
    },
    enabled: !!superKesimInfo?.profile_list,
    staleTime: 1000 * 60 * 5,
  });

  // Profil listesi güncelleme mutation
  const { mutate: updateProfile } = useMutation({
    mutationFn: ({ id, payload }) => updateSuperKesimProfileList(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["superKesimInfo", selectedOptiNo?.name]);
      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Kesim bilgileri güncellendi',
        life: 3000
      });
    },
    onError: (error) => {
      console.error("Güncelleme hatası:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Kesim bilgileri güncellenirken hata oluştu',
        life: 3000
      });
    },
  });

  // Tamamlama mutation
  const { mutate: completeMutation } = useMutation({
    mutationFn: completeSuperKesim,
    onSuccess: () => {
      queryClient.invalidateQueries(["allSuperKesimRecords"]);
      setSelectedOptiNo(null);
      setSelectedMachine(null);
      localInputValuesRef.current = [];
      setTableData([]); // Clear table data
      queryClient.setQueryData(["superKesimInfo", selectedOptiNo?.name], null);
      queryClient.invalidateQueries(["superKesimInfo"]);
      toast.current.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Süper Kesim kaydı tamamlandı',
        life: 3000
      });
    },
    onError: (error) => {
      console.error("Tamamlama hatası:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Süper Kesim kaydı tamamlanırken hata oluştu',
        life: 3000
      });
    },
  });

  // Handlers
  const handleMachineChange = useCallback((e) => {
    setSelectedMachine(e.value);
    setSelectedOptiNo(null);
    localInputValuesRef.current = [];
  }, []);

  const handleOptiNoChange = useCallback((e) => {
    setSelectedOptiNo(e.value);
    setCurrentOpt({
      custom_opti_no: e.value.opti_no,
      name: e.value.name
    });
    localInputValuesRef.current = [];
    queryClient.invalidateQueries(["superKesimInfo", e.value?.name]);
  }, [setCurrentOpt, queryClient]);

  const handleInputChange = useCallback((value, itemCode) => {
    if (value === null || value === undefined) return;
    
    const existingIndex = localInputValuesRef.current.findIndex(item => item.itemCode === itemCode);
    const newValues = [...localInputValuesRef.current];
    
    if (existingIndex !== -1) {
      newValues[existingIndex] = { itemCode, value };
    } else {
      newValues.push({ itemCode, value });
    }
    
    localInputValuesRef.current = newValues;
  }, []);

  const handleCutConfirm = useCallback((itemCode) => {
    const currentItem = localInputValuesRef.current.find(item => item.itemCode === itemCode);
    const currentValue = currentItem?.value;

    if (currentValue === null || currentValue === undefined) return;

    const profileItem = superKesimInfo?.profile_list.find(
      item => item.item_code === itemCode
    );
    
    if (!profileItem) return;

    const profilePayload = {
      name: profileItem.name,
      cutoff: currentValue,
    };

    updateProfile({
      id: profileItem.name,
      payload: profilePayload
    });
  }, [superKesimInfo?.profile_list, updateProfile]);

  // Templates
  const inputColumnTemplate = useCallback((rowData) => {
    const currentValue = localInputValuesRef.current.find(item => item.itemCode === rowData.item_code)?.value;
    
    return (
      <div className="flex items-center gap-2">
        <InputNumber
          inputStyle={{ width: "60px" }}
          mode="decimal"
          showButtons
          buttonLayout="horizontal"
          max={rowData.amountboy}
          min={rowData.cutoff || 0}
          value={currentValue ?? rowData.cutoff}
          onChange={(e) => handleInputChange(e.value, rowData.item_code)}
          size="small"
          className="p-inputnumber-sm"
        />
        <Button
          icon="pi pi-check"
          className="p-button-success p-button-sm"
          onClick={() => handleCutConfirm(rowData.item_code)}
        />
      </div>
    );
  }, [handleInputChange, handleCutConfirm]);

  const statusTemplate = useCallback((rowData) => {
    return (
      <i className={`pi ${rowData.is_cut ? 'pi-check text-green-500' : 'pi-times text-gray-400'}`}></i>
    );
  }, []);

  if (isRecordsLoading || isSuperKesimLoading || isImageLoading) {
    return <Loading />;
  }

  if (isSuperKesimError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <Toast ref={toast} />
      
      {/* Üst Bar */}
      <div className="flex items-center gap-4 p-3 bg-white">
        <div className="flex-1 flex items-center gap-4">
          <Dropdown
            value={selectedMachine}
            onChange={handleMachineChange}
            options={machines}
            optionLabel="machine_no"
            placeholder="Makine Seçiniz"
            className="w-64"
          />
          <Dropdown
            value={selectedOptiNo}
            onChange={handleOptiNoChange}
            options={optiNumbers}
            optionLabel="opti_no"
            placeholder="Opti No Seçiniz"
            className="w-64"
            disabled={!selectedMachine}
          />
        </div>
      </div>

      <div className="flex flex-1 px-3 py-2">
        {/* Ana Tablo */}
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden">
          

          <DataTable
            value={superKesimInfo?.profile_list}
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
              sortable
              style={{ width: "15%" }}
            />
            <Column
              field="item_name"
              header="Ürün Adı"
              style={{ width: "35%" }}
            />
            <Column
              header="Kesilen Boy"
              body={inputColumnTemplate}
              style={{ width: "15%" }}
              className="text-center"
            />
            <Column
              field="amountboy"
              header="Miktar (Boy)"
              style={{ width: "12%" }}
              className="text-center"
            />
            <Column
              field="amountmt"
              header="Miktar (Mt)"
              style={{ width: "12%" }}
              className="text-center"
            />
          </DataTable>
        </div>

        {/* Sağ Panel - Ürün Görselleri */}
        <div className="w-1/3 bg-slate-200 rounded-lg p-4 ml-4">
          <div className="h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {images?.map((img, index) =>
                img.image ? (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white">
                    <img
                      src={img.image}
                      alt={`Ürün ${img.item}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperKesim;
