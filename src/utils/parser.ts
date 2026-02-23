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
export const parseReportAutoDetect = async (file: File): Promise<{ data: ShopeeOrder[], headers: string[], detectedPlatform: Platform }> => {
    const fileName = file.name.toLowerCase();
    if (fileName.includes('thuocsi')) {
        const res = await parseThuocsiReport(file);
        return { ...res, detectedPlatform: 'thuocsi' as Platform };
    }
    const res = await parseShopeeReport(file);
    return { ...res, detectedPlatform: 'shopee' as Platform };
};

export const parseThuocsiReport = async (file: File): Promise<{ data: ShopeeOrder[], headers: string[] }> => {
    // Advanced parser for Thuocsi format (2 sheets)
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Thuocsi typically has 'Thông tin đơn hàng' and 'Sản phẩm đã đặt'
                const sheetNames = workbook.SheetNames;

                // Fallback to first sheet if names don't match exactly
                const orderSheetName = sheetNames.find(n => n.includes('Thông tin đơn hàng')) || sheetNames[0];
                const productSheetName = sheetNames.find(n => n.includes('Sản phẩm đã đặt')) || sheetNames[1] || sheetNames[0];

                const orderSheet = workbook.Sheets[orderSheetName];
                const productSheet = workbook.Sheets[productSheetName];

                const orderAray = XLSX.utils.sheet_to_json(orderSheet) as any[];
                const productArray = XLSX.utils.sheet_to_json(productSheet) as any[];

                // Map Order info by ID for fast lookup
                const orderInfoMap: Record<string, any> = {};
                orderAray.forEach(row => {
                    const id = String(row['ID đơn hàng'] || row['Mã đơn hàng'] || row['Order ID'] || row['SO'] || '');
                    if (id) {
                        orderInfoMap[id] = row;
                    }
                });

                const orders: ShopeeOrder[] = [];

                // Loop through Products (lines) and enrich with Order Info
                productArray.forEach(row => {
                    const id = String(row['ID đơn hàng'] || row['Mã đơn hàng'] || row['Order ID'] || '');
                    const orderInfo = orderInfoMap[id] || {};

                    // Parse Numbers carefully
                    const qty = Number(row['SL đặt'] || row['Số lượng'] || 0);
                    const dealPrice = Number(row['Giá bán sau KM'] || row['Giá bán'] || row['Giá ưu đãi'] || 0);
                    const originalPrice = Number(row['Giá listing'] || row['Giá niêm yết'] || row['Giá gốc'] || dealPrice);

                    const buyerPaidText = String(orderInfo['Tổng tiền'] || orderInfo['Tổng giá trị đơn hàng (VND)'] || '0').replace(/[,.]/g, '');
                    const buyerPaid = parseFloat(buyerPaidText) || 0;

                    orders.push({
                        orderId: id,
                        productName: String(row['Sản phẩm'] || row['Tên sản phẩm'] || ''),
                        quantity: qty,
                        originalPrice: originalPrice,
                        dealPrice: dealPrice,
                        productSku: String(row['SKU'] || row['Mã sản phẩm'] || row['ID sản phẩm'] || ''),

                        // Order details inherited from Sheet 1
                        orderDate: String(orderInfo['Ngày đặt hàng'] || orderInfo['Ngày tạo'] || ''),
                        shipTime: String(orderInfo['Ngày giao'] || orderInfo['Ngày gửi hàng'] || ''),
                        completeDate: String(orderInfo['Ngày hoàn tất'] || orderInfo['Thời gian hoàn thành đơn hàng'] || ''),
                        orderStatus: String(orderInfo['Trạng thái đơn hàng'] || 'Hoàn thành'),
                        returnStatus: String(orderInfo['Trạng thái trả hàng'] || orderInfo['Trạng thái Trả hàng/Hoàn tiền'] || ''),

                        buyerUsername: String(orderInfo['Tên khách hàng'] || orderInfo['ID Khách hàng'] || orderInfo['Người Mua'] || ''),
                        province: String(orderInfo['Tỉnh/Thành phố'] || ''),
                        district: String(orderInfo['Quận/Huyện'] || ''),
                        ward: String(orderInfo['Phường/Xã'] || ''),

                        buyerPaid: buyerPaid,
                        orderTotalAmount: buyerPaid,

                        // Subsidies / Vouchers mapping
                        shopVoucher: Number(orderInfo['Giá trị voucher'] || 0),
                        returnQuantity: Number(row['SL trả'] || 0),

                        // Fake tracking for display
                        trackingNumber: id ? `TS-${id}` : '',
                        deliveryCarrier: 'Thuocsi Logistics',
                        warehouseName: String(orderInfo['Trạng thái đối soát'] || '')
                    } as ShopeeOrder);
                });

                // If for some reason product sheet is empty or we couldn't parse products, fallback to order sheet
                if (orders.length === 0 && orderAray.length > 0) {
                    orderAray.forEach(row => {
                        const id = String(row['ID đơn hàng'] || row['Mã đơn hàng'] || row['SO'] || '');
                        orders.push({
                            orderId: id,
                            productName: 'Sản phẩm Thuocsi',
                            quantity: Number(row['Số lượng mặt hàng'] || row['Số lượng sản phẩm'] || 1),
                            originalPrice: Number(String(row['Tổng tiền'] || '0').replace(/[,.]/g, '')),
                            dealPrice: Number(String(row['Tổng tiền'] || '0').replace(/[,.]/g, '')),
                            orderDate: String(row['Ngày đặt hàng'] || ''),
                            orderStatus: String(row['Trạng thái đơn hàng'] || 'Hoàn thành'),
                            buyerUsername: String(row['Tên khách hàng'] || '')
                        } as ShopeeOrder);
                    });
                }

                resolve({ data: orders, headers: Object.keys(orderAray[0] || {}) });
            } catch (err) { reject(err); }
        };
        reader.readAsBinaryString(file);
    });
};

import { Platform } from './types';
