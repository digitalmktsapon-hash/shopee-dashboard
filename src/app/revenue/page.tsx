"use client";

import React, { useEffect, useState } from 'react';
import { filterOrders, parseShopeeDate, calculateMetrics } from '../../utils/calculator';
import { ShopeeOrder, MetricResult } from '../../utils/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ComposedChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    MapPin,
    Package,
    ShoppingCart,
    CreditCard,
    Wallet
} from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { ChartTooltip } from '../../components/ChartTooltip';
import { formatVND, formatNumber } from '../../utils/format';
import clsx from 'clsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Custom Metrics Type for Revenue Dashboard
interface RevenueDashboardMetrics {
    // KPIs (Realized Only)
    currentNetRevenue: number;
    currentProfit: number;
    currentMargin: number; // percentage
    currentAOV: number;

    // Status Analysis (All Orders)
    statusData: {
        status: string;
        count: number;
        revenue: number;
        percentOfCount: number;
    }[];

    // Trends (Realized Only)
    dailyTrends: {
        date: string;
        netRevenue: number;
        profit: number;
        margin: number;
    }[];

    // SKU (Realized Only)
    topSKUs: {
        sku: string;
        name: string;
        revenue: number;
        profit: number;
        margin: number;
        quantity: number;
        contribution: number;
    }[];

    // Province (Shipping Address) - (Realized Only)
    topProvinces: {
        province: string;
        revenue: number;
        profit: number;
        margin: number;
        contribution: number;
    }[];
}

const mapToRevenueMetrics = (result: MetricResult): RevenueDashboardMetrics => {
    return {
        currentNetRevenue: result.totalGrossRevenue, // Proceeds (39.7M)
        currentProfit: result.netProfitAfterTax,   // Net Profit (36.8M)
        currentMargin: result.netMargin,
        currentAOV: result.avgOrderValue,
        statusData: result.statusAnalysis.map(s => ({
            status: s.status,
            count: s.count,
            revenue: s.revenue,
            percentOfCount: s.percentage
        })),
        dailyTrends: result.revenueTrend.map(t => ({
            date: t.date,
            netRevenue: t.grossRevenue, // Sync with 39.7M definition
            profit: t.netRevenueAfterTax, // Sync with 36.8M definition
            margin: t.profitMargin
        })),
        topSKUs: result.topProducts.map(p => ({
            sku: p.sku,
            name: p.name,
            revenue: p.revenue,
            profit: p.netProfit,
            margin: p.margin,
            quantity: p.quantity,
            contribution: p.contribution
        })),
        topProvinces: result.locationAnalysis.map(l => ({
            province: l.province,
            revenue: l.revenue,
            profit: l.profit,
            margin: l.revenue > 0 ? (l.profit / l.revenue) * 100 : 0,
            contribution: l.contribution
        }))
    };
};

