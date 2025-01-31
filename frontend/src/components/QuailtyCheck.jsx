import { useState, useEffect } from 'react';
import { Checkbox } from 'primereact/checkbox';

const QuailtyCheck = () => {
    const categories = [
        { name: 'Seri ve Renk', key: 'A' },
        { name: 'İç ve Dış Yüzey', key: 'B' },
        { name: 'Aksesuar Seçimi', key: 'C' },
        { name: 'Kanat Baskısı', key: 'D' }
    ];
    const [selectedCategories, setSelectedCategories] = useState([categories[1]]);
    const [isAllSelected, setIsAllSelected] = useState(false);

    const onCategoryChange = (e) => {
        let _selectedCategories = [...selectedCategories];

        if (e.checked)
            _selectedCategories.push(e.value);
        else
            _selectedCategories = _selectedCategories.filter(category => category.key !== e.value.key);

        setSelectedCategories(_selectedCategories);
    };

    useEffect(() => {
        setIsAllSelected(selectedCategories.length === categories.length);
    }, [selectedCategories]);

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
                            <Checkbox className="" inputId={category.key} name="category" value={category} onChange={onCategoryChange} checked={selectedCategories.some((item) => item.key === category.key)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuailtyCheck;
