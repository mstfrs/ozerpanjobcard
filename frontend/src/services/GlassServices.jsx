import { toast } from 'react-toastify';

const baseUrl = import.meta.env.VITE_BASE_URL;

export const getGlassList = async (id) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.get_glass_list?order_no=${id}`,
      {
        method: "GET",
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      toast.error("Siparişe ait Cam listesi alınamadı");
      return [];
    }

    const data = await response.json();
    
    if (!data || !data.message) {
      console.error("Invalid response format:", data);
      return [];
    }

    return data.message;
  } catch (error) {
    console.error("Cam Liste Fetch Error:", error);
    toast.error("Cam listesi getirilirken bir hata oluştu");
    return [];
  }
};

export const getGlassDetails = async (item_code) => {
  try {
    const response = await fetch(
      `${baseUrl}/resource/Cam Recipe/${item_code}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Cam Liste Fetch Error:", error);
    toast.error("Cam detayı getirilirken bir hata oluştu");
    return [];
  }
};

export const processGlassOperation = async (payload) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpan_ercom_sync.custom_api.api.process_glass_operation`,
      {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
        toast.error(errorData.message?.message || "Cam operasyonu işlenirken bir hata oluştu");
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Cam Operasyon Fetch Error:", error);
    toast.error("Cam operasyonu işlenirken bir hata oluştu");
    return null;
  }
};