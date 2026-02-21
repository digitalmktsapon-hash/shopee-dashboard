"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, subMonths, isSameDay, startOfWeek, endOfWeek, startOfYear, endOfYear, endOfMonth, isSameWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, SelectionMode } from './ui/Calendar';
import { useFilter } from '../contexts/FilterContext';
import clsx from 'clsx';

type Preset = {
    label: string;
    getValue: () => { from: Date; to: Date };
};

const PRESETS: Preset[] = [
    { label: 'Hôm nay', getValue: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Hôm qua', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
    { label: '7 ngày qua', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: '30 ngày qua', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
];

export const DateRangePicker = () => {
    const { startDate, endDate, setStartDate, setEndDate } = useFilter();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<SelectionMode>('day');
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // State for temporary selection inside the picker
    const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
    });

    // View state for calendar (which months are visible)
    const [viewDate, setViewDate] = useState(new Date());

    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load sync
    useEffect(() => {
        if (startDate && endDate) {
            setRange({ from: new Date(startDate), to: new Date(endDate) });
            // Optionally set viewDate here if needed
        }
    }, [startDate, endDate, isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectDate = (date: Date) => {
        if (mode === 'day') {
            if (!range.from || (range.from && range.to)) {
                // Start new selection
                setRange({ from: date, to: undefined });
            } else {
                // Complete selection
                if (date < range.from) {
                    setRange({ from: date, to: range.from });
                } else {
                    setRange({ from: range.from, to: date });
                }
            }
        } else if (mode === 'week') {
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const end = endOfWeek(date, { weekStartsOn: 1 });
            setRange({ from: start, to: end });
        } else if (mode === 'month') {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            setRange({ from: start, to: end });
        } else if (mode === 'year') {
            const start = startOfYear(date);
            const end = endOfYear(date);
            setRange({ from: start, to: end });
        }
    };

    const handlePresetClick = (preset: Preset) => {
        const newRange = preset.getValue();
        setRange(newRange);
        setMode('day'); // Reset to day if a preset is clicked
    };

    const handleApply = () => {
        if (range.from && range.to) {
            setStartDate(format(range.from, 'yyyy-MM-dd'));
            setEndDate(format(range.to, 'yyyy-MM-dd'));
        }
        setIsOpen(false);
    };

    const formatDateRange = () => {
        if (!startDate || !endDate) return "Chọn khoảng thời gian";
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
    };

    const getModeLabel = () => {
        switch (mode) {
            case 'week': return 'Theo tuần';
            case 'month': return 'Theo tháng';
            case 'year': return 'Theo năm';
            default: return 'Khung Thời Gian';
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
            >
                <span className="text-sm font-medium text-muted-foreground mr-2 border-r border-border pr-3">
                    {getModeLabel()}
                </span>
                <span className="text-sm font-medium text-foreground">
                    {formatDateRange()} <span className="text-xs text-muted-foreground ml-1">(GMT+07)</span>
                </span>
                <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-[120%] z-50 bg-popover border border-border rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Sidebar Modes & Presets */}
                    <div className="w-[180px] border-b md:border-b-0 md:border-r border-border p-2 bg-muted/20 flex flex-col gap-1 overflow-y-auto max-h-[500px]">
                        {/* Quick Selects */}
                        <div className="mb-2">
                            {PRESETS.map((preset) => {
                                const presetVal = preset.getValue();
                                const isActive = range.from && range.to &&
                                    isSameDay(range.from, presetVal.from) &&
                                    isSameDay(range.to, presetVal.to);

                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset)}
                                        className={clsx(
                                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                                            isActive
                                                ? "text-primary font-bold"
                                                : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-px bg-border my-1 mx-2" />

                        {/* Modes */}
                        <div className="mt-2 text-foreground">
                            {(['day', 'week', 'month', 'year'] as SelectionMode[]).map((m) => {
                                const labels: Record<SelectionMode, string> = {
                                    day: 'Theo ngày',
                                    week: 'Theo tuần',
                                    month: 'Theo tháng',
                                    year: 'Theo năm'
                                };
                                const isActive = mode === m;
                                return (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={clsx(
                                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between",
                                            isActive
                                                ? "bg-primary/5 text-primary font-bold"
                                                : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        {labels[m]}
                                        <ChevronDown className={clsx("w-4 h-4 -rotate-90", isActive ? "opacity-100" : "opacity-0")} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Calendars */}
                    <div className="p-4">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Left Calendar */}
                            <Calendar
                                month={subMonths(viewDate, 1)}
                                selectedRange={range}
                                onSelectDate={handleSelectDate}
                                onPrevMonth={mode === 'year' || mode === 'month' ? undefined : () => setViewDate(subMonths(viewDate, 1))}
                                showNav={mode === 'day' || mode === 'week'}
                                mode={mode}
                                hoverDate={hoverDate}
                                onHoverDate={setHoverDate}
                            />
                            {/* Separator only visible if showing 2 calendars */}
                            {(mode === 'day' || mode === 'week') && (
                                <>
                                    <div className="w-px bg-border hidden md:block" />
                                    {/* Right Calendar */}
                                    <Calendar
                                        month={viewDate}
                                        selectedRange={range}
                                        onSelectDate={handleSelectDate}
                                        onNextMonth={() => setViewDate(addMonths(viewDate, 1))}
                                        showNav={true}
                                        mode={mode}
                                        hoverDate={hoverDate}
                                        onHoverDate={setHoverDate}
                                    />
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="text-sm font-medium text-foreground">
                                {range.from ? format(range.from, 'dd/MM/yyyy', { locale: vi }) : '...'}
                                {' - '}
                                {range.to ? format(range.to, 'dd/MM/yyyy', { locale: vi }) : '...'}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20 transition-all"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for addMonths import if missing above
function addMonths(date: Date, amount: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + amount);
    return d;
}
