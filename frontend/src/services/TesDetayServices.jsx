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
  console.log(barcode)
    try {
      const response = await fetch(
        `${baseUrl}/resource/TesDetay?fields=["*"]&filters=[["barkod","=","${barcode}"],["status","!=","Tamamlandı"]]`
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
export const getPozDetails = async (pozNo,siparisNo) => {
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

 

  