frappe.pages['bayipanel'].on_page_load = function(wrapper) {
	console.log('bayipanel');
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Bayi Panel',
		single_column: true
	});

	// Create container for buttons
	let $container = $(`<div class="button-container"></div>`).appendTo(page.main);
	
	// Add buttons
	let $montaj = $(`<button class="custom-btn montaj">Montaj</button>`).appendTo($container);
	let $tamir = $(`<button class="custom-btn tamir">Tamir</button>`).appendTo($container);
	let $servis = $(`<button class="custom-btn servis">Servis Talepleri</button>`).appendTo($container);

	// Add click handlers
	$montaj.on('click', () => {
		frappe.set_route('montaj');
	});

	$tamir.on('click', () => {
		frappe.set_route('List', 'Job Card', {'status': 'Tamir'});
	});

	$servis.on('click', () => {
		frappe.set_route('List', 'Job Card', {'status': 'Servis'});
	});

	// Add custom CSS
	$('<style>')
		.text(`
			.button-container {
				display: flex;
				flex-direction: row;
				justify-content: center;
				align-items: center;
				gap: 20px;
				margin-top: 50px;
				padding: 20px;
				flex-wrap: wrap;
			}
			.custom-btn {
				padding: 15px 30px;
				font-size: 16px;
				border: none;
				border-radius: 8px;
				cursor: pointer;
				transition: all 0.3s ease;
				font-weight: 500;
				min-width: 200px;
				box-shadow: 0 4px 6px rgba(0,0,0,0.1);
				flex: 1;
				max-width: 300px;
			}
			.custom-btn:hover {
				transform: translateY(-3px);
				box-shadow: 0 6px 8px rgba(0,0,0,0.2);
			}
			.custom-btn:active {
				transform: translateY(-1px);
			}
			.montaj {
				background-color: #2ecc71;
				color: white;
			}
			.tamir {
				background-color: #3498db;
				color: white;
			}
			.servis {
				background-color: #e74c3c;
				color: white;
			}
			.montaj:hover {
				background-color: #27ae60;
			}
			.tamir:hover {
				background-color: #2980b9;
			}
			.servis:hover {
				background-color: #c0392b;
			}

			/* Responsive tasarım için medya sorguları */
			@media screen and (max-width: 768px) {
				.button-container {
					flex-direction: column;
					padding: 10px;
				}
				.custom-btn {
					width: 100%;
					max-width: 100%;
					margin: 5px 0;
				}
			}

			/* Tablet için orta boyut ekran */
			@media screen and (min-width: 769px) and (max-width: 1024px) {
				.button-container {
					gap: 15px;
				}
				.custom-btn {
					min-width: 180px;
				}
			}
		`)
		.appendTo('head');
}