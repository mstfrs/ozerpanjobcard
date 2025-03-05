import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { ChevronDownIcon } from "primereact/icons/chevrondown";
import { ChevronRightIcon } from "primereact/icons/chevronright";
import useJobcardsStore from "../store/jobcardStore";


const ErrorModal = ({ setErrorData,onSubmitErrorData }) => {
  const { 
    errorModalVisible,
    setErrorModalVisible
        
  } = useJobcardsStore();

  const [selectedError, setSelectedError] = useState(null);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [desc, setDesc] = useState("");

  const errors = [
    { name: "Çıta Hatası", code: "Cita" },
    { name: "Bağlama Hatası", code: "Baglama" },
    { name: "Eksik Conta", code: "Conta" },
    { name: "Diğer", code: "Diger" },
  ];

  const operations = [
    { name: "Profil Temin", code: "ProfilTemin" },
    { name: "Sac Kesim", code: "SacKesim" },
    { name: "Kaynak Köşe Temizleme", code: "KaynakKose" },
    { name: "Kanat Hazırlık", code: "KanatHazirlik" },
    { name: "Kanat Bağlama", code: "KanatBaglama" },
    { name: "Orta Kayıt", code: "OrtaKayit" },
    { name: "Sürme Hazırlık", code: "SürmeHazirlik" }, 
  ];

  const handleSubmit = () => {
    const errorData = {      
      required_operations: selectedOperations.map(operation => ({
        operation: operation.name,
        reason: "Requires readjustment after correction",
        priority: 2,
        description: desc
      })),
     
    };
    onSubmitErrorData(errorData);    
    setErrorModalVisible(false);
  };


  const handleCloseModal = () => {
    setErrorModalVisible(false);
  };
  
  const footerContent = (
    <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      <Button
        label="İptal Et"
        icon="pi pi-times"
        onClick={() => setErrorModalVisible(false)}
        className="inline-flex items-center justify-center py-1 gap-1 font-medium rounded-lg border transition-colors outline-none focus:ring-offset-2 focus:ring-2 focus:ring-inset dark:focus:ring-offset-0 min-h-[2.25rem] px-4 text-sm text-gray-800 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-600 focus:text-primary-600 focus:bg-primary-50 focus:border-primary-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-200 dark:focus:text-primary-400 dark:focus:border-primary-400 dark:focus:bg-gray-800"
      />
      <Button
        label="Onayla"
        icon="pi pi-check"
        onClick={handleSubmit}
        autoFocus
        className="inline-flex items-center justify-center py-1 gap-1 font-medium rounded-lg border transition-colors outline-none focus:ring-offset-2 focus:ring-2 focus:ring-inset dark:focus:ring-offset-0 min-h-[2.25rem] px-4 text-sm text-white shadow focus:ring-white border-transparent bg-red-600 hover:bg-red-500 focus:bg-red-700 focus:ring-offset-red-700"
      />
    </div>
  );

  return (
    <Dialog
      header="Hata Detaylarını Giriniz"
      visible={errorModalVisible}
      position="top"
      style={{ width: "30vw" }}
      className="h-full"
      onHide={handleCloseModal}
      dismissableMask
      draggable={false}
      resizable={false}
      footer={footerContent}
    >
      <div className="grid gap-4 grid-cols-1">
        <Dropdown
          value={selectedError}
          onChange={(e) => setSelectedError(e.value)}
          options={errors}
          optionLabel="name"
          placeholder="Hata Konusu"
          className="w-full md:w-14rem"
          dropdownIcon={(opts) => {
            return opts.iconProps["data-pr-overlay-visible"] ? (
              <ChevronRightIcon {...opts.iconProps} />
            ) : (
              <ChevronDownIcon {...opts.iconProps} />
            );
          }}
        />

        <div className="card flex justify-content-center">
          <MultiSelect
            value={selectedOperations}
            onChange={(e) => setSelectedOperations(e.value)}
            options={operations}
            optionLabel="name"
            placeholder="Operasyonları Seçiniz"
            maxSelectedLabels={7}
            className="w-full md:w-20rem"
          />
        </div>

        <div className="card flex justify-content-center w-full mt-4">
          <FloatLabel>
            <InputTextarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={5}
              className="w-full"
              id="description"
            />
            <label htmlFor="description">Hata Açıklaması</label>
          </FloatLabel>
        </div>
      </div>
    </Dialog>
  );
};

export default ErrorModal;
