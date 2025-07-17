import React from "react";

export default function PozList({ poz,setSelectedPoz }) {
    // poz.items bir dizi olmalı
    if (!poz || !Array.isArray(poz.items)) {
        return <div>Poz verisi bulunamadı.</div>;
    }

    return (
        <div className="flex flex-col gap-2 border-t-4 border-black py-2 w-full text-sm">
            {poz.items.map((item, idx) => (
                <div
                    key={item.name || idx}
                    className="bg-white rounded shadow p-1 flex gap-1 cursor-pointer hover:shadow-lg transition w-full"
                    onClick={()=>setSelectedPoz(item)}
                >
                    {/* Ürün görseli */}
                    {/* {item.image ? (
                        <img
                            src={item.image}
                            alt={item.item_name}
                            className="w-full h-32 object-contain mb-2"
                        />
                    ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                            Görsel Yok
                        </div>
                    )} */}
                    <div className="flex justify-between w-full">
                        {/* Ürün adı */}
                        <div className="font-bold text-md">{item.item_name}</div>

                        {/* Ürün grubu */}
                        <div className="text-sm text-gray-600">{item.item_group}</div>


                      
                    </div>

                </div>
            ))}
        </div>
    );
}