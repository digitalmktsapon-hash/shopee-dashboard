"use client";

import React from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
    onFileUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Nhấn để chọn file</span> hoặc kéo thả vào đây</p>
                <p className="text-xs text-gray-500">XLSX hoặc XLS (Báo cáo Shopee)</p>
            </div>
            <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
            />
            <label htmlFor="dropzone-file" className="absolute w-full h-full cursor-pointer top-0 left-0"></label>
        </div>
    );
};
