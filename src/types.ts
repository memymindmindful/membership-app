/**
 * Me.My.Mind Membership App - Core Data Types
 */

export type AppLanguage = 'th' | 'en';

export type EmployeeRole = 'admin' | 'manager' | 'staff' | 'accountant';

export interface Employee {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: EmployeeRole;
  avatarUrl?: string;
}

export interface BrandSettings {
  brandName: string;
  brandTagline: string;
  logoUrl: string;
}

export interface Client {
  id: string;
  memberCode: string; // e.g. "MMM-0001"
  lineUserId?: string;
  displayName: string;
  nickname: string;
  phone: string;
  birthday?: string;
  profilePic?: string;
  notes?: string;
  createdAt: string;
}

export interface CoinWallet {
  clientId: string;
  balance: number;
}

export type CoinTransactionType = 'credit_added' | 'credit_used' | 'credit_adjusted';

export interface CoinTransaction {
  id: string;
  clientId: string;
  amount: number; // positive for addition, negative for usage
  type: CoinTransactionType;
  note: string;
  resultingBalance: number;
  createdByStaffId: string;
  createdByStaffName: string;
  createdAt: string;
  isBonus?: boolean; // True if top-up was Bonus Coins (CRM Marketing expense)
  reversed?: boolean;
  reversalReason?: string;
  reversedAt?: string;
  reversedByStaffName?: string;
}

export type PointsTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface PointsWallet {
  clientId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: PointsTier;
}

export type PointsTransactionType = 'points_earned' | 'points_redeemed' | 'points_adjusted';

export interface PointsTransaction {
  id: string;
  clientId: string;
  amount: number;
  type: PointsTransactionType;
  note: string;
  resultingBalance: number;
  createdByStaffId: string;
  createdByStaffName: string;
  createdAt: string;
  reversed?: boolean;
  reversalReason?: string;
  reversedAt?: string;
  reversedByStaffName?: string;
}

export type CatalogType = 'package' | 'coupon' | 'onetime';

export interface CatalogItem {
  id: string;
  type: CatalogType;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  validityDays: number;
  defaultSessions?: number; // Only for packages
  active: boolean;
  createdAt: string;
}

export type ItemStatus = 'active' | 'expiring_soon' | 'used_up';
export type FollowUpStatus = 'not_contacted' | 'contacted' | 'resolved';

export interface ClientPackage {
  id: string;
  clientId: string;
  catalogId: string;
  name: string;
  description: string;
  imageUrl: string;
  totalSessions: number;
  remainingSessions: number;
  pricePaid: number;
  purchaseDate: string;
  expiryDate: string;
  status: ItemStatus;
  usedUpAt?: string;
  createdAt: string;
  usageLogs: PackageUsageLog[];
  followUpStatus?: FollowUpStatus;
  followUpNote?: string;
  followUpUpdatedAt?: string;
  followUpUpdatedByStaffName?: string;
}

export interface PackageUsageLog {
  id: string;
  clientPackageId: string;
  clientId: string;
  sessionNumber: number;
  usedAt: string;
  staffId: string;
  staffName: string;
  note?: string;
}

export interface ClientCoupon {
  id: string;
  clientId: string;
  catalogId: string;
  name: string;
  description: string;
  imageUrl: string;
  couponCode: string; // e.g. "SB-MMM0001-4821"
  totalQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  pricePaid: number;
  purchaseDate: string;
  expiryDate: string;
  status: ItemStatus;
  usedUpAt?: string;
  createdAt: string;
  redemptionLogs: CouponRedemptionLog[];
  followUpStatus?: FollowUpStatus;
  followUpNote?: string;
  followUpUpdatedAt?: string;
  followUpUpdatedByStaffName?: string;
}

export interface ExpiringItemTask {
  id: string;
  itemType: 'package' | 'coupon';
  catalogId: string;
  name: string;
  description: string;
  imageUrl: string;
  clientId: string;
  clientName: string;
  clientNickname: string;
  memberCode: string;
  clientPhone: string;
  clientProfilePic?: string;
  clientLineUserId?: string;
  expiryDate: string;
  daysRemaining: number;
  remainingDetails: string;
  followUpStatus: FollowUpStatus;
  followUpNote: string;
  followUpUpdatedAt?: string;
  followUpUpdatedByStaffName?: string;
}

export interface CouponRedemptionLog {
  id: string;
  clientCouponId: string;
  clientId: string;
  redemptionNumber: number;
  redeemedAt: string;
  staffId: string;
  staffName: string;
  note?: string;
}

export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  active: boolean;
  minTier?: PointsTier;
}

export interface InAppNotification {
  id: string;
  clientId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  reservedForLinePush?: boolean;
}

export interface AuditLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  entityType: 'client' | 'coin' | 'points' | 'package' | 'coupon' | 'catalog' | 'reward' | 'financial' | 'staff';
  entityId: string;
  previousData?: any;
  newData?: any;
  reason: string;
  timestamp: string;
}

export type FinancialEntryCategory =
  | 'coin_purchase'      // ซื้อ Cash Coin (เติมเงิน)
  | 'direct_service'     // ชำระเงินสด/โอนตรงหน้างาน (ได้สะสมคะแนน)
  | 'package_sale'       // ขายคอร์ส/แพ็กเกจ
  | 'coupon_sale'        // ขายคูปอง
  | 'online_course'      // ขายคอร์สออนไลน์
  | 'product_sale'       // ขายผลิตภัณฑ์หน้าสปา
  | 'other_income'       // รายรับอื่น ๆ
  | 'rent'               // ค่าเช่าสถานที่ / ร้าน
  | 'utilities'          // ค่าน้ำ ค่าไฟ ค่าอินเทอร์เน็ต
  | 'supplies'           // ค่าอุปกรณ์ / น้ำมันนวด / ผลิตภัณฑ์
  | 'salary'             // เงินเดือน / ค่าคอมมิชชัน พนักงาน
  | 'marketing'          // ค่าการตลาด / โฆษณา
  | 'other_expense';     // รายจ่ายอื่น ๆ

export type FinancialEntryType = 'income' | 'expense';

export interface FinancialEntry {
  id: string;
  type: FinancialEntryType;
  category: FinancialEntryCategory;
  categoryNameTh: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  clientId?: string;
  clientName?: string;
  sourceTxId?: string; // e.g. coinTx.id or pointsTx.id or packageId
  createdByStaffId: string;
  createdByStaffName: string;
  createdAt: string;
  isAutoGenerated?: boolean;
}

