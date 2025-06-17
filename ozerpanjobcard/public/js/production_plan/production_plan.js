frappe.ui.form.on("Production Plan", {
	onload(frm) {
		console.log("--Onload--");
		// Add custom CSS for buttons
		frm.$wrapper.find('button[data-fieldname="get_items"]').css({
			'background-color': '#2ecc71',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px',
			'margin-right': '10px'
		});

		frm.$wrapper.find('button[data-fieldname="custom_get_glass_items"]').css({
			'background-color': '#3498db',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px'
		});
	},
	refresh(frm) {
		console.log("--Refresh--");
		// Add custom CSS for buttons
		frm.$wrapper.find('button[data-fieldname="get_items"]').css({
			'background-color': '#2ecc71',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px',
			'margin-right': '10px'
		});

		frm.$wrapper.find('button[data-fieldname="custom_get_glass_items"]').css({
			'background-color': '#3498db',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px'
		});
		frm.$wrapper.find('button[data-fieldname="custom_get_pvc_items"]').css({
			'background-color': '#fc0373',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px'
		});
		frm.$wrapper.find('button[data-fieldname="custom_transfer_profiles"]').css({
			'background-color': '#fc0373',
			'color': 'white',
			'border': 'none',
			'padding': '8px 15px',
			'border-radius': '4px'
		});
		
	},
	setup(frm) {
		frm.trigger("calculate_custom_total_mtul");

		// Add button below custom_total_mtül field
		frm.get_field("custom_total_mtül").$wrapper.append(`
			<button class="btn btn-primary btn-sm" style="margin-top: 5px;">
				${__("Toplam MTÜL Hesapla")}
			</button>
		`);

		// Add click handler for the button
		frm.get_field("custom_total_mtül")
			.$wrapper.find("button")
			.on("click", function () {
				frm.trigger("calculate_custom_total_mtul");
			});
	},
	custom_get_glass_items(frm) {
		getFilteredGlassItems(frm);
	},
	custom_get_pvc_items(frm) {
		getFilteredPvcItems(frm);
	},
	calculate_custom_total_mtul(frm) {
		let total = 0;
		if (frm.doc.po_items) {
			const grid = frm.get_field("po_items").grid;
			const selected_ids = grid.get_selected();

			if (!selected_ids || selected_ids.length === 0) {
				return;
			}

			// Get selected rows data from po_items
			selected_ids.forEach((id) => {
				const row = frm.doc.po_items.find((item) => item.name === id);
				
					const m2_value = flt(row.custom_mtul_per_piece);
					const quantity = flt(row.planned_qty);
					total += m2_value * quantity;
				
			});
		}

		// Update the field value silently
		frm.set_value("custom_total_mtül", total);
		frm.refresh_field("custom_total_mtül");
	},
	check_opt_profiles: function(frm) {
		return new Promise((resolve, reject) => {
			if (!frm.doc.custom_opti_no) {
				resolve();
				return;
			}

			// First get all profiles
			frappe.call({
				method: "ozerpanjobcard.manufacturing.doctype.production_plan.production_plan.get_opt_profiles",
				args: {
					opt_no: frm.doc.custom_opti_no
				},
				callback: function(r) {
					if (!r.message || !r.message.length) {
						frappe.throw(__("No profiles found for the given OPT No"));
						reject();
						return;
					}

					// Check all items first
					let missing_items = [];
					let checkPromises = [];

					// Create promises for each item check
					r.message.forEach((profile) => {
						if (!profile.boy || profile.boy === "0.0") {
							missing_items.push(profile.item_code + " (Boy değeri eksik veya 0.0)");
							return;
						}

						let new_item_code = profile.item_code + "-" + profile.boy;
						let promise = new Promise((resolve) => {
							frappe.call({
								method: "frappe.client.get",
								args: {
									doctype: "Item",
									name: new_item_code
								},
								callback: function(item_r) {
									if (!item_r.message) {
										missing_items.push(new_item_code);
									}
									resolve();
								}
							});
						});
						checkPromises.push(promise);
					});

					// Wait for all checks to complete
					Promise.all(checkPromises).then(() => {
						// If any items are missing, show error and stop
						if (missing_items.length > 0) {
							frappe.throw({
								title: __('Items Not Found'),
								message: __('Following items do not exist in the system: {0}', [missing_items.join(', ')]),
								indicator: 'red'
							});
							reject();
							return;
						}

						// If all items exist, proceed with the update
						let existing_items = frm.doc.mr_items || [];
						let items_to_keep = [];
						let base_items_to_replace = new Set();

						// First, identify which base items need to be replaced
						r.message.forEach((profile) => {
							let base_item = profile.item_code.split('-')[0];
							base_items_to_replace.add(base_item);
						});

						// Filter out items that need to be replaced
						existing_items.forEach((item) => {
							let item_base = item.item_code.split('-')[0];
							if (!base_items_to_replace.has(item_base)) {
								items_to_keep.push(item);
							}
						});

						// Clear mr_items and add back items to keep
						frm.set_value("mr_items", items_to_keep);

						// Add new items from OPT profiles
						r.message.forEach((profile) => {
							if (!profile.boy || profile.boy === "0.0") {
								return;
							}

							let new_item_code = profile.item_code + "-" + profile.boy;
							
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
									d.required_bom_qty = profile.amountboy;
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
						});

						resolve();
					});
				}
			});
		});
	},
	custom_transfer_profiles: function(frm) {
		if (!frm.doc.custom_opti_no) {
			frappe.throw(__("Please enter OPT No first"));
			return;
		}

		if (!frm.doc.for_warehouse) {
			frappe.throw(__("Please select For Warehouse first"));
			return;
		}

		frm.trigger('check_opt_profiles');
	},
	validate: function(frm) {
		return new Promise((resolve, reject) => {
			if (!frm.doc.custom_opti_no) {
				resolve();
				return;
			}

			frm.trigger('check_opt_profiles')
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}
});

function getFilteredGlassItems(frm) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: "get_filtered_glass_items",
			freeze: true,
			doc: frm.doc,
			callback: function(r) {
				if (r.message) {
					if (r.message.po_items) {
						frm.set_value("po_items", r.message.po_items);
					}
					frm.refresh_field("po_items");
					resolve(r);
				} else {
					reject(new Error("No response message"));
				}
			},
			error: function(err) {
				console.error("Error getting glass items:", err);
				reject(err);
			}
		});
	});
}

function getFilteredPvcItems(frm) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: "get_filtered_pvc_items",
			freeze: true,
			doc: frm.doc,
			callback: function(r) {
				if (r.message) {
					if (r.message.po_items) {
						frm.set_value("po_items", r.message.po_items);
					}
					frm.refresh_field("po_items");
					resolve(r);
				} else {
					reject(new Error("No response message"));
				}
			},
			error: function(err) {
				console.error("Error getting PVC items:", err);
				reject(err);
			}
		});
	});
}
