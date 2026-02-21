"use client";

import React, { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { parseShopeeReport } from '@/utils/parser';
import { ReportFile, ShopeeOrder } from '@/utils/types';
import { Trash2, ToggleLeft, ToggleRight, FileText, Calendar, Plus, AlertCircle, CheckCircle, X, Save, Plug, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams } from 'next/navigation';

export default function DataSourcesPage() {
    const [reports, setReports] = useState<ReportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [shopeeConnected, setShopeeConnected] = useState(false);

    // Staging state for review
    const [parsedFile, setParsedFile] = useState<{ name: string, orders: ShopeeOrder[] } | null>(null);

    const { showToast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('shopee_connected') === '1') {
            setShopeeConnected(true);
            showToast('Kết nối Shopee thành công!', 'success');
        }
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            if (Array.isArray(data)) {
                setReports(data);
            } else if (data.reports) {
                setReports(data.reports);
            }
        } catch (err) {
            console.error(err);
            showToast("Không thể tải danh sách báo cáo", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleFileProcess = async (file: File) => {
        setUploading(true);
        try {
            const result = await parseShopeeReport(file);
            const { data: orders, headers } = result;

            const validOrders = orders.filter(o => o.orderId);

            if (validOrders.length === 0) {
                showToast("Không tìm thấy đơn hàng hợp lệ trong file", "error");
                console.error("Missing headers or data. Found:", headers);
                return;
            }

            // Set to staging for review
            setParsedFile({
                name: file.name,
                orders: validOrders
            });
            showToast("Đã đọc file thành công! Vui lòng xác nhận lưu.", "info");

        } catch (err) {
            console.error(err);
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
                body: JSON.stringify({ name: parsedFile.name, orders: parsedFile.orders }),
            });

            if (res.ok) {
                showToast("Lưu báo cáo thành công!", "success");
                setParsedFile(null); // Clear staging
                await fetchReports();
            } else {
                showToast("Lưu thất bại. Vui lòng thử lại.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối đến server.", "error");
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setParsedFile(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa báo cáo này? Dữ liệu sẽ mất vĩnh viễn.')) return;
        try {
            const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Đã xóa báo cáo", "success");
                await fetchReports();
            } else {
                showToast("Xóa thất bại", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi kết nối", "error");
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await fetch(`/api/reports`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                // Optimistic update or refetch
                await fetchReports();
                showToast("Đã cập nhật trạng thái", "success");
            }
        } catch (err) {
            console.error(err);
            showToast("Lỗi cập nhật", "error");
        }
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản lý Dữ liệu</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Tải lên hoặc kết nối API Shopee để đồng bộ tự động.</p>
                </div>
            </div>

            {/* Shopee API Connect Card */}
            <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <Plug className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">Kết nối Shopee Open Platform API</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Partner ID: 1220489 · Sandbox Mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {shopeeConnected && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối
                            </span>
                        )}
                        <button
                            onClick={handleConnectShopee}
                            disabled={connecting}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-bold text-sm disabled:opacity-50 shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            {connecting
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo URL...</>
                                : <><Plug className="w-4 h-4" /> {shopeeConnected ? 'Kết nối lại' : 'Authorize Test Partner'}</>
                            }
                        </button>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground space-y-1.5">
                    <p className="font-semibold text-foreground text-sm mb-2">Hướng dẫn thực hiện:</p>
                    <p>1️⃣ Trong Shopee Open Platform, mận <strong className="text-foreground">Authorize Test Partner</strong></p>
                    <p>2️⃣ Điền Redirect URL: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">http://localhost:3000/api/auth/shopee/callback</code></p>
                    <p>3️⃣ Bấm nút <strong className="text-orange-400">Authorize Test Partner</strong> ở trên → cửa sổ xác thực sẽ mở</p>
                    <p>4️⃣ Sau khi xác nhận → Shopee redirect về dashboard và hiển thị “Đã kết nối”</p>
                </div>
            </div>

            {/* Upload Area or Review Area */}
            <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border">
                {parsedFile ? (
                    <div className="animate-fade-in">
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" /> Xác nhận dữ liệu
                        </h2>
                        <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Tên File</p>
                                    <p className="font-bold text-foreground truncate" title={parsedFile.name}>{parsedFile.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Số lượng đơn</p>
                                    <p className="font-bold text-foreground">{parsedFile.orders.length} đơn hàng</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Khoảng thời gian</p>
                                    <p className="font-bold text-foreground">
                                        Tự động phát hiện
                                    </p>
                                </div>
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
                            Hỗ trợ file .xls, .xlsx xuất từ Shopee Seller Center. Dung lượng tối đa 50MB.
                        </p>
                    </>
                )}
            </div>

            {/* Reports List */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="font-bold text-foreground">Danh sách báo cáo đã lưu</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground font-bold">Đang tải dữ liệu...</div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-bold">Chưa có báo cáo nào</p>
                        <p className="text-muted-foreground text-sm mt-1 font-medium">Hãy tải lên báo cáo đầu tiên của bạn để bắt đầu phân tích.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Tên file</th>
                                    <th className="px-6 py-4">Ngày tải lên</th>
                                    <th className="px-6 py-4 text-center">Số đơn</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-foreground">{report.name}</span>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
