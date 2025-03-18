export const glassLabelPrint = async (selectedProduct) => {
    console.log(selectedProduct, "selectedProduct");
    const{product,glassDetails}=selectedProduct;
  const zpl = `     
^XA
^CFE,30,30
^PW679
^LL679
^FO0,120^GB480,3,3^FS
^FO480,0^GB3,600,3^FS  
^FO0,599^GB679,3,3^FS
^FO10,150^A0N,20,20^FDURETICI FIRMA^FS
^FO200,150^A0N,15,15^FB256,2,5,L,8^FD:Ozerpan Cam Pvc Panjur Sis. San. Tic. Ltd. Sti.^FS
^FO10,200^A0N,20,20^FDADRES^FS
^FO200,200^A0N,15,15^FB256,2,5,L,8^FD:Mimarsinan Organize Sanayi Bolgesi, 23. Cad. No.13 Melikgazi/Kayseri^FS
^FO10,260^A0N,20,20^FDWEB ADRESI^FS
^FO200,260^A0N,15,15^FB256,2,5,L,8^FD:www.ozerpan.com.tr^FS
^FO10,320^A0N,20,20^FDTEL/FAKS^FS
^FO200,320^A0N,15,15^FB256,2,5,L,8^FD:444 6 230 / 0 352 294 3 294^FS
^FO10,380^A0N,20,20^FDSIPARIS NO^FS
^FO200,380^A0N,15,15^FB256,2,5,L,8^FD:${product.parent}^FS
^FO10,440^A0N,20,20^FDCAM KOMBINASYONU^FS
^FO200,440^A0N,15,15^FB256,2,5,L,8^FD:${glassDetails.item_name}S Serisi Isicam 4+16+4^FS
^FO10,500^A0N,20,20^FDEBAT (mm) / SIRA NO^FS
^FO200,500^A0N,15,15^FB256,2,5,L,8^FD:${product.gen}x ${product.gen}^FS
^FO10,560^A0N,20,20^FDMUSTERI^FS
^FO200,560^A0N,15,15^FB256,2,5,L,8^FD:${product.musteri}^FS
^FO495,150^A0N,12,12^FDONAYLANMIS KURULUS NO:^FS
^FO490,165^GB180,35,2^FS  
^FO520,175^A0N,20,20^FD1783^FS
^FO495,220^A0N,12,12^FDDOP NO:^FS
^FO490,235^GB180,35,2^FS  
^FO520,245^A0N,20,20^FD1175258^FS
^FO495,290^A0N,12,12^FDISIK GECIRGENLIGI:^FS
^FO490,305^GB180,35,2^FS  
^FO520,315^A0N,20,20^FD${glassDetails.custom_isik_gecirgenligi}^FS
^FO495,360^A0N,12,12^FB156,2,5,L,0^FDTOPLAM GUNES ENERJISI GECIRGENLIGI (%):^FS
^FO490,395^GB180,35,2^FS  
^FO520,405^A0N,20,20^FD${glassDetails.custom_top_gunes_gecirgenligi}^FS
^FO495,520^A0N,12,12^FDU DEGERI(W/m2K):^FS
^FO490,535^GB180,35,2^FS  
^FO520,545^A0N,20,20^FD${glassDetails.custom_u_degeri}^FS
^XZ`;

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
