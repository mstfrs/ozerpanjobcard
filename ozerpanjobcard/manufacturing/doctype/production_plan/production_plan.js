frappe.ui.form.on("Production Plan", {
    // ... existing code ...

    custom_transfer_profiles(frm) {
        if (!frm.doc.custom_opti_no) {
            frappe.throw(__("Please enter OPT No first"));
            return;
        }

        frappe.call({
            method: "ozerpanjobcard.manufacturing.doctype.production_plan.production_plan.get_opt_profiles",
            args: {
                opt_no: frm.doc.custom_opti_no
            },
            callback: function(r) {
                if (r.message) {
                    // Clear existing mr_items
                    frm.set_value("mr_items", []);

                    // Add new items from OPT profiles
                    r.message.forEach((profile) => {
                        let new_item_code = profile.item_code + "-" + profile.custom_boy;
                        
                        // Check if item exists
                        frappe.call({
                            method: "frappe.client.get",
                            args: {
                                doctype: "Item",
                                name: new_item_code
                            },
                            callback: function(item_r) {
                                if (!item_r.message) {
                                    frappe.msgprint({
                                        title: __('Item Not Found'),
                                        message: __('Item {0} does not exist in the system', [new_item_code]),
                                        indicator: 'red'
                                    });
                                    return;
                                }

                                // Check stock availability
                                frappe.call({
                                    method: "erpnext.stock.get_item_details.get_bin_details",
                                    args: {
                                        item_code: new_item_code,
                                        warehouse: frm.doc.for_warehouse
                                    },
                                    callback: function(stock_r) {
                                        let d = frm.add_child("mr_items");
                                        d.item_code = new_item_code;
                                        d.quantity = profile.amountboy;
                                        d.warehouse = frm.doc.for_warehouse;
                                        
                                        // Set material request type based on stock availability
                                        if (stock_r.message && stock_r.message.actual_qty >= profile.amountboy) {
                                            d.material_request_type = "Material Transfer";
                                        } else {
                                            d.material_request_type = "Purchase";
                                        }
                                        
                                        refresh_field("mr_items");
                                    }
                                });
                            }
                        });
                    });
                }
            }
        });
    }
}); 