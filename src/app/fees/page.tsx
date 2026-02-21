"use client";

import React, { useEffect, useState } from 'react';
import { calculateMetrics, filterOrders } from '../../utils/calculator';
import { MetricResult, ShopeeOrder } from '../../utils/types';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import { BadgeDollarSign, Wallet, Tag, TrendingDown, Percent } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatVND, formatNumber } from '../../utils/format';
import { ChartTooltip } from '../../components/ChartTooltip';
import clsx from 'clsx';

const FEE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
const SUBSIDY_COLORS = ['#10b981', '#6366f1', '#ec4899'];

export default function FeesPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<MetricResult | null>(null);
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
                    setMetrics(calculateMetrics(filtered));
                } else {
                    setMetrics(null);
                }

                // Previous Period
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
                        setPrevMetrics(calculateMetrics(prevFiltered));
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
                    <BadgeDollarSign className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu phí (đã lọc)</p>
            </div>
        );
    }

    const feeData = metrics.feeAnalysis || [];
    const subsidyData = metrics.subsidyAnalysis || [];

    const totalRevenue = metrics.totalRevenue;
    const totalFees = metrics.totalFees || 0;
    const feeRatio = totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0;

    const prevTotalRevenue = prevMetrics?.totalRevenue || 0;
    const prevTotalFees = prevMetrics?.totalFees || 0;
    const prevFeeRatio = prevTotalRevenue > 0 ? (prevTotalFees / prevTotalRevenue) * 100 : 0;
    const prevSubsidies = prevMetrics?.subsidyAnalysis?.reduce((a, b) => a + b.value, 0) || 0;

    const PoPIndicator = ({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) => {
        if (!prev || prev === 0) return null;

        const diff = current - prev;
        const percentChange = (Math.abs(diff) / prev) * 100;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        let colorClass = "text-muted-foreground";
        let Icon = null;

        if (isIncrease) {
            colorClass = isInverse ? "text-rose-500" : "text-emerald-500";
            Icon = "▲";
        } else if (isDecrease) {
            colorClass = isInverse ? "text-emerald-500" : "text-rose-500";
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
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Chi Phí & Trợ Giá (Fees & Subsidies - CFO)</h1>
                <p className="text-muted-foreground mt-1 text-sm">Kiểm soát các loại phí sàn, voucher và hiệu quả trợ giá.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tổng Phí Sàn (Total Platform Fees)</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <h3 className="text-3xl font-bold text-rose-500">{formatVND(totalFees)}</h3>
                                {prevMetrics && <PoPIndicator current={totalFees} prev={prevTotalFees} isInverse={true} />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Đã bao gồm VAT</p>
                        </div>
                        <div className="p-3 bg-rose-500/10 rounded-xl">
                            <BadgeDollarSign className="w-8 h-8 text-rose-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tỷ Lệ Phí / Doanh Thu (Fee / Revenue Ratio)</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <h3 className={clsx("text-3xl font-bold", feeRatio > 15 ? "text-rose-500" : "text-foreground")}>
                                    {feeRatio.toFixed(2)}%
                                </h3>
                                {prevMetrics && <PoPIndicator current={feeRatio} prev={prevFeeRatio} isInverse={true} />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Mục tiêu: &lt; 12%</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Percent className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tổng Trợ Giá (Total Subsidies)</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <h3 className="text-3xl font-bold text-emerald-500">
                                    {formatVND(subsidyData.reduce((a, b) => a + b.value, 0))}
                                </h3>
                                {prevMetrics && <PoPIndicator current={subsidyData.reduce((a, b) => a + b.value, 0)} prev={prevSubsidies} />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Voucher Shopee & Shop</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Tag className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Structure Analysis */}
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        Cấu Trúc Chi Phí (Fee Structure)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="h-[250px] w-full md:w-1/2">
                            {feeData.reduce((a, b) => a + b.value, 0) > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={feeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="type"
                                            stroke="none"
                                        >
                                            {feeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={FEE_COLORS[index % FEE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={(props: any) => <ChartTooltip {...props} formatter={(val: number) => formatVND(val)} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground font-medium">Không có dữ liệu phí</div>
                            )}
                        </div>
                        <div className="w-full md:w-1/2 overflow-y-auto max-h-[250px]">
                            <ul className="space-y-2">
                                {feeData.map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FEE_COLORS[idx % FEE_COLORS.length] }} />
                                            <span className="text-foreground">{item.type}</span>
                                        </div>
                                        <span className="font-bold text-foreground">{formatVND(item.value)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Subsidy Structure Analysis */}
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-500" />
                        Phân Bổ Trợ Giá & Voucher (Subsidy & Voucher Allocation)
                    </h3>
                    <div className="h-[250px] w-full">
                        {subsidyData.reduce((a, b) => a + b.value, 0) > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={subsidyData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={(props: any) => <ChartTooltip {...props} formatter={(val: number) => formatVND(val)} />} />
                                    <Bar dataKey="value" name="Giá trị (Value)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                                        {subsidyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={SUBSIDY_COLORS[index % SUBSIDY_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">Không có dữ liệu trợ giá</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed List */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-bold text-foreground">Chi tiết các khoản phí (Fee Details)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Loại Phí (Fee Type)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Giá Trị (Value)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Tỷ Lệ / Tổng Phí (% of Total Fees)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Tỷ Lệ / Doanh Thu (% of Revenue)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {feeData.map((item, idx) => {
                                const total = feeData.reduce((a, b) => a + b.value, 0);
                                return (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground font-medium">{item.type}</td>
                                        <td className="px-6 py-4 text-sm text-foreground text-right font-bold font-mono">
                                            {formatVND(item.value)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground text-right font-medium">
                                            {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground text-right font-medium">
                                            {totalRevenue > 0 ? ((item.value / totalRevenue) * 100).toFixed(2) : 0}%
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
