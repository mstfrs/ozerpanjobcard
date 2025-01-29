const RemarksInfo = (pozDetails) => {
  const { remarks } = pozDetails || {};

  return (
    <div className="bg-gray-100 p-2 w-full pr-4 h-full text-gray-800 rounded-md shadow-md">
      <h2 className="font-bold text-red-600 text-base mb-1 border-b-2 border-black">
        Açıklama
      </h2>
      <div className="text-xs">
        <span className="font-bold text-red-600 ">{remarks}</span>
      </div>
    </div>
  );
};

export default RemarksInfo;
