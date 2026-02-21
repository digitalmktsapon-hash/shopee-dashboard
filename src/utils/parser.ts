import * as XLSX from 'xlsx';
import { ShopeeOrder } from './types';

// Mapping file column names to object keys
const COLUMN_MAPPING: Record<string, keyof ShopeeOrder> = {
    // Basic Info
    "Mã đơn hàng": "orderId", "Order ID": "orderId", "Ma don hang": "orderId",
    "Mã Kiện Hàng": "packageId", "Package ID": "packageId",
    "Ngày đặt hàng": "orderDate", "Order Creation Date": "orderDate", "Ngay dat hang": "orderDate",
    "Trạng Thái Đơn Hàng": "orderStatus", "Order Status": "orderStatus", "Trang thai don hang": "orderStatus",
    "Mã vận đơn": "trackingNumber", "Tracking Number": "trackingNumber",
    "Đơn Vị Vận Chuyển": "deliveryCarrier", "Shipping Channel": "deliveryCarrier",

    // Product Info
    "Tên sản phẩm": "productName", "Product Name": "productName", "Ten san pham": "productName",
    "SKU sản phẩm": "productSku", "Product SKU": "productSku", "Parent SKU": "productSku",
    "SKU phân loại hàng": "skuReferenceNo", "Variation SKU": "skuReferenceNo",
    "Tên phân loại hàng": "variationName", "Variation Name": "variationName",
    "Số lượng": "quantity", "Quantity": "quantity", "So luong": "quantity",

    // Formatting & Weights
    "Cân nặng sản phẩm": "productWeight", "Product Weight": "productWeight",
    "Tổng cân nặng": "totalWeight", "Total Weight": "totalWeight",

    // Financials - Prices
    "Giá gốc": "originalPrice", "Original Price": "originalPrice", "Gia goc": "originalPrice",
    "Giá ưu đãi": "dealPrice", "Deal Price": "dealPrice", "Gia uu dai": "dealPrice", "Discounted Price": "dealPrice",
    "Tổng số tiền người mua thanh toán": "buyerPaid", "Grand Total": "buyerPaid", "Tong so tien nguoi mua thanh toan": "buyerPaid",
    "Tổng giá trị đơn hàng (VND)": "orderTotalAmount", "Total Amount": "orderTotalAmount", "Tong gia tri don hang (VND)": "orderTotalAmount", "Tong gia tri don hang": "orderTotalAmount",
    "Tổng giá bán (sản phẩm)": "dealPriceTotal",

    // Fees
    "Phí cố định": "fixedFee", "Fixed Fee": "fixedFee", "Phi co dinh": "fixedFee",
    "Phí Dịch Vụ": "serviceFee", "Service Fee": "serviceFee", "Phi dich vu": "serviceFee",
    "Phí thanh toán": "paymentFee", "Transaction Fee": "paymentFee", "Phi thanh toan": "paymentFee",
    "Phí vận chuyển (dự kiến)": "shippingFee", "Estimated Shipping Fee": "shippingFee", "Shipping Fee": "shippingFee",
    "Phí vận chuyển mà người mua trả": "buyerShippingFee", "Shipping Fee Paid by Buyer": "buyerShippingFee",
    "Phí vận chuyển tài trợ bởi Shopee (dự kiến)": "shopeeShippingRebate",
    "Phí vận chuyển trả hàng (đơn Trả hàng/hoàn tiền)": "returnShippingFee",
    "Phí hoa hồng Tiếp thị liên kết": "affiliateCommission", "Affiliate Commission Fee": "affiliateCommission", // Added mapping

    // Rebates & Vouchers
    "Mã giảm giá của Shop": "shopVoucher", "Shop Voucher": "shopVoucher",
    "Mã giảm giá của Shopee": "shopeeVoucher", "Shopee Voucher": "shopeeVoucher",
    "Shopee Xu được hoàn": "shopeeCoinsRedeemed", "Shopee Coins Redeemed": "shopeeCoinsRedeemed",
    "Được Shopee trợ giá": "shopeeRebate", "Shopee Rebate": "shopeeRebate",
    "Tổng số tiền được người bán trợ giá": "sellerRebate", "Seller Rebate": "sellerRebate", // Or Seller Absorbed Coin Cashback

    // Returns
    "Trạng thái Trả hàng/Hoàn tiền": "returnStatus", "Return / Refund Status": "returnStatus",
    "Số lượng sản phẩm được hoàn trả": "returnQuantity", "Returned Quantity": "returnQuantity",

    // Customer
    "Người Mua": "buyerUsername", "Username (Buyer)": "buyerUsername", "Nguoi Mua": "buyerUsername",
    "Tên Người nhận": "receiverName", "Receiver Name": "receiverName", "Ten Nguoi nhan": "receiverName",
    "Số điện thoại": "phoneNumber", "Phone Number": "phoneNumber", "So dien thoai": "phoneNumber",
    "Địa chỉ nhận hàng": "remarks", "Delivery Address": "remarks", // Mapping address to remarks/address fields
    "Tỉnh/Thành phố": "province", "Province": "province",
    "Quận": "district", "District": "district",
    "TP / Quận / Huyện": "ward", "Town": "ward", // Shopee naming is inconsistent

    // Dates
    "Ngày giao hàng dự kiến": "expectedDeliveryDate", "Estimated Delivery Date": "expectedDeliveryDate",
    "Ngày gửi hàng": "shipDate", "Ship Time": "shipDate",
    "Thời gian giao hàng": "shipTime",
    "Thời gian hoàn thành đơn hàng": "completeDate", "Order Complete Time": "completeDate",
    "Thời gian đơn hàng được thanh toán": "payoutDate", "Payout Time": "payoutDate",

    // Others
    "Lý do hủy": "cancelReason", "Cancel Reason": "cancelReason",
    "Tên kho hàng": "warehouseName", "Warehouse Name": "warehouseName"
};

