import { useCallback, useEffect, useState } from "react";
import { barcodeAction, getPozData } from "../../../services/TesDetayServices";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import useJobcardsStore from "../../../store/jobcardStore";
import Loading from "../../Loading";
import KitInfoCard from "../../Cards/KitInfo";
import RemarksInfo from "../../Cards/RemarksInfo";
import { ButtonGroup } from "primereact/buttongroup";
import ErrorModal from "../../ErrorModal";
import QualityCheck from "../../QuailtyCheck";

const Kalite = () => {
  const {
    currentJobcard,
    setCurrentJobcard,
    setCurrentBarkod,
    currentBarkod,
    employee,
    currentOperation,
    isAllSelected,
    setIsAllSelected,
  } = useJobcardsStore();
  const [tesDetay, setTesDetay] = useState();
  const [activeBarcode, setActiveBarcode] = useState();
  const [loading, setLoading] = useState(false); // Loading state
  const [criteria, setCriteria] = useState([]);
  const [errorData, setErrorData] = useState(null); // Error data state
  const [errorModalVisible, setErrorModalVisible] = useState(false); // Error modal visibility state

  const handleCriteriaChange = (selectedCategories) => {
    const formattedCriteria = selectedCategories.map((category) => ({
      id: category.key,
      name: category.name,
      passed: category.passed, // Örnek olarak passed değerini true yapıyoruz
      severity: "low", // Örnek olarak severity değerini low yapıyoruz
    }));
    setCriteria(formattedCriteria);
    setIsAllSelected(selectedCategories.length === 4); // Tüm kategoriler seçili mi kontrol et
  };

  const handleBarkodChange = async (e) => {
    const barcodeValue = e.target.value; // Boşlukları temizle
    if (!barcodeValue) return; // Eğer boşsa işlem yapma
    setActiveBarcode(barcodeValue);
    setLoading(true);
    try {
      const barcodeDetails = await barcodeAction({
        barcode: barcodeValue,
        employee: employee?.name,
        operation: currentOperation?.operations,
      });
      setCurrentJobcard(barcodeDetails?.message?.job_card);
      setTesDetay(barcodeDetails);
    } finally {
      setLoading(false);
      console.log(tesDetay, "tesDetay");
      setCurrentBarkod(""); // Inputu temizle ama tekrar sorgu atmasını engelle
    }
  };

  const handleOnayla = async (errorData) => {
    setLoading(true);
    try {
      const barcodeDetails = await barcodeAction({
        barcode: activeBarcode,
        employee: employee?.name,
        operation: currentOperation?.operations,
        quality_data: {
          criteria: criteria,
          overall_notes:
            errorData?.desc ||
            "General quality is good except for dimensional issue",
          required_operations: errorData?.required_operations||[],
        },
      });
      console.log(barcodeDetails, "barcodeDetails");
      setCurrentJobcard(barcodeDetails?.message?.job_card);
      setTesDetay(barcodeDetails);
    } finally {
      setLoading(false);
      console.log(tesDetay, "tesDetay");
    }
  };

  const handleErrorDataSubmit = useCallback((data) => {
    console.log("Child'dan gelen data:", data);
  }, [setErrorData]);


  const handlePrintLabel = async () => {
    const zpl = `
      ^XA     
      ^FO50,150^ADN,36,20^FD${currentOperation?.operations}^FS
      ^XZ
    `;
    try {
      const response = await fetch(`http://192.168.0.53/pstprnt`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: zpl,
      });

      if (response.ok) {
        const message = await response.json();
        console.log("message", message);
        // return message;
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  useEffect(() => {
    setCurrentBarkod("");
  }, []);

  return (
    <>
      <InputText
        className="border-2 border-red-400 w-2/3 text-center text-xl font-semibold mx-auto my-1 py-1"
        value={currentBarkod}
        disabled={currentJobcard?.status === "On Hold"}
        onChange={(e) => setCurrentBarkod(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBarkodChange(e);
          }
        }}
      />
      <ErrorModal
        errorModalVisible={errorModalVisible}
        setErrorModalVisible={setErrorModalVisible}
        setErrorData={setErrorData} 
        onSubmitErrorData={handleOnayla}
      />

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
      ) : (
        <div className="w-full flex justify-between h-[calc(100vh-150px)] px-3 py-2">
          <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto ">
            <div className="w-full flex justify-between items-center bg-slate-200 p-1 ">
              <ButtonGroup>
                <Button label="PVC KİMLİK" icon="pi pi-qrcode" />
                <Button
                  label="KALİTE"
                  icon="pi pi-print"
                  onClick={handlePrintLabel}
                />
              </ButtonGroup>
            </div>
            <div className="w-full flex justify-between items-center bg-slate-200 p-1 ">
              {currentJobcard && (
                <h3 className="text-lg font-medium">
                  İş Kartı No : {currentJobcard?.name}
                </h3>
              )}
            </div>
            <CustomerInfoCard tesDetay={tesDetay} />
            <RemarksInfo tesDetay={tesDetay} />
          </div>
          <div className="w-2/4 p-4 flex gap-4 justify-center bg-slate-200">
            <img
              src={
                tesDetay?.poz_data?.siparis_no && tesDetay?.poz_data?.poz_no
                  ? `/files/share/${
                      tesDetay?.poz_data?.siparis_no +
                      tesDetay?.poz_data?.poz_no
                    }.jpg`
                  : "/files/share/noimage.png"
              }
              alt=""
              className=" h-4/5"
            />
          </div>
          <div className="w-1/4 h-full flex flex-col gap-2 justify-center bg-slate-200 overflow-auto">
            <QualityCheck onCriteriaChange={handleCriteriaChange} setCriteria={setCriteria} tesDetay= {tesDetay} />
            <Button
              className="font-semibold"
              label="ONAYLA"
              severity="success"
              raised
              disabled={!isAllSelected}
              onClick={handleOnayla}
            />
            <AccessoryInfoCard tesDetay={tesDetay} />
            <KitInfoCard tesDetay={tesDetay} />
            <div className="text-xs"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default Kalite;
