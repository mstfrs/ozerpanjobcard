import React, { useEffect, useState } from "react";
import { getJobCardDetails, getJobCards } from "../services/JobCardServices";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/AuthServices";
import { getLoggedUserEmployeeDetails } from "../services/EmployeeServices";
import ProfilTemin from "../components/Stations/ProfilTemin";
import { getProfilTeminOptList } from "../services/OptServices";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar/Navbar";
import SacKesim from "../components/Stations/SacKesim";
import ElapsedTimeCounter from "../utils/ElapsedTimeCounter";
import KaynakKoseTemizleme from "../components/Stations/KaynakKoseTemizleme";

const Jobcards = () => {
  const [currentUser, setCurrentUser] = useState();
  const [currentWorkstation, setCurrentWorkstation] = useState();
  const [currentOperation, setCurrentOperation] = useState();
  const [currentJobcard, setCurrentJobcard] = useState();
  const [currentOpt, setCurrentOpt] = useState();
  const [jobCardList, setjobCardList] = useState();
  const [employee, setEmployee] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isAllProfileTransferred, setIsAllProfileTransferred] = useState(false); // Yeni state tanımlaması

  const [filters, setFilters] = useState([]);
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
      setjobCardList(list);
    });
  }, [filters]);

  if (isLoading) {
    return <Loading />;
  }
  return (
    <div className="">
      <Navbar
        operations={employee?.custom_operations}
        currentWorkstation={currentWorkstation}
        setCurrentWorkstation={setCurrentWorkstation}
        currentOperation={currentOperation}
        setCurrentOperation={setCurrentOperation}
        currentJobcard={currentJobcard}
        setCurrentJobcard={setCurrentJobcard}
        setFilters={setFilters}
        currentOpt={currentOpt}
        setCurrentOpt={setCurrentOpt}
        setIsLoading={setIsLoading}
        currentUser={currentUser}
        jobCardList={jobCardList}
        employee={employee}
        isAllProfileTransferred={isAllProfileTransferred}
      />
      {currentOperation?.operations === "Profil Temin" ? (
        <ProfilTemin
          isAllProfileTransferred={isAllProfileTransferred}
          setIsAllProfileTransferred={setIsAllProfileTransferred}
          currentOpt={currentOpt}
          currentJobcard={currentJobcard}
        />
      ) : currentOperation?.operations === "Sac Kesim" ? (
        <SacKesim currentOpt={currentOpt} currentJobcard={currentJobcard} />
      ) :
      currentOperation?.operations === "Kaynak Köşe Temizleme" ? (
        <KaynakKoseTemizleme currentOpt={currentOpt} currentJobcard={currentJobcard} />
      ): (
        <div className="h-[600px] flex items-center justify-center">
          {" "}
          <img src="/logobg.jpg" className=" h-2/3" alt="" />{" "}
        </div>
      )}

      <div className=" pr-3 items-center flex justify-end bg-red-400">
        {currentJobcard?.status === "Work In Progress" ? (
          <ElapsedTimeCounter
            fromTime={currentJobcard?.time_logs?.at(-1).from_time}
          />
        ) : currentJobcard?.status === "On Hold" ? (
          <h2 className="font-semibold text-lg">
            Durma Sebebi:{" "}
            {currentJobcard?.time_logs?.at(-1).custom_reason.toUpperCase()}
          </h2>
        ) : (
          <h2 className="font-semibold text-lg">Süre: 00:00:00</h2>
        )}
      </div>
    </div>
  );
};

export default Jobcards;
