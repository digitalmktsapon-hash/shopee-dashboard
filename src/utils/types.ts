export interface ShopeeOrder {
  orderId: string; // Mã đơn hàng
  trackingNumber: string; // Mã vận đơn
  orderDate: string; // Ngày đặt hàng
  orderStatus: string; // Trạng Thái Đơn Hàng
  cancelReason?: string; // Lý do hủy
  returnStatus?: string; // Trạng thái Trả hàng/Hoàn tiền

  skuReferenceNo: string; // SKU phân loại hàng (Use this for variation SKU)
  productName: string; // Tên sản phẩm
  variationName?: string; // Tên phân loại hàng
  quantity: number; // Số lượng
  productWeight?: number; // Cân nặng sản phẩm
  totalWeight?: number; // Tổng cân nặng

  originalPrice: number; // Giá gốc
  dealPrice: number; // Giá ưu đãi
  sellerRebate?: number; // Tổng số tiền được người bán trợ giá
  shopeeRebate?: number; // Được Shopee trợ giá

  buyerPaid: number; // Tổng số tiền người mua thanh toán
  orderTotalAmount: number; // Tổng giá trị đơn hàng (VND)

  // Fees
  fixedFee: number; // Phí cố định
  serviceFee: number; // Phí Dịch Vụ
  paymentFee: number; // Phí thanh toán
  shippingFee: number; // Phí vận chuyển (dự kiến) ? or paid by buyer?
  buyerShippingFee?: number; // Phí vận chuyển mà người mua trả
  returnShippingFee?: number; // Phí vận chuyển trả hàng
  shopeeShippingRebate?: number; // Phí vận chuyển tài trợ bởi Shopee (dự kiến)
  affiliateCommission?: number; // Phí hoa hồng Tiếp thị liên kết


  // Return
  returnQuantity?: number; // Số lượng sản phẩm được hoàn trả

  // Info
  buyerUsername?: string; // Tên tài khoản người mua (Người Mua)
  receiverName?: string; // Tên Người nhận
  phoneNumber?: string; // Số điện thoại
  province?: string; // Tỉnh/Thành phố
  district?: string; // Quận
  ward?: string; // TP / Quận / Huyện (Actually Ward/Commune often in "Quận" or "Địa chỉ"?) -> "TP / Quận / Huyện" in file
  deliveryCarrier?: string; // Đơn Vị Vận Chuyển
  paymentMethod?: string; // Phương thức thanh toán

  // Dates
  payoutDate?: string; // Thời gian đơn hàng được thanh toán
  completeDate?: string; // Thời gian hoàn thành đơn hàng
  shipTime?: string; // Thời gian giao hàng
  // Location
  warehouseName?: string; // Tên kho hàng

  // Detailed Report Fields
  packageId?: string; // Mã Kiện Hàng
  bestSellingProduct?: string; // Sản Phẩm Bán Chạy
  buyerRemarks?: string; // Nhận xét từ Người mua
  deliveryMethod?: string; // Phương thức giao hàng
  orderType?: string; // Loại đơn hàng
  expectedDeliveryDate?: string; // Ngày giao hàng dự kiến
  shipDate?: string; // Ngày gửi hàng
  productSku?: string; // SKU sản phẩm
  sellerSubsidy?: number; // Người bán trợ giá
  dealPriceTotal?: number; // Tổng giá bán (sản phẩm)
  shopVoucher?: number; // Mã giảm giá của Shop
  coinCashback?: number; // Hoàn Xu
  shopeeVoucher?: number; // Mã giảm giá của Shopee
  comboIndicator?: string; // Chỉ tiêu Combo Khuyến Mãi
  shopeeComboDiscount?: number; // Giảm giá từ combo Shopee
  shopComboDiscount?: number; // Giảm giá từ Combo của Shop
  shopeeCoinsRedeemed?: number; // Shopee Xu được hoàn
  cardPromotionDiscount?: number; // Số tiền được giảm khi thanh toán bằng thẻ Ghi nợ
  tradeInDiscount?: number; // Trade-in Discount
  tradeInBonus?: number; // Trade-in Bonus
  tradeInBonusBySeller?: number; // Trade-in Bonus by Seller
  codAmount?: number; // Tiền ký quỹ Người Mua
  country?: string; // Quốc gia
  remarks?: string; // Ghi chú
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  netRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  orders: number;
}

