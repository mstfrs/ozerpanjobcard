const baseUrl = import.meta.env.VITE_BASE_URL;



export const getDealerWithDetailsByLoggedUser = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.dealerApi.get_dealer_by_logged_user`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Frappe API'leri genelde { message: {...} } formatında döner
    const apiResponse = result.message || result;
    
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      console.error("API Error:", apiResponse.message);
      return null;
    }
  } catch (error) {
    console.error("getDealerWithDetailsByLoggedUser error:", error);
    return null;
  }
};

export const getAllOrdersByCustomer = async (customerName) => {
  try {
    if (!customerName) {
      throw new Error("Customer ismi gerekli");
    }

    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.dealerApi.get_all_orders_by_customer`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: customerName }),
      }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Frappe API'leri genelde { message: {...} } formatında döner
    const apiResponse = result.message || result;
    
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      console.error("API Error:", apiResponse.message);
      return null;
    }
  } catch (error) {
    console.error("getAllOrdersByCustomer error:", error);
    return null;
  }
};

export const getDeliveredOrdersWithoutInstallation = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.dealerApi.get_delivered_orders_without_installation`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Frappe API'leri genelde { message: {...} } formatında döner
    const apiResponse = result.message || result;
    
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      console.error("API Error:", apiResponse.message);
      return null;
    }
  } catch (error) {
    console.error("getDeliveredOrdersWithoutInstallation error:", error);
    return null;
  }
};
