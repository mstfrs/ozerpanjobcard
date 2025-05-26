import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputMask } from 'primereact/inputmask'
import { InputTextarea } from 'primereact/inputtextarea'
import { Calendar } from 'primereact/calendar'
import { Card } from 'primereact/card'
import { RadioButton } from 'primereact/radiobutton'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { FaCamera, FaWpforms, FaTrash } from 'react-icons/fa'
import { Dropdown } from 'primereact/dropdown'
import { Toast } from 'primereact/toast'

// PrimeReact styles
import "primereact/resources/themes/md-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const optionList = [
  { label: 'QR Code ile', value: 'qr' },
  { label: 'Sipariş No ile', value: 'order' }
];

const Bayipanel = () => {
  const [selectedOption, setSelectedOption] = useState('qr')
  const [orderNumber, setOrderNumber] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const qrRef = useRef(null)
  const readerRef = useRef(null)
  const toastRef = useRef(null)
  
  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    installation_date: '',
    description: '',
    items: []
  })

  const [scannedSerials, setScannedSerials] = useState([])

  const [dealerList, setDealerList] = useState([])
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [loadingDealers, setLoadingDealers] = useState(false)
  const [dealerReadOnly, setDealerReadOnly] = useState(false)

  const validatePhone = (phone) => {
    const phoneWithoutMask = phone.replace(/[^0-9]/g, '');
    if (phoneWithoutMask.length !== 10) {
      setPhoneError('Telefon numarası 10 haneli olmalıdır');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      customer_phone: value
    }));
    validatePhone(value);
  };

  const extractSerialFromQR = (qrText) => {
    try {
      const url = new URL(qrText);
      const serial = url.searchParams.get('serial');
      if (serial) {
        const orderNumber = serial.split('-')[0];
        const serialPrefix = serial.split('-').slice(0, 2).join('-'); // S500926-2 formatı için
        return { serial, orderNumber, serialPrefix };
      }
    } catch (error) {
      console.error('QR kod formatı geçersiz:', error);
    }
    return null;
  };

  const fetchSalesOrderData = async (orderNumber) => {
    try {
      const response = await fetch(`/api/method/frappe.client.get?doctype=Sales Order&filters={"name":"${orderNumber}"}`);
      const data = await response.json();
      if (data.message) {
        setFormData(prev => ({
          ...prev,
          customer_name: data.message.custom_end_customer || '',
        }));
      }
    } catch (error) {
      console.error('Sales Order bilgileri alınamadı:', error);
    }
  };

  const handleSerialScan = async (decodedText) => {
    const result = extractSerialFromQR(decodedText);
    if (!result) return;

    // 1. Aynı kodu tekrar okutma kontrolü
    if (scannedSerials.some(s => s.serial === result.serial)) {
      toastRef.current?.show({ severity: 'warn', summary: 'Uyarı', detail: 'Bu seri numarası zaten okutuldu!', life: 3000 });
      return;
    }

    // 2. Seri No Doctype'ında var mı kontrolü
    try {
      const serialRes = await fetch(`/api/resource/Serial No?filters=[[\"name\",\"=\",\"${result.serial}\"]]`);
      const serialData = await serialRes.json();
      console.log('Serial No API response:', serialData);
      if (!Array.isArray(serialData.data) || serialData.data.length === 0) {
        toastRef.current?.show({ severity: 'error', summary: 'Seri Numarası Bulunamadı', detail: 'Seri numarası sistemde kayıtlı değil!', life: 4000 });
        return;
      }
    } catch (err) {
      toastRef.current?.show({ severity: 'error', summary: 'Hata', detail: 'Seri numarası sorgulanamadı!', life: 4000 });
      return;
    }

    // 3. Daha önce Installation Note var mı kontrolü
    try {
      const instRes = await fetch(`/api/resource/Installation Note Item?filters=[["serial_no","=","${result.serial}"]]`);
      const instData = await instRes.json();
      if (instData.data && instData.data.length > 0) {
        toastRef.current?.show({ severity: 'info', summary: 'Kurulum Zaten Yapılmış', detail: 'Daha önce bu seri numarasının kurulumu tamamlanmıştır.', life: 4000 });
        return;
      }
    } catch (err) {
      toastRef.current?.show({ severity: 'error', summary: 'Hata', detail: 'Kurulum sorgulanamadı!', life: 4000 });
      return;
    }

    // Tüm kontroller geçtiyse ekle
    setScannedSerials(prev => [...prev, {
      serialPrefix: result.serialPrefix,
      serial: result.serial
    }]);
    fetchSalesOrderData(result.orderNumber);
  };

  const startScanner = async () => {
    try {
      // DOM'da reader var mı kontrolü
      const readerDiv = document.getElementById('reader');
      if (!readerDiv) return;
      const html5QrCode = new Html5Qrcode("reader");
      qrRef.current = html5QrCode;
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length) {
        const cameraId = cameras[0].id;
        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
            aspectRatio: 1.0,
            disableFlip: true,
            videoConstraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: "environment",
              focusMode: "continuous",
              zoom: 2.0
            }
          },
          (decodedText) => {
            handleSerialScan(decodedText);
          },
          (errorMessage) => {}
        );
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
    }
  };

  const stopScanner = () => {
    try {
      // reader div'i DOM'da yoksa veya qrRef yoksa işlemi atla
      if (!document.getElementById('reader') || !qrRef.current) return;
      qrRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(err => {
        console.error("Error stopping scanner:", err);
      });
    } catch (err) {
      console.error("Error in stopScanner:", err);
    }
  };

  const handleCameraOpen = () => {
    setShowCamera(true);
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
    // Modal kapandıktan sonra stopScanner'ı biraz geciktir
    setTimeout(() => {
      stopScanner();
    }, 150);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ana belge
    const installationNoteData = {
      doctype: "Installation Note",
      docstatus: 0,
      territory: "Türkiye",
      company: "Ozerpan",
      customer: selectedDealer,
      custom_end_customer: formData.customer_name,
      custom_end_customer_phone: formData.customer_phone,
      custom_end_customer_address: formData.customer_address,
      inst_date: formData.installation_date,
      remarks: formData.description,
      items: scannedSerials.map((item, idx) => ({
        doctype: "Installation Note Item",
        docstatus: 0,
        parenttype: "Installation Note",
        parentfield: "items",
        idx: idx + 1,
        item_code: item.serialPrefix,
        serial_no: item.serial,
        qty: 1
      }))
    };

    // Frappe endpointi için payload
    const payload = {
      doc: JSON.stringify(installationNoteData),
      action: "Save"
    };

    console.log('Installation Note Payload:', payload);

    try {
      const response = await fetch('/api/method/frappe.desk.form.save.savedocs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.message) {
        alert('Montaj talebi başarıyla kaydedildi');
        setFormData({
          customer_name: '',
          customer_phone: '',
          customer_address: '',
          installation_date: '',
          description: '',
          items: []
        });
        setScannedSerials([]);
      }
    } catch (error) {
      alert('Kayıt sırasında bir hata oluştu!');
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedOption === 'qr') {
      // startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [selectedOption]);

  const handleOrderNumberSubmit = (e) => {
    e.preventDefault()
    console.log('Order Number:', orderNumber)
  }

  const handleDeleteSerial = (index) => {
    setScannedSerials(prev => prev.filter((_, i) => i !== index));
  };

  // Dealer ve employee fetch
  useEffect(() => {
    const fetchDealers = async () => {
      setLoadingDealers(true);
      try {
        // 1. Oturum açmış kullanıcıyı al
        const userRes = await fetch('/api/method/frappe.auth.get_logged_user');
        const userData = await userRes.json();
        const userId = userData.message;
        if (!userId) return;
        // 2. Employee kaydını al
        const empRes = await fetch(`/api/resource/Employee?filters=[["user_id","=","${userId}"]]`);
        const empData = await empRes.json();
        const employee = empData.data && empData.data.length > 0 ? empData.data[0] : null;
        if (!employee || !employee.name) return;
        // 3. Employee detayını al (child table için)
        const empDetailRes = await fetch(`/api/resource/Employee/${employee.name}`);
        const empDetailData = await empDetailRes.json();
        const dealers = empDetailData.data && empDetailData.data.custom_dealers ? empDetailData.data.custom_dealers : [];
        setDealerList(dealers.map(d => ({ label: d.dealer, value: d.dealer })));
        if (dealers.length === 1) {
          setSelectedDealer(dealers[0].dealer);
          setDealerReadOnly(true);
        } else if (dealers.length > 1) {
          setSelectedDealer(dealers[0].dealer);
          setDealerReadOnly(false);
        }
      } catch (err) {
        setDealerList([]);
        setDealerReadOnly(false);
      } finally {
        setLoadingDealers(false);
      }
    };
    fetchDealers();
  }, []);

  return (
    <>
      <Toast ref={toastRef} position="top-right" />
      <div className="max-w-4xl mx-auto p-2 min-h-screen flex justify-center" style={{ background: '#fff5f5' }}>
        <Card className="w-full max-w-2xl shadow-4 border-round-3xl p-0 overflow-hidden" style={{ background: '#fff' }}>
          {/* <div className="flex items-center gap-3 px-6 py-4" style={{ background: '#b91c1c' }}>
            <FaWpforms size={28} className="text-white" />
            <span className="text-white text-2xl font-bold tracking-wide">Montaj Formu</span>
          </div> */}
          <div className="px-6 py-8">
            {/* Dealer Dropdown */}
            <div className="mb-6">
              <label className="block mb-2 text-red-800 font-semibold">Bayi Seçiniz</label>
              <Dropdown value={selectedDealer} options={dealerList} onChange={e => setSelectedDealer(e.value)} placeholder={loadingDealers ? 'Yükleniyor...' : 'Bayi seçiniz'} className="w-full border-round-3xl" disabled={loadingDealers || dealerList.length === 0 || dealerReadOnly} readOnly={dealerReadOnly} />
            </div>
            <div className="mb-6 flex gap-6 items-center justify-center">
              {optionList.map(opt => (
                <span key={opt.value} className="flex align-items-center mr-4">
                  <RadioButton inputId={opt.value} name="option" value={opt.value} onChange={e => setSelectedOption(e.value)} checked={selectedOption === opt.value} />
                  <label htmlFor={opt.value} className="ml-2 text-red-700 cursor-pointer font-semibold">{opt.label}</label>
                </span>
              ))}
            </div>
            {selectedOption === 'qr' && (
              <div className=" border-red-300 border-round-2xl ">
                <div className="flex flex-col items-center mb-4">
                  <Button 
                    icon={<FaCamera size={24} />}
                    onClick={handleCameraOpen}
                    className="p-button-rounded"
                    style={{ 
                      background: '#b91c1c',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 4px 12px 0 rgba(185,28,28,0.15)'
                    }}
                    aria-label="QR Code Okut"
                  />
                </div>
                <Dialog 
                  visible={showCamera} 
                  onHide={handleCameraClose}
                  header={<div className="text-xl font-medium text-red-800">QR Kod Okut</div>}
                  style={{ width: '90vw', maxWidth: '500px' }}
                  modal
                  className="p-fluid"
                  contentStyle={{ padding: '0' }}
                >
                  <div className="camera-container" style={{ position: 'relative', width: '100%', height: '400px' }}>
                    <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                  <div className="p-3 text-center border-top">
                    <small className="text-red-400">QR kodu kameraya gösterin</small>
                  </div>
                </Dialog>
              </div>
            )}
            {selectedOption === 'order' && (
              <div className="border-2 border-red-300 border-round-2xl bg-red-50 p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4 text-red-800">Sipariş No Gir</h2>
                <form onSubmit={handleOrderNumberSubmit} className="flex flex-col gap-4">
                  <InputText
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full border-round-full p-3 focus:border-red-400"
                    placeholder="Sipariş numarasını giriniz"
                    style={{ border: '1.5px solid #b91c1c', background: '#fff1f2' }}
                  />
                  <Button 
                    type="submit"
                    label="Ara"
                    className="w-full border-round-full"
                    style={{ background: '#b91c1c', color: '#fff', border: 'none' }}
                    severity="danger"
                  />
                </form>
              </div>
            )}
               {/* TABLO DIŞARIDA */}
              {scannedSerials.length > 0 && (
                <div className="mt-10 mb-4 ">
                  <h3 className="text-lg font-semibold mb-4 text-red-800">Okutulan Seri Numaraları</h3>
                  <div className="shadow-3 border-2 border-red-300 border-round-2xl bg-white p-1">
                    <DataTable value={scannedSerials} className="p-datatable-sm border-round-2xl w-full" showGridlines responsiveLayout="scroll">
                      <Column field="serialPrefix" header="Sipariş No" style={{ minWidth: '120px' }}></Column>
                      <Column field="serial" header="Seri No" style={{ minWidth: '160px' }}></Column>
                      <Column header="" body={(rowData, {rowIndex}) => (
                        <Button icon={<FaTrash />} className="p-button-rounded p-button-danger p-button-sm" onClick={() => handleDeleteSerial(rowIndex)} tooltip="Sil" type="button" style={{marginLeft: 8}} />
                      )} style={{ width: '60px', textAlign: 'center' }} />
                    </DataTable>
                  </div>
                </div>
              )}
              {/* FORM */}
              <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white shadow-2 flex flex-col gap-3">
                <div className="field">
                  <label htmlFor="customer_name" className="block mb-2 text-red-800 font-semibold">Müşteri Adı</label>
                  <InputText
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleFormChange}
                    className="w-full rounded-md p-2 focus:border-red-400"
                    style={{ border: '1.5px solid #b91c1c', background: '#fff' }}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="customer_phone" className="block mb-2 text-red-800 font-semibold">Müşteri Telefon</label>
                  <InputMask
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handlePhoneChange}
                    mask="(999) 999-9999"
                    placeholder="(5XX) XXX-XXXX"
                    className={`w-full rounded-md p-2 focus:border-red-400 ${phoneError ? 'p-invalid' : ''}`}
                    style={{ border: '1.5px solid #b91c1c', background: '#fff' }}
                    required
                  />
                  {phoneError && <small className="p-error block mt-1">{phoneError}</small>}
                </div>
                <div className="field">
                  <label htmlFor="customer_address" className="block mb-2 text-red-800 font-semibold">Müşteri Adresi</label>
                  <InputTextarea
                    id="customer_address"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleFormChange}
                    className="w-full rounded-md p-2 focus:border-red-400"
                    style={{ border: '1.5px solid #b91c1c', background: '#fff' }}
                    rows={2}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="installation_date" className="block mb-2 text-red-800 font-semibold">Montaj Tarihi</label>
                  <Calendar
                    id="installation_date"
                    name="installation_date"
                    value={formData.installation_date}
                    onChange={handleFormChange}
                    className="w-full rounded-md p-2 focus:border-red-400"
                    style={{ border: '1.5px solid #b91c1c', background: '#fff' }}
                    dateFormat="dd/mm/yy"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="description" className="block mb-2 text-red-800 font-semibold">Açıklama</label>
                  <InputTextarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full rounded-md p-2 focus:border-red-400"
                    style={{ border: '1.5px solid #b91c1c', background: '#fff' }}
                    rows={2}
                  />
                </div>
                <Button
                  type="submit"
                  label="KAYDET"
                  className="mt-2 w-full rounded-full p-3 text-lg font-bold"
                  style={{ background: '#b91c1c', color: '#fff', border: 'none', letterSpacing: '1px' }}
                  severity="danger"
                />
              </form>
           
          </div>
        </Card>
      </div>
    </>
  )
}

export default Bayipanel
