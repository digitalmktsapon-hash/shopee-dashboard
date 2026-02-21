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
    "Tên người mua": "buyerUsername", "Tài khoản người mua": "buyerUsername", "Buyer Name": "buyerUsername", "Username": "buyerUsername",
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
                    const rowKeys = Object.keys(row);

                    // Normalize row keys for comparison
                    const normalizedRowKeys = rowKeys.map(k => ({
                        original: k,
                        normalized: k.trim().toLowerCase().normalize("NFC")
                    }));

                    // We use a set of target keys we've already filled to avoid overwriting good data with empty data
                    const filledKeys = new Set<string>();

                    Object.keys(COLUMN_MAPPING).forEach(colName => {
                        const targetKey = COLUMN_MAPPING[colName];
                        const normalizedColName = colName.trim().toLowerCase().normalize("NFC");

                        // Priority 1: Exact Match (Case-insensitive & Normalized)
                        let match = normalizedRowKeys.find(rk => rk.normalized === normalizedColName);

                        // Priority 2: Special cases & startsWith (only if not found or if the current value is empty)
                        if (!match) {
                            match = normalizedRowKeys.find(rk => {
                                const fileHeader = rk.normalized;
                                const mapHeader = normalizedColName;

                                // Strict protection for "Người Mua" to avoid "Nhận xét từ Người mua"
                                if (mapHeader === "người mua" || mapHeader === "nguoi mua") {
                                    return (fileHeader === "người mua" ||
                                        fileHeader === "nguoi mua" ||
                                        fileHeader === "tên người mua" ||
                                        fileHeader === "username (buyer)" ||
                                        fileHeader === "tài khoản người mua" ||
                                        fileHeader === "username" ||
                                        fileHeader === "tài khoản");
                                }

                                // General exclusion for "Nhận xét" when matching other headers unless explicitly expected
                                if (fileHeader.includes("nhận xét") && !mapHeader.includes("nhận xét")) {
                                    return false;
                                }

                                return fileHeader === mapHeader || fileHeader.startsWith(mapHeader);
                            });
                        }

                        if (match) {
                            let value = row[match.original];

                            // If value is a string, trim it
                            if (typeof value === 'string') value = value.trim();

                            // Don't overwrite an existing non-empty value with an empty one
                            // This fixes the bug where "Username (Buyer)" (empty) overwrites "Người mua" (filled)
                            const isExistingEmpty = !order[targetKey] || order[targetKey] === "" || order[targetKey] === 0;
                            const isNewEmpty = !value || value === "" || value === 0;

                            if (isExistingEmpty || !isNewEmpty) {
                                // Cleaning and type conversion
                                if (typeof value === 'string') {
                                    // Numeric fields conversion
                                    if ([
                                        'originalPrice', 'dealPrice', 'quantity', 'buyerPaid', 'orderTotalAmount',
                                        'fixedFee', 'serviceFee', 'paymentFee', 'shippingFee', 'buyerShippingFee',
                                        'shopeeShippingRebate', 'returnShippingFee', 'sellerRebate', 'shopeeRebate',
                                        'productWeight', 'totalWeight', 'returnQuantity', 'sellerSubsidy', 'dealPriceTotal',
                                        'shopVoucher', 'coinCashback', 'shopeeVoucher', 'shopeeComboDiscount',
                                        'shopComboDiscount', 'shopeeCoinsRedeemed', 'cardPromotionDiscount',
                                        'tradeInDiscount', 'tradeInBonus', 'tradeInBonusBySeller', 'codAmount',
                                        'affiliateCommission'
                                    ].includes(targetKey)) {
                                        let cleanValue = value.trim();
                                        if (cleanValue.includes('.') && cleanValue.includes(',')) {
                                            if (cleanValue.indexOf('.') < cleanValue.indexOf(',')) {
                                                cleanValue = cleanValue.replace(/\./g, "").replace(",", ".");
                                            } else {
                                                cleanValue = cleanValue.replace(/,/g, "");
                                            }
                                        } else if (cleanValue.includes(',')) {
                                            if (cleanValue.split(',')[1]?.length === 2) {
                                                cleanValue = cleanValue.replace(/\./g, "").replace(",", ".");
                                            } else {
                                                cleanValue = cleanValue.replace(/,/g, "");
                                            }
                                        } else if (cleanValue.includes('.')) {
                                            const parts = cleanValue.split('.');
                                            if (parts.length > 2 || parts[parts.length - 1].length !== 2) {
                                                cleanValue = cleanValue.replace(/\./g, "");
                                            }
                                        }
                                        value = parseFloat(cleanValue) || 0;
                                    }
                                } else if ([
                                    'originalPrice', 'dealPrice', 'quantity', 'buyerPaid', 'orderTotalAmount',
                                    'fixedFee', 'serviceFee', 'paymentFee', 'shippingFee', 'buyerShippingFee',
                                    'shopeeShippingRebate', 'returnShippingFee', 'sellerRebate', 'shopeeRebate',
                                    'productWeight', 'totalWeight', 'returnQuantity', 'sellerSubsidy', 'dealPriceTotal',
                                    'shopVoucher', 'coinCashback', 'shopeeVoucher', 'shopeeComboDiscount',
                                    'shopComboDiscount', 'shopeeCoinsRedeemed', 'cardPromotionDiscount',
                                    'tradeInDiscount', 'tradeInBonus', 'tradeInBonusBySeller', 'codAmount',
                                    'affiliateCommission'
                                ].includes(targetKey)) {
                                    value = Number(value) || 0;
                                }

                                order[targetKey] = value;
                            }
                        }
                    });

                    return order as ShopeeOrder;
                });

                resolve({ data: orders, headers });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);

        reader.readAsBinaryString(file);
    });
};
