const baseUrl = import.meta.env.VITE_BASE_URL;


export const getItemDetails = async (itemNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/Item/${itemNo}?fields=["*"]`
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


