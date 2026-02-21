"use client";

import React, { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { parseShopeeReport } from '@/utils/parser';
import { Platform, ReportFile, ShopeeOrder } from '@/utils/types';
import { Trash2, ToggleLeft, ToggleRight, FileText, Calendar, Plus, CheckCircle, X, Save, Store } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
    { value: 'shopee', label: 'Shopee', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'tiki', label: 'Tiki', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'lazada', label: 'Lazada', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'tiktok', label: 'TiktokShop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { value: 'thuocsi', label: 'Thuocsi', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'other', label: 'Khác', color: 'bg-muted text-muted-foreground border-border' },
];

export const PLATFORM_BADGE_STYLE: Record<Platform, string> = {
    shopee: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    tiki: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    lazada: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    tiktok: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
    thuocsi: 'bg-green-500/15 text-green-400 border border-green-500/30',
    other: 'bg-muted text-muted-foreground border border-border',
};

export const PLATFORM_LABEL: Record<Platform, string> = {
    shopee: 'Shopee',
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

    const { showToast } = useToast();

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

    const handleFileProcess = async (file: File) => {
        setUploading(true);
        try {
            const { data: orders } = await parseShopeeReport(file);
            const validOrders = orders.filter(o => o.orderId);
            if (validOrders.length === 0) {
                showToast("Không tìm thấy đơn hàng hợp lệ trong file", "error");
                return;
            }
            setParsedFile({ name: file.name, orders: validOrders });
            showToast("Đã đọc file thành công! Vui lòng xác nhận thông tin.", "info");
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
        setSelectedPlatform('shopee');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa báo cáo này? Dữ liệu sẽ mất vĩnh viễn.')) return;
        const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
        if (res.ok) { showToast("Đã xóa báo cáo", "success"); await fetchReports(); }
        else showToast("Xóa thất bại", "error");
    };

    const handleToggle = async (id: string) => {
        const res = await fetch('/api/reports', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (res.ok) { await fetchReports(); showToast("Đã cập nhật trạng thái", "success"); }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quản lý Dữ liệu</h1>
                <p className="text-muted-foreground mt-1 font-medium">Tải lên báo cáo từ các sàn thương mại điện tử.</p>
            </div>

            {/* Upload Area */}
            <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border">
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
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Loại file</p>
                                <p className="font-bold text-foreground">Shopee Excel Report</p>
                            </div>
                        </div>

                        {/* Platform & Shop Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Platform */}
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">
                                    🛒 Chọn Sàn
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => setSelectedPlatform(p.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedPlatform === p.value
                                                ? p.color + ' ring-2 ring-offset-2 ring-offset-background ring-current scale-105'
                                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Shop Name */}
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">
                                    🏪 Tên Shop (tuỳ chọn)
                                </label>
                                <input
                                    type="text"
                                    value={shopName}
                                    onChange={e => setShopName(e.target.value)}
                                    placeholder='VD: Miền Bắc, Miền Nam...'
                                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                />
                            </div>
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
                    <>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Tải lên báo cáo mới
                        </h2>
                        <UploadZone onFileUpload={handleFileProcess} />
                        {uploading && (
                            <div className="mt-4 flex items-center text-primary text-sm font-bold animate-pulse">
                                <FileText className="w-4 h-4 mr-2" />
                                Đang đọc và xử lý file...
                            </div>
                        )}
                        <p className="mt-4 text-xs text-muted-foreground font-medium">
                            Hỗ trợ file .xls, .xlsx từ Shopee, Tiki, Lazada, TiktokShop, Thuocsi. Dung lượng tối đa 50MB.
                        </p>
                    </>
                )}
            </div>

            {/* Reports List */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Danh sách báo cáo đã lưu</h2>
                    <span className="text-xs text-muted-foreground font-medium">{reports.length} báo cáo</span>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground font-bold">Đang tải dữ liệu...</div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-bold">Chưa có báo cáo nào</p>
                        <p className="text-muted-foreground text-sm mt-1 font-medium">Hãy tải lên báo cáo đầu tiên để bắt đầu phân tích.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Tên file</th>
                                    <th className="px-6 py-4">Sàn & Shop</th>
                                    <th className="px-6 py-4">Ngày tải lên</th>
                                    <th className="px-6 py-4 text-center">Số đơn</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {reports.map((report) => {
                                    const plt = report.platform || 'shopee';
                                    return (
                                        <tr key={report.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-foreground max-w-[200px] truncate" title={report.name}>{report.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide w-fit ${PLATFORM_BADGE_STYLE[plt]}`}>
                                                        {PLATFORM_LABEL[plt]}
                                                    </span>
                                                    {report.shopName && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                                            <Store className="w-3 h-3" />{report.shopName}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    {new Date(report.uploadDate).toLocaleDateString("vi-VN", {
                                                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-center font-bold font-mono">
                                                {report.orderCount ? new Intl.NumberFormat('vi-VN').format(report.orderCount) : 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggle(report.id)}
                                                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${report.isActive
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                        : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                                                        }`}
                                                >
                                                    {report.isActive ? 'Đang dùng' : 'Tắt'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button
                                                        onClick={() => handleToggle(report.id)}
                                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                        title={report.isActive ? "Tắt báo cáo" : "Bật báo cáo"}
                                                    >
                                                        {report.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(report.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                                        title="Xóa báo cáo"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
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
        </div>
    );
}
