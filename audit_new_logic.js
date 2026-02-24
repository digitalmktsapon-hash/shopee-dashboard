
const fs = require('fs');
const path = require('path');

function parseShopeeDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr.replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
}

const dbPath = path.join(__dirname, 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Find the report ID for "Miền Bắc"
const mbReport = db.reports.find(r => r.shopName === 'Miền Bắc');
if (!mbReport) {
    console.log("Miền Bắc report not found in reports list");
    process.exit(1);
}

// 2. Get orders using the report ID
const orders = db.orders[mbReport.id];
if (!orders) {
    console.log(`No orders found for report ID ${mbReport.id}`);
    process.exit(1);
}

// NEW LOGIC METRICS
let gmv = 0;
let shopSubsidies = 0;
let platformFees = 0;
let uniqueOrders = new Set();

let returnValue = 0;
let returnFees = 0;

orders.forEach(o => {
    const payoutDate = parseShopeeDate(o.payoutDate);
    const isCancelled = o.orderStatus === 'Đã hủy';

    // I. TỔNG QUAN DOANH THU (Based on Payout Date)
    if (payoutDate && !isCancelled) {
        gmv += (o.originalPrice || 0) * (o.quantity || 0);
        shopSubsidies += (o.sellerRebate || 0) + (o.shopComboDiscount || 0) + (o.tradeInBonusBySeller || 0) + (o.shopVoucher || 0);
        platformFees += (o.fixedFee || 0) + (o.serviceFee || 0) + (o.paymentFee || 0);
        uniqueOrders.add(o.orderId);
    }

    // II. PHẦN HOÀN HÀNG (Simplified: any return in the period)
    const hasReturn = o.returnStatus && o.returnStatus !== '';
    if (hasReturn && !isCancelled) {
        returnValue += (o.originalPrice || 0) * (o.returnQuantity || o.quantity || 0);
        returnFees += (o.returnShippingFee || 0);
    }
});

const draftNet = gmv - shopSubsidies - platformFees;
const returnImpact = returnValue + returnFees;
const actualNet = draftNet - returnImpact;

const aov = uniqueOrders.size > 0 ? gmv / uniqueOrders.size : 0;
const feeRate = gmv > 0 ? (platformFees / gmv) * 100 : 0;
const subsidyRate = gmv > 0 ? (shopSubsidies / gmv) * 100 : 0;
const marginPreCogs = gmv > 0 ? (actualNet / gmv) * 100 : 0;

console.log("--- NEW LOGIC AUDIT: MIỀN BẮC ---");
console.log(`1. GMV: ${gmv}`);
console.log(`2. Shop Subsidies: ${shopSubsidies}`);
console.log(`3. Platform Fees: ${platformFees}`);
console.log(`4. Draft Net (Phát sinh): ${draftNet}`);
console.log("---------------------------------");
console.log(`5. Return Value: ${returnValue}`);
console.log(`6. Return Fees: ${returnFees}`);
console.log(`7. Return Impact: ${returnImpact}`);
console.log("---------------------------------");
console.log(`8. Actual Net (Thực tế tháng): ${actualNet}`);
console.log("---------------------------------");
console.log(`9. Orders: ${uniqueOrders.size}`);
console.log(`10. AOV: ${aov}`);
console.log(`11. Fee Rate: ${feeRate.toFixed(2)}%`);
console.log(`12. Subsidy Rate: ${subsidyRate.toFixed(2)}%`);
console.log(`13. Margin (Pre-COGS): ${marginPreCogs.toFixed(2)}%`);
