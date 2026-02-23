export interface ShopeeOrder {
  orderId: string; // M├ú ─æ╞ín h├áng
  trackingNumber: string; // M├ú vß║¡n ─æ╞ín
  orderDate: string; // Ng├áy ─æß║╖t h├áng
  orderStatus: string; // Trß║íng Th├íi ─É╞ín H├áng
  cancelReason?: string; // L├╜ do hß╗ºy
  returnStatus?: string; // Trß║íng th├íi Trß║ú h├áng/Ho├án tiß╗ün

  skuReferenceNo: string; // SKU ph├ón loß║íi h├áng (Use this for variation SKU)
  productName: string; // T├¬n sß║ún phß║⌐m
  variationName?: string; // T├¬n ph├ón loß║íi h├áng
  quantity: number; // Sß╗æ l╞░ß╗úng
  productWeight?: number; // C├ón n─â╠úng sa╠ën ph├ó╠ëm
  totalWeight?: number; // T├┤╠ëng c├ón n─â╠úng

  originalPrice: number; // Gi├í gß╗æc
  dealPrice: number; // Gia╠ü ╞░u ─æa╠âi
  sellerRebate?: number; // Tß╗òng sß╗æ tiß╗ün ─æ╞░ß╗úc ng╞░ß╗¥i b├ín trß╗ú gi├í
  shopeeRebate?: number; // ─É╞░╞í╠úc Shopee tr╞í╠ú gia╠ü

  buyerPaid: number; // Tß╗òng sß╗æ tiß╗ün ng╞░ß╗¥i mua thanh to├ín
  orderTotalAmount: number; // Tß╗òng gi├í trß╗ï ─æ╞ín h├áng (VND)

  // Fees
  fixedFee: number; // Ph├¡ cß╗æ ─æß╗ïnh
  serviceFee: number; // Ph├¡ Dß╗ïch Vß╗Ñ
  paymentFee: number; // Ph├¡ thanh to├ín
  shippingFee: number; // Phi╠ü v├ó╠ún chuy├¬╠ën (d╞░╠ú ki├¬╠ün) ? or paid by buyer?
  buyerShippingFee?: number; // Phi╠ü v├ó╠ún chuy├¬╠ën ma╠Ç ng╞░╞í╠Çi mua tra╠ë
  returnShippingFee?: number; // Ph├¡ vß║¡n chuyß╗ân trß║ú h├áng
  shopeeShippingRebate?: number; // Ph├¡ vß║¡n chuyß╗ân t├ái trß╗ú bß╗ƒi Shopee (dß╗▒ kiß║┐n)
  affiliateCommission?: number; // Ph├¡ hoa hß╗ông Tiß║┐p thß╗ï li├¬n kß║┐t


  // Return
  returnQuantity?: number; // Sß╗æ l╞░ß╗úng sß║ún phß║⌐m ─æ╞░ß╗úc ho├án trß║ú

  // Info
  buyerUsername?: string; // T├¬n t├ái khoß║ún ng╞░ß╗¥i mua (Ng╞░ß╗¥i Mua)
  receiverName?: string; // T├¬n Ng╞░ß╗¥i nhß║¡n
  phoneNumber?: string; // Sß╗æ ─æiß╗çn thoß║íi
  province?: string; // Tß╗ënh/Th├ánh phß╗æ
  district?: string; // Quß║¡n
  ward?: string; // TP / Quß║¡n / Huyß╗çn (Actually Ward/Commune often in "Quß║¡n" or "─Éß╗ïa chß╗ë"?) -> "TP / Quß║¡n / Huyß╗çn" in file
  deliveryCarrier?: string; // ─É╞ín Vß╗ï Vß║¡n Chuyß╗ân
  paymentMethod?: string; // Ph╞░╞íng thß╗⌐c thanh to├ín

  // Dates
  payoutDate?: string; // Thß╗¥i gian ─æ╞ín h├áng ─æ╞░ß╗úc thanh to├ín
  completeDate?: string; // Thß╗¥i gian ho├án th├ánh ─æ╞ín h├áng
  shipTime?: string; // Thß╗¥i gian giao h├áng
  // Location
  warehouseName?: string; // T├¬n kho h├áng

  // Detailed Report Fields
  packageId?: string; // M├ú Kiß╗çn H├áng
  bestSellingProduct?: string; // Sß║ún Phß║⌐m B├ín Chß║íy
  buyerRemarks?: string; // Nhß║¡n x├⌐t tß╗½ Ng╞░ß╗¥i mua
  deliveryMethod?: string; // Ph╞░╞íng thß╗⌐c giao h├áng
  orderType?: string; // Loß║íi ─æ╞ín h├áng
  expectedDeliveryDate?: string; // Ng├áy giao h├áng dß╗▒ kiß║┐n
  shipDate?: string; // Nga╠Çy g╞░╠ëi ha╠Çng
  productSku?: string; // SKU sß║ún phß║⌐m
  sellerSubsidy?: number; // Ng╞░ß╗¥i b├ín trß╗ú gi├í
  dealPriceTotal?: number; // Tß╗òng gi├í b├ín (sß║ún phß║⌐m)
  shopVoucher?: number; // M├ú giß║úm gi├í cß╗ºa Shop
  coinCashback?: number; // Ho├án Xu
  shopeeVoucher?: number; // M├ú giß║úm gi├í cß╗ºa Shopee
  comboIndicator?: string; // Chß╗ë ti├¬u Combo Khuyß║┐n M├úi
  shopeeComboDiscount?: number; // Giß║úm gi├í tß╗½ combo Shopee
  shopComboDiscount?: number; // Giß║úm gi├í tß╗½ Combo cß╗ºa Shop
  shopeeCoinsRedeemed?: number; // Shopee Xu ─æ╞░╞í╠úc hoa╠Çn
  cardPromotionDiscount?: number; // S├┤╠ü ti├¬╠Çn ─æ╞░╞í╠úc gia╠ëm khi thanh toa╠ün b─â╠Çng the╠ë Ghi n╞í╠ú
  tradeInDiscount?: number; // Trade-in Discount
  tradeInBonus?: number; // Trade-in Bonus
  tradeInBonusBySeller?: number; // Trade-in Bonus by Seller
  codAmount?: number; // Tiß╗ün k├╜ quß╗╣ Ng╞░ß╗¥i Mua
  country?: string; // Quß╗æc gia
  remarks?: string; // Ghi ch├║
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
  id: string; // buyerUsername
  name: string; // receiverName
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
  orderCount: number;
}

