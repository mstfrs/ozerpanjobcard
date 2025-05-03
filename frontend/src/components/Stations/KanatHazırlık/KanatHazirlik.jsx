import { useState } from "react";
import { barcodeAction, revertLatestBarcodeOperation } from "../../../services/TesDetayServices";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import { InputText } from "primereact/inputtext";
import useJobcardsStore from "../../../store/jobcardStore";
import Loading from "../../Loading";
import { Button } from "primereact/button";
import { toast } from "react-toastify";

const KanatHazirlik = () => {
  const {
    currentJobcard,
    setCurrentJobcard,
    setCurrentBarkod,
    currentBarkod,
    employee,
    currentOperation,
    lastScannedBarkod,
    setLastScannedBarkod,
  } = useJobcardsStore();

  const [tesDetay, setTesDetay] = useState();
  const [loading, setLoading] = useState(false);
  const [isBgActive, setIsBgActive] = useState(false);

  const handleBarkodChange = async (e) => {
    setIsBgActive(false);
    const barcodeValue = e.target.value; // Boşlukları temizle
    if (!barcodeValue) return; // Eğer boşsa işlem yapma

    setLoading(true);
    try {
      const barcodeDetails = await barcodeAction({
        barcode: barcodeValue,
        employee: employee?.name,
        operation: currentOperation?.operations,
      });
      if (barcodeDetails?.status === "error") {
        toast.error(barcodeDetails?.message);
        setIsBgActive(false);
      } else {
        setCurrentJobcard(barcodeDetails?.job_card);
        setTesDetay(barcodeDetails);
        setIsBgActive(true);
        setLastScannedBarkod(barcodeValue); // Son okunan barkodu kaydet
      }
    } finally {
      setLoading(false);
      setCurrentBarkod(""); // Inputu temizle ama tekrar sorgu atmasını engelle
    }
  };

  const handleRevert = async () => {
    if (!lastScannedBarkod || !currentOperation?.operations) {
      toast.error("Barkod veya operasyon bilgisi eksik");
      return;
    }

    try {
      setLoading(true);
      const response = await revertLatestBarcodeOperation({
        barcode: lastScannedBarkod,
        operation: currentOperation.operations
      });

      console.log("Revert Response:", response);

      if (response && response.tesdetays && response.tesdetays.length > 0) {
        toast.success("İşlem başarıyla geri alındı");
        setCurrentJobcard(null);
        setTesDetay(null);
        setIsBgActive(false);
        setLastScannedBarkod(null);
      } else {
        toast.error("İşlem geri alınamadı");
      }
    } catch (error) {
      console.error("Revert error:", error);
      toast.error("İşlem geri alınırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (currentBarkod) {
  //     handleBarkodChange({ target: { value: currentBarkod } });
  //   }
  // }, [currentBarkod]);

  return (
    <>
      <div className="flex items-center justify-center gap-2 my-2">
        <InputText
          className="border-2 border-red-400 w-1/2 text-center text-xl font-semibold"
          value={currentBarkod}
          disabled={currentJobcard?.status === "On Hold"}
          onChange={(e) => setCurrentBarkod(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBarkodChange(e);
            }
          }}
        />
        <Button 
          label="Geri al" 
          className="p-button-danger rounded-md" 
          onClick={handleRevert}
          disabled={!lastScannedBarkod || loading}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
      ) : isBgActive ? (
        <div className="w-full flex justify-between h-[calc(100vh-150px)] px-3 py-2">
          <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto">
            <div className="w-full flex justify-between items-center bg-slate-200 p-1">
              {currentJobcard && (
                <h3 className="text-lg font-medium">
                  İş Kartı No : {currentJobcard?.name} <span className="text-red-500">({tesDetay?.job_card?.is_corrective_job_card===1&&"D"})</span> 
                </h3>
              )}
            </div>
            <CustomerInfoCard tesDetay={tesDetay} />
            <AccessoryInfoCard tesDetay={tesDetay} />
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
            />
          </div>
          <div className="w-1/4 h-full p-4 grid grid-cols-1 gap-4 justify-center place-items-center bg-slate-200 overflow-auto">
            {tesDetay?.poz_data?.items?.accessory_kit?.map((kit) => (
              <img
                key={kit.item_code}
                src={
                  kit.image != null
                    ? `${kit.image}`
                    : "/files/share/noimage.png"
                }
                alt=""
                className="h-full w-full"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[600px] flex items-center justify-center">
          <img src="/files/logobg.jpg" className="h-2/3" alt="" />
        </div>
      )}
    </>
  );
};

export default KanatHazirlik;
