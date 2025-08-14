import React from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

const OrdersList = ({ orders, isLoading }) => {
    // Status renklerini belirle
    const getStatusColor = (status) => {
        switch (status) {
            case 'Onaylandı':
                return 'success';
            case 'Muhasebe Onay Bekliyor':
                return 'info';
            case 'Yeni Sipariş':
                return 'warning';
            case 'İptal Edildi':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    // Status Türkçe karşılığı
    const getStatusText = (status) => {
        switch (status) {
            case 'Completed':
                return 'Tamamlandı';
            case 'Submitted':
                return 'Onaylandı';
            case 'Draft':
                return 'Taslak';
            case 'Cancelled':
                return 'İptal Edildi';
            default:
                return status;
        }
    };

    // Loading durumunda
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Siparişler yükleniyor...</div>
            </div>
        );
    }

    // Orders yoksa
    if (!orders || !orders.orders) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-gray-500">Sipariş bulunamadı</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-300">
            {/* Başlık ve Özet */}
            <div className="mb-8">


                {/* Özet Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{orders.total_orders}</div>
                            <div className="text-sm text-blue-500">Toplam Sipariş</div>
                        </div>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                ₺{orders.total_amount?.toLocaleString('tr-TR')}
                            </div>
                            <div className="text-sm text-green-500">Toplam Tutar</div>
                        </div>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {orders.summary?.completed || 0}
                            </div>
                            <div className="text-sm text-yellow-500">Tamamlanan</div>
                        </div>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {orders.summary?.submitted || 0}
                            </div>
                            <div className="text-sm text-purple-500">Bekleyen</div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Siparişler Accordion */}
            <Accordion multiple className="orders-accordion">
                {orders.orders.map((order, index) => (
                    <AccordionTab
                        key={order.name}
                        header={
                            <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex flex-col ">
                                    <div className="flex items-center gap-2 ">
                                        <span className="font-semibold text-md ">{order.name}</span>
                                        <Tag
                                            value={getStatusText(order.workflow_state)}
                                            severity={getStatusColor(order.workflow_state)}
                                            className="text-sm font-medium rounded-md w-fit"
                                        />

                                    </div>
                                    <div>
                                        <span className="text-sm text-white">
                                            {order.custom_end_customer}
                                        </span>
                                    </div>

                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-900">
                                        {new Date(order.transaction_date).toLocaleDateString('tr-TR')}
                                    </div>
                                    <div className="font-semibold text-lg text-black-600">
                                        ₺{order.grand_total?.toLocaleString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                        }
                        className="mb-2"
                    >
                        <div className="p-1">
                            {/* Sipariş Detayları */}
                            <div className="grid grid-cols-2 gap-2 mb-1 ">
                                <div className="bg-gray-50 p-1 rounded-lg">
                                    <div className="text-sm text-red-500">Sipariş No</div>
                                    <div className="font-semibold">{order.name}</div>
                                </div>
                                <div className="bg-gray-50 p-1 rounded-lg">
                                    <div className="text-sm text-red-500">Sipariş Tarihi</div>
                                    <div className="font-semibold">
                                        {new Date(order.transaction_date).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>

                            </div>

                            {/* Ürün Listesi */}
                            {order.items && order.items.length > 0 && (
                                <div>

                                    <div className="space-y-1">
                                        {order.items.map((item, itemIndex) => (
                                            <div
                                                key={itemIndex}
                                                className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-800">
                                                            {item.item_code}
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {item.item_group}
                                                        </div>

                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {item.qty} adet
                                                        </div>

                                                        <div className="text-sm font-semibold text--600">
                                                            ₺{item.amount?.toLocaleString('tr-TR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Toplam Bilgileri */}
                            <div className="mt-2 pt-1 border-t border-gray-200">
                                <div className="flex justify-end">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Toplam Tutar</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            ₺{order.grand_total?.toLocaleString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionTab>
                ))}
            </Accordion>
        </div>
    );
};

export default OrdersList; 