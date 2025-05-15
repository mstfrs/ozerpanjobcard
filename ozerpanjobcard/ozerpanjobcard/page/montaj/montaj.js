frappe.pages['montaj'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Montaj Formu',
		single_column: true
	});

	// Require QuaggaJS library
	frappe.require([
		'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js'
	], function() {
		// Form container
		let $form = $(`<div class="montaj-form"></div>`).appendTo(page.main);

		// Form fields HTML
		let form_html = `
			<div class="form-group">
				<label for="barcode">Barkod Okuyucu</label>
				<div class="barcode-input-group">
					<input type="text" class="form-control" id="barcode" placeholder="Barkodu okutunuz" autocomplete="off">
					<button type="button" class="btn btn-secondary camera-btn" id="cameraBtn">
						<i class="fa fa-barcode"></i>
					</button>
				</div>
				<small class="form-text text-muted">Barkodu okutunuz veya manuel giriniz</small>
			</div>

			<!-- Barkod Tarayıcı Modal -->
			<div class="modal fade" id="barcodeScannerModal" tabindex="-1" role="dialog">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title">Barkod Tarayıcı</h5>
							<button type="button" class="close" data-dismiss="modal">
								<span>&times;</span>
							</button>
						</div>
						<div class="modal-body">
							<div id="interactive" class="viewport"></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Barkod Tablosu -->
			<div class="barcode-table-container">
				<h4>Okutulan Barkodlar</h4>
				<table class="table table-bordered" id="barcodeTable">
					<thead>
						<tr>
							<th>Item Code</th>
							<th>Seri No</th>
							<th>İşlem</th>
						</tr>
					</thead>
					<tbody>
					</tbody>
				</table>
			</div>

			<div class="form-group">
				<label for="customer_name">Müşteri Adı *</label>
				<input type="text" class="form-control" id="customer_name" required>
			</div>
			<div class="form-group">
				<label for="customer_phone">Telefon *</label>
				<input type="tel" class="form-control" id="customer_phone" placeholder="5XX XXX XX XX" maxlength="13" required>
				<small class="form-text text-muted">Örnek: 532 123 45 67</small>
			</div>
			<div class="form-group">
				<label for="customer_address">Adres *</label>
				<div class="address-input-group">
					<textarea class="form-control" id="customer_address" rows="3" required></textarea>
					<button type="button" class="btn btn-secondary location-btn" id="locationBtn">
						<i class="fa fa-map-marker"></i> Konum Al
					</button>
				</div>
			</div>
			<div class="form-group">
				<label for="installation_date">Montaj Tarihi *</label>
				<input type="date" class="form-control" id="installation_date" required>
			</div>
			<div class="form-group">
				<label for="notes">Notlar</label>
				<textarea class="form-control" id="notes" rows="3"></textarea>
			</div>

			<button class="btn btn-primary btn-lg btn-save">Kaydet</button>
		`;

		$form.html(form_html);

		// Barkod tarayıcı değişkeni
		let scanner = null;

		// Kamera butonu için event listener
		$('#cameraBtn').on('click', function() {
			$('#barcodeScannerModal').modal('show');
			
			// Tarayıcıyı başlat
			if (!scanner) {
				Quagga.init({
					inputStream: {
						name: "Live",
						type: "LiveStream",
						target: document.querySelector("#interactive"),
						constraints: {
							facingMode: "environment",
							width: { min: 640 },
							height: { min: 480 }
						},
					},
					decoder: {
						readers: [
							"code_128_reader",
							"ean_reader",
							"ean_8_reader",
							"upc_reader",
							"upc_e_reader",
							"code_39_reader"
						],
						multiple: false
					}
				}, function(err) {
					if (err) {
						console.error("Quagga başlatılamadı:", err);
						frappe.msgprint('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.');
						return;
					}
					console.log("Quagga başlatıldı");
					Quagga.start();
				});

				// Barkod tespit edildiğinde
				Quagga.onDetected(function(result) {
					if (result.codeResult.code) {
						$('#barcode').val(result.codeResult.code);
						$('#barcode').trigger('keypress', [{which: 13}]);
						$('#barcodeScannerModal').modal('hide');
					}
				});
			}
		});

		// Modal kapandığında tarayıcıyı durdur
		$('#barcodeScannerModal').on('hidden.bs.modal', function() {
			if (Quagga.isRunning) {
				Quagga.stop();
				scanner = null;
			}
		});

		// Barkod input alanına tıklandığında
		$('#barcode').on('focus', function() {
			$('#cameraBtn').click();
		});

		// Barkod okutma işlemi
		$('#barcode').on('keypress', function(e) {
			if (e.which === 13) { // Enter tuşu
				e.preventDefault();
				let barcode = $(this).val();
				
				if (barcode) {
					// TesDetay tablosundan bilgileri çek
					frappe.get_barcode_details(barcode)
						.then(result => {
							if (result) {
								let item = {
									item_code: result.siparis_no + '-' + result.poz_no,
									serial_no: result.siparis_no + '-' + result.poz_no + '-' + result.sanal_adet
								};

								// Tabloya ekle
								addToTable(item);
								// Veriyi sakla
								scannedItems.push(item);
								// Input'u temizle
								$('#barcode').val('');
							} else {
								frappe.msgprint('Barkod bulunamadı!');
							}
						})
						.catch(err => {
							frappe.msgprint('Barkod sorgulanırken bir hata oluştu!');
							console.error(err);
						});
				}
			}
		});

		// Barkod tablosu için veri saklama
		let scannedItems = [];

		// Barkod detaylarını getiren metod
		frappe.get_barcode_details = function(barcode) {
			return new Promise((resolve, reject) => {
				frappe.db.get_list('TesDetay', {
					filters: {
						barkod: barcode
					},
					fields: ['siparis_no', 'poz_no', 'sanal_adet'],
					limit: 1
				}).then(records => {
					if (records && records.length > 0) {
						// Sales Order'dan müşteri bilgisini al
						frappe.db.get_value('Sales Order', {
							name: records[0].siparis_no
						}, 'custom_end_customer').then(customer => {
							if (customer && customer.message) {
								// Müşteri alanını doldur
								$('#customer_name').val(customer.message.custom_end_customer);
							}
						});
						resolve(records[0]);
					} else {
						resolve(null);
					}
				}).catch(err => {
					reject(err);
				});
			});
		};

		// Koordinatlardan adres alma fonksiyonu
		function get_address_from_coordinates(latitude, longitude) {
			return new Promise((resolve, reject) => {
				// Google Maps Geocoding API URL
				const apiKey = frappe.sys_defaults.google_maps_api_key || '';
				if (!apiKey) {
					reject('Google Maps API anahtarı bulunamadı!');
					return;
				}

				const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=tr`;

				// API'ye istek at
				frappe.call({
					method: 'frappe.client.get',
					args: {
						url: url
					},
					callback: function(r) {
						if (r.message && r.message.results && r.message.results.length > 0) {
							// En uygun adresi al
							const address = r.message.results[0].formatted_address;
							resolve(address);
						} else {
							reject('Adres bulunamadı!');
						}
					},
					error: function(err) {
						reject('Adres alınırken bir hata oluştu!');
					}
				});
			});
		}

		// Tabloya ekleme fonksiyonu
		function addToTable(item) {
			let row = `
				<tr>
					<td>${item.item_code}</td>
					<td>${item.serial_no}</td>
					<td>
						<button class="btn btn-danger btn-sm delete-row">
							<i class="fa fa-trash"></i>
						</button>
					</td>
				</tr>
			`;
			$('#barcodeTable tbody').append(row);
		}

		// Silme işlemi
		$(document).on('click', '.delete-row', function() {
			let row = $(this).closest('tr');
			let index = row.index();
			row.remove();
			scannedItems.splice(index, 1);
		});

		// Telefon formatı için input event listener
		$('#customer_phone').on('input', function(e) {
			let value = e.target.value.replace(/\D/g, ''); // Sadece rakamları al
			
			// İlk rakam 5 değilse temizle
			if (value.length > 0 && value[0] !== '5') {
				value = '';
			}

			// Maksimum 11 rakam
			value = value.substring(0, 11);

			// Format: 5XX XXX XX XX
			if (value.length > 0) {
				value = value.replace(/(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/, function(match, p1, p2, p3, p4) {
					let formatted = p1;
					if (p2) formatted += ' ' + p2;
					if (p3) formatted += ' ' + p3;
					if (p4) formatted += ' ' + p4;
					return formatted;
				});
			}

			e.target.value = value;
		});

		// Telefon validasyonu
		function validatePhone(phone) {
			// Sadece rakamları al
			let numbers = phone.replace(/\D/g, '');
			// 10 haneli olmalı ve 5 ile başlamalı
			return numbers.length === 10 && numbers.startsWith('5');
		}

		// Kaydet butonu click eventi
		$form.find('.btn-save').on('click', function() {
			let phone = $('#customer_phone').val();
			
			// Telefon validasyonu
			if (!validatePhone(phone)) {
				frappe.msgprint('Lütfen geçerli bir telefon numarası giriniz. Örnek: 532 123 45 67');
				$('#customer_phone').focus();
				return;
			}

			let values = {
				customer_name: $('#customer_name').val(),
				customer_phone: phone,
				customer_address: $('#customer_address').val(),
				installation_date: $('#installation_date').val(),
				notes: $('#notes').val(),
				scanned_items: scannedItems
			};

			// Form validasyonu
			if (!values.customer_name || !values.customer_phone || !values.customer_address || 
				!values.installation_date) {
				frappe.msgprint('Lütfen zorunlu alanları doldurunuz.');
				return;
			}	

			// Installation Note için veri hazırla
			let installation_note_data = {
				doctype: 'Installation Note',
				custom_end_customer: values.customer_name,
				custom_end_customer_phone: values.customer_phone,
				custom_end_customer_address: values.customer_address,
				inst_date: values.installation_date,
				remarks: values.notes,
				customer: frappe.session.user_fullname,
				territory: 'Türkiye',
				items: values.scanned_items.map(item => ({
					item_code: item.item_code,
					serial_no: item.serial_no,
					qty: 1
				}))
			};

			// Installation Note oluştur
			frappe.call({
				method: 'frappe.client.insert',
				args: {
					doc: installation_note_data
				},
				callback: function(r) {
					if (r.message) {
						frappe.show_alert({
							message: 'Montaj talebi başarıyla kaydedildi',
							indicator: 'green'
						});
						// Formu temizle
						$form.find('input, textarea').val('');
						$('#barcodeTable tbody').empty();
						scannedItems = [];
					}
				},
				error: function(err) {
					frappe.msgprint('Kayıt sırasında bir hata oluştu!');
					console.error(err);
				}
			});
		});

		// Konum alma fonksiyonu
		function getCurrentLocation() {
			const locationBtn = $('#locationBtn');
			locationBtn.addClass('loading');
			
			if ("geolocation" in navigator) {
				navigator.geolocation.getCurrentPosition(
					// Başarılı konum alındığında
					async function(position) {
						try {
							const latitude = position.coords.latitude;
							const longitude = position.coords.longitude;
							
							// Koordinatlardan adres bilgisini al
							const address = await get_address_from_coordinates(latitude, longitude);
							$('#customer_address').val(address);
						} catch (error) {
							frappe.msgprint(error);
						} finally {
							locationBtn.removeClass('loading');
						}
					},
					// Hata durumunda
					function(error) {
						let errorMessage = 'Konum alınamadı! ';
						switch(error.code) {
							case error.PERMISSION_DENIED:
								errorMessage += 'Konum izni reddedildi.';
								break;
							case error.POSITION_UNAVAILABLE:
								errorMessage += 'Konum bilgisi kullanılamıyor.';
								break;
							case error.TIMEOUT:
								errorMessage += 'Konum alma isteği zaman aşımına uğradı.';
								break;
							default:
								errorMessage += 'Bilinmeyen bir hata oluştu.';
						}
						frappe.msgprint(errorMessage);
						locationBtn.removeClass('loading');
					},
					// Konum alma seçenekleri
					{
						enableHighAccuracy: true,
						timeout: 5000,
						maximumAge: 0
					}
				);
			} else {
				frappe.msgprint('Tarayıcınız konum özelliğini desteklemiyor!');
				locationBtn.removeClass('loading');
			}
		}

		// Konum butonu için event listener
		$('#locationBtn').on('click', getCurrentLocation);
	});

	// Add custom CSS
	$('<style>')
		.text(`
			.montaj-form {
				max-width: 800px;
				margin: 20px auto;
				padding: 30px;
				background: #fff;
				border-radius: 12px;
				box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			}
			.form-group {
				margin-bottom: 25px;
			}
			.form-group label {
				display: block;
				margin-bottom: 10px;
				font-weight: 600;
				color: #2c3e50;
				font-size: 0.95rem;
			}
			.form-control {
				width: 100%;
				padding: 12px 15px;
				border: 2px solid #e0e0e0;
				border-radius: 8px;
				font-size: 14px;
				transition: all 0.3s ease;
				background-color: #f8f9fa;
			}
			.form-control:focus {
				border-color: #3498db;
				outline: none;
				box-shadow: 0 0 0 3px rgba(52,152,219,0.2);
				background-color: #fff;
			}
			.form-text {
				font-size: 12px;
				color: #7f8c8d;
				margin-top: 6px;
			}
			.btn-save {
				background-color: #2ecc71;
				color: white;
				padding: 14px 28px;
				border: none;
				border-radius: 8px;
				cursor: pointer;
				font-size: 16px;
				font-weight: 600;
				transition: all 0.3s ease;
				margin-top: 30px;
				width: 100%;
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
			.btn-save:hover {
				background-color: #27ae60;
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(46,204,113,0.2);
			}
			.btn-save:active {
				transform: translateY(0);
			}
			.barcode-table-container {
				margin: 30px 0;
				padding: 20px;
				background: #f8f9fa;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0,0,0,0.05);
			}
			.barcode-table-container h4 {
				margin-bottom: 20px;
				color: #2c3e50;
				font-weight: 600;
			}
			.table {
				width: 100%;
				margin-bottom: 1rem;
				background-color: transparent;
				border-collapse: separate;
				border-spacing: 0;
			}
			.table th,
			.table td {
				padding: 14px;
				vertical-align: middle;
				border: 1px solid #e0e0e0;
			}
			.table thead th {
				background-color: #f1f2f6;
				border-bottom: 2px solid #e0e0e0;
				font-weight: 600;
				color: #2c3e50;
			}
			.table tbody tr:hover {
				background-color: #f8f9fa;
			}
			.btn-danger {
				background-color: #e74c3c;
				color: white;
				padding: 6px 12px;
				border: none;
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.3s ease;
			}
			.btn-danger:hover {
				background-color: #c0392b;
				transform: translateY(-1px);
			}
			.barcode-input-group,
			.address-input-group {
				display: flex;
				gap: 12px;
			}
			.camera-btn,
			.location-btn {
				background-color: #3498db;
				color: white;
				border: none;
				border-radius: 8px;
				padding: 12px 20px;
				cursor: pointer;
				transition: all 0.3s ease;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				font-weight: 500;
				min-width: 120px;
			}
			.camera-btn:hover,
			.location-btn:hover {
				background-color: #2980b9;
				transform: translateY(-1px);
			}
			.camera-btn i,
			.location-btn i {
				font-size: 18px;
			}
			.camera-btn.loading,
			.location-btn.loading {
				opacity: 0.7;
				cursor: wait;
			}
			.camera-btn.loading i,
			.location-btn.loading i {
				animation: spin 1s linear infinite;
			}
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}

			/* Quagga tarayıcı stilleri */
			#interactive.viewport {
				position: relative;
				width: 100%;
				height: 300px;
			}
			#interactive.viewport > canvas, #interactive.viewport > video {
				max-width: 100%;
				width: 100%;
			}
			canvas.drawing, canvas.drawingBuffer {
				position: absolute;
				left: 0;
				top: 0;
			}

			/* Responsive tasarım için medya sorguları */
			@media screen and (max-width: 768px) {
				.montaj-form {
					margin: 10px;
					padding: 20px;
				}
				.form-group {
					margin-bottom: 20px;
				}
				.form-control {
					font-size: 16px;
					padding: 14px;
				}
				.btn-save {
					padding: 16px 24px;
				}
				.barcode-input-group,
				.address-input-group {
					flex-direction: column;
				}
				.camera-btn,
				.location-btn {
					width: 100%;
					margin-top: 8px;
				}
				.table th,
				.table td {
					padding: 10px;
					font-size: 14px;
				}
			}

			/* Tablet için orta boyut ekran */
			@media screen and (min-width: 769px) and (max-width: 1024px) {
				.montaj-form {
					max-width: 90%;
				}
			}
		`)
		.appendTo('head');
}