frappe.ui.form.on("Production Plan", {
	onload(frm) {
		console.log("--Onload--");
	},
	refresh(frm) {
		console.log("--Refresh--");
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
	calculate_custom_total_mtul(frm) {
		console.log("calculate_custom_total_mtul");
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
				if (row && row.custom_mtul_per_piece) {
					const value = flt(row.custom_mtul_per_piece);
					total += value;
				}
			});
		}

		// Update the field value silently
		frm.set_value("custom_total_mtül", total);
		frm.refresh_field("custom_total_mtül");
	},
});
