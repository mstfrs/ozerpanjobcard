import frappe

@frappe.whitelist()
def add_opt_no_to_work_orders(production_plan, opt_no):
    # Production Plan'dan üretilen Work Order'ları bulun
    print(production_plan, opt_no)
    work_orders = frappe.get_all("Work Order", filters={"production_plan": production_plan}, fields=["name"])

    for wo in work_orders:
        # Work Order'da custom_opti_no alanını güncelle
        work_order = frappe.get_doc("Work Order", wo.name)
        work_order.custom_opti_no = opt_no
        work_order.save()

        # İş Kartlarına custom_opti_no değerini ekleyin
        job_cards = frappe.get_all("Job Card", filters={"work_order": wo.name}, fields=["name"])
        for jc in job_cards:
            job_card = frappe.get_doc("Job Card", jc.name)
            job_card.custom_opti_no = opt_no
            job_card.save()


def set_opt_no_for_work_order(doc, method):
    # Eğer Work Order bir Production Plan'dan türetilmişse
    if doc.production_plan:
        # Production Plan'dan custom_opti_no değerini alın
        production_plan = frappe.get_doc("Production Plan", doc.production_plan)
        doc.custom_opti_no = production_plan.custom_opti_no

def set_opt_no_for_job_card(doc, method):
    # Eğer Job Card bir Work Order'dan türetilmişse
    if doc.work_order:
        # Work Order'dan custom_opti_no değerini alın
        work_order = frappe.get_doc("Work Order", doc.work_order)
        doc.custom_opti_no = work_order.custom_opti_no

@frappe.whitelist()
def get_glass_details(item_code):
    try:
        item = frappe.get_doc("Cam Recipe", item_code)
        if not item:
            return {"error": "Item not found"}

        return {
            "item_code": item.item_no,
            "item_name": item.get("custom_item_name",""),         
            "custom_top_gunes_gecirgenligi": item.get("custom_top_gunes_gecirgenligi", ""),
            "custom_u_degeri": item.get("custom_u_degeri", ""),
            "custom_isik_gecirgenligi": item.get("custom_isik_gecirgenligi", ""),
        }
    except Exception as e:
        frappe.log_error(f"Error in get_glass_details: {str(e)}")
        return {"error": str(e)}

import frappe
import requests

@frappe.whitelist(allow_guest=True)
def print_surme_label():
    try:
        # Gelen ham veriyi al
        label_data = frappe.request.get_data(as_text=True)

        # Boş veri kontrolü
        if not label_data.strip():
            frappe.throw("Received empty label data")

        # Yazıcıya istek yap
        url = "http://192.168.0.246/pstprnt"  # Zebra yazıcısının IP'si
        headers = {"Content-Type": "text/plain"}  # JSON yerine düz metin
        response = requests.post(url, headers=headers, data=label_data)

        if response.status_code == 200:
            return {"success": True, "message": "Label sent to printer successfully"}
        else:
            return {"success": False, "message": f"Printer Error: {response.status_code}"}

    except Exception as e:
        frappe.log_error(
            title="Printer Error",
            message=f"{e.__class__.__name__}: {str(e)[:500]}"
        )
        return {"success": False, "message": f"Printer Connection Failed: {str(e)}"}
        
@frappe.whitelist(allow_guest=True)
def print_glass_label():
    try:
        # Gelen ham veriyi al
        label_data = frappe.request.get_data(as_text=True)

        # Boş veri kontrolü
        if not label_data.strip():
            frappe.throw("Received empty label data")

        # Yazıcıya istek yap
        url = "http://192.168.0.227/pstprnt"  # Zebra yazıcısının IP'si
        headers = {"Content-Type": "text/plain"}  # JSON yerine düz metin
        response = requests.post(url, headers=headers, data=label_data)

        if response.status_code == 200:
            return {"success": True, "message": "Label sent to printer successfully"}
        else:
            return {"success": False, "message": f"Printer Error: {response.status_code}"}

    except Exception as e:
        frappe.log_error(
            title="Printer Error",
            message=f"{e.__class__.__name__}: {str(e)[:500]}"
        )
        return {"success": False, "message": f"Printer Connection Failed: {str(e)}"}
        
