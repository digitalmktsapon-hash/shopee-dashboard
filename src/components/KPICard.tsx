import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, if not I'll just use template literals or classNames

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    formula?: string;
    className?: string;
    color?: 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'indigo';
}

const COLOR_MAP = {
    blue: {
        icon: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
        value: "text-foreground",
        accent: "border-blue-500/20",
        subValue: "text-blue-500 bg-blue-500/10"
    },
    emerald: {
        icon: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]",
        value: "text-foreground",
        accent: "border-emerald-500/20",
        subValue: "text-emerald-500 bg-emerald-500/10"
    },
    violet: {
        icon: "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]",
        value: "text-foreground",
        accent: "border-violet-500/20",
        subValue: "text-violet-500 bg-violet-500/10"
    },
    rose: {
        icon: "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(244,63,94,0.5)]",
        value: "text-foreground",
        accent: "border-rose-500/20",
        subValue: "text-rose-500 bg-rose-500/10"
    },
    amber: {
        icon: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]",
        value: "text-foreground",
        accent: "border-amber-500/20",
        subValue: "text-amber-500 bg-amber-500/10"
    },
    indigo: {
        icon: "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]",
        value: "text-foreground",
        accent: "border-indigo-500/20",
        subValue: "text-indigo-500 bg-indigo-500/10"
    },
} as const;

export const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, subValue, trend, formula, className, color = 'blue' }) => {
    const theme = COLOR_MAP[color];

    return (
        <div className={cn(
            "premium-card flex flex-col group overflow-hidden border transition-all duration-300",
            theme.accent,
            "hover:bg-white/[0.02]",
            className
        )}>
            <div className="p-5 flex-1 text-sharp">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-base font-black text-muted-foreground/60 uppercase tracking-wider mb-2 transition-colors group-hover:text-foreground/90">
                            {title}
                        </p>
                        <div className={cn("text-2xl font-black tracking-tight drop-shadow-sm transition-all duration-300", theme.value)}>
                            {value}
                        </div>
                        {formula && (
                            <p className="text-[9px] text-muted-foreground/40 font-medium mt-1.5 max-w-[160px] leading-tight group-hover:text-muted-foreground/60 transition-colors">
                                {formula}
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        "p-2.5 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center shrink-0",
                        theme.icon
                    )}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                </div>
            </div>
            {subValue && (
                <div className="px-5 py-3.5 bg-muted/10 border-t border-border/30 flex items-center justify-between text-sharp transition-colors group-hover:bg-muted/15">
                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.15em]">Metric Lần Trước</span>
                    <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm",
                        trend === 'up' ? "bg-emerald-500/10 text-emerald-500" :
                            trend === 'down' ? "bg-rose-500/10 text-rose-500" :
                                theme.subValue
                    )}>
                        {trend === 'up' && <span className="text-[8px]">▲</span>}
                        {trend === 'down' && <span className="text-[8px]">▼</span>}
                        {subValue}
                    </span>
                </div>
            )}
        </div>
    );
};
