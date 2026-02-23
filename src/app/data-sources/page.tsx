"use client";

import React, { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { parseReportAutoDetect } from '@/utils/parser';
import { Platform, ReportFile, ShopeeOrder } from '@/utils/types';
import { Trash2, ToggleLeft, ToggleRight, FileText, Calendar, Plus, CheckCircle, X, Save, Store, Plug, RefreshCw, CheckCircle2, Package, Eye } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams } from 'next/navigation';

const PLATFORMS: { value: Platform; label: string; color: string; icon: string }[] = [
    { value: 'shopee', label: 'Shopee', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '/platforms/shopee.png' },
    { value: 'tiki', label: 'Tiki', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '/platforms/tiki.png' },
    { value: 'lazada', label: 'Lazada', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '/platforms/lazada.png' },
    { value: 'tiktok', label: 'TiktokShop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: '/platforms/tiktok.png' },
    { value: 'thuocsi', label: 'Thuocsi', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '/platforms/thuocsi.png' },
];

// Danh sách tên shop theo từng sàn
const PLATFORM_SHOPS: Partial<Record<Platform, string[]>> = {
    shopee: ['Miền Bắc', 'Miền Nam'],
    tiki: [],
    lazada: [],
    tiktok: [],
    thuocsi: [],
    other: [],
};

const REPORT_TYPES = [
    { value: 'order', label: '🛍️ Báo cáo đơn hàng (Orders)', desc: 'Phân tích doanh thu, chi phí, hoàn hàng' },
    { value: 'ads', label: '🔥 Báo cáo Ads', desc: 'Hiệu quả quảng cáo và chi phí marketing', disabled: false },
];

export const PLATFORM_BADGE_STYLE: Record<Platform, string> = {
    shopee: 'bg-orange-600 text-white',
    shopee_north: 'bg-orange-600 text-white',
    shopee_south: 'bg-orange-400 text-white',
    tiki: 'bg-blue-600 text-white',
    lazada: 'bg-[#0f0082] text-white',
    tiktok: 'bg-black text-white',
    thuocsi: 'bg-[#00a651] text-white',
    other: 'bg-muted text-muted-foreground border border-border',
};

export const PLATFORM_LABEL: Record<Platform, string> = {
    shopee: 'Shopee',
    shopee_north: 'Miền Bắc',
    shopee_south: 'Miền Nam',
    tiki: 'Tiki',
    lazada: 'Lazada',
    tiktok: 'TiktokShop',
    thuocsi: 'Thuocsi',
    other: 'Khác',
};

export default function DataSourcesPage() {
    const [reports, setReports] = useState<ReportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Staging
    const [parsedFile, setParsedFile] = useState<{ name: string, orders: ShopeeOrder[] } | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('shopee');
    const [shopName, setShopName] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [reportType, setReportType] = useState('order');

    const [connecting, setConnecting] = useState(false);
    const [shopeeConnected, setShopeeConnected] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    const { showToast } = useToast();

    useEffect(() => {
        if (searchParams?.get('shopee_connected') === '1') {
            setShopeeConnected(true);
            showToast('Kết nối Shopee thành công!', 'success');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            if (Array.isArray(data)) setReports(data);
            else if (data.reports) setReports(data.reports);
        } catch (err) {
            showToast("Không thể tải danh sách báo cáo", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const handleFileProcess = async (files: File[]) => {
        setUploading(true);
        try {
            let allOrders: ShopeeOrder[] = [];
            let lastDetectedPlatform: Platform | null = null;

            for (const file of files) {
                const { data: orders, detectedPlatform } = await parseReportAutoDetect(file);
                allOrders = [...allOrders, ...orders];
                if (detectedPlatform) lastDetectedPlatform = detectedPlatform as Platform;
            }

            const validOrders = allOrders.filter(o => o.orderId);
            if (validOrders.length === 0) {
                showToast("Không tìm thấy đơn hàng hợp lệ trong các file đã chọn", "error");
                return;
            }

            setParsedFile({
                name: files.length > 1 ? `${files.length} files (${files[0].name}...)` : files[0].name,
                orders: validOrders
            });

            if (lastDetectedPlatform && PLATFORMS.some(p => p.value === lastDetectedPlatform)) {
                // If the user selected a specific region, keep it. Otherwise auto-detect.
                if (selectedPlatform === 'shopee') {
                    setSelectedPlatform(lastDetectedPlatform);
                }
            }
            showToast(`Đã đọc ${files.length} file thành công! Tổng cộng ${validOrders.length} đơn hàng.`, "info");
        } catch (err) {
            showToast("Lỗi khi đọc file. Vui lòng kiểm tra định dạng.", "error");
        } finally {
            setUploading(false);
        }
    };

    const confirmUpload = async () => {
        if (!parsedFile) return;
        setUploading(true);
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: parsedFile.name,
                    orders: parsedFile.orders,
                    platform: selectedPlatform,
                    shopName: shopName.trim(),
                }),
            });
            if (res.ok) {
                showToast("Lưu báo cáo thành công!", "success");
                setParsedFile(null);
                setShopName('');
                setCurrentStep(1); // Reset step count after successful save
                setSelectedPlatform('shopee');
                await fetchReports();
            } else {
                showToast("Lưu thất bại. Vui lòng thử lại.", "error");
            }
        } catch (err) {
            showToast("Lỗi kết nối đến server.", "error");
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setParsedFile(null);
        setShopName('');
        // Keep selectedPlatform and currentStep intact if they just want to pick another file
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await fetch(`/api/reports?id=${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast("Đã xóa báo cáo", "success");
            await fetchReports();
            setDeleteId(null);
        } else {
            showToast("Xóa thất bại", "error");
        }
    };

    const handleToggle = async (id: string) => {
        const res = await fetch('/api/reports', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) { await fetchReports(); showToast("Đã cập nhật trạng thái", "success"); }
    };

    const handleConnectShopee = async () => {
        setConnecting(true);
        try {
            const res = await fetch('/api/auth/shopee/authorize');
            const { url, error } = await res.json();
            if (error) throw new Error(error);
            // Open in new window so user can authorize
            window.open(url, '_blank', 'width=800,height=600,scrollbars=yes');
        } catch (err: any) {
            showToast(`Lỗi: ${err.message}`, 'error');
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Dữ liệu</h1>
                <p className="text-[#64748b] mt-1 font-medium">Tải lên báo cáo từ các sàn thương mại điện tử.</p>
            </div>

            {/* Shopee API Connect Card */}
            <div className="premium-card p-6 text-sharp shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-inner">
                            <Plug className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-foreground tracking-tight text-lg">Kết nối Shopee Open Platform API</h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider opacity-60">Đồng bộ tự động dữ liệu đơn hàng 24/7</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/80 bg-muted/40 border border-border/50 px-4 py-2 rounded-2xl cursor-not-allowed uppercase tracking-widest shadow-sm">
                            <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            Đang cập nhật...
                        </span>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="premium-card p-6 shadow-2xl">
                {parsedFile ? (
                    <div className="animate-fade-in">
                        <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" /> Xác nhận thông tin báo cáo
                        </h2>

                        {/* File Info */}
                        <div className="bg-muted/50 p-4 rounded-xl border border-border mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Tên File</p>
                                <p className="font-bold text-foreground truncate" title={parsedFile.name}>{parsedFile.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Số lượng đơn</p>
                                <p className="font-bold text-foreground">{parsedFile.orders.length} đơn hàng</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Sàn đã chọn</p>
                                <p className="font-bold text-foreground">{PLATFORM_LABEL[selectedPlatform]}</p>
                            </div>
                        </div>

                        {/* Shop Name Configuration */}
                        <div className="mb-6 p-4 border border-border rounded-xl bg-card">
                            <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">
                                🏪 Khai báo Tên Shop (tuỳ chọn)
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">Điền tên shop sẽ giúp bạn lọc dữ liệu theo shop dễ dàng hơn khi có nhiều gian hàng trên cùng 1 sàn.</p>
                            <input
                                type="text"
                                value={shopName}
                                onChange={e => setShopName(e.target.value)}
                                placeholder='VD: Gian hàng Miền Bắc, Store Q7...'
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={confirmUpload}
                                disabled={uploading}
                                className="flex items-center px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-95"
                            >
                                {uploading ? 'Đang lưu...' : <><Save className="w-4 h-4 mr-2" /> Xác nhận & Lưu</>}
                            </button>
                            <button
                                onClick={cancelUpload}
                                disabled={uploading}
                                className="flex items-center px-6 py-2.5 bg-muted/50 border border-border text-muted-foreground rounded-xl hover:bg-muted transition-all font-bold active:scale-95"
                            >
                                <X className="w-4 h-4 mr-2" /> Hủy bỏ
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in relative">
                        <div className="flex items-center justify-between mb-10 relative max-w-2xl px-2">
                            {/* Line behind */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -z-10 -translate-y-1/2"></div>

                            {[
                                { step: 1, label: 'Kênh TMĐT' },
                                { step: 2, label: 'Loại báo cáo' },
                                { step: 3, label: 'Chọn file' }
                            ].map((s) => {
                                const isActive = currentStep === s.step;
                                const isPassed = currentStep > s.step;
                                return (
                                    <div key={s.step} className="flex items-center gap-3 bg-card/10 backdrop-blur-md px-4 py-2 rounded-full border border-border/20 shadow-sm transition-all duration-500">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black transition-all duration-500 ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110' : isPassed ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-muted/40 text-muted-foreground border border-border/50'}`}>
                                            {isPassed ? <CheckCircle className="w-5 h-5" strokeWidth={3} /> : s.step}
                                        </div>
                                        <span className={`text-[12px] font-black tracking-tight uppercase ${isActive || isPassed ? 'text-foreground' : 'text-muted-foreground/60'}`}>{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Wrapper for step content */}
                        <div className="bg-muted/10 p-6 rounded-2xl border border-border">
                            {/* Step 1 Content */}
                            {currentStep === 1 && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <Store className="w-4 h-4" /> BƯỚC 1 — CHỌN KÊNH THƯƠNG MẠI ĐIỆN TỬ
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        {PLATFORMS.map(p => {
                                            const selected = selectedPlatform === p.value;
                                            // Unique colors per platform as in screenshot (or close)
                                            const colors: Record<string, string> = {
                                                shopee: 'border-orange-500/50 text-orange-500 bg-orange-500/5',
                                                shopee_north: 'border-orange-600/50 text-orange-600 bg-orange-600/5',
                                                shopee_south: 'border-orange-400/50 text-orange-400 bg-orange-400/5',
                                                tiki: 'border-blue-500/50 text-blue-500 bg-blue-500/5',
                                                lazada: 'border-purple-500/50 text-purple-500 bg-purple-500/5',
                                                tiktok: 'border-pink-500/50 text-pink-500 bg-pink-500/5',
                                                thuocsi: 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5',
                                                other: 'border-muted-foreground/30 text-muted-foreground bg-muted/5'
                                            };
                                            const activeColor = p.value === 'shopee' ? 'bg-orange-500/20 border-orange-500' : 'bg-primary/20 border-primary';

                                            return (
                                                <button
                                                    key={p.value}
                                                    onClick={() => setSelectedPlatform(p.value)}
                                                    className={`h-16 rounded-2xl text-sm font-black border transition-all flex items-center px-5 gap-3 tracking-tight ${selected ? activeColor : 'bg-background/40 border-border text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-sm bg-white p-0.5">
                                                        <img src={p.icon} alt={p.label} className="w-full h-full object-contain" />
                                                    </div>
                                                    {p.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="px-6 py-2.5 bg-[#3b82f6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center"
                                    >
                                        Tiếp theo &rarr;
                                    </button>
                                </div>
                            )}

                            {/* Step 2 Content */}
                            {currentStep === 2 && (() => {
                                const availableShops = PLATFORM_SHOPS[selectedPlatform] ?? [];
                                return (
                                    <div className="animate-fade-in">
                                        <h3 className="text-xs font-bold text-muted-foreground mb-5 uppercase tracking-wider flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> 📋 BƯỚC 2 — LOẠI BÁO CÁO &amp; TÊN SHOP
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Left: Report type */}
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] mb-3">LOẠI BÁO CÁO</p>
                                                <div className="flex flex-col gap-3">
                                                    {REPORT_TYPES.map(rt => (
                                                        <button
                                                            key={rt.value}
                                                            onClick={() => setReportType(rt.value)}
                                                            className={`p-4 rounded-xl text-sm font-bold border transition-all text-left ${reportType === rt.value
                                                                ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 ring-1 ring-[#3b82f6]/20'
                                                                : 'bg-card border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/30'
                                                                }`}
                                                        >
                                                            <div className="text-foreground font-bold">{rt.label}</div>
                                                            <div className="text-xs font-normal mt-1 opacity-60">{rt.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right: Shop name */}
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] mb-3">🏪 TÊN SHOP (TUỲ CHỌN)</p>
                                                {availableShops.length > 0 ? (
                                                    <>
                                                        <div className="flex flex-col gap-3">
                                                            {availableShops.map(shop => {
                                                                const isSelected = shopName === shop;
                                                                return (
                                                                    <button
                                                                        key={shop}
                                                                        onClick={() => setShopName(isSelected ? '' : shop)}
                                                                        className={`p-4 rounded-xl text-sm font-bold border transition-all text-left ${isSelected
                                                                            ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 ring-1 ring-[#3b82f6]/20 text-foreground'
                                                                            : 'bg-card border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/30'
                                                                            }`}
                                                                    >
                                                                        {shop}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground/50 mt-2 font-medium">Bấm lại để bỏ chọn</p>
                                                    </>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={shopName}
                                                        onChange={e => setShopName(e.target.value)}
                                                        placeholder='VD: Gian hàng Miền Bắc...'
                                                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground font-semibold placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setCurrentStep(1)}
                                                className="px-6 py-2.5 bg-muted text-muted-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors active:scale-95"
                                            >
                                                &larr; Quay lại
                                            </button>
                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="px-6 py-2.5 bg-[#3b82f6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                                            >
                                                Tiếp theo &rarr;
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Step 3 Content */}
                            {currentStep === 3 && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> BƯỚC 3 — CHỌN 1 HOẶC NHIỀU FILE TẢI LÊN
                                    </h3>
                                    <UploadZone onFilesUpload={handleFileProcess} />
                                    {uploading && (
                                        <div className="mt-4 flex items-center text-[#3b82f6] text-sm font-bold animate-pulse p-3 bg-[#3b82f6]/10 rounded-xl border border-[#3b82f6]/20">
                                            <FileText className="w-4 h-4 mr-2 animate-bounce" />
                                            Hệ thống đang đọc và phân giải file... (vui lòng không tắt trang)
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground/50 font-medium tracking-wide">
                                        Bạn đang chọn upload cho: <strong className="text-foreground">{PLATFORM_LABEL[selectedPlatform]}</strong>. Hỗ trợ file .xls, .xlsx. Dung lượng tối đa 50MB.
                                    </p>

                                    <div className="mt-6">
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="px-6 py-2.5 bg-muted text-muted-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors active:scale-95"
                                        >
                                            &larr; Quay lại
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Reports List */}
            <div className="premium-card shadow-2xl overflow-hidden border-none glass-panel">
                <div className="px-8 py-5 border-b border-border/40 bg-muted/10 flex items-center justify-between text-sharp">
                    <div>
                        <h2 className="font-black text-foreground text-lg tracking-tight uppercase">Danh sách báo cáo đã lưu</h2>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-[0.1em] mt-0.5 opacity-60 uppercase">Quản lý và cập nhật trạng thái dữ liệu</p>
                    </div>
                    <span className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-[11px] font-black border border-primary/20 shadow-sm">{reports.length} BÁO CÁO</span>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground font-black animate-pulse">Đang tải dữ liệu...</div>
                ) : reports.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-muted/20 rounded-3xl flex items-center justify-center mb-6 border border-border/50 shadow-inner">
                            <FileText className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-foreground font-black text-lg">Chưa có báo cáo nào</p>
                        <p className="text-muted-foreground text-xs mt-1 font-bold opacity-60">Hãy tải lên báo cáo đầu tiên để bắt đầu phân tích dữ liệu.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <table className="w-full text-left">
                            <thead className="bg-muted/20 text-foreground/70 font-black text-[11px] uppercase tracking-[0.2em] border-b border-border/50">
                                <tr>
                                    <th className="px-4 py-4">TÊN FILE</th>
                                    <th className="px-3 py-4 text-center">SÀN & SHOP</th>
                                    <th className="px-3 py-4 text-center">LOẠI BÁO CÁO</th>
                                    <th className="px-3 py-4 text-center">NGÀY TẢI LÊN</th>
                                    <th className="px-3 py-4 text-center">SỐ ĐƠN</th>
                                    <th className="px-3 py-4 text-center">TRẠNG THÁI</th>
                                    <th className="px-4 py-4 text-right">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20 text-sm">
                                {reports.map((report) => {
                                    const plt = report.platform || 'shopee';
                                    return (
                                        <tr key={report.id} className="hover:bg-white/[0.02] transition-all duration-300 group border-b border-border/30 last:border-0 text-sharp">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30 shadow-sm flex-shrink-0">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-white text-[13px] tracking-tight truncate max-w-[200px]" title={report.name}>{report.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex-shrink-0 ${PLATFORM_BADGE_STYLE[plt]}`}>
                                                        {PLATFORM_LABEL[plt]}
                                                    </span>
                                                    {report.shopName && (
                                                        <span className="flex items-center gap-1 text-[12px] text-foreground font-bold whitespace-normal line-clamp-2 leading-tight">
                                                            <Store className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                                                            <span className="max-w-[120px]">{report.shopName}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center w-[120px]">
                                                <span className="inline-flex items-center px-2 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black tracking-widest uppercase shadow-sm">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    Đơn hàng
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center font-bold">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Calendar className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                                                    <div className="text-left leading-tight">
                                                        <div className="text-white text-[12px] font-bold">{new Date(report.uploadDate).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="text-foreground/50 text-[10px] font-medium mt-0.5">{new Date(report.uploadDate).toLocaleDateString("vi-VN")}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-white font-bold text-[13px]">
                                                    {report.orderCount ? new Intl.NumberFormat('vi-VN').format(report.orderCount) : 0}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggle(report.id)}
                                                    className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap ${report.isActive
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                                        : 'bg-muted/40 text-foreground/50 border border-border/50'
                                                        }`}
                                                >
                                                    {report.isActive ? 'ĐANG DÙNG' : 'TẮT'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleToggle(report.id)}
                                                        className="p-2 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-all duration-300 active:scale-90"
                                                        title={report.isActive ? "Tắt báo cáo" : "Bật báo cáo"}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(report.id)}
                                                        className="p-2 text-foreground/40 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 active:scale-90"
                                                        title="Xóa báo cáo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
                    <div className="relative bg-card border border-border/50 p-6 rounded-2xl shadow-2xl max-w-[400px] w-full animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-destructive/10 rounded-lg">
                                    <Trash2 className="w-5 h-5 text-destructive" />
                                </div>
                                <h2 className="text-lg font-bold text-foreground">Xác nhận xóa</h2>
                            </div>

                            <div className="space-y-1 mb-8">
                                <p className="text-muted-foreground text-sm font-medium">
                                    Bạn có chắc muốn xóa báo cáo này?
                                </p>
                                <p className="text-rose-500 text-xs font-bold">
                                    Dữ liệu sẽ mất vĩnh viễn và không thể khôi phục.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                                >
                                    Xóa
                                </button>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 px-6 py-2.5 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-all active:scale-95 font-medium"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
