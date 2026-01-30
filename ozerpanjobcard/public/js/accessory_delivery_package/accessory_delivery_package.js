frappe.ui.form.on("Accessory Delivery Package", {
	refresh(frm) {
		// Button handler will be called via action in JSON
	},
	custom_print_materials(frm) {
		// Get items from the "Item list" table field
		// The fieldname might be "items" or "item_list" - adjust according to your actual fieldname
		const items = frm.doc.items || frm.doc.item_list || [];
		if (!items || items.length === 0) {
			frappe.msgprint({
				title: __('No Items'),
				message: __('Please add items to the Item list table'),
				indicator: 'orange'
			});
			return;
		}

		// Prepare data to send
		// Get sales_order - if it's a Link field, get the name value
		let sales_order = '';
		if (frm.doc.sales_order) {
			sales_order = frm.doc.sales_order;
		} else if (frm.doc.order_no) {
			sales_order = frm.doc.order_no;
		} else if (frm.doc.custom_sales_order) {
			sales_order = frm.doc.custom_sales_order;
		}
		const data = {
			name: frm.doc.name,
			dealer: frm.doc.dealer || '',
			end_customer: frm.doc.end_customer || '',
			sales_order: sales_order,
			items: items.map(item => ({
				item_code: item.item_code || '',
				item_name: item.item_name || '',
				qty: item.qty || item.quantity || 0,
				uom: item.uom || item.stock_uom || ''
			}))
		};
		console.log('Print data:', data);

		// Call the print function via API
		frappe.call({
			method: "ozerpanjobcard.api.print_accessory_package",
			args: {
				data: data
			},
			freeze: true,
			freeze_message: __('Printing label...'),
			callback: function(r) {
				if (r.message) {
					if (r.message.success) {
						frappe.show_alert({
							message: __('Label printed successfully'),
							indicator: 'green'
						}, 5);
					} else {
						frappe.msgprint({
							title: __('Print Error'),
							message: r.message.message || __('Error printing label'),
							indicator: 'red'
						});
					}
				}
			},
			error: function(err) {
				console.error("Error printing accessory package:", err);
				frappe.msgprint({
					title: __('Error'),
					message: __('An error occurred while printing'),
					indicator: 'red'
				});
			}
		});
	}
});
