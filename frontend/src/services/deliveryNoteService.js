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

export async function createDeliveryNote(salesOrders, customer, itemGroup, itemCodes, grandTotal, customFields = {}, itemDetails = null) {
  const res = await fetch('/api/method/ozerpanjobcard.api.create_delivery_note_from_sales_orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sales_orders: salesOrders,
      customer: customer,
      item_group: itemGroup,
      item_details: itemDetails || itemCodes, // itemDetails varsa onu kullan, yoksa itemCodes
      ...customFields // custom_recipient, custom_vehicle, custom_delivery_photo
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Teslim edilecek hazır ürün bulunamadı.');
  }
  return data.message;
}

// Fotoğrafı base64 olarak ERPNext'e dosya olarak upload et
export async function uploadPhotoBase64(base64Data, fileName = 'delivery_photo.png') {
  // Convert base64 to Blob
  const byteString = atob(base64Data.split(',')[1]);
  const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });

  // Prepare FormData
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('is_private', '0');

  // Send to ERPNext
  const res = await fetch('/api/method/upload_file', {
    method: 'POST',
    body: formData,
    credentials: 'include', // if you need cookies/session
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Fotoğraf yüklenemedi.');
  }
  return data.message.file_url || data.message.name;
}

export async function getCustomersWithUndeliveredItems() {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_customers_with_undelivered_items', {
    method: 'GET',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Müşteri bilgileri alınamadı.');
  }
  return data.message;
}

export async function getCustomersWithUndeliveredPVCItems() {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_customers_with_undelivered_pvc_items', {
    method: 'GET',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Müşteri bilgileri alınamadı.');
  }
  return data.message;
}

export async function getCustomersWithUndeliveredCamItems() {
  const res = await fetch('/api/method/ozerpanjobcard.api.get_customers_with_undelivered_cam_items', {
    method: 'GET',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Müşteri bilgileri alınamadı.');
  }
  return data.message;
}