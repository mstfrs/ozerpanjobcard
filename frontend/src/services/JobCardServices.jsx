import { useFrappeGetDoc } from "frappe-react-sdk";
import formatDateToCustomFormat from "../utils/DateFormat";
import { toast } from "react-toastify";

const baseUrl = import.meta.env.VITE_BASE_URL;


export const getJobCards = async (filters) => {
    try {
      const response = await fetch(
        `${baseUrl}/resource/Job Card?fields=["*"]&filters=${JSON.stringify(filters)}`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.data || []
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };

export const getJobCardFromOpt = async (operation,optNo) => {
  console.log(operation)
    try {
      const response = await fetch(
        `${baseUrl}/resource/Job Card?fields=["*"]&filters=[["operation","=",${operation}],["custom_opti_no","=",${optNo}]]`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      console.log(data)
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }
  };

export  const JobCardAction = async (jobCard,employee,reason) => {
  console.log(jobCard)
  console.log(employee)
    try {
      if (jobCard?.status === 'Work In Progress') {
        // Eğer duraklatılmışsa devam ettir
        const timeLogId = jobCard.time_logs&&jobCard.time_logs[jobCard.time_logs.length - 1]?.name;       
        const updatedPayload = {
          to_time: formatDateToCustomFormat(new Date().toISOString()), // Bitirme zamanı güncelleniyor
          custom_reason: reason,
        };
        await updateJobLog(timeLogId, updatedPayload);
        const data=await updateJobCardStatus(jobCard.name, { is_paused: 1, status: "On Hold" });
        return data.data
      } else
       if (jobCard?.status === 'Open') {
console.log('status open')
const { isSequenceValid, prevOpt } = await checkOperationSequence(jobCard);

      
        if (!isSequenceValid) {
          toast.error(`${prevOpt} tamamlanmadan bu operasyona başlayamazsınız.`);
          return; // Fonksiyon burada durur ve diğer kodlar çalışmaz
        }
        const timeLogPayload = {
          job_card: jobCard?.name,
          from_time: formatDateToCustomFormat(new Date().toISOString()),
          to_time: null,
          employee: employee?.name,
          completed_qty: 0,
          idx: jobCard?.time_logs?.length + 1,
          parent: jobCard?.name,
          parenttype: "Job Card",
          parentfield: "time_logs",
        };

        await fetch(`${baseUrl}/resource/Job Card Time Log`, {
          method: "POST",
          credentials:'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(timeLogPayload),
        });
        const data=await updateJobCardStatus(jobCard?.name, { is_paused: 0, status: "Work in Progress", employee: [{ "employee": employee?.name }] });
        return data.data
      }
      else if (jobCard?.status === 'On Hold') {
        const timeLogPayload = {
          job_card: jobCard?.name,
          from_time: formatDateToCustomFormat(new Date().toISOString()),
          to_time: null,
          employee: employee?.name,
          completed_qty: 0,
          idx: jobCard?.time_logs?.length + 1,
          parent: jobCard?.name,
          parenttype: "Job Card",
          parentfield: "time_logs",
        };

        await fetch(`${baseUrl}/resource/Job Card Time Log`, {
          method: "POST",
          credentials:'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(timeLogPayload),
        });

        const data=await updateJobCardStatus(jobCard.name, { is_paused: 0, status: "Work in Progress" });
        return data.data
      }
    } catch (error) {
      console.error("Error handling job action:", error);
    }
    //  finally {
    //   mutate("jobcarddetails");
    // }
  };


  
  const updateJobCardStatus = async (jobCardId, payload) => {
    console.log(jobCardId)
    try {
      const response = await fetch(`${baseUrl}/resource/Job Card/${jobCardId}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          //"Authorization": `token 6d76e6b39cc7a4d:f63543ae0fad40f`, // API anahtarı ve gizli anahtar
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const data = await response.json();
      return data
    } catch (error) {
      console.error("Error updating job card:", error);
    }
  };

  const updateJobLog = async (timeLogId, updatedPayload) => {
    try {
      const response = await fetch(`${baseUrl}/resource/Job Card Time Log/${timeLogId}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const data = await response.json();
      console.log("Job card updated successfully:", data);
    } catch (error) {
      console.error("Error updating job card:", error);
    }
  };
  export const getJobCardDetails=async(id)=>{
    try {
      const response = await fetch(
        `${baseUrl}/resource/Job Card/${id}`
      ,{
        method: "GET",
        credentials: 'include',  
      });
      const data = await response.json();
      return data.data;
      
    } catch (error) {
      console.error("Job Cards Fetch Error:", error);
    }

  }

  const submitJobCard = async (joCardId, payload) => {


    try {
      const response = await fetch(
        `${baseUrl}/resource/Job%20Card/${joCardId}`,

        {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }, body: JSON.stringify(payload),
        }
      );
      console.log(response.data);
      toast.success('İş Kartı tamamlandı')
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

export const completeJobCard = async (jobCard,quantity) => {
  console.log(jobCard)
    const timeLogId = jobCard.time_logs[jobCard.time_logs.length - 1].name;
    const updatedPayload = {
      to_time: formatDateToCustomFormat(new Date().toISOString()), // Bitirme zamanı güncelleniyor
      completed_qty: quantity,
      parent: jobCard.name,
      parenttype: "Job Card",
      parentfield: "time_logs",

    };
    //await updateJobCardStatus(jobCard.name, { status:"Completed",action:'Submit'});
    await updateJobLog(timeLogId, updatedPayload);
    jobCard.total_completed_qty + quantity === jobCard.for_quantity ?
      await submitJobCard(jobCard.name, { run_method: "submit" })
      :
     ( await updateJobCardStatus(jobCard.name, { is_paused: 1, status: "On Hold" }),
    toast.warn('İş Kartının Tamamlanması için Üretilmesi gereken miktarı tamalamadınız '))
  
  };





     //****** Route Kontrol Etme  */


  const checkOperationSequence=async(jobCard) =>{
    const workOrder = await fetchWorkOrder(jobCard.work_order);

    // İş emri içerisindeki operasyonları sırayla alıyoruz
    const operations = workOrder.data.operations;
    const currentOperation = operations.find(op => op.operation === jobCard.operation);
    const previousOperation = operations.find(op => op.idx === currentOperation.idx - 1);

    const prevOpt = previousOperation?.operation || null;

    // Eğer önceki operasyon tamamlanmamışsa, sıralamanın yanlış olduğunu belirten false döndür
    const isSequenceValid = !previousOperation || previousOperation.status === 'Completed';

    return { isSequenceValid, prevOpt }; // Sıralama doğruluğu ve önceki operasyon adı döndürülüyor
};
    // İş emri verilerini getiren API çağrısı
    async function fetchWorkOrder(workOrderName) {
      const response = await fetch(`/api/resource/Work Order/${workOrderName}`);
      const data = await response.json();
      return data;
    }
 

       //****** Route Kontrol Etme  */