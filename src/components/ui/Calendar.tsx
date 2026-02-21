"use client";

import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    addMonths,
    subMonths,
    isValid,
    startOfYear,
    endOfYear,
    eachMonthOfInterval
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export type SelectionMode = 'day' | 'week' | 'month' | 'year';

interface CalendarProps {
    month: Date;
    selectedRange: { from: Date | undefined; to: Date | undefined };
    onSelectDate: (date: Date) => void;
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
    showNav?: boolean;
    mode?: SelectionMode;
    hoverDate?: Date | null;
    onHoverDate?: (date: Date | null) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
    month,
    selectedRange,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
    showNav = true,
    mode = 'day',
    hoverDate = null,
    onHoverDate = () => { }
}) => {
    // Generate days
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    // For Month/Year mode navigation
    const yearStart = startOfYear(month);
    const yearEnd = endOfYear(month);
    const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // Generate years for Year mode (e.g., current year and 11 previous years)
    const currentYear = month.getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 11 + i);

    const getHoverRange = (date: Date | null): { start: Date, end: Date } | null => {
        if (!date) return null;
        if (mode === 'week') return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
        if (mode === 'month') return { start: startOfMonth(date), end: endOfMonth(date) };
        if (mode === 'year') return { start: startOfYear(date), end: endOfYear(date) };
        return null; // day mode doesn't need hover range area like this, regular selection handles it
    };

    const hoverRange = getHoverRange(hoverDate);

    // Helpers to check if a date is within hover/selected range
    const isDateInRange = (date: Date, range: { from: Date | undefined, to: Date | undefined } | { start: Date, end: Date } | null) => {
        if (!range) return false;
        const from = 'from' in range ? range.from : range.start;
        const to = 'to' in range ? range.to : range.end;
        if (!from || !to) return false;
        return isWithinInterval(date, { start: from, end: to });
    };

    const renderHeader = () => {
        let title = format(month, 'MMMM - yyyy', { locale: vi });
        if (mode === 'year') {
            title = `${years[0]} - ${years[years.length - 1]}`;
        } else if (mode === 'month') {
            title = format(month, 'yyyy', { locale: vi });
        }

        return (
            <div className="flex items-center justify-between mb-4">
                {showNav && onPrevMonth ? (
                    <button onClick={onPrevMonth} className="p-1 hover:bg-muted rounded-md text-foreground">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                ) : <div className="w-6" />}

                <span className="font-semibold text-foreground capitalize">
                    {title}
                </span>

                {showNav && onNextMonth ? (
                    <button onClick={onNextMonth} className="p-1 hover:bg-muted rounded-md text-foreground">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                ) : <div className="w-6" />}
            </div>
        );
    };

    const renderDaysGrid = () => (
        <>
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day: Date, idx: number) => {
                    const isSelected = (selectedRange.from && isSameDay(day, selectedRange.from)) ||
                        (selectedRange.to && isSameDay(day, selectedRange.to));

                    const isInRange = isDateInRange(day, selectedRange);
                    const isHovered = hoverRange ? isDateInRange(day, hoverRange) : false;

                    const isCurrentMonth = isSameMonth(day, month);

                    return (
                        <div key={idx} className="relative p-[1px]"
                            onMouseEnter={() => onHoverDate(day)}
                            onMouseLeave={() => onHoverDate(null)}
                        >
                            {(isInRange || isHovered) && !isSelected && (
                                <div className={clsx("absolute inset-y-[1px] inset-x-0 cursor-pointer pointer-events-none", isHovered ? "bg-muted" : "bg-primary/20")} />
                            )}
                            {isSelected && selectedRange.to && isSameDay(day, selectedRange.from!) && (
                                <div className="absolute inset-y-[1px] left-0 right-0 bg-primary/20 rounded-l-md" />
                            )}
                            {isSelected && selectedRange.from && isSameDay(day, selectedRange.to!) && (
                                <div className="absolute inset-y-[1px] left-0 right-0 bg-primary/20 rounded-r-md" />
                            )}
                            {/* Hover caps for week mode across ends */}
                            {isHovered && mode === 'week' && hoverRange && isSameDay(day, hoverRange.start) && (
                                <div className="absolute inset-y-[1px] left-0 right-0 bg-muted rounded-l-md pointer-events-none" />
                            )}
                            {isHovered && mode === 'week' && hoverRange && isSameDay(day, hoverRange.end) && (
                                <div className="absolute inset-y-[1px] left-0 right-0 bg-muted rounded-r-md pointer-events-none" />
                            )}


                            <button
                                onClick={() => onSelectDate(day)}
                                className={clsx(
                                    "relative w-full h-8 text-sm flex items-center justify-center rounded-md transition-all z-10",
                                    !isCurrentMonth && "text-muted-foreground/30",
                                    isCurrentMonth && !isSelected && !isInRange && !isHovered && "text-foreground hover:bg-muted",
                                    (isInRange || isHovered) && !isSelected && "text-foreground",
                                    isSelected && "bg-primary text-primary-foreground font-bold shadow-md"
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );

    const renderMonthsGrid = () => (
        <div className="grid grid-cols-3 gap-2 mt-4">
            {monthsInYear.map((m, idx) => {
                const isSelected = selectedRange.from && selectedRange.to && isSameMonth(m, selectedRange.from) && isSameMonth(m, selectedRange.to);
                return (
                    <button
                        key={idx}
                        onClick={() => onSelectDate(m)}
                        className={clsx(
                            "py-4 text-sm font-medium rounded-lg transition-all",
                            isSelected ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
                        )}
                    >
                        Tháng {format(m, 'M')}
                    </button>
                )
            })}
        </div>
    );

    const renderYearsGrid = () => (
        <div className="grid grid-cols-3 gap-2 mt-4">
            {years.map((y, idx) => {
                const dateRepresentingYear = new Date(y, 0, 1);
                const isSelected = selectedRange.from && selectedRange.to && selectedRange.from.getFullYear() === y && selectedRange.to.getFullYear() === y;
                return (
                    <button
                        key={idx}
                        onClick={() => onSelectDate(dateRepresentingYear)}
                        className={clsx(
                            "py-4 text-sm font-medium rounded-lg transition-all",
                            isSelected ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted"
                        )}
                    >
                        {y}
                    </button>
                )
            })}
        </div>
    );

    return (
        <div className="p-4 w-[320px]">
            {renderHeader()}
            {(mode === 'day' || mode === 'week') && renderDaysGrid()}
            {mode === 'month' && renderMonthsGrid()}
            {mode === 'year' && renderYearsGrid()}
        </div>
    );
};
