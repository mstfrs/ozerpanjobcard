import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
import { searchCustomers } from '../../services/CustomerServices';

const QuotedWorksites = ({ worksites, onUpdateWorksite, title = 'Teklif Verilen Şantiyeler', emptyMessage = 'Teklif verilen şantiye bulunamadı' }) => {
	const [selectedWorksite, setSelectedWorksite] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [editStatus, setEditStatus] = useState('');
	const [editDealer, setEditDealer] = useState('');
	const [editExpectedValue, setEditExpectedValue] = useState('');
	const [editNextActionDate, setEditNextActionDate] = useState('');
	const [editOffer, setEditOffer] = useState('');
	const [customerSuggestions, setCustomerSuggestions] = useState([]);
	const [customerLoading, setCustomerLoading] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [originalData, setOriginalData] = useState(null);

	// Burada da sadece backend'ten "İş Kazanıldı" olarak gelen kayıtlar kilitli;
	// kullanıcı bu ekranda statüyü "İş Kazanıldı" yapıp Kaydet diyebilir.
	const isWon = selectedWorksite?.status === 'İş Kazanıldı';
	const normalizeNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
	const isDirty = !!originalData && (
		editStatus !== originalData.status ||
		(editDealer || '') !== (originalData.assigned_dealer || '') ||
		normalizeNumber(editExpectedValue) !== normalizeNumber(originalData.expected_value) ||
		normalizeNumber(editOffer) !== normalizeNumber(originalData.custom_offer) ||
		(editNextActionDate || '') !== (originalData.next_action_date || '')
	);

	const handleWorksiteClick = (worksite) => {
		setSelectedWorksite(worksite);
		setEditStatus(worksite.status || 'Teklif Verildi');
		setEditDealer(worksite.assigned_dealer || '');
		setEditExpectedValue(
			typeof worksite.expected_value === 'number'
				? String(worksite.expected_value)
				: worksite.expected_value || ''
		);
		setEditOffer(
			typeof worksite.custom_offer === 'number'
				? String(worksite.custom_offer)
				: worksite.custom_offer || ''
		);
		setEditNextActionDate(
			worksite.next_action_date
				? worksite.next_action_date.substring(0, 10)
				: ''
		);
		setOriginalData({
			status: worksite.status || 'Teklif Verildi',
			assigned_dealer: worksite.assigned_dealer || '',
			expected_value: worksite.expected_value ?? null,
			custom_offer: worksite.custom_offer ?? null,
			next_action_date: worksite.next_action_date
				? worksite.next_action_date.substring(0, 10)
				: ''
		});
		if (worksite.assigned_dealer) {
			// Liste Customer link'ini (name) tutuyor; dropdown'da göstermek için sahte bir Customer objesi set ediyoruz
			setSelectedCustomer({
				name: worksite.assigned_dealer,
				customer_name: worksite.assigned_dealer,
			});
		} else {
			setSelectedCustomer(null);
		}
		setIsDetailOpen(true);
	};

	const closeDetail = () => {
		setIsDetailOpen(false);
		setSelectedWorksite(null);
		setEditStatus('');
		setEditDealer('');
		setEditExpectedValue('');
		setEditNextActionDate('');
		setEditOffer('');
		setSelectedCustomer(null);
		setOriginalData(null);
	};

	const handleSave = async () => {
		if (!selectedWorksite || !onUpdateWorksite) return;
		if (!selectedCustomer) {
			alert('Lütfen bayi seçiniz.');
			return;
		}
		const payload = {
			status: editStatus,
			// Backend tarafında Worksites.assigned_dealer Customer link'i olmalı, o yüzden name gönderiyoruz
			assigned_dealer: selectedCustomer.name || null,
			expected_value: editExpectedValue === '' ? null : Number(editExpectedValue),
			custom_offer: editOffer === '' ? null : Number(editOffer),
			next_action_date: editNextActionDate || null,
		};
		await onUpdateWorksite(selectedWorksite.name, payload);
		closeDetail();
	};

	const handleCustomerComplete = async (e) => {
		try {
			setCustomerLoading(true);
			const res = await searchCustomers({
				searchText: e.query || '',
				page: 0,
				pageSize: 20,
			});
			setCustomerSuggestions(res.items || []);
		} finally {
			setCustomerLoading(false);
		}
	};

	// Mobil için card template
	const mobileCardTemplate = (worksite) => (
		<div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-semibold text-gray-800 text-sm">{worksite.worksite_name}</h3>
				<span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
					{worksite.status}
				</span>
			</div>
			
			<div className="space-y-1 text-xs text-gray-600">
				{worksite.assigned_dealer && (
					<div className="flex items-center gap-1">
						<i className="pi pi-building text-gray-400"></i>
						<span>{worksite.assigned_dealer}</span>
					</div>
				)}
				{worksite.contact_person && (
					<div className="flex items-center gap-1">
						<i className="pi pi-user text-gray-400"></i>
						<span>{worksite.contact_person}</span>
					</div>
				)}
				{worksite.contact_phone && (
					<div className="flex items-center gap-1">
						<i className="pi pi-phone text-gray-400"></i>
						<span>{worksite.contact_phone}</span>
					</div>
				)}
				{worksite.expected_value && (
					<div className="flex items-center gap-1">
						<i className="pi pi-money-bill text-gray-400"></i>
						<span>{worksite.expected_value} ₺</span>
					</div>
				)}
				{worksite.next_action_date && (
					<div className="flex items-center gap-1">
						<i className="pi pi-calendar text-gray-400"></i>
						<span>{new Date(worksite.next_action_date).toLocaleDateString('tr-TR')}</span>
					</div>
				)}
			</div>

			{worksite.latitude && worksite.longitude && (
				<div className="mt-2">
					<a 
						href={`https://maps.google.com/?q=${worksite.latitude},${worksite.longitude}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
					>
						<i className="pi pi-map-marker"></i>
						Konumu Görüntüle
					</a>
				</div>
			)}

			<div className="mt-3 flex justify-end">
				<Button 
					label="Detay" 
					icon="pi pi-eye" 
					size="small"
					className="bg-orange-500 text-white text-xs"
					onClick={() => handleWorksiteClick(worksite)}
				/>
			</div>
		</div>
	);

	// PC için table template
	const pcTableTemplate = () => (
		<DataTable 
			value={worksites} 
			stripedRows 
			showGridlines
			className="text-sm"
			emptyMessage={emptyMessage}
		>
			<Column field="worksite_name" header="Şantiye Adı" sortable />
			<Column field="assigned_dealer" header="Bayi" sortable />
			<Column field="contact_person" header="Yetkili Kişi" sortable />
			<Column field="contact_phone" header="Telefon" sortable />
			<Column field="expected_value" header="Beklenen Değer" sortable 
				body={(rowData) => rowData.expected_value ? `${rowData.expected_value} ₺` : '-'} />
			<Column field="custom_offer" header="Teklif Tutarı" sortable
				body={(rowData) => rowData.custom_offer ? `${rowData.custom_offer} ₺` : '-'} />
			<Column field="next_action_date" header="Sonraki Aksiyon" sortable
				body={(rowData) => rowData.next_action_date ? new Date(rowData.next_action_date).toLocaleDateString('tr-TR') : '-'} />
			<Column field="status" header="Durum" sortable
				body={(rowData) => (
					<span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
						{rowData.status}
					</span>
				)} />
			<Column header="İşlemler" body={(rowData) => (
				<div className="flex gap-1">
					<Button 
						icon="pi pi-eye" 
						size="small"
						className="bg-orange-500 text-white text-xs"
						onClick={() => handleWorksiteClick(rowData)}
						tooltip="Detay Görüntüle"
					/>
				</div>
			)} />
		</DataTable>
	);

	return (
		<>
			{/* Mobil Card View */}
			<div className="md:hidden">
				{worksites.length > 0 ? (
					<div className="space-y-3">
						{worksites.map((worksite) => mobileCardTemplate(worksite))}
					</div>
				) : (
					<div className="text-center py-8 text-gray-500">
						<i className="pi pi-inbox text-4xl mb-2"></i>
						<p>Teklif verilen şantiye bulunamadı</p>
					</div>
				)}
			</div>

			{/* PC Table View */}
			<div className="hidden md:block">
				{pcTableTemplate()}
			</div>

			{/* Detay Modal */}
			<Dialog 
				header="Şantiye Detayı" 
				visible={isDetailOpen} 
				style={{ width: '42rem' }} 
				onHide={closeDetail}
				dismissableMask={true}
				closable={true}
			>
				{selectedWorksite && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Şantiye Adı</label>
								<p className="text-sm text-gray-900">{selectedWorksite.worksite_name}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
								<select
									value={editStatus}
									onChange={(e) => setEditStatus(e.target.value)}
									className="mt-1 block w-full border border-gray-300 rounded-md text-sm px-2 py-1"
									disabled={isWon}
								>
									<option value="Teklif Verildi">Teklif Verildi</option>
									<option value="Ziyaret Planlandı">Ziyaret Planlandı</option>
									<option value="Ziyaret Edildi">Ziyaret Edildi</option>
									<option value="İş Kaybedildi">İş Kaybedildi</option>
									<option value="İş Kazanıldı">İş Kazanıldı</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Bayi</label>
								<AutoComplete
									value={selectedCustomer || editDealer}
									suggestions={customerSuggestions}
									completeMethod={handleCustomerComplete}
									loading={customerLoading}
									field="customer_name"
									onChange={(e) => {
										setEditDealer(e.value || '');
										setSelectedCustomer(null);
									}}
									onSelect={(e) => {
										setSelectedCustomer(e.value);
										setEditDealer(e.value?.customer_name || e.value?.name || '');
									}}
									placeholder="Bayi seçin veya yazın"
									className="mt-1 w-full"
									inputClassName="w-full border border-gray-300 rounded-md text-sm px-2 py-1"
									disabled={isWon}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Değer</label>
								<input
									type="number"
									value={editExpectedValue}
									onChange={(e) => setEditExpectedValue(e.target.value)}
									className="mt-1 block w-full border border-gray-300 rounded-md text-sm px-2 py-1"
									placeholder="Beklenen değer"
									disabled={isWon}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Teklif Tutarı</label>
								<input
									type="number"
									value={editOffer}
									onChange={(e) => setEditOffer(e.target.value)}
									className="mt-1 block w-full border border-gray-300 rounded-md text-sm px-2 py-1"
									placeholder="Verilen teklif"
									disabled={isWon}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
								<p className="text-sm text-gray-900">{selectedWorksite.contact_person || '-'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
								<p className="text-sm text-gray-900">{selectedWorksite.contact_phone || '-'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
								<p className="text-sm text-gray-900">{selectedWorksite.contact_email || '-'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Aksiyon</label>
								<input
									type="date"
									value={editNextActionDate}
									onChange={(e) => setEditNextActionDate(e.target.value)}
									className="mt-1 block w-full border border-gray-300 rounded-md text-sm px-2 py-1"
									disabled={isWon}
								/>
							</div>
						</div>

						{selectedWorksite.latitude && selectedWorksite.longitude && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
								<a 
									href={`https://maps.google.com/?q=${selectedWorksite.latitude},${selectedWorksite.longitude}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
								>
									<i className="pi pi-map-marker"></i>
									Haritada Görüntüle
								</a>
							</div>
						)}

						{selectedWorksite.attach_image_aeci && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Şantiye Görseli</label>
								<img 
									src={selectedWorksite.attach_image_aeci} 
									alt="Şantiye" 
									className="max-w-full h-auto rounded border"
								/>
							</div>
						)}

						<div className="flex justify-between items-center pt-4 border-t mt-4">
							<div />
							<div className="flex gap-2 ml-auto">
								<Button
									label="Kapat"
									className="p-button-text text-sm px-3 py-2 text-gray-600 hover:text-gray-800"
									onClick={closeDetail}
								/>
								{!isWon && (
									<Button
										label="Kaydet"
										icon="pi pi-save"
										className="bg-orange-500 text-white text-sm px-3 py-2 rounded-md shadow-sm flex items-center gap-2 hover:bg-orange-600"
										onClick={handleSave}
										disabled={!onUpdateWorksite || !isDirty || !selectedCustomer}
									/>
								)}
							</div>
						</div>
					</div>
				)}
			</Dialog>
		</>
	);
};

export default QuotedWorksites; 