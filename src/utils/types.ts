export interface ShopeeOrder {
  orderId: string;
  trackingNumber: string;
  orderDate: string;
  orderStatus: string;
  cancelReason?: string;
  returnStatus?: string;
  returnReason?: string;
  skuReferenceNo: string;
  productName: string;
  variationName?: string;
  quantity: number;
  originalPrice: number;
  dealPrice: number;
  sellerRebate?: number;
  shopeeRebate?: number;
  buyerPaid: number;
  orderTotalAmount: number;
  fixedFee: number;
  serviceFee: number;
  paymentFee: number;
  shippingFee: number;
  buyerShippingFee?: number;
  returnShippingFee?: number;
  shopeeShippingRebate?: number;
  affiliateCommission?: number;
  returnQuantity?: number;
  buyerUsername?: string;
  receiverName?: string;
  phoneNumber?: string;
  province?: string;
  district?: string;
  ward?: string;
  deliveryCarrier?: string;
  paymentMethod?: string;
  shipTime?: string;
  completeDate?: string;
  updateTime?: string;
  payoutDate?: string;
  warehouseName?: string;
  packageId?: string;
  shopVoucher?: number;
  shopeeComboDiscount?: number;
  shopComboDiscount?: number;
  tradeInBonusBySeller?: number;
}

export interface RevenueTrend {
  date: string;
  gmv: number;               // 1. GMV
  shopSubsidies: number;    // 2. Trợ giá Shop
  platformFees: number;     // 3. Phí sàn
  draftNet: number;         // 4. DT Thuần Phát Sinh
  returnValue: number;      // 5. Giá trị hàng hoàn
  returnFees: number;       // 6. Phí hoàn hàng
  returnImpact: number;     // 7. Tác động hoàn hàng
  actualNet: number;        // 8. DT Thuần Thực Tế
  orders: number;           // 9. Đơn phát sinh
  aov: number;              // 10. AOV
  feeRate: number;          // 11. Tỷ lệ phí sàn
  subsidyRate: number;      // 12. Tỷ lệ trợ giá Shop
  marginPreCogs: number;    // 13. Biên LN trước giá vốn

  // Aliases for Dashboard Chart Compatibility
  netRevenueAfterTax?: number; // actualNet
  grossRevenue?: number;       // draftNet
  promoCost?: number;          // shopSubsidies
  successfulOrders?: number;   // orders
}

export interface ProductPerformance {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
  fees: number;
  cogs: number;
  netProfit: number;
  margin: number;
  contribution: number;
  returnQuantity: number;
  returnRate: number;
  badges: string[];
}

export interface SkuEconomics {
  sku: string;
  name: string;
  quantity: number;
  listPrice: number;
  proceeds: number;   // GMV
  netRevenue: number; // Draft Net
  netRevenueAfterTax: number; // Actual Net (estimated per SKU)
  cogs: number;
  fees: number;
  subsidy: number;
  profit: number;
  margin: number;
  returnRate: number;
  skuType: 'Gift' | 'Traffic' | 'Standard';
  badge: string;
}

export interface OrderEconomics {
  orderId: string;
  orderDate: string;
  totalListPrice: number;
  proceeds: number;
  netRevenueAfterTax: number;
  discountPct: number;
  totalCogs: number;
  totalFees: number;
  totalSubsidy: number;
  profit: number;
  margin: number;
  guardrailBreached: boolean;
  lineCount?: number;
}

export interface ParetoItem {
  sku: string;
  name: string;
  revenue: number;
  profit: number;
  cumulativeRevenue: number;
  revenuePercentage: number;
  cumulativePercentage: number;
  cumProfitPct: number;
  isCore80: boolean;
  isTop20: boolean;
}

export interface ProductEconomicsResult {
  skuEconomics: SkuEconomics[];
  orderEconomics: OrderEconomics[];
  portfolio: {
    avgMargin: number;
    totalRevenue: number;
    totalProfit: number;
    guardrailBreachImpact: number;
    totalMargin: number;
    guardrailBreachRate: number;
    potentialProfitGain: number;
    top20ProfitShare: number;
    lossSKURatio: number;
    pareto: ParetoItem[];
  };
}

