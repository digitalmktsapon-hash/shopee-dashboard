import { ShopeeOrder, MetricResult, RevenueTrend, ProductEconomicsResult, SkuEconomics, OrderEconomics, ParetoItem, CustomerAnalysis, OperationAnalysis, DailyShippingMetric, FeeAlertOrder } from './types';

export const parseShopeeDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    try {
        const cleanStr = dateStr.trim();
        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const d = new Date(cleanStr);
            if (!isNaN(d.getTime())) return d;
        }
        const datePart = cleanStr.split(' ')[0];
        const sep = datePart.includes('-') ? '-' : (datePart.includes('/') ? '/' : null);
        if (sep) {
            const parts = datePart.split(sep);
            if (parts.length === 3) {
                if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                else return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) return d;
    } catch (e) { return null; }
    return null;
};

export const filterOrders = (orders: ShopeeOrder[], startDate: string | undefined, endDate: string | undefined, warehouse: string | undefined): ShopeeOrder[] => {
    return orders.filter(o => {
        if (warehouse && warehouse !== 'All' && o.warehouseName !== warehouse) return false;
        if (!startDate && !endDate) return true;

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(8640000000000000);
        start.setHours(0, 0, 0, 0);
        if (endDate) end.setHours(23, 59, 59, 999);

        const payoutDate = parseShopeeDate(o.payoutDate);
        const isSalesInPeriod = payoutDate && payoutDate >= start && payoutDate <= end;

        const updateDate = parseShopeeDate(o.updateTime);
        const isReturn = o.returnStatus && o.returnStatus !== '';
        const isReturnInPeriod = isReturn && updateDate && updateDate >= start && updateDate <= end;

        return isSalesInPeriod || isReturnInPeriod;
    });
};