export interface StatusAnalysis {
  status: string;
  revenue: number;
  count: number;
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
  highRiskOrderPercent: number; // % ─æ╞ín v╞░ß╗út 50% ph├¡
  avgControlRatio: number; // Average Control Ratio theo ng├áy
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
  analysis: string; // "Nguy├¬n nh├ón"
  solutionShort: string; // "Giß║úi ph├íp ngß║»n hß║ín"
  solutionLong: string; // "Giß║úi ph├íp d├ái hß║ín"
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
    listRevenue: number;   // Doanh thu ni├¬m yß║┐t
    netRevenue: number;    // Sau KM Shop
    payoutAmount: number;  // Sau Ph├¡ s├án (Thß╗▒c nhß║¡n)
    totalCOGS: number;
    items: {
      sku: string;
      name: string;
      quantity: number;
      price: number;       // Gi├í b├ín (sau KM ph├ón bß╗ò nß║┐u c├│, hoß║╖c gi├í gß╗æc t├╣y logic hiß╗ân thß╗ï) -> Let's use Original Price for "Ni├¬m yß║┐t"
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
  shopPromotion: number; // Shop Voucher/Rebate
  platformFee: number; // Sum(Fixed + Service + Payment + Affiliate)
  controlCost: number; // Shop Promo + Platform Fee
  controlRatio: number; // Control Cost / Revenue
  netProfit: number; // Revenue - COGS - Control Cost
  grossMarginBeforePromo: number; // Revenue - COGS - Platform Fee
  structuralMargin: number; // Same as above conceptually
  promotionBurnRate: number;
  breakEvenPrice: number;
  absoluteLossFlag: boolean;
  riskImpactScore: number;

  // 2. Classification
  warningLevel: 'SAFE' | 'MONITOR' | 'WARNING' | 'DANGER';
  isLoss: boolean;

  // 3. Root Cause
  rootCause: 'A' | 'B' | 'C' | 'D' | 'E' | 'N/A';
  rootCauseValue: number; // The % driving the cause (e.g. Fee %, Promo %)
}

export interface MetricResult {
  totalOrders: number;

  // 1. Doanh thu 1 (Gi├í ni├¬m yß║┐t sau ho├án)
  totalListRevenue: number;

  // 2. Doanh thu 2 (Gi├í ╞░u ─æ├úi sau trß╗ú gi├í)
  totalNetRevenue: number;

  // New: CTKM (Doanh thu 1 - Doanh thu 2)
  totalDiscount: number;
  totalVoucher: number; // Added from instruction

  // 3. Tß╗òng phß╗Ñ ph├¡ (Cß╗æ ─æß╗ïnh + Dß╗ïch vß╗Ñ + Thanh to├ín)
  totalSurcharges: number;

  // 4. Doanh thu 3 (Doanh thu ─æ╞ín h├áng ╞░ß╗¢c t├¡nh)
  totalGrossRevenue: number; // Net Proceeds
  totalCOGS: number;
  totalGrossProfit: number;
  netMargin: number;
  avgOrderValue: number;
  profitPerOrder: number;
  orderReturnRate: number;
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
  };

  // Optional/Legacy
  operationAnalysis?: OperationAnalysis[];
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

export interface ReportFile {
  id: string;
  name: string;
  uploadDate: string;
  isActive: boolean;
  orders: ShopeeOrder[];
  orderCount?: number;
}

export interface Database {
  reports: ReportFile[];
}
