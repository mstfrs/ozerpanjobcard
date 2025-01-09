import React, { useEffect, useState } from 'react'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {  getSacKesimOptDetails } from '../../../services/OptServices';
import { getItemDetails } from '../../../services/ItemServices';
import { getPozDetails, getTesDetayDetails, getTestDetay, updateTesDetay } from '../../../services/TesDetayServices';

import { useQuery } from '@tanstack/react-query';
import Loading from '../../Loading';
import CustomerInfoCard from '../../Cards/CustomerInfo';
import AccessoryInfoCard from '../../Cards/AccessoryInfo';
import { InputText } from 'primereact/inputtext';
import { toast } from "react-toastify";


const baseUrl = import.meta.env.VITE_BASE_URL;



const KanatHazirlik = ({currentOpt,currentJobcard}) => {
   

    const [inputValues, setInputValues] = useState({});
    const [currentBarkod, setCurrentBarkod] = useState()
    const [tesDetay, setTesDetay] = useState()
    const [maxSanalAdet, setMaxSanalAdet] = useState(0);
    const [itemDetails, setItemDetails] = useState()
    const [barcodeDetails, setBarcodeDetails] = useState()

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

    const handleBarkodChange = async (e) => {
        // setIsLoading(true)
        await setCurrentBarkod(e.target.value)
        console.log(currentBarkod)
        const barcodeDetails = await getTesDetayDetails(e.target.value)
        console.log(barcodeDetails)
        barcodeDetails?.length == 0 && e.target.value!=="" ? toast.info('Bu barkod tamamlanmıştır'):null

        setBarcodeDetails(barcodeDetails)

        // barcodeDetails'tan pozNo'yu al
        const pozNo = barcodeDetails ? barcodeDetails[0].poz_no : {};
        const siparisNo = barcodeDetails ? barcodeDetails[0].siparis_no : {};
        
        const fetchBOMDetails = async () => {
            const bomKey = `BOM-${siparisNo}-${pozNo}-001`
            try {
                const response = await fetch(
                    `${baseUrl}/resource/BOM/${bomKey}`
                  ,{
                    method: "GET",
                    credentials: 'include',        
                  });
                  const data = await response.json();
                  console.log(data.data)
                  
            } catch (error) {
                console.error('BOM isteği başarısız:', error);
                throw error;
            }
        };
        fetchBOMDetails();
        
        console.log('Poz No', bomKey)
        // pozNo ile yeni bir istek yap
        const pozDetails = await getPozDetails(pozNo, siparisNo);
        const itemDetails = await getItemDetails(siparisNo + '-' + pozNo)
        setItemDetails(itemDetails)
        // sanaladet alanındaki en yüksek rakamı bul
        const maxSanalAdet = Math.max(...pozDetails.map(detail => parseInt(detail.sanal_adet, 10)));
        setMaxSanalAdet(maxSanalAdet);
        console.log(barcodeDetails)
        setTesDetay(barcodeDetails)
        // setIsLoading(false)
        // await updateTesDetay(barcodeDetails && barcodeDetails[0].name,

        //     { status: "Tamamlandı" }

        // )
    };



    if (isSacKesimOptLoading || isImageLoading) return <Loading/>;
 
    return (
        <>
                    <InputText className='border-2 w-80 h-12 m-2' value={currentBarkod} onChange={(e) => handleBarkodChange(e)} />

        <div className='w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2'>
           
            <div className="flex flex-col flex-1 bg-slate-100 w-1/4 overflow-auto">
            <div className='w-full flex justify-between items-center bg-slate-200 p-1 '>
{/* <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_name}</h3> */}
{currentJobcard&&<h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}
            </div>
             <CustomerInfoCard tesDetay={tesDetay} maxSanalAdet={maxSanalAdet} itemDetails={itemDetails}/>
            <AccessoryInfoCard/>
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
        </>
    )
}

export default KanatHazirlik
