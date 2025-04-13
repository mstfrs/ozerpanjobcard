const baseUrl = import.meta.env.VITE_BASE_URL;


export const getItemDetails = async (itemNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/Item/${itemNo}?fields=["*"]`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid response data structure');
      }
      
      return data.data;
      
    } catch (error) {
      console.error(`Error fetching item details for ${itemNo}:`, error);
      throw error; // Re-throw the error for proper handling in the component
    }
  };