export const calculateMetrics = (orders: ShopeeOrder[], config?: { startDate?: string; endDate?: string; adExpenseX?: number }): MetricResult => {
    const start = config?.startDate ? new Date(config.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = config?.endDate ? new Date(config.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    const adExpenseX = config?.adExpenseX || 0;

    let totalGMV = 0;
    let totalShopSubsidies = 0;
    let totalPlatformFees = 0;
    let uniqueOrdersSet = new Set<string>();
    let totalReturnValue = 0;
    let totalReturnFees = 0;

    // Breakdown accumulators (aligned with CFO formulas)
    let totalFixedFee = 0;
    let totalServiceFee = 0;
    let totalPaymentFee = 0;
    let totalSellerRebate = 0;
    let totalShopComboDiscount = 0;
    let totalTradeInBonus = 0;
    let totalShopVoucher = 0;
    let totalShopeeRebate = 0;

    const trendMap: Record<string, RevenueTrend> = {};
    const statusMap: Record<string, { count: number, revenue: number }> = {};
    const locationMap: Record<string, { revenue: number, orders: number, profit: number }> = {};
    const returnOrderMap: Record<string, any> = {};
    const productMap: Record<string, any> = {};
    const customerMap: Record<string, CustomerAnalysis> = {};
    const carrierMap: Record<string, { orderCount: number; totalShipTime: number }> = {};
    const shippingTrendMap: Record<string, { count: number; totalTime: number }> = {};

    let completedOrders = 0;
    let canceledOrders = 0;
    let returnedOrdersCount = 0;
    let totalProcessingTime = 0;
    let orderWithProcessingTimeCount = 0;
    let slowDeliveryCount = 0;
    const feeAlerts: FeeAlertOrder[] = [];
    const returnProvinceMap: Record<string, { count: number, value: number }> = {};
    const carrierDetailsMap: Record<string, { success: number, total: number, deliveryTime: number, returns: number }> = {};

    // Track unique orders for counts (avoid multi-item overcounting)
    const procStatus = new Set<string>();
    const procGlobal = new Set<string>();
    const procCarrier = new Set<string>();
    const procLocation = new Set<string>();
    const procTrend = new Set<string>();
    const procCustomer = new Set<string>();
    const procReturnProv = new Set<string>();

    orders.forEach(o => {
        const payoutDate = parseShopeeDate(o.payoutDate);
        const updateDate = parseShopeeDate(o.updateTime);
        const orderDate = parseShopeeDate(o.orderDate);
        const isCancelled = o.orderStatus === 'Đã hủy';
        const isReturned = o.returnStatus && o.returnStatus !== '';
        const isCompleted = o.orderStatus === 'Hoàn thành';

        const inSalesRange = !start || (payoutDate && payoutDate >= start && (!end || payoutDate <= end));
        const inReturnRange = !start || (updateDate && updateDate >= start && (!end || updateDate <= end));

        if (!statusMap[o.orderStatus || 'N/A']) statusMap[o.orderStatus || 'N/A'] = { count: 0, revenue: 0 };

        if (!procStatus.has(o.orderId + o.orderStatus)) {
            statusMap[o.orderStatus || 'N/A'].count++;
            procStatus.add(o.orderId + o.orderStatus);
        }

        // MASTER CATEGORIES
        if (!procGlobal.has(o.orderId)) {
            if (isCompleted) completedOrders++;
            if (isCancelled) canceledOrders++;
            if (isReturned) returnedOrdersCount++;
            procGlobal.add(o.orderId);
        }

        // Section III: Fee Alerts (>50%)
        const gmv = (o.originalPrice || 0) * (o.quantity || 0);
        const totalFees = (o.fixedFee || 0) + (o.serviceFee || 0) + (o.paymentFee || 0) + (o.shopVoucher || 0) + (o.shopComboDiscount || 0);
        if (gmv > 0 && (totalFees / gmv) > 0.5) {
            feeAlerts.push({
                orderId: o.orderId,
                gmv,
                totalFees,
                feeRatio: (totalFees / gmv) * 100,
                reason: totalFees > (gmv * 0.2) ? 'Phí dịch vụ & Voucher chồng chéo' : 'Đơn giá thấp gánh phí cố định cao',
                solution: 'Kiểm tra lại cấu hình Voucher hoặc tăng giá trị combo'
            });
        }

        // Section VI: Operations (Processing Time)
        if (orderDate && (o.shipTime || o.completeDate)) {
            const shipDate = parseShopeeDate(o.shipTime) || parseShopeeDate(o.completeDate);
            if (shipDate) {
                const diff = (shipDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
                if (diff >= 0 && diff < 30) { // filter outliers
                    totalProcessingTime += diff;
                    orderWithProcessingTimeCount++;
                }
            }
        }

        // Carrier details
        const carrier = o.deliveryCarrier || 'Khác';
        if (!carrierDetailsMap[carrier]) carrierDetailsMap[carrier] = { success: 0, total: 0, deliveryTime: 0, returns: 0 };

        if (!procCarrier.has(carrier + o.orderId)) {
            carrierDetailsMap[carrier].total++;
            if (isCompleted) carrierDetailsMap[carrier].success++;
            if (isReturned) carrierDetailsMap[carrier].returns++;
            procCarrier.add(carrier + o.orderId);
        }

        // SALES BUCKET
        if (inSalesRange && payoutDate && !isCancelled) {
            const itemGMV = (o.originalPrice || 0) * (o.quantity || 0);
            const itemSubsidies = (o.sellerRebate || 0) + (o.shopComboDiscount || 0) + (o.tradeInBonusBySeller || 0) + (o.shopVoucher || 0);
            const itemFees = (o.fixedFee || 0) + (o.serviceFee || 0) + (o.paymentFee || 0);
            const itemDraftNet = itemGMV - itemSubsidies - itemFees;

            totalGMV += itemGMV;
            totalShopSubsidies += itemSubsidies;
            totalPlatformFees += itemFees;
            totalFixedFee += (o.fixedFee || 0);
            totalServiceFee += (o.serviceFee || 0);
            totalPaymentFee += (o.paymentFee || 0);
            totalSellerRebate += (o.sellerRebate || 0);
            totalShopComboDiscount += (o.shopComboDiscount || 0);
            totalTradeInBonus += (o.tradeInBonusBySeller || 0);
            totalShopVoucher += (o.shopVoucher || 0);
            totalShopeeRebate += (o.shopeeRebate || 0);

            uniqueOrdersSet.add(o.orderId);
            statusMap[o.orderStatus || 'N/A'].revenue += itemGMV;

            const prov = o.province || 'Khác';
            if (!locationMap[prov]) locationMap[prov] = { revenue: 0, orders: 0, profit: 0 };
            locationMap[prov].revenue += itemGMV;
            if (!procLocation.has(prov + o.orderId)) {
                locationMap[prov].orders++;
                procLocation.add(prov + o.orderId);
            }
            locationMap[prov].profit += itemDraftNet;

            const sku = o.skuReferenceNo || o.productName;
            if (!productMap[sku]) productMap[sku] = { sku, name: o.productName, quantity: 0, revenue: 0, fees: 0, cogs: 0, netProfit: 0, returnQuantity: 0 };
            productMap[sku].quantity += o.quantity || 0;
            productMap[sku].revenue += itemGMV;
            productMap[sku].fees += itemFees;
            productMap[sku].cogs += itemGMV * 0.4;
            productMap[sku].netProfit += itemDraftNet - (itemGMV * 0.4);

            const dStr = payoutDate.toISOString().split('T')[0];
            if (!trendMap[dStr]) trendMap[dStr] = createEmptyTrend(dStr);
            trendMap[dStr].gmv += itemGMV;
            trendMap[dStr].shopSubsidies += itemSubsidies;
            trendMap[dStr].platformFees += itemFees;
            if (!procTrend.has(dStr + o.orderId)) {
                trendMap[dStr].orders += 1;
                procTrend.add(dStr + o.orderId);
            }

            // CUSTOMER LOGIC
            const custId = o.buyerUsername || o.phoneNumber || 'unknown';
            if (!customerMap[custId]) {
                customerMap[custId] = {
                    id: custId, buyerUsername: o.buyerUsername || 'N/A', name: o.receiverName || 'N/A',
                    phoneNumber: o.phoneNumber || 'N/A', address: [o.ward, o.district, o.province].filter(Boolean).join(', '),
                    orderCount: 0, totalSpent: 0, lastOrderDate: o.orderDate || '',
                    history: []
                };
            }
            if (!procCustomer.has(custId + o.orderId)) {
                customerMap[custId].orderCount++;
                procCustomer.add(custId + o.orderId);
            }
            customerMap[custId].totalSpent += itemGMV;
            if (o.orderDate && o.orderDate > customerMap[custId].lastOrderDate) {
                customerMap[custId].lastOrderDate = o.orderDate;
            }
            let histOrder = customerMap[custId].history.find(h => h.orderId === o.orderId);
            if (!histOrder) {
                histOrder = {
                    date: o.orderDate || '',
                    orderId: o.orderId,
                    value: o.orderTotalAmount || itemGMV,
                    products: []
                };
                customerMap[custId].history.push(histOrder);
            }
            histOrder.products?.push({
                name: o.productName,
                variation: o.variationName,
                quantity: o.quantity,
                price: o.dealPrice,
                originalPrice: o.originalPrice
            });
        }

        // RETURN BUCKET
        if (inReturnRange && isReturned && !isCancelled) {
            const itemReturnVal = (o.originalPrice || 0) * (o.returnQuantity || o.quantity || 0);
            const itemReturnFee = (o.returnShippingFee || 0);
            totalReturnValue += itemReturnVal;
            totalReturnFees += itemReturnFee;

            const prov = o.province || 'Khác';
            if (!returnProvinceMap[prov]) returnProvinceMap[prov] = { count: 0, value: 0 };
            if (!procReturnProv.has(prov + o.orderId)) {
                returnProvinceMap[prov].count++;
                procReturnProv.add(prov + o.orderId);
            }
            returnProvinceMap[prov].value += itemReturnVal;

            if (!returnOrderMap[o.orderId]) {
                returnOrderMap[o.orderId] = {
                    orderId: o.orderId,
                    date: o.orderDate,
                    reason: o.returnReason || 'Khách yêu cầu Trả hàng/Hoàn tiền',
                    status: o.returnStatus,
                    carrier: o.deliveryCarrier,
                    value: 0,
                    products: []
                };
            }
            returnOrderMap[o.orderId].value += itemReturnVal;
            returnOrderMap[o.orderId].products.push({
                name: o.productName,
                quantity: o.returnQuantity || o.quantity || 0
            });

            const sku = o.skuReferenceNo || o.productName;
            if (productMap[sku]) {
                productMap[sku].returnQuantity += o.returnQuantity || o.quantity || 0;
            }

            if (updateDate) {
                const dStr = updateDate.toISOString().split('T')[0];
                if (!trendMap[dStr]) trendMap[dStr] = createEmptyTrend(dStr);
                trendMap[dStr].returnValue += itemReturnVal;
                trendMap[dStr].returnFees += itemReturnFee;
            }
        }

        // OPERATION LOGIC (Carrier Delivery Time)
        if (o.deliveryCarrier && o.shipTime && o.completeDate) {
            const shipDate = parseShopeeDate(o.shipTime);
            const deliveryDate = parseShopeeDate(o.completeDate);
            if (shipDate && deliveryDate) {
                const diffDays = (deliveryDate.getTime() - shipDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays >= 0) {
                    if (!carrierMap[o.deliveryCarrier]) carrierMap[o.deliveryCarrier] = { orderCount: 0, totalShipTime: 0 };
                    carrierMap[o.deliveryCarrier].orderCount++;
                    carrierMap[o.deliveryCarrier].totalShipTime += diffDays;

                    if (carrierDetailsMap[o.deliveryCarrier]) {
                        carrierDetailsMap[o.deliveryCarrier].deliveryTime += diffDays;
                    }

                    const dStr = shipDate.toISOString().split('T')[0];
                    if (!shippingTrendMap[dStr]) shippingTrendMap[dStr] = { count: 0, totalTime: 0 };
                    shippingTrendMap[dStr].count++;
                    shippingTrendMap[dStr].totalTime += diffDays;

                    if (diffDays > 5) slowDeliveryCount++;
                }
            }
        }
    });

    const totalDraftNet = totalGMV - totalShopSubsidies - totalPlatformFees;
    const totalReturnImpact = totalReturnValue + totalReturnFees;
    const totalActualNet = totalDraftNet - totalReturnImpact;
    const totalOrdersCount = uniqueOrdersSet.size;

    // Loyalty Analysis
    const customers = Object.values(customerMap);
    const returningCustomersCount = customers.filter(c => c.orderCount > 1).length;
    const loyaltyStats = {
        newCustomers: customers.length - returningCustomersCount,
        returningCustomers: returningCustomersCount,
        repeatRate: customers.length > 0 ? (returningCustomersCount / customers.length) * 100 : 0
    };

    return {
        totalGMV, totalShopSubsidies, totalPlatformFees, totalDraftNet,
        totalReturnValue, totalReturnFees, totalReturnImpact,
        totalActualNet, totalOrders: totalOrdersCount,
        avgOrderValue: totalOrdersCount > 0 ? totalGMV / totalOrdersCount : 0,
        platformFeeRate: totalGMV > 0 ? (totalPlatformFees / totalGMV) * 100 : 0,
        shopSubsidyRate: totalGMV > 0 ? (totalShopSubsidies / totalGMV) * 100 : 0,
        marginPreCogs: totalGMV > 0 ? (totalActualNet / totalGMV) * 100 : 0,

        adExpenseX, adCostRate: totalGMV > 0 ? (adExpenseX / totalGMV) * 100 : 0,
        marginBeforeAds: 0, finalNetMargin: 0, // placeholders

        completedOrders,
        canceledOrders,
        returnedOrdersCount,
        avgProcessingTime: orderWithProcessingTimeCount > 0 ? totalProcessingTime / orderWithProcessingTimeCount : 0,
        slowDeliveryCount,
        loyaltyStats,
        feeAlerts,

        carrierPerformance: Object.entries(carrierDetailsMap).map(([carrier, details]) => ({
            carrier,
            successRate: details.total > 0 ? (details.success / details.total) * 100 : 0,
            avgDeliveryTime: details.success > 0 ? details.deliveryTime / details.success : 0,
            returnCount: details.returns
        })),

        returnByProvince: Object.entries(returnProvinceMap).map(([province, val]) => ({
            province,
            count: val.count,
            value: val.value
        })),

        revenueTrend: Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)).map(t => {
            // Derived field calculations
            t.draftNet = t.gmv - t.shopSubsidies - t.platformFees;
            t.returnImpact = t.returnValue + t.returnFees;
            t.actualNet = t.draftNet - t.returnImpact;
            t.aov = t.orders > 0 ? t.gmv / t.orders : 0;
            t.feeRate = t.gmv > 0 ? (t.platformFees / t.gmv) * 100 : 0;
            t.subsidyRate = t.gmv > 0 ? (t.shopSubsidies / t.gmv) * 100 : 0;
            t.marginPreCogs = t.gmv > 0 ? (t.actualNet / t.gmv) * 100 : 0;

            // Set aliases for Dashboard compatibility
            t.netRevenueAfterTax = t.actualNet;
            t.grossRevenue = t.draftNet;
            t.promoCost = t.shopSubsidies;
            t.successfulOrders = t.orders;

            return t;
        }),
        productPerformance: Object.values(productMap).map(p => ({
            ...p,
            margin: p.revenue > 0 ? (p.netProfit / p.revenue) * 100 : 0,
            returnRate: p.quantity > 0 ? (p.returnQuantity / p.quantity) * 100 : 0,
            contribution: totalGMV > 0 ? (p.revenue / totalGMV) * 100 : 0,
            badges: []
        })),
        statusAnalysis: Object.entries(statusMap).map(([status, val]) => ({ status, count: val.count, revenue: val.revenue, percentage: orders.length > 0 ? (val.count / orders.length) * 100 : 0 })),
        locationAnalysis: Object.entries(locationMap).map(([province, val]) => ({ province, revenue: val.revenue, orders: val.orders, profit: val.profit, contribution: totalGMV > 0 ? (val.revenue / totalGMV) * 100 : 0 })),

        dailyFinancials: Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)),
        successfulOrders: completedOrders,
        totalListRevenue: totalGMV,
        totalGrossRevenue: totalDraftNet,
        netRevenueAfterTax: totalActualNet,
        totalSurcharges: totalPlatformFees,
        totalVoucher: totalShopSubsidies,
        netMargin: totalGMV > 0 ? (totalActualNet / totalGMV) * 100 : 0,

        riskAnalysis: [],
        riskStats: {
            totalOrders: totalOrdersCount,
            highRiskCount: 0,
            lossCount: 0,
            avgControlRatio: 0,
            totalLossAmount: 0,
            totalListRevenue: totalGMV,
            totalSellerRebate: totalSellerRebate,
            totalShopVoucher: totalShopVoucher,
            totalReturnShippingFee: totalReturnFees,
            totalPlatformFees: totalPlatformFees,
            totalReturnImpactValue: totalReturnImpact,
            totalReturnImpactRate: totalGMV > 0 ? (totalReturnImpact / totalGMV) * 100 : 0
        },
        returnedOrders: Object.values(returnOrderMap),
        customerAnalysis: customers,
        operationAnalysis: Object.entries(carrierMap).map(([carrier, val]) => ({ carrier, orderCount: val.orderCount, avgShipTime: val.totalShipTime / val.orderCount })),
        dailyShippingMetrics: Object.entries(shippingTrendMap).map(([date, val]) => ({ date, avgShipTime: val.totalTime / val.count })).sort((a, b) => a.date.localeCompare(b.date)),
        cancelAnalysis: Object.entries(orders.filter(o => o.orderStatus === 'Đã hủy').reduce((acc: Record<string, number>, o) => {
            const reason = o.cancelReason || 'Người mua hủy';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {})).map(([reason, count]) => ({ reason, count })),
        returnByCarrier: Object.entries(Object.values(returnOrderMap).reduce((acc: Record<string, { count: number, value: number }>, r: any) => {
            const carrier = r.carrier || 'Khác';
            if (!acc[carrier]) acc[carrier] = { count: 0, value: 0 };
            acc[carrier].count++;
            acc[carrier].value += r.value;
            return acc;
        }, {})).map(([reason, val]) => ({ reason, count: val.count, value: val.value })),

        totalRevenue: totalGMV,
        totalFees: totalPlatformFees,
        feeAnalysis: [
            { type: 'Phí cố định', value: totalFixedFee },
            { type: 'Phí dịch vụ', value: totalServiceFee },
            { type: 'Phí thanh toán', value: totalPaymentFee }
        ],
        subsidyAnalysis: [
            { type: 'KM Shop', value: totalShopSubsidies },
            { type: 'KM Shopee (đã trừ)', value: totalShopeeRebate }
        ]
    };
};

