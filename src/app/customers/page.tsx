"use client";

import React, { useEffect, useState } from 'react';
import { calculateMetrics, filterOrders } from '../../utils/calculator';
import { MetricResult, ShopeeOrder, CustomerAnalysis } from '../../utils/types';
import { Users, Search, ShoppingBag, DollarSign, Calendar, MapPin, Phone } from 'lucide-react';
import { useFilter } from '../../contexts/FilterContext';
import { PageSkeleton } from '../../components/Skeleton';
import { formatVND, formatNumber } from '../../utils/format';
import clsx from 'clsx';

export default function CustomersPage() {
    const [metrics, setMetrics] = useState<MetricResult | null>(null);
    const [prevMetrics, setPrevMetrics] = useState<MetricResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { startDate, endDate, warehouse, channelKeys } = useFilter();

    const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalysis | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof CustomerAnalysis, direction: 'asc' | 'desc' } | null>({ key: 'totalSpent', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/orders?channel=' + channelKeys.join(','));
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
    }, [startDate, endDate, warehouse, channelKeys]);

    if (loading) return <PageSkeleton />;

    if (!metrics || !metrics.customerAnalysis || metrics.customerAnalysis.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Users className="w-8 h-8 text-black" />
                </div>
                <p className="font-medium">Chưa có dữ liệu khách hàng (đã lọc)</p>
            </div>
        );
    }


    // Filter
    let filteredCustomers = metrics?.customerAnalysis?.filter(c => {
        const matchesSearch =
            c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.buyerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phoneNumber.includes(searchTerm);

        return matchesSearch;
    }) || [];

    // Sort
    if (sortConfig !== null) {
        filteredCustomers.sort((a: CustomerAnalysis, b: CustomerAnalysis) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    const requestSort = (key: keyof CustomerAnalysis) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const PoPIndicator = ({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) => {
        if (!prev || prev === 0) return null;

        const diff = current - prev;
        const percentChange = (Math.abs(diff) / prev) * 100;
        const isIncrease = diff > 0;
        const isDecrease = diff < 0;

        let colorClass = "text-white/70";
        let Icon = null;

        if (isIncrease) {
            colorClass = isInverse ? "text-rose-200" : "text-emerald-200";
            Icon = "▲";
        } else if (isDecrease) {
            colorClass = isInverse ? "text-emerald-200" : "text-rose-200";
            Icon = "▼";
        }

        return (
            <div className="flex items-center mt-1 text-xs font-medium">
                {Icon && <span className={colorClass}>{Icon} {percentChange.toFixed(1)}%</span>}
                <span className="text-white/60 lowercase ml-1">so với kỳ trước</span>
            </div>
        );
    };

    const currentTotalCust = filteredCustomers.length;
    const currentTop10Spent = filteredCustomers.slice(0, 10).reduce((acc: number, c: CustomerAnalysis) => acc + c.totalSpent, 0);
    const currentAvgSpent = currentTotalCust > 0 ? currentTop10Spent / currentTotalCust : 0; // Or sum of all / length

    const prevFilteredCustomers = prevMetrics?.customerAnalysis || [];
    const prevTotalCust = prevFilteredCustomers.length;
    const prevTop10Spent = prevFilteredCustomers.slice(0, 10).reduce((acc: number, c: CustomerAnalysis) => acc + c.totalSpent, 0);
    const prevAvgSpent = prevTotalCust > 0 ? prevTop10Spent / prevTotalCust : 0; // Simplified for Top 10

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20 relative">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân Tích Khách Hàng</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Danh sách người mua, tần suất mua hàng và tổng chi tiêu.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Tìm theo ID, tên, SĐT..."
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>


            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                    <p className="text-blue-100 font-medium mb-1">Tổng Số Khách Hàng</p>
                    <h3 className="text-3xl font-bold">{formatNumber(currentTotalCust)}</h3>
                    {prevMetrics && <PoPIndicator current={currentTotalCust} prev={prevTotalCust} />}
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
                    <p className="text-emerald-100 font-medium mb-1">Tổng Chi Tiêu (Top 10)</p>
                    <h3 className="text-3xl font-bold">{formatVND(currentTop10Spent)}</h3>
                    {prevMetrics && <PoPIndicator current={currentTop10Spent} prev={prevTop10Spent} />}
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg">
                    <p className="text-violet-100 font-medium mb-1">Trung Bình Chi Tiêu / Khách</p>
                    <h3 className="text-3xl font-bold">{formatVND(currentTotalCust > 0 ? filteredCustomers.reduce((acc: number, c: CustomerAnalysis) => acc + c.totalSpent, 0) / currentTotalCust : 0)}</h3>
                    {prevMetrics && <PoPIndicator current={currentTotalCust > 0 ? filteredCustomers.reduce((acc: number, c: CustomerAnalysis) => acc + c.totalSpent, 0) / currentTotalCust : 0} prev={prevTotalCust > 0 ? prevFilteredCustomers.reduce((acc: number, c: CustomerAnalysis) => acc + c.totalSpent, 0) / prevTotalCust : 0} />}
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">STT</th>
                                <th className="px-6 py-4">Khách Hàng</th>
                                <th className="px-6 py-4">Liên Hệ</th>
                                <th className="px-6 py-4">Địa Chỉ</th>
                                <th
                                    className="px-6 py-4 text-center cursor-pointer hover:bg-muted/50 transition-colors select-none group"
                                    onClick={() => requestSort('orderCount')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Số Đơn
                                        {sortConfig?.key === 'orderCount' && (
                                            <span className="text-primary font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-muted/50 transition-colors select-none group"
                                    onClick={() => requestSort('totalSpent')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Tổng Chi Tiêu
                                        {sortConfig?.key === 'totalSpent' && (
                                            <span className="text-primary font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">Đơn Gần Nhất</th>
                                <th className="px-6 py-4 text-center">Lịch Sử</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredCustomers.slice(0, 100).map((customer, idx) => (
                                <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-center text-muted-foreground font-medium">
                                        {idx + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                {(customer.buyerUsername || customer.id).substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-foreground">
                                                        @{customer.buyerUsername || 'N/A'}
                                                    </p>
                                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-tighter">Buyer</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Users className="w-3 h-3" /> {customer.name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-3 h-3" />
                                            <span>{customer.phoneNumber || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-muted-foreground max-w-[250px]" title={customer.address}>
                                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-xs leading-relaxed">{customer.address || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {customer.orderCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-500">
                                        {formatVND(customer.totalSpent)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">
                                        {customer.lastOrderDate}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
                                            title="Xem lịch sử đơn hàng"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length > 100 && (
                    <div className="p-4 text-center text-xs text-muted-foreground border-t border-border">
                        Hiển thị 100 khách hàng đầu tiên. Vui lòng dùng bộ lọc để tìm kiếm thêm.
                    </div>
                )}
            </div>

            {/* History Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    <ShoppingBag className="w-5 h-5 text-primary" /> Lịch Sử Mua Hàng
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm font-bold text-primary">@{selectedCustomer.buyerUsername}</p>
                                    <span className="text-muted-foreground text-xs">•</span>
                                    <p className="text-xs text-muted-foreground font-medium">Người nhận: {selectedCustomer.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="text-muted-foreground hover:text-foreground p-1"
                            >
                                X
                            </button>
                        </div>
                        <div className="overflow-y-auto p-0 md:p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 text-muted-foreground font-medium text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Ngày Mua</th>
                                        <th className="px-6 py-3">Mã Đơn</th>
                                        <th className="px-6 py-3 text-right">Giá Trị</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {selectedCustomer.history?.sort((a, b) => b.date.localeCompare(a.date)).map((h, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr
                                                className="hover:bg-muted/20 cursor-pointer"
                                                onClick={() => setExpandedOrderId(expandedOrderId === h.orderId ? null : h.orderId)}
                                            >
                                                <td className="px-6 py-3">{h.date}</td>
                                                <td className="px-6 py-3 text-xs text-primary underline decoration-dotted underline-offset-2">
                                                    {h.orderId}
                                                </td>
                                                <td className="px-6 py-3 text-right">{formatVND(h.value)}</td>
                                            </tr>
                                            {expandedOrderId === h.orderId && (
                                                <tr className="bg-muted/10 animate-in fade-in zoom-in-95 duration-200">
                                                    <td colSpan={3} className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Chi tiết đơn hàng:</p>
                                                            {h.products?.map((p, pIdx) => (
                                                                <div key={pIdx} className="flex justify-between items-center text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-foreground">{p.name}</p>
                                                                        {p.variation && <p className="text-muted-foreground">Phân loại: {p.variation}</p>}
                                                                    </div>
                                                                    <div className="text-right ml-4">
                                                                        <div className="text-muted-foreground">x{p.quantity}</div>
                                                                        <div className="font-medium text-emerald-600">{formatVND(p.price)}</div>
                                                                        {p.originalPrice > p.price && (
                                                                            <div className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                                                                                {formatVND(p.originalPrice)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!h.products || h.products.length === 0) && (
                                                                <p className="text-xs text-muted-foreground italic">Không có thông tin chi tiết sản phẩm.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {(!selectedCustomer.history || selectedCustomer.history.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Không có dữ liệu lịch sử</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-border flex justify-end">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
