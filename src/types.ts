export type DispatchMode = 'whatsapp' | 'email' | 'both';

export type OrderStatus = 'pendiente' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

export type PaymentMethodType = 'pago_movil' | 'efectivo_usd' | 'efectivo_ves' | 'zelle' | 'transferencia' | 'binance' | 'zinli' | 'tarjeta_pasarela' | string;

export interface CustomPaymentMethod {
  id: string; // unique identifier (e.g. 'pago_movil', 'zelle', 'binance', 'zinli', 'tarjeta_pasarela')
  name: string; // Display title (e.g. "Pago Móvil (Bolívares)")
  iconName: 'smartphone' | 'dollar-sign' | 'zap' | 'credit-card' | 'building' | 'wallet' | 'qr-code';
  currency: 'VES' | 'USD' | 'AMBOS';
  enabled: boolean; // Active or inactive toggle
  badgeText?: string; // e.g. "Verificación Inmediata", "Popular"
  description: string; // Description shown during checkout
  bankOrPlatformName?: string; // e.g. "0108 - Banco Provincial"
  accountHolder?: string; // e.g. "Rosquetes Canarios C.A."
  accountNumberOrRif?: string; // RIF, Cédula or Account number
  phoneNumber?: string; // Phone number for Pago Móvil
  emailOrPayId?: string; // Email for Zelle/Zinli or Binance Pay ID
  instructions?: string; // Detailed instructions for the customer
  requiresReference: boolean; // If true, requires a transaction reference/receipt number
  supportsOnlineVerification: boolean; // Triggers online instant verification workflow
}

export interface Product {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  unitType: string; // e.g., "Docena (12 u.)", "Bolsa 250g", "Caja 24 u."
  image: string;
  stockElaborado: number; // Current finished product inventory
  category: 'tradicional' | 'mini' | 'regalo' | 'especial';
  featured?: boolean;
  isPublished?: boolean; // Controls public visibility in store catalog (true = Publicado, false = Despublicado/Oculto)
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string; // e.g., "Maracay", "Turmero", "Cagua", "La Victoria", "El Limón"
  feeUSD: number;
  estimatedTime: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  favoriteProduct?: string;
  totalOrders: number;
  totalSpentUSD: number;
  createdAt: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitType: string;
  quantity: number;
  unitPriceUSD: number;
  subtotalUSD: number;
}

export interface OrderPaymentDetails {
  bankOrigin?: string;
  payerName?: string;
  payerPhoneOrRif?: string;
  paymentTimestamp?: string;
  onlineGatewayTxId?: string;
  receiptNote?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #ROS-2026-001
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZone: string;
  deliveryCity: string;
  addressDetail: string;
  deliveryFeeUSD: number;
  items: OrderItem[];
  totalUSD: number;
  exchangeRateVES: number;
  totalVES: number;
  paymentMethod: PaymentMethodType;
  paymentReference?: string;
  paymentVerified: boolean;
  paidOnline?: boolean; // True if payment was processed/verified online
  paymentDetails?: OrderPaymentDetails;
  status: OrderStatus;
  dispatchMethodUsed: 'whatsapp' | 'email';
  notes?: string;
}

export interface PaymentNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amountUSD: number;
  amountVES: number;
  paymentMethodName: string;
  paymentReference?: string;
  timestamp: string;
  read: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'harina' | 'azucar' | 'especias' | 'liquidos' | 'empaque' | 'otros';
  stockAmount: number;
  unit: string; // e.g., "kg", "g", "litros", "unidades"
  minAlertThreshold: number;
  costPerUnitUSD: number;
  lastRestocked: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string; // e.g. LOTE-20260812-01
  date: string;
  productId: string;
  productName: string;
  unitsProduced: number; // e.g., 20 docenas
  costTotalUSD: number;
  notes?: string;
}

export interface RecipeRequirement {
  ingredientId: string;
  amountPerUnit: number; // amount needed per 1 product unit (e.g. per 1 docena)
}

export interface ProductRecipe {
  productId: string;
  requirements: RecipeRequirement[];
}

export interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface AdminSettings {
  dispatchMode: DispatchMode;
  whatsappNumber: string; // e.g., "584125558822"
  whatsappMessageTemplate: string;
  emailRecipient: string; // e.g., "pedidos.rosquetes@gmail.com"
  exchangeRateVES: number; // Tasa USD -> VES
  autoSyncBCVRate?: boolean; // Sincronización automática de tasa oficial BCV (bcv.org.ve)
  lastBCVSyncDate?: string; // Fecha de última sincronización con bcv.org.ve
  storeName: string;
  storeTagline: string;
  storeBadge?: string; // e.g. "Don Rosquetico"
  storeLogoType?: 'emoji' | 'image';
  storeLogoValue?: string; // e.g. "🍩" or "https://..." or "/src/assets/..."
  storeAddress: string;
  pagoMovilBank: string;
  pagoMovilRif: string;
  pagoMovilPhone: string;
  pagoMovilOwner: string;
  zelleEmail?: string;
  zelleOwner?: string;
  isAutoFallbackEnabled: boolean;
  onlinePaymentsEnabled: boolean; // Global toggle to enable/disable online payment system
  autoVerifyOnlinePayments: boolean; // Toggle to auto-verify online payments upon receipt submission
  paymentMethods: CustomPaymentMethod[]; // Configurable list of custom payment methods
  deliveryZones: DeliveryZone[];
  featureCards?: FeatureCard[]; // Cards in footer grid (e.g. Ingredientes, Horneado, Despacho)
  // Admin Credentials
  adminUsername?: string; // Default: 'admin'
  adminPassword?: string; // Default: 'admin2026'
  // Hero Image & Featured Star Product
  heroImageUrl?: string; // Main image URL for Hero section
  heroBadgeText?: string; // e.g., "Presentación Estrella"
  heroStarTitle?: string; // e.g., "Docena Tradicional Glaseada"
  heroStarPriceUSD?: number; // e.g., 4.50
}

export interface MonthlySalesData {
  month: string; // "Ene", "Feb", "Mar", etc.
  year: number;
  totalRevenueUSD: number;
  totalRevenueVES: number;
  totalOrdersCount: number;
  docenasSold: number;
  topSellingProduct: string;
  topZone: string;
}

export interface AIProductionAdvice {
  summary: string;
  projectedDemandDozen: number;
  recommendedBatches: {
    productName: string;
    quantityToMake: number;
    priority: 'Alta' | 'Media' | 'Baja';
    reason: string;
  }[];
  ingredientReorderAlerts: {
    ingredientName: string;
    currentStock: string;
    neededStock: string;
    shortage: string;
    estimatedCostUSD: number;
  }[];
  profitOptimizationTips: string[];
}
