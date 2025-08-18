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
def get_all_orders_by_customer(customer_name, page=1, page_size=50):
    """
    Verilen customer ismine ait custom_mly_list_uploaded = 1 olan siparişlerin tüm alanlarını getirir.
    PERFORMANS OPTİMİZE EDİLMİŞ VERSİYON + PAGINATION.
    
    Args:
        customer_name (str): Customer dokümanının adı
        page (int): Sayfa numarası (1'den başlar)
        page_size (int): Sayfa başına sipariş sayısı (max 100)
        
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "customer": Customer bilgileri,
                "orders": custom_mly_list_uploaded = 1 olan siparişler (optimize edilmiş),
                "total_orders": Toplam sipariş sayısı,
                "total_amount": Toplam sipariş tutarı,
                "pagination": Sayfalama bilgileri
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

        # Pagination parametrelerini kontrol et
        page = max(1, int(page))
        page_size = min(100, max(1, int(page_size)))  # Max 100, min 1
        offset = (page - 1) * page_size

        # Customer'ı kontrol et
        customer = frappe.get_doc("Customer", customer_name)
        if not customer:
            return {
                "success": False,
                "message": f"Customer bulunamadı: {customer_name}",
                "data": None
            }

        # PERFORMANS OPTİMİZASYONU: Önce toplam sayıyı al
        total_count = frappe.db.count("Sales Order", {
            "customer": customer_name,
            "custom_mly_list_uploaded": 1
        })

        # PERFORMANS OPTİMİZASYONU: Mevcut alanları dinamik olarak kontrol et
        sales_order_meta = frappe.get_meta("Sales Order")
        available_fields = [
            "name", "transaction_date", "delivery_date", "status", "docstatus",
            "grand_total", "total", "total_taxes_and_charges", "currency",
            "creation", "modified", "workflow_state", "owner", "modified_by"
        ]
        
        # Custom alanları kontrol et ve sadece mevcut olanları ekle
        custom_fields = ["custom_end_customer", "custom_mly_list_uploaded"]
        for field in custom_fields:
            if field in sales_order_meta.fields:
                available_fields.append(field)
            else:
                frappe.logger().warning(f"Sales Order'da {field} alanı bulunamadı, atlanıyor")

        # PERFORMANS OPTİMİZASYONU: Sadece gerekli alanları çek + LIMIT/OFFSET
        orders = frappe.get_all(
            "Sales Order",
            filters={
                "customer": customer_name,
                "custom_mly_list_uploaded": 1
            },
            fields=available_fields,
            order_by="transaction_date DESC",
            limit=page_size,
            limit_start=offset
        )

        # PERFORMANS OPTİMİZASYONU: Bulk query ile tüm item'ları tek seferde çek
        order_names = [order.name for order in orders]
        
        if not order_names:
            return {
                "success": True,
                "message": f"{customer_name} için sipariş bulunamadı",
                "data": {
                    "customer": customer.as_dict(),
                    "orders": [],
                    "total_orders": total_count,
                    "total_amount": 0,
                    "status_counts": {},
                    "summary": {"draft": 0, "submitted": 0, "cancelled": 0, "completed": 0},
                    "pagination": {
                        "current_page": page,
                        "page_size": page_size,
                        "total_pages": 0,
                        "has_next": False,
                        "has_prev": False
                    }
                }
            }

        # Tüm Sales Order Item'ları tek seferde çek
        all_items = frappe.db.sql("""
            SELECT 
                soi.parent as sales_order,
                soi.name as item_name,
                soi.item_code,
                soi.item_name as item_display_name,
                soi.qty,
                soi.rate,
                soi.amount,
                soi.delivered_qty,
                soi.warehouse,
                soi.uom,
                soi.description,
                soi.item_group
            FROM `tabSales Order Item` soi
            WHERE soi.parent IN %(order_names)s
            ORDER BY soi.parent, soi.idx
        """, {"order_names": tuple(order_names)}, as_dict=True)

        # Item'ları sales_order'a göre grupla
        items_by_order = {}
        for item in all_items:
            order_name = item.sales_order
            if order_name not in items_by_order:
                items_by_order[order_name] = []
            items_by_order[order_name].append(item)

        # PERFORMANS OPTİMİZASYONU: Bulk query ile tüm Item detaylarını tek seferde çek
        all_item_codes = list(set([item.item_code for item in all_items if item.item_code]))
        
        item_details = {}
        if all_item_codes:
            # Tek seferde tüm item detaylarını çek
            item_details_bulk = frappe.db.sql("""
                SELECT 
                    name as item_code,
                    item_name,
                    item_group,
                    description,
                    stock_uom,
                    custom_serial,
                    custom_color,
                    custom_width,
                    custom_height
                FROM `tabItem`
                WHERE name IN %(item_codes)s
            """, {"item_codes": tuple(all_item_codes)}, as_dict=True)
            
            # Dictionary'ye çevir
            item_details = {item.item_code: item for item in item_details_bulk}

        # PERFORMANS OPTİMİZASYONU: Her order için item'ları ekle
        detailed_orders = []
        for order in orders:
            order_dict = order.copy()
            
            # Bu order'a ait item'ları ekle
            order_items = items_by_order.get(order.name, [])
            order_dict["items"] = []
            
            for item in order_items:
                item_dict = item.copy()
                
                # Item detaylarını ekle (eğer varsa)
                if item.item_code and item.item_code in item_details:
                    item_dict["item_details"] = item_details[item.item_code]
                else:
                    item_dict["item_details"] = {
                        "item_name": item.item_display_name,
                        "item_group": item.item_group,
                        "description": item.description,
                        "stock_uom": item.uom,
                        "custom_serial": None,
                        "custom_color": None,
                        "custom_width": None,
                        "custom_height": None
                    }
                
                order_dict["items"].append(item_dict)
            
            detailed_orders.append(order_dict)

        # Toplam sipariş tutarı (sadece bu sayfadaki)
        page_total_amount = sum(float(order.get("grand_total") or 0) for order in detailed_orders)

        # İstatistikler (sadece bu sayfadaki)
        status_counts = {}
        for order in detailed_orders:
            status = order.get("status", "Unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        # Pagination bilgileri
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1

        return {
            "success": True,
            "message": f"{customer_name} için {len(detailed_orders)} sipariş bulundu (Sayfa {page}/{total_pages}) - Performans optimize edildi",
            "data": {
                "customer": customer.as_dict(),
                "orders": detailed_orders,
                "total_orders": total_count,
                "total_amount": page_total_amount,  # Sayfa toplam tutarı
                "page_total_amount": page_total_amount,  # Sayfa toplam tutarı (geriye uyumluluk)
                "status_counts": status_counts,
                "summary": {
                    "draft": status_counts.get("Draft", 0),
                    "submitted": status_counts.get("Submitted", 0),
                    "cancelled": status_counts.get("Cancelled", 0),
                    "completed": status_counts.get("Completed", 0)
                },
                "pagination": {
                    "current_page": page,
                    "page_size": page_size,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "showing": f"{offset + 1}-{min(offset + page_size, total_count)} / {total_count}"
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
    Sadece Installation yapılacak ürünü olan siparişleri döndürür.
    
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

        # Debug: Installation Note Item tablosunu kontrol et
        frappe.logger().debug("Checking Installation Note Item structure...")
        
        # Installation Note Item tablosunda hangi alanların olduğunu kontrol et
        try:
            installation_note_item_meta = frappe.get_meta("Installation Note Item")
            frappe.logger().debug(f"Installation Note Item fields: {list(installation_note_item_meta.fields.keys())}")
        except Exception as e:
            frappe.logger().error(f"Error getting Installation Note Item meta: {str(e)}")

        # Daha detaylı kontrol: Her teslim edilen ürün için Installation Note kontrolü yap
        delivered_orders = frappe.db.sql("""
            SELECT DISTINCT 
                so.name as sales_order,
                so.transaction_date,
                so.grand_total,
                so.status,
                so.custom_end_customer,
                COUNT(DISTINCT dn.name) as delivery_count,
                COUNT(DISTINCT dni.item_code) as total_items,
                SUM(dni.qty) as total_quantity
            FROM `tabSales Order` so
            INNER JOIN `tabSales Order Item` soi ON soi.parent = so.name
            INNER JOIN `tabDelivery Note Item` dni ON dni.against_sales_order = so.name
            INNER JOIN `tabDelivery Note` dn ON dn.name = dni.parent
            WHERE so.customer = %s 
                AND so.docstatus = 1
                AND dn.docstatus = 1
                AND dn.is_return = 0
                AND NOT EXISTS (
                    -- Bu ürün için Installation Note Item kaydı var mı kontrol et
                    SELECT 1 FROM `tabInstallation Note Item` ini
                    INNER JOIN `tabInstallation Note` in_main ON in_main.name = ini.parent
                    WHERE in_main.docstatus = 1
                        AND (
                            -- serial_no ile eşleştir (eğer varsa)
                            (dni.serial_no IS NOT NULL AND dni.serial_no = ini.serial_no)
                            OR
                            -- item_code ile eşleştir (serial_no yoksa)
                            (dni.serial_no IS NULL AND dni.item_code = ini.item_code)
                        )
                        AND in_main.customer = %s
                )
            GROUP BY so.name, so.transaction_date, so.grand_total, so.status, so.custom_end_customer
            ORDER BY so.transaction_date DESC
        """, (customer_name, customer_name), as_dict=True)

        # Debug: Bulunan siparişleri logla
        frappe.logger().debug(f"Found {len(delivered_orders)} orders without installation")
        for order in delivered_orders[:3]:  # İlk 3'ünü logla
            frappe.logger().debug(f"Order: {order['sales_order']} - Items: {order['total_items']}")

        # Her sipariş için item detaylarını parse et
        for order in delivered_orders:
            if order.get("item_details"):
                items_info = []
                item_details = order.item_details.split("|")
                for item_detail in item_details:
                    if ":" in item_detail:
                        parts = item_detail.split(":")
                        if len(parts) >= 3:
                            items_info.append({
                                "item_code": parts[0],
                                "custom_serial": parts[1] if parts[1] != "None" else None,
                                "custom_color": parts[2] if parts[2] != "None" else None
                            })
                order["items_info"] = items_info
            else:
                order["items_info"] = []
            
            # item_details string'ini kaldır (artık gerekli değil)
            if "item_details" in order:
                del order["item_details"]

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
                dni.serial_no,
                dn.name as delivery_note,
                dn.posting_date as delivery_date,
                dn.posting_time as delivery_time,
                dni.uom,
                dni.stock_uom,
                so.custom_end_customer,
                i.custom_serial,
                i.custom_color,
                i.custom_width,
                i.custom_height,
                i.item_group
            FROM `tabDelivery Note Item` dni
            INNER JOIN `tabDelivery Note` dn ON dn.name = dni.parent
            INNER JOIN `tabSales Order` so ON so.name = dni.against_sales_order
            LEFT JOIN `tabItem` i ON i.name = dni.item_code
            WHERE dni.against_sales_order = %s
                AND dn.docstatus = 1
                AND dn.is_return = 0
                AND (
                    -- Seri numarası olan ürünler için: Installation Note Item'da aynı serial_no yoksa
                    (dni.serial_no IS NOT NULL AND dni.serial_no != '' AND NOT EXISTS (
                        SELECT 1 FROM `tabInstallation Note Item` ini 
                        WHERE ini.serial_no = dni.serial_no
                    ))
                    OR
                    -- Seri numarası olmayan ürünler için: Installation Note Item'da aynı item_code yoksa
                    (dni.serial_no IS NULL OR dni.serial_no = '') AND NOT EXISTS (
                        SELECT 1 FROM `tabInstallation Note Item` ini 
                        WHERE ini.item_code = dni.item_code
                    )
                )
            ORDER BY dn.posting_date DESC, dni.idx
        """, (sales_order,), as_dict=True)
        print(delivered_items)
        # Her ürün için ek bilgileri al
        detailed_items = []
        for item in delivered_items:
            try:
                # Item dokümanından ek bilgileri al
                item_doc = frappe.get_doc("Item", item.item_code)
                
                # Custom field'ları kontrol et ve ekle
                custom_fields = {}
                for field_name in ['custom_serial', 'custom_color', 'custom_width', 'custom_height']:
                    if hasattr(item_doc, field_name):
                        custom_fields[field_name] = item_doc.get(field_name)
                
                # Alternatif field isimlerini de kontrol et
                alternative_fields = {
                    'serial': ['serial', 'serial_no', 'custom_serial'],
                    'color': ['color', 'custom_color', 'colour'],
                    'width': ['width', 'custom_width', 'genislik'],
                    'height': ['height', 'custom_height', 'yukseklik']
                }
                
                for field_type, field_names in alternative_fields.items():
                    if custom_fields.get(f'custom_{field_type}') is None:
                        for alt_name in field_names:
                            if hasattr(item_doc, alt_name):
                                value = item_doc.get(alt_name)
                                if value:
                                    custom_fields[f'custom_{field_type}'] = value
                                    break
                
                item["item_details"] = {
                    "item_group": item_doc.item_group,
                    "description": item_doc.description,
                    **custom_fields  # Tüm custom field'ları ekle
                }
                
                # SQL'den gelen değerleri de ekle (eğer varsa)
                if item.get("custom_serial"):
                    item["custom_serial"] = item.get("custom_serial")
                if item.get("custom_color"):
                    item["custom_color"] = item.get("custom_color")
                if item.get("custom_width"):
                    item["custom_width"] = item.get("custom_width")
                if item.get("custom_height"):
                    item["custom_height"] = item.get("custom_height")
                
                detailed_items.append(item)
            except Exception as e:
                frappe.logger().error(f"Error getting item details for {item.item_code}: {str(e)}")
                detailed_items.append(item)

        return {
            "success": True,
            "message": f"{sales_order} siparişi için {len(detailed_items)} adet teslim edilen ürün bulundu",
            "data": {
                "sales_order": sales_order_doc.as_dict(),
                "delivered_items": detailed_items,
                "summary": {
                    "total_items": len(detailed_items),
                    "total_quantity": sum(float(item.get("delivered_qty", 0)) for item in detailed_items),
                    "custom_end_customer": sales_order_doc.get("custom_end_customer", ""),
                    "order_date": sales_order_doc.get("transaction_date"),
                    "order_status": sales_order_doc.get("status")
                }
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
def create_installation_note(sales_order, selected_items, installation_data=None):
    """
    Seçilen ürünler için Installation Note oluşturur.
    
    Args:
        sales_order (str): Sales Order dokümanının adı
        selected_items (list): Seçilen ürünlerin listesi
        installation_data (dict): Montaj bilgileri (tarih, müşteri bilgileri, notlar)
        
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
        
        # Debug: Sales Order bilgilerini logla
        frappe.logger().debug(f"Sales Order bilgileri: customer={sales_order_doc.customer}, company={sales_order_doc.company}")
        
        # Territory alanını ekle (installation_data'dan veya fallback'ten)
        if installation_data and installation_data.get("territory"):
            installation_note.territory = installation_data.get("territory")
            frappe.logger().debug(f"Territory installation_data'dan alındı: {installation_data.get('territory')}")
        elif hasattr(sales_order_doc, 'territory') and sales_order_doc.territory:
            installation_note.territory = sales_order_doc.territory
            frappe.logger().debug(f"Territory Sales Order'dan alındı: {sales_order_doc.territory}")
        else:
            # Default territory olarak company'den al
            company_doc = frappe.get_doc("Company", sales_order_doc.company)
            if hasattr(company_doc, 'default_territory') and company_doc.default_territory:
                installation_note.territory = company_doc.default_territory
                frappe.logger().debug(f"Territory Company'den alındı: {company_doc.default_territory}")
            else:
                # En son çare olarak Turkey
                installation_note.territory = "Turkey"
                frappe.logger().debug("Territory Turkey olarak set edildi (fallback)")
        
        frappe.logger().debug(f"Final territory değeri: {installation_note.territory}")
        
        # Montaj bilgilerini ekle
        if installation_data:
            if installation_data.get("installation_date"):
                # ISO string formatındaki tarihi MySQL date formatına çevir
                try:
                    if isinstance(installation_data.get("installation_date"), str):
                        # ISO string'i parse et ve sadece date kısmını al
                        from datetime import datetime
                        iso_date = installation_data.get("installation_date")
                        frappe.logger().debug(f"Gelen tarih: {iso_date}, tip: {type(iso_date)}")
                        
                        if 'T' in iso_date:
                            # ISO format: "2025-08-14T07:22:20.062Z" -> "2025-08-14"
                            date_only = iso_date.split('T')[0]
                            installation_note.inst_date = date_only
                            frappe.logger().debug(f"Tarih parse edildi: {iso_date} -> {date_only}")
                        else:
                            # Zaten date format
                            installation_note.inst_date = iso_date
                            frappe.logger().debug(f"Tarih zaten doğru format: {iso_date}")
                    else:
                        # Date object ise string'e çevir
                        installation_note.inst_date = str(installation_data.get("installation_date"))
                        frappe.logger().debug(f"Date object string'e çevrildi: {installation_note.inst_date}")
                except Exception as e:
                    frappe.logger().warning(f"Tarih parse hatası: {e}, bugünün tarihi kullanılıyor")
                    installation_note.inst_date = frappe.utils.today()
            else:
                installation_note.inst_date = frappe.utils.today()
                frappe.logger().debug(f"Tarih yok, bugünün tarihi kullanılıyor: {installation_note.inst_date}")
                
            if installation_data.get("notes"):
                installation_note.remarks = installation_data.get("notes")
                
            # Custom müşteri bilgileri
            if installation_data.get("customer_name"):
                installation_note.custom_end_customer = installation_data.get("customer_name")
            if installation_data.get("customer_phone"):
                installation_note.custom_end_customer_phone = installation_data.get("customer_phone")
            if installation_data.get("customer_address"):
                installation_note.custom_end_customer_address = installation_data.get("customer_address")
        else:
            installation_note.inst_date = frappe.utils.today()
            frappe.logger().debug(f"installation_data yok, bugünün tarihi kullanılıyor: {installation_note.inst_date}")
        
        frappe.logger().debug(f"Final inst_date değeri: {installation_note.inst_date}")
        
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
            
            # Seri numarası varsa ekle
            if item_data.get("serial_no"):
                item_row.serial_no = item_data.get("serial_no")

        # Validation: Zorunlu alanları kontrol et
        if not installation_note.customer:
            frappe.throw("Customer alanı zorunlu")
        if not installation_note.company:
            frappe.throw("Company alanı zorunlu")
        if not installation_note.sales_order:
            frappe.throw("Sales Order alanı zorunlu")
        if not installation_note.items:
            frappe.throw("En az bir ürün eklenmeli")
        
        frappe.logger().debug(f"Installation Note validation başarılı, kaydediliyor...")
        
        # Installation Note'u kaydet
        installation_note.insert()
        installation_note.submit()

        # Debug: Oluşturulan Installation Note bilgilerini logla
        total_qty = sum(item.qty for item in installation_note.items) if installation_note.items else 0
        grand_total = sum(item.amount for item in installation_note.items) if installation_note.items else 0
        items_count = len(installation_note.items) if installation_note.items else 0
        
        frappe.logger().debug(f"Installation Note oluşturuldu: {installation_note.name}")
        frappe.logger().debug(f"Toplam ürün sayısı: {total_qty}")
        frappe.logger().debug(f"Toplam tutar: {grand_total}")
        frappe.logger().debug(f"Ürün sayısı: {items_count}")

        return {
            "success": True,
            "message": f"Installation Note başarıyla oluşturuldu: {installation_note.name}",
            "data": {
                "installation_note": {
                    "name": installation_note.name,
                    "customer": installation_note.customer,
                    "sales_order": installation_note.sales_order,
                    "posting_date": installation_note.posting_date,
                    "inst_date": installation_note.inst_date,
                    "total_qty": sum(item.qty for item in installation_note.items) if installation_note.items else 0,
                    "grand_total": sum(item.amount for item in installation_note.items) if installation_note.items else 0,
                    "custom_end_customer": installation_note.get("custom_end_customer"),
                    "custom_end_customer_phone": installation_note.get("custom_end_customer_phone"),
                    "custom_end_customer_address": installation_note.get("custom_end_customer_address"),
                    "remarks": installation_note.remarks,
                    "territory": installation_note.territory,
                    "items_count": len(installation_note.items) if installation_note.items else 0
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

@frappe.whitelist(allow_guest=False)
def test_installation_filtering(sales_order_name):
    """
    Belirli bir sipariş için Installation Note kontrolünü test eder.
    Debug amaçlı kullanılır.
    
    Args:
        sales_order_name (str): Test edilecek Sales Order adı
        
    Returns:
        dict: Test sonuçları
    """
    try:
        # 1. Bu siparişin teslim edilen ürünlerini bul
        delivered_items = frappe.db.sql("""
            SELECT 
                dni.item_code,
                dni.serial_no,
                dni.qty,
                dn.name as delivery_note,
                dn.posting_date
            FROM `tabDelivery Note Item` dni
            INNER JOIN `tabDelivery Note` dn ON dn.name = dni.parent
            WHERE dni.against_sales_order = %s
                AND dn.docstatus = 1
                AND dn.is_return = 0
        """, (sales_order_name,), as_dict=True)
        
        # 2. Bu ürünler için Installation Note var mı kontrol et
        installation_status = []
        for item in delivered_items:
            # serial_no ile kontrol
            if item.serial_no:
                installation_check = frappe.db.sql("""
                    SELECT 
                        ini.parent as installation_note,
                        ini.item_code,
                        ini.serial_no,
                        in_main.docstatus,
                        in_main.customer
                    FROM `tabInstallation Note Item` ini
                    INNER JOIN `tabInstallation Note` in_main ON in_main.name = ini.parent
                    WHERE ini.serial_no = %s
                """, (item.serial_no,), as_dict=True)
            else:
                # item_code ile kontrol
                installation_check = frappe.db.sql("""
                    SELECT 
                        ini.parent as installation_note,
                        ini.item_code,
                        ini.serial_no,
                        in_main.docstatus,
                        in_main.customer
                    FROM `tabInstallation Note Item` ini
                    INNER JOIN `tabInstallation Note` in_main ON in_main.name = ini.parent
                    WHERE ini.item_code = %s
                """, (item.item_code,), as_dict=True)
            
            installation_status.append({
                "item_code": item.item_code,
                "serial_no": item.serial_no,
                "delivery_note": item.delivery_note,
                "delivery_date": item.posting_date,
                "has_installation": len(installation_check) > 0,
                "installation_details": installation_check
            })
        
        # 3. Sonuçları döndür
        return {
            "success": True,
            "sales_order": sales_order_name,
            "delivered_items": delivered_items,
            "installation_status": installation_status,
            "summary": {
                "total_delivered_items": len(delivered_items),
                "items_with_installation": len([item for item in installation_status if item["has_installation"]]),
                "items_without_installation": len([item for item in installation_status if not item["has_installation"]])
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "test_installation_filtering error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def test_installation_note_fields():
    """
    Installation Note doctype'ının mevcut alanlarını test eder.
    Debug amaçlı kullanılır.
    """
    try:
        installation_note_meta = frappe.get_meta("Installation Note")
        available_fields = [field.fieldname for field in installation_note_meta.fields]
        
        installation_note_item_meta = frappe.get_meta("Installation Note Item")
        available_item_fields = [field.fieldname for field in installation_note_item_meta.fields]
        
        # Installation Note'da Sales Order ile bağlantı kurabilecek alanları kontrol et
        sales_order_related_fields = []
        for field in installation_note_meta.fields:
            if any(keyword in field.fieldname.lower() for keyword in ['sales', 'order', 'so', 'reference', 'against', 'prev', 'delivery', 'dn']):
                sales_order_related_fields.append({
                    'fieldname': field.fieldname,
                    'label': field.label,
                    'fieldtype': field.fieldtype,
                    'options': field.options
                })
        
        # Installation Note Item'da Sales Order ile bağlantı kurabilecek alanları kontrol et
        item_sales_order_related_fields = []
        for field in installation_note_item_meta.fields:
            if any(keyword in field.fieldname.lower() for keyword in ['sales', 'order', 'so', 'reference', 'against', 'prev', 'delivery', 'dn']):
                item_sales_order_related_fields.append({
                    'fieldname': field.fieldname,
                    'label': field.label,
                    'fieldtype': field.fieldtype,
                    'options': field.options
                })
        
        return {
            "success": True,
            "message": "Installation Note alanları başarıyla getirildi",
            "data": {
                "installation_note_fields": available_fields,
                "installation_note_item_fields": available_item_fields,
                "installation_note_sales_order_fields": sales_order_related_fields,
                "installation_note_item_sales_order_fields": item_sales_order_related_fields
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "test_installation_note_fields error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def get_completed_installations():
    """
    Giriş yapmış kullanıcıya bağlı bayinin tamamlanmış Installation Note'larını getirir.
    
    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "installations": Tamamlanmış Installation Note listesi
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

        # Önce mevcut Installation Note'ları kontrol et
        existing_installations = frappe.db.sql("""
            SELECT name, customer, docstatus, creation
            FROM `tabInstallation Note`
            WHERE customer = %s
            LIMIT 5
        """, (customer_name,), as_dict=True)
        
        frappe.logger().debug(f"Found {len(existing_installations)} existing installations for {customer_name}")
        for inst in existing_installations:
            frappe.logger().debug(f"Installation: {inst.name}, customer: {inst.customer}, docstatus: {inst.docstatus}")

        # Tamamlanmış Installation Note'ları getir - temel alanlar (Sales Order join'i geçici olarak kaldırıldı)
        completed_installations = frappe.db.sql("""
            SELECT 
                in_main.name,
                in_main.customer,
                in_main.customer_name,
                in_main.inst_date,
                in_main.remarks,
                in_main.status,
                in_main.territory,
                in_main.creation,
                COUNT(ini.name) as items_count
            FROM `tabInstallation Note` in_main
            LEFT JOIN `tabInstallation Note Item` ini ON ini.parent = in_main.name
            WHERE in_main.customer = %s 
                AND in_main.docstatus = 1
            GROUP BY in_main.name, in_main.customer, in_main.customer_name, 
                     in_main.inst_date, in_main.remarks, in_main.status, 
                     in_main.territory, in_main.creation
            ORDER BY in_main.creation DESC
        """, (customer_name,), as_dict=True)

        # Her Installation Note için item detaylarını getir
        for installation in completed_installations:
            # Önce Installation Note Item'larda prevdoc alanlarını kontrol et (debug)
            prevdoc_items = frappe.db.sql("""
                SELECT 
                    name, item_code, prevdoc_docname, prevdoc_doctype, parent
                FROM `tabInstallation Note Item` 
                WHERE parent = %s
                LIMIT 5
            """, (installation.name,), as_dict=True)
            
            frappe.logger().debug(f"Installation {installation.name} için prevdoc alanları:")
            for item in prevdoc_items:
                frappe.logger().debug(f"  Item: {item.name}, prevdoc_docname: {item.prevdoc_docname}, prevdoc_doctype: {item.prevdoc_doctype}")
            
            # Normal item detaylarını getir - Sales Order Item ve Items tablosu üzerinden bilgiler ile
            items = frappe.db.sql("""
                SELECT 
                    ini.item_code,
                    ini.qty,
                    ini.serial_no,
                    ini.description,
                    so.name as sales_order,
                    so.custom_end_customer,
                    i.custom_serial,
                    i.custom_color
                FROM `tabInstallation Note Item` ini
                LEFT JOIN `tabSales Order Item` soi ON ini.item_code = soi.item_code
                LEFT JOIN `tabSales Order` so ON soi.parent = so.name
                LEFT JOIN `tabItem` i ON ini.item_code = i.name
                WHERE ini.parent = %s
                ORDER BY ini.idx
            """, (installation.name,), as_dict=True)
            
            installation["items"] = items

        return {
            "success": True,
            "message": f"{len(completed_installations)} adet tamamlanmış montaj bulundu",
            "data": {
                "installations": completed_installations
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_completed_installations error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }

@frappe.whitelist(allow_guest=False)
def get_issues_by_logged_customer(status=None, page=1, page_size=50):
    """
    Giriş yapmış kullanıcının `Customer.custom_user_link` alanı ile eşleşen Customer'ını bulur,
    Issue'ları `Issue.customer` alanına göre filtreleyerek döndürür.

    Args:
        status (str, optional): Issue status filtresi (Open, Closed, vb.)
        page (int, optional): Sayfa numarası (>=1)
        page_size (int, optional): Sayfa başına kayıt sayısı (1-100)

    Returns:
        dict: {
            "success": bool,
            "message": str,
            "data": {
                "customer": str,                # Customer adı
                "issues": list[dict],           # Issue kayıtları
                "total": int,                   # Toplam kayıt sayısı
                "pagination": {                 # Sayfalama bilgileri
                    "current_page": int,
                    "page_size": int,
                    "total_pages": int,
                    "has_next": bool,
                    "has_prev": bool,
                    "showing": str
                }
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
                "message": "Bu kullanıcıya bağlı müşteri bulunamadı",
                "data": None
            }

        customer_name = customers[0]["name"]

        # Sayfalama sınırları
        page = max(1, int(page))
        page_size = min(100, max(1, int(page_size)))
        offset = (page - 1) * page_size

        filters = {"customer": customer_name}
        if status:
            filters["status"] = status

        # Issue alanlarını dinamik belirle (mevcut alanları seç)
        issue_meta = frappe.get_meta("Issue")
        available_fieldnames = {df.fieldname for df in getattr(issue_meta, "fields", [])}
        base_fields = [
            "name",
            "subject",
            "status",
            "customer",
            "creation",
            "modified",
        ]
        optional_fields = [
            "priority",
            "raised_by",
            "opening_date",
            "opening_time",
            "resolution_date",
            "serial_no",
            "sales_order",
            "custom_sales_order",
            "item_code",
            "description",
        ]
        fields = base_fields + [f for f in optional_fields if f in available_fieldnames]

        total = frappe.db.count("Issue", filters)

        issues = frappe.get_all(
            "Issue",
            filters=filters,
            fields=fields,
            order_by="creation desc",
            limit=page_size,
            limit_start=offset
        )

        # Sales Order eşlemesi: Öncelik serial_no/subject üzerinden (S502623-1-1 -> S502623),
        # ardından doğrudan sales_order/custom_sales_order alanları
        def extract_order_name(issue_row: dict):
            direct = issue_row.get("sales_order") or issue_row.get("custom_sales_order")
            if direct:
                return direct
            serial_text = (issue_row.get("serial_no") or issue_row.get("subject") or "").strip()
            if not serial_text:
                return None
            return (serial_text.split('-', 1)[0] or None)

        order_names = list({extract_order_name(i) for i in issues if extract_order_name(i)})
        if order_names:
            so_rows = frappe.get_all(
                "Sales Order",
                filters={"name": ["in", order_names]},
                fields=["name", "custom_end_customer"]
            )
            so_map = {row["name"]: row.get("custom_end_customer") for row in so_rows}
            for i in issues:
                so = extract_order_name(i)
                if so and so in so_map:
                    i["custom_end_customer"] = so_map[so]

        # Installation Date enrichment
        # 1) Seri no (veya subject) ile Installation Note Item eşlemesi
        serial_candidates = list({
            (i.get("serial_no") or i.get("subject") or "").strip()
            for i in issues
            if (i.get("serial_no") or i.get("subject"))
        })
        serial_candidates = [s for s in serial_candidates if s]
        if serial_candidates:
            rows = frappe.db.sql(
                """
                SELECT ini.serial_no, in_main.inst_date
                FROM `tabInstallation Note Item` ini
                INNER JOIN `tabInstallation Note` in_main ON in_main.name = ini.parent
                WHERE ini.serial_no IN %(serials)s
                """,
                {"serials": tuple(serial_candidates)},
                as_dict=True
            )
            serial_to_date = {}
            for r in rows:
                # Eğer aynı seri için birden fazla kayıt varsa en güncel tarihi seç
                current = serial_to_date.get(r.serial_no)
                if not current or (r.inst_date and r.inst_date > current):
                    serial_to_date[r.serial_no] = r.inst_date
            for i in issues:
                serial_or_subject = (i.get("serial_no") or i.get("subject") or "").strip()
                if serial_or_subject in serial_to_date:
                    i["installation_date"] = serial_to_date[serial_or_subject]

        # 2) Fallback: Installation Note.sales_order üzerinden (kalanlar için)
        remaining_orders = list({
            extract_order_name(i) for i in issues
            if not i.get("installation_date") and extract_order_name(i)
        })
        remaining_orders = [o for o in remaining_orders if o]
        if remaining_orders:
            in_rows = frappe.get_all(
                "Installation Note",
                filters={"sales_order": ["in", remaining_orders], "docstatus": 1},
                fields=["sales_order", "inst_date"],
                order_by="inst_date desc"
            )
            # En güncel tarihi seç
            order_to_date = {}
            for r in in_rows:
                if r.get("sales_order") and (r.get("sales_order") not in order_to_date or r.inst_date > order_to_date[r.get("sales_order")]):
                    order_to_date[r.get("sales_order")] = r.inst_date
            for i in issues:
                if not i.get("installation_date"):
                    so = extract_order_name(i)
                    if so and so in order_to_date:
                        i["installation_date"] = order_to_date[so]

        total_pages = (total + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1

        return {
            "success": True,
            "message": f"{customer_name} için {total} kayıt bulundu",
            "data": {
                "customer": customer_name,
                "issues": issues,
                "total": total,
                "pagination": {
                    "current_page": page,
                    "page_size": page_size,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "showing": f"{offset + 1}-{min(offset + page_size, total)} / {total}"
                }
            }
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_issues_by_logged_customer error")
        return {
            "success": False,
            "message": f"Hata oluştu: {str(e)}",
            "data": None
        }
