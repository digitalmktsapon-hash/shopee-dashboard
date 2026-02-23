"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { KPICard } from './KPICard';
import { calculateMetrics, filterOrders } from '../utils/calculator';
import { MetricResult, ShopeeOrder, DailyFinancialMetric, ProductRiskProfile } from '../utils/types';
import { Activity, CalendarDays, DollarSign, Package, TrendingUp, AlertCircle, ShoppingBag, XCircle, CheckCircle2, RefreshCcw, Ticket, ChevronRight, Download, Eye, Table as TableIcon, LayoutDashboard, X, ArrowRight, Percent, CreditCard, AlertTriangle, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart } from 'recharts';
import { useFilter } from '../contexts/FilterContext';
import { PageSkeleton } from './Skeleton';
import { ChartTooltip } from './ChartTooltip';
import { formatVND, formatNumber, formatDateVN } from '../utils/format';
import clsx from 'clsx';
import { OrderRiskControlCenter } from './OrderRiskControlCenter';

export default function Dashboard() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRiskItem, setSelectedRiskItem] = useState<ProductRiskProfile | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Interactive Chart State
    const [activeComboMetrics, setActiveComboMetrics] = useState({
        orders: true,
        netRevenue: true,
        aov: true
    });
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
        <div className="premium-card p-5 flex items-start justify-between">
            <div className="text-sharp">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em] mb-1.5 opacity-80">
                    {label}
                    {formula && <span className="block text-[9px] normal-case font-medium opacity-60">({formula})</span>}
                </p>
                <p className={clsx("text-xl font-extrabold tracking-tight", color === 'red' ? 'text-rose-500' : color === 'green' ? 'text-emerald-500' : 'text-foreground')}>{value}</p>
                {subValue && <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium">{subValue}</p>}
            </div>
            {Icon && (
                <div className={clsx("p-2.5 rounded-xl bg-opacity-10", color === 'red' ? 'bg-rose-500 text-rose-500' : color === 'green' ? 'bg-emerald-500 text-emerald-500' : 'bg-primary text-primary')}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
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

    const getChangePct = (curr: number, prev?: number) => {
        if (!prev || prev === 0) return undefined;
        const diff = curr - prev;
        const pct = (Math.abs(diff) / prev) * 100;
        return `${pct.toFixed(2)}%`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 1. KPI Cards Row - 6 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                <KPICard
                    title="ĐƠN THÀNH CÔNG"
                    value={formatNumber(metrics?.successfulOrders || 0)}
                    icon={ShoppingBag}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.successfulOrders, prevMetrics.successfulOrders) : undefined}
                    trend={metrics && prevMetrics ? (metrics.successfulOrders > prevMetrics.successfulOrders ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="violet"
                />
                <KPICard
                    title="DOANH THU GỘP"
                    value={formatVND(metrics?.totalGrossRevenue || 0)}
                    icon={DollarSign}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.totalGrossRevenue, prevMetrics.totalGrossRevenue) : undefined}
                    trend={metrics && prevMetrics ? (metrics.totalGrossRevenue > prevMetrics.totalGrossRevenue ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="blue"
                />
                <KPICard
                    title="CHI PHÍ CTKM"
                    value={formatVND(metrics?.totalDiscount || 0)}
                    icon={Ticket}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.totalDiscount, prevMetrics.totalDiscount) : undefined}
                    trend={metrics && prevMetrics ? (metrics.totalDiscount > prevMetrics.totalDiscount ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="amber"
                />
                <KPICard
                    title="PHÍ SÀN"
                    value={formatVND(metrics?.totalSurcharges || 0)}
                    icon={CreditCard}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.totalSurcharges, prevMetrics.totalSurcharges) : undefined}
                    trend={metrics && prevMetrics ? (metrics.totalSurcharges > prevMetrics.totalSurcharges ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="rose"
                />
                <KPICard
                    title="DOANH THU THUẦN"
                    value={formatVND(metrics?.netRevenueAfterTax || 0)}
                    icon={Activity}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.netRevenueAfterTax, prevMetrics.netRevenueAfterTax) : undefined}
                    trend={metrics && prevMetrics ? (metrics.netRevenueAfterTax > prevMetrics.netRevenueAfterTax ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="emerald"
                />
                <KPICard
                    title="AOV"
                    value={formatVND(metrics?.avgOrderValue || 0)}
                    icon={TrendingUp}
                    subValue={metrics && prevMetrics ? getChangePct(metrics.avgOrderValue, prevMetrics.avgOrderValue) : undefined}
                    trend={metrics && prevMetrics ? (metrics.avgOrderValue > prevMetrics.avgOrderValue ? 'up' : 'down') : 'neutral'}
                    className="text-sharp transition-all duration-300"
                    color="indigo"
                />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xl">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">PHÂN BỔ DOANH THU</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip formatter={(v: any) => formatVND(Number(v))} hideLabel />} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Compact stats below donut */}
                    <div className="mt-4 space-y-2">
                        {chartData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-muted-foreground font-medium">{item.name}</span>
                                </span>
                                <span className="font-bold">{formatVND(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xl">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">XU HƯỚNG DOANH THU & LỢI NHUẬN</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics?.revenueTrend || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(v) => v.split('-').slice(1).reverse().join('/')} stroke="#666" fontSize={10} />
                                <YAxis stroke="#666" fontSize={10} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip content={<ChartTooltip formatter={(v: any) => formatVND(Number(v))} />} />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Doanh thu NET" stroke="#10b981" fill="url(#colorRev)" strokeWidth={2} />
                                <Area type="monotone" dataKey="netProfit" name="Lợi nhuận" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>


            {/* 2. Order Performance */}
            <section className="w-full mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-6 h-6 text-blue-500" />
                    <h2 className="text-2xl font-bold text-foreground">
                        HIỆU SUẤT VẬN HÀNH
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Tổng đơn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tổng đơn đặt hàng</p>
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
                                <p className="text-sm font-medium text-muted-foreground">Đơn hủy</p>
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
                                <p className="text-sm font-medium text-muted-foreground">Đơn thành công</p>
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

                    {/* 4. Tỷ lệ hoàn -> Đơn Hoàn */}
                    <div
                        className="bg-card/50 p-4 rounded-xl border border-border cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group relative"
                        onClick={() => setIsReturnModalOpen(true)}
                    >
                        <div className="absolute top-4 right-4 text-orange-500/0 group-hover:text-orange-500 transition-colors">
                            <Eye className="w-4 h-4" />
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Đơn hoàn</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Số đơn bị hoàn trả</p>
                            </div>
                            <RefreshCcw className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-orange-500">{metrics?.returnOrderCount || 0}</p>
                            <span className="text-[13px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                                {formatNumber(metrics?.realizedPerformance?.returnRate || 0, 2)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-[11px] text-muted-foreground font-medium">Click xem chi tiết mã đơn</p>
                            {prevMetrics && <PoPIndicator current={metrics?.returnOrderCount || 0} prev={prevMetrics.returnOrderCount || 0} isInverse={true} />}
                        </div>
                    </div>

                    {/* 5. AOV */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Giá trị đơn TB (AOV)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Doanh thu thuần / Đơn thành công</p>
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
                                <p className="text-sm font-medium text-muted-foreground">Phí sàn / Đơn</p>
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
                                <p className="text-sm font-medium text-muted-foreground">Giá vốn / Đơn</p>
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

                    {/* 8. Lợi nhuận / Đơn */}
                    <div className="bg-card/50 p-4 rounded-xl border border-border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Lợi nhuận / Đơn</p>
                                <p className="text-xs text-muted-foreground mt-0.5">= Lợi nhuận gộp / Đơn thành công</p>
                            </div>
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-emerald-500">{formatVND(metrics?.profitPerOrder || 0)}</p>
                            {prevMetrics && <PoPIndicator current={metrics?.profitPerOrder || 0} prev={prevMetrics.profitPerOrder || 0} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Lợi nhuận thực tế trên mỗi đơn</p>
                    </div>
                </div>
            </section>

            {/* FINANCIAL DASHBOARD – DAILY VIEW (REALIZED) */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">BIỂU ĐỒ NGÀY (Daily View)</h2>
                </div>

                {/* Overarching Interactive Combo Chart */}
                <div className="bg-card/40 p-5 rounded-xl border border-border mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Tương quan Doanh thu & Đơn hàng
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Biến động Net Revenue, Tổng đơn thành công và AOV theo ngày</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveComboMetrics(prev => ({ ...prev, netRevenue: !prev.netRevenue }))}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${activeComboMetrics.netRevenue ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-transparent border-border text-muted-foreground hover:bg-muted'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${activeComboMetrics.netRevenue ? 'bg-blue-500' : 'bg-muted-foreground'}`}></div>
                                Doanh Thu Thuần
                            </button>
                            <button
                                onClick={() => setActiveComboMetrics(prev => ({ ...prev, orders: !prev.orders }))}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${activeComboMetrics.orders ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-transparent border-border text-muted-foreground hover:bg-muted'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${activeComboMetrics.orders ? 'bg-orange-500' : 'bg-muted-foreground'}`}></div>
                                Số Đơn Hàng
                            </button>
                            <button
                                onClick={() => setActiveComboMetrics(prev => ({ ...prev, aov: !prev.aov }))}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${activeComboMetrics.aov ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-transparent border-border text-muted-foreground hover:bg-muted'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${activeComboMetrics.aov ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></div>
                                AOV
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={metrics?.dailyFinancials || []}>
                                <defs>
                                    <linearGradient id="colorComboRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />

                                {/* Left YAxis for Financial Values (Revenue & AOV) */}
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                    stroke="#666"
                                    fontSize={11}
                                    orientation="left"
                                />

                                {/* Right YAxis for Absolute Counts (Orders) */}
                                <YAxis
                                    yAxisId="right"
                                    stroke="#666"
                                    fontSize={11}
                                    orientation="right"
                                />

                                <Tooltip
                                    content={<ChartTooltip formatter={(v: any, name: any) => {
                                        if (name === 'Số Đơn Hàng') return `${v} đơn`;
                                        return formatVND(Number(v));
                                    }} />}
                                />

                                {activeComboMetrics.netRevenue && (
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="revenue2"
                                        name="Doanh thu NET"
                                        stroke="#3b82f6"
                                        fill="url(#colorComboRev)"
                                        strokeWidth={2}
                                    />
                                )}

                                {activeComboMetrics.aov && (
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="aov"
                                        name="AOV"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                )}

                                {activeComboMetrics.orders && (
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="successfulOrders"
                                        name="Số Đơn Hàng"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#1f2937' }}
                                        activeDot={{ r: 6 }}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4 Groups of Specialized Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* 1. Revenue Layer Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">1. Doanh thu & Lợi nhuận</h3>
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
                                    <Tooltip content={<ChartTooltip formatter={(v: any) => formatVND(Number(v))} />} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue1" name="Doanh thu niêm yết" stroke="#818cf8" fill="url(#colorRev1)" strokeWidth={1} strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="revenue2" name="Doanh thu thuần" stroke="#3b82f6" fill="url(#colorRev2)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="profit" name="Lợi nhuận gộp" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Cost Structure Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">2. Cấu trúc chi phí</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<ChartTooltip formatter={(v: any) => formatVND(Number(v))} />} />
                                    <Legend />
                                    <Bar dataKey="fees" name="Phí sàn" stackId="a" fill="#f43f5e" />
                                    <Bar dataKey="cogs" name="Giá vốn" stackId="a" fill="#d97706" />
                                    <Bar dataKey="subsidies" name="Chi phí CTKM" stackId="a" fill="#a855f7" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Margin Trend Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">3. Biến động biên lợi nhuận</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis stroke="#666" fontSize={11} unit="%" />
                                    <Tooltip content={<ChartTooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="margin" name="Biên lợi nhuận (%)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Risk Trends Chart */}
                    <div className="bg-card/40 p-4 rounded-xl border border-border h-[350px]">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">4. Rủi ro & Tỷ lệ đốt KM</h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={metrics?.dailyFinancials || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} stroke="#666" fontSize={11} />
                                    <YAxis yAxisId="left" stroke="#666" fontSize={11} unit="%" label={{ value: 'Tỷ lệ %', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<ChartTooltip formatter={(value: any, name: any) => `${Number(value).toFixed(2)}%`} />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="promotionBurnRate" name="Tỷ lệ đốt KM (%)" fill="#a855f7" barSize={20} />
                                    <Line yAxisId="left" type="monotone" dataKey="highRiskOrderPercent" name="% Đơn rủi ro (>50%)" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="avgControlRatio" name="Tỷ lệ kiểm soát trung bình" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section >

            {/* Return Orders Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
                            <div>
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <RefreshCcw className="w-5 h-5 text-orange-500" />
                                    Chi Tiết Đơn Hoàn
                                </h3>
                                <p className="text-[13px] text-muted-foreground mt-1 tracking-tight">Danh sách chi tiết các đơn hàng gửi hoàn & lý do</p>
                            </div>
                            <button onClick={() => setIsReturnModalOpen(false)} className="p-2 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                            {metrics?.returnedOrders?.length ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground text-left sticky top-0 backdrop-blur-md z-10 shadow-sm">
                                        <tr>
                                            <th className="py-3 px-6 font-semibold text-[11px] tracking-wider uppercase">Mã Đơn & Ngày</th>
                                            <th className="py-3 px-6 font-semibold text-[11px] tracking-wider uppercase">Sản Phẩm Hoàn</th>
                                            <th className="py-3 px-6 font-semibold text-[11px] tracking-wider uppercase text-right">Giá Trị</th>
                                            <th className="py-3 px-6 font-semibold text-[11px] tracking-wider uppercase">Lý Do Đề Xuất Hoàn</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {metrics.returnedOrders.map((ro, i) => (
                                            <tr key={i} className="hover:bg-muted/10 transition-colors group">
                                                <td className="py-4 px-6 align-top">
                                                    <div className="font-bold text-foreground tracking-tight">{ro.orderId}</div>
                                                    <div className="text-[12px] text-muted-foreground mt-1">{ro.date}</div>
                                                </td>
                                                <td className="py-4 px-6 align-top">
                                                    <div className="space-y-2">
                                                        {ro.products.map((p, idx) => (
                                                            <div key={idx} className="flex gap-2 text-[13px] leading-tight text-foreground/80 group-hover:text-foreground transition-colors">
                                                                <span className="font-extrabold text-orange-500 shrink-0">x{p.quantity}</span>
                                                                <span className="line-clamp-2">{p.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right align-top">
                                                    <span className="font-bold text-orange-500">
                                                        {formatVND(ro.value)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 align-top max-w-[200px]">
                                                    <span className="inline-flex text-[12px] font-medium text-muted-foreground">
                                                        {ro.reason}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-muted/30 flex items-center justify-center rounded-full mx-auto mb-4">
                                        <RefreshCcw className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">Chưa có dữ liệu đơn hoàn nào trong kỳ</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