export interface ProductPerformance {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number; // Profit before fees/ads
  netProfit: number; // Final profit after all deductions
  fees: number;
  returnCosts: number;
  margin: number; // Gross Margin %
  returnQuantity: number;
  returnRate: number;
  contribution: number; // % contribution to total net revenue
  badges: string[]; // 'Hero', 'Risk', 'Traffic Driver', 'Kill List'
  relatedOrders?: {
    orderId: string;
    date: string;
    quantity: number;
    netRevenue: number;
    fees: number;
    subsidies: number;
    cogs: number;
    profit: number;
  }[];
}

export type SkuType = 'Core' | 'Combo Component' | 'Gift' | 'Traffic';
export type SkuBadge = '🔴 Kill List' | '🟠 Risk' | '🟢 Hero' | '🔵 Traffic Driver' | 'OK';

export interface SkuEconomics {
  sku: string;
  name: string;
  skuType: SkuType;
  quantity: number;
  listPrice: number;        // originalPrice (giá niêm yết)
  allocatedRevenue: number; // Revenue after combo attribution
  cogs: number;             // 40% × listPrice × quantity
  fees: number;
  subsidy: number;
  profit: number;           // allocatedRevenue - cogs - fees + subsidy
  contributionMargin: number; // profit (extensible for ads cost deduction)
  margin: number;           // profit / allocatedRevenue (%)
  returnRate: number;       // %
  badge: SkuBadge;
}

export interface OrderEconomics {
  orderId: string;
  orderDate: string;
  lineCount: number;
  totalListPrice: number;    // Sum of originalPrice × qty
  totalActualPrice: number;  // Sum of dealPrice × qty (or buyerPaid)
  discountPct: number;       // (listPrice - actualPrice) / listPrice × 100
  guardrailBreached: boolean;// discountPct > 40%
  totalCogs: number;         // 40% × totalListPrice
  totalFees: number;
  totalSubsidy: number;
  orderProfit: number;       // actualPrice - cogs - fees + subsidy
  orderMargin: number;       // orderProfit / actualPrice (%)
}

export interface ParetoItem {
  sku: string;
  name: string;
  profit: number;
  cumProfitPct: number; // cumulative % of total profit
  isTop20: boolean;
}

export interface PortfolioSummary {
  totalRevenue: number;
  totalProfit: number;
  totalMargin: number;
  guardrailBreachRate: number;      // % of orders breaching 60% rule
  guardrailBreachImpact: number;    // Actual profit of breached orders
  potentialProfitGain: number;      // Additional profit if guardrail enforced (60% floor)
  top20ProfitShare: number;         // % of profit from top 20% SKUs
  lossSKURatio: number;             // % of SKUs with negative profit
  pareto: ParetoItem[];
}


export interface CancelAnalysis {
  reason: string;
  count: number;
}

export interface ReturnAnalysis {
  reason: string;
  count: number;
  value: number;
}

export interface FeeAnalysis {
  type: string;
  value: number;
}

export interface SubsidyAnalysis {
  type: string;
  value: number;
}

export interface CustomerAnalysis {
  id: string; // Unique identifier for mapping
  buyerUsername: string; // Tên tài khoản người đặt
  name: string; // receiverName - Tên người nhận
  phoneNumber: string;
  address: string; // Combined address
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  history: {
    date: string;
    orderId: string;
    value: number;
    products: {
      name: string;
      variation?: string;
      quantity: number;
      price: number;
      originalPrice: number;
    }[];
  }[];
}

export interface OperationAnalysis {
  carrier: string;
  orderCount: number;
  avgShipTime: number; // Days (if computable)
}

export interface LocationAnalysis {
  province: string;
  revenue: number;
  profit: number;
  contribution: number;
  orderCount: number;
}

