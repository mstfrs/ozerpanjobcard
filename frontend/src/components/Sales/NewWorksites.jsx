import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';

const NewWorksites = ({ worksites }) => {
	const [selectedWorksite, setSelectedWorksite] = useState(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const handleWorksiteClick = (worksite) => {
		setSelectedWorksite(worksite);
		setIsDetailOpen(true);
		// onWorksiteClick callback'ini kaldırıyoruz çünkü duplicate modal açılıyor
	};

	const closeDetail = () => {
		setIsDetailOpen(false);
		setSelectedWorksite(null);
	};

	// Mobil için card template
	const mobileCardTemplate = (worksite) => (
		<div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-semibold text-gray-800 text-sm">{worksite.worksite_name}</h3>
				<span className={`px-2 py-1 rounded-full text-xs ${
					worksite.status === 'Yeni' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
				}`}>
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
			
			
			</div>

			{worksite.latitude && worksite.longitude && (
				<div className="mt-2 flex justify-between">
					<a 
						href={`https://maps.google.com/?q=${worksite.latitude},${worksite.longitude}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
					>
						<i className="pi pi-map-marker"></i>
						Konumu Görüntüle
					</a>
                    <Button 
					label="Detay" 
					icon="pi pi-eye" 
					size="small"
					className="bg-blue-500 text-white text-xs px-2 py-1"
					onClick={() => handleWorksiteClick(worksite)}
				/>
				</div>
			)}

			<div className="mt-3 flex justify-end">
				
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
			emptyMessage="Yeni şantiye bulunamadı"
		>
			<Column field="worksite_name" header="Şantiye Adı" sortable />
			<Column field="assigned_dealer" header="Bayi" sortable />
			<Column field="contact_person" header="Yetkili Kişi" sortable />
			<Column field="contact_phone" header="Telefon" sortable />
			<Column field="expected_value" header="Beklenen Değer" sortable 
				body={(rowData) => rowData.expected_value ? `${rowData.expected_value} ₺` : '-'} />
			<Column field="next_action_date" header="Ziyaret Tarihi" sortable
				body={(rowData) => rowData.next_action_date ? new Date(rowData.next_action_date).toLocaleDateString('tr-TR') : '-'} />
			<Column field="status" header="Durum" sortable
				body={(rowData) => (
					<span className={`px-2 py-1 rounded-full text-xs ${
						rowData.status === 'Yeni' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
					}`}>
						{rowData.status}
					</span>
				)} />
			<Column header="İşlemler" body={(rowData) => (
				<div className="flex gap-1">
					<Button 
						icon="pi pi-eye" 
						size="small"
						className="bg-blue-500 text-white text-xs"
						onClick={() => handleWorksiteClick(rowData)}
						
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
						<p>Yeni şantiye bulunamadı</p>
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
				{selectedWorksite ? (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Şantiye Adı</label>
								<p className="text-sm text-gray-900">{selectedWorksite.worksite_name}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
								<span className={`px-2 py-1 rounded-full text-xs ${
									selectedWorksite.status === 'Yeni' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
								}`}>
									{selectedWorksite.status}
								</span>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Bayi</label>
								<p className="text-sm text-gray-900">{selectedWorksite.assigned_dealer || '-'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Beklenen Değer</label>
								<p className="text-sm text-gray-900">{selectedWorksite.expected_value ? `${selectedWorksite.expected_value} ₺` : '-'}</p>
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
								<label className="block text-sm font-medium text-gray-700 mb-1">Ziyaret Tarihi</label>
								<p className="text-sm text-gray-900">
									{selectedWorksite.next_action_date ? new Date(selectedWorksite.next_action_date).toLocaleDateString('tr-TR') : '-'}
								</p>
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
					</div>
				):"Yükleniyor..."}
			</Dialog>
		</>
	);
};

export default NewWorksites; 