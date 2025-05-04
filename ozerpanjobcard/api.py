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
        url = "http://192.168.0.53/pstprnt"  # Zebra yazıcısının IP'si
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

