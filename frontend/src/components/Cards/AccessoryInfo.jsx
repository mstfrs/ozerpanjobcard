import React from "react";

const AccessoryInfoCard = () => {
  return (
    <div className="bg-gray-100 p-2 w-full pr-4 h-full text-gray-800 rounded-md shadow-md">
      <h2 className="font-bold text-red-600 text-base mb-3">Aksesuar Bilgileri</h2>
      <div className="text-sm">
        <div className="flex justify-between mb-1">
          <span>Menteşe 100mm</span>
          <span className="text-red-600 font-semibold">4</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>İspanyolet Karşılık ST 273-B0V0A</span>
          <span className="text-red-600 font-semibold">4</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Ayarli Kapı Kilit Aynası/Sol</span>
          <span className="text-red-600 font-semibold">1</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Kilitli Kapı İspanyoleti 1800/28-85</span>
          <span className="text-red-600 font-semibold">1</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Ankara Kapı Kolu Gümüş</span>
          <span className="text-red-600 font-semibold">1</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Barel 90 mm Yerli 45×45</span>
          <span className="text-red-600 font-semibold">1</span>
        </div>
        <div className="flex justify-between">
          <span>Winsa Barelli İspanyolet Kapı Aks.</span>
          <span className="text-red-600 font-semibold">1</span>
        </div>
      </div>
    </div>
  );
};

export default AccessoryInfoCard;
