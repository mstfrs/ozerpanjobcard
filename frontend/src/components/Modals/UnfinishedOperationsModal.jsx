import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const UnfinishedOperationsModal = ({ visible, onHide, unfinishedOps }) => {
  return (
    <Dialog
      header="Tamamlanmamış Operasyonlar"
      visible={visible}
      style={{ width: '30vw' }}
      breakpoints={{ '960px': '75vw', '641px': '100vw' }}
      onHide={onHide}
      modal
      closeOnEscape
    
    >
      <div className="p-4">
        <div className="space-y-4">
          {unfinishedOps.map((op, index) => (
            <div key={index} className=" items-start p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-row justify-between">
                <div className="font-semibold text-lg text-red-600">{op.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">İş Kartı:</span> {op.job_card}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
};

export default UnfinishedOperationsModal; 