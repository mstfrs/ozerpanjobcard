import { Button } from 'primereact/button'
import React, { useEffect, useState } from 'react'
import { getDealerWithDetailsByLoggedUser } from '../../services/DelaerServices'
import DealerInfo from '../../components/Cards/DealerInfo'
import useJobcardsStore from '../../store/jobcardStore'

const titles = [
  {
    title: "Montaj",
    icon: "pi pi-truck",
    link: "/dealerpanel/installation"
  },
  {
    title: "Bakım & Onarım",
    icon: "pi pi-wrench",
    link: "/dealerpanel/maintenance"
  },
  {
    title: "Servis Talepleri",
    icon: "pi pi-tags",
    link: "/dealerpanel/service"
  },
  {
    title: "Siparişler",
    icon: "pi pi-sparkles",
    link: "/dealerpanel/orders"
  }
]

const Bayipanel = () => {
  const [dealer, setDealer] = useState(null);
  const { setSelectedDealer, setIsLoading } = useJobcardsStore();

  useEffect(() => {
    const getDealer = async () => {
      try {
        setIsLoading(true); // Store'da loading başlat
        
        const dealerData = await getDealerWithDetailsByLoggedUser();
        
        if (dealerData) {
          setDealer(dealerData);
          setSelectedDealer(dealerData);
          console.log("Dealer loaded and stored:", dealerData);
        } else {
          console.error("Dealer data is null");
        }
      } catch (error) {
        console.error("Error loading dealer:", error);
      } finally {
        setIsLoading(false); // Store'da loading bitir
      }
    };

    getDealer();
  }, [setSelectedDealer, setIsLoading]);

  // Loading durumunda
  if (!dealer) {
    return (
      <div className='flex flex-col gap-4 w-full items-center justify-center h-dvh'>
        <div className="text-xl">Bayi bilgileri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 w-full items-center justify-center h-dvh'>
      <DealerInfo dealer={dealer}/>

      <div className='flex flex-col gap-4 w-full items-center justify-center h-dvh mx-4'>
        {
          titles.map((title, index) => (
            <a href={title.link} key={index}>
              <Button label={title.title} icon={title.icon} size="large" className='w-svw md:w-64 h-20 mx-20 bg-red-500 py-2 px-4 rounded-md text-white text-xl' /></a>
          ))
        }
      </div>
    </div>
  )
}

export default Bayipanel