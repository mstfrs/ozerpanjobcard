import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';

const Bayipanel = () => {
    const [barcode, setBarcode] = useState('');
    const [scannedItems, setScannedItems] = useState([]);
    const toast = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const videoRef = useRef(null);
    const codeReader = useRef(null);
    const streamRef = useRef(null);

    // Initialize code reader
    useEffect(() => {
        codeReader.current = new BrowserMultiFormatReader();
        return () => {
            if (codeReader.current) {
                codeReader.current.reset();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Fetch job card data
    const { data: jobCards, isLoading } = useFrappeGetDocList('Job Card', {
        fields: ['name', 'status', 'work_order', 'operation'],
        limit: 100
    });

    // Handle barcode input
    const handleBarcodeInput = (e) => {
        setBarcode(e.target.value);
    };

    // Handle barcode submission
    const handleBarcodeSubmit = () => {
        if (!barcode) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please enter a barcode', life: 3000 });
            return;
        }

        addScannedItem(barcode);
    };

    // Add scanned item to the list
    const addScannedItem = (barcodeValue) => {
        setScannedItems([...scannedItems, {
            id: Date.now(),
            barcode: barcodeValue,
            timestamp: new Date().toLocaleString(),
            status: 'Pending'
        }]);

        setBarcode('');
        toast.current.show({ severity: 'success', summary: 'Success', detail: 'Barcode scanned successfully', life: 3000 });
    };

    // Handle key press for barcode input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleBarcodeSubmit();
        }
    };

    // Initialize camera
    const initializeCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            return true;
        } catch (error) {
            console.error('Error initializing camera:', error);
            toast.current.show({ 
                severity: 'error', 
                summary: 'Camera Error', 
                detail: 'Failed to access camera. Please check camera permissions.', 
                life: 5000 
            });
            return false;
        }
    };

    // Start/Stop scanning
    const toggleScanning = async () => {
        if (!isScanning) {
            try {
                setIsScanning(true);
                setShowScanner(true);

                // Initialize camera first
                const cameraInitialized = await initializeCamera();
                if (!cameraInitialized) {
                    setIsScanning(false);
                    setShowScanner(false);
                    return;
                }
                
                // Start scanning after camera is initialized
                codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
                    if (result) {
                        addScannedItem(result.getText());
                    }
                    if (err && !(err instanceof Error)) {
                        console.error(err);
                    }
                });
            } catch (error) {
                console.error('Error starting camera:', error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to start camera', life: 3000 });
                setIsScanning(false);
                setShowScanner(false);
            }
        } else {
            stopScanning();
        }
    };

    const stopScanning = () => {
        if (codeReader.current) {
            codeReader.current.reset();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsScanning(false);
        setShowScanner(false);
    };

    const onHideScanner = () => {
        stopScanning();
    };

    const scannerFooter = (
        <div>
            <Button label="Close" icon="pi pi-times" onClick={onHideScanner} className="p-button-text" />
            <Button label="Stop Scanning" icon="pi pi-stop" onClick={toggleScanning} className="p-button-danger" />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            
            <div className="grid">
                <div className="col-12 md:col-6">
                    <Card title="Barcode Scanner" className="shadow-2">
                        <div className="flex flex-column gap-4">
                            <div className="p-inputgroup">
                                <InputText
                                    value={barcode}
                                    onChange={handleBarcodeInput}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Scan or enter barcode"
                                    className="w-full"
                                    autoFocus
                                />
                                <Button
                                    icon="pi pi-search"
                                    onClick={handleBarcodeSubmit}
                                    className="p-button-primary"
                                />
                            </div>
                            
                            <Button
                                label={isScanning ? "Stop Scanning" : "Start Scanning"}
                                icon={isScanning ? "pi pi-stop" : "pi pi-camera"}
                                onClick={toggleScanning}
                                className={`p-button-${isScanning ? 'danger' : 'success'}`}
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-12 md:col-6">
                    <Card title="Job Cards" className="shadow-2">
                        {isLoading ? (
                            <div className="flex justify-content-center">
                                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                            </div>
                        ) : (
                            <DataTable value={jobCards} paginator rows={5} className="p-datatable-sm">
                                <Column field="name" header="Job Card" sortable></Column>
                                <Column field="status" header="Status" sortable></Column>
                                <Column field="work_order" header="Work Order" sortable></Column>
                                <Column field="operation" header="Operation" sortable></Column>
                            </DataTable>
                        )}
                    </Card>
                </div>

                <div className="col-12">
                    <Card title="Scanned Items" className="shadow-2">
                        <DataTable value={scannedItems} paginator rows={5} className="p-datatable-sm">
                            <Column field="barcode" header="Barcode"></Column>
                            <Column field="timestamp" header="Time"></Column>
                            <Column field="status" header="Status"></Column>
                            <Column body={(rowData) => (
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-danger p-button-sm"
                                    onClick={() => {
                                        setScannedItems(scannedItems.filter(item => item.id !== rowData.id));
                                    }}
                                />
                            )}></Column>
                        </DataTable>
                    </Card>
                </div>
            </div>

            <Dialog 
                visible={showScanner} 
                onHide={onHideScanner}
                header="Barcode Scanner"
                footer={scannerFooter}
                style={{ width: '90vw', maxWidth: '800px' }}
                className="p-fluid"
            >
                <div className="flex justify-content-center">
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            maxWidth: '640px',
                            height: '480px',
                            objectFit: 'cover',
                            backgroundColor: '#000',
                            borderRadius: '8px'
                        }}
                        className="border-round shadow-2"
                        autoPlay
                        playsInline
                        muted
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default Bayipanel;