export type PartnerTier = 'konsumen' | 'marketer' | 'reseller' | 'sub_agen' | 'agen' | 'distributor';

export type StoreTheme = 'emerald' | 'rose' | 'blue' | 'charcoal' | 'terracotta';

export interface TierInfo {
  id: PartnerTier;
  name: string;
  label: string;
  discountPct: number;
  commissionPct?: number;
  firstOrderNet?: number;
  firstOrderHet?: number;
  minOrderNominal: number;
  maintenanceMonthly?: number;
  maintenance3Months?: number;
  downgradeTier?: PartnerTier;
  minOrderPcs: number;
  badgeColor: string;
  description: string;
}

export interface Store {
  id?: string;
  slug: string;
  storeName: string;
  storeTagline: string;
  storeTheme: StoreTheme;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBannerUrl: string;
  storeLogoText: string;
  storeLogoUrl: string;
  storeWaNumber: string;
  storeCity: string;
  storeOwner: string;
  partnerTier: PartnerTier;
  recommenderDistributor?: string;
  recommenderWa?: string;
  recommenderSlug?: string;
  recommendationCode?: string;
  feePayer?: 'buyer' | 'store';
  storeAdminPin: string;
  orderQuota: number;
  walletBalance: number;
  totalTopupPaid: number;
  totalTx: number;
  verifiedSkNumber?: string;
  ownerEmail?: string;
  adminPassword?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingStore {
  id: string;
  slug: string;
  storeName: string;
  storeTagline?: string;
  storeTheme?: StoreTheme;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBannerUrl?: string;
  storeLogoText?: string;
  storeLogoUrl?: string;
  storeWaNumber: string;
  storeCity: string;
  storeOwner: string;
  partnerTier: PartnerTier;
  ownerEmail?: string;
  adminPassword?: string;
  storeAdminPin?: string;
  nikNumber?: string;
  ktpDocUrl?: string;
  ktpDocName?: string;
  skNumber?: string;
  skDocUrl?: string;
  skDocName?: string;
  selfieDocUrl?: string;
  selfieDocName?: string;
  recommenderDistributor?: string;
  recommenderWa?: string;
  recommenderSlug?: string;
  recommendationCode?: string;
  recommendationDocUrl?: string;
  recommendationDocName?: string;
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  bpom: string;
  halal: string;
  image: string;
  het: number;
  price?: number;
  weightGram: number;
  netto: string;
  stock: number;
  isBestseller?: boolean;
  rating?: number;
  soldCount?: number;
  summary: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customTierPrice?: number;
}

export interface ShippingProvider {
  id: string;
  name: string;
  costPerKg: number;
  estDays: string;
  minKg: number;
  type: 'courier' | 'cod' | 'pickup' | 'instant' | 'cargo';
}

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  het: number;
  weightGram?: number;
}

export interface Order {
  id?: string;
  orderId: string;
  storeSlug: string;
  orderDate?: string;
  partnerCode?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  tier: PartnerTier;
  tierLabel: string;
  items: OrderItemPayload[];
  subtotalHet: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  orderSource: string;
  marketerId?: string;
  courierName?: string;
  shippingCost?: number;
  platformFee?: number;
  dropship?: {
    isDropship: boolean;
    senderName: string;
    senderPhone: string;
  };
  createdAt?: string;
}

export interface MitraDownline {
  id?: string;
  storeSlug: string;
  partnerCode: string;
  name: string;
  phone: string;
  city: string;
  tier: PartnerTier;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  status: 'active' | 'inactive' | 'suspended';
  accumulatedSpent90Days: number;
  totalOrdersCount: number;
  qualificationDate?: string;
  lastOrderDate?: string;
}

export interface MarketerSale {
  id?: string;
  storeSlug: string;
  orderId: string;
  marketerId: string;
  orderDate: string;
  monthPeriod: string; // 'YYYY-MM'
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  fulfillmentType: 'pickup' | 'delivery';
  itemsDesc: string;
  omsetHet: number;
  commissionPct: number;
  commissionAmount: number;
  paidStatus: 'paid' | 'unpaid';
  paidDate?: string;
}

export interface CashflowEntry {
  id: string;
  storeSlug: string;
  date: string;
  type: 'in' | 'out';
  category: string;
  amount: number;
  description: string;
  operator: string;
}

export interface StockMutation {
  id: string;
  storeSlug: string;
  date: string;
  productId: string;
  productName: string;
  sku?: string;
  type: 'in' | 'out' | 'adjust';
  qty: number;
  beforeStock?: number;
  afterStock?: number;
  remainingStock?: number;
  notes?: string;
  reason?: string;
  operator: string;
}

export interface CashierOperator {
  id: string;
  name: string;
  pin: string;
  role: 'kasir' | 'spv' | 'gudang';
  phone?: string;
}

export interface CashierAttendanceLog {
  id: string;
  storeSlug: string;
  cashierId: string;
  cashierName: string;
  clockIn: string;
  clockOut?: string;
  shiftSalesCount: number;
  shiftOmsetTotal: number;
  shiftCashTotal: number;
  notes?: string;
}

export interface PosCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  subtotal: number;
}
