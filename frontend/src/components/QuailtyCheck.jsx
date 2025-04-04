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

    // İlk yükleme ve tesDetay değişikliği
    useEffect(() => {
        if (tesDetay?.quality_data?.criteria) {
            const existingCriteria = tesDetay.quality_data.criteria;
            const updatedCategories = categories.map(category => {
                const existingCategory = existingCriteria.find(c => c.id === category.key);
                return {
                    ...category,
                    passed: existingCategory ? existingCategory.passed : false
                };
            });
            setSelectedCategories(updatedCategories);
            setCriteria(existingCriteria);
        } else {
            const initialCategories = categories.map(category => ({
                ...category,
                passed: false
            }));
            setSelectedCategories(initialCategories);
            const initialCriteria = categories.map(category => ({
                id: category.key,
                name: category.name,
                passed: false,
                severity: "low"
            }));
            setCriteria(initialCriteria);
        }
    }, [tesDetay, setCriteria]);

    // Checkbox değişikliği
    const onCategoryChange = (e) => {
        const categoryKey = e.value.key;
        const isChecked = e.checked;
        
        const newCategories = selectedCategories.map(category =>
            category.key === categoryKey 
                ? { ...category, passed: isChecked }
                : category
        );

        const newCriteria = newCategories.map(category => ({
            id: category.key,
            name: category.name,
            passed: category.passed,
            severity: "low"
        }));

        setSelectedCategories(newCategories);
        setCriteria(newCriteria);
        onCriteriaChange(newCategories);
    };

    // Tüm seçili mi kontrolü
    useEffect(() => {
        const allPassed = selectedCategories.every(category => category.passed);
        setIsAllSelected(allPassed);
    }, [selectedCategories, setIsAllSelected]);

    return (
        <div className={`flex flex-col w-full border-2 ${isAllSelected ? 'border-green-400' : 'border-red-400'} min-h-[200px]`}>
            <div className={`flex ${isAllSelected ? 'bg-green-400' : 'bg-red-400'} justify-center py-1 mb-1 text-lg font-semibold`}>
                <h3>{isAllSelected ? 'BAŞARILI' : 'TEST'}</h3>
            </div>
            <div className="flex flex-col w-full gap-3 p-2">
                {categories.map((category) => {
                    const isChecked = selectedCategories.some(
                        item => item.key === category.key && item.passed
                    );
                    
                    return (
                        <div key={category.key} className="flex items-center justify-between w-full">
                            <label 
                                htmlFor={category.key} 
                                className="cursor-pointer flex-1"
                            >
                                {category.name}
                            </label>
                            <Checkbox 
                                inputId={category.key} 
                                name="category" 
                                value={category} 
                                onChange={onCategoryChange} 
                                checked={isChecked}
                                className="cursor-pointer"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QualityCheck;
