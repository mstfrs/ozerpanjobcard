// Delivery Note ile ilgili servisler

export async function getCustomersWithSalesOrdersAndWorkOrders() {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_customers_with_sales_orders_and_work_orders');
  const data = await res.json();
  return data.message;
}

export async function getWorkOrderProducts(salesOrders, workOrders) {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_work_order_products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sales_orders: salesOrders, work_orders: workOrders }),
  });
  const data = await res.json();
  return data.message;
}

export async function getFiyat2ItemsForSalesOrder(salesOrders) {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_fiyat2_items_for_sales_order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sales_orders: salesOrders }),
  });
  const data = await res.json();
  return data.message;
}

export async function getSalesOrderItemsWithWorkOrderStatus(salesOrders) {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_sales_order_items_with_work_order_status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sales_orders: salesOrders }),
  });
  const data = await res.json();
  return data.message;
}

export async function getTotalCuttingForSalesOrders(salesOrders) {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_total_cutting_for_sales_orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sales_orders: salesOrders }),
  });
  const data = await res.json();
  return data.message;
} 