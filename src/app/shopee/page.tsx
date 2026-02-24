"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    DollarSign, ShoppingBag, CreditCard, Ticket, Activity, TrendingUp,
    CheckCircle2, XCircle, RefreshCcw, AlertTriangle, PieChart as PieIcon,
    BarChart3, Users, Truck, Clock, AlertCircle, ChevronRight, Eye, ShieldAlert,
    MapPin, Package, Download, Info, Table as TableIcon, Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';
import { useFilter } from '@/contexts/FilterContext';
import { calculateMetrics, filterOrders } from '@/utils/calculator';
import { MetricResult, ShopeeOrder, FeeAlertOrder, CustomerAnalysis } from '@/utils/types';
import { formatVND, formatNumber, formatDateVN } from '@/utils/format';
import { KPICard } from '@/components/KPICard';
import { ChartTooltip } from '@/components/ChartTooltip';
import { PageSkeleton } from '@/components/Skeleton';
import clsx from 'clsx';

export default function ShopeeMasterDashboard() {
    const { startDate, endDate, warehouse, channelKeys, adExpenseX } = useFilter();
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalysis | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Force shopee channel
                const res = await fetch('/api/orders?channel=shopee');
                const orders: ShopeeOrder[] = await res.json();
                const filtered = filterOrders(orders, startDate, endDate, warehouse);

                if (filtered.length > 0) {
                    setMetrics(calculateMetrics(filtered, { startDate, endDate, adExpenseX }));
                } else {
                    setMetrics(null);
                }
            } catch (err) {
                console.error("Failed to fetch shopee data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate, warehouse, adExpenseX]);

    if (loading) return <PageSkeleton />;
    if (!metrics) return <NoDataView />;

    return (
        <div className="space-y-10 pb-20 max-w-[1600px] mx-auto pt-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="bg-[#ee4d2d] p-2 rounded-xl shadow-lg shadow-[#ee4d2d]/20">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        SHOPEE MASTER DASHBOARD
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium italic">Báo cáo quản trị 360° dành cho Shop Manager & CFO</p>
                </div>
                <div className="flex items-center gap-2 bg-card/30 backdrop-blur-md border border-white/5 p-3 rounded-2xl">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Trạng thái hệ thống</p>
                        <p className="text-xs font-bold text-emerald-500">Dữ liệu đã sẵn sàng</p>
                    </div>
                </div>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 gap-12">

                {/* SECTION I: BỨC TRANH TÀI CHÍNH */}
                <Section title="I. BỨC TRANH TÀI CHÍNH" icon={DollarSign} color="blue">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KPICard
                            title="TỔNG GMV"
                            value={formatVND(metrics.totalGMV)}
                            icon={ShoppingBag}
                            color="violet"
                            className="master-card border-white/5 shadow-lg"
                            formula="Tổng giá trị niêm yết"
                        />
                        <KPICard
                            title="TỔNG ĐƠN HÀNG"
                            value={formatNumber(metrics.totalOrders)}
                            icon={Package}
                            color="indigo"
                            className="master-card border-white/5 shadow-lg"
                            formula="Số đơn phát sinh"
                        />
                        <KPICard
                            title="PHÍ SÀN (C% )"
                            value={formatVND(metrics.totalPlatformFees)}
                            icon={CreditCard}
                            color="rose"
                            className="master-card border-white/5 shadow-lg"
                            formula="Cố định + Dịch vụ + Thanh toán"
                        />
                        <KPICard
                            title="TRỢ GIÁ SHOP"
                            value={formatVND(metrics.totalShopSubsidies)}
                            icon={Ticket}
                            color="amber"
                            className="master-card border-white/5 shadow-lg"
                            formula="Voucher + Combo + Trợ giá"
                        />
                        <KPICard
                            title="GIÁ TRỊ ĐƠN (AOV)"
                            value={formatVND(metrics.avgOrderValue)}
                            icon={Activity}
                            color="blue"
                            className="master-card border-white/5 shadow-lg"
                            formula="GMV / Tổng đơn"
                        />
                        <KPICard
                            title="DOANH THU THUẦN"
                            value={formatVND(metrics.totalActualNet)}
                            icon={TrendingUp}
                            color="emerald"
                            className="master-card border-white/5 shadow-lg"
                            formula="GMV - Phí - Trợ giá - Hoàn"
                        />
                    </div>
                </Section>

                {/* SECTION II: HIỆU SUẤT ĐƠN HÀNG */}
                <Section title="II. HIỆU SUẤT ĐƠN HÀNG" icon={Activity} color="indigo">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-card/40 p-6 rounded-3xl border border-white/5 shadow-xl backdrop-blur-sm h-[400px]">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase mb-6 tracking-widest flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-400" /> Biến động đơn hàng theo ngày
                                </h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={metrics.revenueTrend}>
                                        <defs>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tickFormatter={(d) => d.split('-').slice(2).join('/')} stroke="#666" fontSize={10} />
                                        <YAxis stroke="#666" fontSize={10} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="orders" name="Số đơn hàng" stroke="#6366f1" fill="url(#colorOrders)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <StatCard title="Đơn thành công" value={metrics.completedOrders} total={metrics.totalOrders} color="emerald" icon={CheckCircle2} />
                            <StatCard title="Đơn hoàn" value={metrics.returnedOrdersCount} total={metrics.totalOrders} color="amber" icon={RefreshCcw} hint="Bao gồm Trả hàng/Hoàn tiền" />
                            <StatCard title="Đơn hủy" value={metrics.canceledOrders} total={metrics.totalOrders} color="rose" icon={XCircle} />

                            <div className="bg-card/40 p-5 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase italic tracking-wider flex items-center gap-2">
                                    <Info className="w-3 h-3 text-blue-400" /> Lý do hủy/hoàn tiêu biểu
                                </h4>
                                <div className="space-y-2">
                                    {metrics.cancelAnalysis.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground truncate max-w-[150px]">{item.reason}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-muted h-1 rounded-full overflow-hidden">
                                                    <div className="bg-rose-500 h-full" style={{ width: `${(item.count / metrics.totalOrders * 100)}%` }} />
                                                </div>
                                                <span className="font-bold min-w-[30px] text-right">{item.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {metrics.cancelAnalysis.length === 0 && <p className="text-[10px] text-muted-foreground italic">Không có dữ liệu hủy</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* SECTION III: CẢNH BÁO THEO ĐƠN HÀNG */}
                <Section title="III. CẢNH BÁO THEO ĐƠN HÀNG (FEE ALERT)" icon={AlertTriangle} color="rose">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-7 shadow-glow-rose relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-rose-500/20 p-3 rounded-2xl">
                                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-rose-500 tracking-tight">Đơn hàng phí cao &gt;50%</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Phát hiện {metrics.feeAlerts.length} đơn hàng rủi ro tài chính</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {metrics.feeAlerts.map((alert, idx) => (
                                    <div key={idx} className="bg-background/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-rose-500/30 transition-all hover:translate-x-1 duration-300">
                                        <div>
                                            <p className="text-xs font-black text-foreground">#{alert.orderId}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full font-black">{alert.feeRatio.toFixed(1)}% FEE</span>
                                                <span className="text-[10px] text-muted-foreground font-bold">GMV: {formatVND(alert.gmv)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Ngắt lợi nhuận</p>
                                            <AlertCircle className="w-4 h-4 text-rose-500 opacity-40 group-hover:opacity-100 mt-1" />
                                        </div>
                                    </div>
                                ))}
                                {metrics.feeAlerts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                                        <CheckCircle2 className="w-10 h-10 mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Tuyệt vời! Không có đơn rủi ro</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card/40 border border-white/5 rounded-3xl p-8 flex flex-col justify-center shadow-inner">
                            <h4 className="text-sm font-black text-foreground mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <Info className="w-4 h-4 text-blue-400" /> Phân tích & Giải pháp (Manager Core)
                            </h4>
                            <div className="space-y-6">
                                <div className="flex gap-5">
                                    <div className="w-1.5 bg-amber-500/50 rounded-full" />
                                    <div>
                                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Nguyên nhân phổ biến</p>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                            Hầu hết các đơn hàng rủi ro có <span className="text-foreground font-bold italic">GMV dưới 50,000đ</span> nhưng phải gánh phí cố định (Fixed Fee) kết hợp với phí dịch vụ Freeship Extra/Hoàn Xu. Khi khách áp thêm Voucher Shop, biên lợi nhuận bị âm ngay lập tức.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <div className="w-1.5 bg-emerald-500/50 rounded-full" />
                                    <div>
                                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Hành động khắc phục</p>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                            1. Thiết lập giỏ hàng tối thiểu cho Voucher (Min Spend: 150k).<br />
                                            2. Sử dụng chiến lược <span className="text-foreground font-bold italic">Add-on Deal</span> hoặc <span className="text-foreground font-bold italic">Combo Khuyến Mãi</span> để đẩy AOV lên trên 100k.<br />
                                            3. Kiểm soát lại các sản phẩm phễu (Traffic SKU) tránh chạy quá nhiều Voucher.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* SECTION IV: PHÂN TÍCH ĐA CHIỀU */}
                <Section title="IV. PHÂN TÍCH ĐA CHIỀU (SKU, KHU VỰC, TRẠNG THÁI)" icon={PieIcon} color="violet">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ChartBox title="Top SKU theo doanh thu" icon={BarChart3}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.productPerformance.sort((a, b) => b.revenue - a.revenue).slice(0, 5)} layout="vertical" margin={{ left: -10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="sku" type="category" width={80} fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="revenue" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartBox>

                        <ChartBox title="Đơn hàng theo tỉnh thành" icon={MapPin}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.locationAnalysis.sort((a, b) => b.revenue - a.revenue).slice(0, 5)} margin={{ top: 20, bottom: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="province" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                                    <YAxis hide />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="revenue" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartBox>

                        <ChartBox title="Cấu trúc trạng thái đơn" icon={Activity}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.statusAnalysis}
                                        cx="50%" cy="45%"
                                        innerRadius={45} outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="status"
                                    >
                                        {metrics.statusAnalysis.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f43f5e', '#facc15', '#a855f7', '#6366f1'][index % 6]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartBox>
                    </div>
                </Section>

                {/* SECTION V & VI: CHI TIẾT & VẬN HÀNH (Split) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <Section title="V. CHI TIẾT ĐƠN HÀNG" icon={Package} color="amber">
                        <div className="bg-card/40 border border-white/5 rounded-3xl p-8 grid grid-cols-2 gap-y-10 gap-x-6 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <Info className="w-24 h-24" />
                            </div>
                            <SmallInfo label="Tỷ lệ Hoàn/Hủy gộp" value={`${((metrics.returnedOrdersCount + metrics.canceledOrders) / metrics.totalOrders * 100).toFixed(1)}%`} color="rose" />
                            <SmallInfo label="Tốc độ xử lý TB" value={`${metrics.avgProcessingTime.toFixed(1)} ngày`} color="blue" sub="Đặt hàng → Giao kho" />
                            <SmallInfo label="Giao chậm (>5 ngày)" value={`${metrics.slowDeliveryCount} đơn`} color="amber" sub="Cần tối ưu đối tác vận chuyển" />
                            <SmallInfo label="Hiệu suất giao Đạt" value={`${(metrics.completedOrders / metrics.totalOrders * 100).toFixed(1)}%`} color="emerald" sub="Success Delivery Rate" />
                        </div>
                    </Section>

                    <Section title="VI. HIỆU SUẤT VẬN TẢI" icon={Truck} color="emerald">
                        <div className="bg-card/40 border border-white/5 rounded-3xl p-6 overflow-hidden shadow-inner h-full flex flex-col">
                            <table className="w-full text-left text-[11px]">
                                <thead className="text-muted-foreground font-black uppercase tracking-widest border-b border-white/10">
                                    <tr>
                                        <th className="pb-4 text-left">ĐV Vận chuyển</th>
                                        <th className="pb-4 text-center">Đơn</th>
                                        <th className="pb-4 text-center">Tỷ lệ Thành công</th>
                                        <th className="pb-4 text-right">Time (ngày)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-medium">
                                    {metrics.carrierPerformance.map((carrier, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-4 font-black text-foreground flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {carrier.carrier}
                                            </td>
                                            <td className="py-4 text-center text-muted-foreground">{carrier.returnCount + metrics.completedOrders /* approx */}</td>
                                            <td className="py-4 text-center">
                                                <span className={clsx("px-2 py-0.5 rounded-full font-black", carrier.successRate > 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                                    {carrier.successRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-4 text-right font-black">{carrier.avgDeliveryTime.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                    {metrics.carrierPerformance.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-muted-foreground italic">Không có dữ liệu vận tải</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                </div>

                {/* SECTION VII: PHÂN TÍCH KHÁCH HÀNG */}
                <Section title="VII. DỮ LIỆU KHÁCH HÀNG (RETENTION)" icon={Users} color="blue">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-glow-blue relative overflow-hidden group">
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[11px] text-blue-400 uppercase font-black tracking-widest mb-3">Loyalty Repeat Rate</p>
                            <h3 className="text-5xl font-black text-blue-500 animate-pulse-slow">{metrics.loyaltyStats.repeatRate.toFixed(1)}%</h3>
                            <div className="mt-6 space-y-2">
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" /> {metrics.loyaltyStats.returningCustomers} Khách quy quay lại
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-muted" /> {metrics.loyaltyStats.newCustomers} Khách hàng mới
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-3 bg-card/40 border border-white/5 rounded-3xl p-6 overflow-hidden shadow-inner">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-4 flex items-center gap-2 tracking-widest">
                                <TableIcon className="w-3.5 h-3.5 text-blue-400" /> Danh sách khách hàng tiêu biểu (Top Spend)
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-muted-foreground font-black uppercase tracking-widest border-b border-white/10">
                                        <tr>
                                            <th className="pb-4">Username</th>
                                            <th className="pb-4">Tổng chi tiêu (GMV)</th>
                                            <th className="pb-4 text-center">Số đơn</th>
                                            <th className="pb-4 text-right">Lần mua cuối</th>
                                            <th className="pb-4 text-center">Lịch sử</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {metrics.customerAnalysis.slice(0, 5).map((customer, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-all duration-300">
                                                <td className="py-4 font-black text-blue-400 group flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px]">
                                                        {(customer.buyerUsername || 'N').substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-blue-400">@{customer.buyerUsername}</span>
                                                            <span className="text-[8px] bg-white/5 px-1 rounded text-muted-foreground">Buyer</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Users className="w-3 h-3 opacity-50" /> {customer.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 font-black text-foreground">{formatVND(customer.totalSpent)}</td>
                                                <td className="py-4 text-center">
                                                    <span className="bg-muted px-2.5 py-1 rounded-lg font-black">{customer.orderCount}</span>
                                                </td>
                                                <td className="py-4 text-right text-muted-foreground font-medium">{customer.lastOrderDate.split(' ')[0]}</td>
                                                <td className="py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                                                        title="Xem lịch sử mua hàng"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Section>

            </div>

            {/* History Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-3xl">
                            <div>
                                <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter text-foreground">
                                    <ShoppingBag className="w-5 h-5 text-[#ee4d2d]" /> Lịch Sử Mua Hàng
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm font-bold text-blue-400">@{selectedCustomer.buyerUsername}</p>
                                    <span className="text-muted-foreground/40 text-xs text-black">•</span>
                                    <p className="text-xs text-muted-foreground font-medium italic">Bên mua: {selectedCustomer.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="text-muted-foreground hover:text-foreground p-2 hover:bg-white/5 rounded-full transition-colors font-black"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 custom-scrollbar">
                            <table className="w-full text-xs text-left">
                                <thead className="text-muted-foreground font-black uppercase tracking-widest text-[9px] border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4">Ngày Mua</th>
                                        <th className="px-6 py-4">Mã Đơn</th>
                                        <th className="px-6 py-4 text-right">Giá Trị</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-medium">
                                    {selectedCustomer.history?.sort((a, b) => b.date.localeCompare(a.date)).map((h, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr
                                                className="hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => setExpandedOrderId(expandedOrderId === h.orderId ? null : h.orderId)}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">{h.date}</td>
                                                <td className="px-6 py-4 text-blue-400 font-bold group">
                                                    <span className="underline decoration-blue-400/30 underline-offset-4 group-hover:decoration-blue-400 transition-colors">
                                                        {h.orderId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-foreground">{formatVND(h.value)}</td>
                                            </tr>
                                            {expandedOrderId === h.orderId && (
                                                <tr className="bg-white/2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <td colSpan={3} className="px-4 py-4">
                                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                                                            <p className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-widest flex items-center gap-2">
                                                                <Package className="w-3 h-3" /> Chi tiết sản phẩm
                                                            </p>
                                                            {h.products?.map((p, pIdx) => (
                                                                <div key={pIdx} className="flex justify-between items-start gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-foreground leading-snug">{p.name}</p>
                                                                        {p.variation && (
                                                                            <p className="text-[10px] text-muted-foreground mt-1 bg-white/5 inline-block px-1.5 py-0.5 rounded">
                                                                                Phân loại: <span className="text-blue-400">{p.variation}</span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <div className="text-[10px] font-black text-muted-foreground">x{p.quantity}</div>
                                                                        <div className="font-black text-emerald-500 mt-1">{formatVND(p.price)}</div>
                                                                        {p.originalPrice > p.price && (
                                                                            <div className="text-[9px] text-muted-foreground line-through opacity-50 font-bold">
                                                                                {formatVND(p.originalPrice)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-white/5 flex justify-end">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="px-6 py-2.5 bg-[#ee4d2d] hover:bg-[#ee4d2d]/90 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-[#ee4d2d]/20 uppercase tracking-widest"
                            >
                                ĐÓNG
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- TẦNG COMPONENT NỘI BỘ (INTERNAL UI KIT) ---

function Section({ title, icon: Icon, children, color }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-5">
                <div className={clsx("p-3 rounded-2xl border shadow-lg", colorClasses[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">{title}</h2>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-muted to-transparent opacity-20" />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
        </section>
    );
}

function StatCard({ title, value, total, color, icon: Icon, hint }: any) {
    const percentage = total > 0 ? (value / total * 100).toFixed(1) : '0';
    return (
        <div className="bg-card/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all shadow-sm">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className={clsx("text-2xl font-black tracking-tight", color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500')}>
                        {value}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-bold">({percentage}%)</span>
                </div>
                {hint && <p className="text-[9px] text-muted-foreground italic font-medium opacity-80">{hint}</p>}
            </div>
            <div className={clsx("p-2 rounded-xl transition-all group-hover:scale-110", color === 'emerald' ? 'bg-emerald-500/10' : color === 'amber' ? 'bg-amber-500/10' : 'bg-rose-500/10')}>
                <Icon className={clsx("w-5 h-5", color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500')} />
            </div>
        </div>
    );
}

function SmallInfo({ label, value, color, sub }: any) {
    return (
        <div className="space-y-1.5 relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
            <p className={clsx("text-2xl font-black tracking-tight", color === 'rose' ? 'text-rose-500' : color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : 'text-amber-500')}>
                {value}
            </p>
            {sub && <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>}
        </div>
    );
}

function ChartBox({ title, icon: Icon, children }: any) {
    return (
        <div className="bg-card/40 p-6 rounded-3xl border border-white/5 h-[320px] flex flex-col shadow-xl backdrop-blur-sm group hover:border-white/10 transition-colors">
            <h4 className="text-[11px] font-black text-muted-foreground uppercase mb-6 flex items-center gap-2 tracking-widest">
                <Icon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" /> {title}
            </h4>
            <div className="flex-1 w-full relative">
                {children}
            </div>
        </div>
    );
}

function NoDataView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-card/10 rounded-3xl border border-dashed border-white/10">
            <div className="bg-muted p-6 rounded-full mb-6">
                <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-black text-foreground">KHÔNG CÓ DỮ LIỆU SHOPEE</h2>
            <p className="text-muted-foreground mt-4 max-w-sm font-medium">
                Hệ thống không tìm thấy bất kỳ đơn hàng Shopee nào trong khoảng thời gian này. Vui lòng kiểm tra lại bộ lọc hoặc tải lên file dữ liệu Excel mới.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-8 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
                TẢI LẠI TRANG
            </button>
        </div>
    );
}
