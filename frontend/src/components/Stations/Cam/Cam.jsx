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

const Cam = () => {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [glassList, setGlassList] = useState();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    employee,
    currentOperation,
  } = useJobcardsStore();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSearch = async () => {
    const data = await getGlassList(inputValue);
    setGlassList(data);
    console.log(data);
  };

  const handleRowClick = async (e) => {
    const product = e.data;
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
      const data = await getGlassList(inputValue);
      setGlassList(data);
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
          className="w-full"
        />
      </span>
      <div className="flex justify-between gap-2 mr-2">
        <Button
          label="Cam Etiketi Bas"
          className="p-button-primary"
          onClick={handlePrintLabel}
        />
        <Button
          onClick={handleSearch}
          label="Sorgula"
          className="p-button-primary"
        />
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.status}
        severity={rowData.status === "Pending" ? "success" : "warning"}
      />
    );
  };

  // Cam cinslerini ve adetlerini hesaplayın
  const glassTypes = glassList?.items?.reduce((acc, item) => {
    const { aciklama } = item;
    if (!acc[aciklama]) {
      acc[aciklama] = 0;
    }
    acc[aciklama] += 1;
    return acc;
  }, {});

  // Status değerlerini ve adetlerini hesaplayın
  const statusCounts = glassList?.items?.reduce((acc, item) => {
    const { status } = item;
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
              Fabrika Sipariş No: {glassList?.order_no}
            </span>
          }
          subTitle={
            <span className="text-xs text-gray-600">
              Adı:{" "}
              {glassList?.items?.[0]
                ? `${glassList.items[0].cari_unvan} - ${glassList.items[0].musteri}`
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
        value={glassList?.items}
        className="p-datatable-sm text-xs w-full h-full"
        paginator
        rows={10}
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
          field="gen"
          header="Genişlik"
          sortable
          style={{ width: "120px" }}
        />
        <Column
          field="yuk"
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
          field="status"
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
