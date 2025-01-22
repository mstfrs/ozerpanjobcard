import { useEffect, useState } from "react";
import { getAllBarcodesOfPoz, getTesDetayDetails } from "../../../services/TesDetayServices";
import CustomerInfoCard from "../../Cards/CustomerInfo";
import AccessoryInfoCard from "../../Cards/AccessoryInfo";
import { InputText } from "primereact/inputtext";
import useJobcardsStore from "../../../store/jobcardStore";
import { getItemDetails } from "../../../services/ItemServices";

const baseUrl = import.meta.env.VITE_BASE_URL;

const KanatBaglama = () => {
  const {
    currentJobcard,
    setCurrentBarkod,
    currentBarkod,
    setIsAccessoryLoading,
    setMaxSanalAdet,
    maxSanalAdet,
  } = useJobcardsStore();

  const [itemDetails, setItemDetails] = useState();
  const [aksesuarItems, setAksesuarItems] = useState([]);
  const [barcodeDetails, setBarcodeDetails] = useState();
  const [tesDetay, setTesDetay] = useState();

  useEffect(() => {
    setCurrentBarkod("");
  }, []);

  const handleBarkodChange = async (e) => {
    // setIsLoading(true)
    await setCurrentBarkod(e.target.value);
    const barcodeDetails = await getTesDetayDetails(e.target.value);
    // barcodeDetails?.length == 0 && e.target.value !== "" ? toast.info('Bu barkod tamamlanmıştır') : null

    setBarcodeDetails(barcodeDetails);

    // barcodeDetails'tan pozNo'yu al
    const pozNo = barcodeDetails ? barcodeDetails[0].poz_no : {};
    const siparisNo = barcodeDetails ? barcodeDetails[0].siparis_no : {};

    const fetchBOMDetails = async () => {
      const bomKey = `BOM-${siparisNo}-${pozNo}-001`;
      const itemDetails = await getItemDetails(siparisNo + "-" + pozNo);
      setItemDetails(itemDetails);
      try {
        const response = await fetch(`${baseUrl}/resource/BOM/${bomKey}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setIsAccessoryLoading(true);
        // Her item için istek yap
        const itemDetailsPromises = data?.data.items.map(async (item) => {
          const itemResponse = await fetch(
            `${baseUrl}/resource/Item/${item.item_code}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          const itemData = await itemResponse.json();
          return itemData.data;
        });

        // Tüm item detaylarını bekle
        const itemDetails = await Promise.all(itemDetailsPromises);
        const allBarcodesOfPoz = await getAllBarcodesOfPoz(pozNo, siparisNo);
        const maxAdet = Math.max(
          ...allBarcodesOfPoz.map((detail) => parseInt(detail.sanal_adet, 10))
        );
        setMaxSanalAdet(maxAdet);

        // Item grubu "Aksesuar" olanları filtrele
        const aksesuarItems = itemDetails.filter(
          (item) => item.item_group === "Pvc Hat1 Aksesuarlar"
        );
        setAksesuarItems(aksesuarItems);
        setIsAccessoryLoading(false);
      } catch (error) {
        console.error("BOM isteği başarısız:", error);
        throw error;
      }
    };

    fetchBOMDetails();
    setTesDetay(barcodeDetails);
  };
  return (
    <>
      <InputText
        className="border-2 border-red-400 w-2/3 text-center text-xl font-semibold  mx-auto my-1 py-1"
        value={currentBarkod}
        onChange={(e) => handleBarkodChange(e)}
      />

      {currentBarkod !== undefined ? (
        <div className="w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2">
          <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto">
            <div className="w-full flex justify-between items-center bg-slate-200 p-1 ">
              {/* <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_name}</h3> */}
              {currentJobcard && (
                <h3 className="text-lg font-medium">
                  İş Kartı No : {currentJobcard?.name}
                </h3>
              )}
            </div>
            <CustomerInfoCard
              tesDetay={tesDetay}
              maxSanalAdet={maxSanalAdet}
              itemDetails={itemDetails}
            />
          </div>
          <div className="w-2/4 p-4 flex gap-4 justify-center bg-slate-200">
            <img
              src={
                tesDetay &&
                `/files/share/${
                  tesDetay[0]?.siparis_no + tesDetay[0]?.poz_no
                }.jpg`
              }
              alt=""
              className=" h-4/5"
            />
          </div>
          <div className="w-1/4 p-4 flex gap-4 justify-center bg-slate-200">
            <AccessoryInfoCard aksesuarItems={aksesuarItems} />
          </div>
        </div>
      ) : (
        <div className="h-[600px] flex items-center justify-center">
          <img src="/logobg.jpg" className=" h-2/3" alt="" />
        </div>
      )}
    </>
  );
};

export default KanatBaglama;
