
const fs = require('fs');
const path = require('path');

function parseShopeeDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr.replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
}

const dbPath = path.join('c:', 'Users', 'PhamThang', '.gemini', 'antigravity', 'scratch', 'shopee-dashboard', 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const reportId = '1771840223087'; // Miền Bắc
const orders = db.orders[reportId];

// Grouping
const orderGroups = {};
orders.forEach(o => {
    if (!orderGroups[o.orderId]) orderGroups[o.orderId] = [];
    orderGroups[o.orderId].push(o);
});

// ACCUMULATORS
let count_realized = 0;
let sum_originalPrice_qty = 0; // Price * Qty (List Revenue)
let sum_dealPrice_qty = 0;     // Deal Price * Qty
let sum_orderTotalAmount = 0;  // Amount buyer paid + vouchers
let sum_shopVoucher = 0;       // Order-level Voucher
let sum_sellerRebate = 0;      // Product-level Rebate
let sum_fixedFee = 0;
let sum_serviceFee = 0;
let sum_paymentFee = 0;
let sum_returnShipping = 0;
let sum_strictAovNum = 0;

Object.values(orderGroups).forEach(group => {
    const first = group[0];
    const status = first.orderStatus;
    const returnStatus = first.returnStatus;
    const totalReturnQty = group.reduce((sum, l) => sum + (l.returnQuantity || 0), 0);
    const totalQty = group.reduce((sum, l) => sum + (l.quantity || 0), 0);

    const isCancelled = status === 'Đã hủy';
    const hasReturn = returnStatus === 'Đã Chấp Thuận Yêu Cầu' || totalReturnQty > 0;

    if (!isCancelled && !hasReturn) {
        count_realized++;

        // AOV Num: (orderTotalAmount - shopVoucher)
        sum_strictAovNum += (first.orderTotalAmount || 0) - (first.shopVoucher || 0);

        sum_orderTotalAmount += (first.orderTotalAmount || 0);
        sum_shopVoucher += (first.shopVoucher || 0);
        sum_fixedFee += (first.fixedFee || 0);
        sum_serviceFee += (first.serviceFee || 0);
        sum_paymentFee += (first.paymentFee || 0);
        sum_returnShipping += (first.returnShippingFee || 0);

        group.forEach(line => {
            sum_originalPrice_qty += (line.originalPrice || 0) * (line.quantity || 0);
            sum_dealPrice_qty += (line.dealPrice || 0) * (line.quantity || 0);
            sum_sellerRebate += (line.sellerRebate || 0);
        });
    }
});

const totalFees = sum_fixedFee + sum_serviceFee + sum_paymentFee;
const totalMarketing = sum_shopVoucher + sum_sellerRebate;
const proceeds = sum_originalPrice_qty - totalMarketing - totalFees - sum_returnShipping;
const netAfterTax = proceeds / 1.08;
const aov = sum_strictAovNum / count_realized;

console.log('--- AUDIT RESULTS FOR MIỀN BẮC ---');
console.log('Đơn thành công:', count_realized);
console.log('1. List Revenue (Giá x SL):', sum_originalPrice_qty);
console.log('2. Marketing (Voucher + Rebate):', totalMarketing);
console.log('3. Fees (Cố định + Dịch vụ + Thanh toán):', totalFees);
console.log('4. Proceeds (List - Marketing - Fees):', proceeds);
console.log('5. Net After Tax (Proceeds / 1.08):', netAfterTax);
console.log('6. AOV Numerator (TotalAmount - ShopVoucher):', sum_strictAovNum);
console.log('7. AOV:', aov);

console.log('\n--- VERIFICATION AGAINST USER NUMBERS ---');
console.log('User Gộp (39,779,552) vs Audit Proceeds:', proceeds, 'Diff:', proceeds - 39779552);
console.log('User Thuần (36,815,974) vs Audit Net:', netAfterTax, 'Diff:', netAfterTax - 36815974);
console.log('User Phí sàn (16,851,068) vs Audit Fees:', totalFees, 'Diff:', totalFees - 16851068);
console.log('User KM (11,099,380) vs Audit Marketing:', totalMarketing, 'Diff:', totalMarketing - 11099380);
console.log('User AOV (83,541) vs Audit AOV:', aov, 'Diff:', aov - 83541);
