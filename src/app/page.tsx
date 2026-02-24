"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Platform, ReportFile, ShopeeOrder } from '@/utils/types';
import { calculateMetrics } from '@/utils/calculator';
import { PLATFORM_BADGE_STYLE, PLATFORM_LABEL } from '@/app/data-sources/page';
import { formatVND, formatDateVN } from '@/utils/format';
import { useFilter } from '@/contexts/FilterContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, Legend, Cell
} from 'recharts';
import { ChartTooltip } from '@/components/ChartTooltip';
import { Activity, ShoppingBag, DollarSign, Percent, CreditCard, Ticket, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Store, ExternalLink, Layers } from 'lucide-react';
import clsx from 'clsx';

interface ChannelSummary {
  platform: Platform;
  shopName: string;
  label: string;
  orders: number;
  revenue: number;
  totalGrossRevenue: number;
  netRevenue: number;
  netRevenueAfterTax: number;
  promoCost: number;
  strictAovNumerator: number;
  fees: number;
  profit: number;
  margin: number;
  returnRate: number;
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

export default function MultiChannelDashboard() {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { startDate, endDate, channelKeys, setChannelKeys, adExpenseX } = useFilter();
  const router = useRouter();

  const [activeMetrics, setActiveMetrics] = useState({
    orders: true,
    grossRevenue: true,
    promoCost: false,
    platformFees: false,
    netRevenue: true,
    aov: false
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
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

  const filteredReports = useMemo(() => {
    let rs = reports;

    // Filter by channelKeys array
    if (channelKeys && !channelKeys.includes('all')) {
      rs = rs.filter(r => {
        const plt = r.platform || 'shopee';
        const shopName = r.shopName || '';
        const shopKey = `${plt}_${shopName}`;

        // Match if the platform is selected OR the specific shop key is selected
        return channelKeys.includes(plt) || channelKeys.includes(shopKey);
      });
    }

    if (!startDate && !endDate) return rs;
    const from = startDate ? new Date(startDate).getTime() : null;
    const to = endDate ? new Date(endDate + 'T23:59:59').getTime() : null;

    return rs.map(r => ({
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
          orders: 0, revenue: 0, totalGrossRevenue: 0, netRevenue: 0, netRevenueAfterTax: 0, promoCost: 0, strictAovNumerator: 0, fees: 0, profit: 0, margin: 0, returnRate: 0,
        };
      }
      const m = calculateMetrics(ch.orders, { adExpenseX });
      return {
        platform: ch.platform,
        shopName: ch.shopName,
        label: ch.shopName ? `${PLATFORM_LABEL[ch.platform]} – ${ch.shopName}` : PLATFORM_LABEL[ch.platform],
        orders: m.totalOrders,
        revenue: m.totalGMV,
        totalGrossRevenue: m.totalDraftNet,
        netRevenue: m.totalGMV,
        netRevenueAfterTax: m.totalActualNet,
        promoCost: m.totalShopSubsidies,
        strictAovNumerator: m.avgOrderValue * m.totalOrders,
        fees: m.totalPlatformFees,
        profit: m.totalActualNet,
        margin: m.marginPreCogs,
        returnRate: m.totalGMV > 0 ? (m.totalReturnValue / m.totalGMV) * 100 : 0,
      };
    }).sort((a, b) => b.totalGrossRevenue - a.totalGrossRevenue);
  }, [filteredReports, adExpenseX]);

  const totals = useMemo(() => channels.reduce((acc, c) => ({
    orders: acc.orders + c.orders,
    revenue: acc.revenue + c.revenue,
    totalGrossRevenue: acc.totalGrossRevenue + c.totalGrossRevenue,
    netRevenue: acc.netRevenue + c.netRevenue,
    netRevenueAfterTax: acc.netRevenueAfterTax + c.netRevenueAfterTax,
    promoCost: acc.promoCost + c.promoCost,
    strictAovNumerator: acc.strictAovNumerator + c.strictAovNumerator,
    fees: acc.fees + c.fees,
    profit: acc.profit + c.profit,
  }), { orders: 0, revenue: 0, totalGrossRevenue: 0, netRevenue: 0, netRevenueAfterTax: 0, promoCost: 0, strictAovNumerator: 0, fees: 0, profit: 0 }), [channels]);

  const globalTrends = useMemo(() => {
    const allOrders = filteredReports.flatMap(r => r.orders || []);
    if (allOrders.length === 0) return [];
    const m = calculateMetrics(allOrders, { adExpenseX });
    return m.revenueTrend || [];
  }, [filteredReports, adExpenseX]);

  const totalMargin = totals.netRevenue > 0 ? (totals.profit / totals.netRevenue) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
        <span className="text-muted-foreground font-bold">Đang tổng hợp dữ liệu đa kênh...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            BI ĐA KÊNH
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Tổng hợp hiệu quả kinh doanh từ tất cả các sàn thương mại điện tử
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Tổng đơn thành công', value: totals.orders.toLocaleString('vi-VN'), sub: `${channels.length} kênh | Đã Giao`, highlight: true },
          { label: 'Doanh thu gộp', value: formatVND(totals.totalGrossRevenue), sub: `Thực nhận: (Giá gốc - KM - Phí)`, highlight: undefined },
          { label: 'Chi phí CTKM', value: formatVND(totals.promoCost), sub: `N.Bán trợ giá + Voucher Shop`, highlight: undefined },
          { label: 'Phí sàn', value: formatVND(totals.fees), sub: `Cố định + Dịch vụ + Thanh Toán`, highlight: false },
          { label: 'Doanh thu thuần', value: formatVND(totals.netRevenueAfterTax), sub: `Lợi nhuận sau thuế: (Gộp / 1.08)`, highlight: true },
          { label: 'AOV', value: formatVND(totals.orders > 0 ? totals.strictAovNumerator / totals.orders : 0), sub: `(Chỉ tính đơn thành công)`, highlight: undefined },
        ].map((card, i) => (
          <div key={card.label + i} className="bg-card/60 backdrop-blur border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">{card.label}</p>
            <p className={`text-xl font-black ${card.highlight === false ? 'text-rose-400' : card.highlight ? 'text-emerald-400' : 'text-foreground'}`}>
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily Trends Chart */}
      <div className="bg-card/40 backdrop-blur-md rounded-2xl shadow-xl border border-border p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Biến động 6 chỉ số Đa Kênh
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium italic">
              Dữ liệu tổng hợp từ tất cả các sàn đang được lọc
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, color: 'emerald' },
              { id: 'grossRevenue', label: 'Doanh thu gộp', icon: DollarSign, color: 'blue' },
              { id: 'promoCost', label: 'Chi phí CTKM', icon: Ticket, color: 'orange' },
              { id: 'platformFees', label: 'Phí sàn', icon: CreditCard, color: 'rose' },
              { id: 'netRevenue', label: 'Doanh thu thuần', icon: Activity, color: 'indigo' },
              { id: 'aov', label: 'AOV', icon: Percent, color: 'amber' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetrics(prev => ({ ...prev, [m.id]: !prev[m.id as keyof typeof activeMetrics] }))}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                  (activeMetrics as any)[m.id]
                    ? `bg-${m.color}-500/20 border-${m.color}-500/50 text-${m.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                    : "bg-muted/10 border-border/50 text-muted-foreground hover:bg-muted/20"
                )}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={globalTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return isNaN(d.getTime()) ? str : `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val.toLocaleString()}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                hide={!activeMetrics.orders && !activeMetrics.aov}
              />
              <Tooltip content={<ChartTooltip formatter={(val, name) =>
                name.includes('Đơn') ? val.toLocaleString() : formatVND(val)
              } />} />

