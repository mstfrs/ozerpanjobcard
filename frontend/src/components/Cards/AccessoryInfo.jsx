import React from "react";
import Loading from "../Loading";
import useJobcardsStore from "../../store/jobcardStore";

const AccessoryInfoCard = ({ aksesuarItems }) => {

  const {
    isAccessoryLoading
  } = useJobcardsStore();
  return (
    
      <div className="bg-gray-100 p-2 w-full pr-4 h-full text-gray-800 rounded-md shadow-md">
        <h2 className="font-bold text-red-600 text-base mb-3">Aksesuar Bilgileri</h2>
        <div className="text-sm">
          {
            isAccessoryLoading ? <Loading /> :
            aksesuarItems.map((item, index) => (
              <div key={index} className="flex justify-start gap-1 mb-1">
                <span>#{item.item_code}</span>
                <span className="text-red-600 font-semibold">{item.item_name}</span>
              </div>
            ))
          }

        </div>
      </div>
  );
};

export default AccessoryInfoCard;
