const CustomerInfoSurmeCard = ({ pozNo, selectedPoz }) => {
  const { 
    bayi_adi, 
    cari_kod, 
    musteri, 
    renk, 
    seri, 
    adet, 
    siparis_tarihi, 
    sevkiyat_tarihi,
    notlar 
  } = selectedPoz || {};

  return (
    <div className="bg-gray-100 p-2 w-full h-auto text-gray-800 rounded-md shadow-md border-b-8">
      <h2 className="font-bold text-red-600 text-lg mb-1 border-b-2 border-black">Ürün / Müşteri Bilgileri</h2>
      <div className="text-xs">
        <p className="mb-1">
          <span className="font-semibold">Sipariş No:</span> {pozNo ? `${(pozNo).split("-")[0]} / Poz ${(pozNo).split("-")[1]}` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Cari Ünvanı:</span> {bayi_adi || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Cari Kodu:</span> {cari_kod || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Sip / Sevk:</span> {siparis_tarihi && sevkiyat_tarihi ? `${siparis_tarihi} / ${sevkiyat_tarihi}` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Müşteri Adı:</span> {musteri ? `${musteri}` : 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Adet:</span> {adet || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Seri:</span> {seri || 'Bilgi yok'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Renk:</span> {renk || 'Bilgi yok'}
        </p>
        {notlar && (
          <p className="mb-1">
            <span className="font-semibold">Notlar:</span> {notlar}
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomerInfoSurmeCard;
