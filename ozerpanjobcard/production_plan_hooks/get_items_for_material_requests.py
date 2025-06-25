import json

import frappe
from erpnext.manufacturing.doctype.production_plan.production_plan import (
    get_items_for_material_requests as original_get_items_for_material_requests,
)
from erpnext.manufacturing.doctype.production_plan.production_plan import (
    get_materials_from_other_locations,
    get_warehouse_list,
)
from frappe import _


@frappe.whitelist()
def get_items_for_material_requests(doc, warehouses=None, get_parent_warehouse_data=None):
    # Call the original function first to get the data
    # warehouses: [{"warehouse":"Finished Goods - TCL"},{"warehouse":"All Warehouses - TCL"}]

    if isinstance(doc, str):
        doc = frappe._dict(json.loads(doc))

    opt_no = doc.custom_opti_no

    mr_items = original_get_items_for_material_requests(
        doc, warehouses, get_parent_warehouse_data
    )

    if warehouses:
        warehouses = list(set(get_warehouse_list(warehouses)))

    # print("\n\n\n")
    # print("Doc:", doc)
    # print("Warehouses:", warehouses)
    # print("Get parent warehouse data:", get_parent_warehouse_data)
    # print("Items:", items)
    # print("\n\n\n")

    opt_profiles = get_opt_profiles(opt_no,doc.for_warehouse)

    item_codes_to_remove = []
    for op in opt_profiles:
        parts = op.get("item_code").split("-")
        item_codes_to_remove.append(parts[0])
        # mr_items.append(op)
        # mr_items.insert(0,op)

    # Delete Template Profiles
    mr_items = [m for m in mr_items if m.get("item_code") not in item_codes_to_remove]

    # new_mr_items = []
    # for item in mr_items:
    #     print("Item:", item)
    #     get_materials_from_other_locations(item, warehouses, new_mr_items, doc.company)

    #     mr_items = new_mr_items

    print("\nDebug:", 3, "\n")
    # You can modify the items here before returning
    # For example:
    # for item in items:
    #     # Modify item data as needed
    #     pass
    #

    print("Item:")
    for key, value in mr_items[0].items():
        print(f"{key}: {value}")

    return mr_items


@frappe.whitelist()
def get_opt_profiles(opt_no,for_warehouse):
    """Get profiles from OPT Genel based on OPT number"""
    if not opt_no:
        frappe.throw(_("OPT No is required"))

    # Get OPT Genel document
    opt_genel = frappe.get_doc("Opt Genel", opt_no)
    if not opt_genel:
        frappe.throw(_("OPT Genel document not found"))

    # Get profiles from OPT Genel Profile List
    profiles = []

    # Try different possible table field names
    table_field = None
    possible_table_fields = [
        "opt_genel_profile_list",
        "opt_genel_profiles",
        "profiles",
        "profile_list",
    ]

    for field in possible_table_fields:
        if hasattr(opt_genel, field):
            table_field = field
            break

    if not table_field:
        frappe.throw(_("Could not find profile list table in Opt Genel document"))

    for profile in getattr(opt_genel, table_field):
        # Convert custom_boy to float and format it
        try:
            boy_value = float(profile.boy)
            formatted_boy = f"{boy_value:.1f}"  # Format as one decimal place
        except (ValueError, TypeError):
            formatted_boy = profile.boy  # If conversion fails, use original value


        profiles.append(
            {
                "item_code": f"{profile.item_code}-{formatted_boy}",
                "quantity": profile.amountboy,
                "stock_uom": "Boy",
                "uom": "Boy",
                "required_bom_qty": profile.amountboy,
                "conversion_factor": 1.0,
                "warehouse":for_warehouse,
                "item_name":profile.item_name
            }
        )

    return profiles


# Item:
# item_code: 102441427
# item_name: Dorado 76 Cam Çıta 37mm Met.Ant.Gri
# quantity: 267.71999999999997
# conversion_factor: 1.0
# required_bom_qty: 267.71999999999997
# stock_uom: Nos
# warehouse: Goods In Transit - TCL
# safety_stock: 0.0
# actual_qty: 0.0
# projected_qty: 0.0
# ordered_qty: 0.0
# reserved_qty_for_production: 0.0
# min_order_qty: 0.0
# material_request_type: Purchase
# sales_order: None
# description: Dorado 76 Cam Çıta 37mm Met.Ant.Gri
# uom: Nos