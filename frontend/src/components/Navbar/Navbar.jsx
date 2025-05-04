import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { FaPlayCircle, FaPowerOff } from "react-icons/fa";
import { FaRegCircleStop } from "react-icons/fa6";
import { BiSolidError } from "react-icons/bi";

import {
  completeJobCard,
  getJobCardDetails,
  JobCardAction,
  updateJobCard,
} from "../../services/JobCardServices";
import {
  useFrappeAuth,
  useFrappeGetDoc,
  useSWRConfig,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import Modal from "../Modal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useJobcardsStore from "../../store/jobcardStore";
import ReportErrorDropdown from "../ReportErrorDropdown";
import ErrorModal from "../ErrorModal";
import { completeSuperKesim } from "../../services/SuperKesimServices";
import { useQueryClient } from "@tanstack/react-query";

const Navbar = () => {
  const {
    setCurrentBarkod,
    isAllProfileTransferred,
    currentUser,
    setFilters,
    setCurrentOpt,
    currentOpt,
    setCurrentOperation,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
    jobCardList,
    setIsLoading,
    employee,
    isAllSelected,
    errorModalVisible,
    setErrorModalVisible,
    setCurrentJobcardStatus,
    currentJobcardStatus,
  } = useJobcardsStore();

  const { mutate } = useSWRConfig();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState();
  const { logout } = useFrappeAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleOperationChange = (e) => {
    setCurrentOperation(e.value);
    setCurrentOpt({});
    setCurrentJobcard({});
    setCurrentJobcardStatus();
    setFilters([["operation", "=", e.value.operations]]);
 
  };

  const {
    data: jobCard,
    isLoading: jobCardLoading,
    mutate: JobCardMutate,
  } = useFrappeGetDoc("Job Card", currentJobcard?.name, "jobcarddetails");

  const handleOptiChange = async (e) => {
    setIsLoading(true);
    console.log(e.value.custom_opti_no);
    setCurrentOpt(e.value);
    setCurrentJobcardStatus(
      jobCardList?.find(
        (item) => item.custom_opti_no === e.value.custom_opti_no
      )?.status
    );
    console.log("currentJobcardStatus", jobCardList?.find(
      (item) => item.custom_opti_no === e.value.custom_opti_no
    ));

    // Create an array of job card names
    const jobCardNames = jobCardList
      ?.filter((item) => item.custom_opti_no === e.value.custom_opti_no)
      .map((item) => item.name);

    console.log("Job Card Names:", jobCardNames);

    await setCurrentJobcard(jobCardNames);
    setIsLoading(false);
  };

  const handlelogOut = async (e) => {
    try {
      // Only pause the job card if there's an active one in "Work In Progress" status
      if (
        currentJobcard?.name &&
        currentJobcard?.status === "Work In Progress"
      ) {
        console.log("Pausing job card before logout:", currentJobcard.name);

        // Use JobCardAction to pause the job card with "Paydos" as reason
        await JobCardAction(currentJobcard, employee, "Paydos");

        toast.info("İş kartı duraklatıldı: Paydos");
      }

      // Then logout as usual
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Çıkış yaparken bir hata oluştu");

      // Still attempt to logout even if pausing the job card fails
      await logout();
      navigate("/login");
    }
  };

  const handleClick = async (e) => {
   
    const status =
      currentJobcardStatus === "Open" || currentJobcardStatus === "On Hold"
        ? "Work In Progress"
        : "On Hold";
    setCurrentJobcardStatus(status);
    console.log("status", status);
    await updateJobCard({
      job_cards: currentJobcard,
      employee: employee?.name,
      operation: currentOperation?.operations,
      reason: reason,
      status: status,
    });
   
  };

  const handleComplete = async (e) => {
    if (currentOperation?.operations === "Profil Temin" || currentOperation?.operations === "Sac Kesim") {
      await updateJobCard({
        job_cards: currentJobcard,
        employee: employee?.name,
        operation: currentOperation?.operations,
        reason: reason,
        status: "Completed",
      });
     
    } else if (currentOperation?.operations === "Süper Kesim") {
      try {
        console.log(currentOpt);
        // Get the opt_no from the current job card
        const optNo = currentOpt?.custom_opti_no;
        if (!optNo) {
          toast.error("Opt No bulunamadı!");
          return;
        }

        // Update the Super Kesim record status
        await completeSuperKesim(optNo);
        await setCurrentOpt(null);

        // Invalidate both queries to refresh the data
        queryClient.invalidateQueries(["allSuperKesimRecords"]);
        queryClient.invalidateQueries(["superKesimInfo"]);

        toast.success("Süper Kesim kaydı başarıyla güncellendi");
      } catch (error) {
        console.error("Super Kesim güncelleme hatası:", error);
        toast.error("Süper Kesim kaydı güncellenirken hata oluştu");
      }
    }
    mutate("jobcarddetails");
  };

  return (
    <div className="flex justify-between w-full gap-4">
      <div className="w-full flex justify-start">
        <Dropdown
          value={currentOperation}
          onChange={(e) => handleOperationChange(e)}
          options={employee?.custom_operations}
          optionLabel="operations"
          placeholder="Operasyon Seçiniz"
          className="w-60 md:w-14rem border rounded"
        />
        {
          currentOperation?.operations === "Profil Temin" ||
          currentOperation?.operations === "Sac Kesim" ? (
            <Dropdown
              value={currentOpt}
              onChange={(e) => handleOptiChange(e)}
              options={Array.from(
                new Set(
                  jobCardList
                    ?.filter(item => item.status !== "Completed" && item.operation === currentOperation?.operations)
                    .map(item => item.custom_opti_no)
                    .filter(Boolean)
                )
              ).map(optiNo => ({
                label: `Opt No: ${optiNo}`,
                custom_opti_no: optiNo
              }))}
              optionLabel="custom_opti_no"
              placeholder="Opt No Seçiniz"
              className="w-60 md:w-20rem border rounded "
            />
          ) : null
          // <InputText value={currentBarkod} onChange={(e) => handleBarkodChange(e)} />
        }
      </div>
      <div className="w-full items-center">
        <h2 className="w-full h-12 bg-red-400 rounded-md px-2 text-white text-center content-center ">
          {currentUser}
        </h2>
      </div>

      <div className="w-full flex items-center gap-1">
        {(currentOperation?.operations === "Kalite" ||
          currentOperation?.operations === "Cam") && (
          <div
            aria-disabled={isAllSelected}
            onClick={() => {
              if (!isAllSelected) {
                if (currentOperation?.operations === "Cam") {
                  document
                    .querySelector('[data-testid="error-modal-trigger"]')
                    ?.click();
                } else {
                  setErrorModalVisible(true);
                }
              }
            }}
            className={`flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer ${
              isAllSelected
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-red-200"
            }`}
          >
            <BiSolidError size="3rem" className="text-yellow-400 " />
            <div className="w-3/4 text-center text-xl ">Hata</div>
          </div>
        )}

        {currentOperation?.operations !== "Cam" &&
          currentOperation?.operations !== "Süper Kesim" && (
            <div
              onClick={() =>
                currentJobcardStatus === "Work In Progress"
                  ? setVisible(true)
                  : handleClick()
              }
              className="flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200"
            >
              <FaPlayCircle size="2rem" className="text-red-500 " />
              <div className="w-3/4 text-center text-xl ">
                {jobCardLoading
                  ? "Loading..."
                  : currentJobcardStatus === "On Hold"
                  ? "Devam Et"
                  : currentJobcardStatus === "Work In Progress"
                  ? "Durdur"
                  : "Başlat"}
              </div>
            </div>
          )}

        {currentOperation?.operations === "Profil Temin" ? (
          <div
            onClick={() =>
              isAllProfileTransferred
                ? handleComplete()
                : toast.error("Tüm profillleri aktarmanız gerekmektedir")
            }
            className="flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200"
          >
            <FaRegCircleStop size="2rem" className="text-red-500 " />
            <div className="w-3/4 text-center text-xl "> TAMAMLA</div>
          </div>
        ) : null}

        {currentOperation?.operations === "Sac Kesim" ? (
          <div
            onClick={() =>handleComplete()           }
            className="flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200"
          >
            <FaRegCircleStop size="2rem" className="text-red-500 " />
            <div className="w-3/4 text-center text-xl "> TAMAMLA</div>
          </div>
        ) : null}


        {currentOperation?.operations === "Süper Kesim" ? (
          <div
            onClick={() => handleComplete()}
            className="flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200"
          >
            <FaRegCircleStop size="2rem" className="text-red-500 " />
            <div className="w-3/4 text-center text-xl "> TAMAMLA</div>
          </div>
        ) : null}
        <div
          onClick={handlelogOut}
          className="flex justify-between border-2 items-center w-36 h-12 p-1 rounded-md cursor-pointer hover:bg-red-200"
        >
          <FaPowerOff size="2rem" className="text-red-500 " />
          <div className="w-3/4 text-center text-xl "> ÇIKIŞ</div>
        </div>
        <Modal
          visible={visible}
          setVisible={setVisible}
          reason={reason}
          setReason={setReason}
          handleClick={handleClick}
        />
        <ErrorModal
          errorModalVisible={errorModalVisible}
          setErrorModalVisible={setErrorModalVisible}
          onSubmitErrorData={(errorData) => {
            // Handle error submission here
            console.log("Error data:", errorData);
          }}
        />
      </div>
    </div>
  );
};

export default Navbar;
