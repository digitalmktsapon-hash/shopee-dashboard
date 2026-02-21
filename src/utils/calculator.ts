import { ShopeeOrder, MetricResult, ProductPerformance, CancelAnalysis, ReturnAnalysis, FeeAnalysis, SubsidyAnalysis, CustomerAnalysis, OperationAnalysis, RevenueTrend, DailyFinancialMetric, RiskAlert, ProductRiskProfile, SkuEconomics, SkuType, SkuBadge, OrderEconomics, PortfolioSummary, ParetoItem } from './types';
import { formatVND, formatNumber } from './format';

export const parseShopeeDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
        // Clean string
        const cleanStr = dateStr.trim();

        // Try ISO directly if it looks like ISO (yyyy-mm-dd)
        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const d = new Date(cleanStr);
            if (!isNaN(d.getTime())) return d;
        }

        // Try dd-mm-yyyy HH:mm or dd/mm/yyyy HH:mm
        // Split by space to get date part
        const datePart = cleanStr.split(' ')[0];

        // Handle dd-mm-yyyy
        if (datePart.includes('-')) {
            const parts = datePart.split('-');
            if (parts.length === 3) {
                // Check if first part is year (yyyy-mm-dd) or day (dd-mm-yyyy)
                if (parts[0].length === 4) {
                    return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                } else {
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            }
        }

        // Handle dd/mm/yyyy
        if (datePart.includes('/')) {
            const parts = datePart.split('/');
            if (parts.length === 3) {
                // Assume dd/mm/yyyy
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        }

        // Fallback to standard Date parse
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) return d;

    } catch (e) { return null; }
    return null;
};

export const filterOrders = (orders: ShopeeOrder[], startDate: string, endDate: string, warehouse: string): ShopeeOrder[] => {
    return orders.filter(o => {
        // Warehouse Filter
        if (warehouse !== 'All') {
            if (o.warehouseName !== warehouse) return false;
        }

        // Date Filter
        if (!startDate && !endDate) return true;

        const orderDateStr = o.orderDate || (o as any).orderCreationDate;
        const orderDate = parseShopeeDate(orderDateStr);
        if (!orderDate) return false;

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
        }

        return true;
    });
};

