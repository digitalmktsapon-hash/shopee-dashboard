"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, User, LogOut, ChevronDown, Bell, Store } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';


import { useFilter } from '../../contexts/FilterContext';
import { DateRangePicker } from '../DateRangePicker';
import { ReportFile, Platform } from '../../utils/types';

export const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { warehouse, setWarehouse, channelKeys, setChannelKeys } = useFilter();

    const { user, logout } = useAuth();
    const pathname = usePathname();
    const isPlatformPage = pathname.startsWith('/shopee') ||
        pathname.startsWith('/tiki') ||
        pathname.startsWith('/lazada') ||
        pathname.startsWith('/tiktokshop') ||
        pathname.startsWith('/thuocsi');

    const isGlobalView = !isPlatformPage && !pathname.startsWith('/data-sources') && !pathname.startsWith('/orders');

    const isShopeePage = pathname.startsWith('/shopee');
    const isTikiPage = pathname.startsWith('/tiki');
    const isLazadaPage = pathname.startsWith('/lazada');
    const isTiktokPage = pathname.startsWith('/tiktokshop');
    const isThuocsiPage = pathname.startsWith('/thuocsi');


    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [allChannels, setAllChannels] = useState<{ key: string; label: string; platform: string }[]>([]);
    const [displayChannels, setDisplayChannels] = useState<{ key: string; label: string }[]>([]);

    // Load available channels from uploaded reports
    useEffect(() => {
        const PLATFORM_LABEL: Record<string, string> = {
            shopee: 'Shopee', tiki: 'Tiki', lazada: 'Lazada',
            tiktok: 'TiktokShop', thuocsi: 'Thuocsi', other: 'Khác',
        };
        fetch('/api/reports')
            .then(r => r.json())
            .then((reports: ReportFile[]) => {
                const seenKeys = new Set<string>();
                const seenPlatforms = new Set<string>();
                const list: { key: string; label: string; platform: string }[] = [];

                // 1. Process platforms from reports
                reports.forEach(r => {
                    const plt = r.platform || 'shopee';
                    if (!seenPlatforms.has(plt)) {
                        seenPlatforms.add(plt);
                        list.push({ key: plt, label: `Sàn: ${PLATFORM_LABEL[plt]}`, platform: plt });
                    }
                });

                // 2. Process specific shops from reports
                reports.forEach(r => {
                    const plt = r.platform || 'shopee';
                    let sName = r.shopName?.trim();
                    if (sName) {
                        // Normalize Shopee regions: if shopName is "Shopee Miền Bắc" -> "Miền Bắc"
                        if (plt === 'shopee') {
                            if (sName.toLowerCase().includes('miền bắc')) sName = 'Miền Bắc';
                            if (sName.toLowerCase().includes('miền nam')) sName = 'Miền Nam';
                        }

                        const key = `${plt}_${sName}`;
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            list.push({
                                key,
                                label: `${PLATFORM_LABEL[plt]} · ${sName}`,
                                platform: plt
                            });
                        }
                    }
                });

                // 3. Add mandatory Shopee regions if not already present via uploads
                const regions = ['Miền Bắc', 'Miền Nam'];
                regions.forEach(region => {
                    const key = `shopee_${region}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        list.push({
                            key,
                            label: `Shopee · ${region}`,
                            platform: 'shopee'
                        });
                    }
                });


                setAllChannels(list);
            })
            .catch(() => { });
    }, []);

    // Filter displaying channels based on page
    useEffect(() => {
        if (isGlobalView) {
            setDisplayChannels([]); // No filter on global view
        } else if (isShopeePage) {
            // For Shopee page, restrict strictly to North and South
            const shopeeRegions = ['shopee_Miền Bắc', 'shopee_Miền Nam'];
            const filtered = allChannels.filter(c => shopeeRegions.includes(c.key));
            setDisplayChannels(filtered);

            // If current selection is 'all' or not in the restricted list, default to Miền Bắc
            if (channelKeys.includes('all') || !channelKeys.every(k => shopeeRegions.includes(k))) {
                setChannelKeys(['shopee_Miền Bắc']);
            }
        } else if (isTikiPage) {
            setDisplayChannels(allChannels.filter(c => c.platform === 'tiki'));
        } else if (isLazadaPage) {
            setDisplayChannels(allChannels.filter(c => c.platform === 'lazada'));
        } else if (isTiktokPage) {
            setDisplayChannels(allChannels.filter(c => c.platform === 'tiktok'));
        } else if (isThuocsiPage) {
            setDisplayChannels(allChannels.filter(c => c.platform === 'thuocsi'));
        } else {
            setDisplayChannels([]);
        }
    }, [allChannels, pathname, isGlobalView, isShopeePage, isTikiPage, isLazadaPage, isTiktokPage, isThuocsiPage, channelKeys, setChannelKeys]);


    // Mock Notifications State
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Dữ liệu tháng 10 đã được cập nhật",
            message: "Hệ thống đã tự động đồng bộ 1,250 đơn hàng mới từ Shopee.",
            time: "2 giờ trước",
            read: false,
            type: "success"
        },
        {
            id: 2,
            title: "Cảnh báo: Tỷ lệ hoàn hàng cao",
            message: "Kho HCM đang có tỷ lệ hoàn hàng > 5% trong 3 ngày qua. Vui lòng kiểm tra vận hành.",
            time: "5 giờ trước",
            read: false,
            type: "warning"
        },
        {
            id: 3,
            title: "Tính năng mới: Phân tích CFO",
            message: "Báo cáo tài chính chuyên sâu đã được thêm vào Dashboard.",
            time: "1 ngày trước",
            read: true,
            type: "info"
        },
        {
            id: 4,
            title: "Bảo trì hệ thống",
            message: "Hệ thống sẽ bảo trì định kỳ vào 00:00 ngày 20/02 để nâng cấp server.",
            time: "2 ngày trước",
            read: true,
            type: "info"
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <header className="px-8 py-4 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-20 border-b border-border/50 transition-colors duration-300">
            {/* Left Title */}
            <div className="flex-1 flex items-center">
                <span className="text-xl font-black text-[#06b6d4] uppercase tracking-[0.05em] drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    QUẢN TRỊ KÊNH TMĐT ĐA NỀN TẢNG
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Channel Selector - Show when we have channels to display */}
                {displayChannels.length > 0 && !isGlobalView && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-card/40 backdrop-blur-md rounded-xl border border-white/5 shadow-inner group">
                        <Store className="w-4 h-4 text-primary/70" />
                        <select
                            value={channelKeys[0] || ''}
                            onChange={e => setChannelKeys([e.target.value])}
                            className="bg-card text-sm font-semibold text-foreground focus:outline-none cursor-pointer max-w-[180px] dark:[color-scheme:dark]"
                        >
                            {isShopeePage ? (
                                displayChannels.map(c => (
                                    <option key={c.key} value={c.key}>{c.label}</option>
                                ))
                            ) : (
                                <>
                                    <option value="all">Tất cả shop</option>
                                    {displayChannels.map(c => (
                                        <option key={c.key} value={c.key}>{c.label}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                )}


                <div className="h-6 w-px bg-border"></div>

                {/* Date Range Picker */}
                <DateRangePicker />

                <div className="h-6 w-px bg-border"></div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                    title={theme === 'dark' ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsDropdownOpen(false); }}
                        className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-20"
                                onClick={() => setIsNotificationOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover border border-border rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
                                    <h3 className="font-semibold text-sm">Thông báo</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Đánh dấu đã đọc
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className={clsx("px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 border-b border-border/50 last:border-0", !notif.read && "bg-primary/5")}>
                                            <div className={clsx("mt-1 w-2 h-2 rounded-full flex-shrink-0", !notif.read ? "bg-primary" : "bg-transparent")}></div>
                                            <div className="flex-1">
                                                <p className={clsx("text-sm font-medium text-foreground", !notif.read && "font-bold")}>{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-snug">{notif.message}</p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-2">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-border bg-muted/30 text-center">
                                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Xem tất cả thông báo</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-6 w-px bg-border mx-2"></div>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted/50 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{user?.displayName || 'Admin'}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{user?.role || ''}</p>
                        </div>
                        <ChevronDown className={clsx("w-4 h-4 text-muted-foreground transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-20"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-3 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-bold text-foreground">{user?.displayName || 'Tài khoản'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                                </div>
                                <button
                                    onClick={() => { toggleTheme(); setIsDropdownOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-muted transition-colors text-left"
                                >
                                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    Chế độ: {theme === 'dark' ? 'Tối' : 'Sáng'}
                                </button>
                                <button
                                    onClick={() => { logout(); setIsDropdownOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left mt-1"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Đăng xuất
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
