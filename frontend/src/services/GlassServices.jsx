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

  export const getGlassDetails = async (item_code) => {
    try {
      const response = await fetch(
        `${baseUrl}/method/ozerpanjobcard.api.get_glass_details?item_code=${item_code}`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.message || []
      
    } catch (error) {
      console.error("Cam Liste Fetch Error:", error);
    }
  };

