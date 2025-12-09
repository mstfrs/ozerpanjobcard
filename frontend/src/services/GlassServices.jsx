import { toast } from 'react-toastify';

const baseUrl = import.meta.env.VITE_BASE_URL;

export const getGlassList = async (id, page = 1, pageSize = 25, sortField = null, sortOrder = "asc", statusFilter = null, glassTypeFilter = null) => {
  try {
    let url = `${baseUrl}/method/ozerpanjobcard.api.get_glass_list?order_no=${id}&page=${page}&page_size=${pageSize}`;
    if (sortField) {
      url += `&sort_field=${encodeURIComponent(sortField)}&sort_order=${encodeURIComponent(sortOrder)}`;
    }
    if (statusFilter) {
      url += `&status_filter=${encodeURIComponent(statusFilter)}`;
    }
    if (glassTypeFilter) {
      url += `&glass_type_filter=${encodeURIComponent(glassTypeFilter)}`;
    }
    
    const response = await fetch(
      url,
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
      return { data: [], total_count: 0, page: 1, page_size: pageSize, total_pages: 0 };
    }

    const data = await response.json();
    
    if (!data || !data.message) {
      console.error("Invalid response format:", data);
      return { data: [], total_count: 0, page: 1, page_size: pageSize, total_pages: 0 };
    }

    // Return the paginated response
    return data.message;
  } catch (error) {
    console.error("Cam Liste Fetch Error:", error);
    toast.error("Cam listesi getirilirken bir hata oluştu");
    return { data: [], total_count: 0, page: 1, page_size: pageSize, total_pages: 0 };
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