import { useEffect, useState } from "react";
import { barcodeAction, getPozData } from "../../../services/TesDetayServices";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import useJobcardsStore from "../../../store/jobcardStore";
import Loading from "../../Loading";
import KitInfoCard from "../../Cards/KitInfo";
import RemarksInfo from "../../Cards/RemarksInfo";
import QuailtyCheck from "../../QuailtyCheck";
import { ButtonGroup } from 'primereact/buttongroup';

const Kalite = () => {
  const {
    currentJobcard,
    setCurrentJobcard,
    setCurrentBarkod,
    currentBarkod,
    maxSanalAdet,
    employee,
    currentOperation,
  } = useJobcardsStore();

  const [barcodeDetails, setBarcodeDetails] = useState();
  const [tesDetay, setTesDetay] = useState();
  const [pozDetails, setPozDetails] = useState();
  const [loading, setLoading] = useState(false); // Loading state

  const handleBarkodChange = async (e) => {
    setLoading(true); // Set loading to true
    await setCurrentBarkod(e.target.value);
    const pozDetails = await getPozData(e.target.value);
    console.log("pozdetails", pozDetails);
    await setPozDetails(pozDetails?.message);

    const barcodeDetails = await barcodeAction({
      barcode: e?.target?.value,
      employee: employee?.name,
      operation: currentOperation?.operations,
    });
    setBarcodeDetails(barcodeDetails?.message);
    await setCurrentJobcard(barcodeDetails?.message?.job_card);
    console.log(currentJobcard, "currentJobcard");
    setTesDetay(barcodeDetails);
    setLoading(false); // Set loading to false
  };

  const handlePrintLabel = () => {
    const zpl = `
      ^XA
      ^FO50,50^ADN,36,20^FD${currentJobcard?.name}^FS
      ^FO50,100^ADN,36,20^FD${employee?.name}^FS
      ^FO50,150^ADN,36,20^FD${currentOperation?.operations}^FS
      ^FO50,200^ADN,36,20^FD${pozDetails?.message}^FS
      ^XZ
    `;

    // Yazıcıya ZPL komutlarını gönder
    fetch('http://10.10.2.80:9100', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: zpl,
    })
    .then(response => response.text())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  useEffect(() => {
    setCurrentBarkod("");
  }, []);

  return (
    <>
      <InputText
        className="border-2 border-red-400 w-2/3 text-center text-xl font-semibold  mx-auto my-1 py-1"
        value={currentBarkod}
        disabled={currentJobcard?.status === "On Hold"}
        onChange={(e) => handleBarkodChange(e)}
      />

      {
        loading ? (
          <div className="flex justify-center items-center h-full">
            <Loading />
          </div>
        ) : (
          <div className="w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2">
            <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto ">
              <div className="w-full flex justify-between items-center bg-slate-200 p-1 ">
                <ButtonGroup>
                  <Button label="PVC KİMLİK" icon="pi pi-qrcode" />
                  <Button label="KALİTE" icon="pi pi-print" onClick={handlePrintLabel} />
                </ButtonGroup>
              </div>
              <div className="w-full flex justify-between items-center bg-slate-200 p-1 ">
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
              <RemarksInfo pozDetails={pozDetails} />
            </div>
            <div className="w-2/4 p-4 flex gap-4 justify-center bg-slate-200">
              <img
                src={`/files/share/${
                  pozDetails?.siparis_no + pozDetails?.poz_no
                }.jpg`}
                alt=""
                className=" h-4/5"
              />
            </div>
            <div className="w-1/4 h-full grid grid-cols-1 gap-4 justify-center  bg-slate-200 overflow-auto">
              <QuailtyCheck />
              <AccessoryInfoCard pozDetails={pozDetails?.items} />
              <KitInfoCard pozDetails={pozDetails?.items} />
              <div className="text-xs"></div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Kalite;
