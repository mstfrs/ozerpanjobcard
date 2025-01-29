const KitInfoCard = ({ pozDetails }) => {

 
  return (
    
      <div className="bg-gray-100 p-2 w-full pr-4 h-full text-gray-800 rounded-md shadow-md">
        <h2 className="font-bold text-red-600 text-base mb-1 border-b-2 border-black">Kit Bilgileri</h2>
        <div className="text-xs">
          {
            pozDetails?.accessory_kit?.map((item, index) => (
              <div key={index} className="flex justify-start gap-1 mb-1">
                <span className="font-bold text-red-600 ">#{item.item_code}</span>
                <div className=" w-full flex justify-between">
                <span className="text-black ">{item.item_name}</span>
                <span className="text-red-600 font-bold  ">{item.quantity}</span>
                </div>
                
              </div>
            ))
          }

        </div>
      </div>
  );
};

export default KitInfoCard;
