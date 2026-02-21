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
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, subValue, trend, formula, className }) => {
    return (
        <div className={`bg-card/50 backdrop-blur-md overflow-hidden rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 group ${className || ''}`}>
            <div className="p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {title}
                                {formula && <span className="ml-1 normal-case font-normal text-muted-foreground/70">({formula})</span>}
                            </dt>
                            <dd>
                                <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {subValue && (
                <div className="bg-muted/30 px-6 py-3 border-t border-border">
                    <div className="text-sm flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Chi tiết (Details)</span>
                        <span className={`font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-foreground'}`}>
                            {subValue}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
