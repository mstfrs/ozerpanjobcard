import React from "react";

const CustomerInfoCard = () => {
  return (
    <div className="bg-gray-100 p-2 w-full h-full text-gray-800 rounded-md shadow-md border-b-8">
    <h2 className="font-bold text-red-600 text-lg mb-2">Ürün / Müşteri Bilgileri</h2>
    <div className="text-base">
      <p className="mb-1">
        <span className="font-semibold">Sipariş No :</span> S402757 / Poz 1
      </p>
      <p className="mb-1">
        <span className="font-semibold">Adet :</span> 1 / 5
      </p>
      <p className="mb-1">
        <span className="font-semibold">Müşteri Adı :</span> Gül Yapı - İbrahim İMAMOĞLU
      </p>
      <p className="mb-1">
        <span className="font-semibold">Teklif :</span> Gül YAPI
      </p>
      <p className="mb-1">
        <span className="font-semibold">Seri :</span> Safir 76
      </p>
      <p>
        <span className="font-semibold">Renk :</span> Vizon Çift Folyo
      </p>
    </div>
  </div>
  );
};

export default CustomerInfoCard;
