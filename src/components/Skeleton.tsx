import React from 'react';
import clsx from 'clsx';

export const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={clsx("animate-pulse bg-slate-200 rounded-lg", className)}></div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-8 max-w-7xl mx-auto">
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <LoadingSkeleton key={i} className="h-32 rounded-xl" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <LoadingSkeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
            <LoadingSkeleton className="h-[400px] rounded-2xl" />
        </div>
    </div>
);

export const PageSkeleton = () => (
    <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
            <LoadingSkeleton className="h-8 w-1/3" />
            <LoadingSkeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <LoadingSkeleton key={i} className="h-32 rounded-xl" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton className="h-[350px] rounded-2xl" />
            <LoadingSkeleton className="h-[350px] rounded-2xl" />
        </div>
        <LoadingSkeleton className="h-[400px] w-full rounded-2xl" />
    </div>
);
