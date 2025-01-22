import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React from 'react'

const Modal = ({visible,setVisible,setReason,reason,handleClick}) => {
    const show = () => {
        setVisible(false);
    };

    const footerContent = (
        <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
            <Button label="İptal Et" icon="pi pi-times" onClick={() => setVisible(false)} className="inline-flex items-center justify-center py-1 gap-1 font-medium rounded-lg border transition-colors outline-none focus:ring-offset-2 focus:ring-2 focus:ring-inset dark:focus:ring-offset-0 min-h-[2.25rem] px-4 text-sm text-gray-800 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-600 focus:text-primary-600 focus:bg-primary-50 focus:border-primary-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-200 dark:focus:text-primary-400 dark:focus:border-primary-400 dark:focus:bg-gray-800" />
            <Button label="Onayla" icon="pi pi-check" onClick={()=>(handleClick(),setVisible(false))} autoFocus className="inline-flex items-center justify-center py-1 gap-1 font-medium rounded-lg border transition-colors outline-none focus:ring-offset-2 focus:ring-2 focus:ring-inset dark:focus:ring-offset-0 min-h-[2.25rem] px-4 text-sm text-white shadow focus:ring-white border-transparent bg-red-600 hover:bg-red-500 focus:bg-red-700 focus:ring-offset-red-700"/>
        </div>
    );
  return (

    <Dialog header='Durdurma Sebebi Seçiniz'  visible={visible} position="top" style={{ width: '40vw' }} onHide={() => {if (!visible) return; setVisible(false); }}  draggable={false} resizable={false} footer={footerContent}>

    
       

        <div className="space-y-2">
          <div aria-hidden="true" className=" dark:border-gray-700 px-2">
            <div className="mt-2">
              {/* <label htmlFor="reason" className="block mb-2 text-lg font-medium text-gray-900 dark:text-gray-400">Durdurma Sebebi Seçiniz</label> */}
              <select id="reason" name="reason"  value={reason} onChange={(e)=>setReason(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                <option value="" selected disabled>Sebep Seçin</option>
                <option value="wc">WC</option>
                <option value="paydos">Paydos</option>
                <option value="yemek">Yemek</option>
                <option value="sigara">Sigara</option>
              </select>
            </div>
          </div>

         
        </div>
    
  
</Dialog>
 
  )
}

export default Modal
