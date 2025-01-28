import React from "react";
import useJobcardsStore from '../../store/jobcardStore';


const CustomerInfoCard = ({ tesDetay,itemDetails,pozDetails }) => {
  const {

    currentJobcard,
    setCurrentBarkod,
    currentBarkod,
    setIsAccessoryLoading,
} = useJobcardsStore();
  // const { siparis_no, poz_no, bayi_adi,sanal_adet } = tesDetay && tesDetay[0] ? tesDetay[0] : {};
  const { siparis_no, poz_no, bayi_adi,sanal_adet,max_sanal_adet,serial,color } = pozDetails || {};
  return (
    <div className="bg-gray-100 p-2 w-full h-auto text-gray-800 rounded-md shadow-md border-b-8">
      <h2 className="font-bold text-red-600 text-lg mb-1  border-b-2 border-black">Ürün / Müşteri Bilgileri</h2>
      <div className="text-xs ">
        <p className="mb-1">
          <span className="font-semibold">Sipariş No :</span> {siparis_no ? `${siparis_no} / Poz ${poz_no}` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Adet :</span> {sanal_adet ? sanal_adet:'-'} / {max_sanal_adet ? max_sanal_adet:'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Müşteri Adı :</span> {bayi_adi ? `${bayi_adi} - İbrahim İMAMOĞLU` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Teklif :</span> {bayi_adi || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Seri :</span> {serial?serial:'-'}
        </p>
        <p>
          <span className="font-semibold">Renk :</span> {color?color:'-'}
        </p>
      </div>
    </div>
  );
};

export default CustomerInfoCard;
