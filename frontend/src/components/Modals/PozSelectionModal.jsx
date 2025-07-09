import React from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

// props: visible, onHide, data, onSelect
const PozSelectionModal = ({ visible, onHide, data, onSelect }) => {
  // Seçim butonu render fonksiyonu
  const selectButton = (rowData) => (
    <Button
      label="Seç"
      
      onClick={() => onSelect(rowData)}
      className="p-button-sm bg-green-500 text-white text-center"
    />
  );

  return (
    <Dialog
      header="Poz Seçimi"
      visible={visible}
      style={{ width: "50vw"}}
      onHide={onHide}
      modal
      
      closeOnEscape
    >
      <DataTable value={data ? data.filter(item => item.for_information_only !== true) : []} responsiveLayout="scroll" selectionMode={null}>
        <Column field="siparis_no" header="Sipariş No" />
        <Column field="poz_no" header="Poz No" />
        <Column field="sanal_adet" header="Sanal Adet" />

        <Column body={selectButton}  style={{  width: "8rem" }} />
      </DataTable>
      <h4 className="text-center text-red-500 py-1 font-semibold  w-full">Tamamlanan Pozlar</h4>
      <DataTable value={data ? data.filter(item => item.for_information_only === true) : []} responsiveLayout="scroll" selectionMode={null}>
        <Column field="siparis_no"  header="Sipariş No"/>
        <Column field="poz_no" header="Poz No" style={{  textAlign: "left" }}   />
        <Column field="sanal_adet" header="Sanal Adet" />

        <Column body={selectButton}  style={{  width: "8rem" }} />
      </DataTable>
    </Dialog>
  );
};

export default PozSelectionModal; 