import React, { useState, useMemo } from 'react';
import { OrderRiskAnalysis } from '../utils/types';
import { formatVND, formatNumber } from '../utils/format';
import {
    AlertTriangle,
    TrendingDown,
    AlertOctagon,
    CheckCircle2,
    Search,
    Filter,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Percent,
    DollarSign,
    Activity,
    RotateCcw
} from 'lucide-react';
import clsx from 'clsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface OrderRiskControlCenterProps {
    analysis: OrderRiskAnalysis[];
    stats: {
        totalOrders: number;
        highRiskCount: number;
        lossCount: number;
        avgControlRatio: number;
        totalLossAmount: number;
        totalReturnImpactValue: number;
        totalReturnImpactRate: number;
    };
}

const WARNING_COLORS = {
    SAFE: '#10b981',    // Emerald 500
    MONITOR: '#3b82f6', // Blue 500
    WARNING: '#f59e0b', // Amber 500
    DANGER: '#ef4444'   // Red 500
};

const ROOT_CAUSE_LABELS: Record<string, string> = {
    'A': 'Voucher Cao',
    'B': 'Phí Sàn Cao (>25%)',
    'C': 'Giá Trị Thấp & Phí CĐ',
    'D': 'Lỗ Cấu Trúc',
    'E': 'Tổng phí KM cao',
    'N/A': 'Khác'
};

// Simple KPI Card Component Inline
const KPICard = ({ title, value, icon, subtext, color }: any) => (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:bg-accent/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">{title}</span>
            {icon}
        </div>
        <div>
            <div className={clsx("text-2xl font-bold tracking-tight", color || "text-card-foreground")}>
                {typeof value === 'number' ? formatNumber(value) : value}
            </div>
            {subtext && <div className="text-xs text-muted-foreground mt-1">{subtext}</div>}
        </div>
    </div>
);

const DatbaseIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
)

