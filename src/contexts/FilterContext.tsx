"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    warehouse: string; // "All" or specific
    channelKey: string; // "all" | "shopee_Miền Bắc" | "tiki_" etc.
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setWarehouse: (wh: string) => void;
    setChannelKey: (key: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouse, setWarehouse] = useState('All');
    const [channelKey, setChannelKey] = useState('all');

    return (
        <FilterContext.Provider value={{ startDate, endDate, setStartDate, setEndDate, warehouse, setWarehouse, channelKey, setChannelKey }}>
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
