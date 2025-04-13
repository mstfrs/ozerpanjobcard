import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Image } from 'primereact/image';
import { getItemDetails } from '../../../services/ItemServices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../../Loading';
import { Button } from 'primereact/button';
import useJobcardsStore from '../../../store/jobcardStore';
import { getSacKesimOptDetails, updateDSTList } from '../../../services/OptServices';
import { ProgressBar } from 'primereact/progressbar';
import { completeJobCard } from '../../../services/JobCardServices';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const SacKesim = () => {
    const {
        currentOpt,
        currentJobcard,
        currentOperation,
        setIsLoading,
    } = useJobcardsStore();
    
    const toast = useRef(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const queryClient = useQueryClient();

    // Sac Kesim Opt Detayları Query
    const {
        data: sacKesimOptInfo,
        isLoading: isSacKesimOptLoading,
        isError: isOptError,
        error: optError
    } = useQuery({
        queryKey: ['sacKesimOptInfo', currentOpt?.custom_opti_no],
        queryFn: () => getSacKesimOptDetails(currentOpt?.custom_opti_no),
        enabled: !!currentOpt?.custom_opti_no,
        staleTime: 30000, // 30 saniye cache
        cacheTime: 1000 * 60 * 5, // 5 dakika cache
    });

    // Renk haritasını memoize et
    const colorMap = useMemo(() => {
        const colors = ['bg-red-200', 'bg-green-200', 'bg-yellow-200', 'bg-blue-200', 'bg-purple-200'];
        const map = {};
        let colorIndex = 0;

        sacKesimOptInfo?.dst_list?.forEach((item) => {
            if (!map[item.item_code]) {
                map[item.item_code] = colors[colorIndex % colors.length];
                colorIndex++;
            }
        });

        return map;
    }, [sacKesimOptInfo?.dst_list]);

    // Ürün Görselleri Query
    const { data: images, isLoading: isImageLoading, error: imageError } = useQuery({
        queryKey: ['productImages', sacKesimOptInfo?.dst_list],
        queryFn: async () => {
            if (!sacKesimOptInfo?.dst_list) return [];

            console.log("Fetching images for DST list:", sacKesimOptInfo.dst_list);
            const uniqueItems = [...new Set(sacKesimOptInfo.dst_list.map(item => item.item_code))];
            console.log("Unique items to fetch:", uniqueItems);
            
            const imageRequests = uniqueItems.map(async (item) => {
                try {
                    console.log(`Fetching details for item: ${item}`);
                    const itemData = await getItemDetails(item);
                    console.log(`Received data for item ${item}:`, itemData);
                    return { item, image: itemData.image };
                } catch (error) {
                    console.error(`Error fetching image for item ${item}:`, error);
                    return { item, image: null };
                }
            });

            return Promise.all(imageRequests);
        },
        enabled: !!sacKesimOptInfo?.dst_list && sacKesimOptInfo.dst_list.length > 0,
        staleTime: 1000 * 60 * 5, // 5 dakika cache
        cacheTime: 1000 * 60 * 30, // 30 dakika cache
        retry: 2,
        onError: (error) => {
            console.error("Error fetching product images:", error);
        }
    });

    // DST Listesi Güncelleme Mutation
    const { mutateAsync: updateDSTListMutation } = useMutation({
        mutationFn: (profilePayload) => updateDSTList(profilePayload.name, profilePayload),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['sacKesimOptInfo', currentOpt?.custom_opti_no], (oldData) => {
                if (!oldData) return oldData;
                const updatedDstList = oldData.dst_list.map((item) =>
                    item.name === variables.name ? { ...item, custom_status: "Tamamlandı" } : item
                );
                return { ...oldData, dst_list: updatedDstList };
            });
            toast.current.show({
                severity: 'success',
                summary: 'Başarılı',
                detail: 'İşlem tamamlandı',
                life: 3000
            });
        },
        onError: (error) => {
            console.error("Güncelleme hatası:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Hata',
                detail: 'İşlem tamamlanırken hata oluştu',
                life: 3000
            });
        },
    });

    // Event Handlers
    const onRowClick = useCallback((e) => {
        setSelectedRow(e.data);
    }, []);

    const onRowDoubleClick = useCallback(async (e) => {
        try {
            const profilePayload = {
                name: e?.name,
                parent: e?.parent,
                parenttype: "Opt Genel",
                parentfield: "dst_list",
                custom_status: "Tamamlandı",
            };
            await updateDSTListMutation(profilePayload);
        } catch (error) {
            console.error("İşlem tamamlama hatası:", error);
        }
    }, [updateDSTListMutation]);

    const handleCompleteAll = useCallback(async () => {
        try {
            setIsCompleting(true);
            setShowProgressDialog(true);
            
            const incompleteItems = sacKesimOptInfo?.dst_list.filter(y => y.custom_status !== "Tamamlandı") || [];
            const totalItems = incompleteItems.length;
            let completedItems = 0;

            for (const item of incompleteItems) {
                const profilePayload = {
                    name: item?.name,
                    parent: item?.parent,
                    parenttype: "Opt Genel",
                    parentfield: "dst_list",
                    custom_status: "Tamamlandı",
                };
                await updateDSTListMutation(profilePayload);
                completedItems++;
                setProgress(Math.round((completedItems / totalItems) * 100));
            }

            if (currentOperation?.operations === "Sac Kesim") {
                await completeJobCard(currentJobcard, currentJobcard.for_quantity);
            }
        } catch (error) {
            console.error("Toplu tamamlama hatası:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Hata',
                detail: 'Toplu tamamlama sırasında hata oluştu',
                life: 3000
            });
        } finally {
            setIsCompleting(false);
            setShowProgressDialog(false);
        }
    }, [sacKesimOptInfo?.dst_list, currentOperation, currentJobcard, updateDSTListMutation]);

    // Template Functions
    const actionTemplate = useCallback((rowData) => {
        return (
            <button 
                className='disabled:text-gray-400 font-bold' 
                disabled={currentJobcard?.status !== "Work In Progress"}
                onClick={() => onRowDoubleClick(rowData)}
            >
                Tamamla
            </button>
        );
    }, [currentJobcard?.status, onRowDoubleClick]);

    const rowClassName = useCallback((rowData) => {
        if (rowData === selectedRow) {
            return 'bg-black text-white';
        }
        if (rowData.custom_status === 'Tamamlandı') {
            return 'bg-green-600';
        }
        return colorMap[rowData.item_code];
    }, [selectedRow, colorMap]);

    if (isSacKesimOptLoading || isImageLoading) return <Loading />;
    if (isOptError) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Veri yüklenirken bir hata oluştu: {optError?.message}
            </div>
        );
    }

    return (
        <div className='w-full flex justify-between h-[calc(100vh-100px)] px-3 py-2'>
            <Toast ref={toast} />
            <div className="flex flex-col flex-1 bg-slate-100 w-2/3">
                <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
                    <h3 className='text-lg font-medium'>İstasyon : {sacKesimOptInfo?.machine_no}</h3>
                    <Button 
                        onClick={handleCompleteAll} 
                        disabled={currentJobcard?.status !== "Work In Progress" || isCompleting}
                        label="Toplu Bitir" 
                        icon="pi pi-complete" 
                        className="bg-red-400 p-button-raised p-button-rounded p-button-text px-2 py-1" 
                    />
                    {currentJobcard && (
                        <h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>
                    )}
                </div>

                <Dialog 
                    className="w-1/2" 
                    header="Tamamlanıyor" 
                    visible={showProgressDialog} 
                    modal 
                    onHide={() => setShowProgressDialog(false)}
                    closable={false}
                >
                    <ProgressBar value={progress} />
                </Dialog>

                <div className='overflow-auto'>
                    <DataTable 
                        onRowClick={onRowClick}
                        onRowDoubleClick={onRowDoubleClick}
                        rowClassName={rowClassName} 
                        stripedRows 
                        size='small' 
                        value={sacKesimOptInfo?.dst_list} 
                        tableStyle={{ minWidth: '50rem' }}
                    >
                        <Column field="item_code" sortable header="Ürün No"></Column>
                        <Column field="item_name" header="Ürün Adı"></Column>
                        <Column header="" body={actionTemplate}></Column>
                        <Column field="quantity" header="Adet"></Column>
                        <Column field="size" header="Ölçü"></Column>
                    </DataTable>
                </div>
            </div>
            <div className="w-1/3 bg-slate-200 rounded-lg p-4">
                <div className="h-[calc(100vh-200px)] overflow-y-auto">
                    {imageError && (
                        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">
                            <h3 className="font-bold">Görsel yüklenirken hata oluştu:</h3>
                            <p>{imageError.message}</p>
                        </div>
                    )}
                    
                    {images && images.length === 0 && !isImageLoading && (
                        <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg">
                            <p>Görsel bulunamadı veya yüklenemedi.</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        {images?.map((img, index) => (
                            img.image ? (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white">
                                    <img 
                                        src={img.image} 
                                        alt={`Ürün ${img.item}`}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        onError={(e) => {
                                            console.error(`Image load error for ${img.item}`);
                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle'%3EResim Yok%3C/text%3E%3C/svg%3E";
                                        }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1">
                                        {img.item}
                                    </div>
                                </div>
                            ) : (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs text-center">
                                        {img.item} - Görsel Yok
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SacKesim;