export const OrderRiskControlCenter: React.FC<OrderRiskControlCenterProps> = ({ analysis, stats }) => {
    const { theme } = useTheme();
    const [filterLevel, setFilterLevel] = useState<string>('ALL');
    const [filterRootCause, setFilterRootCause] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Chart Colors based on Theme
    const isDark = theme === 'dark';
    const axisColor = isDark ? '#cbd5e1' : '#64748b'; // Slate 300 (Dark) vs Slate 500 (Light)
    const gridColor = isDark ? '#334155' : '#e2e8f0'; // Slate 700 (Dark) vs Slate 200 (Light)
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
    const tooltipText = isDark ? '#f1f5f9' : '#0f172a';

    // Filter Logic
    const filteredData = useMemo(() => {
        return analysis.filter(item => {
            if (filterLevel !== 'ALL' && item.warningLevel !== filterLevel) return false;
            if (filterRootCause !== 'ALL' && item.rootCause !== filterRootCause) return false;
            return true;
        });
    }, [analysis, filterLevel, filterRootCause]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Chart Data Preparation
    const controlRatioDistribution = useMemo(() => {
        const ranges = {
            '0-30%': 0, '30-40%': 0, '40-50%': 0, '50-60%': 0, '60-70%': 0, '>70%': 0
        };
        analysis.forEach(item => {
            const r = item.controlRatio;
            if (r <= 30) ranges['0-30%']++;
            else if (r <= 40) ranges['30-40%']++;
            else if (r <= 50) ranges['40-50%']++;
            else if (r <= 60) ranges['50-60%']++;
            else if (r <= 70) ranges['60-70%']++;
            else ranges['>70%']++;
        });
        return Object.entries(ranges).map(([name, value]) => ({ name, value }));
    }, [analysis]);

    const warningLevelDistribution = useMemo(() => {
        const counts = { SAFE: 0, MONITOR: 0, WARNING: 0, DANGER: 0 };
        analysis.forEach(item => {
            if (counts[item.warningLevel] !== undefined) counts[item.warningLevel]++;
        });
        return [
            { name: 'An Toàn (≤40%)', value: counts.SAFE, color: WARNING_COLORS.SAFE },
            { name: 'Theo Dõi (40-50%)', value: counts.MONITOR, color: WARNING_COLORS.MONITOR },
            { name: 'Cảnh Báo (50-70%)', value: counts.WARNING, color: WARNING_COLORS.WARNING },
            { name: 'Nguy Hiểm (>70%)', value: counts.DANGER, color: WARNING_COLORS.DANGER }
        ];
    }, [analysis]);

    const topLossOrders = useMemo(() => {
        return analysis
            .filter(i => i.netProfit < 0)
            .sort((a, b) => a.netProfit - b.netProfit) // Most negative first
            .slice(0, 20)
            .map(i => ({
                orderId: i.orderId,
                netProfit: i.netProfit,
                lossAmount: Math.abs(i.netProfit),
                controlRatio: i.controlRatio
            }));
    }, [analysis]);

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <AlertOctagon className="w-8 h-8 text-red-600 dark:text-red-500" />
                <div>
                    <h2 className="text-2xl font-bold text-card-foreground tracking-tight">TRUNG TÂM KIỂM SOÁT RỦI RO ĐƠN HÀNG</h2>
                    <p className="text-sm text-muted-foreground">Giám sát chi phí vận hành & Cảnh báo đơn hàng rủi ro</p>
                </div>
            </div>

            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <KPICard
                    title="Đơn Thành Công (Realized Orders)"
                    value={stats.totalOrders}
                    icon={<DatbaseIcon className="text-blue-500 dark:text-blue-400" />}
                    subtext="đang phân tích"
                />
                <KPICard
                    title="Đơn Rủi Ro (High Risk) (>50%)"
                    value={stats.highRiskCount}
                    icon={<AlertTriangle className="text-orange-500 dark:text-orange-400" />}
                    subtext={`${((stats.highRiskCount / stats.totalOrders) * 100).toFixed(1)}% đơn phân tích`}
                    color="text-orange-600 dark:text-orange-400"
                />
                <KPICard
                    title="Đơn Lỗ Thuần (Net Loss Orders)"
                    value={stats.lossCount}
                    icon={<TrendingDown className="text-red-500 dark:text-red-400" />}
                    subtext={`${((stats.lossCount / stats.totalOrders) * 100).toFixed(1)}% đơn phân tích`}
                    color="text-red-600 dark:text-red-400"
                />
                <KPICard
                    title="Tỷ Lệ Kiểm Soát TB (Avg Control Ratio)"
                    value={`${stats.avgControlRatio.toFixed(1)}%`}
                    icon={<Percent className="text-slate-500 dark:text-slate-400" />}
                    subtext="Chỉ số kiểm soát trung bình"
                />
                <KPICard
                    title="Tổng Lỗ Thực Tế (Total Loss)"
                    value={formatVND(stats.totalLossAmount)}
                    icon={<DollarSign className="text-red-600 dark:text-red-400" />}
                    subtext="Do đơn lỗ gây ra"
                    color="text-red-600 dark:text-red-400"
                />
                <KPICard
                    title="Return Impact (Risk Layer)"
                    value={formatVND(stats.totalReturnImpactValue)}
                    icon={<RotateCcw className="text-rose-500 dark:text-rose-400" />}
                    subtext={`${stats.totalReturnImpactRate.toFixed(1)}% Doanh thu bị bốc hơi`}
                    color="text-rose-600 dark:text-rose-400"
                />
            </div>

            {/* 2. Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" /> Phân Bố Control Ratio
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={controlRatioDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: axisColor }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: axisColor }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: tooltipBg,
                                        color: tooltipText
                                    }}
                                    formatter={(value: any) => [value, 'Đơn hàng (Orders)']}
                                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" /> Tỷ Lệ Cảnh Báo
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={warningLevelDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {warningLevelDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: tooltipBg,
                                        color: tooltipText
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ color: axisColor }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-muted-foreground" /> Top 20 Đơn Lỗ Nhất
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topLossOrders} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} opacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="orderId"
                                    width={140}
                                    tick={{ fontSize: 10, fill: axisColor }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: tooltipBg,
                                        color: tooltipText
                                    }}
                                    formatter={(value: any, name: any, props: any) => [formatVND(props.payload.netProfit), name]}
                                    labelFormatter={(label) => `Order: ${label}`}
                                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="lossAmount" name="netProfit" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Table & Filters */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Check Filters */}
                <div className="p-4 border-b border-border bg-muted/30 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                className="text-sm border-none focus:ring-0 text-card-foreground bg-transparent outline-none cursor-pointer"
                                value={filterLevel}
                                onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
                            >
                                <option className="bg-popover text-popover-foreground" value="ALL">Tất cả Mức Độ</option>
                                <option className="bg-popover text-popover-foreground" value="SAFE">An Toàn (≤40%)</option>
                                <option className="bg-popover text-popover-foreground" value="MONITOR">Theo Dõi (40-50%)</option>
                                <option className="bg-popover text-popover-foreground" value="WARNING">Cảnh Báo (50-70%)</option>
                                <option className="bg-popover text-popover-foreground" value="DANGER">Nguy Hiểm ({'>'}70%)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <select
                                className="text-sm border-none focus:ring-0 text-card-foreground bg-transparent outline-none cursor-pointer"
                                value={filterRootCause}
                                onChange={(e) => { setFilterRootCause(e.target.value); setCurrentPage(1); }}
                            >
                                <option className="bg-popover text-popover-foreground" value="ALL">Tất cả Nguyên Nhân</option>
                                <option className="bg-popover text-popover-foreground" value="A">Voucher Cao</option>
                                <option className="bg-popover text-popover-foreground" value="B">Phí Sàn Cao</option>
                                <option className="bg-popover text-popover-foreground" value="C">Giá Trị Thấp</option>
                                <option className="bg-popover text-popover-foreground" value="D">Lỗ Cấu Trúc</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {paginatedData.length} / {filteredData.length} đơn hàng
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-semibold border-b border-border whitespace-nowrap">
                            <tr>
                                <th className="p-3">Mã đơn (Order ID)</th>
                                <th className="p-3 text-right">Doanh thu (Revenue)</th>
                                <th className="p-3 text-right">KM Shop (Shop Promo)</th>
                                <th className="p-3 text-right">Phí Sàn (Platform Fee)</th>
                                <th className="p-3 text-center">Tỷ Lệ KS (Control Ratio)</th>
                                <th className="p-3 text-right">LCB (Structural Margin)</th>
                                <th className="p-3 text-right">Lợi Nhuận (Net Profit)</th>
                                <th className="p-3 text-right">Return Impact (Lỗ Hoàn)</th>
                                <th className="p-3">Nguyên Nhân (Root Cause)</th>
                                <th className="p-3 text-center">Cảnh báo (Warning)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedData.map((order, idx) => (
                                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-3 text-xs">
                                        <div className="font-bold text-blue-600 dark:text-blue-400">{order.orderId}</div>
                                        <div className="text-muted-foreground text-[10px]">{order.trackingNumber}</div>
                                    </td>
                                    <td className="p-3 text-right text-card-foreground">
                                        {formatVND(order.revenue)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className={clsx("font-bold", order.structuralMargin < 0 ? "text-red-500" : "text-card-foreground")}>
                                            {formatVND(order.structuralMargin)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {order.revenue > 0 ? ((order.structuralMargin / order.revenue) * 100).toFixed(1) : 0}%
                                        </div>
                                    </td>
                                    <td className={clsx("p-3 text-right font-bold", order.netProfit < 0 ? "text-red-600 bg-red-50/50 dark:text-red-400 dark:bg-red-900/20" : "text-emerald-600 dark:text-emerald-400")}>
                                        {formatVND(order.netProfit)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="text-rose-500 font-bold">
                                            {formatVND(order.returnImpactValue)}
                                        </div>
                                        {order.returnImpactValue > 0 && (
                                            <div className="text-[10px] text-muted-foreground flex flex-col items-end">
                                                <span>-{formatVND(order.lostGrossRevenue)} (Doanh thu)</span>
                                                <span>-{formatVND(order.nonRefundableFee)} (Phí ko hoàn)</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {order.rootCause !== 'N/A' && (
                                            <span className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-xs text-card-foreground">{ROOT_CAUSE_LABELS[order.rootCause]}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Tỷ trọng (Weight) {order.rootCauseValue.toFixed(1)}%
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center flex flex-col items-center gap-1">
                                        <div className="text-xs font-bold text-muted-foreground w-full bg-muted/50 rounded py-0.5" title="Risk Impact Score">
                                            {(order as any).riskImpactScore?.toFixed(1) || 0} pts
                                        </div>
                                        {order.isLoss && (
                                            <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border", (order as any).absoluteLossFlag ? "bg-red-600 text-white border-red-700" : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800")}>
                                                {(order as any).absoluteLossFlag ? 'LỖ NẶNG (HEAVY LOSS <-5%)' : 'ĐƠN LỖ (LOSS)'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                        className="p-1 px-3 rounded hover:bg-background border border-transparent hover:border-border disabled:opacity-30 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">Trang {currentPage} / {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                        className="p-1 px-3 rounded hover:bg-background border border-transparent hover:border-border disabled:opacity-30 disabled:hover:bg-transparent text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};
