const baseUrl = import.meta.env.VITE_BASE_URL;


export const getGlassList = async (id) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/CamListe/${id}`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.data || []
      
    } catch (error) {
      console.error("Cam Liste Fetch Error:", error);
    }
  };

