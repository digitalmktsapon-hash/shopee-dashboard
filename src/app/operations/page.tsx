"use client";

import React, { useEffect, useState } from 'react';
import { calculateMetrics, filterOrders } from '../../utils/calculator';
import { MetricResult, ShopeeOrder } from '../../utils/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { Truck, Clock, PackageCheck, AlertTriangle, Box } from 'lucide-react';
import clsx from 'clsx';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatNumber } from '../../utils/format';
import { ChartTooltip } from '../../components/ChartTooltip';

export default function OperationsPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate, warehouse, channelKey } = useFilter();

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

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Truck className="w-8 h-8 text-black" />
                </div>
                <p>Chưa có dữ liệu vận hành (đã lọc)</p>
            </div>
        );
    }

    const opData = metrics.operationAnalysis || [];
    const avgShipTime = opData.length > 0
        ? (opData.reduce((a, b) => a + (b.avgShipTime * b.orderCount), 0) / opData.reduce((a, b) => a + b.orderCount, 0))
        : 0;

    const totalOrders = metrics.totalOrders;
    // Mock SLA data for now since we don't have real "SLA breach" flag in raw data yet
    // Assuming SLA is 4 days.
    const lateOrders = 0; // Placeholder
    const slaCompliance = 100; // Placeholder

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Hiệu Suất Vận Hành</h1>
                <p className="text-muted-foreground mt-1 text-sm">Giám sát tốc độ giao hàng, hiệu quả ĐVVC và tuân thủ SLA.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tổng Đơn Vận Chuyển</p>
                            <h3 className="text-2xl font-bold text-foreground">{formatNumber(metrics.totalOrders)}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Qua {opData.length} đối tác</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Box className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Thời Gian Giao TB</p>
                            <h3 className={clsx("text-2xl font-bold", avgShipTime > 3 ? "text-amber-500" : "text-foreground")}>
                                {avgShipTime.toFixed(1)} <span className="text-base font-normal text-muted-foreground">ngày</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">Mục tiêu: &lt; 2.5 ngày</p>
                        </div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tỷ Lệ Đúng Hạn (SLA)</p>
                            <h3 className="text-2xl font-bold text-emerald-500">{slaCompliance}%</h3>
                            <p className="text-xs text-muted-foreground mt-1">Ước tính (Giả định SLA 4 ngày)</p>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <PackageCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Đơn Hàng Chậm</p>
                            <h3 className="text-2xl font-bold text-foreground">{lateOrders}</h3>
                            <p className="text-xs text-muted-foreground mt-1 text-rose-500">Cần xử lý gấp</p>
                        </div>
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Carrier Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-500" />
                        Thị Phần Vận Chuyển
                    </h3>
                    <div className="h-[300px] w-full">
                        {opData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={opData.sort((a, b) => b.orderCount - a.orderCount)}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="carrier" width={120} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} interval={0} />
                                    <Tooltip content={(props: any) => <ChartTooltip {...props} />} />
                                    <Bar dataKey="orderCount" name="Số Đơn" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Không có dữ liệu</div>
                        )}
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Thời Gian Giao Hàng Trung Bình
                    </h3>
                    <div className="h-[300px] w-full">
                        {opData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={opData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="carrier" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={(props: any) => <ChartTooltip {...props} formatter={(val: number) => val.toFixed(1) + ' ngày'} />} />
                                    <Bar dataKey="avgShipTime" name="Thời gian (ngày)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Không có dữ liệu thời gian toàn trình</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed List */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-bold text-foreground">Chi tiết hiệu quả Đơn vị vận chuyển</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Đơn Vị VC</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Số Đơn</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Thời Gian TB</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Đánh Giá</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {opData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-foreground font-medium">{item.carrier}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground text-right font-mono">{item.orderCount}</td>
                                    <td className="px-6 py-4 text-sm text-foreground text-right font-bold">
                                        {item.avgShipTime.toFixed(1)} ngày
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className={clsx(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            item.avgShipTime < 2.5 ? "bg-emerald-500/10 text-emerald-500" :
                                                item.avgShipTime < 4 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                                        )}>
                                            {item.avgShipTime < 2.5 ? "Tốt" : item.avgShipTime < 4 ? "Khá" : "Chậm"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
