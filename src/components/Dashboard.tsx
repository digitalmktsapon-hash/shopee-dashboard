"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { KPICard } from './KPICard';
import { calculateMetrics, filterOrders } from '../utils/calculator';
import { MetricResult, ShopeeOrder, DailyFinancialMetric, ProductRiskProfile } from '../utils/types';
import { DollarSign, ShoppingBag, CreditCard, Activity, ArrowRight, Package, TrendingUp, AlertTriangle, Truck, Percent, CheckCircle2, XCircle, RefreshCcw, Ticket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart } from 'recharts';
import { useFilter } from '../contexts/FilterContext';
import { PageSkeleton } from './Skeleton';
import { formatVND, formatNumber } from '../utils/format';
import clsx from 'clsx';
import { OrderRiskControlCenter } from './OrderRiskControlCenter';

export default function Dashboard() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRiskItem, setSelectedRiskItem] = useState<ProductRiskProfile | null>(null);
    const { startDate, endDate, warehouse, channelKey } = useFilter();

    const chartData = useMemo(() => {
        if (!metrics) return [];
        return [
            { name: '4. Chi phí khuyến mãi', value: metrics.totalDiscount, color: '#f97316' }, // orange-500
            { name: '5. Chi phí sàn', value: metrics.totalSurcharges, color: '#ef4444' },     // red-500
            { name: '6. Giá vốn', value: metrics.totalCOGS, color: '#d97706' },               // amber-600
            { name: '7. Lợi nhuận gộp', value: metrics.totalGrossProfit, color: '#10b981' }, // emerald-500
        ].filter(item => item.value > 0);
    }, [metrics]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/orders?channel=' + channelKey);
                const orders: ShopeeOrder[] = await res.json();

                // Current Period
                const filtered = filterOrders(orders, startDate, endDate, warehouse);

                if (filtered.length > 0) {
                    setMetrics(calculateMetrics(filtered));
                } else {
                    setMetrics(null);
                }

                // Previous Period Logic
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days

                    const prevEnd = new Date(start);
                    prevEnd.setDate(prevEnd.getDate() - 1);

                    const prevStart = new Date(prevEnd);
                    prevStart.setDate(prevStart.getDate() - diffDays + 1);

                    const prevFiltered = filterOrders(orders, prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0], warehouse);

                    if (prevFiltered.length > 0) {
                        setPrevMetrics(calculateMetrics(prevFiltered));
                    } else {
                        setPrevMetrics(null);
                    }
                } else {
                    // If no date selected (all time), no previous period
                    setPrevMetrics(null);
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

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-blue-500/10 p-6 rounded-full mb-6">
                    <Package className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Chưa có dữ liệu</h2>
                <p className="text-muted-foreground mb-8 max-w-md font-medium">
                    Không tìm thấy dữ liệu phù hợp bộ lọc.
                </p>
                <Link href="/data-sources" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition">
                    Quản lý dữ liệu <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </div>
        )
    }

    // --- Components for Layers ---

    // Metric Tile (Small)
    const MetricTile = ({ label, value, subValue, formula, color = "blue", icon: Icon }: any) => (
        <div className="bg-card/50 backdrop-blur-sm border border-border p-4 rounded-xl flex items-start justify-between hover:bg-card/80 transition-all">
            <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    {label}
                    {formula && <span className="block text-[10px] normal-case font-normal opacity-70">({formula})</span>}
                </p>
                <p className={clsx("text-lg font-bold mt-1", color === 'red' ? 'text-rose-400' : color === 'green' ? 'text-emerald-400' : 'text-foreground')}>{value}</p>
                {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
            </div>
            {Icon && <Icon className={clsx("w-5 h-5 opacity-50", color === 'red' ? 'text-rose-400' : color === 'green' ? 'text-emerald-400' : 'text-blue-400')} />}
        </div>
    );

    // Financial Card (Large)
    const FinancialCard = ({ title, value, subLabel, subValue, formula, gradient = "from-blue-600 to-indigo-600" }: any) => (
        <div className={clsx("relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br", gradient)}>
            <div className="relative z-10">
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">
                    {title}
                    {formula && <span className="ml-2 text-xs normal-case font-normal opacity-70">({formula})</span>}
                </p>
                <h3 className="text-3xl font-bold">{value}</h3>
                {subLabel && (
                    <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                        <span className="opacity-80">{subLabel}:</span>
                        <span className="font-bold">{subValue}</span>
                    </div>
                )}
            </div>
            {/* Decor */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
    );

    // --- Warning Logic & Helpers ---
    const lowMarginProducts = metrics?.productPerformance.filter(p => p.margin < 10 && p.revenue > 1000000).sort((a, b) => a.margin - b.margin).slice(0, 5) || [];
    const highReturnProducts = metrics?.productPerformance.filter(p => p.returnRate > 5 && p.quantity > 10).sort((a, b) => b.returnRate - a.returnRate).slice(0, 5) || [];
    const negativeDays = metrics?.daysWithNegativeProfit || 0;



    // --- Period-over-Period component ---
    const PoPIndicator = ({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) => {
        if (!prev || prev === 0) return null; // Or show N/A

        const diff = current - prev;
        const percentChange = (Math.abs(diff) / prev) * 100;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        // Define colors based on whether it's an expense (isInverse) or revenue/profit
        let colorClass = "text-muted-foreground"; // Default (no change)
        let Icon = null;

        if (isIncrease) {
            colorClass = isInverse ? "text-rose-500" : "text-emerald-500";
            Icon = "▲"; // You could use Lucide icons here if preferred, e.g. <TrendingUp className="w-3 h-3 inline pb-0.5" />
        } else if (isDecrease) {
            colorClass = isInverse ? "text-emerald-500" : "text-rose-500";
            Icon = "▼";
        }

        return (
            <span className="text-[10px] font-medium ml-2 bg-muted/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                <span className="text-muted-foreground lowercase">so với kỳ trước</span>
                {Icon && <span className={colorClass}>{Icon} {percentChange.toFixed(2)}%</span>}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 1. Financial Snapshot */}
            <div className="w-full">
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-2xl font-bold text-foreground">
                        FINANCIAL DASHBOARD – FINANCIAL SNAPSHOT (BỨC TRANH TÀI CHÍNH)
                        <span className="text-xs font-normal text-muted-foreground ml-4 bg-muted/40 px-2 py-1 rounded border border-border">
                            Lưu ý: Không tính đơn Hủy & Hoàn trả (Realized Orders Only)
                        </span>
                    </h2>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                    <section className="min-w-fit">
                        <div className="grid grid-cols-1 md:grid-cols-[max-content_max-content] gap-4 w-fit">
                            {/* Headers */}
                            <div className="pb-1">
                                <h3 className="text-lg font-bold text-blue-500">I. Doanh thu (Revenue)</h3>
                            </div>
                            <div className="pb-1 hidden md:block">
                                <h3 className="text-lg font-bold text-red-500">II. Chi phí (Cost)</h3>
                            </div>

                            {/* Row 1: Gross Listing Revenue & CTKM */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">1. Doanh thu niêm yết (Gross List Revenue)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (Giá gốc) x (Số lượng - SL hoàn trả)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-blue-600">{formatVND(metrics?.totalListRevenue || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">(100%)</span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalListRevenue || 0} prev={prevMetrics.totalListRevenue || 0} />}
                                </div>
                            </div>
                            {/* CTKM (Moved here) */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">4. Voucher Shop (Seller Rebate)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Tổng các khoản Người bán trợ giá</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-orange-500">{formatVND(metrics?.totalDiscount || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalDiscount / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalDiscount || 0} prev={prevMetrics.totalDiscount || 0} isInverse={true} />}
                                </div>
                            </div>

                            {/* Row 2: Net Selling Revenue & Surcharges */}
                            {/* Net Selling Revenue */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">2. Doanh thu NET (Net Revenue)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (1) - (4)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-blue-500">{formatVND(metrics?.totalNetRevenue || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalNetRevenue / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalNetRevenue || 0} prev={prevMetrics.totalNetRevenue || 0} />}
                                </div>
                            </div>
                            {/* Surcharges (Moved here) */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">5. Phí sàn (Platform Fees)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (Cố định) + (Dịch vụ) + (Thanh toán) + (VC trả hàng)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-red-500">{formatVND(metrics?.totalSurcharges || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalSurcharges / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalSurcharges || 0} prev={prevMetrics.totalSurcharges || 0} isInverse={true} />}
                                </div>
                            </div>

                            {/* Row 3: Estimated Order Revenue & COGS */}
                            {/* Estimated Order Revenue (Col 1) */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">3. Doanh thu sau phí sàn (Gross Revenue)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (2) - (5)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-indigo-500">{formatVND(metrics?.totalGrossRevenue || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalGrossRevenue / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalGrossRevenue || 0} prev={prevMetrics.totalGrossRevenue || 0} />}
                                </div>
                            </div>
                            {/* COGS (Moved here) */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">6. Giá vốn (COGS)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (40%) x (1)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-amber-600">{formatVND(metrics?.totalCOGS || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalCOGS / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalCOGS || 0} prev={prevMetrics.totalCOGS || 0} isInverse={true} />}
                                </div>
                            </div>

                            {/* Profit Header */}
                            <div className="col-span-1 md:col-span-2 pb-1 mt-6 border-b border-border/50 mb-2">
                                <h3 className="text-lg font-bold text-emerald-500">III. Lợi nhuận (Profit)</h3>
                            </div>

                            {/* Row 6: Gross Profit & Margin */}
                            {/* Gross Profit */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">7. Lợi nhuận gộp (Gross Profit)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (3) - (6)</p>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <h3 className="text-2xl font-bold text-emerald-600">{formatVND(metrics?.totalGrossProfit || 0)}</h3>
                                    <span className="text-sm text-muted-foreground">
                                        ({metrics?.totalListRevenue ? formatNumber((metrics.totalGrossProfit / metrics.totalListRevenue) * 100, 2) : 0}%)
                                    </span>
                                    {prevMetrics && <PoPIndicator current={metrics?.totalGrossProfit || 0} prev={prevMetrics.totalGrossProfit || 0} />}
                                </div>
                            </div>
                            {/* Margin */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">8. Biên lợi nhuận (Margin %)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (7) / (1)</p>
                                <div className="flex flex-wrap items-baseline gap-2 mt-2">
                                    <h3 className={clsx("text-2xl font-bold", (metrics?.netMargin || 0) > 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {formatNumber(metrics?.netMargin || 0, 2)}%
                                    </h3>
                                    {prevMetrics && <PoPIndicator current={metrics?.netMargin || 0} prev={prevMetrics.netMargin || 0} />}
                                </div>
                            </div>

                            {/* Row 7: Profit per Unit */}
                            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                                <p className="text-base font-bold text-foreground">9. Lãi / đơn (Profit / Order)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= (7) / (Số lượng bán)</p>
                                <div className="flex flex-wrap items-baseline gap-2 mt-2">
                                    <h3 className={clsx("text-2xl font-bold", (metrics?.profitPerSoldUnit || 0) > 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {formatVND(metrics?.profitPerSoldUnit || 0)}
                                    </h3>
                                    {prevMetrics && <PoPIndicator current={metrics?.profitPerSoldUnit || 0} prev={prevMetrics.profitPerSoldUnit || 0} />}
                                </div>
                            </div>
                            <div className="hidden md:block"></div>
                        </div>
                    </section>

                    {/* Right: Pie Chart */}
                    <section className="flex-1 w-full flex flex-col gap-4">
                        <div className="pb-1">
                            <h3 className="text-lg font-bold text-foreground pl-1">IV. Phân bổ Doanh thu (Revenue Breakdown)</h3>
                        </div>

                        <div className="bg-card border border-border p-6 rounded-xl shadow-sm w-full flex-1 flex flex-col">
                            <div className="flex-1 min-h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="40%"
                                            cy="50%"
                                            innerRadius={90}
                                            outerRadius={135}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(2)}%)`}
                                            labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* 2. Order Performance */}
            <section className="w-full mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-6 h-6 text-blue-500" />
                    <h2 className="text-2xl font-bold text-foreground">
                        HIỆU SUẤT ĐƠN HÀNG (Order Performance)
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Tổng đơn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tổng Đơn (Total Orders)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Tổng đơn phát sinh</p>
                            </div>
                            <ShoppingBag className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold">{metrics?.realizedPerformance?.totalOrders || 0}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.totalOrders || 0} prev={prevMetrics.realizedPerformance?.totalOrders || 0} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tất cả đơn hàng</p>
                    </div>

                    {/* 2. Đã hủy */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Đơn Hủy (Cancelled Orders)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Đơn xác nhận hủy</p>
                            </div>
                            <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-red-500">{metrics?.realizedPerformance?.cancelledOrders || 0}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.cancelledOrders || 0} prev={prevMetrics.realizedPerformance?.cancelledOrders || 0} isInverse={true} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            ~{metrics?.realizedPerformance?.totalOrders ? formatNumber((metrics.realizedPerformance.cancelledOrders / metrics.realizedPerformance.totalOrders) * 100, 2) : 0}% tổng đơn
                        </p>
                    </div>

                    {/* 3. Thành công */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Thành Công (Realized Orders)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Hoàn thành & Không hoàn</p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-emerald-500">{metrics?.realizedPerformance?.successfulOrders || 0}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.successfulOrders || 0} prev={prevMetrics.realizedPerformance?.successfulOrders || 0} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Đã hoàn thành & không hoàn</p>
                    </div>

                    {/* 4. Tỷ lệ hoàn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tỷ Lệ Hoàn (Return Rate)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Đơn hoàn / Tổng đơn</p>
                            </div>
                            <RefreshCcw className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-orange-500">{formatNumber(metrics?.realizedPerformance?.returnRate || 0, 2)}%</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.returnRate || 0} prev={prevMetrics.realizedPerformance?.returnRate || 0} isInverse={true} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Trên tổng đơn</p>
                    </div>

                    {/* 5. AOV */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">AOV (Avg Order Value)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Doanh thu Net / Đơn thành công</p>
                            </div>
                            <DollarSign className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-blue-500">{formatVND(metrics?.realizedPerformance?.aov || 0)}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.aov || 0} prev={prevMetrics.realizedPerformance?.aov || 0} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Doanh thu Net / Đơn thành công</p>
                    </div>

                    {/* 6. Phí / Đơn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phí Sàn / Đơn (Platform Fee / Order)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Tổng phí / Đơn thành công</p>
                            </div>
                            <Ticket className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-red-500">{formatVND(metrics?.realizedPerformance?.feePerOrder || 0)}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.feePerOrder || 0} prev={prevMetrics.realizedPerformance?.feePerOrder || 0} isInverse={true} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Trung bình trên đơn thành công</p>
                    </div>

                    {/* 7. Giá vốn / Đơn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Giá Vốn / Đơn (COGS / Order)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Tổng giá vốn / Đơn thành công</p>
                            </div>
                            <Package className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-amber-600">{formatVND(metrics?.realizedPerformance?.cogsPerOrder || 0)}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.realizedPerformance?.cogsPerOrder || 0} prev={prevMetrics.realizedPerformance?.cogsPerOrder || 0} isInverse={true} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">COGS (40%) trung bình</p>
                    </div>
                </div>
            </section>

            {/* FINANCIAL DASHBOARD – DAILY VIEW (REALIZED) */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">BIỂU ĐỒ NGÀY (Daily View)</h2>
                </div>

                {/* 4 Groups of Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 1. Revenue Layer Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">1. Doanh thu & Lợi nhuận (Revenue Layer)</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics?.dailyFinancials || []}>
                                    <defs>
                                        <linearGradient id="colorRev1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333' }} formatter={(v: any) => formatVND(Number(v))} labelFormatter={(l) => new Date(l).toLocaleDateString('vi-VN')} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue1" name="Doanh thu niêm yết sau hoàn (Gross List Revenue)" stroke="#818cf8" fill="url(#colorRev1)" strokeWidth={1} strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="revenue2" name="Doanh thu NET (Net Revenue)" stroke="#3b82f6" fill="url(#colorRev2)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="profit" name="Lợi nhuận (Profit)" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Cost Structure Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">2. Cấu trúc Chi phí (Cost Structure)</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333' }} formatter={(v: any) => formatVND(Number(v))} labelFormatter={(l) => new Date(l).toLocaleDateString('vi-VN')} />
                                    <Legend />
                                    <Bar dataKey="fees" name="Phí sàn (Platform Fee)" stackId="a" fill="#f43f5e" />
                                    <Bar dataKey="cogs" name="Giá vốn (COGS)" stackId="a" fill="#d97706" />
                                    <Bar dataKey="subsidies" name="Trợ giá (Subsidies)" stackId="a" fill="#a855f7" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Margin Trend Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">3. Biên lợi nhuận (Margin % Trend)</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis stroke="#666" fontSize={11} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333' }} formatter={(v: any) => `${Number(v).toFixed(2)}%`} labelFormatter={(l) => new Date(l).toLocaleDateString('vi-VN')} />
                                    <Legend />
                                    <Line type="monotone" dataKey="margin" name="Biên lợi nhuận (Margin %)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Risk Trends Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">4. Rủi ro & Đốt KM (Daily Risk & Promo Burn)</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis yAxisId="left" stroke="#666" fontSize={11} unit="%" label={{ value: 'Tỷ lệ %', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2e', borderColor: '#333' }} labelFormatter={(l) => new Date(l).toLocaleDateString('vi-VN')} formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="promotionBurnRate" name="Tỷ lệ đốt KM (Promo Burn Rate %)" fill="#a855f7" barSize={20} />
                                    <Line yAxisId="left" type="monotone" dataKey="highRiskOrderPercent" name="% Đơn Rủi Ro (>50%) (High Risk Order %)" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="avgControlRatio" name="Tỷ lệ kiểm soát trung bình (Avg Control Ratio)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section >


        </div >
    );
}
