# Copyright (c) 2024, Ozerpan and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan as ERPNextProductionPlan
from erpnext.manufacturing.doctype.work_order.work_order import get_item_details
from frappe.utils import now_datetime
from frappe.query_builder.functions import IfNull, Sum
from pypika.terms import ExistsCriterion

class CustomProductionPlan(ERPNextProductionPlan):
    def validate(self):
        super().validate()
        self.validate_custom_fields()
    
    def validate_custom_fields(self):
        """Validate custom fields added to Production Plan"""
        if self.custom_order_serial and not frappe.db.exists("Serial No", self.custom_order_serial):
            frappe.throw("Seçilen Seri Numarası sistemde bulunamadı!")
            
        if self.custom_order_color and not frappe.db.exists("Item", self.custom_order_color):
            frappe.throw("Seçilen Renk sistemde bulunamadı!")
            
    def on_submit(self):
        super().on_submit()
        self.update_custom_fields()
        
    def update_custom_fields(self):
        """Update custom fields in related documents"""
        if self.custom_order_serial:
            # Update Serial No with Production Plan reference
            frappe.db.set_value("Serial No", self.custom_order_serial, {
                "production_plan": self.name,
                "status": "In Production"
            })
            
        if self.custom_order_color:
            # Update Work Orders with color
            work_orders = frappe.get_all("Work Order", 
                filters={"production_plan": self.name},
                fields=["name"]
            )
            
            for wo in work_orders:
                frappe.db.set_value("Work Order", wo.name, "custom_order_color", self.custom_order_color)
                
    def on_cancel(self):
        super().on_cancel()
        self.reset_custom_fields()
        
    def reset_custom_fields(self):
        """Reset custom fields when Production Plan is cancelled"""
        if self.custom_order_serial:
            frappe.db.set_value("Serial No", self.custom_order_serial, {
                "production_plan": "",
                "status": "Available"
            })

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

    def get_sales_orders(self):
        """Override get_sales_orders to include custom filtering"""
        bom = frappe.qb.DocType("BOM")
        pi = frappe.qb.DocType("Packed Item")
        so = frappe.qb.DocType("Sales Order")
        so_item = frappe.qb.DocType("Sales Order Item")
        item = frappe.qb.DocType("Item")

        open_so_subquery1 = frappe.qb.from_(bom).select(bom.name).where(bom.is_active == 1)

        open_so_subquery2 = (
            frappe.qb.from_(pi)
            .select(pi.name)
            .where(
                (pi.parent == so.name)
                & (pi.parent_item == so_item.item_code)
                & (
                    ExistsCriterion(
                        frappe.qb.from_(bom)
                        .select(bom.name)
                        .where((bom.item == pi.item_code) & (bom.is_active == 1))
                    )
                )
            )
        )

        # Eğer custom_order_serial doluysa, Item ile join ve filtre uygula
        if self.custom_order_serial:
            open_so_query = (
                frappe.qb.from_(so)
                .from_(so_item)
                .join(item)
                .on(so_item.item_code == item.name)
                .select(so.name, so.transaction_date, so.customer, so.base_grand_total)
                .distinct()
                .where(
                    (so_item.parent == so.name)
                    & (so.docstatus == 1)
                    & (so.status.notin(["Stopped", "Closed"]))
                    & (so.company == self.company)
                    & (so_item.qty > so_item.production_plan_qty)
                    & (item.custom_serial == self.custom_order_serial)
                )
            )
        elif self.custom_order_color:
            open_so_query = (
                frappe.qb.from_(so)
                .from_(so_item)
                .join(item)
                .on(so_item.item_code == item.name)
                .select(so.name, so.transaction_date, so.customer, so.base_grand_total)
                .distinct()
                .where(
                    (so_item.parent == so.name)
                    & (so.docstatus == 1)
                    & (so.status.notin(["Stopped", "Closed"]))
                    & (so.company == self.company)
                    & (so_item.qty > so_item.production_plan_qty)
                    & (item.custom_color == self.custom_order_color)
                )
            )
        else:
            open_so_query = (
                frappe.qb.from_(so)
                .from_(so_item)
                .select(so.name, so.transaction_date, so.customer, so.base_grand_total)
                .distinct()
                .where(
                    (so_item.parent == so.name)
                    & (so.docstatus == 1)
                    & (so.status.notin(["Stopped", "Closed"]))
                    & (so.company == self.company)
                    & (so_item.qty > so_item.production_plan_qty)
                )
            )

        date_field_mapper = {
            "from_date": so.transaction_date >= self.from_date,
            "to_date": so.transaction_date <= self.to_date,
            "from_delivery_date": so_item.delivery_date >= self.from_delivery_date,
            "to_delivery_date": so_item.delivery_date <= self.to_delivery_date,
        }

        for field, value in date_field_mapper.items():
            if self.get(field):
                open_so_query = open_so_query.where(value)

        for field in ("customer", "project", "sales_order_status"):
            if self.get(field):
                so_field = "status" if field == "sales_order_status" else field
                open_so_query = open_so_query.where(so[so_field] == self.get(field))

        if self.item_code and frappe.db.exists("Item", self.item_code):
            open_so_query = open_so_query.where(so_item.item_code == self.item_code)
            open_so_subquery1 = open_so_subquery1.where(
                self.get_bom_item_condition() or bom.item == so_item.item_code
            )

        open_so_query = open_so_query.where(
            ExistsCriterion(open_so_subquery1) | ExistsCriterion(open_so_subquery2)
        )

        open_so = open_so_query.run(as_dict=True)
        return open_so 