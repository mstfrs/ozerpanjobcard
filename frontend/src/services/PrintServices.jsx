const baseUrl = import.meta.env.VITE_BASE_URL;

export const glassLabelPrint = async (selectedProduct) => {
    console.log(selectedProduct, "selectedProduct");
    const{product,glassDetails}=selectedProduct;
  const zpl = `     
^XA
^CWZ,E:ARIAL.TTF
^CI28
^CFE,30,30
^PW679
^LL679
^FO220,415^A0N,20,20^FB256,2,5,L,8^FD${product.parent}^FS
^FO220,470^A0N,20,20^FB256,2,5,L,8^FD${glassDetails.custom_item_name}^FS
^FO220,530^A0N,20,20^FB256,2,5,L,8^FD${product.gen} X ${product.yuk}^FS
^FO220,565^A0N,20,20^FB256,2,5,L,8^FD${product.cari_unvan} / ${product.musteri}^FS
^FO520,240^A0N,20,20^FD1783^FS
^FO520,315^A0N,20,20^FD1175258^FS
^FO520,390^A0N,20,20^FD${glassDetails.custom_isik_gecirgenligi}^FS
^FO520,490^A0N,20,20^FD${glassDetails.custom_top_gunes_gecirgenligi}^FS
^FO520,565^A0N,20,20^FD${glassDetails.custom_u_degeri}^FS
^XZ`;

  try {
    const response = await fetch(`${baseUrl}/method/ozerpanjobcard.api.print_label`, {
      credentials: "include",
      mode: "no-cors",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: zpl,
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

export const qualityLabelPrint = async () => {
  const zpl = `
     
  ^XA  
  ^PW559
  ^LL551
  ^LS32
  ^FO50,300^A0N,30,30^FD010.013.528.030.9331^FS  
  
  ^FO50,540^A0N,28,30^FB500,3,0,L,0^FDSHW-DER-ERSU DAY.TUK.MALLARI ERSU DAY.TUK.MALLARI ^FS
  
  ^FO0,600^GB700,3,3^FS
  ^FO50,610^A0N,30,30^FDPerformans Beyan No: TS EN 14351-1^FS
  ^CF0,10,10
  ^FO50,650^CF0,18,18^FB500,3,0,C,0^FDEv ve benzeri alanlar ile ticari alanlarda kullanimi tasarlanan yaya gecisine uygun hazir dis kapilar ve pencereler^FS
  
  ^FO0,700^GB700,3,3^FS
  
  ^FO50,710^A0N,15,15^FDRuzgar yukune dayanim: ^FS
  ^FO400,710^A0N,15,15^FB500,3,0,0^FDSinif C3 / B4^FS
  ^FO50,740^A0N,15,15^FDKar yukune ve kalici yuke dayanim:^FS
  ^FO400,740^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,770^A0N,15,15^FDDis yangin performansi:^FS
  ^FO400,770^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,800^A0N,15,15^FDSu Gecirmezlik: ^FS
  ^FO400,800^A0N,15,15^FB500,3,0,0^FDSinif E 1650^FS
  ^FO50,830^A0N,15,15^FDTehlikeli maddeler: ^FS
  ^FO400,830^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,860^A0N,15,15^FDDarbe direnci: ^FS
  ^FO400,860^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,890^A0N,15,15^FDGuvenlik tertibatlarinin yuk tasima kapasitesi: ^FS
  ^FO400,890^A0N,15,15^FB500,3,0,0^FDUYGUN^FS
  ^FO50,920^A0N,15,15^FDYukseklik: NPD^FS
  ^FO400,920^A0N,15,15^FB500,3,0,0^FDNPD^FS
  ^FO50,950^A0N,15,15^FDAkustik Performans: ^FS
  ^FO400,950^A0N,15,15^FB500,3,0,0^FD33(-1,-5) dB^FS
  ^FO50,980^A0N,15,15^FDIsil iletkenlik: ^FS
  ^FO400,980^A0N,15,15^FB500,3,0,0^FD1,3 W/m2k^FS
  ^FO50,1010^A0N,15,15^FDIsima (radyasyon) ozellikleri: ^FS
  ^FO400,1010^A0N,15,15^FB500,3,0,0^FDCam etiketinde belirtilmistir^FS
  ^FO50,1040^A0N,15,15^FDHava gecirgenligi: ^FS
  ^FO400,1040^A0N,15,15^FB500,3,0,0^FDSinif 4^FS
  ^FO50,1070^A0N,15,15^FDCalistirma kuvvetleri: ^FS
  ^FO400,1070^A0N,15,15^FB500,3,0,0^FDSinif 1^FS
  ^FO350,1100^GB150,3,3^FS
  ^FO350,1120^A0N,30,40^FD102,6 Kg^FS
  ^XZ
  
    `;
  try {
    const response = await fetch(`http://192.168.0.53/pstprnt`, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: zpl,
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