@frappe.whitelist(allow_guest=True)
def print_quality_label():
    try:
        # Gelen ham veriyi al
        label_data = frappe.request.get_data(as_text=True)

        # Boş veri kontrolü
        if not label_data.strip():
            frappe.throw("Received empty label data")

        # Yazıcıya istek yap
        url = "http://192.168.0.90/pstprnt"  # Zebra yazıcısının IP'si
        headers = {"Content-Type": "text/plain"}  # JSON yerine düz metin
        response = requests.post(url, headers=headers, data=label_data)

        if response.status_code == 200:
            return {"success": True, "message": "Label sent to printer successfully"}
        else:
            return {"success": False, "message": f"Printer Error: {response.status_code}"}

    except Exception as e:
        frappe.log_error(
            title="Printer Error",
            message=f"{e.__class__.__name__}: {str(e)[:500]}"  # Description'a uzun yaz, title kısa kalsın
        )

        return {"success": False, "message": f"Printer Connection Failed: {str(e)}"}

import frappe
from frappe import _
@frappe.whitelist()
def get_quality_label_items(quality_check_code, total_mtul):
    try:
        # Quality Label Items doctype'ını filtreleyin
        quality_label_items = frappe.db.sql("""
            SELECT 
                qli.*
            FROM 
                `tabQuality Label Items` qli
            JOIN 
                `tabQuality Label Frame Codes` qlfc ON qlfc.parent = qli.name
            WHERE 
                qlfc.frame_code = %s
                AND qli.min <= %s
                AND qli.max >= %s
        """, (quality_check_code, total_mtul, total_mtul), as_dict=True)

        return quality_label_items
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in get_quality_label_items"))
        return {"error": str(e)}


@frappe.whitelist()
def get_glass_list(order_no):
    try:
        frappe.logger().debug(f"Getting glass list for order: {order_no}")
        
        if not order_no:
            frappe.throw("Order number is required")
            
        camlar = frappe.get_all(
            "CamListe",
            filters={"order_no": order_no},
            fields=["*"]
        )
        
        frappe.logger().debug(f"Found {len(camlar)} glass records")
        
        for cam in camlar:
            cam_doc = frappe.get_doc("CamListe", cam.name)
            cam["job_cards"] = [g.as_dict() for g in cam_doc.job_cards]
            
        frappe.logger().debug(f"Returning glass list with job cards")
        return camlar
        
    except Exception as e:
        frappe.logger().error(f"Error in get_glass_list: {str(e)}")
        frappe.throw(f"Error getting glass list: {str(e)}")

@frappe.whitelist(allow_guest=False)
def update_profile_stock_ledger_qty(profile_type, length, qty):
    doc = frappe.get_all(
        "Profile Stock Ledger",
        filters={"profile_type": profile_type, "length": length},
        fields=["name"]
    )
    if not doc:
        frappe.throw(_("No matching Profile Stock Ledger record found."))
    docname = doc[0]["name"]
    ledger_doc = frappe.get_doc("Profile Stock Ledger", docname)
    ledger_doc.qty = (ledger_doc.qty or 0) - float(qty)
    ledger_doc.save()
    return {"name": docname, "qty": ledger_doc.qty}


@frappe.whitelist(allow_guest=True)
def get_serial_details(serial):
    print(serial)
    try:
        frappe.logger().debug(f"Getting details for serial: {serial}")
        
        # Get the serial number details from the database with all fields
        serial_doc = frappe.get_all("Serial No", 
            filters={"name": serial},
            fields=["*"]
        )
        
        if not serial_doc:
            frappe.logger().error(f"No serial document found for: {serial}")
            return None
            
        serial_doc = serial_doc[0]  # Get the first (and should be only) result
        print(serial_doc)
        frappe.logger().debug(f"Serial doc found: {serial_doc}")

        # Get the sales order details
        sales_order = None
        if serial_doc.get("purchase_document_type") == "Sales Order":
            frappe.logger().debug(f"Getting sales order: {serial_doc.get('purchase_document_no')}")
            sales_order = frappe.get_doc("Sales Order", serial_doc.get("purchase_document_no"))
            frappe.logger().debug(f"Sales order found: {sales_order}")

        # Get the customer details
        customer = None
        if sales_order:
            frappe.logger().debug(f"Getting customer: {sales_order.customer}")
            customer = frappe.get_doc("Customer", sales_order.customer)
            frappe.logger().debug(f"Customer found: {customer}")

        # Get the item details
        frappe.logger().debug(f"Getting item: {serial_doc.get('item_code')}")
        item = frappe.get_doc("Item", serial_doc.get("item_code"))
        frappe.logger().debug(f"Item found: {item}")

        # Get any existing issues for this serial number
        frappe.logger().debug(f"Getting issues for serial: {serial}")
        issues = frappe.get_all("Issue",
            filters={"serial_no": serial},
            fields=["name", "description", "status", "creation"],
            order_by="creation desc"
        )
        frappe.logger().debug(f"Found {len(issues)} issues")

        # Get tasks for each issue
        for issue in issues:
            frappe.logger().debug(f"Getting tasks for issue: {issue.name}")
            issue["tasks"] = frappe.get_all("Task",
                filters={"issue": issue.name},
                fields=["name", "subject", "status", "assigned_to"]
            )
            frappe.logger().debug(f"Found {len(issue['tasks'])} tasks")

        response = {
            "serial": serial,
            "serial_details": serial_doc,  # This will contain all fields from Serial No
            "item_code": serial_doc.get("item_code"),
            "sales_order_no": sales_order.name if sales_order else None,
            "customer": customer.name if customer else None,
            "address_display": customer.address_display if customer else None,
            "contact_mobile": customer.mobile_no if customer else None,
            "custom_serial": item.custom_serial if item else None,
            "custom_color": item.custom_color if item else None,
            "cam_text": item.custom_cam_text if item else None,
            "warranty_expiry": serial_doc.get("warranty_expiry_date"),
            "issues": issues
        }
        
        frappe.logger().debug(f"Returning response: {response}")
        return response

    except Exception as e:
        frappe.logger().error(f"Error in get_serial_details: {str(e)}")
        frappe.logger().error(frappe.get_traceback())
        return None

