import React from "react";

const CustomerInfoCard = ({ tesDetay,maxSanalAdet,itemDetails }) => {
  const { siparis_no, poz_no, bayi_adi,sanal_adet } = tesDetay && tesDetay[0] ? tesDetay[0] : {};
  console.log(maxSanalAdet);
  return (
    <div className="bg-gray-100 p-2 w-full h-full text-gray-800 rounded-md shadow-md border-b-8">
      <h2 className="font-bold text-red-600 text-lg mb-2">Ürün / Müşteri Bilgileri</h2>
      <div className="text-base">
        <p className="mb-1">
          <span className="font-semibold">Sipariş No :</span> {siparis_no ? `${siparis_no} / Poz ${poz_no}` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Adet :</span> {sanal_adet ? sanal_adet:'-'} / {maxSanalAdet ? maxSanalAdet:'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Müşteri Adı :</span> {bayi_adi ? `${bayi_adi} - İbrahim İMAMOĞLU` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Teklif :</span> {bayi_adi || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Seri :</span> {itemDetails?itemDetails.custom_serial:'-'}
        </p>
        <p>
          <span className="font-semibold">Renk :</span> {itemDetails?itemDetails.custom_color:'-'}
        </p>
      </div>
    </div>
  );
};

export default CustomerInfoCard;
