"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
    username: string;
    displayName: string;   // "Trưởng BP TMĐT" — hiển thị trên tiêu đề header
    role: string;          // "Quản lý Shop" — dòng phụ dưới avatar
    email: string;
    title: string;         // Tiêu đề ở left header, VD: "Quản trị kênh TMĐT đa nền tảng"
}

// Danh sách user — mở rộng thêm tài khoản ở đây
const USER_PROFILES: Record<string, { password: string } & UserProfile> = {
    admin: {
        password: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: 'Quản lý Shop',
        email: 'digitalmkt.sapon@gmail.com',
        title: 'Quản trị kênh TMĐT đa nền tảng',
    },
    pts: {
        password: 'pts2024',
        username: 'pts',
        displayName: 'PhamThang PTS',
        role: 'Giám đốc điều hành',
        email: 'pts@phamthang-pts.com',
        title: 'Quản trị kênh TMĐT đa nền tảng',
    },
};

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useEffect(() => {
        const storedAuth = localStorage.getItem('shopee_dashboard_auth');
        const storedUser = localStorage.getItem('shopee_dashboard_user');
        if (storedAuth === 'true' && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch { }
        }
        setIsInitialized(true);
    }, []);

    const login = (username: string, password: string): boolean => {
        const profile = USER_PROFILES[username.toLowerCase()];
        if (profile && profile.password === password) {
            const { password: _, ...userProfile } = profile;
            setIsAuthenticated(true);
            setUser(userProfile);
            localStorage.setItem('shopee_dashboard_auth', 'true');
            localStorage.setItem('shopee_dashboard_user', JSON.stringify(userProfile));
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('shopee_dashboard_auth');
        localStorage.removeItem('shopee_dashboard_user');
    };

    if (!isInitialized) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
