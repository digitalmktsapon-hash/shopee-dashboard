"use client";

import React, { useEffect, useState } from 'react';
import { calculateMetrics, filterOrders } from '../../utils/calculator';
import { MetricResult, ShopeeOrder, ProductPerformance } from '../../utils/types';
import { Package, ArrowUpDown, ChevronUp, ChevronDown, AlertTriangle, Search } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatVND, formatNumber } from '../../utils/format';
import clsx from 'clsx';

export default function ProductsPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ProductPerformance | 'netProfit' | 'margin', direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
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
    }, [startDate, endDate, warehouse]);

    if (loading) return <PageSkeleton />;

    if (!metrics || !metrics.productPerformance) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Package className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu sản phẩm (đã lọc)</p>
            </div>
        );
    }

    // Filter & Sort
    let products = metrics.productPerformance.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    products.sort((a, b) => {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;
        // Badges is array, ignore for sort, or custom sort? TS keyof might be issue.
        // Cast to any for simple number sort
        return sortConfig.direction === 'desc' ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
    });

    const handleSort = (key: keyof ProductPerformance) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ colKey }: { colKey: keyof ProductPerformance }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground opacity-50" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-3 h-3 ml-1 text-primary" />
            : <ChevronDown className="w-3 h-3 ml-1 text-primary" />;
    };

    const PoPIndicator = ({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) => {
        if (!prev || prev === 0) return null;

        const diff = current - prev;
        const percentChange = (Math.abs(diff) / prev) * 100;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        // Define colors based on whether it's an expense (isInverse) or revenue/profit
        let colorClass = "text-muted-foreground"; // Default (no change)
        let Icon = null;

        if (isIncrease) {
            colorClass = isInverse ? "text-rose-500" : "text-emerald-500";
            Icon = "▲";
        } else if (isDecrease) {
            colorClass = isInverse ? "text-emerald-500" : "text-rose-500";
            Icon = "▼";
        }

        return (
            <div className="flex items-center justify-end mt-1 text-[10px] font-medium font-sans">
                <span className="text-muted-foreground lowercase opacity-80 mr-1">kỳ trước</span>
                {Icon && <span className={colorClass}>{Icon} {percentChange.toFixed(1)}%</span>}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân Tích Sản Phẩm (Product Analysis - CFO)</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Phân tích biên lợi nhuận, tỷ lệ hoàn và hiệu quả kinh doanh từng SKU.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm SKU, tên SP..."
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase sticky left-0 bg-muted/90 backdrop-blur z-10 w-[300px]">SKU / Tên Sản Phẩm (Product Name)</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('quantity')}>
                                    <div className="flex items-center justify-end">Đã Bán (Sold) <SortIcon colKey="quantity" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('revenue')}>
                                    <div className="flex items-center justify-end">Doanh Thu (Revenue) <SortIcon colKey="revenue" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('cogs')}>
                                    <div className="flex items-center justify-end">Giá Vốn (COGS) <SortIcon colKey="cogs" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('grossProfit')}>
                                    <div className="flex items-center justify-end">LN Gộp (Gross Profit) <SortIcon colKey="grossProfit" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('margin')}>
                                    <div className="flex items-center justify-end">Biên % (Margin %) <SortIcon colKey="margin" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('netProfit')}>
                                    <div className="flex items-center justify-end">Lãi Ròng (Net Profit) <SortIcon colKey="netProfit" /></div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSort('returnRate')}>
                                    <div className="flex items-center justify-end">Hoàn % (Return %) <SortIcon colKey="returnRate" /></div>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Badges</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.length > 0 ? (
                                products.map((p, idx) => {
                                    const prevP = prevMetrics?.productPerformance?.find(prev => prev.sku === p.sku);

                                    return (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-4 py-3 sticky left-0 bg-background/50 backdrop-blur-sm group-hover:bg-muted/50 transition-colors border-r border-border/50">
                                                <div className="font-bold text-sm text-foreground truncate max-w-[280px]" title={p.name}>{p.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-foreground font-mono">{formatNumber(p.quantity)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="text-sm text-foreground font-mono font-medium">{formatVND(p.revenue)}</div>
                                                <PoPIndicator current={p.revenue} prev={prevP?.revenue || 0} />
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-muted-foreground font-mono">{formatVND(p.cogs)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-emerald-400 font-mono font-medium">{formatVND(p.grossProfit)}</td>
                                            <td className={clsx("px-4 py-3 text-right text-sm font-bold font-mono", p.margin < 10 ? 'text-rose-400' : 'text-emerald-400')}>
                                                {p.margin.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className={clsx("text-sm font-bold font-mono", p.netProfit > 0 ? 'text-primary' : 'text-rose-500')}>
                                                    {formatVND(p.netProfit)}
                                                </div>
                                                <PoPIndicator current={p.netProfit} prev={prevP?.netProfit || 0} />
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <div className={clsx("px-2 py-0.5 rounded text-xs font-bold inline-block", p.returnRate > 5 ? 'bg-rose-500/10 text-rose-500' : 'text-muted-foreground')}>
                                                    {p.returnRate.toFixed(1)}%
                                                </div>
                                                <PoPIndicator current={p.returnRate} prev={prevP?.returnRate || 0} isInverse={true} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-1 justify-center flex-wrap">
                                                    {p.badges.map(b => (
                                                        <span key={b} className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                            b === 'Hero' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                                b === 'Traffic Driver' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                    b === 'Risk' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                                        "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                                        )}>
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-muted-foreground">Không tìm thấy sản phẩm nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