export const calculateMetrics = (orders: ShopeeOrder[]): MetricResult => {
    let totalOrders = 0;
    let totalSuccessfulOrders = 0;
    let totalListRevenue = 0;
    let totalNetRevenue = 0;
    let totalSurcharges = 0;
    let totalSubsidies = 0;
    let totalProductQty = 0;
    let totalReturnQty = 0;
    let totalNetQty = 0;
    let totalListRevenueRealized = 0; // New: Giá gốc * Qty thực giữ (Realized only)

    const productMap: Record<string, ProductPerformance> = {};
    const locationMap: Record<string, { revenue: number, count: number }> = {};
    const statusMap: Record<string, { revenue: number, count: number }> = {};
    const customerMap: Record<string, CustomerAnalysis> = {};
    const carrierMap: Record<string, { count: number, shipTimeTotal: number, shipTimeCount: number }> = {};
    const trends: Record<string, any> = {};
    const dailyMap: Record<string, DailyFinancialMetric> = {};

    // 0. Global Deduplication of lines (to handle overlapping reports)
    const uniqueLines: ShopeeOrder[] = [];
    const lineSeenSet = new Set<string>();

    orders.forEach(line => {
        // Create a unique key for this specific product line in this specific order
        const lineKey = `${line.orderId}_${line.skuReferenceNo || ''}_${line.variationName || ''}_${line.quantity}_${line.dealPrice || line.originalPrice}`;
        if (!lineSeenSet.has(lineKey)) {
            lineSeenSet.add(lineKey);
            uniqueLines.push(line);
        }
    });

    // Group unique lines by Order ID
    const orderGroups: Record<string, ShopeeOrder[]> = {};
    uniqueLines.forEach(line => {
        if (!orderGroups[line.orderId]) orderGroups[line.orderId] = [];
        orderGroups[line.orderId].push(line);
    });

    Object.values(orderGroups).forEach(orderLines => {
        const firstLine = orderLines[0];
        const orderId = firstLine.orderId;
        const status = firstLine.orderStatus;
        const returnStatus = firstLine.returnStatus;
        const dateStr = firstLine.orderDate || (firstLine as any).orderCreationDate;
        let dateKey = 'Unknown';
        if (dateStr) {
            const d = parseShopeeDate(dateStr);
            if (d) dateKey = d.toISOString().split('T')[0];
        }

        const isRealized = status !== 'Đã hủy' && returnStatus !== 'Đã Chấp Thuận Yêu Cầu';
        const isCancelled = status === 'Đã hủy';

        // 1. Order Level Metrics
        // 2. Trừ phí sàn (Cố định, Dịch vụ, Thanh toán) và 3. Phí vận chuyển trả hàng
        const orderFixedFee = firstLine.fixedFee || 0;
        const orderServiceFee = firstLine.serviceFee || 0;
        const orderPaymentFee = firstLine.paymentFee || 0;
        const orderReturnShippingFee = firstLine.returnShippingFee || 0;
        const totalOrderFees = orderFixedFee + orderServiceFee + orderPaymentFee + orderReturnShippingFee;

        let orderNetRevenue = 0;
        let orderListRevenue = 0; // Seller Mindset: Dùng để tính Margin (Giá gốc * qty thực giữ)
        let orderTotalOriginalRevenue = 0; // To keep track of pure original revenue for list displays
        let orderSubsidies = 0;
        let orderQty = 0;
        let orderReturnQty = 0;

        // Calculate Order Totals from Lines
        orderLines.forEach(line => {
            const qty = line.quantity || 0;
            const rQty = line.returnQuantity || 0;
            const originalPrice = line.originalPrice || 0;
            const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : originalPrice;
            const sellerRebate = line.sellerRebate || 0;

            const effectiveQty = (qty - rQty) > 0 ? (qty - rQty) : 0;
            const lineEffectiveOriginalRev = originalPrice * effectiveQty;
            const lineCOGS = lineEffectiveOriginalRev * 0.4;

            orderQty += qty;
            orderReturnQty += rQty;

            if (!isCancelled) {
                // Doanh thu thực nhận (A) = (Giá sau CTKM * Qty) - Voucher Shop (seller rebate)
                const lineNetRev = (actualSalePrice * qty) - sellerRebate;
                orderNetRevenue += lineNetRev;

                orderListRevenue += lineEffectiveOriginalRev;
                orderSubsidies += sellerRebate;
                orderTotalOriginalRevenue += (originalPrice * qty);
            }
        });

        const orderCOGS = orderListRevenue * 0.4; // Correctly scoped for the trends logic below

        // Global Accumulators
        totalOrders++;
        if (status === 'Hoàn thành') totalSuccessfulOrders++;

        // Only add to totals if valid status (not cancelled)
        if (!isCancelled) {
            totalSurcharges += totalOrderFees;
            totalSubsidies += orderSubsidies;
            totalNetRevenue += orderNetRevenue;
            totalListRevenue += orderListRevenue;
            totalProductQty += orderQty;
        }

        // 2. Allocation & Product Map
        orderLines.forEach(line => {
            const sku = line.skuReferenceNo || line.productName;
            const qty = line.quantity || 0;
            const returnQty = line.returnQuantity || 0;

            if (!sku || isCancelled) return;

            if (!productMap[sku]) {
                productMap[sku] = {
                    sku,
                    name: line.productName,
                    quantity: 0,
                    revenue: 0,
                    cogs: 0,
                    grossProfit: 0,
                    netProfit: 0,
                    fees: 0,
                    returnCosts: 0,
                    margin: 0,
                    returnQuantity: 0,
                    returnRate: 0,
                    badges: [],
                    relatedOrders: []
                };
            }

            productMap[sku].returnQuantity += returnQty;
            totalReturnQty += returnQty;

            // Realized Logic
            if (isRealized) {
                const netQtyLine = qty - returnQty;
                if (netQtyLine > 0) {
                    productMap[sku].quantity += netQtyLine;
                    totalNetQty += netQtyLine;

                    // Allocation
                    const sellerRebate = line.sellerRebate || 0;
                    const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : (line.originalPrice || 0);
                    const lineNetRev = (actualSalePrice * qty) - sellerRebate;

                    const effectiveQty = (qty - returnQty) > 0 ? (qty - returnQty) : 0;
                    const lineEffectiveOriginalRev = (line.originalPrice || 0) * effectiveQty;
                    const lineCOGS = lineEffectiveOriginalRev * 0.4;

                    // Fee Allocation by Revenue Contribution
                    const ratio = orderNetRevenue > 0 ? (lineNetRev / orderNetRevenue) : 0;
                    const allocatedFee = totalOrderFees * ratio;

                }
            }
        });

        // 3. Daily & Trends
        if (!dailyMap[dateKey]) dailyMap[dateKey] = {
            date: dateKey, revenue1: 0, revenue2: 0, fees: 0, cogs: 0, profit: 0, margin: 0, successfulOrders: 0, returnRate: 0, subsidies: 0,
            highRiskOrderPercent: 0, avgControlRatio: 0, promotionBurnRate: 0,
            // @ts-ignore
            totalItems: 0, returnItems: 0, highRiskCount: 0, controlRatioSum: 0, promoSum: 0, grossMarginBeforePromoSum: 0
        };

        const daily = dailyMap[dateKey];
        if (!isCancelled) {
            daily.revenue1 += orderListRevenue;
            // @ts-ignore
            daily.totalItems += orderQty;
        }

        if (isRealized) {
            daily.revenue2 += orderNetRevenue;
            daily.fees += totalOrderFees;
            daily.subsidies += orderSubsidies;
            daily.cogs += orderCOGS; // Using the orderCOGS we calculated above
            daily.profit = orderNetRevenue - totalOrderFees - orderCOGS;
            daily.successfulOrders++;

            // Update Trends
            if (!trends[dateKey]) trends[dateKey] = { date: dateKey, revenue: 0, netRevenue: 0, cost: 0, profit: 0, orders: 0 };
            trends[dateKey].revenue += orderNetRevenue;
            trends[dateKey].orders += 1;
            trends[dateKey].cost += orderCOGS;
            trends[dateKey].profit += (orderNetRevenue - totalOrderFees - orderCOGS);
            if (!(trends[dateKey] as any).fees) (trends[dateKey] as any).fees = 0;
            (trends[dateKey] as any).fees += totalOrderFees;

            // Location
            const province = firstLine.province || 'Khác';
            if (!locationMap[province]) locationMap[province] = { revenue: 0, count: 0 };
            locationMap[province].revenue += orderNetRevenue;
            locationMap[province].count += 1;

            // Status
            if (!statusMap[status]) statusMap[status] = { revenue: 0, count: 0 };
            statusMap[status].revenue += orderNetRevenue;
            statusMap[status].count += 1;
        }

        // Customer & Ops (Simplified)
        // Use Buyer Username as primary ID, fallback to Receiver Name + Phone for robustness
        const buyerId = (firstLine as any).buyerUsername;
        const receiverName = (firstLine as any).receiverName || 'Unknown';
        const phone = (firstLine as any).phoneNumber || '';

        // Final Customer ID: Prefer Shopee ID, otherwise Name+Phone to avoid collisions
        const customerId = buyerId || `${receiverName}_${phone}`;

        if (customerId && !isCancelled) {
            if (!customerMap[customerId]) {
                customerMap[customerId] = {
                    id: customerId,
                    buyerUsername: buyerId || '', // Keep it empty if truly missing, UI will handle fallback
                    name: receiverName,
                    phoneNumber: phone,
                    address: firstLine.province || '',
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: dateKey,
                    history: []
                };
            } else {
                // Update with latest info if available (to fix "Khách vãng lai" issues)
                if (receiverName && receiverName !== 'K*****y' && !receiverName.includes('*')) {
                    customerMap[customerId].name = receiverName;
                }
                if (phone && !phone.includes('*')) {
                    customerMap[customerId].phoneNumber = phone;
                }
                if (firstLine.province) {
                    customerMap[customerId].address = firstLine.province;
                }
            }

            const customer = customerMap[customerId];

            // Keep the latest date for all non-cancelled orders
            if (dateKey > customer.lastOrderDate) {
                customer.lastOrderDate = dateKey;
            }

            if (isRealized) {
                // Only count and track realized (completed) orders - must match history
                customer.orderCount++;
                customer.totalSpent += orderLines.reduce((sum, o) => sum + (o.orderTotalAmount || 0), 0);

                // Track History
                customerMap[customerId].history.push({
                    date: dateKey,
                    orderId: orderId,
                    value: orderNetRevenue,
                    products: orderLines.map(l => ({
                        name: l.productName,
                        variation: l.variationName,
                        quantity: l.quantity,
                        price: l.dealPrice || l.originalPrice,
                        originalPrice: l.originalPrice
                    }))
                });
            }
        }
    });

    // 4. Intermediate


    // Re-calculate simply by iterating groups
    let realizedRevenue = 0;
    let realizedCOGS = 0;
    let realizedFees = 0;
    let successfulOrdersRealized = 0;
    let cancelledOrdersCount = 0;

    // Captured Risky Orders (High Fee + Promo > 50%)
    const riskyOrderItems: ProductRiskProfile[] = [];

    Object.values(orderGroups).forEach(lines => {
        const first = lines[0];
        const status = first.orderStatus;
        const returnStatus = first.returnStatus;
        const orderId = first.orderId;

        if (status === 'Đã hủy') {
            cancelledOrdersCount++;
        }

        if (status !== 'Đã hủy' && returnStatus !== 'Đã Chấp Thuận Yêu Cầu') {
            successfulOrdersRealized++;
            // Calculate Order Totals
            let orderNet = 0;
            let orderEffectiveList = 0; // (Price * Qty_keeping)
            let orderCogs = 0;
            let orderSellerSubsidies = 0;
            let orderShopeeSubsidies = 0;
            // 2. Trừ phí sàn (Cố định, Dịch vụ, Thanh toán) và 3. Phí vận chuyển trả hàng
            let orderFee = (first.fixedFee || 0) + (first.serviceFee || 0) + (first.paymentFee || 0) + (first.returnShippingFee || 0);

            lines.forEach(line => {
                const qty = line.quantity || 0;
                const rQty = line.returnQuantity || 0;
                const originalPrice = line.originalPrice || 0;
                const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : originalPrice;
                const sellerRebate = line.sellerRebate || 0;

                // 1. Doanh thu thực nhận (A)
                const lineNetRev = (actualSalePrice * qty) - sellerRebate;
                orderNet += lineNetRev;

                const effectiveQty = (qty - rQty) > 0 ? (qty - rQty) : 0;
                const lineLosslessRev = (originalPrice * effectiveQty);
                orderEffectiveList += lineLosslessRev;

                // 4. Giá vốn = Giá gốc * Qty_thực_giữ * 40%
                orderCogs += lineLosslessRev * 0.4;

                orderSellerSubsidies += sellerRebate;
                orderShopeeSubsidies += (line.shopeeRebate || 0);
            });

            realizedRevenue += orderNet;
            realizedCOGS += orderCogs;
            realizedFees += orderFee;
            totalListRevenueRealized += orderEffectiveList;

            // TRACK FOR RISK
            // NOTE: gross revenue inside risk should reflect the effective list revenue 
            const effectiveGross = orderEffectiveList;

            if (orderNet > 0) {
                const feeRate = (orderFee / orderNet) * 100;
                // ONLY count Shop Voucher (Seller Rebate) as cost
                const sellerSubsidyRate = (orderSellerSubsidies / orderNet) * 100;
                const totalCostRate = feeRate + sellerSubsidyRate;
                const cogsRate = (orderCogs / orderNet) * 100;

                const orderDetailObj = {
                    trackingNumber: first.trackingNumber,
                    listRevenue: effectiveGross,
                    netRevenue: orderNet,
                    payoutAmount: orderNet - orderFee,
                    totalCOGS: orderCogs,
                    items: lines.map(l => ({
                        sku: l.skuReferenceNo || l.productName,
                        name: l.productName,
                        quantity: l.quantity || 0,
                        price: l.originalPrice || 0,
                        cogs: (0.4 * (l.originalPrice || 0) * (l.quantity || 0)) // Line COGS
                    })),
                    sellerVoucherAmount: orderSellerSubsidies,
                    shopeeVoucherAmount: orderShopeeSubsidies,
                    feeAmount: orderFee,
                    // Granular Fees
                    fixedFee: first.fixedFee || 0,
                    serviceFee: first.serviceFee || 0,
                    paymentFee: first.paymentFee || 0,
                    affiliateCommission: first.affiliateCommission || 0,
                    returnShippingFee: first.returnShippingFee || 0
                };

                // Priority 1: Selling Below Cost (COGS > Net Revenue)
                if (orderCogs > orderNet) {
                    riskyOrderItems.push({
                        sku: orderId,
                        name: `Đơn hàng ${orderId}`,
                        revenue: orderNet,
                        profit: orderNet - orderFee - orderCogs,
                        margin: (orderNet - orderFee - orderCogs) / orderNet * 100,
                        marginBeforeSubsidy: 0,
                        volume: 1,
                        cogsRate: cogsRate,
                        feeRate,
                        subsidyRate: sellerSubsidyRate,
                        returnRate: 0,
                        contribution: 0,
                        breakEvenPrice: 0,
                        breakEvenVoucher: 0,
                        priorityScore: (orderCogs - orderNet) * 2, // High priority
                        rootCause: 'A', // Cost Issue
                        rootCauseValue: cogsRate,
                        solution: `Đơn hàng bán lỗ vốn (COGS > Doanh thu). Giá vốn chiếm ${formatNumber(cogsRate)}% doanh thu.`,
                        orderDetail: orderDetailObj
                    });
                }
                // Priority 2: High Fee + Shop Voucher > 50%
                else if (totalCostRate > 50) {
                    riskyOrderItems.push({
                        sku: orderId,
                        name: `Đơn hàng ${orderId}`,
                        revenue: orderNet,
                        profit: orderNet - orderFee - orderCogs,
                        margin: (orderNet - orderFee - orderCogs) / orderNet * 100,
                        marginBeforeSubsidy: 0,
                        volume: 1,
                        cogsRate: cogsRate,
                        feeRate,
                        subsidyRate: sellerSubsidyRate,
                        returnRate: 0,
                        contribution: 0,
                        breakEvenPrice: 0,
                        breakEvenVoucher: 0,
                        priorityScore: totalCostRate * orderNet,
                        rootCause: 'E',
                        rootCauseValue: totalCostRate,
                        solution: `Tổng phí sàn + Shop Voucher chiếm ${formatNumber(totalCostRate)}% đơn hàng.`,
                        orderDetail: orderDetailObj
                    });
                }
            }
        }
    });

    const finalizedProducts = Object.values(productMap).map(p => {
        const revenue = p.revenue;
        const profit = revenue - (p as any).fees - p.cogs;
        p.grossProfit = profit;
        p.netProfit = profit;
        p.margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        // Basic badging
        if (p.margin < 10) p.badges.push('Risk');
        if (revenue > 1000000) p.badges.push('Hero');
        return p;
    });

    // --- ORDER RISK CONTROL CENTER LOGIC ---
    const riskAnalysis: import('./types').OrderRiskAnalysis[] = [];
    let riskTotalOrders = 0;
    let riskHighRiskCount = 0; // > 50% Control Ratio
    let riskLossCount = 0; // Net Profit < 0
    let riskSumControlRatio = 0;
    let riskTotalLossAmount = 0;

    Object.values(orderGroups).forEach(lines => {
        const first = lines[0];
        const status = first.orderStatus;
        const returnStatus = first.returnStatus;
        const orderId = first.orderId;
        const dateStr = first.orderDate || (first as any).orderCreationDate;

        let dateKey = 'Unknown';
        if (dateStr) {
            const d = parseShopeeDate(dateStr);
            if (d) dateKey = d.toISOString().split('T')[0];
        }

        // Filter: Loại trừ Đã hủy và Đã Chấp Thuận Yêu Cầu
        if (status !== 'Đã hủy' && returnStatus !== 'Đã Chấp Thuận Yêu Cầu') {
            riskTotalOrders++;

            // 1. Calculate Metrics
            let revenue = 0; // Doanh thu thực nhận
            let shopPromotion = 0; // Tổng ưu đãi Shop
            let cogs = 0; // Giá vốn

            lines.forEach(line => {
                const qty = line.quantity || 0;
                const returnQty = line.returnQuantity || 0;
                const originalPrice = line.originalPrice || 0;

                const actualSalePrice = (line.dealPrice && line.dealPrice > 0) ? line.dealPrice : originalPrice;
                const sellerRebate = line.sellerRebate || 0;

                revenue += (actualSalePrice * qty) - sellerRebate;
                shopPromotion += sellerRebate;

                const netQty = qty - returnQty;
                const effectiveNetQty = netQty > 0 ? netQty : 0;
                cogs += originalPrice * effectiveNetQty * 0.4;
            });

            // Platform Fees (Order Level) = Phí cố định + Phí dịch vụ + Phí thanh toán + Phí VC trả hàng
            const fixedFee = first.fixedFee || 0;
            const serviceFee = first.serviceFee || 0;
            const paymentFee = first.paymentFee || 0;
            const returnShippingFee = first.returnShippingFee || 0;
            const platformFee = fixedFee + serviceFee + paymentFee + returnShippingFee;

            const controlCost = shopPromotion + platformFee;
            const controlRatio = revenue > 0 ? (controlCost / revenue) * 100 : 0;
            const netProfit = revenue - cogs - controlCost;
            const grossMarginBeforePromo = revenue - cogs - platformFee;
            const structuralMargin = grossMarginBeforePromo;

            // A. Absolute Loss Flag
            const absoluteLossFlag = revenue > 0 && (netProfit / revenue < -0.05);

            // B. Promotion Burn Rate 
            const promotionBurnRate = structuralMargin > 0 ? (shopPromotion / structuralMargin) * 100 : (shopPromotion > 0 ? 100 : 0);

            // C. Break-even Price: (COGS + PlatformFee + ShopPromotion) / (1 - TargetMargin)
            const targetMargin = 0.15;
            const breakEvenPrice = (cogs + platformFee + shopPromotion) / (1 - targetMargin);

            // D. Risk Impact Score: |Net Loss| * 0.5 + (Control Ratio - 50%) * 0.3 * (Revenue scaling) + Revenue Weight * 0.2
            const lossTerm = netProfit < 0 ? Math.abs(netProfit) * 0.5 : 0;
            const controlTerm = controlRatio > 50 ? ((controlRatio - 50) / 100) * revenue * 0.3 : 0;
            const revTerm = revenue * 0.2;
            const riskImpactScore = lossTerm + controlTerm + revTerm;

            // 2. Classification
            let warningLevel: 'SAFE' | 'MONITOR' | 'WARNING' | 'DANGER' = 'SAFE';
            if (controlRatio <= 40) warningLevel = 'SAFE';
            else if (controlRatio <= 50) warningLevel = 'MONITOR';
            else if (controlRatio <= 70) warningLevel = 'WARNING';
            else warningLevel = 'DANGER';

            const isLoss = netProfit < 0;

            if (controlRatio > 50) riskHighRiskCount++;
            if (isLoss) {
                riskLossCount++;
                riskTotalLossAmount += Math.abs(netProfit);
            }
            riskSumControlRatio += controlRatio;

            // Cập nhật cho Daily Trends
            const dMap = dailyMap[dateKey];
            if (dMap) {
                // @ts-ignore
                if (controlRatio > 50) dMap.highRiskCount++;
                // @ts-ignore
                dMap.controlRatioSum += controlRatio;
                // @ts-ignore
                dMap.promoSum += shopPromotion;
                // @ts-ignore
                dMap.grossMarginBeforePromoSum += structuralMargin;
            }

            // 3. Root Cause Analysis
            let rootCause: 'A' | 'B' | 'C' | 'D' | 'E' = 'E'; // Default 
            let rootCauseValue = 0;

            const shopPromoRatio = revenue > 0 ? (shopPromotion / revenue) * 100 : 0;
            const platformFeeRatio = revenue > 0 ? (platformFee / revenue) * 100 : 0;
            const fixedFeeRatio = revenue > 0 ? (fixedFee / revenue) * 100 : 0;

            if (structuralMargin < 0) {
                rootCause = 'D'; // Structural Loss
                rootCauseValue = revenue > 0 ? (Math.abs(structuralMargin) / revenue) * 100 : 0;
            } else if (shopPromoRatio > Math.max(platformFeeRatio, 30)) {
                rootCause = 'A'; // Voucher
                rootCauseValue = shopPromoRatio;
            } else if (platformFeeRatio > 25) {
                rootCause = 'B'; // Fee
                rootCauseValue = platformFeeRatio;
            } else if (fixedFeeRatio > 10 && revenue < 200000) {
                rootCause = 'C'; // Fixed Fee at low revenue
                rootCauseValue = fixedFeeRatio;
            } else {
                rootCause = 'E'; // High Fee + Promo overall
                rootCauseValue = controlRatio;
            }

            // Fill Analysis
            riskAnalysis.push({
                orderId,
                trackingNumber: first.trackingNumber,
                orderDate: dateStr || '',

                revenue,
                cogs,
                shopPromotion,
                platformFee,
                controlCost,
                controlRatio,
                netProfit,
                grossMarginBeforePromo,
                structuralMargin,
                promotionBurnRate,
                breakEvenPrice,
                absoluteLossFlag,
                riskImpactScore,

                warningLevel,
                isLoss,

                rootCause,
                rootCauseValue
            });
        }
    });

    // Sort Risk Analysis
    riskAnalysis.sort((a, b) => {
        // Priority Score DESC
        return b.riskImpactScore - a.riskImpactScore;
    });

    const avgControlRatio = riskTotalOrders > 0 ? riskSumControlRatio / riskTotalOrders : 0;

    // 4. Finalize
    const totalGrossProfit = realizedRevenue - realizedCOGS - realizedFees;
    const netMargin = totalListRevenueRealized > 0 ? (totalGrossProfit / totalListRevenueRealized) * 100 : 0;
    const orderReturnRateVal = totalOrders > 0 ? (totalReturnQty / totalProductQty) * 100 : 0;

    // Risk Profile Generation (Products)
    let riskProfile = generateRiskProfile(
        finalizedProducts,
        totalGrossProfit > 0 ? totalGrossProfit : 1,
        netMargin
    );

    // MERGE Order Risks
    riskProfile = [...riskProfile, ...riskyOrderItems].sort((a, b) => b.priorityScore - a.priorityScore);


    return {
        totalOrders,

        // Realized Performance
        realizedPerformance: {
            totalOrders: totalOrders,
            cancelledOrders: cancelledOrdersCount,
            successfulOrders: successfulOrdersRealized,
            returnRate: orderReturnRateVal,
            aov: successfulOrdersRealized > 0 ? realizedRevenue / successfulOrdersRealized : 0,
            feePerOrder: successfulOrdersRealized > 0 ? realizedFees / successfulOrdersRealized : 0,
            cogsPerOrder: successfulOrdersRealized > 0 ? realizedCOGS / successfulOrdersRealized : 0,
        },

        totalListRevenue,      // 1- Rev 1
        totalNetRevenue: realizedRevenue,       // 2- Rev 2 (REALIZED ONLY)
        totalDiscount: totalListRevenue - realizedRevenue,
        totalVoucher: totalSubsidies,
        totalSurcharges: realizedFees,       // 3- Fees (REALIZED ONLY)
        totalGrossRevenue: realizedRevenue - realizedFees,     // 4- Rev 3 (Proceeds)
        totalCOGS: realizedCOGS,             // 5- COGS (REALIZED ONLY)
        totalGrossProfit: totalGrossProfit,      // 6- Profit (REALIZED ONLY)
        netMargin: netMargin,             // 7- Margin (REALIZED ONLY)
        profitPerSoldUnit: totalNetQty > 0 ? ((realizedRevenue - realizedCOGS - realizedFees) / totalNetQty) : 0,
        profitPerOrder: 0,
        avgOrderValue: successfulOrdersRealized > 0 ? realizedRevenue / successfulOrdersRealized : 0,
        daysWithNegativeProfit: 0,

        totalRevenue: totalListRevenue,
        netRevenue: realizedRevenue,
        totalNetProfit: totalGrossProfit,
        grossMargin: netMargin,

        totalFloorFees: totalSurcharges,
        totalSubsidies,

        totalProductQty,
        totalReturnQty,
        successfulOrders: totalSuccessfulOrders,
        returnOrderCount: 0, // Need calc
        returnRate: 0,
        orderReturnRate: 0,

        revenueTrend: Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date)).map((t: any) => ({
            date: t.date,
            revenue: t.revenue,
            netRevenue: t.revenue, // Rev 2
            grossProfit: t.revenue - t.cost, // Approx placeholder
            netProfit: t.profit,
            profitMargin: t.revenue1 > 0 ? (t.profit / t.revenue1) * 100 : 0,
            orders: t.orders
        })),

        productPerformance: finalizedProducts,
        locationAnalysis: Object.keys(locationMap).map(p => ({ province: p, revenue: locationMap[p].revenue, orderCount: locationMap[p].count })),
        statusAnalysis: Object.keys(statusMap).map(s => ({ status: s, ...statusMap[s] })),
        customerAnalysis: Object.values(customerMap),

        topProducts: finalizedProducts.sort((a, b) => b.revenue - a.revenue).slice(0, 15),
        riskProfile,
        dailyFinancials: Object.values(dailyMap).map((d: any) => ({
            ...d,
            margin: d.revenue1 > 0 ? (d.profit / d.revenue1) * 100 : 0,
            highRiskOrderPercent: d.successfulOrders > 0 ? (d.highRiskCount / d.successfulOrders) * 100 : 0,
            avgControlRatio: d.successfulOrders > 0 ? (d.controlRatioSum / d.successfulOrders) : 0,
            promotionBurnRate: d.grossMarginBeforePromoSum > 0 ? (d.promoSum / d.grossMarginBeforePromoSum) * 100 : (d.promoSum > 0 ? 100 : 0)
        })).sort((a: any, b: any) => a.date.localeCompare(b.date)),

        // New Risk Center
        riskAnalysis,
        riskStats: {
            totalOrders: riskTotalOrders,
            highRiskCount: riskHighRiskCount,
            lossCount: riskLossCount,
            avgControlRatio,
            totalLossAmount: riskTotalLossAmount
        },

        // Empty Stubs
        operationAnalysis: [],
        cancelAnalysis: [],
        returnAnalysis: [],
        feeAnalysis: [],
        subsidyAnalysis: [],
        riskAlerts: []
    };
};