export const calculateProductEconomics = (orders: ShopeeOrder[]): ProductEconomicsResult => {
    const skuMap: Record<string, SkuEconomics> = {};
    const orderMap: Record<string, OrderEconomics> = {};
    let totalRevenue = 0;
    let totalProfit = 0;
    let guardrailImpact = 0;

    orders.forEach(o => {
        const isCancelled = o.orderStatus === 'Đã hủy';
        if (isCancelled) return;

        const gmv = (o.originalPrice || 0) * (o.quantity || 0);
        const subsidies = (o.sellerRebate || 0) + (o.shopComboDiscount || 0) + (o.tradeInBonusBySeller || 0) + (o.shopVoucher || 0);
        const fees = (o.fixedFee || 0) + (o.serviceFee || 0) + (o.paymentFee || 0);
        const cogs = gmv * 0.4;
        const draftNet = gmv - subsidies - fees;
        const profit = draftNet - cogs;

        // SKU level
        const skuKey = o.skuReferenceNo || o.productName;
        if (!skuMap[skuKey]) {
            skuMap[skuKey] = {
                sku: skuKey, name: o.productName, quantity: 0, listPrice: o.originalPrice,
                proceeds: 0, netRevenue: 0, netRevenueAfterTax: 0, cogs: 0, fees: 0,
                subsidy: 0, profit: 0, margin: 0, returnRate: 0,
                skuType: 'Standard', badge: 'OK'
            };
        }
        skuMap[skuKey].quantity += o.quantity;
        skuMap[skuKey].proceeds += gmv;
        skuMap[skuKey].netRevenue += draftNet;
        skuMap[skuKey].netRevenueAfterTax += draftNet; // Simplified for SKU level
        skuMap[skuKey].cogs += cogs;
        skuMap[skuKey].fees += fees;
        skuMap[skuKey].subsidy += subsidies;
        skuMap[skuKey].profit += profit;

        if (!orderMap[o.orderId]) {
            orderMap[o.orderId] = {
                orderId: o.orderId, orderDate: o.orderDate, totalListPrice: 0,
                proceeds: 0, netRevenueAfterTax: 0, discountPct: 0, totalCogs: 0,
                totalFees: 0, totalSubsidy: 0, profit: 0, margin: 0, guardrailBreached: false,
                lineCount: 0
            };
        }
        orderMap[o.orderId].totalListPrice += (o.originalPrice * o.quantity);
        orderMap[o.orderId].proceeds += gmv;
        orderMap[o.orderId].totalCogs += cogs;
        orderMap[o.orderId].totalFees += fees;
        orderMap[o.orderId].totalSubsidy += subsidies;
        orderMap[o.orderId].netRevenueAfterTax += draftNet;
        orderMap[o.orderId].profit += profit;
        orderMap[o.orderId].lineCount = (orderMap[o.orderId].lineCount || 0) + 1;

        totalRevenue += gmv;
        totalProfit += profit;
    });

    const skuEconomics = Object.values(skuMap).map(s => {
        s.margin = s.proceeds > 0 ? (s.profit / s.proceeds) * 100 : 0;
        if (s.margin < 5) s.badge = '🔴 Kill List';
        else if (s.margin < 15) s.badge = '🟠 Risk';
        else if (s.margin > 30) s.badge = '🟢 Hero';
        return s;
    });

    const orderEconomics = Object.values(orderMap).map(o => {
        o.margin = o.proceeds > 0 ? (o.profit / o.proceeds) * 100 : 0;
        o.discountPct = o.totalListPrice > 0 ? ((o.totalListPrice - o.proceeds) / o.totalListPrice) * 100 : 0;
        o.guardrailBreached = o.discountPct > 40;
        if (o.guardrailBreached) guardrailImpact += (o.totalListPrice * 0.4 - (o.totalListPrice - o.proceeds));
        return o;
    });

    const pareto = [...skuEconomics].sort((a, b) => b.profit - a.profit);
    let cumulative = 0;
    const totalPosProfit = skuEconomics.reduce((sum, s) => sum + Math.max(0, s.profit), 0);

    const paretoResult: ParetoItem[] = pareto.map((p, idx) => {
        cumulative += Math.max(0, p.profit);
        const cumPct = totalPosProfit > 0 ? (cumulative / totalPosProfit) * 100 : 0;
        return {
            sku: p.sku, name: p.name, revenue: p.proceeds,
            profit: p.profit,
            cumulativeRevenue: cumulative,
            revenuePercentage: totalRevenue > 0 ? (p.proceeds / totalRevenue) * 100 : 0,
            cumulativePercentage: 0,
            cumProfitPct: cumPct,
            isCore80: false,
            isTop20: idx < pareto.length * 0.2
        };
    });

    const breachedOrders = orderEconomics.filter(o => o.guardrailBreached);
    const lossSKUs = skuEconomics.filter(s => s.profit < 0);
    const top20SKUs = paretoResult.filter(p => p.isTop20);
    const top20Profit = top20SKUs.reduce((sum, p) => sum + Math.max(0, p.profit), 0);

    return {
        skuEconomics,
        orderEconomics,
        portfolio: {
            avgMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            totalRevenue,
            totalProfit,
            guardrailBreachImpact: guardrailImpact,
            totalMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            guardrailBreachRate: orderEconomics.length > 0 ? (breachedOrders.length / orderEconomics.length) * 100 : 0,
            potentialProfitGain: guardrailImpact, // simplified for now as gap to 40% margin
            top20ProfitShare: totalPosProfit > 0 ? (top20Profit / totalPosProfit) * 100 : 0,
            lossSKURatio: skuEconomics.length > 0 ? (lossSKUs.length / skuEconomics.length) * 100 : 0,
            pareto: paretoResult
        }
    };
};

const createEmptyTrend = (dateStr: string): RevenueTrend => ({
    date: dateStr, gmv: 0, shopSubsidies: 0, platformFees: 0, draftNet: 0,
    returnValue: 0, returnFees: 0, returnImpact: 0, actualNet: 0,
    orders: 0, aov: 0, feeRate: 0, subsidyRate: 0, marginPreCogs: 0,
    netRevenueAfterTax: 0, grossRevenue: 0, promoCost: 0, successfulOrders: 0
});
