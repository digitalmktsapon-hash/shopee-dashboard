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
    Layers,
    CreditCard,
    Activity,
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Đa kênh', href: '/overview', icon: Layers },
    { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
    { name: 'Sản phẩm', href: '/products', icon: Package },
    { name: 'Đơn hàng', href: '/orders', icon: ShoppingBag },
    { name: 'Doanh thu', href: '/revenue', icon: TrendingUp },
    { name: 'Phí & Trợ giá', href: '/fees', icon: CreditCard },
    { name: 'Khách hàng', href: '/customers', icon: Users },
    { name: 'Vận hành', href: '/operations', icon: Activity },
    { name: 'Rủi ro', href: '/risk', icon: AlertTriangle },
    { name: 'Nguồn dữ liệu', href: '/data-sources', icon: Database },
];


export const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={clsx("animate-pulse bg-muted rounded-lg", className)}></div>
);

import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col w-72 h-screen glass-panel text-foreground fixed left-0 top-0 overflow-y-auto z-50 border-r border-border/40 text-sharp">
            {/* Logo */}
            <div className="flex items-center h-24 px-8 border-b border-border/40 gap-4">
                {/* PhamThang Agency Logo */}
                <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-2xl ring-4 ring-primary/5">
                    <img
                        src="/pts-logo.jpg"
                        alt="PhamThang PTS Logo"
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Brand Name */}
                <div className="flex flex-col mt-1">
                    <h1 className="leading-none tracking-tight flex items-baseline gap-1" style={{
                        fontWeight: 800,
                        fontSize: '18px',
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase',
                    }}>
                        <span className="text-foreground">
                            PhamThang
                        </span>
                        <span className="text-primary text-[19px]">PTS</span>
                    </h1>
                    <div className="flex flex-col mt-1.5 opacity-60">
                        <p className="text-[9px] text-muted-foreground font-medium tracking-[0.1em] uppercase">
                            Analytics Dashboard
                        </p>
                        <span className="text-[9px] text-primary/80 mt-0.5 leading-none">
                            v1.0.0
                        </span>
                    </div>
                </div>
            </div>


            <nav className="flex-1 px-4 py-8 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20"
                                    : "text-foreground/75 hover:bg-primary/10 hover:text-primary"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-foreground/55 group-hover:text-primary")} />
                            <span className="font-medium tracking-normal text-sm">{item.name}</span>
                            {isActive && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-border/40">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3.5 text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 group"
                >
                    <LogOut className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
                    <span className="font-normal text-sm">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}
