import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Paginator } from "primereact/paginator";
import { getGlassDetails, getGlassList, processGlassOperation } from "../../../services/GlassServices";
import { glassLabelPrint } from "../../../services/PrintServices";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useJobcardsStore from "../../../store/jobcardStore";
import { getJobCardDetails } from "../../../services/JobCardServices";

const Cam = () => {
  // Load filters from localStorage or use defaults
  const loadFilterFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(`cam_filter_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const saveFilterToStorage = (key, value) => {
    try {
      localStorage.setItem(`cam_filter_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Error saving filter to localStorage:", e);
    }
  };

  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [glassList, setGlassList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorNote, setErrorNote] = useState("");
  const [lastSearchedValue, setLastSearchedValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(loadFilterFromStorage("status", "Pending"));
  const [selectedGlassType, setSelectedGlassType] = useState(loadFilterFromStorage("glassType", null));
  const [currentOrder, setCurrentOrder] = useState();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Sorting state
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  // Summary state (for sidebar counts)
  const [glassTypesSummary, setGlassTypesSummary] = useState({});
  const [statusCountsSummary, setStatusCountsSummary] = useState({});

  const {
    employee,
    currentOperation,
    currentJobcard,
    setCurrentJobcard,
  } = useJobcardsStore();

  const handleInputChange = (e) => {
    setInputValue(e.target.value.slice(0, 7));
    setCurrentOrder(e.target.value.slice(0, 7));
  };

  const handleInputKeyDown = async (e) => {
    if (e.key === "Enter" && inputValue.length === 7) {
      e.preventDefault(); // Prevent form submission and tab behavior
      setCurrentPage(1); // Reset to first page on new search
      // Keep filters from localStorage, don't reset on new search
      await handleSearchWithValue(inputValue, 1, pageSize, sortField, sortOrder, selectedStatus, selectedGlassType);
      setInputValue(""); // Okutma sonrası inputu temizle
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (inputValue.length === 7) {
      setCurrentPage(1); // Reset to first page on new search
      // Keep filters from localStorage, don't reset on new search
      await handleSearchWithValue(inputValue, 1, pageSize, sortField, sortOrder, selectedStatus, selectedGlassType);
      setInputValue(""); // Okutma sonrası inputu temizle
    }
  };

  const handleSearchWithValue = async (value, page = 1, size = pageSize, sortF = sortField, sortO = sortOrder, statusF = selectedStatus, glassTypeF = selectedGlassType) => {
    // Send status filter directly - API will handle it
    const statusFilter = (statusF && (statusF === "Pending" || statusF === "Completed" || statusF === "In Progress")) ? statusF : null;
    const response = await getGlassList(value, page, size, sortF, sortO, statusFilter, glassTypeF);
    console.log("glasslist", response);
    console.log("glass_types_summary", response.glass_types_summary);
    console.log("status_counts_summary", response.status_counts_summary);
    
    // Handle new paginated response format - server already filters
    const data = response.data || response;
    const filteredData = Array.isArray(data) ? data : [];
    console.log("filteredData", filteredData);
    
    if (filteredData.length === 0 && page === 1) {
      toast.error("Siparişe ait üretilecek Cam bulunamadı");
      setGlassList([]);
      setSelectedProduct(null);
      setTotalCount(0);
      setTotalPages(0);
      return;
    }
    
    setGlassList(filteredData);
    setSelectedProduct(null);
    setLastSearchedValue(value); // Son aranan değeri sakla
    setCurrentPage(page);
    setPageSize(size);
    setSortField(sortF);
    setSortOrder(sortO);
    
    // Update pagination metadata
    if (response.total_count !== undefined) {
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages || 0);
    }
    
    // Update summary from API response (for sidebar counts)
    // Only update if summary exists (first page) or keep existing summary (other pages)
    if (response.glass_types_summary && Object.keys(response.glass_types_summary).length > 0) {
      setGlassTypesSummary(response.glass_types_summary);
    }
    if (response.status_counts_summary && Object.keys(response.status_counts_summary).length > 0) {
      setStatusCountsSummary(response.status_counts_summary);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1); // Reset to first page on new search
    await handleSearchWithValue(inputValue, 1, pageSize);
  };

  const handlePageChange = async (event) => {
    // PrimeReact Paginator: event.page is 0-based, event.first is the index of first record
    const newPage = event.page + 1;
    const newPageSize = event.rows;
    
    // If page size changed, update it
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    
    setCurrentPage(newPage);
    await handleSearchWithValue(lastSearchedValue, newPage, newPageSize, sortField, sortOrder, selectedStatus, selectedGlassType);
  };

  const handlePageSizeChange = async (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    await handleSearchWithValue(lastSearchedValue, 1, newSize, sortField, sortOrder, selectedStatus, selectedGlassType);
  };

  const handleSort = async (event) => {
    const newSortField = event.sortField;
    let newSortOrder = event.sortOrder === 1 ? "asc" : "desc";
    
    // If sorting by the same field, toggle order
    if (sortField === newSortField && sortOrder === "asc") {
      newSortOrder = "desc";
    } else if (sortField === newSortField && sortOrder === "desc") {
      newSortOrder = "asc";
    }
    
    setSortField(newSortField);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
    await handleSearchWithValue(lastSearchedValue, 1, pageSize, newSortField, newSortOrder, selectedStatus, selectedGlassType);
  };

  const handleRowClick = async (e) => {
    console.log("e", e);
    const product = e.data;
    const jobCardInfo = await getJobCardDetails(product?.job_cards[0]?.job_card_ref);
    setCurrentJobcard(jobCardInfo);
    const glassDetails = await getGlassDetails(product?.stok_kodu);
    setSelectedProduct({ product, glassDetails });
  };

  const handlePrintLabel = async () => {
    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    // Get the latest job card ref from job_cards array
    const jobCards = selectedProduct.product.job_cards || [];
    const latestJobCard = jobCards.length > 0 ? jobCards[jobCards.length - 1] : null;
    const jobCardRef = latestJobCard?.job_card_ref || null;

    const payload = {
      operation: "Cam",
      employee: employee.name,
      glass_name: selectedProduct.product.name,
      job_card_ref: jobCardRef  // Send job_card_ref to avoid lookup in backend
    };

    try {
      const result = await processGlassOperation(payload);
      
      if (result) {
        toast.success("Cam operasyonu başarıyla işlendi");
        
        // Fire-and-forget: Print and refresh in background (don't wait)
        // Print label immediately
        glassLabelPrint(selectedProduct);
        
        // Refresh list in background after a short delay to allow print to start
        setTimeout(() => {
          handleSearchWithValue(lastSearchedValue, currentPage, pageSize, sortField, sortOrder, selectedStatus, selectedGlassType).catch(err => {
            console.error("Error refreshing list:", err);
          });
        }, 100);
      } else {
        toast.error("Operasyon başarısız oldu");
      }
    } catch (error) {
      toast.error("Operasyon sırasında bir hata oluştu");
      console.error("Error in processGlassOperation:", error);
    }
  };

  const handleErrorSubmit = async () => {
    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    if (!errorNote.trim()) {
      toast.error("Lütfen hata açıklaması giriniz");
      return;
    }

    try {
      // Get the latest job card ref from job_cards array
      const jobCards = selectedProduct.product.job_cards || [];
      const latestJobCard = jobCards.length > 0 ? jobCards[jobCards.length - 1] : null;
      const jobCardRef = latestJobCard?.job_card_ref || null;

      const payload = {
        operation: "Cam",
        employee: employee.name,
        glass_name: selectedProduct.product.name,
        quality_data: {
          criteria: [{
            id: "surface_finish",
            name: "Surface Finish Quality",
            passed: false,
            notes: errorNote,
            severity: "low"
          }],
          overall_notes: errorNote
        }
      };

      const result = await processGlassOperation(payload);
      
      if (result) {
        toast.success("Hata kaydı başarıyla oluşturuldu");
        setErrorModalVisible(false);
        setErrorNote("");
        
        // Fire-and-forget: Refresh list in background (don't wait)
        setTimeout(() => {
          handleSearchWithValue(lastSearchedValue, currentPage, pageSize, sortField, sortOrder, selectedStatus, selectedGlassType).catch(err => {
            console.error("Error refreshing list:", err);
          });
        }, 100);
      } else {
        toast.error("Hata kaydı oluşturulamadı");
      }
    } catch (error) {
      toast.error("Hata kaydı oluşturulurken bir sorun oluştu");
      console.error("Error submitting error data:", error);
    }
  };

  const rowClassName = (data) => {
    return data === selectedProduct?.product ? "bg-red-300" : "";
  };

  const header = (
    <div className="flex flex-col gap-1 justify-between w-full mx-1 mb-1">
      <form onSubmit={handleFormSubmit} className="w-full">
        <span className="p-input-icon-left">
          <InputText
            type="search"
            placeholder="Sipariş numarası"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="w-full h-10 pl-2 text-base"
            // disabled={currentJobcard?.status === "Work In Progress"}
          />
        </span>
      </form>
    
      <div className="flex justify-between gap-2">
        <button
          className="w-full h-10 bg-blue-400 rounded-md cursor-pointer flex items-center justify-center gap-2 text-lg"
          onClick={handlePrintLabel}
          disabled={!selectedProduct}
        >
          <i className="pi pi-print text-xl"></i>
          Etiket Yazdır
        </button>
       
        {/* <button
          onClick={handleSearch}
          label="Sorgula"
          className="w-28 h-10 bg-green-400 rounded-md cursor-pointer"
          // disabled={currentJobcard?.status === "Work In Progress"}
        >
          Sorgula
        </button> */}
      </div>
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    const jobCards = rowData.job_cards || [];
    const lastJobCard = jobCards[jobCards.length - 1];
    const status = lastJobCard?.status || "N/A";
    const isCorrective = lastJobCard?.is_corrective === 1;

    return (
      <Tag
        value={isCorrective ? `${status} (Düzeltme)` :status==="Completed"?"Tamamlandı": "Yeni"}
        severity={status === "Pending" ? "warning" : "success"}
        className={isCorrective ? "bg-yellow-500" : ""}
      />
    );
  };

  // Use summary from API (tüm veri üzerinden hesaplanmış)
  const glassTypes = glassTypesSummary;
  const statusCounts = statusCountsSummary;

  // Filtreleme artık server-side'da yapılıyor, direkt glassList kullanıyoruz

  const errorModalFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="İptal"
        icon="pi pi-times"
        onClick={() => {
          setErrorModalVisible(false);
          setErrorNote("");
        }}
        className="p-button-text"
      />
      <Button
        label="Kaydet"
        icon="pi pi-check"
        onClick={handleErrorSubmit}
        className="p-button-primary"
      />
    </div>
  );

  return (
    <div className="pt-2 flex text-xs h-full overflow-hidden">
      <Button
        data-testid="error-modal-trigger"
        className="hidden"
        onClick={() => setErrorModalVisible(true)}
      />
      <Dialog
        header="Hata Bildirimi"
        visible={errorModalVisible}
        style={{ width: '50vw' }}
        onHide={() => {
          setErrorModalVisible(false);
          setErrorNote("");
        }}
        footer={errorModalFooter}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="errorNote">Hata Açıklaması</label>
            <InputTextarea
              id="errorNote"
              value={errorNote}
              onChange={(e) => setErrorNote(e.target.value)}
              rows={5}
              className="w-full"
              placeholder="Hata açıklamasını giriniz..."
            />
          </div>
        </div>
      </Dialog>

      <div className="mr-2 flex flex-col w-1/5">
        {header}
      
        {Object.keys(glassTypes).length > 0 && (
          <>
            <Card
          className="mb-1"
          title={
            <span className="text-sm font-semibold">
              Fabrika Sipariş No:{currentOrder}
            </span>
          }
          subTitle={
            <span className="text-xs text-gray-600">
              Adı:{" "}
              {glassList?.[0]
                ? `${glassList[0].cari_unvan} - ${glassList[0].musteri}`
                : ""}
            </span>
          }
        />
             <div className="mb-1 items-center bg-white rounded-md">
            <h3 className="text-base font-semibold mb-1 bg-red-300 rounded-t-md text-center">Cam Çeşitleri ve Adetleri</h3>
            <ul className="text-base px-1">
              {Object.entries(glassTypes).map(([type, count]) => (
                <li
                  key={type}
                  className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-1 rounded-lg ${
                    selectedGlassType === type ? "font-bold bg-green-500 text-white" : ""
                  }`}
                  onClick={async () => {
                    const newGlassType = selectedGlassType === type ? null : type;
                    setSelectedGlassType(newGlassType);
                    saveFilterToStorage("glassType", newGlassType);
                    setCurrentPage(1); // Reset to first page when filtering
                    await handleSearchWithValue(lastSearchedValue, 1, pageSize, sortField, sortOrder, selectedStatus, newGlassType);
                  }}
                >
                  <span>{type}</span>
                  <span className="text-base font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          </>
       
        )}
        <div className=" bg-white rounded-md items-center">
          <h3 className="text-base font-semibold mb-1 bg-red-300 rounded-t-md text-center">Durumlar</h3>
          <ul className="text-base px-1">
            {/* Always show Yeni (Pending) button */}
            <li
              className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-2 rounded-lg ${selectedStatus === "Pending" ? "font-bold bg-green-500 text-white" : ""}`}
              onClick={async () => {
                setSelectedStatus("Pending");
                saveFilterToStorage("status", "Pending");
                setCurrentPage(1);
                await handleSearchWithValue(lastSearchedValue, 1, pageSize, sortField, sortOrder, "Pending", selectedGlassType);
              }}
            >
              <span>Yeni</span>
              <span className="text-base font-semibold">{statusCounts["Pending"] || 0}</span>
            </li>
            {/* Always show Tamamlanan (Completed) button */}
            <li
              className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-2 rounded-lg ${selectedStatus === "Completed" ? "font-bold bg-green-500 text-white" : ""}`}
              onClick={async () => {
                setSelectedStatus("Completed");
                saveFilterToStorage("status", "Completed");
                setCurrentPage(1);
                await handleSearchWithValue(lastSearchedValue, 1, pageSize, sortField, sortOrder, "Completed", selectedGlassType);
              }}
            >
              <span>Tamamlanan</span>
              <span className="text-base font-semibold">{statusCounts["Completed"] || 0}</span>
            </li>
            {/* Show other statuses if they exist */}
            {Object.entries(statusCounts)
              .filter(([status]) => status !== "Pending" && status !== "Completed")
              .map(([status, count]) => (
                <li
                  key={status}
                  className={`flex justify-between cursor-pointer border-1 border px-1 py-3 text-base mb-2 rounded-lg ${selectedStatus === status ? "font-bold bg-green-500 text-white" : ""}`}
                  onClick={async () => {
                    setSelectedStatus(status);
                    saveFilterToStorage("status", status);
                    setCurrentPage(1);
                    await handleSearchWithValue(lastSearchedValue, 1, pageSize, sortField, sortOrder, status, selectedGlassType);
                  }}
                >
                  <span>
                    {status === "In Progress"
                      ? "İşlemde"
                      : status}
                  </span>
                  <span className="text-base font-semibold">{count}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="mb-2 flex items-center justify-between px-2 flex-shrink-0 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Sayfa Boyutu:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm text-gray-600">
              Toplam: {totalCount} kayıt
            </span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <Paginator
              first={(currentPage - 1) * pageSize}
              rows={pageSize}
              totalRecords={totalCount}
              rowsPerPageOptions={[10, 25, 50, 100, 200]}
              onPageChange={handlePageChange}
              template={{
                layout: 'PrevPageLink CurrentPageReport NextPageLink',
                PrevPageLink: (options) => {
                  return (
                    <button
                      type="button"
                      className={options.className}
                      onClick={options.onClick}
                      disabled={options.disabled}
                      style={{ 
                        ...options.style, 
                        padding: '0.5rem 1rem',
                        fontSize: '1rem',
                        minWidth: '3rem'
                      }}
                    >
                      <i className="pi pi-chevron-left"></i>
                    </button>
                  );
                },
                NextPageLink: (options) => {
                  return (
                    <button
                      type="button"
                      className={options.className}
                      onClick={options.onClick}
                      disabled={options.disabled}
                      style={{ 
                        ...options.style, 
                        padding: '0.5rem 1rem',
                        fontSize: '1rem',
                        minWidth: '3rem'
                      }}
                    >
                      <i className="pi pi-chevron-right"></i>
                    </button>
                  );
                },
                CurrentPageReport: (options) => {
                  return (
                    <span className="mx-3 text-sm font-semibold">
                      Sayfa {currentPage} / {totalPages || 1}
                    </span>
                  );
                }
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <DataTable
            value={glassList}
            className="p-datatable-sm text-sm flex-1"
            rows={pageSize}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder === "asc" ? 1 : -1}
            lazy
            scrollable
            scrollHeight="flex"
            responsiveLayout="scroll"
            onRowClick={handleRowClick}
            rowClassName={rowClassName}
          >
          <Column
            field="poz_no"
            header="Poz No"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="genislik"
            header="Genişlik"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="yukseklik"
            header="Yükseklik"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="sanal_adet"
            header="Sanal Adet"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="job_cards"
            header="Durumu"
            body={statusBodyTemplate}
            style={{ width: "120px" }}
          />
          <Column field="aciklama" header="Cam Cinsi" sortable />
        </DataTable>
        </div>
      </div>
    </div>
  );
};

export default Cam;