@frappe.whitelist(allow_guest=True)
def guest_create_issue(subject, description, custom_name_surname, custom_phone, custom_address, serial_no, customer, item_code, sales_order):
    try:
        # Create a new issue
        issue = frappe.get_doc({
            "doctype": "Issue",
            "subject": subject,
            "description": description,
            "custom_name_surname": custom_name_surname,
            "custom_phone": custom_phone,
            "custom_address": custom_address,
            "serial_no": serial_no,
            "customer": customer,
            "item_code": item_code,
            "sales_order": sales_order,
            "status": "Open"
        })
        issue.insert(ignore_permissions=True)
        return issue.name

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in guest_create_issue"))
        return None 
    try:
        # Create a new issue
        issue = frappe.get_doc({
            "doctype": "Issue",
            "subject": subject,
            "description": description,
            "custom_name_surname": custom_name_surname,
            "custom_phone": custom_phone,
            "custom_address": custom_address,
            "serial_no": serial_no,
            "customer": customer,
            "item_code": item_code,
            "sales_order": sales_order,
            "status": "Open"
        })
        issue.insert(ignore_permissions=True)
        return issue.name

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error in guest_create_issue"))
        return None

import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def get_sales_orders_by_opti(custom_opti_no):
    """
    Verilen custom_opti_no değerine sahip Production Plan'ın Sales Orders (child) kayıtlarını döndürür.
    """
    # Önce Production Plan'ı bul
    production_plan = frappe.db.get_value(
        "Production Plan",
        {"custom_opti_no": custom_opti_no},
        "name"
    )
    if not production_plan:
        return {"error": _("Production Plan bulunamadı.")}

    # Child table'dan Sales Orders'ı çek
    sales_orders = frappe.db.sql("""
        SELECT
            `tabProduction Plan Sales Order`.*
        FROM
            `tabProduction Plan Sales Order`
        WHERE
            `parent` = %s
    """, (production_plan,), as_dict=True)

    return sales_orders

import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def get_item_codes_by_sales_order(sales_order):
    """
    Verilen sales_order'a ait, Job Card'ı olan Production Plan Item'lardaki tüm satırları döndürür.
    """
    items = frappe.db.sql("""
        SELECT
            ppi.*,
            i.item_name,
            i.description,
            i.stock_uom,
            i.item_group
        FROM
            `tabProduction Plan Item` ppi
        LEFT JOIN
            `tabItem` i ON ppi.item_code = i.name
        WHERE
            ppi.sales_order = %s
            AND EXISTS (
                SELECT 1 FROM `tabJob Card` jc
                WHERE jc.production_item = ppi.item_code
            )
    """, (sales_order,), as_dict=True)

    return {"items": items}

