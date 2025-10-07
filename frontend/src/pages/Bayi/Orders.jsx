import React, { useEffect, useState } from 'react'
import { getAllOrdersByCustomer, getDealerWithDetailsByLoggedUser } from '../../services/DelaerServices';
import useJobcardsStore from '../../store/jobcardStore';
import OrdersList from '../../components/DelaerPage/OrdersList';
import BayiNavbar from '../../components/Navbar/BayiNavbar'

const Orders = () => {
    const {selectedDealer} = useJobcardsStore();
    const [orders, setOrders] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    
    useEffect(() => {
        const getOrders = async () => {
            try {
                setIsLoading(true);
                const dealerData = await getDealerWithDetailsByLoggedUser();
                const ordersData = await getAllOrdersByCustomer(dealerData?.customer?.name);
                setOrders(ordersData);
            } catch (error) {
                console.error("Error loading orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        getOrders();
    }, [selectedDealer]);

    return (
        <div className='w-full'>
            <BayiNavbar />
            <OrdersList orders={orders} isLoading={isLoading} />
        </div>
    );
};

export default Orders;