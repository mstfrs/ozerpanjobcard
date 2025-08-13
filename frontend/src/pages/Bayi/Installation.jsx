import React, { useEffect } from 'react'
import { getDeliveredOrdersWithoutInstallation } from '../../services/DelaerServices';

export const Installation = () => {
  useEffect(async () => {
  
    const result = await getDeliveredOrdersWithoutInstallation();
    console.log(result)
  }, [])
  
  return (
    <div>Installation</div>
  )
}
