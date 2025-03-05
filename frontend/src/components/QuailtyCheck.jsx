import { useState, useEffect } from 'react';
import { Checkbox } from 'primereact/checkbox';
import useJobcardsStore from '../store/jobcardStore';

const QualityCheck = ({ onCriteriaChange, setCriteria, tesDetay }) => {
    const categories = [
        { name: 'Seri ve Renk', key: 'A' },
        { name: 'İç ve Dış Yüzey', key: 'B' },
        { name: 'Aksesuar Seçimi', key: 'C' },
        { name: 'Kanat Baskısı', key: 'D' }
    ];
    const [selectedCategories, setSelectedCategories] = useState([]);
    const {
        isAllSelected,
        setIsAllSelected
    } = useJobcardsStore();

    useEffect(() => {
        console.log(tesDetay, "tesDetay");
        // İlk yüklemede tüm kategorileri ekle ve passed değerlerini false olarak ayarla
        const initialCriteria = tesDetay?.quality_data?.criteria ? tesDetay.quality_data.criteria.map(category => ({
            ...category,
            passed: category.passed
        })) : categories.map(category => ({
            ...category,
            passed: false
        }));
        setSelectedCategories(initialCriteria);
        setCriteria(initialCriteria);
        console.log(selectedCategories, "selectedCategories");
    }, [tesDetay, setCriteria]);

    const onCategoryChange = (e) => {
        let _selectedCategories = [...selectedCategories];

        if (e.checked) {
            _selectedCategories = _selectedCategories.map(category =>
                category.key === e.value.key ? { ...category, passed: true } : category
            );
        } else {
            _selectedCategories = _selectedCategories.map(category =>
                category.key === e.value.key ? { ...category, passed: false } : category
            );
        }

        setSelectedCategories(_selectedCategories);
        onCriteriaChange(_selectedCategories); // Callback fonksiyonunu çağır
    };

    useEffect(() => {
        setIsAllSelected(selectedCategories.filter(category => category.passed).length === categories.length);
    }, [selectedCategories, setIsAllSelected]);

    return (
        <div className={`flex flex-col w-full border-2 ${isAllSelected ? 'border-green-400' : 'border-red-400'} h-44`}>
            <div className={`flex ${isAllSelected ? 'bg-green-400' : 'bg-red-400'} justify-center py-1 mb-1 text-lg font-semibold`}>
                <h3>{isAllSelected ? 'BAŞARILI' : 'TEST'}</h3>
            </div>
            <div className="flex flex-col w-full gap-3">
                {categories.map((category) => {
                    return (
                        <div key={category.key} className="flex justify-between mx-1">
                            <label htmlFor={category.key} className="ml-2">
                                {category.name}
                            </label>
                            <Checkbox className="" inputId={category.key} name="category" value={category} onChange={onCategoryChange} checked={selectedCategories.some((item) => item.key === category.key && item.passed)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QualityCheck;
