const fs = require('fs');

const content = `"use client";

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
import { ShoppingCart, XCircle, RotateCcw, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatNumber, formatVND } from '../../utils/format';
import { ChartTooltip } from '../../components/ChartTooltip';
import clsx from 'clsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function OrdersPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate, warehouse, channelKey } = useFilter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams();
                if (channelKey && channelKey !== 'all') queryParams.append('channels', channelKey);
                const res = await fetch('/api/orders?' + queryParams.toString());
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
                    <ShoppingCart className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu đơn hàng (đã lọc)</p>
            </div>
        );
    }

    const cancelData = metrics.cancelAnalysis || [];
    const returnData = metrics.returnByCarrier || [];

    // Derived Metrics
    const totalOrders = metrics.totalOrders;
    const totalCancels = cancelData.reduce((a, b) => a + b.count, 0);
    const totalReturns = returnData.reduce((a, b) => a + b.count, 0);
    const totalReturnValue = returnData.reduce((a, b) => a + b.value, 0);

    const cancelRate = totalOrders > 0 ? (totalCancels / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
    const successRate = 100 - cancelRate - returnRate;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Vận Hành & Đơn Hàng (Operations & Orders)</h1>
                <p className="text-muted-foreground mt-1 text-sm">Giám sát tỷ lệ hoàn, hủy và hiệu quả vận chuyển.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tổng Đơn Hàng (Total Orders)</p>
                            <h3 className="text-2xl font-bold text-foreground">{formatNumber(totalOrders)}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tỷ Lệ Thành Công (Success Rate)</p>
                            <h3 className="text-2xl font-bold text-emerald-500">{successRate.toFixed(1)}%</h3>
                            <p className="text-xs text-muted-foreground mt-1">Đơn hoàn thành</p>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tỷ Lệ Hủy (Cancel Rate)</p>
                            <h3 className={clsx("text-2xl font-bold", cancelRate > 5 ? "text-rose-500" : "text-foreground")}>
                                {cancelRate.toFixed(1)}%
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">{formatNumber(totalCancels)} đơn hủy</p>
                        </div>
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground font-medium mb-1">Tỷ Lệ Hoàn (Return Rate)</p>
                            <h3 className={clsx("text-2xl font-bold", returnRate > 3 ? "text-amber-500" : "text-foreground")}>
                                {returnRate.toFixed(1)}%
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 text-rose-400">-{formatVND(totalReturnValue)}</p>
                        </div>
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cancel Reason Analysis */}
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        Phân Tích Lý Do Hủy (Cancellation Reasons Analysis)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="h-[250px] w-full md:w-1/2">
                            {cancelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cancelData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="reason"
                                            stroke="none"
                                        >
                                            {cancelData.map((entry, index) => (
                                                <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={(props: any) => <ChartTooltip {...props} hideLabel />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
                            )}
                        </div>
                        <div className="w-full md:w-1/2 overflow-y-auto max-h-[250px]">
                            <ul className="space-y-2">
                                {cancelData.sort((a, b) => b.count - a.count).map((item, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-foreground truncate max-w-[120px]" title={item.reason}>{item.reason}</span>
                                        </div>
                                        <span className="font-bold text-muted-foreground">{item.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Return by Carrier Analysis */}
                <div className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-lg">
                    <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-500" />
                        Hoàn Trả Theo ĐVVC (Returns by Carrier)
                    </h3>
                    <div className="h-[250px] w-full">
                        {returnData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={returnData.sort((a, b) => b.count - a.count)}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="reason" width={100} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={(props: any) => <ChartTooltip {...props} />} />
                                    <Bar dataKey="count" name="Số lượng (Qty)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/orders/page.tsx', content, 'utf8');
