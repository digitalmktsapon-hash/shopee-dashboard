"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    warehouse: string; // "All" or specific
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setWarehouse: (wh: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    // Default to last 30 days? Or empty?
    // Let's default to empty (All Time) or reasonable default.
    // For now, let's leave empty strings as "No Filter"
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouse, setWarehouse] = useState('All');

    return (
        <FilterContext.Provider value={{ startDate, endDate, setStartDate, setEndDate, warehouse, setWarehouse }}>
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
