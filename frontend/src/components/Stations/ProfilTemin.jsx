import React, { useEffect, useState } from 'react'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {  getOptDetails } from '../../services/OptServices';
import { getItemDetails } from '../../services/ItemServices';
import { useQuery } from '@tanstack/react-query';
import Loading from '../Loading';



const ProfilTemin = ({currentOpt}) => {


    const [inputValues, setInputValues] = useState({});

    const handleInputChange = (e, itemNo) => {
        const { value } = e.target;
        setInputValues((prevValues) => ({
            ...prevValues,
            [itemNo]: value
        }));
    };

    const inputColumnTemplate = (rowData) => {
        return (
            <input
                type="number"
                value={inputValues[rowData.item_no] || ''}
                onChange={(e) => handleInputChange(e, rowData.item_no)}
             
                className="p-inputtext p-component w-10 border-2 text-center border-slate-700" // PrimeReact input stilini kullanma
            />
        );
    };
 const {
    data: optInfo,
    isLoading: isOptLoading,
    isError: isOptError,
    error: optError
} = useQuery({
    queryKey: ['optInfo', currentOpt?.value?.name],
    queryFn: () => getOptDetails(currentOpt?.value?.name),
    enabled: !!currentOpt?.value?.name
});

    const { data: images, isLoading: isImageLoading } = useQuery({
        queryKey: ['productImages', optInfo],
        queryFn: async () => {
            if (!optInfo) return []; // Eğer optInfo yoksa boş dizi döndür

            // Her `item_no` için API isteği yap
            const imageRequests = optInfo?.profilelist.map(async (item) => {
                const itemData = await getItemDetails(item.item_no);
                return { item_no: item.item_no, image: itemData.image };
            });

            // Promise.all ile tüm API çağrılarını bekle
            return Promise.all(imageRequests);
        },
        enabled: !!optInfo // optInfo yüklendikten sonra bu sorguyu çalıştır
    });
    if (isOptLoading || isImageLoading) return <Loading/>;
 
    return (
        <div className='w-full flex justify-between h-svh'>
            <div className="flex flex-col flex-1 bg-slate-100 w-2/3">
                <div className='h-1/2 overflow-auto'>
                    <DataTable stripedRows size='small' value={optInfo?.customer_list} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="projectno" sortable header="Proje Üretim No"></Column>
                        <Column field="customer" header="Müşteri Adı"></Column>
                        <Column field="order_no" header="Sipariş No"></Column>
                        <Column field="deliverydate" header="Sevk Tarihi"></Column>
                    </DataTable>
                </div>
                <div>
                    <DataTable stripedRows size='small' value={optInfo?.profilelist} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="item_no" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>
                        <Column header="Çekilen" body={inputColumnTemplate}></Column>
                        <Column field="qtyboy" header="Miktar (Boy)"></Column>
                        <Column field="qtymt" header="Miktar (Mt)"></Column>
                    </DataTable>
                </div>
            </div>
            <div className="w-1/3 p-4 grid grid-cols-2 gap-4 justify-center bg-slate-200">
                {
                    images?.map((img,index) => (
                        img.image && <img key={index} src={img.image} alt="" className='w-60 h-60' />
                    ))
                }


            </div>
        </div>
    )
}

export default ProfilTemin
