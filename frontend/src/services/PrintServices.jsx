const baseUrl = import.meta.env.VITE_BASE_URL;

export const glassLabelPrint = async (selectedProduct) => {
  const { product, glassDetails } = selectedProduct;
  const zpl = `     
^XA
^CWZ,E:ARIAL.TTF
^CI28
^CFE,30,30
^PW679
^LL679
^FO220,400^A0N,20,20^FB256,2,5,L,8^FD${product?.order_no}^FS
^FO220,450^A0N,20,20^FB256,2,5,L,8^FD${product?.aciklama}^FS
^FO220,510^A0N,20,20^FB256,2,5,L,8^FD${product?.genislik} X ${product?.yukseklik}^FS
^FO220,555^A0N,20,20^FB256,2,5,L,8^FD${product?.cari_unvan} / ${product?.musteri}^FS
^FO520,220^A0N,20,20^FD1783^FS
^FO520,295^A0N,20,20^FD1175258^FS
^FO520,370^A0N,20,20^FD${glassDetails?.custom_isik_gecirgenligi}^FS
^FO520,470^A0N,20,20^FD${glassDetails?.custom_top_gunes_gecirgenligi}^FS
^FO520,550^A0N,20,20^FD${glassDetails?.custom_u_degeri}^FS
^XZ`;

  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_glass_label`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpl }),
    });

    if (response.ok) {
      const message = await response.json();
      console.log("message", message);
      // return message;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Hata:", error);
  }
};


export const qualityLabelPrint = async (tesDetay,labelInfo) => {
  const zpl = `
     
  ^XA
   ^CI28
   ^FO50,300^A0N,30,30^FD010.013.528.030.9331^FS  
   
   ^FO50,540^A0N,28,30^FB500,3,0,L,0^FD${tesDetay?.poz_data?.bayi_adi} - ${tesDetay?.poz_data?.musteri}  ^FS
   
   ^FO0,600^GB700,3,3^FS
   ^FO50,610^A0N,30,30^FDPerformans Beyan No: TS EN 14351-${labelInfo.performance_declaration_number}^FS
   ^CF0,10,10
 ^FO0,650^FB560,1,0,C,0^A0N,30,30^FD${labelInfo.custom_serial}^FS
 
 
   ^FO50,690^CF0,18,18^FB500,3,0,C,0^FD${labelInfo.description}^FS
   
   ^FO0,730^GB700,3,3^FS
   
 
   ^FO50,740^A0N,18,18^FDBoyutlar (mm):^FS
   ^FO400,740^A0N,18,18^FB500,3,0,0^FD${labelInfo.sizes}^FS
  
   ^FO50,770^A0N,18,18^FDKar yukune dayanim:^FS
   ^FO400,770^A0N,18,18^FB500,3,0,0^FD${labelInfo.wind_load_resistance} ^FS
   ^FO50,800^A0N,18,18^FDÇalışma Kuvvetleri: ^FS
   ^FO400,800^A0N,18,18^FB500,3,0,0^FD${labelInfo.labor_forces}^FS
   ^FO50,830^A0N,18,18^FDHava Geçirgenlik:^FS
   ^FO400,830^A0N,18,18^FB500,3,0,0^FD${labelInfo.air_permeability}^FS
   ^FO50,860^A0N,18,18^FDSu Geçirmezlik: ^FS
   ^FO400,860^A0N,18,18^FB500,3,0,0^FD${labelInfo.water_permeability}^FS
   ^FO50,890^A0N,18,18^FDIsıl iletkenlik (U Pencere) - (W/(m2K): ^FS
   ^FO400,890^A0N,18,18^FB500,3,0,0^FD${labelInfo.thermal_conductivity}^FS
   ^FO50,920^A0N,18,18^FDAkustik Performans: ^FS
   ^FO400,920^A0N,18,18^FB500,3,0,0^FD${labelInfo.acoustic_performance}^FS
   ^FO50,950^A0N,18,18^FDGüvenlik Tertibatı Yük Taşıma Kapasitesi: ^FS
   ^FO400,950^A0N,18,18^FB500,3,0,0^FD${labelInfo.load_carrying_capacity}^FS
   ^FO50,980^A0N,18,18^FDTehlikeli Maddeler: ^FS
   ^FO400,980^A0N,18,18^FB500,3,0,0^FD${labelInfo.dangerous_goods} ^FS
   ^FO0,1020^FB500,1,0,C,0^A0N,18,18^FDSistem 3^FS
 
   ^FO350,1100^GB150,3,3^FS
   ^FO350,1120^A0N,30,40^FD102,6 Kg^FS
   ^XZ
   
     `;
  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_quality_label`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpl }),
    });

    if (response.ok) {
      const message = await response.json();
      console.log("message", message);
      // return message;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Hata:", error);
  }
};

