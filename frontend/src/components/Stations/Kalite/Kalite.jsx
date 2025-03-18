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
    const zpl= `
     
  ^XA
  
  ^PW559
  ^LL551
  ^LS32
  ^FO50,300^A0N,30,30^FD010.013.528.030.9331^FS  
  
  ^FO50,540^A0N,28,30^FB500,3,0,L,0^FDSHW-DER-ERSU DAY.TUK.MALLARI ERSU DAY.TUK.MALLARI ^FS
  
  ^FO0,600^GB700,3,3^FS
  ^FO50,610^A0N,30,30^FDPerformans Beyan No: TS EN 14351-1^FS
  ^CF0,10,10
  ^FO50,650^CF0,18,18^FB500,3,0,C,0^FDEv ve benzeri alanlar ile ticari alanlarda kullanimi tasarlanan yaya gecisine uygun hazir dis kapilar ve pencereler^FS
  
  ^FO0,700^GB700,3,3^FS
  
  ^FO50,710^A0N,15,15^FDRuzgar yukune dayanim: ^FS
  ^FO400,710^A0N,15,15^FB500,3,0,0^FDSinif C3 / B4^FS
  ^FO50,740^A0N,15,15^FDKar yukune ve kalici yuke dayanim:^FS
  ^FO400,740^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,770^A0N,15,15^FDDis yangin performansi:^FS
  ^FO400,770^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,800^A0N,15,15^FDSu Gecirmezlik: ^FS
  ^FO400,800^A0N,15,15^FB500,3,0,0^FDSinif E 1650^FS
  ^FO50,830^A0N,15,15^FDTehlikeli maddeler: ^FS
  ^FO400,830^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,860^A0N,15,15^FDDarbe direnci: ^FS
  ^FO400,860^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,890^A0N,15,15^FDGuvenlik tertibatlarinin yuk tasima kapasitesi: ^FS
  ^FO400,890^A0N,15,15^FB500,3,0,0^FDUYGUN^FS
  ^FO50,920^A0N,15,15^FDYukseklik: NPD^FS
  ^FO400,920^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,950^A0N,15,15^FDAkustik Performans: ^FS
  ^FO400,950^A0N,15,15^FB500,3,0,0^FD33(-1,-5) dB^FS
  ^FO50,980^A0N,15,15^FDIsil iletkenlik: ^FS
  ^FO400,980^A0N,15,15^FB500,3,0,0^FD1,3 W/m2k^FS
  ^FO50,1010^A0N,15,15^FDIsima (radyasyon) ozellikleri: ^FS
  ^FO400,1010^A0N,15,15^FB500,3,0,0^FDCam etiketinde belirtilmistir^FS
  ^FO50,1040^A0N,15,15^FDHava gecirgenligi: ^FS
  ^FO400,1040^A0N,15,15^FB500,3,0,0^FDSinif 4^FS
  ^FO50,1070^A0N,15,15^FDCalistirma kuvvetleri: ^FS
  ^FO400,1070^A0N,15,15^FB500,3,0,0^FDSinif 1^FS
  ^FO350,1100^GB150,3,3^FS
  ^FO350,1120^A0N,30,40^FD102,6 Kg^FS
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
