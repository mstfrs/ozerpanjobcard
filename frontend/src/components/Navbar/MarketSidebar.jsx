import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from 'primereact/dropdown';
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import useJobcardsStore from "../../store/jobcardStore";
import {  getBomItemsByItemCode, getOrdersFromOpt, getPozFromProductionPlan } from "../../services/OrdersServices";
import PozList from "../Cards/PozList";

const MarketSidebar = ({ setPozBomData }) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [orders, setOrders] = useState({})
  const [selectedOrder, setSelectedOrder] = useState({})
  const [selectedPoz, setSelectedPoz] = useState({})
  const [poz, setPoz] = useState()
  const stepperRef = useRef(null);
  const {
    employee,
    setCurrentOperation,
    currentOperation,
    setCurrentOpt,
    setCurrentJobcard, setCurrentJobcardStatus,
    setCurrentJobcardNames, setCurrentSelectedJobCard,
    currentOpt, setFilters,
    jobCardList,
    setIsLoading,
  } = useJobcardsStore();

  const handleOperationChange = (e) => {

    setCurrentOperation(e.value);
    setCurrentOpt({});
    setCurrentJobcard({});
    setCurrentJobcardNames([]);
    setCurrentSelectedJobCard(null);
    setPoz({});
    setCurrentJobcardStatus();
    // setFilters([["operation", "=", e.value.operations]]);
    setFilters([
      ["operation", "=", e.value.operations],
      ["status", "not in", ["Completed", "Cancelled"]]
    ]);

  };

  const handleOptiChange = async (e) => {
    setIsLoading(true);
    setPoz({});

    setCurrentOpt(e.value);
    console.log("Current Opt", e.value)
    // getOrdersFromOpt(currentOperation,e.value);
    const orders = await getOrdersFromOpt(currentOperation, e.value)
    console.log(orders)

    setOrders(orders)
    setCurrentJobcardStatus(
      jobCardList?.find(
        (item) => item.custom_opti_no === e.value.custom_opti_no
      )?.status
    );


    // Create an array of job card names
    const jobCardNames = jobCardList
      ?.filter((item) => item.custom_opti_no === e.value.custom_opti_no)
      .map((item) => item.name);


    await setCurrentJobcardNames(jobCardNames);
    console.log("jobCardList", jobCardList)
    setIsLoading(false);
  };

  const handleOrderChange = async (e) => {
    setPoz({});

    setSelectedOrder(e.value);
    const poz = await getPozFromProductionPlan(e.value)
    setPoz(poz)
    console.log(poz)
  };
  useEffect(() => {
    const fetchBomItems = async () => {
      if (selectedPoz?.item_code) {
        const bomData = await getBomItemsByItemCode(selectedPoz.item_code, currentOperation?.operations);
        setPozBomData({
          bom_items: bomData.bom_items,
          job_cards: bomData.job_cards,
          bom_name: bomData.bom_name
        });
        setCurrentSelectedJobCard(bomData?.job_cards[0])
        console.log(bomData?.job_cards[0]);
      }
    };

    fetchBomItems();
  }, [selectedPoz, currentOperation])




  return (

    <div className="card flex flex-col gap-2 justify-content-center px-3 text-xs">

      <Dropdown
        value={currentOperation}

        onChange={(e) => {
          handleOperationChange(e)
        }
        }
        options={employee?.custom_operations}
        optionLabel="operations"
        placeholder="Operasyon Seçiniz"
        className="w-full md:w-14rem"
      />
      <Dropdown
        value={currentOpt}
        onChange={(e) => {
          handleOptiChange(e)
        }
        }
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
        placeholder="OPT seçiniz"
        className="w-full md:w-14rem"
      />
      <Dropdown
        value={selectedOrder}
        onChange={(e) => {
          handleOrderChange(e)
        }
        }
        options={orders.message}
        optionLabel="sales_order"
        placeholder="Sipariş Seçiniz"
        className="w-full md:w-14rem"
      />

      <PozList poz={poz} setSelectedPoz={setSelectedPoz} />
    </div>
  );
};

export default MarketSidebar;