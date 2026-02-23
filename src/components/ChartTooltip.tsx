"use client";

import { formatDateVN } from '../utils/format';

interface ChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    formatter?: (value: number, name: string) => string;
    hideLabel?: boolean;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, formatter, hideLabel }) => {
    if (active && payload && payload.length) {
        const formattedLabel = label ? formatDateVN(label) : label;
        return (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xl text-sm z-50 ring-1 ring-slate-900/5">
                {!hideLabel && <p className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{formattedLabel}</p>}
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color || entry.payload?.fill }}
                            />
                            <span className="text-slate-600 font-medium">
                                {entry.name}:
                            </span>
                        </div>
                        <span className="font-bold text-slate-950">
                            {formatter ? formatter(entry.value, entry.name) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