export interface ProductRiskProfile {
  sku: string;
  name: string;
  revenue: number;
  profit: number;
  margin: number;
  volume: number;
  feeRate: number;
  subsidyRate: number;
  returnRate: number;
  rootCause: string;
  solution: string;
}

export interface CustomerAnalysis {
  id: string;
  buyerUsername: string;
  name: string;
  phoneNumber: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  history: {
    date: string;
    orderId: string;
    value: number;
    products?: {
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
  avgShipTime: number;
}

export interface DailyShippingMetric {
  date: string;
  avgShipTime: number;
}

export interface OrderRiskAnalysis {
  orderId: string;
  trackingNumber: string;
  orderDate: string;
  revenue: number;
  controlRatio: number;
  netProfit: number;
  warningLevel: 'SAFE' | 'MONITOR' | 'WARNING' | 'DANGER';
  isLoss: boolean;
  rootCause: string;
  rootCauseValue: number;
  cogs: number;
  platformFee: number;
  shopPromotion: number;
  structuralMargin: number;
  returnImpactValue: number;
  lostGrossRevenue: number;
  nonRefundableFee: number;
  riskImpactScore?: number;
  absoluteLossFlag?: boolean;
}

export interface FeeAlertOrder {
  orderId: string;
  gmv: number;
  totalFees: number;
  feeRatio: number;
  reason: string;
  solution: string;
}

export interface MetricResult {
  // 13 Core KPIs
  totalGMV: number;
  totalShopSubsidies: number;
  totalPlatformFees: number;
  totalDraftNet: number;
  totalReturnValue: number;
  totalReturnFees: number;
  totalReturnImpact: number;
  totalActualNet: number;
  totalOrders: number;
  avgOrderValue: number;
  platformFeeRate: number;
  shopSubsidyRate: number;
  marginPreCogs: number;

  // Strategic CFO Indicators
  adExpenseX: number;
  adCostRate: number;
  marginBeforeAds: number;
  finalNetMargin: number;

  // New Shopee Master Sections
  completedOrders: number;
  canceledOrders: number;
  returnedOrdersCount: number;
  avgProcessingTime: number; // Order to Ship
  slowDeliveryCount: number;

  loyaltyStats: {
    newCustomers: number;
    returningCustomers: number;
    repeatRate: number;
  };

  feeAlerts: FeeAlertOrder[];

  carrierPerformance: {
    carrier: string;
    successRate: number;
    avgDeliveryTime: number;
    returnCount: number;
  }[];

  returnByProvince: {
    province: string;
    count: number;
    value: number;
  }[];

  revenueTrend: RevenueTrend[];
  productPerformance: ProductPerformance[];
  statusAnalysis: { status: string, count: number, revenue: number, percentage: number }[];
  locationAnalysis: { province: string, revenue: number, orders: number, profit: number, contribution: number }[];

  dailyFinancials: RevenueTrend[];
  successfulOrders: number;
  totalListRevenue: number;
  totalGrossRevenue: number;
  netRevenueAfterTax: number;
  totalSurcharges: number;
  totalVoucher: number;
  netMargin: number;

  riskAnalysis: OrderRiskAnalysis[];
  riskStats: {
    totalOrders: number;
    highRiskCount: number;
    lossCount: number;
    avgControlRatio: number;
    totalLossAmount: number;
    totalListRevenue: number;
    totalSellerRebate: number;
    totalShopVoucher: number;
    totalReturnShippingFee: number;
    totalPlatformFees: number;
    totalReturnImpactValue: number;
    totalReturnImpactRate: number;
  };
  returnedOrders: any[];
  profitPerOrder?: number;
  daysWithNegativeProfit?: number;

  customerAnalysis: CustomerAnalysis[];
  operationAnalysis: OperationAnalysis[];
  dailyShippingMetrics: DailyShippingMetric[];
  cancelAnalysis: { reason: string; count: number }[];
  returnByCarrier: { reason: string; count: number; value: number }[];

  // Aliases for page compatibility
  totalRevenue: number;
  totalFees: number;
  feeAnalysis: { type: string; value: number }[];
  subsidyAnalysis: { type: string; value: number }[];
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
