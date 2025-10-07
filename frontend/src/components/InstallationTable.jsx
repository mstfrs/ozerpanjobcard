import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

const InstallationTable = ({ items, onSelectionChange, onInstallationNoteCreated }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [installationData, setInstallationData] = useState({
    installation_date: new Date(),
    notes: '',
    customer_name: '',
    customer_phone: '',
    customer_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  console.log(items)

  useEffect(() => {
    // Initialize with no items selected - only on mount
    setSelectedItems([]);
  }, []); // Empty dependency array - only run once on mount

  // Shared selection helpers
  const isItemSelected = (row) => Array.isArray(selectedItems) && selectedItems.some(it => it.item_code === row.item_code);
  const applySelection = (nextSelection) => {
    setSelectedItems(nextSelection);
    if (onSelectionChange) onSelectionChange(nextSelection);
  };
  const toggleItemSelection = (row) => {
    if (isItemSelected(row)) {
      applySelection(selectedItems.filter(it => it.item_code !== row.item_code));
    } else {
      applySelection([...(Array.isArray(selectedItems) ? selectedItems : []), row]);
    }
  };

  const handleCreateInstallationNote = async () => {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      setError('Lütfen en az bir ürün seçin');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Seçilen ürünleri filtrele
      const selectedItemsData = items.filter(item => 
        selectedItems.some(selected => selected.item_code === item.item_code)
      );

      // Tarihi güvenli formatta hazırla
      let safeInstallationDate = new Date().toISOString().split('T')[0]; // Bugünün tarihi YYYY-MM-DD formatında
      if (installationData.installation_date) {
        try {
          if (installationData.installation_date instanceof Date) {
            // Date object'i YYYY-MM-DD formatına çevir
            safeInstallationDate = installationData.installation_date.toISOString().split('T')[0];
          } else if (typeof installationData.installation_date === 'string') {
            // String ise kontrol et
            if (installationData.installation_date.includes('T')) {
              safeInstallationDate = installationData.installation_date.split('T')[0];
            } else {
              safeInstallationDate = installationData.installation_date;
            }
          }
        } catch (e) {
          console.warn('Tarih parse hatası, bugünün tarihi kullanılıyor:', e);
          safeInstallationDate = new Date().toISOString().split('T')[0];
        }
      }

      // Installation Note oluştur
      const response = await fetch('/api/method/ozerpanjobcard.dealerApi.create_installation_note', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order: selectedItemsData[0]?.against_sales_order,
          selected_items: selectedItemsData,
          installation_data: {
            ...installationData,
            installation_date: safeInstallationDate, // Güvenli tarih formatı
            territory: "Turkey" // Default territory olarak Turkey ekle
          }
        }),
      });

      const result = await response.json();
      if (result.message && result.message.success) {
        // Başarılı oluşturma
        setShowCreateDialog(false);
        setSelectedItems([]);
        onSelectionChange([]);
        setInstallationData({
          installation_date: new Date(),
          notes: '',
          customer_name: '',
          customer_phone: '',
          customer_address: ''
        });
        
        // Parent component'e bildir
        if (onInstallationNoteCreated) {
          onInstallationNoteCreated(result.message.data.installation_note);
        }
        
        // Başarı mesajı - detaylı bilgi ile
        const installationNote = result.message.data.installation_note;
        const successMessage = `Installation Note başarıyla oluşturuldu!\n\n` +
          `Doküman No: ${installationNote.name}\n` +
          `Müşteri: ${installationNote.customer}\n` +
          `Toplam Ürün: ${installationNote.total_qty || 0}\n` +
          `Toplam Tutar: ${(installationNote.grand_total || 0).toLocaleString('tr-TR')} TL\n` +
          `Montaj Tarihi: ${new Date(installationNote.inst_date).toLocaleDateString('tr-TR')}`;
        
        alert(successMessage);
      } else {
        setError(result.message?.message || 'Installation Note oluşturulamadı');
      }
    } catch (err) {
      setError('Installation Note oluşturulurken hata oluştu');
      console.error('Error creating installation note:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      setError('Lütfen en az bir ürün seçin');
      return;
    }
    setError('');
    setShowCreateDialog(true);
  };

  const headerCheckboxTemplate = (options) => {
    const checked = Array.isArray(selectedItems) && selectedItems.length === items.length && items.length > 0;
    const indeterminate = Array.isArray(selectedItems) && selectedItems.length > 0 && selectedItems.length < items.length;
    
    return (
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={(e) => {
          if (e.checked) {
            // Tümünü seç
            console.log('Header checkbox - selecting all:', items);
            setSelectedItems([...items]);
            if (onSelectionChange) {
              onSelectionChange([...items]);
            }
          } else {
            // Tümünü kaldır
            console.log('Header checkbox - deselecting all');
            setSelectedItems([]);
            if (onSelectionChange) {
              onSelectionChange([]);
            }
          }
        }}
        onClick={(e) => {
          // Header checkbox'a tıklandığında event'in bubble olmasını engelle
          e.stopPropagation();
        }}
      />
    );
  };

  const checkboxTemplate = (rowData) => {
    const isSelected = isItemSelected(rowData);
    
    return (
      <Checkbox
        checked={isSelected}
        onChange={(e) => {
          if (e.checked) {
            applySelection([...selectedItems, rowData]);
          } else {
            applySelection(selectedItems.filter(item => item.item_code !== rowData.item_code));
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    );
  };

  const serialTemplate = (rowData) => {
    if (!rowData.custom_serial) return <span className="text-gray-400">N/A</span>;
    
    return (
      <Tag value={rowData.custom_serial} severity="info" />
    );
  };

  const colorTemplate = (rowData) => {
    if (!rowData.custom_color) return <span className="text-gray-400">N/A</span>;
    
    return (
      <Tag value={rowData.custom_color} severity="success" />
    );
  };

  const dimensionsTemplate = (rowData) => {
    if (!rowData.custom_width || !rowData.custom_height) {
      return <span className="text-gray-400">N/A</span>;
    }
    
    return (
      <Tag 
        value={`${rowData.custom_width} × ${rowData.custom_height} mm`} 
        severity="warning" 
      />
    );
  };

  const quantityTemplate = (rowData) => {
    return (
      <Tag value={rowData.delivered_qty} severity="secondary" />
    );
  };

  const dateTemplate = (rowData) => {
    return new Date(rowData.delivery_date).toLocaleDateString('tr-TR');
  };

  // Custom CSS styles for table
  const tableStyles = `
    .selected-row {
      background-color: #eff6ff !important;
      border-left: 4px solid #3b82f6 !important;
      transition: all 0.2s ease-in-out;
    }
    
    .selected-row:hover {
      background-color: #dbeafe !important;
    }
    
    .p-datatable .p-datatable-tbody > tr {
      cursor: pointer;
      transition: background-color 0.2s ease-in-out;
    }
    
    .p-datatable .p-datatable-tbody > tr:hover {
      background-color: #f8fafc !important;
    }
    
    .p-datatable .p-datatable-tbody > tr.selected-row:hover {
      background-color: #dbeafe !important;
    }
    
    .p-checkbox .p-checkbox-box.p-highlight {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
  `;

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Bu sipariş için teslim edilen ürün bulunamadı.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Custom CSS Styles */}
      <style>{tableStyles}</style>
      
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-1 justify-between items-center ">
          <div>        
            <p className="sm:text-sm text-xs text-gray-600 mt-1">
              Montaj Kaydı oluşturmak için ürünleri seçin
            </p>
          </div>
          
          {selectedItems.length > 0 && (
            <Button
              label="Montaj Kaydı Oluştur"
              icon="pi pi-plus"
              onClick={openCreateDialog}
              className="p-button-primary bg-blue-400 w-full sm:w-auto py-1 px-2"
              size="small"
            />
          )}
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="px-4 sm:px-6 py-2">
          <Message severity="error" text={error} onClose={() => setError('')} />
        </div>
      )}

      <div className="p-2 sm:p-4">
        {/* Mobile View - Card Layout */}
        <div className="block sm:hidden">
          {items.map((item, index) => (
            <div 
              key={`${item.item_code}-${index}`}
              className={`border rounded-lg p-4 mb-3 ${
                selectedItems.some(selected => selected.item_code === item.item_code) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
              onClick={() => toggleItemSelection(item)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
             
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.item_code}</h4>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Seri:</span>
                  <div className="mt-1">
                    {item.custom_serial ? (
                      <Tag value={item.custom_serial} severity="info" />
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Renk:</span>
                  <div className="mt-1">
                    {item.custom_color ? (
                      <Tag value={item.custom_color} severity="success" />
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Boyutlar:</span>
                  <div className="mt-1">
                    {item.custom_width && item.custom_height ? (
                      <Tag value={`${item.custom_width} × ${item.custom_height} mm`} severity="warning" />
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Miktar:</span>
                  <div className="mt-1">
                    <Tag value={item.delivered_qty} severity="secondary" />
                  </div>
                </div>
                
                {/* <div className="col-span-2">
                  <span className="text-gray-500">Teslimat Tarihi:</span>
                  <div className="mt-1 text-gray-900">
                    {new Date(item.delivery_date).toLocaleDateString('tr-TR')}
                  </div>
                </div> */}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table Layout */}
        <div className="hidden sm:block ">
          <DataTable
            value={items}
            dataKey="item_code"
            responsiveLayout="stack"
            className="p-datatable-sm"
            emptyMessage="Ürün bulunamadı"
            headerCheckboxTemplate={headerCheckboxTemplate}
            showGridlines
            stripedRows
            size="small"
            scrollable
            scrollHeight="400px"
            style={{ fontSize: '0.675rem' }}
            rowClassName={(data) => {
              // Seçilen satırlar için özel CSS class
              const isSelected = Array.isArray(selectedItems) && 
                selectedItems.some(item => item.item_code === data.item_code);
              return isSelected ? 'selected-row' : '';
            }}
            onRowClick={(event) => {
              // Satıra tıklandığında sadece o satırın selection'ını toggle yap
              const rowData = event.data;
              const isSelected = Array.isArray(selectedItems) && 
                selectedItems.some(item => item.item_code === rowData.item_code);
              
              if (isSelected) {
                // Seçimi kaldır - sadece bu satırı çıkar
                const newSelection = selectedItems.filter(item => item.item_code !== rowData.item_code);
                console.log('Row click - removing from selection:', newSelection);
                setSelectedItems(newSelection);
                if (onSelectionChange) {
                  onSelectionChange(newSelection);
                }
              } else {
                // Seçimi ekle - mevcut selection'a ekle
                const newSelection = [...selectedItems, rowData];
                console.log('Row click - adding to selection:', newSelection);
                setSelectedItems(newSelection);
                if (onSelectionChange) {
                  onSelectionChange(newSelection);
                }
              }
            }}
          >
          
            
            <Column 
              field="item_code" 
              header="Ürün Kodu" 
               
              style={{ minWidth: '100px' }}
              frozen
            />
            
            <Column 
              field="custom_serial" 
              header="Seri" 
              body={serialTemplate}
              style={{ minWidth: '100px' }}
            />
            
            <Column 
              field="custom_color" 
              header="Renk" 
              body={colorTemplate}
              style={{ minWidth: '100px' }}
            />
            
            <Column 
              header="Boyutlar" 
              body={dimensionsTemplate}
              style={{ minWidth: '120px' }}
            />
            
            <Column 
              field="delivered_qty" 
              header="Miktar" 
              body={quantityTemplate}
              style={{ minWidth: '70px' }}
            />
            
            <Column 
              field="delivery_date" 
              header="Teslimat Tarihi" 
              body={dateTemplate}
              
              style={{ minWidth: '100px' }}
            />
          </DataTable>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedItems.length}</span> ürün seçildi
          </div>
          <div className="text-sm text-gray-600">
            Toplam: <span className="font-medium">{items.length}</span> ürün
          </div>
        </div>
      </div>

      {/* Installation Note Oluşturma Dialog */}
      <Dialog
        header="Montaj Kaydı Oluştur"
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        style={{ width: '500px' }}
        modal
        className="p-fluid"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montaj Tarihi
            </label>
            <Calendar
              value={installationData.installation_date}
              onChange={(e) => setInstallationData({...installationData, installation_date: e.value})}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Adı
            </label>
            <InputText
              value={installationData.customer_name}
              onChange={(e) => setInstallationData({...installationData, customer_name: e.target.value})}
              placeholder="Müşteri adını girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Telefonu
            </label>
            <InputText
              value={installationData.customer_phone}
              onChange={(e) => setInstallationData({...installationData, customer_phone: e.target.value})}
              placeholder="Telefon numarasını girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Adresi
            </label>
            <InputTextarea
              value={installationData.customer_address}
              onChange={(e) => setInstallationData({...installationData, customer_address: e.target.value})}
              placeholder="Adresi girin"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <InputTextarea
              value={installationData.notes}
              onChange={(e) => setInstallationData({...installationData, notes: e.target.value})}
              placeholder="Ek notlar ekleyin"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Seçilen Ürünler:</h4>
            <div className="space-y-1">
              {selectedItems.map((item, index) => (
                <div key={index} className="text-sm text-blue-700">
                  • {item.item_code} - {item.custom_serial || 'Seri Yok'} - {item.custom_color || 'Renk Yok'}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-sm text-blue-700">
                <strong>Sales Order:</strong> {selectedItems[0]?.against_sales_order || 'N/A'}
              </div>
              <div className="text-sm text-blue-700">
                <strong>Müşteri:</strong> {selectedItems[0]?.customer || 'N/A'}
              </div>
              <div className="text-sm text-blue-700">
                <strong>Territory:</strong> Turkey
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            label="İptal"
            icon="pi pi-times"
            onClick={() => setShowCreateDialog(false)}
            className="p-button-secondary"
            disabled={loading}
          />
          <Button
            label="Montaj Kaydı Oluştur"
            icon="pi pi-check"
            onClick={handleCreateInstallationNote}
            className="p-button-primary"
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default InstallationTable; 