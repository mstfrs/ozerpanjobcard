const baseUrl = import.meta.env.VITE_BASE_URL;

export const glassLabelPrint = async (selectedProduct) => {
    const{product,glassDetails}=selectedProduct;
  const zpl = `     
^XA
^CWZ,E:ARIAL.TTF
^CI28
^CFE,30,30
^PW679
^LL679
^FO220,415^A0N,20,20^FB256,2,5,L,8^FD${product?.order_no}^FS
^FO220,470^A0N,20,20^FB256,2,5,L,8^FD${glassDetails?.custom_item_name}^FS
^FO220,530^A0N,20,20^FB256,2,5,L,8^FD${product?.genislik} X ${product?.yukseklik}^FS
^FO220,565^A0N,20,20^FB256,2,5,L,8^FD${product?.cari_unvan} / ${product?.musteri}^FS
^FO520,240^A0N,20,20^FD1783^FS
^FO520,315^A0N,20,20^FD1175258^FS
^FO520,390^A0N,20,20^FD${glassDetails?.custom_isik_gecirgenligi}^FS
^FO520,490^A0N,20,20^FD${glassDetails?.custom_top_gunes_gecirgenligi}^FS
^FO520,565^A0N,20,20^FD${glassDetails?.custom_u_degeri}^FS
^XZ`;

  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_label`, {
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

   ^LS32
   ^FO50,300^A0N,30,30^FD010.013.528.030.9331^FS  
   
   ^FO50,540^A0N,28,30^FB500,3,0,L,0^FD${tesDetay?.poz_data?.bayi_adi} - ${tesDetay?.poz_data?.musteri}  ^FS
   
   ^FO0,600^GB700,3,3^FS
   ^FO50,610^A0N,30,30^FDPerformans Beyan No: TS EN 14351-${labelInfo.performance_declaration_number}^FS
   ^CF0,10,10
 ^FO0,650^FB560,1,0,C,0^A0N,30,30^FD${labelInfo.custom_serial}^FS
 
 
   ^FO50,690^CF0,18,18^FB500,3,0,C,0^FD${labelInfo.description}^FS
   
   ^FO0,730^GB700,3,3^FS
   
 
   ^FO50,740^A0N,15,15^FDBoyutlar (mm):^FS
   ^FO400,740^A0N,15,15^FB500,3,0,0^FD${labelInfo.sizes}^FS
  
   ^FO50,770^A0N,15,15^FDKar yukune dayanim:^FS
   ^FO400,770^A0N,15,15^FB500,3,0,0^FD${labelInfo.wind_load_resistance} ^FS
   ^FO50,800^A0N,15,15^FDÇalışma Kuvvetleri: ^FS
   ^FO400,800^A0N,15,15^FB500,3,0,0^FD${labelInfo.labor_forces}^FS
   ^FO50,830^A0N,15,15^FDHava Geçirgenlik:^FS
   ^FO400,830^A0N,15,15^FB500,3,0,0^FD${labelInfo.air_permeability}^FS
   ^FO50,860^A0N,15,15^FDSu Geçirmezlik: ^FS
   ^FO400,860^A0N,15,15^FB500,3,0,0^FD${labelInfo.water_permeability}^FS
   ^FO50,890^A0N,15,15^FDIsıl iletkenlik (U Pencere) - (W/(m2K): ^FS
   ^FO400,890^A0N,15,15^FB500,3,0,0^FD${labelInfo.thermal_conductivity}^FS
   ^FO50,920^A0N,15,15^FDAkustik Performans: ^FS
   ^FO400,920^A0N,15,15^FB500,3,0,0^FD${labelInfo.acoustic_performance}^FS
   ^FO50,950^A0N,15,15^FDGüvenlik Tertibatı Yük Taşıma Kapasitesi: ^FS
   ^FO400,950^A0N,15,15^FB500,3,0,0^FD${labelInfo.load_carrying_capacity}^FS
   ^FO50,980^A0N,15,15^FDTehlikeli Maddeler: ^FS
   ^FO400,980^A0N,15,15^FB500,3,0,0^FD${labelInfo.dangerous_goods} ^FS
   ^FO0,1020^FB500,1,0,C,0^A0N,15,15^FDSistem 3^FS
 
   ^FO350,1100^GB150,3,3^FS
   ^FO350,1120^A0N,30,40^FD102,6 Kg^FS
   ^XZ
   
     `;
  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_label`, {
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
