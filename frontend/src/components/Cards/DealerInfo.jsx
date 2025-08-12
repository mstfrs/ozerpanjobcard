import React from 'react'
import { FiMapPin } from "react-icons/fi";
import { FaPhone } from "react-icons/fa";

const DealerInfo = ( {dealer} ) => {
    return (
        <div
            className=" flex  flex-col items-center w-full mx-1 gap-1 py-8 px-8 max-w-sm bg-white rounded-xl shadow-lg space-y-2 sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-6">
           <div className='flex flex-row gap-4 items-center'>
           <div>
                <img className="block mx-auto h-24 rounded-full sm:mx-0 sm:shrink-0" src={dealer?.customer?.image} alt="Woman's Face" />
            </div>
            <div className="space-y-2 sm:text-left">
                <div className="space-y-0.5">
                    <p className="text-lg text-black font-semibold">
                        {dealer?.customer?.customer_name}
                    </p>
                    <p className="text-slate-500 font-semibold">
                        Bayi kodu: <span className='text-red-500 uppercase'>{dealer?.customer?.custom_current_code}</span>
                    </p>
                </div>

            </div>
           </div>
           <div className='flex flex-col gap-1'>
            <span className='text-sm text-gray-500 capitalize '><FiMapPin className='inline-block mr-2' />{dealer?.primary_address?.address_line1} ,{dealer?.primary_address?.address_line2} - {dealer?.primary_address?.city}</span>
            <span className='text-sm text-gray-500'><FaPhone className='inline-block mr-2' />{dealer?.primary_address?.phone}</span>
           </div>
           
        </div>
    )
}

export default DealerInfo

