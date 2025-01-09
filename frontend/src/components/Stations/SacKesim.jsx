import React, { useEffect, useState } from 'react'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getSacKesimOptDetails, updateDSTList } from '../../services/OptServices';
import { getItemDetails } from '../../services/ItemServices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../Loading';



const SacKesim = ({ currentOpt, currentJobcard }) => {


    const [inputValues, setInputValues] = useState({});
    const [selectedRow, setSelectedRow] = useState(null);
    const queryClient = useQueryClient(); // queryClient burada tanımlanıyor



    const colorMap = {};
    const colors = ['bg-red-200', 'bg-green-200', 'bg-yellow-200', 'bg-blue-200', 'bg-purple-200']; // Tailwind renkleri
    let colorIndex = 0;

    //** To Change CSS style when click on the completed row */
    const onRowClick = (e) => {
        setSelectedRow(e.data);
    };
    //** To Change CSS style when click on the completed row */

    const { mutate: updateDSTListMutation } = useMutation({
        mutationFn: (profilePayload) => updateDSTList(profilePayload.name, profilePayload),
        onSuccess: (data, variables) => {
            // Güncelleme başarılı olduğunda, cache'i güncelle
            queryClient.setQueryData(['sacKesimOptInfo', currentOpt?.custom_opti_no], (oldData) => {
                const updatedDstList = oldData?.dst_list.map((item) =>
                    item.name === variables.name ? { ...item, status: "Tamamlandı" } : item
                );
                return { ...oldData, dst_list: updatedDstList };
            });
        },
        onError: (error) => {
            console.error("Güncelleme sırasında hata oluştu:", error);
        },
    });

    const onRowDoubleClick = (e) => {
        const profilePayload = {
            name: e.data.name,
            parent: e.data.parent,
            parenttype: "Opt Genel",
            parentfield: "dst_list",
            status: "Tamamlandı",
        };
        updateDSTListMutation(profilePayload);
    };

    

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
        queryKey: ['productImages', currentOpt?.custom_opti_no],
        queryFn: async () => {
            if (!sacKesimOptInfo) return []; // Eğer optInfo yoksa boş dizi döndür

            // Her `item_no` için API isteği yap
            const uniqueItems = [...new Set(sacKesimOptInfo?.dst_list.map(item => item.item_code))];

            const imageRequests = uniqueItems.map(async (item) => {
                const itemData = await getItemDetails(item);
                return { item, image: itemData.image };
            });
            // Promise.all ile tüm API çağrılarını bekle
            return Promise.all(imageRequests);
        },
        enabled: !!sacKesimOptInfo, // optInfo yüklendikten sonra bu sorguyu çalıştır
        staleTime: Infinity, // Sorguyu her zaman taze tut, yeniden veri çekme
    cacheTime: Infinity, // Cache süresini sonsuza ayarla
    });



    sacKesimOptInfo?.dst_list?.forEach((item) => {
        if (!colorMap[item.item_code]) {
            // Eğer ürün numarası için renk atanmadıysa bir renk ata
            colorMap[item.item_code] = colors[colorIndex % colors.length];
            colorIndex++;
        }
    });

    const rowClassName = (rowData) => {
        if (rowData === selectedRow) {
            return 'bg-black text-white';
        }
        else if (rowData.status === 'Tamamlandı') {
            return 'bg-green-600'; // Eğer işlem tamamlandıysa yeşil renk
        }
        return colorMap[rowData.item_code]; // Ürün numarasına göre renk döndür
    };
    // if (isSacKesimOptLoading || isImageLoading) return <Loading />;

    return (
        <div className='w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2'>

            <div className="flex flex-col flex-1 bg-slate-100 w-2/3">
                <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
                    <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_no}</h3>
                    {currentJobcard && <h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}
                </div>

                <div className='overflow-auto'>
                    <DataTable onRowClick={onRowClick}
                        onRowDoubleClick={onRowDoubleClick}

                        rowClassName={rowClassName} stripedRows size='small' value={sacKesimOptInfo?.dst_list} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="item_code" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>
                        <Column field="quantity" header="Adet"></Column>
                        <Column field="size" header="Ölçü"></Column>
                    </DataTable>
                </div>
            </div>
            <div className="w-1/3 p-4 grid grid-cols-2 gap-4 justify-center bg-slate-200">
                {
                    images?.map((img, index) => (
                        img.image && <img key={index} src={img.image} alt="" className='w-60 h-60' />
                    ))
                }


            </div>
        </div>
    )
}

export default SacKesim
