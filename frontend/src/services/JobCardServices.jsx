const baseUrl = import.meta.env.VITE_BASE_URL;


export const getJobCards = async (filters) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/Job Card?fields=["*"]&filters=${JSON.stringify(filters)}`
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