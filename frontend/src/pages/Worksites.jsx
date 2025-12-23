import React, { useEffect, useState, useRef } from 'react';
import Loading from '../components/Loading';
import { listWorksites, createWorksite, uploadFile, getWorksiteDetail, updateWorksite } from '../services/WorksitesService';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { fetchCurrentUser } from '../services/AuthServices';
import { getLoggedUserEmployeeDetails } from '../services/EmployeeServices';
import { searchCustomers } from '../services/CustomerServices';
import { AutoComplete } from 'primereact/autocomplete';
import CreateWorksite from '../components/Modals/CreateWorksite';
import NewWorksites from '../components/Sales/NewWorksites';
import QuotedWorksites from '../components/Sales/QuotedWorksites';

const Worksites = () => {
	const [worksites, setWorksites] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		worksite_name: '',
		contact_person: '',
		contact_phone: '',
		contact_email: '',
		status: 'Yeni',
		assigned_dealer: '',
		expected_value: '',
		next_action_date: '',
		latitude: '',
		longitude: '',
		attach_image_aeci: '',
		custom_sales_person: ''
	});

	const [salesPersonName, setSalesPersonName] = useState('');
	const [isSalesLoading, setIsSalesLoading] = useState(true);
	const [showNewSection, setShowNewSection] = useState(false);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detail, setDetail] = useState(null);

	// User profile states
	const [userProfile, setUserProfile] = useState({
		name: '',
		image: '',
		email: ''
	});

	// Customer dropdown states
	const [customerSuggestions, setCustomerSuggestions] = useState([]);
	const [customerPage, setCustomerPage] = useState(0);
	const [customerHasMore, setCustomerHasMore] = useState(true);
	const [customerLoading, setCustomerLoading] = useState(false);
	const [customerQuery, setCustomerQuery] = useState('');
	const [selectedCustomer, setSelectedCustomer] = useState(null);

	// Sales components state
	const [showSalesComponents, setShowSalesComponents] = useState(false);
	const [activeSalesComponent, setActiveSalesComponent] = useState(null);

	const listRef = useRef(null);

	const titles = [
		{
			title: "Yeni Şantiyeler",
			icon: "pi pi-star",
			component: "new"
		},
		{
			title: "Teklif Verilenler",
			icon: "pi pi-tags",
			component: "quoted"
		},
		{
			title: "Kazanılan İşler",
			icon: "pi pi-check-circle",
			component: "won"
		}
	];

	const loadList = async () => {
		try {
			setIsLoading(true);
			const items = await listWorksites();
			setWorksites(Array.isArray(items) ? items : []);
		} catch (err) {
			setError('Veri yüklenirken hata oluştu.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadList();
	}, []);

	// Fill custom_sales_person from logged user employee name
	useEffect(() => {
		const fillSalesPerson = async () => {
			try {
				setIsSalesLoading(true);
				const currentUsr = await fetchCurrentUser();
				const emp = await getLoggedUserEmployeeDetails(currentUsr?.message);
				const fullName = emp ? `${emp?.employee_name}` : '';
				setSalesPersonName(fullName);
				
				// User profile bilgilerini employee'dan al
				if (emp) {
					setUserProfile({
						name: emp.employee_name || '',
						image: emp.image || '',
						email: currentUsr?.message || ''
					});
				}
			} catch (e) {
				console.error('Sales person fill error:', e);
			} finally {
				setIsSalesLoading(false);
			}
		};
		fillSalesPerson();
	}, []);

	// Load user profile information - REMOVED, using employee data instead

	const openCreate = async () => {
		try {
			if (!salesPersonName) {
				setIsSalesLoading(true);
				const currentUsr = await fetchCurrentUser();
				const emp = await getLoggedUserEmployeeDetails(currentUsr?.message);
				const fullName = emp ? `${emp?.employee_name}` : '';
				setSalesPersonName(fullName);
				setFormData((prev) => ({ ...prev, custom_sales_person: fullName }));
				setIsCreateOpen(true);
			} else {
				setFormData((prev) => ({ ...prev, custom_sales_person: salesPersonName }));
				setIsCreateOpen(true);
			}
		} finally {
			setIsSalesLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handlePickLocation = () => {
		if (!navigator.geolocation) {
			alert('Tarayıcı konum erişimini desteklemiyor');
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setFormData((prev) => ({
					...prev,
					latitude: pos.coords.latitude.toFixed(6),
					longitude: pos.coords.longitude.toFixed(6),
				}));
			},
			(err) => {
				console.error(err);
				alert('Konum alınamadı');
			}
		);
	};

	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const url = await uploadFile(file);
		if (url) {
			setFormData((prev) => ({ ...prev, attach_image_aeci: url }));
		}
	};

	const handleCreate = async () => {
		if (!formData.assigned_dealer) {
			alert('Lütfen bayi seçiniz.');
			return;
		}
		try {
			setIsSubmitting(true);
			await createWorksite({
				...formData,
				status: 'Yeni',
				expected_value: formData.expected_value === '' ? null : Number(formData.expected_value),
				latitude: formData.latitude === '' ? null : Number(formData.latitude),
				longitude: formData.longitude === '' ? null : Number(formData.longitude),
			});
			setIsCreateOpen(false);
			setFormData({
				worksite_name: '',
				contact_person: '',
				contact_phone: '',
				contact_email: '',
				status: 'Yeni',
				assigned_dealer: '',
				expected_value: '',
				next_action_date: '',
				latitude: '',
				longitude: '',
				attach_image_aeci: '',
				custom_sales_person: salesPersonName
			});
			setSelectedCustomer(null);
			await loadList();
		} catch (err) {
			console.error('Create worksite error:', err);
			alert('Kayıt oluşturulurken hata oluştu.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenDetail = async (name) => {
		try {
			setDetailLoading(true);
			setIsDetailOpen(true);
			const data = await getWorksiteDetail(name);
			setDetail(data);
		} catch (err) {
			console.error('Detail fetch error:', err);
		} finally {
			setDetailLoading(false);
		}
	};

	// Customer dropdown handlers
	const PAGE_SIZE = 20;
	const handleCustomerComplete = async (e) => {
		try {
			setCustomerLoading(true);
			setCustomerQuery(e.query || '');
			setCustomerPage(0);
			const res = await searchCustomers({ searchText: e.query || '', page: 0, pageSize: PAGE_SIZE });
			setCustomerSuggestions(res.items);
			setCustomerHasMore(res.hasMore);
		} finally {
			setCustomerLoading(false);
		}
	};

	const handleCustomerLazyLoad = async () => {
		if (!customerHasMore || customerLoading) return;
		try {
			setCustomerLoading(true);
			const nextPage = customerPage + 1;
			const res = await searchCustomers({ searchText: customerQuery, page: nextPage, pageSize: PAGE_SIZE });
			setCustomerSuggestions((prev) => [...prev, ...res.items]);
			setCustomerHasMore(res.hasMore);
			setCustomerPage(nextPage);
		} finally {
			setCustomerLoading(false);
		}
	};

	// Sales components handlers
	const handleSalesButtonClick = (componentType) => {
		setShowSalesComponents(true);
		setActiveSalesComponent(componentType);
		setShowNewSection(false);
	};

	const hideSalesComponents = () => {
		setShowSalesComponents(false);
		setActiveSalesComponent(null);
	};

	const newOnly = worksites.filter((w) => w.status === 'Yeni');
	const quotedOnly = worksites.filter((w) => w.status === 'Teklif Verildi');
	const wonOnly = worksites.filter((w) => w.status === 'İş Kazanıldı');

	const handleUpdateWorksite = async (name, updates) => {
		try {
			await updateWorksite(name, updates);
			await loadList();
		} catch (err) {
			console.error('Update worksite error:', err);
			alert('Şantiye güncellenirken hata oluştu.');
		}
	};

	return (
		<div className="w-full">
			<div className="p-4">
				{/* Sales Components açıkken üstte sadece Ana Sayfaya Dön butonu */}
				{showSalesComponents && (
					<div className="flex justify-center mb-6 w-full">
						<Button 
							label="Ana Sayfaya Dön" 
							icon="pi pi-home" 
							onClick={hideSalesComponents}
							className='w-full h-10 bg-green-500 py-2 px-4 rounded-md text-white text-lg'
						/>
					</div>
				)}

				{/* Sales Components */}
				{showSalesComponents && (
					<div className="mb-6">
						{activeSalesComponent === 'new' && (
							<NewWorksites 
								worksites={newOnly}
								onUpdateWorksite={handleUpdateWorksite}
							/>
						)}
						
						{activeSalesComponent === 'quoted' && (
							<QuotedWorksites 
								worksites={quotedOnly}
								onUpdateWorksite={handleUpdateWorksite}
							/>
						)}

						{activeSalesComponent === 'won' && (
							<QuotedWorksites 
								worksites={wonOnly}
								onUpdateWorksite={handleUpdateWorksite}
								title="Kazanılan İşler"
								emptyMessage="Kazanılan iş bulunamadı"
							/>
						)}
					</div>
				)}

				{/* Ana sayfa - Sales Components kapalıyken */}
				{!showSalesComponents && (
                
					<>
						{/* User Profile Section */}
						<div className="flex items-center justify-between mb-8 p-4 bg-white rounded-lg shadow-sm border">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
									{userProfile.image ? (
										<img 
											src={userProfile.image} 
											alt="Profile" 
											className="w-full h-full object-cover"
										/>
									) : (
										<i className="pi pi-user text-2xl text-gray-500"></i>
									)}
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-800">
										{userProfile.name ? userProfile.name.charAt(0).toUpperCase() + userProfile.name.slice(1) : 'Kullanıcı'}
									</h2>
									<p className="text-gray-600 text-sm">{userProfile.email}</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm text-gray-500">Hoş geldiniz!</p>
								<p className="text-xs text-gray-400">{new Date().toLocaleDateString('tr-TR', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}</p>
							</div>
						</div>

						<div className='flex flex-col gap-2 items-center justify-between mb-8 p-4 bg-white rounded-lg shadow-sm border'>
							<Button label="Şantiye Ekle" icon="pi pi-plus" onClick={openCreate} size="large" className='w-full md:w-64 h-20 mx-20 bg-red-500 py-2 px-4 rounded-md text-white text-xl' />

							{titles.map((title, index) => (
								<Button 
									key={index}
									label={title.title} 
									icon={title.icon} 
									size="large" 
									onClick={() => handleSalesButtonClick(title.component)}
									className='w-full md:w-64 h-20 mx-20 bg-red-500 py-2 px-4 rounded-md text-white text-xl'
								/>
							))}
						</div>

						{/* Alt tarafta Yeni Şantiyeler butonu ve liste */}
						{showNewSection && (
							<div className="overflow-x-auto mt-3">
								<h2 className="text-lg font-medium mb-2">Yeni Şantiyeler</h2>
								<table className="min-w-full border border-gray-200 text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-3 py-2 text-left border-b">Ad</th>
											<th className="px-3 py-2 text-left border-b">Bayi</th>
											<th className="px-3 py-2 text-left border-b">Tarih</th>
										</tr>
									</thead>
									<tbody>
										{newOnly.map((w) => (
											<tr key={w.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenDetail(w.name)}>
												<td className="px-3 py-2 border-b">{w.worksite_name || w.name}</td>
												<td className="px-3 py-2 border-b">{w.assigned_dealer || '-'}</td>
												<td className="px-3 py-2 border-b">{w.next_action_date || '-'}</td>
											</tr>
										))}
										{newOnly.length === 0 && (
											<tr>
												<td className="px-3 py-6 text-center" colSpan={3}>Yeni statülü kayıt bulunamadı.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				{/* Detay Modal */}
				<Dialog 
					header="Şantiye Detayı" 
					visible={isDetailOpen} 
					style={{ width: '42rem' }} 
					onHide={() => setIsDetailOpen(false)}
					dismissableMask={true}
					closable={true}
				>
					{detailLoading ? (
						<Loading />
					) : detail ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div>
								<label className="block text-sm mb-1">Şantiye Adı</label>
								<div className="text-sm">{detail.worksite_name || detail.name}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Durum</label>
								<div className="text-sm">{detail.status}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Bayi</label>
								<div className="text-sm">{detail.assigned_dealer || '-'}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Sonraki Aksiyon</label>
								<div className="text-sm">{detail.next_action_date || '-'}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Beklenen Değer</label>
								<div className="text-sm">{detail.expected_value ?? '-'}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">İletişim</label>
								<div className="text-sm">{detail.contact_person || '-'} / {detail.contact_phone || '-'} / {detail.contact_email || '-'}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Satış Sorumlusu</label>
								<div className="text-sm">{detail.custom_sales_person || '-'}</div>
							</div>
							<div>
								<label className="block text-sm mb-1">Konum</label>
								{detail.latitude && detail.longitude ? (
									<a className="text-blue-600 underline" href={`https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`} target="_blank" rel="noreferrer">Haritada Aç</a>
								) : (
									<div className="text-sm">-</div>
								)}
							</div>
							<div className="col-span-1 md:col-span-2">
								<label className="block text-sm mb-1">Görsel</label>
								{detail.attach_image_aeci ? (
									<img src={detail.attach_image_aeci} alt="worksite" className="h-40 rounded border" />
								) : (
									<div className="text-sm">Yok</div>
								)}
							</div>
						</div>
					) : (
						<div className="text-sm">Kayıt bulunamadı.</div>
					)}
				</Dialog>

				<CreateWorksite
					visible={isCreateOpen}
					onHide={() => setIsCreateOpen(false)}
					formData={formData}
					onChange={handleInputChange}
					onSubmit={handleCreate}
					isSubmitting={isSubmitting}
					isSalesLoading={isSalesLoading}
					onPickLocation={handlePickLocation}
					onFileChange={handleFileChange}
					selectedCustomer={selectedCustomer}
					customerSuggestions={customerSuggestions}
					onCustomerChange={(value) => { setSelectedCustomer(value); setFormData((prev) => ({ ...prev, assigned_dealer: value?.name || '' })); }}
					onCustomerComplete={handleCustomerComplete}
					onCustomerLazyLoad={handleCustomerLazyLoad}
				/>
			</div>
		</div>
	);
};

export default Worksites; 