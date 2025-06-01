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
		getGlassItems(frm);
	},
	custom_get_pvc_items(frm) {
		getPvcItems(frm);
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
});

function getGlassItems(frm) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: "custom_get_glass_items",
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

function getPvcItems(frm) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: "custom_get_pvc_items",
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
