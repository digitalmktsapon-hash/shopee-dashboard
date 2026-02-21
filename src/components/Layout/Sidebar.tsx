"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    LayoutDashboard,
    Database,
    ShoppingBag,
    TrendingUp,
    Package,
    ShoppingCart,
    Receipt,
    Truck,
    Users,
    AlertTriangle,
    BarChart3,
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Đa kênh', href: '/overview', icon: BarChart3 },
    { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
    { name: 'Doanh thu', href: '/revenue', icon: TrendingUp },
    { name: 'Sản phẩm', href: '/products', icon: Package },
    { name: 'Đơn hàng', href: '/orders', icon: ShoppingCart },
    { name: 'Phí & Trợ giá', href: '/fees', icon: Receipt },
    { name: 'Vận hành', href: '/operations', icon: Truck },
    { name: 'Khách hàng', href: '/customers', icon: Users },
    { name: 'Rủi ro', href: '/risk', icon: AlertTriangle },
    { name: 'Nguồn dữ liệu', href: '/data-sources', icon: Database },
];


export const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={clsx("animate-pulse bg-slate-800/50 rounded-lg", className)}></div>
);

import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col w-72 h-screen bg-card/80 backdrop-blur-lg text-foreground fixed left-0 top-0 overflow-y-auto shadow-2xl z-50 border-r border-border">
            {/* Logo */}
            <div className="flex items-center h-24 px-6 border-b border-border gap-3">
                {/* PhamThang Agency Logo */}
                <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md">
                    <img
                        src="/pts-logo.jpg"
                        alt="PhamThang PTS Logo"
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Brand Name */}
                <div>
                    <h1 className="text-foreground leading-none" style={{
                        fontFamily: "'Helvetica Neue', 'Arial', 'Segoe UI', sans-serif",
                        fontWeight: 900,
                        fontSize: '16px',
                        letterSpacing: '0.06em',
                        fontStyle: 'normal',
                        textTransform: 'uppercase',
                    }}>
                        <span style={{ color: 'hsl(var(--primary))' }}>Pham</span><span>Thang</span>
                        {' '}
                        <span style={{ color: 'hsl(var(--primary))' }}>PTS</span>
                    </h1>
                    <p className="text-muted-foreground font-bold mt-1" style={{
                        fontSize: '8.5px',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                    }}>Analytics Dashboard v1.0.0</p>
                </div>
            </div>


            <nav className="flex-1 px-4 py-8 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-foreground shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                            )}
                            <item.icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className="font-medium tracking-wide text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-border">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium tracking-wide text-sm">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}
