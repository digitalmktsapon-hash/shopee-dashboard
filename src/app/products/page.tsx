"use client";

import React, { useEffect, useState } from 'react';
import { calculateProductEconomics, ProductEconomicsResult } from '../../utils/calculator';
import { filterOrders } from '../../utils/calculator';
import { ShopeeOrder } from '../../utils/types';
import { SkuEconomics, OrderEconomics, ParetoItem } from '../../utils/types';
import { Package, TrendingUp, ShieldAlert, BarChart3, Search, ArrowUpDown, ChevronUp, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatVND, formatNumber } from '../../utils/format';
import clsx from 'clsx';

type Tab = 'sku' | 'order' | 'portfolio';

const BADGE_STYLE: Record<string, string> = {
    '🔴 Kill List': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    '🟠 Risk': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    '🟢 Hero': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    '🔵 Traffic Driver': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'OK': 'bg-muted/50 text-muted-foreground border-border',
};

export default function ProductsPage() {
    const [data, setData] = useState<ProductEconomicsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('sku');
    const [searchSku, setSearchSku] = useState('');
    const [searchOrder, setSearchOrder] = useState('');
    const [skuSort, setSkuSort] = useState<{ key: keyof SkuEconomics; dir: 'asc' | 'desc' }>({ key: 'allocatedRevenue', dir: 'desc' });
    const [orderSort, setOrderSort] = useState<{ key: keyof OrderEconomics; dir: 'asc' | 'desc' }>({ key: 'totalActualPrice', dir: 'desc' });
    const { startDate, endDate, warehouse } = useFilter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/orders');
                const orders: ShopeeOrder[] = await res.json();
                const filtered = filterOrders(orders, startDate, endDate, warehouse);
                if (filtered.length > 0) {
                    setData(calculateProductEconomics(filtered));
                } else {
                    setData(null);
                }
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate, warehouse]);

    if (loading) return <PageSkeleton />;

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Package className="w-8 h-8" />
                </div>
                <p className="font-medium">Chưa có dữ liệu sản phẩm</p>
            </div>
        );
    }

    // ── Sort helpers ─────────────────────────────────────────────────────
    const sortBy = <T extends object>(arr: T[], key: keyof T, dir: 'asc' | 'desc') =>
        [...arr].sort((a, b) => {
            const va = a[key] as number;
            const vb = b[key] as number;
            return dir === 'desc' ? vb - va : va - vb;
        });

    const handleSkuSort = (key: keyof SkuEconomics) =>
        setSkuSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

    const handleOrderSort = (key: keyof OrderEconomics) =>
        setOrderSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

    const SortIcon = <T extends object>({ k, cfg }: { k: keyof T; cfg: { key: keyof T; dir: string } }) => {
        if (cfg.key !== k) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
        return cfg.dir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-primary" /> : <ChevronDown className="w-3 h-3 ml-1 text-primary" />;
    };

    // ── Filtered & Sorted data ────────────────────────────────────────────
    const skuFiltered = sortBy(
        data.skuEconomics.filter(p =>
            p.name.toLowerCase().includes(searchSku.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchSku.toLowerCase())
        ),
        skuSort.key,
        skuSort.dir
    );

    const orderFiltered = sortBy(
        data.orderEconomics.filter(o =>
            o.orderId.toLowerCase().includes(searchOrder.toLowerCase())
        ),
        orderSort.key,
        orderSort.dir
    );

    const { portfolio } = data;
    const breachedCount = data.orderEconomics.filter(o => o.guardrailBreached).length;

    // ── Tab config ────────────────────────────────────────────────────────
    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'sku', label: 'SKU Economics', icon: <Package className="w-4 h-4" /> },
        { id: 'order', label: 'Order Economics', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'portfolio', label: 'Portfolio Control', icon: <BarChart3 className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân Tích Sản Phẩm</h1>
                <p className="text-muted-foreground mt-1 text-sm">Kiểm soát margin ở cấp SKU, đơn hàng và tổng danh mục.</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-muted/50 border border-border rounded-xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            tab === t.id
                                ? 'bg-background text-foreground shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ══ TAB 1: SKU ECONOMICS ═══════════════════════════════════════ */}
            {tab === 'sku' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{skuFiltered.length} SKU</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm SKU, tên..."
                                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-[280px]"
                                value={searchSku}
                                onChange={e => setSearchSku(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase sticky left-0 bg-muted/90 backdrop-blur z-10 w-[280px]">SKU / Tên SP</th>
                                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase text-center">Loại</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('quantity')}>
                                            <div className="flex items-center justify-end">SL <SortIcon<SkuEconomics> k="quantity" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('listPrice')}>
                                            <div className="flex items-center justify-end">Niêm Yết <SortIcon<SkuEconomics> k="listPrice" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('allocatedRevenue')}>
                                            <div className="flex items-center justify-end">DT Phân Bổ <SortIcon<SkuEconomics> k="allocatedRevenue" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('cogs')}>
                                            <div className="flex items-center justify-end">Giá Vốn <SortIcon<SkuEconomics> k="cogs" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('fees')}>
                                            <div className="flex items-center justify-end">Phí Sàn <SortIcon<SkuEconomics> k="fees" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('subsidy')}>
                                            <div className="flex items-center justify-end">Trợ Giá <SortIcon<SkuEconomics> k="subsidy" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('profit')}>
                                            <div className="flex items-center justify-end">Lợi Nhuận <SortIcon<SkuEconomics> k="profit" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('margin')}>
                                            <div className="flex items-center justify-end">Biên % <SortIcon<SkuEconomics> k="margin" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleSkuSort('returnRate')}>
                                            <div className="flex items-center justify-end">Hoàn % <SortIcon<SkuEconomics> k="returnRate" cfg={skuSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Badge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {skuFiltered.length > 0 ? skuFiltered.map((p, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 sticky left-0 bg-background/80 backdrop-blur-sm hover:bg-muted/30 transition-colors border-r border-border/50">
                                                <div className="font-semibold text-foreground truncate max-w-[260px]" title={p.name}>{p.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold border',
                                                    p.skuType === 'Gift' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        p.skuType === 'Traffic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-muted/50 text-muted-foreground border-border'
                                                )}>{p.skuType}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-foreground">{formatNumber(p.quantity)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatVND(p.listPrice)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground">{formatVND(p.allocatedRevenue)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatVND(p.cogs)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-orange-400">{formatVND(p.fees)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatVND(p.subsidy)}</td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                                {formatVND(p.profit)}
                                            </td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', p.margin >= 25 ? 'text-emerald-400' : p.margin >= 15 ? 'text-yellow-400' : 'text-rose-400')}>
                                                {p.margin.toFixed(1)}%
                                            </td>
                                            <td className={clsx('px-4 py-3 text-right font-mono', p.returnRate >= 10 ? 'text-rose-400' : 'text-muted-foreground')}>
                                                {p.returnRate.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold border', BADGE_STYLE[p.badge] || BADGE_STYLE['OK'])}>
                                                    {p.badge}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">Không tìm thấy SKU nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ TAB 2: ORDER ECONOMICS ════════════════════════════════════ */}
            {tab === 'order' && (
                <div className="space-y-4">
                    {/* Guardrail summary banner */}
                    {breachedCount > 0 && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-5 py-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            <div>
                                <span className="font-bold text-rose-400">{breachedCount} đơn</span>
                                <span className="text-muted-foreground text-sm ml-1">vượt ngưỡng giảm giá 40% (dưới 60% niêm yết)</span>
                            </div>
                            <div className="ml-auto text-sm text-muted-foreground">
                                Tổng LN ảnh hưởng: <span className={clsx('font-bold', portfolio.guardrailBreachImpact >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                    {formatVND(portfolio.guardrailBreachImpact)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{orderFiltered.length} đơn hàng</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm mã đơn..."
                                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-[240px]"
                                value={searchOrder}
                                onChange={e => setSearchOrder(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase sticky left-0 bg-muted/90 z-10 w-[200px]">Order ID</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('totalListPrice')}>
                                            <div className="flex items-center justify-end">Tổng Niêm Yết <SortIcon<OrderEconomics> k="totalListPrice" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('totalActualPrice')}>
                                            <div className="flex items-center justify-end">Tổng Bán Thực <SortIcon<OrderEconomics> k="totalActualPrice" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('discountPct')}>
                                            <div className="flex items-center justify-end">% Giảm <SortIcon<OrderEconomics> k="discountPct" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('totalCogs')}>
                                            <div className="flex items-center justify-end">Giá Vốn <SortIcon<OrderEconomics> k="totalCogs" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('totalFees')}>
                                            <div className="flex items-center justify-end">Phí Sàn <SortIcon<OrderEconomics> k="totalFees" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('totalSubsidy')}>
                                            <div className="flex items-center justify-end">Trợ Giá <SortIcon<OrderEconomics> k="totalSubsidy" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('orderProfit')}>
                                            <div className="flex items-center justify-end">LN Đơn <SortIcon<OrderEconomics> k="orderProfit" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => handleOrderSort('orderMargin')}>
                                            <div className="flex items-center justify-end">Biên % <SortIcon<OrderEconomics> k="orderMargin" cfg={orderSort} /></div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Guardrail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orderFiltered.length > 0 ? orderFiltered.map((o, i) => (
                                        <tr key={i} className={clsx('hover:bg-muted/30 transition-colors', o.guardrailBreached && 'bg-rose-500/5')}>
                                            <td className="px-4 py-3 sticky left-0 bg-background/80 backdrop-blur-sm hover:bg-muted/30 border-r border-border/50">
                                                <div className="font-mono text-xs text-foreground">{o.orderId}</div>
                                                <div className="text-[10px] text-muted-foreground">{o.orderDate?.split(' ')[0]} · {o.lineCount} dòng</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatVND(o.totalListPrice)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground">{formatVND(o.totalActualPrice)}</td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', o.guardrailBreached ? 'text-rose-400' : 'text-muted-foreground')}>
                                                {o.discountPct.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatVND(o.totalCogs)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-orange-400">{formatVND(o.totalFees)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatVND(o.totalSubsidy)}</td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', o.orderProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                                {formatVND(o.orderProfit)}
                                            </td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', o.orderMargin >= 15 ? 'text-emerald-400' : o.orderMargin >= 0 ? 'text-yellow-400' : 'text-rose-400')}>
                                                {o.orderMargin.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {o.guardrailBreached
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"><AlertTriangle className="w-3 h-3" />Vi phạm</span>
                                                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" />OK</span>
                                                }
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Không tìm thấy đơn nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ TAB 3: PORTFOLIO CONTROL ════════════════════════════════ */}
            {tab === 'portfolio' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Tổng Doanh Thu', value: formatVND(portfolio.totalRevenue), color: 'text-foreground' },
                            { label: 'Tổng Lợi Nhuận', value: formatVND(portfolio.totalProfit), color: portfolio.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                            { label: 'Biên Tổng %', value: `${portfolio.totalMargin.toFixed(1)}%`, color: portfolio.totalMargin >= 15 ? 'text-emerald-400' : 'text-rose-400' },
                            { label: '% Đơn Vi Phạm Guardrail', value: `${portfolio.guardrailBreachRate.toFixed(1)}%`, color: portfolio.guardrailBreachRate > 10 ? 'text-rose-400' : 'text-yellow-400' },
                            {
                                label: 'LN Tiềm Năng Nếu Ép 60% Niêm Yết',
                                value: portfolio.potentialProfitGain > 0 ? `+${formatVND(portfolio.potentialProfitGain)}` : formatVND(portfolio.potentialProfitGain),
                                color: portfolio.potentialProfitGain > 0 ? 'text-emerald-400' : 'text-muted-foreground',
                                subtitle: 'Nếu tất cả đơn vi phạm được bán ở 60% niêm yết'
                            },
                            { label: 'Top 20% SKU → LN', value: `${portfolio.top20ProfitShare.toFixed(1)}%`, color: 'text-blue-400' },
                            { label: 'SKU Đang Lỗ', value: `${portfolio.lossSKURatio.toFixed(1)}%`, color: portfolio.lossSKURatio > 20 ? 'text-rose-400' : 'text-muted-foreground' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-card/50 border border-border rounded-xl p-4">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">{kpi.label}</p>
                                <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                                {(kpi as any).subtitle && <p className="text-[10px] text-muted-foreground mt-1">{(kpi as any).subtitle}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Pareto Table */}
                    <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="font-bold text-foreground">Phân Tích Pareto — Top SKU theo Lợi Nhuận</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Top 20% SKU (đánh dấu 🟦) đóng góp <span className="font-bold text-blue-400">{portfolio.top20ProfitShare.toFixed(1)}%</span> tổng lợi nhuận</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase w-8">#</th>
                                        <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">SKU / Tên</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Lợi Nhuận</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">LN Tích Luỹ %</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground uppercase">Nhóm</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {portfolio.pareto.map((item: ParetoItem, i: number) => (
                                        <tr key={i} className={clsx('hover:bg-muted/30 transition-colors', item.isTop20 && 'bg-blue-500/5')}>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground truncate max-w-[300px]">{item.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                                            </td>
                                            <td className={clsx('px-4 py-3 text-right font-mono font-bold', item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                                {formatVND(item.profit)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, item.cumProfitPct)}%` }} />
                                                    </div>
                                                    <span className="font-mono text-xs text-muted-foreground w-12 text-right">{item.cumProfitPct.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.isTop20
                                                    ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">🟦 Top 20%</span>
                                                    : <span className="px-2 py-0.5 rounded text-[10px] text-muted-foreground">—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
