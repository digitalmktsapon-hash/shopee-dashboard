"use client";

import React, { useEffect, useState } from 'react';
import { calculateMetrics, filterOrders } from '../../utils/calculator';
import { MetricResult, ShopeeOrder, OrderRiskAnalysis } from '../../utils/types';
import {
    AlertTriangle,
    Search,
    TrendingDown,
    ShieldAlert,
    DollarSign,
    Info,
    ChevronRight,
    ArrowRight,
    Filter,
    ShoppingBag,
    Skull
} from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatVND, formatNumber } from '../../utils/format';
import clsx from 'clsx';

export default function RiskControlPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { startDate, endDate, warehouse, channelKey } = useFilter();

    const [selectedOrder, setSelectedOrder] = useState<OrderRiskAnalysis | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof OrderRiskAnalysis, direction: 'asc' | 'desc' } | null>({ key: 'riskImpactScore', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/orders?channel=' + channelKey);
                const orders: ShopeeOrder[] = await res.json();

                const filtered = filterOrders(orders, startDate, endDate, warehouse);
                if (filtered.length > 0) {
                    setMetrics(calculateMetrics(filtered));
                } else {
                    setMetrics(null);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate, warehouse, channelKey]);

    if (loading) return <PageSkeleton />;

    if (!metrics || !metrics.riskAnalysis || metrics.riskAnalysis.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <ShieldAlert className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu rủi ro (đã lọc)</p>
                <p className="text-xs mt-1">Hệ thống đang hoạt động an toàn hoặc không có dữ liệu đơn hàng.</p>
            </div>
        );
    }

    // Filter
    let filteredRisks = metrics.riskAnalysis.filter(r => {
        const matchesSearch =
            r.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.trackingNumber && r.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
    });

    // Sort
    if (sortConfig !== null) {
        filteredRisks.sort((a, b) => {
            // @ts-ignore
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            // @ts-ignore
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const requestSort = (key: keyof OrderRiskAnalysis) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const stats = metrics.riskStats;

    const getRootCauseLabel = (code: string) => {
        switch (code) {
            case 'A': return 'Voucher Shop';
            case 'B': return 'Phí sàn';
            case 'C': return 'Phí cố định';
            case 'D': return 'Giá vốn';
            case 'E': return 'Tổ hợp';
            default: return 'Khác';
        }
    };

    const getWarningLevelUI = (level: string) => {
        switch (level) {
            case 'DANGER': return { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', label: 'Nguy hiểm', icon: Skull };
            case 'WARNING': return { color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', label: 'Cảnh báo', icon: AlertTriangle };
            case 'MONITOR': return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Theo dõi', icon: Info };
            default: return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: 'An toàn', icon: ShieldAlert };
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20 relative">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-rose-500" />
                            Kiểm Soát Rủi Ro Đơn Hàng
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Phân tích sâu biên lợi nhuận, chi phí quảng cáo và vận hành trên từng đơn hàng.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Tìm theo Mã đơn hàng, Vận đơn..."
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-[350px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ===== #1 PRIORITY: COST CONTROL KPI ===== */}
            {(() => {
                const s = metrics.riskStats;
                const base = s.totalListRevenue > 0 ? s.totalListRevenue : 1;
                const sellerPct = (s.totalSellerRebate / base) * 100;
                const voucherPct = (s.totalShopVoucher / base) * 100;
                const returnShipPct = (s.totalReturnShippingFee / base) * 100;
                const platformPct = (s.totalPlatformFees / base) * 100;
                const totalPct = sellerPct + voucherPct + returnShipPct + platformPct;
                const totalAmount = s.totalSellerRebate + s.totalShopVoucher + s.totalReturnShippingFee + s.totalPlatformFees;
                const isSafe = totalPct <= 50;

                return (
                    <div className={`rounded-2xl border-2 p-6 shadow-lg ${isSafe ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isSafe ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                                    <ShieldAlert className={`w-6 h-6 ${isSafe ? 'text-emerald-500' : 'text-rose-500'}`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground tracking-tight">
                                        🎯 Chỉ số Kiểm Soát Chi Phí
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        (Trợ giá NB + Voucher Shop + Phí VC trả hàng + Phí sàn) / Giá gốc – ngưỡng an toàn ≤ 50%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Tổng chi phí</p>
                                    <p className="text-2xl font-black text-foreground">{formatVND(totalAmount)}</p>
                                </div>
                                <div className="w-px h-10 bg-border hidden md:block"></div>
                                <div className="text-right shrink-0">
                                    <div className={`text-4xl font-black ${isSafe ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {totalPct.toFixed(2)}%
                                    </div>
                                    <div className={`text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block ${isSafe ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                                        {isSafe ? '✅ AN TOÀN' : '🚨 VƯỢT NGƯỠNG — CẦN TỐI ƯU'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stacked progress bar */}
                        <div className="mb-4 mt-2">
                            <div
                                className="relative w-full h-6 bg-muted rounded-full overflow-hidden cursor-help"
                                title={`TỔNG CHI PHÍ: ${formatVND(totalAmount)}`}
                            >
                                <div
                                    className="absolute left-0 top-0 h-full bg-orange-400 transition-all hover:brightness-110"
                                    style={{ width: `${Math.min(sellerPct, 100)}%` }}
                                    title={`Người bán trợ giá: ${formatVND(s.totalSellerRebate)} (${sellerPct.toFixed(2)}%)`}
                                />
                                <div
                                    className="absolute top-0 h-full bg-purple-400 transition-all hover:brightness-110"
                                    style={{ left: `${Math.min(sellerPct, 100)}%`, width: `${Math.min(voucherPct, 100 - sellerPct)}%` }}
                                    title={`Voucher Shop: ${formatVND(s.totalShopVoucher)} (${voucherPct.toFixed(2)}%)`}
                                />
                                <div
                                    className="absolute top-0 h-full bg-amber-400 transition-all hover:brightness-110"
                                    style={{ left: `${Math.min(sellerPct + voucherPct, 100)}%`, width: `${Math.min(returnShipPct, 100 - sellerPct - voucherPct)}%` }}
                                    title={`Phí VC trả hàng: ${formatVND(s.totalReturnShippingFee)} (${returnShipPct.toFixed(2)}%)`}
                                />
                                <div
                                    className="absolute top-0 h-full bg-blue-500/80 transition-all hover:brightness-110"
                                    style={{ left: `${Math.min(sellerPct + voucherPct + returnShipPct, 100)}%`, width: `${Math.min(platformPct, 100 - sellerPct - voucherPct - returnShipPct)}%` }}
                                    title={`Phí sàn: ${formatVND(s.totalPlatformFees)} (${platformPct.toFixed(2)}%)`}
                                />
                                <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: '50%' }}>
                                    <span className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-foreground/60 whitespace-nowrap">50%</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded bg-orange-400"></div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Người bán trợ giá</p>
                                </div>
                                <p className="text-lg font-black text-orange-500">{sellerPct.toFixed(2)}%</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">CTKM giảm giá sản phẩm</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded bg-purple-400"></div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voucher Shop</p>
                                </div>
                                <p className="text-lg font-black text-purple-500">{voucherPct.toFixed(2)}%</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Mã giảm giá của Shop</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded bg-amber-400"></div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phí VC trả hàng</p>
                                </div>
                                <p className="text-lg font-black text-amber-500">{returnShipPct.toFixed(2)}%</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Phí vận chuyển hoàn trả</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phí sàn (CĐ+DV+TT)</p>
                                </div>
                                <p className="text-lg font-black text-blue-500">{platformPct.toFixed(2)}%</p>
                                <p className="text-[9px] text-muted-foreground mt-0.5">Cố định + Dịch vụ + Thanh toán</p>
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* Risk Analysis Table */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danh sách đơn hàng cần chú ý
                    </h2>
                    <span className="text-xs text-muted-foreground">Phân tích rủi ro dựa trên cấu trúc chi phí thực tế</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Mã Đơn / Ngày</th>
                                <th className="px-6 py-4 text-center">Trạng Thái</th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort('revenue')}>
                                    Doanh Thu
                                    {sortConfig?.key === 'revenue' && (
                                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort('controlRatio')}>
                                    Phí + KM (%)
                                    {sortConfig?.key === 'controlRatio' && (
                                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort('netProfit')}>
                                    Lời / Lỗ
                                    {sortConfig?.key === 'netProfit' && (
                                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th className="px-6 py-4">Nguyên Nhân</th>
                                <th className="px-6 py-4 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredRisks.slice(0, 100).map((risk, idx) => {
                                const ui = getWarningLevelUI(risk.warningLevel);
                                const Icon = ui.icon;

                                return (
                                    <tr key={risk.orderId} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs group-hover:text-primary transition-colors text-slate-800 dark:text-slate-200">
                                                    {risk.orderId}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">{risk.orderDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                                                ui.color
                                            )}>
                                                <Icon className="w-3 h-3" />
                                                {ui.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {formatVND(risk.revenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={clsx(
                                                    "font-bold",
                                                    risk.controlRatio > 50 ? "text-rose-500" : (risk.controlRatio > 40 ? "text-orange-500" : "text-emerald-500")
                                                )}>
                                                    {formatNumber(risk.controlRatio, 2)}%
                                                </span>
                                                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={clsx(
                                                            "h-full rounded-full",
                                                            risk.controlRatio > 50 ? "bg-rose-500" : (risk.controlRatio > 40 ? "bg-orange-500" : "bg-emerald-500")
                                                        )}
                                                        style={{ width: `${Math.min(risk.controlRatio, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={clsx(
                                                "font-bold",
                                                risk.netProfit < 0 ? "text-rose-600" : "text-emerald-600"
                                            )}>
                                                {risk.netProfit < 0 ? '-' : '+'}{formatVND(Math.abs(risk.netProfit))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded bg-muted/50 text-[10px] text-muted-foreground border border-border">
                                                {getRootCauseLabel(risk.rootCause)}: {formatNumber(risk.rootCauseValue, 2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(risk)}
                                                className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                                title="Xem chi tiết"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredRisks.length > 100 && (
                    <div className="p-4 text-center text-xs text-muted-foreground border-t border-border">
                        Hiển thị 100 đơn hàng rủi ro nhất.
                    </div>
                )}
            </div>

            {/* Modal Detail */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-border bg-card flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "p-2 rounded-xl border",
                                    getWarningLevelUI(selectedOrder.warningLevel).color
                                )}>
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Phân Tích Đơn Hàng</h3>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.orderId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                            >
                                <span className="font-bold">×</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Doanh Thu Thực Nhận</p>
                                    <p className="text-lg font-bold text-foreground mt-1">{formatVND(selectedOrder.revenue)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tỷ lệ Chi Phí (CR)</p>
                                    <p className={clsx(
                                        "text-lg font-bold mt-1",
                                        selectedOrder.controlRatio > 50 ? "text-rose-500" : "text-emerald-500"
                                    )}>{formatNumber(selectedOrder.controlRatio)}%</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Lợi Nhuận Ròng</p>
                                    <p className={clsx(
                                        "text-lg font-bold mt-1",
                                        selectedOrder.netProfit < 0 ? "text-rose-600" : "text-emerald-600"
                                    )}>{formatVND(selectedOrder.netProfit)}</p>
                                </div>
                            </div>

                            {/* Cost Structure Visualizer */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cấu trúc chi phí đơn hàng</h4>

                                <div className="space-y-3">
                                    {/* COGS */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium">Giá vốn hàng bán (est. 40%)</span>
                                            <span className="font-bold">{formatVND(selectedOrder.cogs)} ({formatNumber(selectedOrder.revenue > 0 ? (selectedOrder.cogs / selectedOrder.revenue) * 100 : 0)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-400" style={{ width: `${Math.min((selectedOrder.cogs / selectedOrder.revenue) * 100, 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Fees */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium">Tổng phí sàn (Cố định, Dịch vụ, ...)</span>
                                            <span className="font-bold">{formatVND(selectedOrder.platformFee)} ({formatNumber(selectedOrder.revenue > 0 ? (selectedOrder.platformFee / selectedOrder.revenue) * 100 : 0)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.min((selectedOrder.platformFee / selectedOrder.revenue) * 100, 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Voucher */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium">Trợ giá người bán (Voucher Shop)</span>
                                            <span className="font-bold">{formatVND(selectedOrder.shopPromotion)} ({formatNumber(selectedOrder.revenue > 0 ? (selectedOrder.shopPromotion / selectedOrder.revenue) * 100 : 0)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-400" style={{ width: `${Math.min((selectedOrder.shopPromotion / selectedOrder.revenue) * 100, 100)}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                    <div className="flex gap-3">
                                        <Info className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Chẩn đoán rủi ro</p>
                                            <p className="text-sm text-rose-800/80 dark:text-rose-200/80 mt-1 leading-relaxed">
                                                {selectedOrder.rootCause === 'D' && `Giá vốn đang chiếm tỷ trọng quá cao (${formatNumber((selectedOrder.cogs / selectedOrder.revenue) * 100)}%). Sản phẩm này có biên lợi nhuận gốc rất thấp, không đủ để bù đắp các chi phí sàn.`}
                                                {selectedOrder.rootCause === 'A' && `Chi phí Voucher người bán quá cao (${formatNumber((selectedOrder.shopPromotion / selectedOrder.revenue) * 100)}%). Việc lạm dụng mã giảm giá đang làm xói mòn lợi nhuận ròng.`}
                                                {selectedOrder.rootCause === 'B' && "Phí sàn Shopee (Cố định + Dịch vụ + Thanh toán) đang chiếm tỷ trọng lớn. Có thể do tham gia quá nhiều gói dịch vụ gia tăng."}
                                                {selectedOrder.rootCause === 'E' && "Lợi nhuận bị bào mòn bởi tổ hợp nhiều chi phí. Cần tối ưu đồng thời cả Voucher và cấu trúc sản phẩm."}
                                                {selectedOrder.rootCause === 'C' && "Phí cố định Shopee chiếm tỷ trọng lớn thường do giá trị đơn hàng quá thấp. Cần thúc đẩy mua kèm (Upsell/Combo) để tăng AOV."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Giải pháp đề xuất</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">1</div>
                                        <div>
                                            <p className="text-sm font-semibold">Tăng Giá Trị Đơn Hàng (AOV)</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Giá trị đơn thấp khiến phí cố định và phí vận hành chiếm tỷ trọng lớn. Hãy tạo các gói Combo hoặc Mua kèm deal sốc.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">2</div>
                                        <div>
                                            <p className="text-sm font-semibold">Kiểm soát Mã Giảm Giá</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Đặt ngưỡng giá trị đơn tối thiểu (Min Spend) cao hơn để đảm bảo Voucher không bào mòn biên lợi nhuận ròng.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-card flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

