import React, { useEffect, useState } from 'react'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {  getProfilTeminOptDetails, updateProfilList } from '../../services/OptServices';
import { getItemDetails } from '../../services/ItemServices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../Loading';
import ElapsedTimeCounter from '../../utils/ElapsedTimeCounter';



const ProfilTemin = ({currentOpt,currentJobcard,isAllProfileTransferred,setIsAllProfileTransferred}) => {  
// console.log(currentJobcard?.time_logs?.at(-1).from_time)
    const [inputValues, setInputValues] = useState({});
    const queryClient = useQueryClient();

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
                disabled={currentJobcard?.status!=="Work In Progress"}
                max={rowData.amountboy}
                min={rowData.transfered}
                value={inputValues[rowData.item_code] || rowData.transfered || ''}
                onChange={(e) => handleInputChange(e, rowData.item_code)}
             
                className="p-inputtext p-component w-10 border-2 text-center border-slate-700 no-arrows" // PrimeReact input stilini kullanma
            />
        );
    };
 const {
    data: profileOptInfo,
    isLoading: isProfileTeminOptLoading,
    isError: isOptError,
    error: optError,
    refetch
} = useQuery({
    queryKey: ['profileOptInfo', currentOpt?.custom_opti_no],
    queryFn: () => getProfilTeminOptDetails(currentOpt?.custom_opti_no),
    // enabled: !!currentOpt?.custom_opti_no
});

    const { data: images, isLoading: isImageLoading } = useQuery({
        queryKey: ['productImages', profileOptInfo],
        queryFn: async () => {
            if (!profileOptInfo) return []; // Eğer optInfo yoksa boş dizi döndür

            // Her `item_code` için API isteği yap
            const uniqueItems = [...new Set(profileOptInfo?.profile_list.map(item => item.item_code))];
            const imageRequests = uniqueItems.map(async (item) => {
                const itemData = await getItemDetails(item);
                return { item, image: itemData.image };
            });

            // Promise.all ile tüm API çağrılarını bekle
            return Promise.all(imageRequests);
        },
        enabled: !!profileOptInfo // optInfo yüklendikten sonra bu sorguyu çalıştır
    });

    const { mutate } = useMutation({
        mutationFn: (profilePayload) => updateProfilList(profilePayload.name,profilePayload),
        onSuccess: () => {
            // Cache'de 'profileOptInfo' anahtarına sahip veriyi yeniden getiriyoruz
            queryClient.invalidateQueries(['profileOptInfo', currentOpt?.custom_opti_no]);
            setInputValues({}); // Input değerlerini sıfırla
            // refetch(); // Tüm veriyi yeniden çek
        },
        onError: (error) => {
            console.error("Update işlemi sırasında hata oluştu:", error);
        }
    });

    const actionTemplate = (rowData) => {
       
        return (
            <button className='disabled:text-red-400 font-bold ' disabled={rowData.amountboy==rowData.transfered} onClick={async() => {
                const profilePayload = {
                    name: rowData.name,
                    parent: rowData.parent,
                    parenttype: "ProfilTeminOpt",
                    parentfield: "profile_list",
                    transfered:inputValues[rowData.item_code]
                  };
                //   setInputValues({});
                // await updateProfilList(rowData.name,profilePayload)
               
                // refetch()
                mutate(profilePayload);
            }}><i className="pi pi-check"></i></button>
        );
    };

    useEffect(() => {
        console.log(profileOptInfo?.profile_list)
        if (profileOptInfo?.profile_list) {
            const allTransferred = profileOptInfo.profile_list.every(
                row => Number(row.amountboy) === Number(row.transfered)
            );
            setIsAllProfileTransferred(allTransferred);
            console.log(allTransferred)
        }
    }, [profileOptInfo]);

   

  
    if (isProfileTeminOptLoading || isImageLoading) return <Loading/>;
 
    return (
        <div >
        <div className='w-full flex justify-between h-[calc(100vh-100px)] px-3 py-2'>
           
            <div className="flex flex-col flex-1 bg-slate-100 w-2/3">
            <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
<h3 className='text-lg font-medium'>İstasyon : {profileOptInfo?.machine_no}</h3>
{currentJobcard&&<h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}

            </div>
                <div className='h-1/2 overflow-auto'>
                    <DataTable stripedRows size='small' value={profileOptInfo?.customer_list} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="projectno" sortable header="Proje Üretim No"></Column>
                        <Column field="customer" header="Müşteri Adı"></Column>
                        <Column field="order_no" header="Sipariş No"></Column>
                        <Column field="deliverydate" header="Sevk Tarihi"></Column>
                    </DataTable>
                </div>
                <div>
                    <DataTable stripedRows size='small' value={profileOptInfo?.profile_list} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="item_code" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>
                        <Column header="Çekilen" body={inputColumnTemplate}></Column>
                        <Column header="" body={actionTemplate}></Column>
                        
                        <Column field="amountboy" header="Miktar (Boy)"></Column>
                        <Column field="amountmt" header="Miktar (Mt)"></Column>
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
       {/* <div className=' pr-3 items-center flex justify-end bg-red-400'>
       {
            currentJobcard.status==="Work In Progress"? <ElapsedTimeCounter fromTime={currentJobcard?.time_logs?.at(-1).from_time}/>:currentJobcard.status==="On Hold"?<h2 className='font-semibold text-lg'>Durma Sebebi: {currentJobcard?.time_logs?.at(-1).custom_reason.toUpperCase()}</h2> :<h2 className='font-semibold text-lg'>Süre: 00:00:00</h2>
        }
       </div> */}
        </div>
    )
}

export default ProfilTemin
