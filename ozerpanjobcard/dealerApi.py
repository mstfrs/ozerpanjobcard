import frappe
from frappe import _

@frappe.whitelist(allow_guest=False)
def get_dealer_by_logged_user():
    """
    Giriş yapmış kullanıcıya bağlı bayinin tüm bilgilerini döndürür.
    
    Returns:
        dict: {
            "customer": Customer bilgileri,
            "primary_address": Birincil adres bilgileri,
            "primary_contact": Birincil kontak bilgileri,
            "sales_orders": Son siparişler,
            "total_orders": Toplam sipariş sayısı
        }
    """
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw("Kimlik doğrulama gerekli")

        # Customer'ı custom_user_link ile bul
        customers = frappe.get_all(
            "Customer",
            filters={"custom_user_link": user},
            fields=["*"]
        )
        
        if not customers:
            return {
                "success": False,
                "message": "Bu kullanıcıya bağlı bayi bulunamadı",
                "data": None
            }

        customer = customers[0]
        customer_name = customer.get("name")
        
        # Debug: Customer bilgilerini logla
        frappe.logger().debug(f"Customer found: {customer_name}")
        frappe.logger().debug(f"Customer primary_address: {customer.get('primary_address')}")
        frappe.logger().debug(f"Customer primary_contact: {customer.get('primary_contact')}")

        # Birincil adresi Customer.primary_address ile direkt JOIN
        primary_address = None
        if customer.get("primary_address"):
            try:
                primary_address = frappe.get_doc("Address", customer.primary_address).as_dict()
                frappe.logger().debug(f"Primary address found: {primary_address.get('name')}")
            except Exception as e:
                frappe.logger().error(f"Error getting primary address: {str(e)}")
        
        # Eğer primary_address yoksa, herhangi bir adres bul
        if not primary_address:
            addresses = frappe.db.sql("""
                SELECT a.*
                FROM `tabAddress` a
                INNER JOIN `tabDynamic Link` dl ON dl.parent = a.name
                WHERE dl.link_doctype = 'Customer' AND dl.link_name = %s
                ORDER BY a.is_primary_address DESC, a.creation DESC
                LIMIT 1
            """, (customer_name,), as_dict=True)
            
            if addresses:
                primary_address = addresses[0]
                frappe.logger().debug(f"Fallback address found: {primary_address.get('name')}")

        # Birincil kontağı Customer.primary_contact ile direkt JOIN
        primary_contact = None
        if customer.get("primary_contact"):
            try:
                primary_contact = frappe.get_doc("Contact", customer.primary_contact).as_dict()
                frappe.logger().debug(f"Primary contact found: {primary_contact.get('name')}")
            except Exception as e:
                frappe.logger().error(f"Error getting primary contact: {str(e)}")
        
        # Eğer primary_contact yoksa, herhangi bir kontak bul
        if not primary_contact:
            contacts = frappe.db.sql("""
                SELECT c.*
                FROM `tabContact` c
                INNER JOIN `tabDynamic Link` dl ON dl.parent = c.name
                WHERE dl.link_doctype = 'Customer' AND dl.link_name = %s
                ORDER BY c.is_primary_contact DESC, c.creation DESC
                LIMIT 1
            """, (customer_name,), as_dict=True)
            
            if contacts:
                primary_contact = contacts[0]
                frappe.logger().debug(f"Fallback contact found: {primary_contact.get('name')}")

        # Son siparişleri getir (son 10 tane) - sadece custom_mly_list_uploaded = 1 olanlar
        recent_orders = frappe.get_all(
            "Sales Order",
            filters={
                "customer": customer_name,
                "docstatus": 1,  # Sadece onaylanmış siparişler
                "custom_mly_list_uploaded": 1
            },
            fields=["name", "transaction_date", "grand_total", "status"],
            order_by="transaction_date DESC",
            limit=10
        )

        # Toplam sipariş sayısı - sadece custom_mly_list_uploaded = 1 olanlar
        total_orders = frappe.db.count("Sales Order", {
            "customer": customer_name,
            "docstatus": 1,
            "custom_mly_list_uploaded": 1
        })

        # Toplam sipariş tutarı - sadece custom_mly_list_uploaded = 1 olanlar
        total_amount = frappe.db.sql("""
            SELECT SUM(grand_total) as total
            FROM `tabSales Order`
            WHERE customer = %s AND docstatus = 1 AND custom_mly_list_uploaded = 1
        """, (customer_name,), as_dict=True)
        
        total_amount = total_amount[0].get("total") if total_amount else 0

        return {
            "success": True,
            "message": "Bayi bilgileri başarıyla getirildi",
            "data": {
                "customer": customer,
                "primary_address": primary_address,
                "primary_contact": primary_contact,
                "recent_orders": recent_orders,
                "total_orders": total_orders,
                "total_amount": total_amount
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_dealer_by_logged_user error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def get_all_orders_by_customer(customer_name):
    """
    Verilen customer ismine ait custom_mly_list_uploaded = 1 olan siparişlerin tüm alanlarını getirir.
    
    Args:
        customer_name (str): Customer dokümanının adı
        
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "customer": Customer bilgileri,
                "orders": custom_mly_list_uploaded = 1 olan siparişler (tüm alanlar dahil),
                "total_orders": Toplam sipariş sayısı,
                "total_amount": Toplam sipariş tutarı
            }
        }
    """
    try:
        if not customer_name:
            return {
                "success": False,
                "message": "Customer ismi gerekli",
                "data": None
            }

        # Customer'ı kontrol et
        customer = frappe.get_doc("Customer", customer_name)
        if not customer:
            return {
                "success": False,
                "message": f"Customer bulunamadı: {customer_name}",
                "data": None
            }

        # Sadece custom_mly_list_uploaded = 1 olan siparişleri getir
        orders = frappe.get_all(
            "Sales Order",
            filters={
                "customer": customer_name,
                "custom_mly_list_uploaded": 1
            },
            fields=["*"],  # Tüm alanlar
            order_by="transaction_date DESC"
        )

        # Her sipariş için detaylı bilgileri al
        detailed_orders = []
        for order in orders:
            try:
                # Sales Order dokümanını tam olarak al
                order_doc = frappe.get_doc("Sales Order", order.name)
                order_dict = order_doc.as_dict()
                
                # Items child table'ını da ekle
                order_dict["items"] = []
                for item in order_doc.items:
                    item_dict = item.as_dict()
                    # Item'ın ek bilgilerini de al
                    if item.item_code:
                        item_doc = frappe.get_doc("Item", item.item_code)
                        item_dict["item_details"] = {
                            "item_name": item_doc.item_name,
                            "item_group": item_doc.item_group,
                            "description": item_doc.description,
                            "stock_uom": item_doc.stock_uom,
                            "custom_serial": item_doc.get("custom_serial"),
                            "custom_color": item_doc.get("custom_color"),
                            "custom_width": item_doc.get("custom_width"),
                            "custom_height": item_doc.get("custom_height")
                        }
                    order_dict["items"].append(item_dict)
                
                detailed_orders.append(order_dict)
                
            except Exception as e:
                frappe.logger().error(f"Error getting order details for {order.name}: {str(e)}")
                # Hata olsa bile temel bilgileri ekle
                detailed_orders.append(order)

        # Toplam sipariş sayısı
        total_orders = len(detailed_orders)

        # Toplam sipariş tutarı - zaten filtrelenmiş siparişlerden hesaplanıyor
        total_amount = sum(float(order.get("grand_total") or 0) for order in detailed_orders)

        # İstatistikler
        status_counts = {}
        for order in detailed_orders:
            status = order.get("status", "Unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            "success": True,
            "message": f"{customer_name} için {total_orders} sipariş bulundu",
            "data": {
                "customer": customer.as_dict(),
                "orders": detailed_orders,
                "total_orders": total_orders,
                "total_amount": total_amount,
                "status_counts": status_counts,
                "summary": {
                    "draft": status_counts.get("Draft", 0),
                    "submitted": status_counts.get("Submitted", 0),
                    "cancelled": status_counts.get("Cancelled", 0),
                    "completed": status_counts.get("Completed", 0)
                }
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"get_all_orders_by_customer error for {customer_name}")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def get_delivered_orders_without_installation():
    """
    Teslim edilen ama Installation Note'u olmayan ürünlere ait siparişleri getirir.
    
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "orders": Sipariş listesi (sipariş numarası ve temel bilgiler)
            }
        }
    """
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw("Kimlik doğrulama gerekli")

        # Kullanıcıya bağlı customer'ı bul
        customers = frappe.get_all(
            "Customer",
            filters={"custom_user_link": user},
            fields=["name"]
        )
        
        if not customers:
            return {
                "success": False,
                "message": "Bu kullanıcıya bağlı bayi bulunamadı",
                "data": None
            }

        customer_name = customers[0].name

        # Teslim edilen ama Installation Note'u olmayan ürünlere ait siparişleri bul
        # Installation Note Item tablosunda sadece item_code ve serial_no var
        # Bu yüzden seri numarası olan ürünleri kontrol ediyoruz
        
        delivered_orders = frappe.db.sql("""
            SELECT DISTINCT 
                so.name as sales_order,
                so.transaction_date,
                so.grand_total,
                so.status,
                COUNT(DISTINCT dn.name) as delivery_count
            FROM `tabSales Order` so
            INNER JOIN `tabSales Order Item` soi ON soi.parent = so.name
            INNER JOIN `tabDelivery Note Item` dni ON dni.against_sales_order = so.name
            INNER JOIN `tabDelivery Note` dn ON dn.name = dni.parent
            WHERE so.customer = %s 
                AND so.docstatus = 1
                AND dn.docstatus = 1
                AND dn.is_return = 0
                AND dni.serial_no IS NOT NULL
                AND dni.serial_no != ''
                AND NOT EXISTS (
                    SELECT 1 FROM `tabInstallation Note Item` ini 
                    WHERE ini.serial_no = dni.serial_no
                )
            GROUP BY so.name
            ORDER BY so.transaction_date DESC
        """, (customer_name,), as_dict=True)

        return {
            "success": True,
            "message": f"{len(delivered_orders)} adet teslim edilen ama Installation Note'u olmayan sipariş bulundu",
            "data": {
                "orders": delivered_orders
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_delivered_orders_without_installation error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def get_delivered_items_by_order(sales_order):
    """
    Belirli bir siparişe ait teslim edilen ürünleri getirir.
    
    Args:
        sales_order (str): Sales Order dokümanının adı
        
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "sales_order": Sales Order bilgileri,
                "delivered_items": Teslim edilen ürünler listesi
            }
        }
    """
    try:
        if not sales_order:
            return {
                "success": False,
                "message": "Sales Order adı gerekli",
                "data": None
            }

        # Sales Order'ı kontrol et
        sales_order_doc = frappe.get_doc("Sales Order", sales_order)
        if not sales_order_doc:
            return {
                "success": False,
                "message": f"Sales Order bulunamadı: {sales_order}",
                "data": None
            }

        # Bu siparişe ait teslim edilen ürünleri getir
        # Installation Note Item tablosunda sadece item_code ve serial_no var
        delivered_items = frappe.db.sql("""
            SELECT 
                dni.item_code,
                dni.item_name,
                dni.qty as delivered_qty,
                dni.rate,
                dni.amount,
                dni.description,
                dni.against_sales_order,
                dni.against_sales_order_item,
                dni.serial_no,
                dn.name as delivery_note,
                dn.posting_date as delivery_date,
                dn.posting_time as delivery_time,
                soi.qty as ordered_qty,
                soi.uom,
                soi.stock_uom
            FROM `tabDelivery Note Item` dni
            INNER JOIN `tabDelivery Note` dn ON dn.name = dni.parent
            INNER JOIN `tabSales Order Item` soi ON soi.name = dni.against_sales_order_item
            WHERE dni.against_sales_order = %s
                AND dn.docstatus = 1
                AND dn.is_return = 0
                AND dni.serial_no IS NOT NULL
                AND dni.serial_no != ''
                AND NOT EXISTS (
                    SELECT 1 FROM `tabInstallation Note Item` ini 
                    WHERE ini.serial_no = dni.serial_no
                )
            ORDER BY dn.posting_date DESC, dni.idx
        """, (sales_order,), as_dict=True)

        # Her ürün için ek bilgileri al
        detailed_items = []
        for item in delivered_items:
            try:
                # Item dokümanından ek bilgileri al
                item_doc = frappe.get_doc("Item", item.item_code)
                item["item_details"] = {
                    "item_group": item_doc.item_group,
                    "custom_serial": item_doc.get("custom_serial"),
                    "custom_color": item_doc.get("custom_color"),
                    "custom_width": item_doc.get("custom_width"),
                    "custom_height": item_doc.get("custom_height"),
                    "description": item_doc.description
                }
                detailed_items.append(item)
            except Exception as e:
                frappe.logger().error(f"Error getting item details for {item.item_code}: {str(e)}")
                detailed_items.append(item)

        return {
            "success": True,
            "message": f"{sales_order} siparişi için {len(detailed_items)} adet teslim edilen ürün bulundu",
            "data": {
                "sales_order": sales_order_doc.as_dict(),
                "delivered_items": detailed_items
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"get_delivered_items_by_order error for {sales_order}")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def create_installation_note(sales_order, selected_items):
    """
    Seçilen ürünler için Installation Note oluşturur.
    
    Args:
        sales_order (str): Sales Order dokümanının adı
        selected_items (list): Seçilen ürünlerin listesi
        
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "installation_note": Oluşturulan Installation Note bilgileri
            }
        }
    """
    try:
        if not sales_order or not selected_items:
            return {
                "success": False,
                "message": "Sales Order ve seçilen ürünler gerekli",
                "data": None
            }

        # Sales Order'ı kontrol et
        sales_order_doc = frappe.get_doc("Sales Order", sales_order)
        if not sales_order_doc:
            return {
                "success": False,
                "message": f"Sales Order bulunamadı: {sales_order}",
                "data": None
            }

        # Installation Note oluştur
        installation_note = frappe.new_doc("Installation Note")
        installation_note.customer = sales_order_doc.customer
        installation_note.customer_name = sales_order_doc.customer_name
        installation_note.sales_order = sales_order
        installation_note.company = sales_order_doc.company
        installation_note.posting_date = frappe.utils.today()
        installation_note.posting_time = frappe.utils.nowtime()

        # Seçilen ürünleri ekle
        for item_data in selected_items:
            item_row = installation_note.append("items", {})
            item_row.item_code = item_data.get("item_code")
            item_row.item_name = item_data.get("item_name")
            item_row.qty = item_data.get("delivered_qty", 1)
            item_row.rate = item_data.get("rate", 0)
            item_row.amount = item_data.get("amount", 0)
            item_row.uom = item_data.get("uom", "Nos")
            item_row.stock_uom = item_data.get("stock_uom", "Nos")
            item_row.description = item_data.get("description", "")
            item_row.sales_order = sales_order
            item_row.delivery_note = item_data.get("delivery_note", "")
            item_row.against_sales_order_item = item_data.get("against_sales_order_item", "")

        # Installation Note'u kaydet
        installation_note.insert()
        installation_note.submit()

        return {
            "success": True,
            "message": f"Installation Note başarıyla oluşturuldu: {installation_note.name}",
            "data": {
                "installation_note": {
                    "name": installation_note.name,
                    "customer": installation_note.customer,
                    "sales_order": installation_note.sales_order,
                    "posting_date": installation_note.posting_date,
                    "total_qty": installation_note.total_qty,
                    "grand_total": installation_note.grand_total
                }
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"create_installation_note error for {sales_order}")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }
