from __future__ import unicode_literals
import frappe
from frappe import _
from erpnext.manufacturing.doctype.production_plan.production_plan import ProductionPlan
from erpnext.manufacturing.doctype.work_order.work_order import get_item_details
from frappe.utils import now_datetime, flt
from datetime import datetime, time
from pypika.terms import ExistsCriterion


class CustomProductionPlan(ProductionPlan):
    def add_items(self, items):
        print("=== add_items called ===")
        print("items:", items)
        refs = {}
        for data in items:
            print("Processing item:", data)
            if not data.pending_qty:
                print("Skipping item - no pending qty")
                continue

            # Get item details including custom fields
            item_doc = frappe.get_doc("Item", data.item_code)
            print("Item doc:", item_doc.name)
            
            item_details = get_item_details(data.item_code, throw=False)
            print("Item details:", item_details)
            
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
            print("BOM No:", bom_no)
            if not bom_no:
                print("Skipping item - no BOM")
                continue

            # Set planned_start_date to current date with 08:00 time
            current_date = now_datetime().date()
            planned_start_date = datetime.combine(current_date, time(8, 0))

            # Create new po_item with all required fields
            print("Creating new po_item")
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
                    "planned_start_date": planned_start_date,
                    "product_bundle_item": data.parent_item,
                    "custom_serial": item_doc.custom_serial,
                    "custom_color": item_doc.custom_color,
                    "sales_order": data.parent,
                    "sales_order_item": data.name,
                    "material_request": "",
                    "material_request_item": "",
                    "actual_qty": 0,
                    "min_order_qty": 0,
                    "projected_qty": 0,
                    "ordered_qty": 0,
                    "reserved_qty_for_production": 0,
                    "safety_stock": 0,
                    "actual_start_date": None,
                    "actual_end_date": None,
                    "status": "Not Started"
                },
            )
            print("Created po_item:", pi.name)
            
            # Set defaults and sales order details
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
        
        print("=== add_items completed ===")
        print("Final po_items:", self.po_items)

    @frappe.whitelist()
    def custom_get_glass_items(self):
        """Get only glass items from selected sales orders"""
        print("=== custom_get_glass_items started ===")
        if not self.get("sales_orders"):
            frappe.throw(_("Please select Sales Orders first"))

        so_list = [d.sales_order for d in self.sales_orders if d.sales_order]
        print("Sales Orders:", so_list)
        
        # Get all items from selected sales orders
        so_items = frappe.get_all(
            "Sales Order Item",
            filters={
                "parent": ["in", so_list],
                "docstatus": 1,
                "qty": [">", "production_plan_qty"]
            },
            fields=["parent", "item_code", "warehouse", "qty", "work_order_qty", 
                   "delivered_qty", "conversion_factor", "description", "name", "bom_no"]
        )
        print("SO Items:", so_items)

        if not so_items:
            frappe.throw(_("No items found in selected sales orders"))

        # Filter only glass items
        glass_items = []
        non_glass_items = []
        items_without_bom = []
        
        for item in so_items:
            item_group = frappe.db.get_value("Item", item.item_code, "item_group")
            print(f"Item {item.item_code} group:", item_group)
            
            if item_group == "Camlar":
                item.pending_qty = (
                    flt(item.qty) - max(item.work_order_qty, item.delivered_qty, 0)
                ) * item.conversion_factor
                
                # Get BOM for the item if not already set
                if not item.bom_no:
                    item.bom_no = frappe.db.get_value("BOM", {
                        "item": item.item_code,
                        "is_active": 1,
                        "is_default": 1
                    }, "name")
                
                if item.bom_no:
                    glass_items.append(item)
                    print(f"Added glass item: {item.item_code}")
                else:
                    items_without_bom.append(item.item_code)
                    print(f"Glass item without BOM: {item.item_code}")
            else:
                non_glass_items.append(item.item_code)
                print(f"Non-glass item: {item.item_code}")

        print("Glass items:", glass_items)
        print("Non-glass items:", non_glass_items)
        print("Items without BOM:", items_without_bom)

        # Prepare detailed error message
        if not glass_items:
            error_msg = []
            if non_glass_items:
                error_msg.append(_("Found non-glass items: {0}").format(", ".join(non_glass_items)))
            if items_without_bom:
                error_msg.append(_("Found glass items without BOM: {0}").format(", ".join(items_without_bom)))
            
            if error_msg:
                frappe.throw(_("No valid glass items found. Details: {0}").format(" | ".join(error_msg)))
            else:
                frappe.throw(_("No glass items found in selected sales orders"))

        # Clear existing items and add new ones
        print("Clearing existing po_items")
        self.set("po_items", [])
        print("Adding glass items")
        self.add_items(glass_items)
        
        # Calculate totals and save
        print("Calculating total planned qty")
        self.calculate_total_planned_qty()
        print("Saving document")
        self.save()
        
        # Refresh the document
        print("Reloading document")
        self.reload()
        
        print("=== custom_get_glass_items completed ===")
        print("Final po_items:", self.po_items)
        
        # Convert po_items to list of dicts for JSON serialization
        po_items_list = []
        for item in self.po_items:
            po_items_list.append(item.as_dict())
        
        return {
            "message": _("Glass items added successfully"),
            "items": glass_items,
            "po_items": po_items_list
        }

    def get_sales_orders(self):
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

        # Base query with common conditions
        base_query = (
            frappe.qb.from_(so)
            .from_(so_item)
            .join(item)
            .on(so_item.item_code == item.name)
            .select(
                so.name,
                so.transaction_date,
                so.customer,
                so.base_grand_total,
                so.custom_end_customer
            )
            .distinct()
            .where(
                (so_item.parent == so.name)
                & (so.docstatus == 1)
                & (so.status.notin(["Stopped", "Closed"]))
                & (so.company == self.company)
                & (so_item.qty > so_item.production_plan_qty)
            )
        )

        # Apply filters based on custom_order_serial and custom_order_color
        if self.custom_order_serial and self.custom_order_color:
            # Both filters are present - use AND logic
            open_so_query = base_query.where(
                (item.custom_serial == self.custom_order_serial)
                & (item.custom_color == self.custom_order_color)
            )
        elif self.custom_order_serial:
            # Only serial filter is present
            open_so_query = base_query.where(item.custom_serial == self.custom_order_serial)
        elif self.custom_order_color:
            # Only color filter is present
            open_so_query = base_query.where(item.custom_color == self.custom_order_color)
        else:
            # No custom filters
            open_so_query = base_query

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

    @frappe.whitelist()
    def get_open_sales_orders(self):
        """Pull sales orders which are pending to deliver based on criteria selected"""
        open_so = self.get_sales_orders()

        if open_so:
            self.add_so_in_table(open_so)
        else:
            frappe.msgprint(_("Sales orders are not available for production"))

    def add_so_in_table(self, open_so):
        """Add sales orders in the table"""
        self.set("sales_orders", [])

        for data in open_so:
            self.append(
                "sales_orders",
                {
                    "sales_order": data.name,
                    "sales_order_date": data.transaction_date,
                    "customer": data.customer,
                    "grand_total": data.base_grand_total,
                    "custom_end_customer": data.custom_end_customer
                },
            )