export const parseShopeeReport = async (file: File): Promise<{ data: ShopeeOrder[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON with header row
                const rawData = XLSX.utils.sheet_to_json(sheet) as any[];
                const headers = rawData.length > 0 ? Object.keys(rawData[0] as object) : [];

                const orders: ShopeeOrder[] = rawData.map((row: any) => {
                    const order: any = {};

                    Object.keys(COLUMN_MAPPING).forEach(colName => {
                        // Find key in row that roughly matches colName
                        const rowKey = Object.keys(row).find(k => {
                            const fileHeader = k.trim().toLowerCase();
                            const mapHeader = colName.trim().toLowerCase();
                            return fileHeader === mapHeader || fileHeader.startsWith(mapHeader) || fileHeader.includes(mapHeader);
                        });
                        if (rowKey) {
                            const targetKey = COLUMN_MAPPING[colName];
                            let value = row[rowKey];

                            // Simple cleaning
                            if (typeof value === 'string') {
                                value = value.trim();
                                // Clean currency/number fields
                                if (['originalPrice', 'dealPrice', 'quantity', 'buyerPaid', 'orderTotalAmount',
                                    'fixedFee', 'serviceFee', 'paymentFee', 'shippingFee', 'buyerShippingFee',
                                    'shopeeShippingRebate', 'returnShippingFee', 'sellerRebate', 'shopeeRebate',
                                    'productWeight', 'totalWeight', 'returnQuantity', 'sellerSubsidy', 'dealPriceTotal',
                                    'shopVoucher', 'coinCashback', 'shopeeVoucher', 'shopeeComboDiscount',
                                    'shopComboDiscount', 'shopeeCoinsRedeemed', 'cardPromotionDiscount',
                                    'tradeInDiscount', 'tradeInBonus', 'tradeInBonusBySeller', 'codAmount',
                                    'affiliateCommission'
                                ].includes(targetKey)) {
                                    // Remove non-numeric chars except dot/minus, but be careful with thousand separators
                                    // Shopee reports usually use dots or commas depending on locale. 
                                    // Assuming simplified numeric string or raw number from Excel parser.
                                    // If Excel parser returns number, good. If string "100.000", might be issue if JS expects "100000".
                                    // For now, let's assume standard parsing or basic string cleanup.
                                    if (typeof value === 'string') {
                                        // Remove commas if they are thousand separators? 
                                        // Or just standard parse. 
                                        // Let's safe parse.
                                        // If "1.000.000" -> 1000000. If "1,000.00" -> 1000.00
                                        // Context: Vietnam usually uses "." for thousands.
                                        // Let's try to keeping digits and minus.
                                        // If simple replace:
                                        // value = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                        // BUT "1.200" in VN is 1200. In US is 1.2
                                        // Just keeping it as is if it parses, else 0.
                                        // Actually best to trust XLSX parser first, then clean if string.
                                    }
                                }
                            }

                            // Force number type for numeric fields
                            if (['originalPrice', 'dealPrice', 'quantity', 'buyerPaid', 'orderTotalAmount',
                                'fixedFee', 'serviceFee', 'paymentFee', 'shippingFee', 'buyerShippingFee',
                                'shopeeShippingRebate', 'returnShippingFee', 'sellerRebate', 'shopeeRebate',
                                'productWeight', 'totalWeight', 'returnQuantity', 'sellerSubsidy', 'dealPriceTotal',
                                'shopVoucher', 'coinCashback', 'shopeeVoucher', 'shopeeComboDiscount',
                                'shopComboDiscount', 'shopeeCoinsRedeemed', 'cardPromotionDiscount',
                                'tradeInDiscount', 'tradeInBonus', 'tradeInBonusBySeller', 'codAmount',
                                'affiliateCommission'
                            ].includes(targetKey)) {
                                if (typeof value === 'string') {
                                    // Remove whitespace
                                    value = value.trim();
                                    // Detect if it's "1.234,56" (VN) or "1,234.56" (US)
                                    // If there's a comma after a dot, "." is likely thousands.
                                    // Shopee exports are often inconsistent.
                                    // Simple logic: if there is both dot and comma:
                                    if (value.includes('.') && value.includes(',')) {
                                        if (value.indexOf('.') < value.indexOf(',')) {
                                            // 1.234,56
                                            value = value.replace(/\./g, "").replace(",", ".");
                                        } else {
                                            // 1,234.56
                                            value = value.replace(/,/g, "");
                                        }
                                    } else if (value.includes(',')) {
                                        // "22000,00" or "1.234,00" -> detect if it's decimal
                                        if (value.split(',')[1]?.length === 2) {
                                            value = value.replace(/\./g, "").replace(",", ".");
                                        } else {
                                            value = value.replace(/,/g, "");
                                        }
                                    } else if (value.includes('.')) {
                                        // "22000.00" -> keep dot for parseFloat
                                        // "1.234.567" -> remove all dots
                                        const parts = value.split('.');
                                        if (parts.length > 2 || parts[parts.length - 1].length !== 2) {
                                            value = value.replace(/\./g, "");
                                        }
                                    }
                                    value = parseFloat(value) || 0;
                                } else {
                                    value = Number(value) || 0;
                                }
                            }

                            order[targetKey] = value;
                        }
                    });

                    return order as ShopeeOrder;
                });

                resolve({ data: orders, headers });

                resolve({ data: orders, headers });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);

        reader.readAsBinaryString(file);
    });
};