export interface StatusAnalysis {
  status: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface DailyFinancialMetric {
  date: string;
  revenue1: number; // Gross Listing (No Cancel)
  revenue2: number; // Net Selling (Realized)
  fees: number;     // Realized
  cogs: number;     // Realized
  profit: number;   // Realized
  margin: number;   // Realized
  successfulOrders: number; // Realized
  returnRate: number;
  subsidies: number; // Realized (Seller + Shopee Rebate)
  highRiskOrderPercent: number; // % đơn vượt 50% phí
  avgControlRatio: number; // Average Control Ratio theo ngày
  promotionBurnRate: number; // Shop Promotion / Gross Profit Before Promotion
}

export interface RiskAlert {
  type: 'SKU' | 'DAY';
  id: string; // SKU or Date
  name?: string; // Product Name for SKU
  alertType: 'LOW_MARGIN' | 'HIGH_RETURN' | 'NEGATIVE_PROFIT' | 'HIGH_FEE' | 'HIGH_SUBSIDY';
  value: number; // The logic value (e.g. 5% margin)
  threshold: number; // The threshold (e.g. 10%)
  revenue?: number; // Context
  profit?: number; // Context
  analysis: string; // "Nguyên nhân"
  solutionShort: string; // "Giải pháp ngắn hạn"
  solutionLong: string; // "Giải pháp dài hạn"
}

export interface ProductRiskProfile {
  sku: string;
  name: string;

  // 1-5 Core Financials
  revenue: number; // Net Revenue
  profit: number; // Net Profit
  margin: number; // %
  marginBeforeSubsidy: number; // % (Profit + Subsidies) / Revenue
  volume: number; // Quantity

  // 6-9 Structure Breakdown
  cogsRate: number; // %
  feeRate: number; // %
  subsidyRate: number; // %
  returnRate: number; // %

  // 10-14 Advanced Analytics
  contribution: number; // % of Shop Profit
  breakEvenPrice: number; // Est. Price for 0 profit
  breakEvenVoucher: number; // Max Subsidy % for 0 profit
  priorityScore: number; // Scoring for sorting
  structuralMargin?: number; // Structural Margin %
  promotionBurnRate?: number; // % Promotion Burn

  // Root Cause & Solution
  rootCause: 'A' | 'B' | 'C' | 'D' | 'E'; // A: Voucher, B: Fee, C: Fixed Fee, D: Structural Loss
  rootCauseValue: number;
  solution: string;
  relatedOrders?: {
    orderId: string;
    date: string;
    quantity: number;
    netRevenue: number;
    fees: number;
    subsidies: number;
    cogs: number;
    profit: number;
  }[];
  orderDetail?: {
    trackingNumber?: string;
    listRevenue: number;   // Doanh thu niêm yết
    netRevenue: number;    // Sau KM Shop
    payoutAmount: number;  // Sau Phí sàn (Thực nhận)
    totalCOGS: number;
    items: {
      sku: string;
      name: string;
      quantity: number;
      price: number;       // Giá bán (sau KM phân bổ nếu có, hoặc giá gốc tùy logic hiển thị) -> Let's use Original Price for "Niêm yết"
      cogs: number;
    }[];
    sellerVoucherAmount: number;
    shopeeVoucherAmount: number;
    feeAmount: number;
    // Granular Fees
    fixedFee?: number;
    serviceFee?: number;
    paymentFee?: number;
    affiliateCommission?: number;
  };
}

export interface OrderRiskAnalysis {
  orderId: string;
  trackingNumber: string;
  orderDate: string;

  // 1. Calculated Metrics
  revenue: number; // Sum(Original Price * Qty)
  cogs: number; // 40% * Revenue
  shopPromotion: number; // Người bán trợ giá (sellerRebate - giảm giá sản phẩm từ CTKM)
  shopVoucher: number;   // Mã giảm giá của Shop (do shop tạo)
  returnShippingFee: number; // Phí vận chuyển trả hàng
  platformFee: number;   // Phí cố định + Phí DV + Phí thanh toán (không gồm VC trả hàng)
  listRevenue: number;   // Giá gốc × số lượng (mẫu số của control ratio)
  controlCost: number; // Shop Promo + Platform Fee
  controlRatio: number; // Control Cost / Revenue
  netProfit: number; // Revenue - COGS - Control Cost
  grossMarginBeforePromo: number; // Revenue - COGS - Platform Fee
  structuralMargin: number; // Same as above conceptually
  promotionBurnRate: number;
  breakEvenPrice: number;
  absoluteLossFlag: boolean;
  riskImpactScore: number;