              {activeMetrics.netRevenue && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="netRevenueAfterTax"
                  name="Doanh thu thuần"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              )}

              {activeMetrics.grossRevenue && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="grossRevenue"
                  name="Doanh thu gộp"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorGross)"
                />
              )}

              {activeMetrics.promoCost && (
                <Bar yAxisId="left" dataKey="promoCost" name="Chi phí KM" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.6} barSize={20} />
              )}
              {activeMetrics.platformFees && (
                <Bar yAxisId="left" dataKey="platformFees" name="Phí sàn" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} barSize={20} />
              )}

              {activeMetrics.orders && (
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="successfulOrders"
                  name="Đơn hàng"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )}
              {activeMetrics.aov && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="aov"
                  name="AOV"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#f59e0b' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel Comparison */}
      <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-foreground">Xếp hạng kênh bán hàng</h2>
        </div>

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
                const platformRoute = ch.platform.startsWith('shopee') ? '/shopee' : `/${ch.platform}`;
                return (
                  <tr
                    key={i}
                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => {
                      setChannelKeys([key]);
                      router.push(platformRoute);
                    }}
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
              <tr className="bg-primary/5 border-t-2 border-primary/20 font-black">
                <td className="px-4 py-4 text-foreground uppercase text-xs tracking-widest">TỔNG CỘNG ĐA KÊNH</td>
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
      </div>
    </div>
  );
}
