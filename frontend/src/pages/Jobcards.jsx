import { useEffect } from "react";
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

const Jobcards = () => {
  const {
    currentUser,
    currentOperation,
    currentJobcard,
    isLoading,
    filters,
    setCurrentUser,

    setJobCardList,
    setEmployee,
  } = useJobcardsStore();
  console.log(currentJobcard);

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
  }, [filters]);

  // useEffect(() => {
  //   getTesDetayDetails(currentOpt).then((list) => {
  //     setTesDetayList(list);
  //   });
  // }, [currentOpt]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="h-dvh flex flex-col justify-between">
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
      ) : (
        <div className="h-1/4 w-1/3 flex mx-auto items-center justify-center">
          <img src="/logobg.jpg" className="mx-auto" alt="" />
        </div>
      )}

      <div className=" pr-3 items-center flex justify-end bg-red-400">
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
      </div>
    </div>
  );
};

export default Jobcards;