@frappe.whitelist(allow_guest=True)
def get_bom_items_by_item_code(item_code, operation=None):
    """
    Verilen item_code'a ait BOM (Bill of Materials) ürünlerini ve adetlerini döndürür.
    Aynı zamanda bu item_code'a ait Job Card bilgilerini de döndürür.
    Eğer operation parametresi verilirse, sadece o operasyona ait Job Card'ları döndürür.
    """
    # Önce item'ın aktif BOM'unu bul
    bom = frappe.db.get_value(
        "BOM",
        {"item": item_code, "is_active": 1, "is_default": 1},
        "name"
    )
    
    if not bom:
        # Eğer default BOM yoksa, herhangi bir aktif BOM'u al
        bom = frappe.db.get_value(
            "BOM",
            {"item": item_code, "is_active": 1},
            "name"
        )
    
    if not bom:
        return {"error": f"'{item_code}' için aktif BOM bulunamadı."}

    # BOM Item'larını çek (child table)
    bom_items = frappe.db.sql("""
        SELECT
            bi.*,
            i.item_name,
            i.description,
            i.stock_uom,
            i.item_group
        FROM
            `tabBOM Item` bi
        LEFT JOIN
            `tabItem` i ON bi.item_code = i.name
        WHERE
            bi.parent = %s
        ORDER BY
            bi.idx
    """, (bom,), as_dict=True)

    # Bu item_code'a ait Job Card'ları çek
    # Eğer operation parametresi varsa, sadece o operasyona ait olanları getir
    if operation:
        job_cards = frappe.db.sql("""
            SELECT
                jc.*,
                wo.name as work_order_name,
                wo.production_item,
                wo.qty as work_order_qty
            FROM
                `tabJob Card` jc
            LEFT JOIN
                `tabWork Order` wo ON jc.work_order = wo.name
            WHERE
                jc.production_item = %s AND jc.operation = %s
            ORDER BY
                jc.creation DESC
        """, (item_code, operation), as_dict=True)
    else:
        job_cards = frappe.db.sql("""
            SELECT
                jc.*,
                wo.name as work_order_name,
                wo.production_item,
                wo.qty as work_order_qty
            FROM
                `tabJob Card` jc
            LEFT JOIN
                `tabWork Order` wo ON jc.work_order = wo.name
            WHERE
                jc.production_item = %s
            ORDER BY
                jc.creation DESC
        """, (item_code,), as_dict=True)

    return {
        "bom_items": bom_items,
        "job_cards": job_cards,
        "bom_name": bom
    }

@frappe.whitelist(allow_guest=False)
def create_profile_exit(profile_type, length, qty, opt_no):
    from frappe.utils import nowdate
    try:
        # Profile Exit ana dokümanını oluştur
        profile_exit = frappe.get_doc({
            "doctype": "Profile Exit",
            "date": nowdate(),
            "items": [
                {
                    "item_code": profile_type,
                    "length": length,
                    "output_quantity": qty,
                    "opt_no": opt_no
                }
            ]
        })
        profile_exit.insert()
        profile_exit.submit()
        return {"success": True, "name": profile_exit.name}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Profile Exit Creation Error")
        return {"success": False, "error": str(e)}

@frappe.whitelist(allow_guest=True)
def get_fiyat2_list(order_no):
    """
    Verilen order_no ile Fiyat2 List dokümanını ve tüm alanlarını (items child table dahil) döndürür.
    Sadece item_group'un parent_group'u 'Yardimci Profil' olan item'lar döner.
    """
    try:
        doc = frappe.get_doc("Fiyat2 List", order_no)
        if not doc:
            return {"error": f"Fiyat2 List bulunamadı: {order_no}"}
        doc_dict = doc.as_dict()
        filtered_items = []
        for item in doc.items:
            item_code = item.stock_code
            if not item_code:
                continue
            item_group = frappe.db.get_value("Item", item_code, "item_group")
            if not item_group:
                continue
            parent_group = frappe.db.get_value("Item Group", item_group, "parent_item_group")
            if parent_group == "Yardimci Profil":
                filtered_items.append(item.as_dict())
        doc_dict["items"] = filtered_items
        return doc_dict
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_fiyat2_list error")
        return {"error": str(e)}

@frappe.whitelist(allow_guest=True)
def print_surme_label_local():
    import tempfile
    import subprocess
    try:
        # Gelen ham veriyi al
        label_data = frappe.request.get_data(as_text=True)

        # Boş veri kontrolü
        if not label_data.strip():
            frappe.throw("Received empty label data")

        # Geçici bir dosyaya yaz
        with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as tmpfile:
            tmpfile.write(label_data)
            tmpfile_path = tmpfile.name

        # lpr komutu ile yazıcıya gönder
        printer_name = "SurmeEtiket"  # Yazıcınızın adı
        result = subprocess.run(['lpr', '-P', printer_name, tmpfile_path], capture_output=True, text=True)

        if result.returncode == 0:
            return {"success": True, "message": "Label sent to printer successfully"}
        else:
            return {"success": False, "message": f"Printer Error: {result.stderr}"}

    except Exception as e:
        frappe.log_error(
            title="Printer Error",
            message=f"{e.__class__.__name__}: {str(e)[:500]}"
        )
        return {"success": False, "message": f"Printer Connection Failed: {str(e)}"}