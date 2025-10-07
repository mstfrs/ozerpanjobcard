import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

const CompletedInstallations = () => {
  const [completedInstallations, setCompletedInstallations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedInstallations, setExpandedInstallations] = useState(new Set());

  useEffect(() => {
    loadCompletedInstallations();
  }, []);

  const loadCompletedInstallations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/method/ozerpanjobcard.dealerApi.get_completed_installations`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.message && result.message.success) {
        setCompletedInstallations(result.message.data?.installations || []);
      } else {
        setError('Tamamlanan montajlar yüklenemedi');
      }
    } catch (err) {
      setError('Tamamlanan montajlar yüklenirken hata oluştu');
      console.error('Error loading completed installations:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstallation = (installationName) => {
    const newExpanded = new Set(expandedInstallations);
    if (newExpanded.has(installationName)) {
      newExpanded.delete(installationName);
    } else {
      newExpanded.add(installationName);
    }
    setExpandedInstallations(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Message severity="error" text={error} className="mb-4" />
    );
  }

  if (completedInstallations.length === 0) {
    return (
      <Card className="mb-6">
        <div className="text-center py-8">
          <i className="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Tamamlanan Montaj Yok</h3>
          <p className="text-gray-500">Tamamlanan montajlar burada listelenecektir.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="">
      <div className="bg-gray-300 rounded-lg shadow-sm border border-gray-200 p-1">
        {completedInstallations.map((installation) => (
          <div key={installation.name} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Accordion Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => toggleInstallation(installation.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="pi pi-check-circle text-green-600 text-lg"></i>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {installation.items[0].sales_order}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {installation.status || 'Tamamlandı'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        {installation.items && installation.items.length > 0 && installation.items[0].custom_end_customer && (
                          <span>
                            <i className="pi pi-users mr-1"></i>
                            {installation.items[0].custom_end_customer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {installation.items_count || 0} ürün
                    </p>
                    <p className="text-xs text-gray-500">
                      {installation.creation ? new Date(installation.creation).toLocaleDateString('tr-TR') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className={`pi pi-chevron-down text-gray-400 transition-transform duration-200 ${
                      expandedInstallations.has(installation.name) ? 'rotate-180' : ''
                    }`}></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            {expandedInstallations.has(installation.name) && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4 bg-red-200">
                  {/* Montaj Detayları */}
                  <div className="mb-4">
              
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Doküman No:</span>
                        <span className="ml-2 font-medium">{installation.name}</span>
                      </div>
                      {installation.remarks && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Notlar:</span>
                          <span className="ml-2 font-medium">{installation.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ürün Listesi */}
                  {installation.items && installation.items.length > 0 && (
                    <div>
                    
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Ürün Kodu
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Miktar
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Seri
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Renk
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {installation.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                    {item.item_code}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {item.qty}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {item.custom_serial || '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {item.custom_color || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedInstallations; 