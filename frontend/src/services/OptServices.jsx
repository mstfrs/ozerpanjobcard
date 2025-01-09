const baseUrl = import.meta.env.VITE_BASE_URL;


//** PROFİL TEMIN */
export const getProfilTeminOptList = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/ProfilTeminOpt`
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
export const getProfilTeminOptDetails = async (optNo) => {
  console.log(optNo)
    try {
      const response = await fetch(
        `${baseUrl}/resource/Opt Genel/${optNo}?fields=["*"]`
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
  
export const updateProfilList = async (id,payload) => {
  console.log("id:",id)
  console.log("payload:",payload)
    try {
      const response = await fetch(
        `${baseUrl}/resource/Opt Genel Profile List/${id}`
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

  //** PROFİL TEMIN */

  //** SAC KESIM */
  export const getSacKesimOptList = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/SacKesimOpt`
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
export const getSacKesimOptDetails = async (optNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/Opt Genel/${optNo}?fields=["*"]`
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
export const getSacKesimProfiles = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/SacKesimOpt/911?fields=["*"]`
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

  export const updateDSTList = async (id,payload) => {
    console.log("id:",id)
    console.log("payload:",payload)
      try {
        const response = await fetch(
          `${baseUrl}/resource/Opt Genel Dst List/${id}`
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
  //** SAC KESIM */