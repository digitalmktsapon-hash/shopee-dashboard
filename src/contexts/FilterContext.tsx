"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    warehouse: string; // "All" or specific
    channelKeys: string[]; // ["all"] or ["shopee_Miền Bắc", "tiki"] etc.
    adExpenseX: number; // Global Ad Expense (X)
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setWarehouse: (wh: string) => void;
    setChannelKeys: (keys: string[]) => void;
    setAdExpenseX: (x: number) => void;
}


const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouse, setWarehouse] = useState('All');
    const [channelKeys, setChannelKeys] = useState<string[]>(['all']);
    const [adExpenseX, setAdExpenseX] = useState(0);

    return (
        <FilterContext.Provider value={{
            startDate, endDate, setStartDate, setEndDate,
            warehouse, setWarehouse,
            channelKeys, setChannelKeys,
            adExpenseX, setAdExpenseX
        }}>
            {children}
        </FilterContext.Provider>
    );
};


export const useFilter = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilter must be used within a FilterProvider');
    }
    return context;
};
