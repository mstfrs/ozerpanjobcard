from __future__ import unicode_literals
import frappe
from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan
from erpnext.manufacturing.doctype.work_order.work_order import get_item_details
from frappe.utils import now_datetime

class CustomProductionPlan(ProductionPlan):
    def add_items(self, items):
        print("items", items)
        refs = {}
        for data in items:
            if not data.pending_qty:
                continue

            # Get item details including custom fields
            item_doc = frappe.get_doc("Item", data.item_code)
            
            item_details = get_item_details(data.item_code, throw=False)
            if self.combine_items:
                bom_no = item_details.bom_no
                if data.get("bom_no"):
                    bom_no = data.get("bom_no")

                if bom_no in refs:
                    refs[bom_no]["so_details"].append(
                        {"sales_order": data.parent, "sales_order_item": data.name, "qty": data.pending_qty}
                    )
                    refs[bom_no]["qty"] += data.pending_qty
                    continue

                else:
                    refs[bom_no] = {
                        "qty": data.pending_qty,
                        "po_item_ref": data.name,
                        "so_details": [],
                    }
                    refs[bom_no]["so_details"].append(
                        {"sales_order": data.parent, "sales_order_item": data.name, "qty": data.pending_qty}
                    )

            bom_no = data.bom_no or item_details and item_details.get("bom_no") or ""
            if not bom_no:
                continue
            pi = self.append(
                "po_items",
                {
                    "warehouse": data.warehouse,
                    "item_code": data.item_code,
                    "description": data.description or item_details.description,
                    "stock_uom": item_details and item_details.stock_uom or "",
                    "bom_no": bom_no,
                    "planned_qty": data.pending_qty,
                    "pending_qty": data.pending_qty,
                    "planned_start_date": now_datetime(),
                    "product_bundle_item": data.parent_item,
                    "custom_serial": item_doc.custom_serial,
                    "custom_color": item_doc.custom_color,
                },
            )
            pi._set_defaults()
            if self.get_items_from == "Sales Order":
                pi.sales_order = data.parent
                pi.sales_order_item = data.name
                pi.description = data.description

            elif self.get_items_from == "Material Request":
                pi.material_request = data.parent
                pi.material_request_item = data.name
                pi.description = data.description

        if refs:
            for po_item in self.po_items:
                po_item.planned_qty = refs[po_item.bom_no]["qty"]
                po_item.pending_qty = refs[po_item.bom_no]["qty"]
                po_item.sales_order = ""
            self.add_pp_ref(refs) 