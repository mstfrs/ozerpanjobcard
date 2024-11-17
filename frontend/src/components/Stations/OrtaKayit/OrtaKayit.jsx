import React, { useEffect, useState } from 'react'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {  getSacKesimOptDetails } from '../../../services/OptServices';
import { getItemDetails } from '../../../services/ItemServices';
import { useQuery } from '@tanstack/react-query';
import Loading from '../../Loading';
import CustomerInfoCard from '../../Cards/CustomerInfo';



const OrtaKayit = ({currentOpt,currentJobcard}) => {
   

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
    data: sacKesimOptInfo,
    isLoading: isSacKesimOptLoading,
    isError: isOptError,
    error: optError
} = useQuery({
    queryKey: ['sacKesimOptInfo', currentOpt?.custom_opti_no],
    queryFn: () => getSacKesimOptDetails(currentOpt?.custom_opti_no),
    enabled: !!currentOpt?.custom_opti_no
});

    const { data: images, isLoading: isImageLoading } = useQuery({
        queryKey: ['productImages', sacKesimOptInfo],
        queryFn: async () => {
            if (!sacKesimOptInfo) return []; // Eğer optInfo yoksa boş dizi döndür

            // Her `item_no` için API isteği yap
            const uniqueItems = [...new Set(sacKesimOptInfo?.profilelist.map(item => item.item_no))];

            const imageRequests = uniqueItems.map(async (item) => {
                const itemData = await getItemDetails(item);
                return { item, image: itemData.image };
            });
            // Promise.all ile tüm API çağrılarını bekle
            return Promise.all(imageRequests);
        },
        enabled: !!sacKesimOptInfo // optInfo yüklendikten sonra bu sorguyu çalıştır
    });
    if (isSacKesimOptLoading || isImageLoading) return <Loading/>;
 
    return (
        <div className='w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2'>
           
            <div className="flex flex-col flex-1 bg-slate-100 w-1/4">
            <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
{/* <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_name}</h3> */}
{currentJobcard&&<h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}
            </div>
             <CustomerInfoCard/>
                {/* <div className='overflow-auto'>
                    <DataTable stripedRows size='small' value={sacKesimOptInfo?.profilelist} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="item_no" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>                       
                        <Column field="count" header="Adet"></Column>
                        <Column field="size" header="Ölçü"></Column>
                    </DataTable>
                </div> */}
            </div>
            <div className="w-2/4 p-4 flex gap-4 justify-center bg-slate-200">
            <img  src="/poz1.png" alt="" className=' h-full' />
                {/* {
                    images?.map((img,index) => (
                        img.image && <img key={index} src="/poz1.png" alt="" className='w-60 h-60' />
                    ))
                } */}


            </div>
            <div className="w-1/4 h-full p-4 grid grid-cols-1 gap-4 justify-center place-items-center bg-slate-200 overflow-auto">
            <img  src="/11493.png" alt="" className=' h-40 w-40' />
            <img  src="/11493.png" alt="" className=' h-40 w-40' />
            <img  src="/11493.png" alt="" className=' h-40 w-40' />
            <img  src="/11493.png" alt="" className=' h-40 w-40' />

            
              


            </div>
        </div>
    )
}

export default OrtaKayit
