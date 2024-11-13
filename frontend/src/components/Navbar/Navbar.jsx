import { Dropdown } from 'primereact/dropdown'
import React, { useState } from 'react'

import { FaPlayCircle, FaPowerOff } from "react-icons/fa";
import { FaRegCircleStop } from "react-icons/fa6";
import { completeJobCard, getJobCardDetails, JobCardAction } from '../../services/JobCardServices';
import Loading from '../Loading';
import { useFrappeAuth, useFrappeGetDoc, useSWRConfig } from 'frappe-react-sdk';
import Modal from '../Modal';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";


const Navbar = ({isAllProfileTransferred, currentUser, setFilters, data, setCurrentOpt, currentOpt, operations, workstations, setCurrentOperation, currentOperation, setCurrentWorkstation, currentWorkstation, currentJobcard, setCurrentJobcard,jobCardList,setIsLoading,employee }) => {
  const { mutate } = useSWRConfig();
  const [visible, setVisible] = useState(false)
  const [reason, setReason] = useState()
  const {logout}=useFrappeAuth()  
  const navigate = useNavigate();
  // Operasyon Dropdown'unda seçim yapıldığında filters güncellenir
  const handleOperationChange = (e) => {
    setCurrentOperation(e.value);  
    setCurrentOpt({})  
    setCurrentJobcard({})
    setFilters( [["operation", "=", e.value.operations]])
    };

   


  const { data: jobCard, jobCardError,isLoading: jobCardLoading, mutate:JobCardMutate } = useFrappeGetDoc("Job Card", currentJobcard?.name, "jobcarddetails");

  


  const handleOptiChange = async (e) => {
    setIsLoading(true)
    setCurrentOpt(e.value)
    const jobcardDetail = await getJobCardDetails(jobCardList?.find((item)=>item.custom_opti_no===e.value.custom_opti_no)?.name)
   await setCurrentJobcard(jobcardDetail)
    // mutate("jobcarddetails");
    setIsLoading(false)
  };




  const handlelogOut = async (e) => {
await logout()
navigate('/login')
  };
  const handleClick = async (e) => {
console.log(jobCard)
const updatedJobCard =await  JobCardAction(jobCard, employee?.name,reason)
console.log(updatedJobCard)
  setCurrentJobcard(updatedJobCard);
  // mutate("profilePayload");
mutate("jobcarddetails");
  };

  const handleComplete = async (e) => {
    currentOperation?.operations==="Profil Temin"? (await completeJobCard(currentJobcard,currentJobcard.for_quantity),
    updateProfilTeminOpt(currentOpt.name))
    :console.log(currentJobcard)
    mutate("jobcarddetails");
  };




  return (
    <div className='flex justify-between w-full gap-4'>
      <div className='w-full flex justify-start' >
        <Dropdown value={currentOperation} onChange={(e) => handleOperationChange(e)} options={operations} optionLabel="operations"
          placeholder="Operasyon Seçiniz" className="w-60 md:w-14rem border rounded" />
        <Dropdown value={currentOpt} onChange={(e) => handleOptiChange(e)} options={jobCardList?.filter(item => item.status !== "Completed")} optionLabel="custom_opti_no"
          placeholder="Opt No Seçiniz" className="w-60 md:w-20rem border rounded " />

      </div>
      <div className='w-full items-center'>
        <h2 className='w-full h-12 bg-red-400 rounded-md px-2 text-white text-center content-center '>{currentUser}</h2>

      </div>




      <div className='w-full flex items-center gap-1'>
        <div  onClick={() => jobCard?.status === "Work In Progress" ? setVisible(true) :handleClick()} className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaPlayCircle size='2rem' className='text-red-500 ' />

          <div   className='w-3/4 text-center text-xl '>  {jobCardLoading ? "Loading..." : jobCard?.status === "On Hold" ? "Devam Et" : jobCard?.status === "Work In Progress" ? "Durdur" : "Başlat"}</div>
        </div>
        <div  onClick={()=>isAllProfileTransferred?handleComplete():toast.error("Tüm profillleri aktarmanız gerekmektedir")} className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaRegCircleStop size='2rem' className='text-red-500 ' />

          <div className='w-3/4 text-center text-xl '> TAMAMLA</div>
        </div>
        <div  onClick={
                ()=>handlelogOut()
              } className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaPowerOff size='2rem' className='text-red-500 ' />

          <div className='w-3/4 text-center text-xl '> ÇIKIŞ</div>
        </div>
<Modal visible={visible} setVisible={setVisible} reason={reason} setReason={setReason} handleClick={handleClick}/>
      </div>
    </div>
  )
}

export default Navbar
