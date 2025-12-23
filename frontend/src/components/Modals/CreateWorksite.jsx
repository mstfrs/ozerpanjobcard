import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';

// Props:
// visible, onHide, formData, onChange, onSubmit, isSubmitting, isSalesLoading,
// onPickLocation, onFileChange,
// selectedCustomer, customerSuggestions, onCustomerChange, onCustomerComplete, onCustomerLazyLoad
const CreateWorksite = ({
	visible,
	onHide,
	formData,
	onChange,
	onSubmit,
	isSubmitting,
	isSalesLoading,
	onPickLocation,
	onFileChange,
	selectedCustomer,
	customerSuggestions,
	onCustomerChange,
	onCustomerComplete,
	onCustomerLazyLoad,
}) => {
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [stream, setStream] = useState(null);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({ 
				video: { 
					width: { ideal: 1280 },
					height: { ideal: 720 },
					facingMode: 'environment' // Arka kamerayı tercih et
				} 
			});
			setStream(mediaStream);
			setIsCameraOpen(true);
			
			// Video elementinin yüklenmesini bekle
			setTimeout(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = mediaStream;
					videoRef.current.play().catch(err => {
						console.error('Video oynatma hatası:', err);
					});
				}
			}, 100);
		} catch (err) {
			console.error('Kamera erişim hatası:', err);
			if (err.name === 'NotAllowedError') {
				alert('Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.');
			} else if (err.name === 'NotFoundError') {
				alert('Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.');
			} else {
				alert('Kamera erişim hatası: ' + err.message);
			}
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			setStream(null);
		}
		setIsCameraOpen(false);
	};

	const captureImage = () => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');

			// Video boyutlarını canvas'a uygula
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 480;

			// Video frame'ini canvas'a çiz
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Canvas'tan blob oluştur
			canvas.toBlob(async (blob) => {
				if (blob) {
					// Blob'u File objesine çevir
					const file = new File([blob], `worksite_${Date.now()}.jpg`, { type: 'image/jpeg' });
					// onFileChange'i çağır
					onFileChange({ target: { files: [file] } });
					stopCamera();
				}
			}, 'image/jpeg', 0.8);
		}
	};

	const handleVideoLoad = () => {
		console.log('Video yüklendi, boyutlar:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
	};

	const handleVideoError = (e) => {
		console.error('Video hatası:', e);
		alert('Video yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
	};

	return (
		<>
			<Dialog 
				header="Yeni Şantiye" 
				visible={visible} 
				style={{ width: '42rem' }} 
				onHide={onHide}
				dismissableMask={true}
				closable={true}
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<label className="block text-sm mb-1">Şantiye Adı</label>
						<input name="worksite_name" value={formData.worksite_name} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
					<div>
						<label className="block text-sm mb-1">Yetkili Kişi</label>
						<input name="contact_person" value={formData.contact_person} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
					<div>
						<label className="block text-sm mb-1">Telefon</label>
						<input name="contact_phone" value={formData.contact_phone} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
					<div>
						<label className="block text-sm mb-1">E-posta</label>
						<input type="email" name="contact_email" value={formData.contact_email} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
					<div>
						<label className="block text-sm mb-1">Durum</label>
						<input
							value="Yeni"
							readOnly
							className="w-full border rounded p-2 text-sm bg-gray-100"
						/>
					</div>
					
					<div>
						<label className="block text-sm mb-1">Beklenen Değer</label>
						<input type="number" step="0.01" name="expected_value" value={formData.expected_value} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
					<div>
						<label className="block text-sm mb-1">Bayi (zorunlu)</label>
						<AutoComplete
							value={selectedCustomer}
							suggestions={customerSuggestions}
							completeMethod={onCustomerComplete}
							onChange={(e) => onCustomerChange(e.value)}
							dropdown
							field="customer_name"
							virtualScrollerOptions={{ lazy: true, onLazyLoad: onCustomerLazyLoad, itemSize: 32 }}
							placeholder="Müşteri ara veya seç"
							className="w-full text-xs h-8"
							inputClassName="text-xs"
							panelClassName="text-xs"
							itemTemplate={(item) => (
								<div className="flex flex-col leading-tight">
									<span className="text-xs font-medium">{item.customer_name || item.name}</span>
								</div>
							)}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Ziyaret Tarihi</label>
						<input type="date" name="next_action_date" value={formData.next_action_date} onChange={onChange} className="w-full border rounded p-2 text-sm" />
					</div>
				
					<div>
						<label className="block text-sm mb-1">Satış Sorumlusu</label>
						<input name="custom_sales_person" value={formData.custom_sales_person} readOnly placeholder={isSalesLoading ? 'Yükleniyor...' : ''} className="w-full border rounded p-2 text-sm bg-gray-100" />
					</div>
					<div>
						<label className="block text-sm mb-1">Konum</label>
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<input placeholder="Lat" name="latitude" value={formData.latitude} onChange={onChange} className="w-full border rounded p-2 text-sm" />
								<input placeholder="Lng" name="longitude" value={formData.longitude} onChange={onChange} className="w-full border rounded p-2 text-sm" />
							</div>
							<Button type="button" label="Konum Al" icon="pi pi-map-marker" onClick={onPickLocation} className="bg-gray-400 text-gray-800 py-2 px-2" />
						</div>
					</div>
					<div>
						<label className="block text-sm mb-1">Şantiye Görseli</label>
						<div className="flex justify-between items-center gap-2">
							<Button type="button" label="" icon="pi pi-camera" onClick={startCamera} className="bg-blue-500 text-white py-2 px-2" />
							<input type="file" accept="image/*" onChange={onFileChange} className="w-full text-sm" />
						</div>
						{formData.attach_image_aeci && (
							<div className="mt-2">
								<img src={formData.attach_image_aeci} alt="preview" className="h-24 rounded border" />
							</div>
						)}
					</div>
				</div>
				<div className="flex justify-between gap-2 mt-4 w-full">
					<Button label="İptal" className="bg-red-500 text-white flex-1 py-2" onClick={onHide} />
					<Button label={isSubmitting ? 'Kaydediliyor...' : 'Kaydet'} disabled={isSubmitting || isSalesLoading} className="bg-green-500 text-white flex-1 py-2" onClick={onSubmit} />
				</div>
			</Dialog>

			{/* Kamera Modal */}
			<Dialog 
				header="Kamera ile Görsel Çek" 
				visible={isCameraOpen} 
				style={{ width: '40rem' }} 
				onHide={stopCamera}
				dismissableMask={true}
				closable={true}
			>
				<div className="flex flex-col items-center gap-4">
					<div className="relative w-full max-w-md h-64 bg-black rounded overflow-hidden">
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-full object-cover"
							onLoadedMetadata={handleVideoLoad}
							onError={handleVideoError}
						/>
						{!stream && (
							<div className="absolute inset-0 flex items-center justify-center text-white">
								Kamera yükleniyor...
							</div>
						)}
					</div>
					<canvas ref={canvasRef} style={{ display: 'none' }} />
					<div className="flex gap-2">
						<Button 
							label="Fotoğraf Çek" 
							icon="pi pi-camera" 
							onClick={captureImage} 
							className="bg-green-500 text-white"
							disabled={!stream}
						/>
						<Button label="Kapat" icon="pi pi-times" onClick={stopCamera} className="bg-gray-500 text-white" />
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default CreateWorksite;