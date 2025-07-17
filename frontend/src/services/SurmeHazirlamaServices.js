import axios from 'axios';
const baseUrl = import.meta.env.VITE_BASE_URL;

// Sipariş numarasına göre detayları getir
export const getsurmeOrders = async (operation) => {
  console.log("Operation surme Orders services",operation)
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpan_ercom_sync.custom_api.api.get_surme_orders`,
      {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          operation_type: operation.operations,
         
        }),
      }
      
    );

    if (!response.ok) {
      throw new Error("Sipariş detayları alınamadı");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Sipariş detayları getirme hatası:", error);
    throw error;
  }
};

// Poz numarasına göre jobcard detayları getir
export const getSurmeOrderJobcard = async (operation,pozItem) => {
  console.log("Operation surme Orders services",operation)
  try {
    const response = await fetch(
      "/api/method/ozerpanjobcard.api.get_jobcard_by_item_and_operation",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poz_item_code: pozItem,
          operation: operation
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Sipariş detayları alınamadı");
    }

    const data = await response.json();
    console.log(data.message.jobcard)
    // return data.message;
  } catch (error) {
    console.error("Sipariş detayları getirme hatası:", error);
    throw error;
  }
};

// sipariş numarasına göre Fiyat2 listesini detayları getir
export const getFiyat2List = async (orderNo) => {
  try {
    const response = await fetch(
      "/api/method/ozerpanjobcard.api.get_fiyat2_list",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_no: orderNo
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Fiyat2 List detayları alınamadı");
    }

    const data = await response.json();
    console.log(data.message)
    return data.message;
  } catch (error) {
    console.error("Fiyat2 List getirme hatası:", error);
    throw error;
  }
};

// Sipariş numarasına göre detayları getir
export const getOrderDetails = async (orderNo) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.get_surme_order_details?order_no=${orderNo}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Sipariş detayları alınamadı");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Sipariş detayları getirme hatası:", error);
    throw error;
  }
};

// Poz listesini getir
export const getPozList = async (orderNo) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.get_surme_poz_list?order_no=${orderNo}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Poz listesi alınamadı");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Poz listesi getirme hatası:", error);
    throw error;
  }
};

// Poz detaylarını getir
export const getPozDetails = async (orderNo, pozNo) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.get_surme_poz_details?order_no=${orderNo}&poz_no=${pozNo}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Poz detayları alınamadı");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Poz detayları getirme hatası:", error);
    throw error;
  }
};

// İşlem durumunu güncelle
export const updatePozStatus = async (orderNo, pozNo, status, employee) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.api.update_surme_status`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_no: orderNo,
          poz_no: pozNo,
          status: status,
          employee: employee,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Durum güncellenemedi");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Durum güncelleme hatası:", error);
    throw error;
  }
}; 