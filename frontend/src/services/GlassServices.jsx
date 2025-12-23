import { toast } from 'react-toastify';

const baseUrl = import.meta.env.VITE_BASE_URL;

export const getGlassList = async (id, page = 1, pageSize = 25, sortField = null, sortOrder = "asc", statusFilter = null, glassTypeFilter = null) => {
  try {
    // Normalize order_no: trim whitespace for tablet compatibility
    const normalizedOrderNo = id ? String(id).trim() : id;
    
    // Use URLSearchParams for faster URL building
    const params = new URLSearchParams({
      order_no: normalizedOrderNo,
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (sortField) {
      params.append('sort_field', sortField);
      params.append('sort_order', sortOrder);
    }
    if (statusFilter) {
      params.append('status_filter', statusFilter);
    }
    if (glassTypeFilter) {
      params.append('glass_type_filter', glassTypeFilter);
    }
    
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.get_glass_list?${params.toString()}`,
      {
        method: "GET",
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        // Add cache control for better performance
        cache: 'no-cache',
      }
    );

    if (!response.ok) {
      // Only read error text if needed (lazy evaluation)
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error("Error response:", errorText);
      toast.error("Siparişe ait Cam listesi alınamadı");
      return { data: [], total_count: 0, page: 1, page_size: pageSize, total_pages: 0 };
    }

    const data = await response.json();
    
    // Direct return without extra checks (faster)
    return data?.message || { data: [], total_count: 0, page: 1, page_size: pageSize, total_pages: 0 };
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