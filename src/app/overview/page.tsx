"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Platform, ReportFile, ShopeeOrder } from '@/utils/types';
import { calculateMetrics } from '@/utils/calculator';
import { PLATFORM_BADGE_STYLE, PLATFORM_LABEL } from '@/app/data-sources/page';
import { TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Store, ExternalLink } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useFilter } from '@/contexts/FilterContext';

interface ChannelSummary {
    platform: Platform;
    shopName: string;
    label: string;
    orders: number;
    revenue: number;
    netRevenue: number;
    fees: number;
    profit: number;
    margin: number;
    returnRate: number;
}

function TrendIcon({ value }: { value: number }) {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-rose-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function MarginBadge({ margin }: { margin: number }) {
    const color = margin >= 20
        ? 'text-emerald-400 bg-emerald-500/10'
        : margin >= 10
            ? 'text-yellow-400 bg-yellow-500/10'
            : 'text-rose-400 bg-rose-500/10';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
            {margin.toFixed(1)}%
        </span>
    );
}

export default function OverviewPage() {
    const [reports, setReports] = useState<ReportFile[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate, setChannelKey } = useFilter();
    const router = useRouter();

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Single API call replaces N+1 pattern: fetches all reports with orders
                const res = await fetch('/api/reports/with-orders');
                const data: ReportFile[] = await res.json();
                setReports(data);
            } catch {
                // silent fail
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);


    // Filter orders using the global date range from the top header
    const filteredReports = useMemo(() => {
        if (!startDate && !endDate) return reports;
        const from = startDate ? new Date(startDate).getTime() : null;
        const to = endDate ? new Date(endDate + 'T23:59:59').getTime() : null;
        return reports.map(r => ({
            ...r,
            orders: (r.orders || []).filter((o: ShopeeOrder) => {
                const d = o.orderDate || (o as any).orderCreationDate;
                if (!d) return false;
                const t = new Date(d).getTime();
                if (isNaN(t)) return false;
                if (from && t < from) return false;
                if (to && t > to) return false;
                return true;
            })
        }));
    }, [reports, startDate, endDate]);

    // Compute per-channel summaries
    const channels: ChannelSummary[] = useMemo(() => {
        const map: Record<string, { platform: Platform; shopName: string; orders: ShopeeOrder[] }> = {};

        filteredReports.forEach(r => {
            const key = `${r.platform || 'shopee'}_${r.shopName || ''}`;
            if (!map[key]) map[key] = { platform: r.platform || 'shopee', shopName: r.shopName || '', orders: [] };
            map[key].orders.push(...(r.orders || []));
        });

        return Object.values(map).map(ch => {
            if (ch.orders.length === 0) {
                return {
                    platform: ch.platform,
                    shopName: ch.shopName,
                    label: ch.shopName ? `${PLATFORM_LABEL[ch.platform]} – ${ch.shopName}` : PLATFORM_LABEL[ch.platform],
                    orders: 0, revenue: 0, netRevenue: 0, fees: 0, profit: 0, margin: 0, returnRate: 0,
                };
            }
            const m = calculateMetrics(ch.orders);
            return {
                platform: ch.platform,
                shopName: ch.shopName,
                label: ch.shopName ? `${PLATFORM_LABEL[ch.platform]} – ${ch.shopName}` : PLATFORM_LABEL[ch.platform],
                orders: m.totalOrders,
                revenue: m.totalListRevenue,
                netRevenue: m.totalNetRevenue,
                fees: m.totalSurcharges,
                profit: m.totalGrossProfit,
                margin: m.netMargin,
                returnRate: m.orderReturnRate,
            };
        }).sort((a, b) => b.netRevenue - a.netRevenue);
    }, [filteredReports]);

    const totals = useMemo(() => channels.reduce((acc, c) => ({
        orders: acc.orders + c.orders,
        revenue: acc.revenue + c.revenue,
        netRevenue: acc.netRevenue + c.netRevenue,
        fees: acc.fees + c.fees,
        profit: acc.profit + c.profit,
    }), { orders: 0, revenue: 0, netRevenue: 0, fees: 0, profit: 0 }), [channels]);

    const totalMargin = totals.netRevenue > 0 ? (totals.profit / totals.netRevenue) * 100 : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
                <span className="text-muted-foreground font-bold">Đang tổng hợp dữ liệu...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-primary" />
                    Tổng quan Miền Bắc / Miền Nam
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                    So sánh hiệu quả kinh doanh theo sàn & shop
                    {(startDate || endDate) && (
                        <span className="ml-2 text-xs text-primary font-bold">
                            · {startDate || '...'} → {endDate || '...'}
                        </span>
                    )}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng đơn thành công', value: totals.orders.toLocaleString('vi-VN'), sub: `${channels.length} kênh` },
                    { label: 'Doanh thu thực nhận', value: formatVND(totals.netRevenue), sub: `Gộp: ${formatVND(totals.revenue)}` },
                    { label: 'Tổng phí sàn', value: formatVND(totals.fees), sub: `${totals.netRevenue > 0 ? ((totals.fees / totals.netRevenue) * 100).toFixed(1) : 0}% doanh thu` },
                    { label: 'Lợi nhuận gộp', value: formatVND(totals.profit), sub: `Margin: ${totalMargin.toFixed(1)}%`, highlight: totals.profit >= 0 },
                ].map(card => (
                    <div key={card.label} className="bg-card/60 backdrop-blur border border-border rounded-2xl p-5 shadow-lg">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">{card.label}</p>
                        <p className={`text-xl font-black ${card.highlight === false ? 'text-rose-400' : card.highlight ? 'text-emerald-400' : 'text-foreground'}`}>
                            {card.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Channel Comparison Table */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h2 className="font-bold text-foreground">So sánh theo kênh</h2>
                </div>

                {channels.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground font-bold">
                        <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Chưa có dữ liệu. Hãy tải lên báo cáo từ các kênh bán hàng.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="px-4 py-4 whitespace-nowrap">Kênh / Shop</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Đơn thành công</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Doanh thu gộp</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Doanh thu thực nhận</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Phí sàn</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Lợi nhuận</th>
                                    <th className="px-4 py-4 text-center whitespace-nowrap">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {channels.map((ch, i) => {
                                    const key = `${ch.platform}_${ch.shopName}`;
                                    return (
                                        <tr
                                            key={i}
                                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                setChannelKey(key);
                                                router.push('/');
                                            }}
                                            title={`Xem chi tiết: ${ch.label}`}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border flex-shrink-0 ${PLATFORM_BADGE_STYLE[ch.platform]}`}>
                                                        {PLATFORM_LABEL[ch.platform]}
                                                    </span>
                                                    {ch.shopName && (
                                                        <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{ch.shopName}</span>
                                                    )}
                                                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-foreground">
                                                {ch.orders.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-4 text-right text-muted-foreground">
                                                {formatVND(ch.revenue)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-foreground">
                                                {formatVND(ch.netRevenue)}
                                            </td>
                                            <td className="px-4 py-4 text-right text-rose-400/80">
                                                {formatVND(ch.fees)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold">
                                                <span className={ch.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                    {formatVND(ch.profit)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <MarginBadge margin={ch.margin} />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Total Row */}
                                <tr className="bg-primary/5 border-t-2 border-primary/20 font-black">
                                    <td className="px-4 py-4 text-foreground uppercase text-xs tracking-widest">TỔNG CỘNG</td>
                                    <td className="px-4 py-4 text-right font-black text-foreground">{totals.orders.toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-4 text-right text-muted-foreground font-bold">{formatVND(totals.revenue)}</td>
                                    <td className="px-4 py-4 text-right font-black text-foreground">{formatVND(totals.netRevenue)}</td>
                                    <td className="px-4 py-4 text-right text-rose-400 font-bold">{formatVND(totals.fees)}</td>
                                    <td className="px-4 py-4 text-right font-black">
                                        <span className={totals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                            {formatVND(totals.profit)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <MarginBadge margin={totalMargin} />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Contribution Chart – Bar visualization */}
            {channels.length > 1 && totals.netRevenue > 0 && (
                <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
                    <h2 className="font-bold text-foreground mb-5">Tỷ trọng doanh thu theo kênh</h2>
                    <div className="space-y-3">
                        {channels.map((ch, i) => {
                            const pct = totals.netRevenue > 0 ? (ch.netRevenue / totals.netRevenue) * 100 : 0;
                            const plt = ch.platform;
                            const barColors: Record<Platform, string> = {
                                shopee: 'bg-orange-500',
                                shopee_north: 'bg-orange-600',
                                shopee_south: 'bg-orange-400',
                                tiki: 'bg-blue-500',
                                lazada: 'bg-purple-500',
                                tiktok: 'bg-pink-500',
                                thuocsi: 'bg-green-500',
                                other: 'bg-slate-500',
                            };
                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-64 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${PLATFORM_BADGE_STYLE[plt]}`}>
                                                {PLATFORM_LABEL[plt]}
                                            </span>
                                            {ch.shopName && <span className="text-sm text-foreground font-medium truncate">{ch.shopName}</span>}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${barColors[plt]}`}
                                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                                        />
                                    </div>
                                    <div className="w-28 text-right shrink-0">
                                        <span className="font-bold text-foreground text-sm">{pct.toFixed(1)}%</span>
                                        <span className="text-xs text-muted-foreground ml-2">({formatVND(ch.netRevenue)})</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
