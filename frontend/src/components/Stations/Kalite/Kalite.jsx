import { useCallback, useEffect, useState, useMemo } from "react";
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
import { qualityLabelPrint } from "../../../services/PrintServices";
import { toast } from "react-toastify";
const baseUrl = import.meta.env.VITE_BASE_URL;

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
    qualityCheckCode,
    setQualityCheckCode,
  } = useJobcardsStore();
  const [tesDetay, setTesDetay] = useState(null);
  const [activeBarcode, setActiveBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [errorData, setErrorData] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [totalMtul, setTotalMtul] = useState(0);
  const [labelInfo, setLabelInfo] = useState(null);

  const handleCriteriaChange = useCallback((selectedCategories) => {
    const formattedCriteria = selectedCategories.map((category) => ({
      id: category.key,
      name: category.name,
      passed: category.passed,
      severity: "low",
    }));
    setCriteria(formattedCriteria);
    const allPassed = selectedCategories.every(category => category.passed);
    setIsAllSelected(allPassed);
  }, [setIsAllSelected]);

  const getQualityLabelItems = useCallback(async (qualityCheckCode, totalMtul) => {
    if (!qualityCheckCode || !totalMtul) return null;
    
    try {
      const response = await fetch(
        `${baseUrl}/method/ozerpanjobcard.api.get_quality_label_items?quality_check_code=${qualityCheckCode}&total_mtul=${totalMtul}`,
        {
          method: "GET",
          credentials: "include",
          parenttype: "Quality Label Items",
          parentfield: "frame_codes",
        }
      );

      if (!response.ok) {
        console.error("Quality Label Items getirilirken bir hata oluştu");
        return null;
      }

      const data = await response.json();
      return data.message[0] || null;
    } catch (error) {
      console.error("Quality Label Items Fetch Error:", error);
      return null;
    }
  }, []);

  const handleBarkodChange = useCallback(async (e) => {
    const barcodeValue = e.target.value;
    if (!barcodeValue) return;
    
    setActiveBarcode(barcodeValue);
    setLoading(true);
    
    try {
      const barcodeDetails = await barcodeAction({
        barcode: barcodeValue,
        employee: employee?.name,
        operation: currentOperation?.operations,
      });
      
      if (!barcodeDetails) {
        setLoading(false);
        return;
      }

      // Check for unfinished operations
      if (barcodeDetails?.status === "error" && barcodeDetails?.error_type === "unfinished operations") {
        const unfinishedOps = barcodeDetails.unfinished_operations;
        
        toast.error(
          <div className="p-2">
            <div className="font-bold text-lg mb-3 text-red-600">Tamamlanmamış Operasyonlar:</div>
            <div className="space-y-2">
              {unfinishedOps.map((op, index) => (
                <div key={index} className="flex items-center">
                  <span className="mr-2">•</span>
                  <div>
                    <div className="font-semibold text-xs:">{op.name}</div>
                    <div className="text-xs text-gray-600">İş Kartı: {op.job_card}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: false,
            closeOnClick: true,
            draggable: true,
            className: "w-full max-w-md"
          }
        );
        setLoading(false);
        return;
      }
      
      setCurrentJobcard(barcodeDetails?.message?.job_card);
      setTesDetay(barcodeDetails);
      
      const frameCode = barcodeDetails?.poz_data?.items?.ana_profil?.[0]?.item_code.slice(0, 5);
      const newQualityCheckCode = parseInt(frameCode);
      setQualityCheckCode(newQualityCheckCode);
      
      const calculatedMtul = barcodeDetails?.poz_data?.items?.ana_profil?.[0]?.quantity * 1000 || 0;
      setTotalMtul(calculatedMtul);
      
      // Fetch label info after states are set
      const labelItems = await getQualityLabelItems(newQualityCheckCode, calculatedMtul);
      setLabelInfo(labelItems);
    } catch (error) {
      console.error("Barkod işlemi sırasında hata:", error);
    } finally {
      setLoading(false);
      setCurrentBarkod("");
    }
  }, [employee, currentOperation, setCurrentJobcard, setQualityCheckCode, getQualityLabelItems, setCurrentBarkod]);

  const handleOnayla = useCallback(async (errorData) => {
    if (!activeBarcode) return;
    
    setLoading(true);
    try {
      const barcodeDetails = await barcodeAction({
        barcode: activeBarcode,
        employee: employee?.name,
        operation: currentOperation?.operations,
        quality_data: {
          criteria: criteria, // Mevcut criteria durumunu gönder
          overall_notes: "Kalite kontrol tamamlandı",
          required_operations: [],
        },
      });
      
      if (barcodeDetails) {
        setCurrentJobcard(barcodeDetails?.message?.job_card);
        setTesDetay(barcodeDetails);
      }
    } catch (error) {
      console.error("Onaylama işlemi sırasında hata:", error);
    } finally {
      setLoading(false);
    }
  }, [activeBarcode, employee, currentOperation, criteria, setCurrentJobcard]);

  const handleErrorSubmit = useCallback(async (errorData) => {
    if (!activeBarcode) return;
    
    setLoading(true);
    try {
      const barcodeDetails = await barcodeAction({
        barcode: activeBarcode,
        employee: employee?.name,
        operation: currentOperation?.operations,
        quality_data: {
          criteria: criteria, // Mevcut criteria durumunu koru
          overall_notes: errorData?.desc || "Hata bildirimi yapıldı",
          required_operations: errorData?.required_operations || [],
        },
      });
      
      if (barcodeDetails) {
        setCurrentJobcard(barcodeDetails?.message?.job_card);
        setTesDetay(barcodeDetails);
      }
    } catch (error) {
      console.error("Hata bildirimi sırasında hata:", error);
    } finally {
      setLoading(false);
    }
  }, [activeBarcode, employee, currentOperation, criteria, setCurrentJobcard]);

  const handlePrintLabel = useCallback(async () => {
    if (!tesDetay || !labelInfo) {
      console.error("Yazdırma için tesDetay veya labelInfo eksik");
      return;
    }
    
    try {
      await qualityLabelPrint(tesDetay, labelInfo);
    } catch (error) {
      console.error("Etiket yazdırma hatası:", error);
    }
  }, [tesDetay, labelInfo]);

  useEffect(() => {
    setCurrentBarkod("");
  }, [setCurrentBarkod]);

  // Görsel durumunu useMemo ile hesaplayalım
  const imageSrc = useMemo(() => {
    if (tesDetay?.poz_data?.siparis_no && tesDetay?.poz_data?.poz_no) {
      return `/files/share/${tesDetay.poz_data.siparis_no + tesDetay.poz_data.poz_no}.jpg`;
    }
    return "/files/share/noimage.png";
  }, [tesDetay]);

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
        onSubmitErrorData={handleErrorSubmit}
      />

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
      ) : (
        <div className="w-full flex justify-between h-[calc(100vh-150px)] px-3 py-2">
          <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto">
            <div className="w-full flex justify-between items-center bg-slate-200 p-1">
              <ButtonGroup>
                <Button label="PVC KİMLİK" icon="pi pi-qrcode" />
                <Button
                  label="KALİTE"
                  icon="pi pi-print"
                  onClick={handlePrintLabel}
                  // disabled={!tesDetay || !labelInfo}
                />
              </ButtonGroup>
            </div>
            <div className="w-full flex justify-between items-center bg-slate-200 p-1">
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
              src={imageSrc}
              alt=""
              className="h-4/5"
            />
          </div>
          <div className="w-1/4 bg-slate-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <QualityCheck
                onCriteriaChange={handleCriteriaChange}
                setCriteria={setCriteria}
                tesDetay={tesDetay}
              />
              <Button
                className="font-semibold w-full"
                label="ONAYLA"
                severity="success"
                raised
                disabled={!isAllSelected}
                onClick={() => handleOnayla(errorData)}
              />
              <div className="space-y-4">
                <AccessoryInfoCard tesDetay={tesDetay} />
                <KitInfoCard tesDetay={tesDetay} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Kalite;
