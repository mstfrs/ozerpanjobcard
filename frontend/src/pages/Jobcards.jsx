import { useEffect, useRef } from "react";
import ProfilTemin from "../components/Stations/ProfilTemin/ProfilTemin";
import SacKesim from "../components/Stations/SacKesim/SacKesim";
import OrtaKayit from "../components/Stations/OrtaKayit/OrtaKayit";
import KanatHazirlik from "../components/Stations/KanatHazırlık/KanatHazirlik";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar/Navbar";
import ElapsedTimeCounter from "../utils/ElapsedTimeCounter";
import useJobcardsStore from "../store/jobcardStore";
import { fetchCurrentUser } from "../services/AuthServices";
import { getLoggedUserEmployeeDetails } from "../services/EmployeeServices";
import { getJobCards } from "../services/JobCardServices";
import KanatBaglama from "../components/Stations/KanatBaglama/KanatBaglama";
import KaynakKose from "../components/Stations/KaynakKoseTemizleme/KaynakKose";
import Cita from "../components/Stations/Cita/Cita";
import Kalite from "../components/Stations/Kalite/Kalite";
import Cam from '../components/Stations/Cam/Cam';
import SurmeHazirlama from "../components/Stations/SurmeHazirlama/SurmeHazirlama";
import SurmeBaglama from "../components/Stations/SurmeBaglama/SurmeBaglama";
import SuperKesim from "../components/Stations/SuperKesim/SuperKesim";
import Sevkiyat from "../components/Stations/Sevkiyat/Sevkiyat";
import PVCSevkiyat from "../components/Stations/Sevkiyat/PVCSevkiyat";
import CamSevkiyat from "../components/Stations/Sevkiyat/CamSevkiyat";

const Jobcards = () => {
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
  } = useJobcardsStore();

  useEffect(() => {
    fetchCurrentUser().then((currentUsr) => {
      setCurrentUser(currentUsr.message);
    });

    getLoggedUserEmployeeDetails(currentUser).then((employee) => {
      setEmployee(employee);
    });
  }, [currentUser]);

  // Use refs to track previous values and prevent unnecessary API calls
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevCurrentOptRef = useRef(JSON.stringify(currentOpt));
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Serialize current values for comparison
    const currentFiltersStr = JSON.stringify(filters);
    const currentOptStr = JSON.stringify(currentOpt);
    
    // Check if values actually changed
    const filtersChanged = prevFiltersRef.current !== currentFiltersStr;
    const currentOptChanged = prevCurrentOptRef.current !== currentOptStr;
    
    // If nothing changed or already fetching, skip
    if ((!filtersChanged && !currentOptChanged) || isFetchingRef.current) {
      return;
    }
    
    // Update refs
    prevFiltersRef.current = currentFiltersStr;
    prevCurrentOptRef.current = currentOptStr;
    
    // Set fetching flag
    isFetchingRef.current = true;
    
    // Only fetch if filters exist and are not empty
    if (filters && filters.length > 0) {
      getJobCards(filters, 5)
        .then((list) => {
      setJobCardList(list);
        })
        .catch((error) => {
          console.error("Error fetching job cards:", error);
        })
        .finally(() => {
          isFetchingRef.current = false;
        });
    } else {
      isFetchingRef.current = false;
    }
  }, [filters, currentOpt, setJobCardList]);

  // useEffect(() => {
  //   getTesDetayDetails(currentOpt).then((list) => {
  //     setTesDetayList(list);
  //   });
  // }, [currentOpt]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="h-dvh flex flex-col bg-slate-200 ">
      <Navbar />
      {currentOperation?.operations === "Profil Temin" ? (
        <ProfilTemin />
      ) : currentOperation?.operations === "Sac Kesim" ? (
        <SacKesim />
      ) : currentOperation?.operations === "Kaynak Köşe Temizleme" ? (
        <KaynakKose />
      ) : currentOperation?.operations === "Orta Kayıt" ? (
        <OrtaKayit />
      ) : currentOperation?.operations === "Kanat Hazırlık" ? (
        <KanatHazirlik />
      ) : currentOperation?.operations === "Kanat Bağlama" ? (
        <KanatBaglama />
      ) : currentOperation?.operations === "Çıta" ? (
        <Cita />
      ) : currentOperation?.operations === "Kalite" ? (
        <Kalite />
      ) : currentOperation?.operations === "Cam" ? (
        <Cam />
      ) : currentOperation?.operations === "Sürme Hazırlık" ? (
        <SurmeHazirlama />
      ) : currentOperation?.operations === "Sürme Bağlama" ? (
        <SurmeBaglama />
      ) : currentOperation?.operations === "Cam Sevkiyat" ? (
        <CamSevkiyat />
         ) : currentOperation?.operations === "PVC Sevkiyat" ? (
        <PVCSevkiyat />
      ) : currentOperation?.operations === "Süper Kesim" ? (
        <SuperKesim />
      ) : (
        <div className="h-full w-1/3 flex mx-auto items-center justify-center">
          <img src="/files/logobg.png" className="mx-auto" alt="" />
        </div>
      )}

      {/* <div className=" pr-3 items-center flex justify-end bg-red-400">
        {currentJobcard?.status === "Work In Progress" ? (
          <ElapsedTimeCounter
            fromTime={currentJobcard?.time_logs?.at(-1).from_time}
          />
        ) : currentJobcard?.status === "On Hold" ? (
          <h2 className="font-semibold text-lg">
            Durma Sebebi:
            {currentJobcard?.time_logs?.length > 0 &&
              (currentJobcard?.time_logs
                ?.at(-1)
                ?.custom_reason?.toUpperCase() ||
                "")}
          </h2>
        ) : (
          <h2 className="font-semibold text-lg">Süre: 00:00:00</h2>
        )}
      </div> */}
    </div>
  );
};

export default Jobcards;
