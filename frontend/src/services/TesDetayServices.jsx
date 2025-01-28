const baseUrl = import.meta.env.VITE_BASE_URL;


export const getTestDetay = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/TesDetay?fields=["*"]`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.data
      
    } catch (error) {
      console.error("TesDetay Fetch Error:", error);
    }
  };
export const getTesDetayDetails = async (barcode) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/TesDetay?fields=["*"]&filters=[["barkod","=","${barcode}"]]`
      ,{
        method: "GET",
        credentials: 'include',        
      });
      const data = await response.json();
      return data.data
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };
export const getAllBarcodesOfPoz = async (pozNo,siparisNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/TesDetay?fields=["*"]&filters=[["poz_no","=","${pozNo}"],["siparis_no","=","${siparisNo}"]]`
      ,{
        method: "GET",
        credentials: 'include',        
      });
      const data = await response.json();
      return data.data
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };

  export const barcodeAction = async (params) => {
    try {
        const response = await fetch(`${baseUrl}/method/ozerpan_ercom_sync.custom_api.read_barcode.api.read_barcode`, {
            credentials: 'include',
            method:'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });

        if (response.ok) {
            const  message  = await response.json();
            
            return message;
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
};  
  export const getPozData = async (params) => {
    console.log(params)
    try {
        const response = await fetch(`${baseUrl}/method/ozerpan_ercom_sync.custom_api.read_barcode.helpers.get_poz_data.get_poz_data?barcode=${params}`, {
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            // body: JSON.stringify(params)
        });

        if (response.ok) {
            const  message  = await response.json();
            
            return message;
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Hata:", error);
    }
};  

  export const updateProfilTeminOpt = async (optNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/ProfilTeminOpt/${optNo}`
      ,{
        method: "PUT",
        credentials: 'include',  
        body: JSON.stringify({status:"Tamamlandı"}), 
      });
      const data = await response.json();
      return data.data
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };




  export const getProfilTeminProfiles = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/ProfilTeminOpt/911?fields=["*"]`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.data.customer_list
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };
  


  export const updateTesDetay = async (id,payload) => {
  console.log("id:",id)
  console.log("payload:",payload)
    try {
      const response = await fetch(
        `${baseUrl}/resource/TesDetay/${id}`
      ,{
        method: "PUT",
        credentials: 'include',  
        body: JSON.stringify(payload),

      });
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const data = await response.json();
      console.log("Profil Temin Listesi Güncellendi:", data);
    } catch (error) {
      console.error("Error updating job card:", error);
    }
  };

 

  