"use client";

import React from 'react';
import { Package, Construction } from 'lucide-react';

export default function PlatformPlaceholder({ name }: { name: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card/20 rounded-3xl border border-border/50 backdrop-blur-sm">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
                <Construction className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Modul {name}</h2>
            <p className="text-muted-foreground mb-8 max-w-md font-medium">
                Hệ thống đang được xây dựng modul tính toán riêng cho sàn {name}. Dữ liệu sẽ sớm được cập nhật.
            </p>
            <div className="flex gap-4">
                <div className="px-6 py-2 bg-muted/30 rounded-full text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Coming Soon
                </div>
            </div>
        </div>
    );
}
