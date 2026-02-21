"use client";

import React, { useEffect, useState } from 'react';
import { filterOrders, parseShopeeDate } from '../../utils/calculator';
import { ShopeeOrder } from '../../utils/types';
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

const calculateRevenueMetrics = (orders: ShopeeOrder[]): RevenueDashboardMetrics => {
    // Group orders by orderId
    const orderGroups: Record<string, ShopeeOrder[]> = {};
    orders.forEach(line => {
        if (!orderGroups[line.orderId]) orderGroups[line.orderId] = [];
        orderGroups[line.orderId].push(line);
    });

    let totalRealizedNetRevenue = 0;
    let totalRealizedProfit = 0;
    let totalRealizedListRevenue = 0; // New global aggregator for Margin Denominator
    let totalRealizedSuccessfulOrdersCount = 0;

    const statusCounts: Record<string, { count: number, listRevenue: number }> = {};
    const trendsMap: Record<string, { netRevenue: number, profit: number, listRevenue: number }> = {};
    const skuMap: Record<string, { name: string, quantity: number, listRevenue: number, netRevenue: number, profit: number }> = {};
    const provinceMap: Record<string, { listRevenue: number, netRevenue: number, profit: number }> = {};

    let totalAllOrdersCount = Object.keys(orderGroups).length;

    Object.values(orderGroups).forEach(lines => {
        const firstLine = lines[0];
        const status = firstLine.orderStatus;
        const returnStatus = firstLine.returnStatus;
        const dateStr = firstLine.orderDate || (firstLine as any).orderCreationDate;
        let dateKey = 'Unknown';
        if (dateStr) {
            const d = parseShopeeDate(dateStr);
            if (d) dateKey = d.toISOString().split('T')[0];
        }
        const province = firstLine.province || 'Khác';

        // Custom status grouping for Section V
        let finalStatus = 'Khác';
        if (status === 'Đã hủy') {
            finalStatus = 'Đã hủy';
        } else if (status === 'Đang giao' || status === 'Chờ lấy hàng' || status === 'Đang vận chuyển' || status === 'Chờ giao hàng') {
            finalStatus = 'Đang giao';
        } else if (returnStatus === 'Đã Chấp Thuận Yêu Cầu') {
            finalStatus = 'Hoàn trả';
        } else if (status === 'Hoàn thành') {
            finalStatus = 'Hoàn thành';
        } else if (status.includes('Người mua xác nhận đã nhận được hàng') || status.includes('Trả hàng/Hoàn tiền')) {
            finalStatus = 'Giao hàng thành công (Có Y/C Trả hàng)';
        } else {
            finalStatus = status || 'Khác';
        }

        let orderListRevenue = 0; // list based on net qty for margin denominator
        let orderNetRevenue = 0;
        let orderCOGS = 0;
        let orderFees = 0;
        let orderProfit = 0;

        // 2. Trừ phí sàn (Cố định, Dịch vụ, Thanh toán) và 3. Phí vận chuyển trả hàng
        const fixedFee = firstLine.fixedFee || 0;
        const serviceFee = firstLine.serviceFee || 0;
        const paymentFee = firstLine.paymentFee || 0;
        const returnShippingFee = firstLine.returnShippingFee || 0;
        orderFees = fixedFee + serviceFee + paymentFee + returnShippingFee;

        lines.forEach(line => {
            const qty = line.quantity || 0;
            const returnQty = line.returnQuantity || 0;
            const originalPrice = line.originalPrice || 0;
            const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : originalPrice;
            const sellerRebate = line.sellerRebate || 0;

            // 1. Doanh thu thực nhận
            const lineNetRev = (actualSalePrice * qty) - sellerRebate;
            orderNetRevenue += lineNetRev;

            // 4. Giá vốn & Tính theo số lượng thực tế (ko hoàn trả)
            const netQty = qty - returnQty;
            const effectiveNetQty = netQty > 0 ? netQty : 0;

            const lineEffectiveOriginalRev = originalPrice * effectiveNetQty;
            orderListRevenue += lineEffectiveOriginalRev; // Dùng cho mẫu số của Margin
            orderCOGS += lineEffectiveOriginalRev * 0.4;
        });

        orderProfit = orderNetRevenue - orderCOGS - orderFees;

        // Status Map
        if (!statusCounts[finalStatus]) statusCounts[finalStatus] = { count: 0, listRevenue: 0 };
        statusCounts[finalStatus].count += 1;
        statusCounts[finalStatus].listRevenue += orderListRevenue;

        // Is Realized?
        // Trạng thái đơn hàng <> "Đã hủy"
        // Trạng thái Trả hàng/Hoàn tiền <> "Đã Chấp Thuận Yêu Cầu"
        const isRealized = status !== 'Đã hủy' && returnStatus !== 'Đã Chấp Thuận Yêu Cầu';

        if (isRealized) {
            totalRealizedNetRevenue += orderNetRevenue;
            totalRealizedProfit += orderProfit;
            totalRealizedListRevenue += orderListRevenue; // Accumulate globally
            totalRealizedSuccessfulOrdersCount += 1;

            // Trend
            if (!trendsMap[dateKey]) trendsMap[dateKey] = { listRevenue: 0, netRevenue: 0, profit: 0 };
            trendsMap[dateKey].listRevenue += orderListRevenue;
            trendsMap[dateKey].netRevenue += orderNetRevenue;
            trendsMap[dateKey].profit += orderProfit;

            // Province
            if (!provinceMap[province]) provinceMap[province] = { listRevenue: 0, netRevenue: 0, profit: 0 };
            provinceMap[province].listRevenue += orderListRevenue;
            provinceMap[province].netRevenue += orderNetRevenue;
            provinceMap[province].profit += orderProfit;

            // SKU
            lines.forEach(line => {
                const sku = line.skuReferenceNo || line.productName || 'Unknown';
                const qty = line.quantity || 0;
                const returnQty = line.returnQuantity || 0;
                const originalPrice = line.originalPrice || 0;

                const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : originalPrice;
                const sellerRebate = line.sellerRebate || 0;

                // 1. Doanh thu thực nhận
                const lineNetRev = (actualSalePrice * qty) - sellerRebate;

                // Tính theo số lượng thực tế
                const netQty = qty - returnQty;
                const effectiveNetQty = netQty > 0 ? netQty : 0;
                const lineEffectiveOriginalRev = originalPrice * effectiveNetQty;
                const lineCOGS = lineEffectiveOriginalRev * 0.4;

                // Allocate fees proportional to lineNetRev / orderNetRevenue
                const feeRatio = orderNetRevenue > 0 ? (lineNetRev / orderNetRevenue) : 0;
                const lineFee = orderFees * feeRatio;
                const lineProfit = lineNetRev - lineCOGS - lineFee;

                if (!skuMap[sku]) skuMap[sku] = { name: line.productName || 'Unknown', quantity: 0, listRevenue: 0, netRevenue: 0, profit: 0 };
                skuMap[sku].quantity += effectiveNetQty;
                skuMap[sku].listRevenue += lineEffectiveOriginalRev;
                skuMap[sku].netRevenue += lineNetRev;
                skuMap[sku].profit += lineProfit;
            });
        }
    });

    // Mẫu số của Margin dựa trên listRevenue (Giá gốc * sl giữ lại)
    const currentMargin = totalRealizedListRevenue > 0 ? (totalRealizedProfit / totalRealizedListRevenue) * 100 : 0;
    const currentAOV = totalRealizedSuccessfulOrdersCount > 0 ? (totalRealizedNetRevenue / totalRealizedSuccessfulOrdersCount) : 0;

    const statusData = Object.keys(statusCounts).map(status => {
        const count = statusCounts[status].count;
        return {
            status,
            count,
            revenue: statusCounts[status].listRevenue,
            percentOfCount: totalAllOrdersCount > 0 ? (count / totalAllOrdersCount) * 100 : 0
        };
    }).sort((a, b) => b.revenue - a.revenue);

    const dailyTrends = Object.keys(trendsMap).sort().map(date => {
        const item = trendsMap[date];
        return {
            date,
            netRevenue: item.netRevenue,
            profit: item.profit,
            margin: Number((item.listRevenue > 0 ? (item.profit / item.listRevenue) * 100 : 0).toFixed(2))
        };
    });

    const topSKUs = Object.keys(skuMap).map(sku => {
        const item = skuMap[sku];
        return {
            sku,
            name: item.name,
            revenue: item.netRevenue,
            profit: item.profit,
            margin: item.listRevenue > 0 ? (item.profit / item.listRevenue) * 100 : 0,
            quantity: item.quantity,
            contribution: totalRealizedNetRevenue > 0 ? (item.netRevenue / totalRealizedNetRevenue) * 100 : 0
        };
    }).sort((a, b) => b.revenue - a.revenue);

    const topProvinces = Object.keys(provinceMap).map(province => {
        const item = provinceMap[province];
        return {
            province,
            revenue: item.netRevenue,
            profit: item.profit,
            margin: item.netRevenue > 0 ? (item.profit / item.netRevenue) * 100 : 0,
            contribution: totalRealizedNetRevenue > 0 ? (item.netRevenue / totalRealizedNetRevenue) * 100 : 0
        };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
        currentNetRevenue: totalRealizedNetRevenue,
        currentProfit: totalRealizedProfit,
        currentMargin,
        currentAOV,
        statusData,
        dailyTrends,
        topSKUs,
        topProvinces
    };
};

export default function RevenuePage() {
    const [metrics, setMetrics] = useState<RevenueDashboardMetrics | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<RevenueDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate, warehouse } = useFilter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/orders');
                const orders: ShopeeOrder[] = await res.json();

                // Current Period
                const filtered = filterOrders(orders, startDate, endDate, warehouse);
                if (filtered.length > 0) {
                    setMetrics(calculateRevenueMetrics(filtered));
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
                        setPrevMetrics(calculateRevenueMetrics(prevFiltered));
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
    }, [startDate, endDate, warehouse]);

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
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân Tích Doanh Thu & Lợi Nhuận</h1>
                <p className="text-muted-foreground mt-1 text-sm">Không tính đơn Hủy & Hoàn trả - Trợ giá Shop/Shopee đã trừ - COGS mặc định 40%</p>
            </div>

            {/* Section II: KPIs Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Doanh Thu Net</p>
                        </div>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-blue-500">{formatVND(metrics.currentNetRevenue)}</h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentNetRevenue} prev={prevMetrics.currentNetRevenue} />}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Lợi Nhuận</p>
                        </div>
                        <Wallet className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-emerald-500">{formatVND(metrics.currentProfit)}</h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentProfit} prev={prevMetrics.currentProfit} />}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Biên Lợi Nhuận %</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-purple-500">{formatNumber(metrics.currentMargin, 2)}%</h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentMargin} prev={prevMetrics.currentMargin} />}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">AOV (Giá trị ĐH Trung bình)</p>
                        </div>
                        <ShoppingCart className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-amber-500">{formatVND(metrics.currentAOV)}</h3>
                        {prevMetrics && <PoPIndicator current={metrics.currentAOV} prev={prevMetrics.currentAOV} />}
                    </div>
                </div>
            </div>

            {/* Section I: Revenue & Profit Composed Chart */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
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
                                name="Doanh Thu Net"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={false}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="profit"
                                name="Lợi Nhuận"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Section III: SKU Analysis */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-500" />
                        DOANH THU THEO SKU (Top 10)
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
                                <Bar dataKey="revenue" name="Doanh Thu Net" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Top SKU Table */}
                    <div className="flex-1 overflow-auto max-h-[400px]">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-muted-foreground font-medium border-b border-border sticky top-0 bg-card z-10">
                                <tr>
                                    <th className="pb-3 pl-2">SKU / Sản phẩm</th>
                                    <th className="pb-3 text-right">Đã bán</th>
                                    <th className="pb-3 text-right">Doanh thu</th>
                                    <th className="pb-3 text-right">Lợi nhuận</th>
                                    <th className="pb-3 text-right">Margin %</th>
                                    <th className="pb-3 text-right pr-2">% Đóng góp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {metrics.topSKUs.map((p, idx) => (
                                    <tr key={idx} className="group hover:bg-muted/50 transition-colors">
                                        <td className="py-3 pl-2 max-w-[200px]" title={p.name}>
                                            <div className="font-medium text-foreground truncate">{p.sku}</div>
                                            <div className="text-xs text-muted-foreground truncate">{p.name}</div>
                                        </td>
                                        <td className="py-3 text-right">{p.quantity}</td>
                                        <td className="py-3 text-right font-medium text-blue-500">{formatVND(p.revenue)}</td>
                                        <td className="py-3 text-right font-medium text-emerald-500">{formatVND(p.profit)}</td>
                                        <td className="py-3 text-right">{formatNumber(p.margin, 2)}%</td>
                                        <td className="py-3 text-right pr-2">{formatNumber(p.contribution, 2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Section IV: Province Analysis */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            DOANH THU THEO KHU VỰC
                        </h3>
                        <div className="flex-1 overflow-auto max-h-[300px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-muted-foreground font-medium border-b border-border sticky top-0 bg-card z-10">
                                    <tr>
                                        <th className="pb-3 pl-2">Tỉnh / Thành phố</th>
                                        <th className="pb-3 text-right">Doanh thu</th>
                                        <th className="pb-3 text-right">Lợi Nhuận</th>
                                        <th className="pb-3 text-right pr-2">% Đóng góp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {metrics.topProvinces.map((loc, idx) => (
                                        <tr key={idx} className="group hover:bg-muted/50 transition-colors">
                                            <td className="py-3 pl-2 truncate font-medium">{loc.province}</td>
                                            <td className="py-3 text-right text-blue-500">{formatVND(loc.revenue)}</td>
                                            <td className="py-3 text-right text-emerald-500">{formatVND(loc.profit)}</td>
                                            <td className="py-3 text-right pr-2">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>{formatNumber(loc.contribution, 2)}%</span>
                                                    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500"
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
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                            DOANH THU THEO TRẠNG THÁI (Mọi Đơn Hàng)
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
