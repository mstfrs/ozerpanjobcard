import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
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

  const {
    employee,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
  } = useJobcardsStore();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSearch = async () => {
    const data = await getGlassList(inputValue);
    const filteredData = data.filter(item => item.job_cards && item.job_cards.length > 0);
    setGlassList(filteredData);
    console.log(filteredData);
    setSelectedProduct(null);
  };

  const handleRowClick = async (e) => {
    const product = e.data;
    console.log("product", product);
    const jobCardInfo=await getJobCardDetails(product?.job_cards[0]?.job_card_ref);
    console.log(jobCardInfo,"jobCardInfo");
    setCurrentJobcard(jobCardInfo);
    const glassDetails = await getGlassDetails(product?.stok_kodu);
    console.log("glassDetails", glassDetails);
    setSelectedProduct({ product, glassDetails });
    console.log("Selected Product:", selectedProduct);
  };

  const handlePrintLabel = async () => {
    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    const result = await processGlassOperation(currentOperation.operations, employee.name, selectedProduct.product.name);
    if (result) {
      toast.success("Cam operasyonu başarıyla işlendi");
      glassLabelPrint(selectedProduct);
      const data = await getGlassList(inputValue);
      const filteredData = data.filter(item => item.job_cards && item.job_cards.length > 0);
      setGlassList(filteredData);    }
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
          className="w-full"
          disabled={currentJobcard?.status == "Work In Progress"}
        />
      </span>
      <div className="flex justify-between gap-2 mr-2">
        <Button
          label="Cam Etiketi Bas"
          className="p-button-primary"
          onClick={handlePrintLabel}
          disabled={!selectedProduct}

        />
        <Button
          onClick={handleSearch}
          label="Sorgula"
          className="p-button-primary"
          disabled={currentJobcard?.status == "Work In Progress"}

        />
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    const status = rowData.job_cards?.[0]?.status || "N/A";

    return (
      <Tag
        value={status}
        severity={status === "Pending" ? "success" : "warning"}
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
    const status = item.job_cards?.[0]?.status || "N/A"; // job_cards içindeki status değerini al
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += 1;
    return acc;
  }, {});

  return (
    <div className="pt-2 flex text-xs h-full">
            <div className="mr-2">
        {header}
        <Card
          className="mb-4"
          title={
            <span className="text-sm font-semibold">
              Fabrika Sipariş No: 
              {/* {glassList?.[0].order_no} */}
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
        {/* Cam Çeşitleri ve Adetleri Card bileşeni */}
        {glassTypes && (
          <Card className="mb-1 items-center">
            <h3 className="text-sm font-semibold mb-2"> Cam Çeşitleri ve Adetleri</h3>
            <ul className="text-xs">
              {Object.entries(glassTypes).map(([type, count]) => (
                <li key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {/* Status Değerleri ve Adetleri Card bileşeni */}
        {statusCounts && (
          <Card className="mb-1 items-center">
            <h3 className="text-sm font-semibold mb-2"> Durumlar</h3>
            <ul className="text-xs">
              {Object.entries(statusCounts).map(([status, count]) => (
                <li key={status} className="flex justify-between">
                  <span>{status === "Pending" ? "Yeni" : status === "In Progress" ? "İşlemde" :"Tamamlanan"}</span>
                  <span className="text-sm font-semibold">{count}</span> 
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <DataTable
        value={glassList}
        className="p-datatable-sm text-xs w-full h-full"
        // paginator
        rows={10}
        scrollable
        scrollHeight="flex"
        responsiveLayout="scroll" 
        onRowClick={handleRowClick} // Satıra tıklama olayını ekleyin
        rowClassName={rowClassName} // Satır sınıfını belirleyin
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
          field="job_cards[0].status"
          header="Durumu"
          body={statusBodyTemplate}
          
          style={{ width: "120px" }}
        />
        <Column field="aciklama" header="Cam Cinsi" sortable />
      </DataTable>
    </div>
  );
};

export default Cam;
