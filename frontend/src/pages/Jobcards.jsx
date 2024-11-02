import React, { useEffect, useState } from 'react'
import Navbar from '../../../../ozerpan/frontend/src/components/Navbar/Navbar'
import { getJobCards } from '../services/JobCardServices'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '../services/AuthServices'
import { getLoggedUserEmployeeDetails } from '../services/EmployeeServices'
import ProfilTemin from '../components/Stations/ProfilTemin'
import { getOptList } from '../services/OptServices'
import Loading from '../components/Loading'

const Jobcards = () => {

  const [currentUser, setCurrentUser] = useState()
  const [currentWorkstation, setCurrentWorkstation] = useState()
  const [currentOperation, setCurrentOperation] = useState()
  const [currentJobcard, setCurrentJobcard] = useState()
  const [currentOpt, setCurrentOpt] = useState()
  const [filters, setFilters] = useState([
    ["operation", "=", currentOperation || ""]
  ]);
  useEffect(() => {
    // getLoggedUserEmployeeDetails();
    fetchCurrentUser().then((currentUsr) => {
      setCurrentUser(currentUsr.message)
  });
  }, []);

  const useCombinedQuery = (filters, currentUser) => {
    return useQuery({
      queryKey: ['combinedData', filters, currentUser],
      queryFn: async () => {
        const [jobCards, employeeDetails,optList] = await Promise.all([
          getJobCards(filters, 5),
          getLoggedUserEmployeeDetails(currentUser),
          getOptList()
        ]);
        return { jobCards, employeeDetails,optList }; // Sonuçları birleştirerek döndür
      },
      enabled: !!currentUser,
   
    });
  };




  // let filters = [
  //   ["operation", "=", currentOperation?.operations||""],
  //   ["name", "=", currentJobcard]
  // ];
  
  const { isPending, isError, data, error } = useCombinedQuery(filters, currentUser)
  // const { isPending, isError, data, error } = useQuery({ queryKey: ['employeeDetails'], queryFn:()=> getLoggedUserEmployeeDetails(currentUser) })

  if (isPending || !data) {
    return <Loading/>
  }

  return (
    <div className=''>
      <Navbar
       operations={data.employeeDetails.custom_operations}
       currentWorkstation={currentWorkstation}
       setCurrentWorkstation={setCurrentWorkstation}
       currentOperation={currentOperation}
       setCurrentOperation={setCurrentOperation}
       currentJobcard={currentJobcard}
       setCurrentJobcard={setCurrentJobcard}
       setFilters={setFilters}
       currentOpt={currentOpt}
       setCurrentOpt={setCurrentOpt}
       data={data}/>
      {
        currentOperation?.operations==='Profil Temin'? <ProfilTemin currentOpt={currentOpt}/>:null
      }
      
     
    </div>
  )

}

export default Jobcards