export const surmeLabelPrint = async (pozDetails, surmeItems) => {

  const zpl = `
^XA
^CI28
^PW800     
^LL320     
^LS0

^CF0,25
^FO30,50
^FD Cari Unvan : ${pozDetails?.bayi_adi}^FS
^FO30,100
^FD Cari Kodu  : ${pozDetails?.cari_kod}^FS
^FO30,150
^FD Sip / Sevk : ${pozDetails?.siparis_tarihi} / ${pozDetails?.sevkiyat_tarihi}^FS
^FO30,200
^FD Musterisi : ${pozDetails?.musteri || '-'} ^FS
^FO30,250
^FD Siparis No : ${pozDetails?.siparis_no}   Poz No : ${pozDetails?.poz_no.split('-')[1]} ^FS


^FO0,290^GB900,3,3^FS
^FO0,330^GB900,3,3^FS
^FO30,300^FB740,,1^FDStok Kodu^FS
^FO200,300^FB740,,1^FDUrun Adi^FS
^FO650,300^FB740,,1^FDMiktar^FS

${(surmeItems || []).map((item, i) => {
    const y = 350 + i * 30;
    return `
^FO30,${y}^FD${item.stock_code || ''} ^FS
^FO200,${y}^FB740,,3^FD${item.stock_name || ''} ^FS
^FO650,${y}^FD${item.qty ?? ''} ^FS
`;
  }).join('')}
^XZ

`
    ;

  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_surme_label`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpl }),
    });

    if (response.ok) {
      const message = await response.json();
      console.log("message", message);
      return message;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Hata:", error);
  }
};


export const accessoryPackagePrint = async (data) => {
  console.log('accessoryPackagePrint data', data);
  print('/n/n/n data', data);

  const items = data?.items || [];
  const docName = data?.name || '';
  const dealer = data?.dealer || '';
  const endCustomer = data?.end_customer || '';

  let zpl = `
^XA
^CI28
^PW640
^LL800

^FO30,30^A0N,30,30^FDSO: ${docName}^FS
^FO30,65^A0N,22,22^FDDealer: ${dealer}^FS
^FO30,95^A0N,22,22^FDCustomer: ${endCustomer}^FS

^FO20,155^GB600,3,3^FS

^FO30,170^FDKOD^FS
^FO180,170^FDÜRÜN ADI^FS
^FO470,170^FDMKT^FS
^FO540,170^FDUOM^FS

^FO20,195^GB600,2,2^FS
`;

  let y = 215;

  items.forEach(item => {
    zpl += `
^FO30,${y}^A0N,20,20^FD${item.item_code || ''}^FS
^FO180,${y}^A0N,20,20^FB270,2,3,L^FD${item.item_name || ''}^FS
^FO470,${y}^A0N,20,20^FD${item.qty || ''}^FS
^FO540,${y}^A0N,20,20^FD${item.uom || ''}^FS
`;
    y += 55;
  });

  zpl += `^XZ`;


  // try {
  //   const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_surme_label`, {
  //     credentials: "include",
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ zpl }),
  //   });

  //   if (response.ok) {
  //     const message = await response.json();
  //     console.log("message", message);
  //     return message;
  //   } else {
  //     throw new Error(`HTTP error! Status: ${response.status}`);
  //   }
  // } catch (error) {
  //   console.error("Hata:", error);
  // }
};

export const surmeLabelPrintYedek= async (pozDetails, surmeItems) => {
  // Düz metin formatı
  const text = `CLS\n\nTEXT 30,30,"3",0,1,1,"Cari Unvan : ${pozDetails?.bayi_adi}"\nTEXT 30,70,"3",0,1,1,"Cari Kodu  : ${pozDetails?.cari_kod}"\nTEXT 30,110,"3",0,1,1,"Sip / Sevk : ${pozDetails?.siparis_tarihi} / ${pozDetails?.sevkiyat_tarihi}"\nTEXT 30,150,"3",0,1,1,"Musterisi  : ${pozDetails?.musteri || '-'}"\nTEXT 30,190,"3",0,1,1,"Siparis No : ${pozDetails?.siparis_no}   Poz No : ${pozDetails?.poz_no?.split('-')[1]}"\n\nBAR 0,230,800,2\nTEXT 30,240,"3",0,1,1,"Stok Kodu"\nTEXT 200,240,"3",0,1,1,"Ürün Adı"\nTEXT 650,240,"3",0,1,1,"Miktar"\nBAR 0,270,800,2\n\n${(surmeItems || []).map((item, i) => {
    const y = 280 + i * 30;
    return `TEXT 30,${y},"3",0,1,1,"${item.stock_code || ''}"\nTEXT 200,${y},"3",0,1,1,"${item.stock_name || ''}"\nTEXT 650,${y},"3",0,1,1,"${item.qty ?? ''}"\n`;
  }).join('')}\nPRINT 1\n`;

  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_surme_label_local`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });

    if (response.ok) {
      const message = await response.json();
      console.log("message", message);
      return message;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Hata:", error);
  }
};
