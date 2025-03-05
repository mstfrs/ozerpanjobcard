
import React, { useState } from "react";
import { Dropdown } from 'primereact/dropdown';
import { ChevronDownIcon } from 'primereact/icons/chevrondown';
import { ChevronRightIcon } from 'primereact/icons/chevronright';

const ReportErrorDropdown=()=> {
    const [selectedError, setSelectedError] = useState(null);
    const countries = [
        { name: 'Çıta Hatası', code: 'Cita' },
        { name: 'Bağlama Hatası', code: 'Baglama' },
        { name: 'Eksik Conta', code: 'Conta' },
        { name: 'Diğer', code: 'Diger' }      
    ];

    const selectedErrorTemplate = (option, props) => {
        if (option) {
            return (
                <div className="flex align-items-center">
                    <img alt={option.name} src="https://primefaces.org/cdn/primereact/images/flag/flag_placeholder.png" className={`mr-2 flag flag-${option.code.toLowerCase()}`} style={{ width: '18px' }} />
                    <div>{option.name}</div>
                </div>
            );
        }

        return <span>{props.placeholder}</span>;
    };

    const errorOptionTemplate = (option) => {
        return (
            <div className="flex align-items-center">
                <img alt={option.name} src="https://primefaces.org/cdn/primereact/images/flag/flag_placeholder.png" className={`mr-2 flag flag-${option.code.toLowerCase()}`} style={{ width: '18px' }} />
                <div>{option.name}</div>
            </div>
        );
    };

    const panelFooterTemplate = () => {
        return (
            <div className="py-2 px-3">
                {selectedError ? (
                    <span>
                        <b>{selectedError.name}</b> selected.
                    </span>
                ) : (
                    'No error selected.'
                )}
            </div>
        );
    };

    return (
        <div className="card flex justify-content-center">
            <Dropdown value={selectedError} onChange={(e) => setSelectedError(e.value)} options={countries} optionLabel="name" placeholder="HATA BİLDİR" 
                valueTemplate={selectedErrorTemplate} itemTemplate={errorOptionTemplate} className="w-full md:w-14rem" panelFooterTemplate={panelFooterTemplate} 
                dropdownIcon={(opts) => {
                    return opts.iconProps['data-pr-overlay-visible'] ? <ChevronRightIcon {...opts.iconProps} /> : <ChevronDownIcon {...opts.iconProps} />;
                }}/>
        </div>    
    )
}
        
export default ReportErrorDropdown