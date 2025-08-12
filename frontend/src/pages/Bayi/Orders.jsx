import React, { useEffect, useState } from 'react'
import { getAllOrdersByCustomer, getDealerWithDetailsByLoggedUser } from '../../services/DelaerServices';
import useJobcardsStore from '../../store/jobcardStore';
import OrdersList from '../../components/DelaerPage/OrdersList';

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
        <OrdersList orders={orders} isLoading={isLoading} />
    );
};

export default Orders;