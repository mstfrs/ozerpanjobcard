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

export const getAllOrdersByCustomer = async (customerName, page = 1, pageSize = 50) => {
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
        body: JSON.stringify({ 
          customer_name: customerName,
          page: page,
          page_size: pageSize
        }),
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
    const response = await
     fetch(
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
    console.log(result.message.data.orders)
    // Frappe API'leri genelde { message: {...} } formatında döner
    const apiResponse = result.message || result;
    
    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      console.error("API Error:", apiResponse.message);
      return null;
    }
  }
   catch (error) {
    console.error("getDeliveredOrdersWithoutInstallation error:", error);
    return null;
  }
};

export const getDeliveredItemsByOrder = async (salesOrder) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.dealerApi.get_delivered_items_by_order`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_order: salesOrder }),
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
    console.error("getDeliveredItemsByOrder error:", error);
    return null;
  }
};

export const getIssuesByLoggedCustomer = async ({ status = null, page = 1, pageSize = 50 } = {}) => {
  try {
    const response = await fetch(
      `${baseUrl}/method/ozerpanjobcard.dealerApi.get_issues_by_logged_customer`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, page, page_size: pageSize })
      }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const apiResponse = result.message || result;

    if (apiResponse.success) {
      return apiResponse.data;
    } else {
      console.error("API Error:", apiResponse.message);
      return null;
    }
  } catch (error) {
    console.error("getIssuesByLoggedCustomer error:", error);
    return null;
  }
};
