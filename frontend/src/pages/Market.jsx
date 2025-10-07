import React, { useEffect, useState } from 'react'
import useJobcardsStore from '../store/jobcardStore';
import { fetchCurrentUser } from '../services/AuthServices';
import { getLoggedUserEmployeeDetails } from '../services/EmployeeServices';
import { getJobCards } from '../services/JobCardServices';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import MarketNavbar from '../components/Navbar/MarketNavbar';
import MarketSidebar from '../components/Navbar/MarketSidebar';
const Market = () => {
  const [pozBomData, setPozBomData] = useState({})
  const {
    currentUser,
    currentOperation,
    currentJobcard,
    isLoading,
    filters,
    setCurrentUser,
    currentOpt,
    setJobCardList,
    setEmployee,
    currentSelectedJobCard,
  } = useJobcardsStore();
  console.log(currentSelectedJobCard)
  useEffect(() => {
    fetchCurrentUser().then((currentUsr) => {
      setCurrentUser(currentUsr.message);
    });

    getLoggedUserEmployeeDetails(currentUser).then((employee) => {
      setEmployee(employee);
    });
  }, [currentUser]);
  useEffect(() => {
    getJobCards(filters, 5).then((list) => {
      setJobCardList(list);
    });
  }, [filters,currentOpt]);
  return (
    <div className='flex flex-col overflow-hidden'>
      <MarketNavbar/>
      <div className='flex'>
      <div className='w-1/4 bg-slate-400 h-dvh'>
      <MarketSidebar setPozBomData={setPozBomData}/>
      </div>
     
      <div className="card overflow-y-auto max-h-svh w-full text-sm">
  
      {currentJobcard && (
                <h3 className="text-lg font-medium">
                  İş Kartı No : {currentSelectedJobCard?.name}
                </h3>
              )}
            <DataTable value={pozBomData?.bom_items} className='text-sm'>
                <Column field="item_code" header="Ürün Kodu"></Column>
                <Column field="item_name" header="Ürün Adı"></Column>
                <Column field="qty" header="Miktar"></Column>
            </DataTable>
        </div>      </div>
     
      </div>
  )
}

export default Market