export default function RevenuePage() {
    const [metrics, setMetrics] = useState<RevenueDashboardMetrics | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<RevenueDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate, warehouse, channelKey } = useFilter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/orders?channel=' + channelKey);
                const orders: ShopeeOrder[] = await res.json();

                // Current Period
                const filtered = filterOrders(orders, startDate, endDate, warehouse);
                if (filtered.length > 0) {
                    const result = calculateMetrics(filtered);
                    setMetrics(mapToRevenueMetrics(result));
                } else {
                    setMetrics(null);
                }

                // Previous Period Comparison
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    const prevEnd = new Date(start);
                    prevEnd.setDate(prevEnd.getDate() - 1);

                    const prevStart = new Date(prevEnd);
                    prevStart.setDate(prevStart.getDate() - diffDays + 1);

                    const prevStartDateStr = prevStart.toISOString().split('T')[0];
                    const prevEndDateStr = prevEnd.toISOString().split('T')[0];

                    const prevFiltered = filterOrders(orders, prevStartDateStr, prevEndDateStr, warehouse);
                    if (prevFiltered.length > 0) {
                        const result = calculateMetrics(prevFiltered);
                        setPrevMetrics(mapToRevenueMetrics(result));
                    } else {
                        setPrevMetrics(null);
                    }
                } else {
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
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <DollarSign className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu doanh thu (đã lọc)</p>
            </div>
        );
    }

    const PoPIndicator = ({ current, prev }: { current: number, prev: number }) => {
        if (!prev || prev === 0) return null;
        const diff = current - prev;
        const percentChange = (Math.abs(diff) / prev) * 100;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        let colorClass = "text-muted-foreground";
        let Icon = null;

        if (isIncrease) {
            colorClass = "text-emerald-500";
            Icon = "▲";
        } else if (isDecrease) {
            colorClass = "text-rose-500";
            Icon = "▼";
        }

        return (
            <span className="text-[10px] font-medium ml-2 bg-muted/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-2">
                <span className="text-muted-foreground lowercase">so với kỳ trước</span>
                {Icon && <span className={colorClass}>{Icon} {percentChange.toFixed(2)}%</span>}
            </span>
        );
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân tích Doanh thu & Lợi nhuận</h1>
                <p className="text-muted-foreground mt-1 text-sm">Số liệu sạch (Đã trừ đơn Hủy & Hoàn) — COGS mặc định 40%</p>
            </div>

            {/* Section II: KPIs Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-br from-card to-card/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">Doanh thu gộp</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            {formatVND(metrics.currentNetRevenue)}
                        </h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentNetRevenue} prev={prevMetrics.currentNetRevenue} />}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-br from-card to-card/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">Lợi nhuận gộp</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                            {formatVND(metrics.currentProfit)}
                        </h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentProfit} prev={prevMetrics.currentProfit} />}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-br from-card to-card/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">Biên lợi nhuận</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">
                            {formatNumber(metrics.currentMargin, 2)}%
                        </h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentMargin} prev={prevMetrics.currentMargin} />}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-br from-card to-card/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">AOV (Giá trị đơn TB)</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                            {formatVND(metrics.currentAOV)}
                        </h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentAOV} prev={prevMetrics.currentAOV} />}
                    </div>
                </div>
            </div>

            {/* Section I: Revenue & Profit Composed Chart */}
            <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-b from-card/80 to-card/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        BIỂU ĐỒ DOANH THU & LỢI NHUẬN THEO THỜI GIAN
                    </h3>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={metrics.dailyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                yAxisId="left"
                                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value}%`}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                content={
                                    <ChartTooltip
                                        formatter={(val: number | string, name: string) => {
                                            if (name === "Biên lợi nhuận (%)") return `${Number(val).toFixed(2)}%`;
                                            return formatVND(Number(val));
                                        }}
                                    />
                                }
                            />
                            <Legend />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="margin"
                                name="Biên lợi nhuận (%)"
                                stroke="#a855f7"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorMargin)"
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="netRevenue"
                                name="Doanh thu thuần"
                                stroke="#38bdf8"
                                strokeWidth={3}
                                dot={{ stroke: '#38bdf8', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#38bdf8' }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="profit"
                                name="Lợi nhuận gộp"
                                stroke="#34d399"
                                strokeWidth={3}
                                dot={{ stroke: '#34d399', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Section III: SKU Analysis */}
                <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-b from-card/80 to-card/40 rounded-2xl p-6 shadow-lg flex flex-col xl:col-span-1">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
                        <Package className="w-5 h-5 text-amber-400" />
                        Doanh thu theo SKU (Top 10)
                    </h3>
                    {/* Top SKU Chart */}
                    <div className="h-[250px] mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.topSKUs.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="sku" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    formatter={(value: any) => formatVND(Number(value))}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" name="Doanh Thu Net" fill="url(#colorRevenueBar)" radius={[0, 6, 6, 0]} barSize={14} />
                                <defs>
                                    <linearGradient id="colorRevenueBar" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#818cf8" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Top SKU Table */}
                    <div className="flex-1 overflow-auto max-h-[420px] pr-2 custom-scrollbar">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-muted-foreground/80 font-medium border-b border-white/10 sticky top-0 bg-card/95 backdrop-blur-md z-10">
                                <tr>
                                    <th className="pb-3 pl-2">SKU / Sản phẩm</th>
                                    <th className="pb-3 text-right">Đã bán</th>
                                    <th className="pb-3 text-right">Doanh thu</th>
                                    <th className="pb-3 text-right">Lợi nhuận</th>
                                    <th className="pb-3 text-right">Margin %</th>
                                    <th className="pb-3 text-right pr-2">% Đóng góp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {metrics.topSKUs.map((p, idx) => (
                                    <tr key={idx} className="group hover:bg-white/5 transition-colors duration-200">
                                        <td className="py-3.5 pl-3 max-w-[200px]" title={p.name}>
                                            <div className="font-semibold text-foreground/90 truncate">{p.sku}</div>
                                            <div className="text-xs text-muted-foreground truncate opacity-80">{p.name}</div>
                                        </td>
                                        <td className="py-3.5 text-right font-medium">{p.quantity}</td>
                                        <td className="py-3.5 text-right font-bold text-sky-400">{formatVND(p.revenue)}</td>
                                        <td className="py-3.5 text-right font-bold text-emerald-400">{formatVND(p.profit)}</td>
                                        <td className="py-3.5 text-right font-medium">{formatNumber(p.margin, 2)}%</td>
                                        <td className="py-3.5 text-right pr-3 font-medium text-indigo-300">{formatNumber(p.contribution, 2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Section IV: Province Analysis */}
                    <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-b from-card/80 to-card/40 rounded-2xl p-6 shadow-lg flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                            Doanh thu theo khu vực
                        </h3>
                        <div className="flex-1 overflow-auto max-h-[300px] pr-2 custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-muted-foreground/80 font-medium border-b border-white/10 sticky top-0 bg-card/95 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="pb-3 pl-2">Tỉnh / Thành phố</th>
                                        <th className="pb-3 text-right">Doanh thu</th>
                                        <th className="pb-3 text-right">Lợi Nhuận</th>
                                        <th className="pb-3 text-right pr-2">% Đóng góp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {metrics.topProvinces.map((loc, idx) => (
                                        <tr key={idx} className="group hover:bg-white/5 transition-colors duration-200">
                                            <td className="py-3.5 pl-3 truncate font-semibold text-foreground/90">{loc.province}</td>
                                            <td className="py-3.5 text-right font-bold text-sky-400">{formatVND(loc.revenue)}</td>
                                            <td className="py-3.5 text-right font-bold text-emerald-400">{formatVND(loc.profit)}</td>
                                            <td className="py-3.5 text-right pr-3">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="font-medium min-w-[45px]">{formatNumber(loc.contribution, 1)}%</span>
                                                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                            style={{ width: `${loc.contribution}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section V: Status Analysis */}
                    <div className="bg-card/50 backdrop-blur-md border border-white/5 bg-gradient-to-b from-card/80 to-card/40 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-foreground/90 uppercase tracking-wider">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                            Doanh thu theo trạng thái
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={metrics.statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="revenue"
                                            nameKey="status"
                                        >
                                            {metrics.statusData.map((entry, index) => {
                                                let color = COLORS[index % COLORS.length];
                                                if (entry.status === 'Đã hủy') color = '#ef4444'; // red
                                                if (entry.status === 'Hoàn trả') color = '#f97316'; // orange
                                                if (entry.status === 'Hoàn thành') color = '#10b981'; // green
                                                if (entry.status === 'Đang giao') color = '#3b82f6'; // blue
                                                return <Cell key={`cell-${index}`} fill={color} />
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => formatVND(Number(value))}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                                {metrics.statusData.map((status, idx) => {
                                    let color = COLORS[idx % COLORS.length];
                                    if (status.status === 'Đã hủy') color = '#ef4444';
                                    if (status.status === 'Hoàn trả') color = '#f97316';
                                    if (status.status === 'Hoàn thành') color = '#10b981';
                                    if (status.status === 'Đang giao') color = '#3b82f6';

                                    return (
                                        <div key={idx} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                            <span className="flex items-center gap-2 text-sm font-medium">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                                                {status.status}
                                            </span>
                                            <div className="text-right">
                                                <div className="font-bold text-sm text-foreground">{formatVND(status.revenue)}</div>
                                                <div className="text-xs flex gap-2 justify-end mt-1">
                                                    <span className="text-muted-foreground">{status.count} đơn</span>
                                                    <span className="text-muted-foreground">({formatNumber(status.percentOfCount, 1)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
