"use client";

import React from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
    onFilesUpload: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesUpload }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesUpload(Array.from(e.target.files));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/20 border-dashed rounded-2xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all relative group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                <p className="mb-2 text-sm text-foreground"><span className="font-bold">Nhấn để chọn file</span> hoặc kéo thả vào đây</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">XLSX, XLS (Báo cáo Đơn hàng)</p>
            </div>
            <input
                id="dropzone-file"
                type="file"
                multiple
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
            />
            <label htmlFor="dropzone-file" className="absolute w-full h-full cursor-pointer top-0 left-0"></label>
        </div>
    );
};