  warningLevel: 'SAFE' | 'MONITOR' | 'WARNING' | 'DANGER';
  isLoss: boolean;

  // 3. Return Impact Layer
  returnImpactValue: number;
  returnImpactRate: number;
  lostGrossRevenue: number;
  nonRefundableFee: number;

  // 4. Root Cause
  rootCause: 'A' | 'B' | 'C' | 'D' | 'E' | 'N/A';
  rootCauseValue: number; // The % driving the cause (e.g. Fee %, Promo %)
}

export interface MetricResult {
  totalOrders: number;

  // 1. Doanh thu 1 (Giá niêm yết sau hoàn)
  totalListRevenue: number;

  // 2. Doanh thu 2 (Giá ưu đãi sau trợ giá)
  totalNetRevenue: number;

  // New: CTKM (Doanh thu 1 - Doanh thu 2)
  totalDiscount: number;
  totalVoucher: number; // Added from instruction

  // 3. Tổng phụ phí (Cố định + Dịch vụ + Thanh toán)
  totalSurcharges: number;

  // 4. Doanh thu 3 (Doanh thu đơn hàng ước tính)
  totalGrossRevenue: number; // Net Proceeds
  totalCOGS: number;
  totalGrossProfit: number;
  netMargin: number;
  avgOrderValue: number;
  profitPerOrder: number;
  orderReturnRate: number;
  cancelRate: number; // Added
  daysWithNegativeProfit: number;

  // Legacy / Compatibility fields
  totalRevenue: number;
  netRevenue: number;
  totalNetProfit: number;
  grossMargin: number;

  totalFloorFees: number;
  totalSubsidies: number;

  totalProductQty: number;
  totalReturnQty: number;
  successfulOrders: number;
  returnOrderCount: number;
  returnRate: number;

  revenueTrend: RevenueTrend[]; // Now containing daily realized
  dailyFinancials: DailyFinancialMetric[];

  productPerformance: ProductPerformance[];
  topProducts: ProductPerformance[]; // Top 10-15
  riskProfile: ProductRiskProfile[]; // New Risk Center

  locationAnalysis: LocationAnalysis[];
  statusAnalysis: StatusAnalysis[];
  customerAnalysis: CustomerAnalysis[];

  // Legacy or Empty
  cancelAnalysis: any[];
  returnAnalysis: any[];
  returnByCarrier?: any[];
  feeAnalysis: any[];
  totalFees?: number;
  subsidyAnalysis: any[];

  // New: Order Risk Control Center
  riskAnalysis: OrderRiskAnalysis[];
  riskStats: {
    totalOrders: number;
    highRiskCount: number; // > 50% Control Ratio
    lossCount: number; // Net Profit < 0
    avgControlRatio: number;
    totalLossAmount: number;
    totalShopVoucher: number;
    totalReturnShippingFee: number;
    totalListRevenue: number;
    totalSellerRebate: number;
    totalPlatformFees: number;
    totalReturnImpactValue: number;
    totalReturnImpactRate: number;
  };

  // Optional/Legacy
  operationAnalysis?: OperationAnalysis[];
  dailyShippingMetrics?: { date: string; avgShipTime: number; orderCount: number; }[];
  realizedPerformance?: {
    totalOrders: number;
    cancelledOrders: number;
    successfulOrders: number;
    returnRate: number;
    aov: number;
    feePerOrder: number;
    cogsPerOrder: number;
  };

  profitPerSoldUnit?: number; // legacy
  riskAlerts?: any[]; // legacy
}

export type Platform = 'shopee' | 'shopee_north' | 'shopee_south' | 'tiki' | 'lazada' | 'tiktok' | 'thuocsi' | 'other';

export interface ReportFile {
  id: string;
  name: string;
  uploadDate: string;
  isActive: boolean;
  orders: ShopeeOrder[];
  orderCount?: number;
  platform?: Platform;
  shopName?: string;
}

export interface Database {
  reports: ReportFile[];
}
