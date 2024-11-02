const baseUrl = import.meta.env.VITE_BASE_URL;


export const getOptList = async () => {
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
export const getOptDetails = async (optNo) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/ProfilTeminOpt/${optNo}?fields=["*"]`
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
export const getProfiles = async () => {
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