// Define generateRiskProfile outside to ensure visibility
const generateRiskProfile = (
    products: any[],
    shopTotalProfit: number,
    shopAvgMargin: number
): ProductRiskProfile[] => {

    // Filter likely risky products: Margin < 15% OR ReturnRate > 10% OR Profit < 0
    // But keep enough to show "Priority Scores" even for non-critical if user wants diagnosis.
    // Filter likely risky products: Margin < 20% OR ReturnRate > 5% OR Profit < 0
    // Removed `true` debug flag to only show actual risks.
    const riskyProducts = products.filter((p: any) => {
        return (p.margin < 20) || ((p.returnRate || 0) > 5) || (p.grossProfit <= 0);
    });

    return riskyProducts.map((p: any) => {
        // 1. Structure Breakdown
        const revenue = p.revenue || 0;
        const fees = p.fees || 0;
        const cogs = p.cogs || 0;
        const subtitles = (p as any).subsidies || 0;
        const listRev = (p as any).listRevenue || revenue; // Fallback

        // Rates based on Net Revenue
        const cogsRate = revenue > 0 ? (cogs / revenue) * 100 : 0;
        const feeRate = revenue > 0 ? (fees / revenue) * 100 : 0;
        const subsidyRate = revenue > 0 ? (subtitles / revenue) * 100 : 0;

        // 2. Margin Before Subsidy
        const marginBeforeSubsidy = revenue > 0 ? ((p.grossProfit + subtitles) / revenue) * 100 : 0;

        // 3. Contribution
        const contribution = shopTotalProfit > 0 ? (p.grossProfit / shopTotalProfit) * 100 : 0;

        // 4. Root Cause Analysis
        let rootCause: 'A' | 'B' | 'C' | 'D' | 'E' = 'A';
        let rootCauseValue = cogsRate;
        const returnRate = p.returnRate || 0;
        const totalFeePromoRate = feeRate + subsidyRate;

        // Priority check
        if (returnRate > 15) {
            rootCause = 'D';
            rootCauseValue = returnRate;
        } else if (totalFeePromoRate > 50) {
            rootCause = 'E';
            rootCauseValue = totalFeePromoRate;
        } else if (subsidyRate > 15) {
            rootCause = 'C';
            rootCauseValue = subsidyRate;
        } else if (feeRate > 20) {
            rootCause = 'B';
            rootCauseValue = feeRate;
        } else {
            rootCause = 'A'; // Cost Structure default
            rootCauseValue = cogsRate;
        }

        // 5. Break-even & Solutions
        let solution = "";
        let breakEvenPrice = 0;
        let breakEvenVoucher = 0;

        // Break-even Price
        const variableCostRate = (fees + subtitles) / (revenue || 1);
        const denominator = (1 - variableCostRate) > 0.05 ? (1 - variableCostRate) : 0.05;
        const targetRev = cogs / denominator;
        breakEvenPrice = p.quantity > 0 ? targetRev / p.quantity : 0;

        // Break-even Voucher
        const maxSub = listRev - cogs - fees;
        breakEvenVoucher = listRev > 0 ? (maxSub / listRev) * 100 : 0;

        // Solution Text
        if (rootCause === 'D') {
            solution = `Giảm tỷ lệ hoàn còn 5% -> Lãi thêm ${formatVND((returnRate - 5) * listRev / 100)}`;
        } else if (rootCause === 'E') {
            solution = `Cắt giảm CTKM. Tổng phí sàn + KM đang chiếm ${formatNumber(totalFeePromoRate)}% doanh thu.`;
        } else if (rootCause === 'C') {
            solution = `Cắt giảm ${formatNumber(subsidyRate - 10)}% voucher -> Margin tăng ${formatNumber(subsidyRate - 10)}%`;
        } else if (rootCause === 'B') {
            solution = `Kiểm tra ngành hàng/cân nặng. Phí sàn đang chiếm ${formatNumber(feeRate)}%`;
        } else {
            const priceInc = breakEvenPrice - (revenue / (p.quantity || 1));
            solution = `Tăng giá bán ${formatVND(priceInc > 0 ? priceInc : 0)}/sp để hòa vốn`;
        }

        // 6. Priority Score (Target 15%)
        const marginGap = 15 - (p.margin || 0);
        let priorityScore = (marginGap * revenue);
        if (p.grossProfit < 0) priorityScore *= 1.5;

        return {
            sku: p.sku,
            name: p.name,
            revenue,
            profit: p.grossProfit,
            margin: p.margin,
            marginBeforeSubsidy,
            volume: p.quantity,
            cogsRate,
            feeRate,
            subsidyRate,
            returnRate,
            contribution,
            breakEvenPrice,
            breakEvenVoucher,
            priorityScore,
            rootCause,
            rootCauseValue,
            solution,
            relatedOrders: p.relatedOrders
        };

    }).sort((a: any, b: any) => b.priorityScore - a.priorityScore);
};

