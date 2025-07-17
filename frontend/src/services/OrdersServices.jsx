const baseUrl = import.meta.env.VITE_BASE_URL;


export const getOrdersFromOpt = async (operation,optNo) => {
  console.log(optNo)
    try {
      const response = await fetch(
  "/api/method/ozerpanjobcard.api.get_sales_orders_by_opti",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ custom_opti_no: optNo.custom_opti_no }),
  }
);
const data = await response.json();
return data
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };

  export const getPozFromProductionPlan = async (sales_order) => {
    console.log("sales_order",sales_order)
      try {
        const response = await fetch(
          "/api/method/ozerpanjobcard.api.get_item_codes_by_sales_order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales_order: sales_order.sales_order }),
          }
        );
        const data = await response.json();
        return data.message; // ← item_code dizisi burada
        
      } catch (error) {
        console.error("Job Cards Fetch Error:", error);
      }
    };
  



  


 




export const getBomItemsByItemCode = async (item_code, operation = null) => {
  console.log("item_code", item_code, "operation", operation);
  try {
    const response = await fetch(
      "/api/method/ozerpanjobcard.api.get_bom_items_by_item_code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          item_code: item_code,
          operation: operation 
        }),
      }
    );
    const data = await response.json();
    return data.message; // ← BOM items dizisi burada
    
  } catch (error) {
    console.error("BOM Items Fetch Error:", error);
  }
};



