import React, { useEffect, useState } from 'react'


import { getSacKesimOptDetails } from '../../../services/OptServices';
import { getItemDetails } from '../../../services/ItemServices';
import { useQuery } from '@tanstack/react-query';
import Loading from '../../Loading';
import CustomerInfoCard from '../../Cards/CustomerInfo';
import { getAllBarcodesOfPoz,  getTesDetayDetails, getTestDetay, updateTesDetay } from '../../../services/TesDetayServices';
import { InputText } from 'primereact/inputtext';
import { toast } from "react-toastify";



const KaynakKoseTemizleme = ({ currentOpt, currentJobcard }) => {

    
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

  
    const {
        data: tesDetayInfo,
        isLoading: isTesDetayInfoLoading,
        isError: isOptError,
        error: optError
    } = useQuery({
        queryKey: ['tesDetayInfo'],
        queryFn: () => getTestDetay(),
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
        console.log('Poz No', pozNo)
        // pozNo ile yeni bir istek yap
        const allBarcodesOfPoz = await getAllBarcodesOfPoz(pozNo, siparisNo);
        const itemDetails = await getItemDetails(siparisNo + '-' + pozNo)
        setItemDetails(itemDetails)
        // sanaladet alanındaki en yüksek rakamı bul
        const maxSanalAdet = Math.max(...allBarcodesOfPoz.map(detail => parseInt(detail.sanal_adet, 10)));
        setMaxSanalAdet(maxSanalAdet);
        console.log(barcodeDetails)
        setTesDetay(barcodeDetails)
        // setIsLoading(false)
        await updateTesDetay(barcodeDetails && barcodeDetails[0].name,

            { status: "Tamamlandı" }

        )
    };


    if (isTesDetayInfoLoading) return <Loading />;
  


    return (
        <>
       
            <InputText className='border-2 w-80 h-12 m-2' value={currentBarkod} onChange={(e) => handleBarkodChange(e)} />
            {
                currentBarkod!==undefined?<div className='w-full flex justify-between h-[calc(100vh-100px)]  px-3 py-2'>

                <div className="flex flex-col flex-1 bg-slate-100 w-1/4">
                    <div className='w-full flex justify-between items-center bg-slate-200 p-1'>
                        {/* <h3 className='text-lg font-medium'>İstasyon : {tesDetayInfo?.machine_name}</h3> */}
                        {currentJobcard && <h3 className='text-lg font-medium'>İş Kartı No : {currentJobcard?.name}</h3>}
                    </div>                  
                    <CustomerInfoCard tesDetay={tesDetay} maxSanalAdet={maxSanalAdet} itemDetails={itemDetails} />
                 
                </div>
                <div className="w-3/4 p-4 flex gap-4 justify-center bg-slate-200">
                    <img src={tesDetay&&`/files/share/${tesDetay[0]?.siparis_no+tesDetay[0]?.poz_no}.jpg`} alt="" className=' h-4/5' />
             


                </div>
            </div>:<div className="h-[600px] flex items-center justify-center">
          <img src="/logobg.jpg" className=" h-2/3" alt="" />
        </div>
            }
            
        </>

    )
}

export default KaynakKoseTemizleme