// ─────────────────────────────────────────────────────────────────
// NEW: Product Economics (3-page redesign)
// ─────────────────────────────────────────────────────────────────
export interface ProductEconomicsResult {
    skuEconomics: SkuEconomics[];
    orderEconomics: OrderEconomics[];
    portfolio: PortfolioSummary;
}

export function calculateProductEconomics(orders: ShopeeOrder[]): ProductEconomicsResult {
    const COGS_RATE = 0.40;
    const GUARDRAIL_DISCOUNT = 40; // % max discount from list price

    // ── Group order lines by orderId ──────────────────────────────
    const orderGroupMap: Record<string, ShopeeOrder[]> = {};
    const seenLines = new Set<string>();

    for (const o of orders) {
        const status = (o.orderStatus || '').toLowerCase();
        if (status.includes('hủy') || status.includes('cancel')) continue; // skip cancelled
        const lineKey = `${o.orderId}_${o.skuReferenceNo}_${o.quantity}`;
        if (seenLines.has(lineKey)) continue;
        seenLines.add(lineKey);
        if (!orderGroupMap[o.orderId]) orderGroupMap[o.orderId] = [];
        orderGroupMap[o.orderId].push(o);
    }

    // ── Per-SKU accumulators ──────────────────────────────────────
    const skuAccMap: Record<string, {
        name: string;
        qty: number;
        listPriceSum: number;      // sum of originalPrice × qty
        allocatedRev: number;
        fees: number;
        subsidy: number;
        returnQty: number;
        totalSoldQty: number;
    }> = {};

    // ── Order Economics list ──────────────────────────────────────
    const orderEconomics: OrderEconomics[] = [];

    for (const [orderId, lines] of Object.entries(orderGroupMap)) {
        // Order totals
        const totalListPrice = lines.reduce((s, l) => s + (l.originalPrice || 0) * (l.quantity || 1), 0);
        const totalActualPrice = lines.reduce((s, l) => s + (l.dealPrice || l.originalPrice || 0) * (l.quantity || 1), 0);
        const totalListPriceForAlloc = totalListPrice || 1;
        const totalFees = lines.reduce((s, l) => s + ((l.fixedFee || 0) + (l.serviceFee || 0) + (l.paymentFee || 0) + (l.affiliateCommission || 0)), 0);
        const totalSubsidy = lines.reduce((s, l) => s + ((l.sellerRebate || 0) + (l.shopeeRebate || 0) + (l.sellerSubsidy || 0)), 0);
        const totalCogs = totalListPrice * COGS_RATE;
        const orderProfit = totalActualPrice - totalCogs - totalFees + totalSubsidy;
        const orderMargin = totalActualPrice > 0 ? (orderProfit / totalActualPrice) * 100 : 0;
        const discountPct = totalListPrice > 0 ? ((totalListPrice - totalActualPrice) / totalListPrice) * 100 : 0;
        const guardrailBreached = discountPct > GUARDRAIL_DISCOUNT;

        const firstLine = lines[0];
        orderEconomics.push({
            orderId,
            orderDate: firstLine.orderDate || '',
            lineCount: lines.length,
            totalListPrice,
            totalActualPrice,
            discountPct,
            guardrailBreached,
            totalCogs,
            totalFees,
            totalSubsidy,
            orderProfit,
            orderMargin,
        });

        // ── Smart group allocation: discounted vs. non-discounted ──
        // Non-discounted lines keep their exact dealPrice (no sharing needed).
        // Discounted lines share the "discount pool" proportionally by list price.
        const discountedLines = lines.filter(l => (l.dealPrice || 0) < (l.originalPrice || 0));
        const nonDiscountedLines = lines.filter(l => (l.dealPrice || l.originalPrice || 0) >= (l.originalPrice || 0));

        // Revenue for non-discounted: exact deal price
        const nonDiscountedActual = nonDiscountedLines.reduce((s, l) => s + (l.dealPrice || l.originalPrice || 0) * (l.quantity || 1), 0);
        // Remaining revenue to allocate among discounted group
        const discountedActual = totalActualPrice - nonDiscountedActual;
        const discountedListTotal = discountedLines.reduce((s, l) => s + (l.originalPrice || 0) * (l.quantity || 1), 0);

        const processLine = (l: ShopeeOrder, allocatedRev: number, feeBase: number) => {
            const sku = l.skuReferenceNo || l.productName;
            const listPriceSku = (l.originalPrice || 0) * (l.quantity || 1);
            const lineShare = totalListPrice > 0 ? listPriceSku / totalListPrice : 1 / lines.length;
            const feeShare = feeBase * lineShare;
            const subsidyShare = totalSubsidy * lineShare;

            if (!skuAccMap[sku]) {
                skuAccMap[sku] = { name: l.productName, qty: 0, listPriceSum: 0, allocatedRev: 0, fees: 0, subsidy: 0, returnQty: 0, totalSoldQty: 0 };
            }
            const acc = skuAccMap[sku];
            acc.qty += (l.quantity || 1);
            acc.totalSoldQty += (l.quantity || 1);
            acc.listPriceSum += listPriceSku;
            acc.allocatedRev += allocatedRev;
            acc.fees += feeShare;
            acc.subsidy += subsidyShare;
            acc.returnQty += (l.returnQuantity || 0);
        };

        // Non-discounted: each SKU earns its own deal price
        for (const l of nonDiscountedLines) {
            const rev = (l.dealPrice || l.originalPrice || 0) * (l.quantity || 1);
            processLine(l, rev, totalFees);
        }

        // Discounted group: allocate discountedActual by list price ratio
        for (const l of discountedLines) {
            const listPriceSku = (l.originalPrice || 0) * (l.quantity || 1);
            const share = discountedListTotal > 0 ? listPriceSku / discountedListTotal : 1 / discountedLines.length;
            const rev = discountedActual * share;
            processLine(l, rev, totalFees);
        }
    }

    // ── Build SKU Economics with badges ──────────────────────────
    const allProfits = Object.entries(skuAccMap).map(([sku, a]) => {
        const cogs = a.listPriceSum * COGS_RATE;
        return { sku, profit: a.allocatedRev - cogs - a.fees + a.subsidy };
    });
    const allProfitsSorted = [...allProfits].sort((a, b) => b.profit - a.profit);
    const bottom20Threshold = allProfitsSorted[Math.floor(allProfitsSorted.length * 0.8)]?.profit ?? 0;
    const top30RevenueThreshold = (() => {
        const revs = Object.values(skuAccMap).map(a => a.allocatedRev).sort((a, b) => b - a);
        return revs[Math.floor(revs.length * 0.3)] ?? 0;
    })();

    const skuEconomics: SkuEconomics[] = Object.entries(skuAccMap).map(([sku, acc]) => {
        const cogs = acc.listPriceSum * COGS_RATE;
        const profit = acc.allocatedRev - cogs - acc.fees + acc.subsidy;
        // contributionMargin = profit (no ads data yet — field is ready for ads integration)
        const contributionMargin = profit;
        const margin = acc.allocatedRev > 0 ? (profit / acc.allocatedRev) * 100 : 0;
        const returnRate = acc.totalSoldQty > 0 ? (acc.returnQty / acc.totalSoldQty) * 100 : 0;
        const listPrice = acc.qty > 0 ? acc.listPriceSum / acc.qty : 0;

        // Badge logic (priority: Kill List > Risk > Hero > Traffic Driver > OK)
        let badge: SkuBadge = 'OK';
        const isBottom20Rev = acc.allocatedRev <= bottom20Threshold;

        if (profit < 0 || (margin < 10 && isBottom20Rev)) {
            badge = '🔴 Kill List';
        } else if (returnRate >= 10 || margin < 15) {
            badge = '🟠 Risk';
        } else if (margin >= 25 && returnRate <= 5 && acc.allocatedRev >= top30RevenueThreshold) {
            badge = '🟢 Hero';
        } else if (acc.allocatedRev >= top30RevenueThreshold && margin < 25) {
            badge = '🔵 Traffic Driver';
        }

        // SKU type: heuristics
        let skuType: SkuType = 'Core';
        if (acc.allocatedRev === 0) skuType = 'Gift';
        else if (badge === '🔵 Traffic Driver') skuType = 'Traffic';

        return { sku, name: acc.name, skuType, quantity: acc.qty, listPrice, allocatedRevenue: acc.allocatedRev, cogs, fees: acc.fees, subsidy: acc.subsidy, profit, contributionMargin, margin, returnRate, badge };
    }).sort((a, b) => b.allocatedRevenue - a.allocatedRevenue);

    // ── Portfolio Summary ─────────────────────────────────────────
    const totalProfit = skuEconomics.reduce((s, p) => s + p.profit, 0);
    const totalRevenue = skuEconomics.reduce((s, p) => s + p.allocatedRevenue, 0);
    const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const breachedOrders = orderEconomics.filter(o => o.guardrailBreached);
    const guardrailBreachRate = orderEconomics.length > 0 ? (breachedOrders.length / orderEconomics.length) * 100 : 0;
    const guardrailBreachImpact = breachedOrders.reduce((s, o) => s + o.orderProfit, 0);

    // Simulate: what if breached orders were repriced to exactly 60% of list price?
    const potentialProfitGain = breachedOrders.reduce((gain, o) => {
        const flooredRevenue = o.totalListPrice * 0.60; // 60% of niêm yết
        const simulatedProfit = flooredRevenue - o.totalCogs - o.totalFees - o.totalSubsidy; // Subsidy is a cost here
        return gain + (simulatedProfit - o.orderProfit);
    }, 0);

    const lossSKUs = skuEconomics.filter(p => p.profit < 0);
    const lossSKURatio = skuEconomics.length > 0 ? (lossSKUs.length / skuEconomics.length) * 100 : 0;

    // Pareto analysis
    const top20Count = Math.max(1, Math.ceil(skuEconomics.length * 0.2));
    const skuByProfit = [...skuEconomics].sort((a, b) => b.profit - a.profit);
    let cumProfit = 0;
    const pareto: ParetoItem[] = skuByProfit.map((p, i) => {
        cumProfit += p.profit;
        return {
            sku: p.sku,
            name: p.name,
            profit: p.profit,
            cumProfitPct: totalProfit > 0 ? (cumProfit / totalProfit) * 100 : 0,
            isTop20: i < top20Count,
        };
    });
    const top20ProfitShare = pareto.filter(p => p.isTop20).reduce((s, p) => s + p.profit, 0);
    const top20ProfitSharePct = totalProfit > 0 ? (top20ProfitShare / totalProfit) * 100 : 0;

    return {
        skuEconomics,
        orderEconomics,
        portfolio: {
            totalRevenue,
            totalProfit,
            totalMargin,
            guardrailBreachRate,
            guardrailBreachImpact,
            potentialProfitGain,
            top20ProfitShare: top20ProfitSharePct,
            lossSKURatio,
            pareto,
        },
    };
}
