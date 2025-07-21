import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { getGlassDetails, getGlassList, processGlassOperation } from "../../../services/GlassServices";
import { glassLabelPrint } from "../../../services/PrintServices";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useJobcardsStore from "../../../store/jobcardStore";
import { getJobCardDetails } from "../../../services/JobCardServices";

const Cam = () => {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [glassList, setGlassList] = useState();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorNote, setErrorNote] = useState("");
  const [lastSearchedValue, setLastSearchedValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [selectedGlassType, setSelectedGlassType] = useState(null);

  const {
    employee,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
  } = useJobcardsStore();

  const handleInputChange = (e) => {
    setInputValue(e.target.value.slice(0, 7));
  };

  const handleInputKeyDown = async (e) => {
    if (e.key === "Enter" && inputValue.length === 7) {
      await handleSearchWithValue(inputValue);
      setInputValue(""); // Okutma sonrası inputu temizle
    }
  };

  const handleSearchWithValue = async (value) => {
    const data = await getGlassList(value);
    console.log("glasslist",data)
    const filteredData = data.filter(item => item.job_cards && item.job_cards.length > 0);
    if (filteredData.length === 0) {
      toast.error("Siparişe ait üretilecek Cam bulunamadı");
      setGlassList([]);
      setSelectedProduct(null);
      return;
    }
    setGlassList(filteredData);
    setSelectedProduct(null);
    setLastSearchedValue(value); // Son aranan değeri sakla
    setSelectedStatus("Pending"); // Yeni sorguda status tekrar Pending olsun
  };

  const handleSearch = async () => {
    await handleSearchWithValue(inputValue);
  };

  const handleRowClick = async (e) => {
    const product = e.data;
    const jobCardInfo = await getJobCardDetails(product?.job_cards[0]?.job_card_ref);
    setCurrentJobcard(jobCardInfo);
    const glassDetails = await getGlassDetails(product?.stok_kodu);
    setSelectedProduct({ product, glassDetails });
  };

  const handlePrintLabel = async () => {
    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    const payload = {
      operation: "Cam",
      employee: employee.name,
      glass_name: selectedProduct.product.name
    };

    const result = await processGlassOperation(payload);
    
    if (result) {
      toast.success("Cam operasyonu başarıyla işlendi");
      glassLabelPrint(selectedProduct);
      const data = await getGlassList(lastSearchedValue); // inputValue yerine lastSearchedValue kullan
      const filteredData = data.filter(item => item.job_cards && item.job_cards.length > 0);
      setGlassList(filteredData);
    }
  };

  const handleErrorSubmit = async () => {
    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    if (!errorNote.trim()) {
      toast.error("Lütfen hata açıklaması giriniz");
      return;
    }

    try {
      const payload = {
        operation: "Cam",
        employee: employee.name,
        glass_name: selectedProduct.product.name,
        quality_data: {
          criteria: [{
            id: "surface_finish",
            name: "Surface Finish Quality",
            passed: false,
            notes: errorNote,
            severity: "low"
          }],
          overall_notes: errorNote
        }
      };

      const result = await processGlassOperation(payload);
      
      if (result) {
        toast.success("Hata kaydı başarıyla oluşturuldu");
        setErrorModalVisible(false);
        setErrorNote("");
        const data = await getGlassList(lastSearchedValue); // inputValue yerine lastSearchedValue kullan
        
        const filteredData = data.filter(item => item.job_cards && item.job_cards.length > 0);
        setGlassList(filteredData);
      }
    } catch (error) {
      toast.error("Hata kaydı oluşturulurken bir sorun oluştu");
      console.error("Error submitting error data:", error);
    }
  };

  const rowClassName = (data) => {
    return data === selectedProduct?.product ? "bg-red-300" : "";
  };

  const header = (
    <div className="flex flex-col gap-1 justify-between w-full mx-1 mb-1">
      <span className="p-input-icon-left">
        <InputText
          placeholder="Sipariş numarası"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="w-full h-10 pl-2 text-base"
          // disabled={currentJobcard?.status === "Work In Progress"}
        />
      </span>
    
      <div className="flex justify-between gap-2">
        <button
          className="w-full h-10 bg-blue-400 rounded-md cursor-pointer flex items-center justify-center gap-2 text-lg"
          onClick={handlePrintLabel}
          disabled={!selectedProduct}
        >
          <i className="pi pi-print text-xl"></i>
          Etiket Yazdır
        </button>
       
        {/* <button
          onClick={handleSearch}
          label="Sorgula"
          className="w-28 h-10 bg-green-400 rounded-md cursor-pointer"
          // disabled={currentJobcard?.status === "Work In Progress"}
        >
          Sorgula
        </button> */}
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    const jobCards = rowData.job_cards || [];
    const lastJobCard = jobCards[jobCards.length - 1];
    const status = lastJobCard?.status || "N/A";
    const isCorrective = lastJobCard?.is_corrective === 1;

    return (
      <Tag
        value={isCorrective ? `${status} (Düzeltme)` :status==="Completed"?"Tamamlandı": "Yeni"}
        severity={status === "Pending" ? "warning" : "success"}
        className={isCorrective ? "bg-yellow-500" : ""}
      />
    );
  };

  // Cam cinslerini ve adetlerini hesaplayın
  const glassTypes = glassList?.reduce((acc, item) => {
    const { aciklama } = item;
    if (!acc[aciklama]) {
      acc[aciklama] = 0;
    }
    acc[aciklama] += 1;
    return acc;
  }, {});

  // Status değerlerini ve adetlerini hesaplayın
  const statusCounts = glassList?.reduce((acc, item) => {
    const status = item.job_cards?.[0]?.status || "N/A";
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += 1;
    return acc;
  }, {});

  // Filtreleme: hem durum hem cam türü
  const filteredGlassList = glassList
    ?.filter(item => (selectedStatus ? item.job_cards?.[0]?.status === selectedStatus : true))
    ?.filter(item => (selectedGlassType ? item.aciklama === selectedGlassType : true));

  const errorModalFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="İptal"
        icon="pi pi-times"
        onClick={() => {
          setErrorModalVisible(false);
          setErrorNote("");
        }}
        className="p-button-text"
      />
      <Button
        label="Kaydet"
        icon="pi pi-check"
        onClick={handleErrorSubmit}
        className="p-button-primary"
      />
    </div>
  );

  return (
    <div className="pt-2 flex text-xs h-full">
      <Button
        data-testid="error-modal-trigger"
        className="hidden"
        onClick={() => setErrorModalVisible(true)}
      />
      <Dialog
        header="Hata Bildirimi"
        visible={errorModalVisible}
        style={{ width: '50vw' }}
        onHide={() => {
          setErrorModalVisible(false);
          setErrorNote("");
        }}
        footer={errorModalFooter}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="errorNote">Hata Açıklaması</label>
            <InputTextarea
              id="errorNote"
              value={errorNote}
              onChange={(e) => setErrorNote(e.target.value)}
              rows={5}
              className="w-full"
              placeholder="Hata açıklamasını giriniz..."
            />
          </div>
        </div>
      </Dialog>

      <div className="mr-2 flex flex-col w-1/5">
        {header}
      
        {glassTypes && (
          <>
            <Card
          className="mb-1"
          title={
            <span className="text-sm font-semibold">
              Fabrika Sipariş No:
            </span>
          }
          subTitle={
            <span className="text-xs text-gray-600">
              Adı:{" "}
              {glassList?.[0]
                ? `${glassList[0].cari_unvan} - ${glassList[0].musteri}`
                : ""}
            </span>
          }
        />
             <div className="mb-1 items-center bg-white rounded-md">
            <h3 className="text-base font-semibold mb-1 bg-red-300 rounded-t-md text-center">Cam Çeşitleri ve Adetleri</h3>
            <ul className="text-base px-1">
              {Object.entries(glassTypes).map(([type, count]) => (
                <li
                  key={type}
                  className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-1 rounded-lg ${
                    selectedGlassType === type ? "font-bold bg-green-500 text-white" : ""
                  }`}
                  onClick={() => setSelectedGlassType(selectedGlassType === type ? null : type)}
                >
                  <span>{type}</span>
                  <span className="text-base font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          </>
       
        )}
        {statusCounts && (
          <div className=" bg-white rounded-md items-center">
            <h3 className="text-base font-semibold mb-1 bg-red-300 rounded-t-md text-center">Durumlar</h3>
            <ul className="text-base px-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <li
                  key={status}
                  className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-2 rounded-lg ${selectedStatus === status ? "font-bold bg-green-500 text-white" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  <span>
                    {status === "Pending"
                      ? "Yeni"
                      : status === "In Progress"
                      ? "İşlemde"
                      : status === "Completed"
                      ? "Tamamlanan"
                      : status}
                  </span>
                  <span className="text-base font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <DataTable
          value={filteredGlassList}
          className="p-datatable-sm text-sm h-full"
          rows={10}
          scrollable
          scrollHeight="calc(100vh - 100px)"
          responsiveLayout="scroll"
          onRowClick={handleRowClick}
          rowClassName={rowClassName}
        >
          <Column
            field="poz_no"
            header="Poz No"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="genislik"
            header="Genişlik"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="yukseklik"
            header="Yükseklik"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="sanal_adet"
            header="Sanal Adet"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="job_cards"
            header="Durumu"
            body={statusBodyTemplate}
            style={{ width: "120px" }}
          />
          <Column field="aciklama" header="Cam Cinsi" sortable />
        </DataTable>
      </div>
    </div>
  );
};

export default Cam;
