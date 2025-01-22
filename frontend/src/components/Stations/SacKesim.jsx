import React, { useEffect, useState } from 'react'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getItemDetails } from '../../services/ItemServices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../Loading';
import { Button } from 'primereact/button';
import useJobcardsStore from '../../store/jobcardStore';
import { getSacKesimOptDetails, updateDSTList } from '../../services/OptServices';
import { ProgressBar } from 'primereact/progressbar';
import { completeJobCard } from '../../services/JobCardServices';
import { Dialog } from 'primereact/dialog';


const SacKesim = () => {
    const {
        currentOpt,
        currentJobcard,
        currentOperation,
        setIsLoading,
    } = useJobcardsStore();
    
  
    const [inputValues, setInputValues] = useState({});
    const [selectedRow, setSelectedRow] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);



    const queryClient = useQueryClient(); // queryClient burada tanımlanıyor

    const colorMap = {};
    const colors = ['bg-red-200', 'bg-green-200', 'bg-yellow-200', 'bg-blue-200', 'bg-purple-200']; // Tailwind renkleri
    let colorIndex = 0;

    //** To Change CSS style when click on the completed row */
    const onRowClick = (e) => {
        setSelectedRow(e.data);
    };
    //** To Change CSS style when click on the completed row */

    const { mutateAsync: updateDSTListMutation } = useMutation({
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
            name: e?.name,
            parent: e?.parent,
            parenttype: "Opt Genel",
            parentfield: "dst_list",
            status: "Tamamlandı",
        };
        updateDSTListMutation(profilePayload);
    };

    const handleCompleteAll = async () => {
        setIsCompleting(true);
        setShowProgressDialog(true);
        const totalItems = sacKesimOptInfo?.dst_list.filter(y => y.status !== "Tamamlandı").length || 0;
        let completedItems = 0;
    
        for (const item of sacKesimOptInfo?.dst_list.filter(y => y.status !== "Tamamlandı") || []) {
          const profilePayload = {
            name: item?.name,
            parent: item?.parent,
            parenttype: "Opt Genel",
            parentfield: "dst_list",
            status: "Tamamlandı",
          };
          await updateDSTListMutation(profilePayload);
          completedItems++;
          setProgress(Math.round((completedItems / totalItems) * 100));
        }
        // handleComplete();
        setIsCompleting(false);
        setShowProgressDialog(false);
      };

    const actionTemplate = (rowData) => {
        return (
            <button className='disabled:text-gray-400 font-bold ' disabled={currentJobcard?.status !== "Work In Progress"}
                onClick={() => onRowDoubleClick(rowData)}>Tamamla</button>
        );
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

      const handleComplete = async (e) => {
        if (currentOperation?.operations === "Sac Kesim") {
          await completeJobCard(currentJobcard, currentJobcard.for_quantity);
        //   updateProfilTeminOpt(currentOpt.name);
        } else {
          console.log(currentJobcard);
        }
        // mutate("jobcarddetails");
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

    if (isSacKesimOptLoading || isImageLoading) return <Loading />;

    return (
        <div className='w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2'>
            <div className="flex flex-col flex-1 bg-slate-100 w-2/3">
                <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
                    <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_no}</h3>
                    <Button onClick={handleCompleteAll} disabled={currentJobcard?.status !== "Work In Progress"} label="Toplu Bitir" icon="pi pi-complete" className="bg-red-400 p-button-raised p-button-rounded p-button-text px-2 py-1" />
                    {currentJobcard && <h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}
                </div>
                {/* {isCompleting && <ProgressBar className='p-2 h-32' value={progress} />} */}

                
                <Dialog className="w-1/2" header="Tamamlanıyor" visible={showProgressDialog} modal onHide={() => setShowProgressDialog(false)}>
        <ProgressBar value={progress} />
      </Dialog>

                <div className='overflow-auto'>
                    <DataTable onRowClick={onRowClick}
                        onRowDoubleClick={onRowDoubleClick}
                        rowClassName={rowClassName} stripedRows size='small' value={sacKesimOptInfo?.dst_list} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="item_code" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>
                        <Column header="" body={actionTemplate}></Column>
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
