"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { FilterProvider } from '../../contexts/FilterContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { Header } from './Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

import { useAuth } from '../../contexts/AuthContext';
import { Login } from '../Auth/Login';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <ThemeProvider>
                <Login />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <FilterProvider>
                <ToastProvider>
                    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
                        <Sidebar />
                        <main className="flex-1 ml-72 flex flex-col">
                            <Header />
                            <div className="p-8 overflow-x-hidden flex-1">
                                {children}
                            </div>
                            <div className="py-6 text-center text-[10px] text-muted-foreground/30 font-medium tracking-widest uppercase select-none">
                                © 2026 Bản quyền thuộc về PhamThang PTS. Cấm sao chép dưới mọi hình thức nếu không có sự chấp thuận bằng văn bản.
                            </div>
                        </main>
                    </div>
                </ToastProvider>
            </FilterProvider>
        </ThemeProvider>
    );
};
