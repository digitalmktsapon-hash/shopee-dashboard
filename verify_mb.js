
const fs = require('fs');
const path = require('path');

// Mock parseShopeeDate because we need it for calculation
function parseShopeeDate(dateStr) {
    if (!dateStr) return null;
    // Handle "2026-02-01 12:18"
    const d = new Date(dateStr.replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
}

const dbPath = path.join('c:', 'Users', 'PhamThang', '.gemini', 'antigravity', 'scratch', 'shopee-dashboard', 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const reportId = '1771840223087'; // Miền Bắc
const orders = db.orders[reportId];

if (!orders) {
    console.log('No orders found for Miền Bắc');
    process.exit(1);
}

// Group by orderId
const orderGroups = {};
orders.forEach(o => {
    if (!orderGroups[o.orderId]) orderGroups[o.orderId] = [];
    orderGroups[o.orderId].push(o);
});

let totalOrders = 0;
let totalSuccessfulOrders = 0;
let successfulOrdersRealized = 0;
let strictAOVNumerator = 0;
let realizedRevenue = 0;
let realizedFees = 0;
let totalListRevenueRealized = 0;
let totalSubsidies = 0;
let allReturnShippingFee = 0;

Object.values(orderGroups).forEach(group => {
    const first = group[0];
    const status = first.orderStatus;
    const returnStatus = first.returnStatus;

    totalOrders++;

    const totalQtyBeforeReturn = group.reduce((sum, l) => sum + (l.quantity || 0), 0);
    const totalReturnQtyInOrder = group.reduce((sum, l) => sum + (l.returnQuantity || 0), 0);
    const qtyKept = (totalQtyBeforeReturn - totalReturnQtyInOrder) > 0 ? (totalQtyBeforeReturn - totalReturnQtyInOrder) : 0;
    const hasReturnInGroup = returnStatus === 'Đã Chấp Thuận Yêu Cầu' || totalReturnQtyInOrder > 0;

    const isCancelled = status === 'Đã hủy';
    const isRealized = !isCancelled && !hasReturnInGroup;

    if (isRealized) {
        totalSuccessfulOrders++;
        successfulOrdersRealized++;

        // strictAOVNumerator
        strictAOVNumerator += (first.orderTotalAmount || 0) - (first.shopVoucher || 0);

        const retRatio = totalQtyBeforeReturn > 0 ? (qtyKept / totalQtyBeforeReturn) : 0;
        let orderPlatformFee = ((first.fixedFee || 0) + (first.serviceFee || 0) + (first.paymentFee || 0)) * retRatio;
        let orderReturnShippingFee = first.returnShippingFee || 0;

        let orderGrossRev = 0;
        let orderMarketingCost = 0;

        group.forEach(line => {
            const qty = line.quantity || 0;
            const rQty = line.returnQuantity || 0;
            const originalPrice = line.originalPrice || 0;
            const effectiveQty = (qty - rQty) > 0 ? (qty - rQty) : 0;

            orderGrossRev += (originalPrice * effectiveQty);
            orderMarketingCost += (line.sellerRebate || 0) * (effectiveQty / (qty || 1));
        });

        const orderShopVoucher = (first.shopVoucher || 0) * retRatio;
        orderMarketingCost += orderShopVoucher;

        let orderNet = orderGrossRev - orderMarketingCost - orderReturnShippingFee;

        realizedRevenue += orderNet;
        realizedFees += orderPlatformFee;
        totalListRevenueRealized += orderGrossRev;
        totalSubsidies += orderMarketingCost;
        allReturnShippingFee += orderReturnShippingFee;
    }
});

const netRevenueAfterTax = (realizedRevenue - realizedFees - allReturnShippingFee) / 1.08;
const aov = successfulOrdersRealized > 0 ? strictAOVNumerator / successfulOrdersRealized : 0;

console.log('Results for Shopee Miền Bắc:');
console.log('Đơn thành công:', totalSuccessfulOrders);
console.log('Doanh thu gộp:', totalListRevenueRealized.toFixed(0));
console.log('Chi phí CTKM:', totalSubsidies.toFixed(0));
console.log('Phí sàn:', realizedFees.toFixed(0));
console.log('Doanh thu thuần:', netRevenueAfterTax.toFixed(0));
console.log('AOV:', aov.toFixed(0));
