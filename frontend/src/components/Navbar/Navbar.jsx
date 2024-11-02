import { Dropdown } from 'primereact/dropdown'
import React, { useState } from 'react'

import { FaPlayCircle, FaPowerOff } from "react-icons/fa";
import { FaRegCircleStop } from "react-icons/fa6";

const Navbar = ({ operations, workstations, setCurrentOperation, currentOperation, setCurrentWorkstation, currentWorkstation }) => {
  console.log(workstations)
  console.log(operations)
 
  return (
    <div className='flex justify-between w-full gap-4'>
      <div className='w-full flex justify-start' >
        <Dropdown value={currentWorkstation} onChange={(e) => setCurrentWorkstation(e.value)} options={workstations} optionLabel="workstation"
          placeholder="İstasyon Seçiniz" className="w-60 md:w-20rem border rounded " />
        <Dropdown value={currentOperation} onChange={(e) => setCurrentOperation(e.value)} options={operations} optionLabel="operations"
          placeholder="Operasyon Seçiniz" className="w-60 md:w-14rem border rounded" />
      </div>
    <div className='w-full items-center'>
    <input className='w-full h-12 bg-gray-200 rounded-md'></input>

    </div>




      <div className='w-full flex items-center gap-1'>
        <div className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaPlayCircle  size='2rem' className='text-red-500 ' />

        <div className='w-3/4 text-center text-xl '> BAŞLAT</div>
        </div>
        <div className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaRegCircleStop  size='2rem' className='text-red-500 ' />

        <div className='w-3/4 text-center text-xl '> TAMAMLA</div>
        </div>
        <div className='flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200'>
          <FaPowerOff size='2rem' className='text-red-500 ' />

        <div className='w-3/4 text-center text-xl '> ÇIKIŞ</div>
        </div>
        {/* <Radio.Group size='large' danger onChange={(e) => setSize(e.target.value)}>
          <Button icon={<PlayCircleOutlined size='large' />} danger value="large" size='large'>BAŞLAT</Button>
          <Button icon={<PauseCircleOutlined size='large' />} danger size='large' value="default">TAMAMLA</Button>
          <Button icon={<PoweroffOutlined size='large' />} danger size='large' value="small">ÇIKIŞ</Button>
        </Radio.Group> */}
      </div>
    </div>
  )
}

export default Navbar
