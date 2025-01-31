import { useEffect, useState } from "react";
import { barcodeAction, getPozData } from "../../../services/TesDetayServices";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import { InputText } from "primereact/inputtext";
import useJobcardsStore from "../../../store/jobcardStore";
import Loading from "../../Loading";

const KanatHazirlik = () => {
  const {
    currentJobcard,
    setCurrentJobcard,
    setCurrentBarkod,
    currentBarkod,
    maxSanalAdet,
    employee,
    currentOperation,
  } = useJobcardsStore();

  // const [barcodeDetails, setBarcodeDetails] = useState();
  const [tesDetay, setTesDetay] = useState();
  const [pozDetails, setPozDetails] = useState();
  const [loading, setLoading] = useState(false);

  const handleBarkodChange = async (e) => {
    const barcodeValue = e.target.value; // Boşlukları temizle
    if (!barcodeValue) return; // Eğer boşsa işlem yapma

    setLoading(true);
    try {
      const pozDetails = await getPozData(barcodeValue);
      console.log("pozdetails", pozDetails);
      setPozDetails(pozDetails?.message);

      const barcodeDetails = await barcodeAction({
        barcode: barcodeValue,
        employee: employee?.name,
        operation: currentOperation?.operations,
      });
      // setBarcodeDetails(barcodeDetails?.message);
      setCurrentJobcard(barcodeDetails?.message?.job_card);
      console.log(currentJobcard, "currentJobcard");
      setTesDetay(barcodeDetails);
    } finally {
      setLoading(false);
      setCurrentBarkod(""); // Inputu temizle ama tekrar sorgu atmasını engelle
      
    }
  };

  useEffect(() => {
    if (currentBarkod) {
      handleBarkodChange({ target: { value: currentBarkod } });
    }
  }, [currentBarkod]);

  return (
    <>
      <InputText
        className="border-2 border-red-400 w-2/3 text-center text-xl font-semibold mx-auto my-1 py-1"
        value={currentBarkod}
        disabled={currentJobcard?.status === "On Hold"}
        onChange={(e) => setCurrentBarkod(e.target.value)}
        onBlur={(e) => handleBarkodChange(e)}
      />

      {loading ? 
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
       :
       (
        <div className="w-full flex justify-between h-[calc(100vh-100px)] px-3 py-2">
          <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto">
            <div className="w-full flex justify-between items-center bg-slate-200 p-1">
              {currentJobcard && (
                <h3 className="text-lg font-medium">
                  İş Kartı No : {currentJobcard?.name}
                </h3>
              )}
            </div>
            <CustomerInfoCard
              tesDetay={tesDetay}
              maxSanalAdet={maxSanalAdet}
              pozDetails={pozDetails}
            />
            <AccessoryInfoCard pozDetails={pozDetails?.items} />
          </div>
          <div className="w-2/4 p-4 flex gap-4 justify-center bg-slate-200">
            <img
              src={`/files/share/${
                pozDetails?.siparis_no + pozDetails?.poz_no
              }.jpg`}
              alt=""
              className="h-4/5"
            />
          </div>
          <div className="w-1/4 h-full p-4 grid grid-cols-1 gap-4 justify-center place-items-center bg-slate-200 overflow-auto">
            {pozDetails?.items?.accessory_kit?.map((kit) => (
              <img
                key={kit.item_code}
                src={`${kit.image}`}
                alt=""
                className="h-full w-full"
              />
            ))}
          </div>
        </div>
      ) 
      // : (
      //   <div className="h-[600px] flex items-center justify-center">
      //     <img src="/logobg.jpg" className="h-2/3" alt="" />
      //   </div>
      // )
      }
    </>
  );
};

export default KanatHazirlik;
