/**
 * Server Store and Data Persistence for Me.My.Mind Membership App
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import {
  AuditLog,
  CatalogItem,
  Client,
  ClientCoupon,
  ClientPackage,
  ClientOneTimeBooking,
  CoinTransaction,
  Employee,
  InAppNotification,
  PointsTransaction,
  PointsWallet,
  RewardCatalogItem,
  ItemStatus,
  FollowUpStatus,
  ExpiringItemTask,
  FinancialEntry,
  BAHT_PER_POINT,
  PointsSourceType
} from '../src/types';
import { getTierFromPoints } from '../src/lib/translations';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const SQLITE_FILE = path.join(DATA_DIR, 'membership.db');
const SCHEMA_FILE = path.join(process.cwd(), 'server', 'schema.sql');

function rowToEmployee(row: any): Employee {
  return {
    id: row.id,
    username: row.username,
    password: row.password || '',
    displayName: row.display_name,
    role: row.role as any,
    avatarUrl: row.avatar_url || undefined,
  };
}

function rowToClient(row: any): Client {
  return {
    id: row.id,
    memberCode: row.member_code,
    lineUserId: row.line_user_id || undefined,
    displayName: row.display_name,
    nickname: row.nickname || undefined,
    phone: row.phone || undefined,
    birthday: row.birthday || undefined,
    profilePic: row.profile_pic || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    consentAccepted: Boolean(row.consent_accepted),
    consentAcceptedAt: row.consent_accepted_at || undefined,
  };
}

function rowToCoinTransaction(row: any): CoinTransaction {
  return {
    id: row.id,
    clientId: row.client_id,
    amount: Number(row.amount),
    type: row.type as any,
    note: row.note || '',
    resultingBalance: Number(row.resulting_balance),
    createdByStaffId: row.created_by_staff_id,
    createdByStaffName: row.created_by_staff_name,
    createdAt: row.created_at,
    isBonus: Boolean(row.is_bonus),
    reversed: Boolean(row.reversed),
    reversalReason: row.reversal_reason || undefined,
    reversedAt: row.reversed_at || undefined,
    reversedByStaffName: row.reversed_by_staff_name || undefined,
  };
}

function rowToPointsWallet(row: any): PointsWallet {
  return {
    clientId: row.client_id,
    balance: Number(row.balance),
    lifetimeEarned: Number(row.lifetime_earned),
    lifetimeRedeemed: Number(row.lifetime_redeemed),
    tier: (row.tier || 'Bronze') as any,
  };
}

function rowToPointsTransaction(row: any): PointsTransaction {
  return {
    id: row.id,
    clientId: row.client_id,
    amount: Number(row.amount),
    type: row.type as any,
    note: row.note || '',
    sourceType: (row.source_type as any) || undefined,
    relatedCoinTxId: row.related_coin_tx_id || undefined,
    relatedPackageId: row.related_package_id || undefined,
    relatedCouponId: row.related_coupon_id || undefined,
    relatedOneTimeBookingId: row.related_onetime_booking_id || undefined,
    resultingBalance: Number(row.resulting_balance),
    createdByStaffId: row.created_by_staff_id,
    createdByStaffName: row.created_by_staff_name,
    createdAt: row.created_at,
    reversed: Boolean(row.reversed),
    reversalReason: row.reversal_reason || undefined,
    reversedAt: row.reversed_at || undefined,
    reversedByStaffName: row.reversed_by_staff_name || undefined,
  };
}

function rowToCatalogItem(row: any): CatalogItem {
  let keywords: string[] | undefined = undefined;
  if (row.keywords) {
    try {
      keywords = JSON.parse(row.keywords);
    } catch {
      keywords = [];
    }
  }
  return {
    id: row.id,
    type: row.type as any,
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url || '',
    price: Number(row.price),
    validityDays: Number(row.validity_days),
    defaultSessions: row.default_sessions !== null && row.default_sessions !== undefined ? Number(row.default_sessions) : undefined,
    category: row.category || undefined,
    keywords,
    active: Boolean(row.active),
    createdAt: row.created_at,
    isCrmMarketingVoucher: Boolean(row.is_crm_marketing_voucher),
  };
}

function rowToRewardCatalogItem(row: any): RewardCatalogItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    pointsCost: Number(row.points_cost),
    imageUrl: row.image_url || '',
    active: Boolean(row.active),
    minTier: (row.min_tier as any) || undefined,
  };
}

function rowToClientPackage(row: any): ClientPackage {
  let usageLogs: any[] = [];
  if (row.usage_logs) {
    try {
      usageLogs = JSON.parse(row.usage_logs);
    } catch {
      usageLogs = [];
    }
  }
  return {
    id: row.id,
    clientId: row.client_id,
    catalogId: row.catalog_id,
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url || '',
    totalSessions: Number(row.total_sessions),
    remainingSessions: Number(row.remaining_sessions),
    pricePaid: Number(row.price_paid),
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    status: row.status as ItemStatus,
    usedUpAt: row.used_up_at || undefined,
    createdAt: row.created_at,
    usageLogs,
    followUpStatus: row.follow_up_status || undefined,
    followUpNote: row.follow_up_note || undefined,
    followUpUpdatedAt: row.follow_up_updated_at || undefined,
    followUpUpdatedByStaffName: row.follow_up_updated_by_staff_name || undefined,
    voidedAt: row.voided_at || undefined,
    voidedBy: row.voided_by || undefined,
    voidReason: row.void_reason || undefined,
  };
}

function rowToClientCoupon(row: any): ClientCoupon {
  let redemptionLogs: any[] = [];
  if (row.redemption_logs) {
    try {
      redemptionLogs = JSON.parse(row.redemption_logs);
    } catch {
      redemptionLogs = [];
    }
  }
  return {
    id: row.id,
    clientId: row.client_id,
    catalogId: row.catalog_id,
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url || '',
    couponCode: row.coupon_code,
    totalQuantity: Number(row.total_quantity),
    usedQuantity: Number(row.used_quantity),
    remainingQuantity: Number(row.remaining_quantity),
    pricePaid: Number(row.price_paid),
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    status: row.status as ItemStatus,
    usedUpAt: row.used_up_at || undefined,
    createdAt: row.created_at,
    redemptionLogs,
    followUpStatus: row.follow_up_status || undefined,
    followUpNote: row.follow_up_note || undefined,
    followUpUpdatedAt: row.follow_up_updated_at || undefined,
    followUpUpdatedByStaffName: row.follow_up_updated_by_staff_name || undefined,
    isCrmMarketingVoucher: Boolean(row.is_crm_marketing_voucher),
    voidedAt: row.voided_at || undefined,
    voidedBy: row.voided_by || undefined,
    voidReason: row.void_reason || undefined,
  };
}

function rowToClientOneTimeBooking(row: any): ClientOneTimeBooking {
  return {
    id: row.id,
    clientId: row.client_id,
    catalogId: row.catalog_id,
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url || '',
    fullPrice: Number(row.full_price),
    depositAmount: Number(row.deposit_amount || 0),
    paymentStatusAtBooking: row.payment_status_at_booking as any,
    linkedPackageId: row.linked_package_id || undefined,
    linkedCouponId: row.linked_coupon_id || undefined,
    coinAmountUsed: Number(row.coin_amount_used || 0),
    remainingAmountPaid: Number(row.remaining_amount_paid || 0),
    bookingDateTime: row.booking_date_time,
    endDateTime: row.end_date_time || undefined,
    branch: row.branch,
    status: row.status as any,
    usedAt: row.used_at || undefined,
    voidedAt: row.voided_at || undefined,
    voidedBy: row.voided_by || undefined,
    voidReason: row.void_reason || undefined,
    createdAt: row.created_at,
    createdByStaffId: row.created_by_staff_id,
    createdByStaffName: row.created_by_staff_name,
  };
}

function rowToNotification(row: any): InAppNotification {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    read: Boolean(row.read),
    reservedForLinePush: Boolean(row.reserved_for_line_push),
  };
}

function rowToAuditLog(row: any): AuditLog {
  let previousData: any = undefined;
  if (row.previous_data) {
    try {
      previousData = JSON.parse(row.previous_data);
    } catch {
      previousData = row.previous_data;
    }
  }
  let newData: any = undefined;
  if (row.new_data) {
    try {
      newData = JSON.parse(row.new_data);
    } catch {
      newData = row.new_data;
    }
  }
  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    action: row.action,
    entityType: row.entity_type as any,
    entityId: row.entity_id,
    previousData,
    newData,
    reason: row.reason || '',
    timestamp: row.timestamp,
  };
}

function rowToFinancialEntry(row: any): FinancialEntry {
  return {
    id: row.id,
    type: row.type as any,
    category: row.category as any,
    categoryNameTh: row.category_name_th,
    title: row.title,
    amount: Number(row.amount),
    date: row.date,
    note: row.note || undefined,
    clientId: row.client_id || undefined,
    clientName: row.client_name || undefined,
    sourceTxId: row.source_tx_id || undefined,
    createdByStaffId: row.created_by_staff_id,
    createdByStaffName: row.created_by_staff_name,
    createdAt: row.created_at,
    isAutoGenerated: Boolean(row.is_auto_generated),
  };
}

interface DatabaseSchema {}

function getInitialNotifications(): InAppNotification[] {
  const now = new Date().toISOString();
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'NOTIF-001',
      clientId: 'CLI-0001',
      title: 'พนักงานยืนยันการเติม Coin',
      message: 'พนักงานได้ทำการเติม 5,000 Me.My.Mind Coins เข้าบัญชีของคุณเรียบร้อยแล้ว',
      createdAt: pastDate,
      read: true,
      reservedForLinePush: false,
    },
    {
      id: 'NOTIF-002',
      clientId: 'CLI-0001',
      title: 'ใช้บริการแพ็กเกจเรียบร้อย',
      message: 'พนักงานได้ตัดใช้บริการ 1 ครั้ง จากแพ็กเกจ Glow & Lift Facial Package ของคุณ',
      createdAt: pastDate,
      read: false,
      reservedForLinePush: true,
    },
    {
      id: 'NOTIF-003',
      clientId: 'CLI-0002',
      title: 'คูปองใกล้หมดอายุ',
      message: 'คูปอง "Complimentary Organic Herbal Compress" ของคุณจะหมดอายุภายใน 4 วัน',
      createdAt: now,
      read: false,
      reservedForLinePush: true,
    },
  ];
}

function getInitialAuditLogs(): AuditLog[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'AUDIT-001',
      staffId: 'EMP-02',
      staffName: 'Khun May (Manager)',
      action: 'ADD_CREDIT',
      entityType: 'coin',
      entityId: 'CLI-0001',
      newData: { amount: 5000, note: 'พนักงานบันทึกการรับชำระเงินสดที่สตูดิโอ' },
      reason: 'บันทึกการรับชำระเงินสดหน้าร้าน',
      timestamp: pastDate,
    },
    {
      id: 'AUDIT-002',
      staffId: 'EMP-02',
      staffName: 'Khun May (Manager)',
      action: 'SELL_PACKAGE',
      entityType: 'package',
      entityId: 'CPKG-001',
      newData: { packageName: 'Glow & Lift Facial Package', client: 'CLI-0001', sessions: 10, price: 12000 },
      reason: 'ลูกค้าชำระเงินซื้อแพ็กเกจที่สตูดิโอ',
      timestamp: pastDate,
    },
  ];
}

function getInitialFinancialEntries(): FinancialEntry[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'FIN-001',
      type: 'income',
      category: 'online_course',
      categoryNameTh: 'คอร์สเรียนออนไลน์',
      title: 'ขายคอร์สออนไลน์ นวดหน้าปรับโครงสร้างด้วยตัวเอง',
      amount: 3500,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'นักเรียนสมัครผ่านเว็บไซต์ 1 ท่าน',
      createdByStaffId: 'EMP-01',
      createdByStaffName: 'Khun Nat (Admin)',
      createdAt: pastDate,
      isAutoGenerated: false,
    },
    {
      id: 'FIN-002',
      type: 'expense',
      category: 'rent',
      categoryNameTh: 'ค่าเช่าสถานที่ / ร้าน',
      title: 'ค่าเช่าพื้นที่สตูดิโอ ประจำเดือน',
      amount: 15000,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'ชำระค่าเช่าสถานที่ประจำเดือน',
      createdByStaffId: 'EMP-01',
      createdByStaffName: 'Khun Nat (Admin)',
      createdAt: pastDate,
      isAutoGenerated: false,
    },
    {
      id: 'FIN-003',
      type: 'expense',
      category: 'supplies',
      categoryNameTh: 'ค่าอุปกรณ์ / ผลิตภัณฑ์',
      title: 'สั่งซื้อน้ำมันหอมระเหยและมาร์คหน้าออร์แกนิค',
      amount: 4200,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: 'สั่งซื้อสต็อกน้ำมันนวดล็อตใหม่',
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: pastDate,
      isAutoGenerated: false,
    },
  ];
}

function getInitialEmployees(): Employee[] {
  return [
    {
      id: 'EMP-01',
      username: 'admin',
      password: 'admin123',
      displayName: 'Khun Nat (Admin)',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'EMP-02',
      username: 'manager',
      password: 'manager123',
      displayName: 'Khun May (Manager)',
      role: 'manager',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'EMP-03',
      username: 'staff',
      password: 'staff123',
      displayName: 'Khun Joy (Therapist Staff)',
      role: 'staff',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'EMP-04',
      username: 'accountant',
      password: 'account123',
      displayName: 'Khun Pim (Accountant)',
      role: 'accountant',
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
    },
  ];
}

function getInitialClients(): Client[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'CLI-0001',
      memberCode: 'MMM-0001',
      lineUserId: 'U1001_SOMCHAI',
      displayName: 'Khun Somchai Prasert',
      nickname: 'Somchai',
      phone: '081-234-5678',
      birthday: '1988-05-15',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      notes: 'Prefers medium pressure during facial massage',
      createdAt: pastDate,
      consentAccepted: false,
    },
    {
      id: 'CLI-0002',
      memberCode: 'MMM-0002',
      lineUserId: 'U1002_ANANYA',
      displayName: 'Khun Ananya Sukhumvit',
      nickname: 'Ann',
      phone: '089-876-5432',
      birthday: '1993-11-20',
      profilePic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      notes: 'Allergic to peppermint essential oil',
      createdAt: pastDate,
      consentAccepted: false,
    },
    {
      id: 'CLI-0003',
      memberCode: 'MMM-0003',
      lineUserId: 'U1003_PATCHARA',
      displayName: 'Khun Patchara Wong',
      nickname: 'Pat',
      phone: '092-111-2233',
      birthday: '1995-02-10',
      profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      notes: '',
      createdAt: new Date().toISOString(),
      consentAccepted: false,
    },
  ];
}

function getInitialCatalogItems(): CatalogItem[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'CAT-PKG-01',
      type: 'package',
      name: 'Glow & Lift Facial Package',
      description: 'Deep cleansing, organic guasha facial massage, & collagen boost mask',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      price: 12000,
      validityDays: 180,
      defaultSessions: 10,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-PKG-02',
      type: 'package',
      name: 'Aroma Relaxation Massage (60 Min)',
      description: 'Custom organic essential oil massage relieving neck, shoulder, and back tension',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      price: 4500,
      validityDays: 90,
      defaultSessions: 5,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-PKG-03',
      type: 'package',
      name: 'Singing Bowl Sound Bath Pass',
      description: 'Immersive sound vibration therapy session for deep mental rest',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      price: 2700,
      validityDays: 60,
      defaultSessions: 3,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-CPN-01',
      type: 'coupon',
      name: '500B Off Sound Bath Special Privilege',
      description: '500 Baht discount voucher applicable for Sound Bath group or private sessions',
      imageUrl: 'https://images.unsplash.com/photo-1512290900673-3f149ff93ff2?auto=format&fit=crop&w=800&q=80',
      price: 0,
      validityDays: 30,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-CPN-02',
      type: 'coupon',
      name: 'Complimentary Organic Herbal Compress',
      description: 'Free warm herbal compress treatment add-on for any body massage session',
      imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
      price: 0,
      validityDays: 45,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-ONE-01',
      type: 'onetime',
      name: 'นวดหน้าออร์แกนิค กัวซา (รายครั้ง)',
      description: 'บริการนวดหน้ารายครั้ง 60 นาที ล้างหน้า กัวซา มาร์คหน้าออร์แกนิค',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      price: 1500,
      validityDays: 1,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-ONE-02',
      type: 'onetime',
      name: 'นวดอโรม่าผ่อนคลาย (รายครั้ง)',
      description: 'บริการนวดอโรม่ารายครั้ง 60 นาที ผ่อนคลายกล้ามเนื้อคอ บ่า ไหล่',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      price: 1200,
      validityDays: 1,
      active: true,
      createdAt: pastDate,
    },
    {
      id: 'CAT-ONE-03',
      type: 'onetime',
      name: 'สปามือและเท้าออร์แกนิค (รายครั้ง)',
      description: 'สครับและบำรุงผิวมือเท้าด้วยสารสกัดธรรมชาติ 45 นาที',
      imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
      price: 800,
      validityDays: 1,
      active: true,
      createdAt: pastDate,
    },
  ];
}

function getInitialRewardCatalogItems(): RewardCatalogItem[] {
  return [
    {
      id: 'RWD-01',
      name: 'Me.My.Mind Organic Lip Balm',
      description: 'Pure beeswax & coconut oil nourishing lip treatment',
      pointsCost: 150,
      imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
      active: true,
    },
    {
      id: 'RWD-02',
      name: 'Aroma Essential Oil Roll-On (10ml)',
      description: 'Blended therapeutic oils: Calm Lavender or Refreshing Eucalyptus',
      pointsCost: 300,
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      active: true,
    },
    {
      id: 'RWD-03',
      name: '30-Min Herbal Scalp Massage',
      description: 'Warm oil Indian head & shoulder stress release massage',
      pointsCost: 600,
      imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
      active: true,
    },
    {
      id: 'RWD-04',
      name: '1x Free Sound Bath Group Pass',
      description: 'Complimentary entry to weekend Singing Bowl Sound Bath',
      pointsCost: 1000,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      active: true,
    },
  ];
}

// Initial Seed Data
function getInitialClientPackages(): ClientPackage[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nearExpiryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days from now
  const farExpiryDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'CPKG-001',
      clientId: 'CLI-0001',
      catalogId: 'CAT-PKG-01',
      name: 'Glow & Lift Facial Package',
      description: 'Deep cleansing, organic guasha facial massage, & collagen boost mask',
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      totalSessions: 10,
      remainingSessions: 8,
      pricePaid: 12000,
      purchaseDate: pastDate,
      expiryDate: farExpiryDate,
      status: 'active',
      createdAt: pastDate,
      usageLogs: [
        {
          id: 'LOG-PKG-001-1',
          clientPackageId: 'CPKG-001',
          clientId: 'CLI-0001',
          sessionNumber: 1,
          usedAt: pastDate,
          staffId: 'EMP-02',
          staffName: 'Khun May (Manager)',
          note: 'First facial treatment completed',
        },
        {
          id: 'LOG-PKG-001-2',
          clientPackageId: 'CPKG-001',
          clientId: 'CLI-0001',
          sessionNumber: 2,
          usedAt: pastDate,
          staffId: 'EMP-03',
          staffName: 'Khun Joy (Therapist)',
          note: 'Guasha massage session 2',
        },
      ],
    },
    {
      id: 'CPKG-002',
      clientId: 'CLI-0001',
      catalogId: 'CAT-PKG-02',
      name: 'Aroma Relaxation Massage (60 Min)',
      description: 'Custom organic essential oil massage',
      imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      totalSessions: 5,
      remainingSessions: 0,
      pricePaid: 4500,
      purchaseDate: pastDate,
      expiryDate: pastDate,
      status: 'used_up',
      usedUpAt: pastDate,
      createdAt: pastDate,
      usageLogs: Array.from({ length: 5 }).map((_, i) => ({
        id: `LOG-PKG-002-${i + 1}`,
        clientPackageId: 'CPKG-002',
        clientId: 'CLI-0001',
        sessionNumber: i + 1,
        usedAt: pastDate,
        staffId: 'EMP-02',
        staffName: 'Khun May (Manager)',
        note: `Completed session ${i + 1}`,
      })),
    },
    {
      id: 'CPKG-003',
      clientId: 'CLI-0002',
      catalogId: 'CAT-PKG-03',
      name: 'Singing Bowl Sound Bath Pass',
      description: 'Immersive sound vibration therapy session',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      totalSessions: 3,
      remainingSessions: 1,
      pricePaid: 2700,
      purchaseDate: pastDate,
      expiryDate: nearExpiryDate, // expiring soon!
      status: 'expiring_soon',
      createdAt: pastDate,
      usageLogs: [
        {
          id: 'LOG-PKG-003-1',
          clientPackageId: 'CPKG-003',
          clientId: 'CLI-0002',
          sessionNumber: 1,
          usedAt: pastDate,
          staffId: 'EMP-02',
          staffName: 'Khun May (Manager)',
        },
        {
          id: 'LOG-PKG-003-2',
          clientPackageId: 'CPKG-003',
          clientId: 'CLI-0002',
          sessionNumber: 2,
          usedAt: pastDate,
          staffId: 'EMP-03',
          staffName: 'Khun Joy (Therapist)',
        },
      ],
    },
  ];
}

function getInitialClientCoupons(): ClientCoupon[] {
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nearExpiryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days from now
  const farExpiryDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'CCPN-001',
      clientId: 'CLI-0001',
      catalogId: 'CAT-CPN-01',
      name: '500B Off Sound Bath Special Privilege',
      description: '500 Baht discount voucher applicable for Sound Bath session',
      imageUrl: 'https://images.unsplash.com/photo-1512290900673-3f149ff93ff2?auto=format&fit=crop&w=800&q=80',
      couponCode: 'SB-MMM0001-4821',
      totalQuantity: 2,
      usedQuantity: 1,
      remainingQuantity: 1,
      pricePaid: 0,
      purchaseDate: pastDate,
      expiryDate: farExpiryDate,
      status: 'active',
      createdAt: pastDate,
      redemptionLogs: [
        {
          id: 'LOG-CPN-001-1',
          clientCouponId: 'CCPN-001',
          clientId: 'CLI-0001',
          redemptionNumber: 1,
          redeemedAt: pastDate,
          staffId: 'EMP-02',
          staffName: 'Khun May (Manager)',
          note: 'Redeemed for Saturday Sound Bath class',
        },
      ],
    },
    {
      id: 'CCPN-002',
      clientId: 'CLI-0002',
      catalogId: 'CAT-CPN-02',
      name: 'Complimentary Organic Herbal Compress',
      description: 'Free warm herbal compress add-on',
      imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80',
      couponCode: 'HC-MMM0002-9102',
      totalQuantity: 1,
      usedQuantity: 0,
      remainingQuantity: 1,
      pricePaid: 0,
      purchaseDate: pastDate,
      expiryDate: nearExpiryDate, // expiring in 4 days!
      status: 'expiring_soon',
      createdAt: pastDate,
      redemptionLogs: [],
    },
  ];
}

function getInitialData(): DatabaseSchema {
  return {};
}

class Store {
  private db: DatabaseSchema;
  private sqlite: Database.Database;
  private saveDiskTimer: NodeJS.Timeout | null = null;
  private pendingSaveData: DatabaseSchema | null = null;

  constructor() {
    this.sqlite = this.initSqlite();
    this.db = this.loadFromDisk();
    this.refreshItemStatuses();
  }

  private initSqlite(): Database.Database {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const db = new Database(SQLITE_FILE);
    db.pragma('journal_mode = DELETE');
    db.pragma('mmap_size = 0');
    db.pragma('foreign_keys = ON');

    if (fs.existsSync(SCHEMA_FILE)) {
      const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      db.exec(schemaSql);
    }

    // Ensure initial employees exist if table is empty
    const empCount = db.prepare('SELECT count(*) as count FROM employees').get() as { count: number };
    if (!empCount || empCount.count === 0) {
      const initialEmps = getInitialEmployees();
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO employees (id, username, password, display_name, role, avatar_url)
        VALUES (@id, @username, @password, @displayName, @role, @avatarUrl)
      `);
      for (const emp of initialEmps) {
        insertStmt.run({
          id: emp.id,
          username: emp.username,
          password: emp.password || null,
          displayName: emp.displayName,
          role: emp.role,
          avatarUrl: emp.avatarUrl || null,
        });
      }
    }

    // Ensure initial clients exist if table is empty
    const clientCount = db.prepare('SELECT count(*) as count FROM clients').get() as { count: number };
    if (!clientCount || clientCount.count === 0) {
      const initialClients = getInitialClients();
      const insertClient = db.prepare(`
        INSERT OR REPLACE INTO clients (
          id, member_code, line_user_id, display_name, nickname, phone,
          birthday, profile_pic, notes, created_at, consent_accepted, consent_accepted_at
        )
        VALUES (@id, @memberCode, @lineUserId, @displayName, @nickname, @phone, @birthday, @profilePic, @notes, @createdAt, 0, NULL)
      `);
      for (const c of initialClients) {
        insertClient.run({
          id: c.id,
          memberCode: c.memberCode,
          lineUserId: c.lineUserId || null,
          displayName: c.displayName,
          nickname: c.nickname || null,
          phone: c.phone || null,
          birthday: c.birthday || null,
          profilePic: c.profilePic || null,
          notes: c.notes || null,
          createdAt: c.createdAt,
        });
      }
    }

    // Ensure initial coin_wallets exist if table is empty
    const coinWalletCount = db.prepare('SELECT count(*) as count FROM coin_wallets').get() as { count: number };
    if (!coinWalletCount || coinWalletCount.count === 0) {
      const initialBalances: Record<string, number> = {
        'CLI-0001': 3500,
        'CLI-0002': 8000,
        'CLI-0003': 500,
      };
      const insertCoinWallet = db.prepare('INSERT OR REPLACE INTO coin_wallets (id, client_id, balance) VALUES (?, ?, ?)');
      for (const [clientId, bal] of Object.entries(initialBalances)) {
        insertCoinWallet.run(`CW-${clientId}`, clientId, bal);
      }
    }

    // Ensure initial points_wallets exist if table is empty
    const pointsWalletCount = db.prepare('SELECT count(*) as count FROM points_wallets').get() as { count: number };
    if (!pointsWalletCount || pointsWalletCount.count === 0) {
      const initialPoints: Record<string, { balance: number; earned: number; redeemed: number; tier: string }> = {
        'CLI-0001': { balance: 850, earned: 1100, redeemed: 250, tier: 'Silver' },
        'CLI-0002': { balance: 2400, earned: 2400, redeemed: 0, tier: 'Gold' },
        'CLI-0003': { balance: 200, earned: 200, redeemed: 0, tier: 'Bronze' },
      };
      const insertPointsWallet = db.prepare('INSERT OR REPLACE INTO points_wallets (id, client_id, balance, lifetime_earned, lifetime_redeemed, tier) VALUES (?, ?, ?, ?, ?, ?)');
      for (const [clientId, pw] of Object.entries(initialPoints)) {
        insertPointsWallet.run(`PW-${clientId}`, clientId, pw.balance, pw.earned, pw.redeemed, pw.tier);
      }
    }

    // Ensure initial catalog_items exist if table is empty
    const catalogCount = db.prepare('SELECT count(*) as count FROM catalog_items').get() as { count: number };
    if (!catalogCount || catalogCount.count === 0) {
      const initialCatalogs = getInitialCatalogItems();
      const insertCatalog = db.prepare(`
        INSERT OR REPLACE INTO catalog_items (
          id, type, name, description, image_url, price, validity_days,
          default_sessions, category, keywords, active, created_at, is_crm_marketing_voucher
        )
        VALUES (
          @id, @type, @name, @description, @imageUrl, @price, @validityDays,
          @defaultSessions, @category, @keywords, @active, @createdAt, @isCrmMarketingVoucher
        )
      `);
      for (const item of initialCatalogs) {
        insertCatalog.run({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description || null,
          imageUrl: item.imageUrl || null,
          price: item.price,
          validityDays: item.validityDays,
          defaultSessions: item.defaultSessions !== undefined ? item.defaultSessions : null,
          category: item.category || null,
          keywords: item.keywords ? JSON.stringify(item.keywords) : null,
          active: item.active ? 1 : 0,
          createdAt: item.createdAt,
          isCrmMarketingVoucher: item.isCrmMarketingVoucher ? 1 : 0,
        });
      }
    }

    // Ensure initial reward_catalog_items exist if table is empty
    const rewardCount = db.prepare('SELECT count(*) as count FROM reward_catalog_items').get() as { count: number };
    if (!rewardCount || rewardCount.count === 0) {
      const initialRewards = getInitialRewardCatalogItems();
      const insertReward = db.prepare(`
        INSERT OR REPLACE INTO reward_catalog_items (
          id, name, description, points_cost, image_url, active, min_tier
        )
        VALUES (
          @id, @name, @description, @pointsCost, @imageUrl, @active, @minTier
        )
      `);
      for (const item of initialRewards) {
        insertReward.run({
          id: item.id,
          name: item.name,
          description: item.description || null,
          pointsCost: item.pointsCost,
          imageUrl: item.imageUrl || null,
          active: item.active ? 1 : 0,
          minTier: item.minTier || null,
        });
      }
    }

    // Ensure initial client_packages exist if table is empty
    const packageCount = db.prepare('SELECT count(*) as count FROM client_packages').get() as { count: number };
    if (!packageCount || packageCount.count === 0) {
      const initialPackages = getInitialClientPackages();
      const insertPkg = db.prepare(`
        INSERT OR REPLACE INTO client_packages (
          id, client_id, catalog_id, name, description, image_url,
          total_sessions, remaining_sessions, price_paid, purchase_date,
          expiry_date, status, used_up_at, created_at, usage_logs,
          follow_up_status, follow_up_note, follow_up_updated_at, follow_up_updated_by_staff_name,
          voided_at, voided_by, void_reason
        ) VALUES (
          @id, @clientId, @catalogId, @name, @description, @imageUrl,
          @totalSessions, @remainingSessions, @pricePaid, @purchaseDate,
          @expiryDate, @status, @usedUpAt, @createdAt, @usageLogs,
          NULL, NULL, NULL, NULL,
          NULL, NULL, NULL
        )
      `);
      for (const p of initialPackages) {
        insertPkg.run({
          id: p.id,
          clientId: p.clientId,
          catalogId: p.catalogId,
          name: p.name,
          description: p.description || null,
          imageUrl: p.imageUrl || null,
          totalSessions: p.totalSessions,
          remainingSessions: p.remainingSessions,
          pricePaid: p.pricePaid,
          purchaseDate: p.purchaseDate,
          expiryDate: p.expiryDate,
          status: p.status,
          usedUpAt: p.usedUpAt || null,
          createdAt: p.createdAt,
          usageLogs: JSON.stringify(p.usageLogs || []),
        });
      }
    }

    // Ensure initial client_coupons exist if table is empty
    const couponCount = db.prepare('SELECT count(*) as count FROM client_coupons').get() as { count: number };
    if (!couponCount || couponCount.count === 0) {
      const initialCoupons = getInitialClientCoupons();
      const insertCpn = db.prepare(`
        INSERT OR REPLACE INTO client_coupons (
          id, client_id, catalog_id, name, description, image_url,
          coupon_code, total_quantity, used_quantity, remaining_quantity,
          price_paid, purchase_date, expiry_date, status, used_up_at,
          created_at, redemption_logs, follow_up_status, follow_up_note,
          follow_up_updated_at, follow_up_updated_by_staff_name,
          is_crm_marketing_voucher, voided_at, voided_by, void_reason
        ) VALUES (
          @id, @clientId, @catalogId, @name, @description, @imageUrl,
          @couponCode, @totalQuantity, @usedQuantity, @remainingQuantity,
          @pricePaid, @purchaseDate, @expiryDate, @status, @usedUpAt,
          @createdAt, @redemptionLogs, NULL, NULL,
          NULL, NULL,
          @isCrmMarketingVoucher, NULL, NULL, NULL
        )
      `);
      for (const c of initialCoupons) {
        insertCpn.run({
          id: c.id,
          clientId: c.clientId,
          catalogId: c.catalogId,
          name: c.name,
          description: c.description || null,
          imageUrl: c.imageUrl || null,
          couponCode: c.couponCode,
          totalQuantity: c.totalQuantity,
          usedQuantity: c.usedQuantity,
          remainingQuantity: c.remainingQuantity,
          pricePaid: c.pricePaid,
          purchaseDate: c.purchaseDate,
          expiryDate: c.expiryDate,
          status: c.status,
          usedUpAt: c.usedUpAt || null,
          createdAt: c.createdAt,
          redemptionLogs: JSON.stringify(c.redemptionLogs || []),
          isCrmMarketingVoucher: c.isCrmMarketingVoucher ? 1 : 0,
        });
      }
    }

    // Ensure initial notifications exist if table is empty
    const notifCount = db.prepare('SELECT count(*) as count FROM notifications').get() as { count: number };
    if (!notifCount || notifCount.count === 0) {
      const initialNotifs = getInitialNotifications();
      const insertNotif = db.prepare(`
        INSERT OR REPLACE INTO notifications (id, client_id, title, message, created_at, read, reserved_for_line_push)
        VALUES (@id, @clientId, @title, @message, @createdAt, @read, @reservedForLinePush)
      `);
      for (const n of initialNotifs) {
        insertNotif.run({
          id: n.id,
          clientId: n.clientId,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read ? 1 : 0,
          reservedForLinePush: n.reservedForLinePush ? 1 : 0,
        });
      }
    }

    // Ensure initial audit_logs exist if table is empty
    const auditCount = db.prepare('SELECT count(*) as count FROM audit_logs').get() as { count: number };
    if (!auditCount || auditCount.count === 0) {
      const initialAudits = getInitialAuditLogs();
      const insertAudit = db.prepare(`
        INSERT OR REPLACE INTO audit_logs (id, staff_id, staff_name, action, entity_type, entity_id, previous_data, new_data, reason, timestamp)
        VALUES (@id, @staffId, @staffName, @action, @entityType, @entityId, @previousData, @newData, @reason, @timestamp)
      `);
      for (const a of initialAudits) {
        insertAudit.run({
          id: a.id,
          staffId: a.staffId,
          staffName: a.staffName,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          previousData: a.previousData ? JSON.stringify(a.previousData) : null,
          newData: a.newData ? JSON.stringify(a.newData) : null,
          reason: a.reason || null,
          timestamp: a.timestamp,
        });
      }
    }

    // Ensure initial financial_entries exist if table is empty
    const finCount = db.prepare('SELECT count(*) as count FROM financial_entries').get() as { count: number };
    if (!finCount || finCount.count === 0) {
      const initialFins = getInitialFinancialEntries();
      const insertFin = db.prepare(`
        INSERT OR REPLACE INTO financial_entries (
          id, type, category, category_name_th, title, amount, date,
          note, client_id, client_name, source_tx_id, created_by_staff_id,
          created_by_staff_name, created_at, is_auto_generated
        )
        VALUES (
          @id, @type, @category, @categoryNameTh, @title, @amount, @date,
          @note, @clientId, @clientName, @sourceTxId, @createdByStaffId,
          @createdByStaffName, @createdAt, @isAutoGenerated
        )
      `);
      for (const f of initialFins) {
        insertFin.run({
          id: f.id,
          type: f.type,
          category: f.category,
          categoryNameTh: f.categoryNameTh,
          title: f.title,
          amount: f.amount,
          date: f.date,
          note: f.note || null,
          clientId: f.clientId || null,
          clientName: f.clientName || null,
          sourceTxId: f.sourceTxId || null,
          createdByStaffId: f.createdByStaffId,
          createdByStaffName: f.createdByStaffName,
          createdAt: f.createdAt,
          isAutoGenerated: f.isAutoGenerated ? 1 : 0,
        });
      }
    }

    // Ensure settings record exists
    const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
    if (!settingsCount || settingsCount.count === 0) {
      db.prepare(`
        INSERT OR REPLACE INTO settings (id, backup_settings, brand_settings, updated_at)
        VALUES ('app_settings', NULL, NULL, ?)
      `).run(new Date().toISOString());
    }

    return db;
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: any = JSON.parse(fileData);

        // Migrate any lingering notifications, audit logs, financial entries, and settings to SQLite
        if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) {
          const insertNotif = this.sqlite.prepare(`
            INSERT OR IGNORE INTO notifications (id, client_id, title, message, created_at, read, reserved_for_line_push)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const n of parsed.notifications) {
            insertNotif.run(n.id, n.clientId, n.title, n.message, n.createdAt, n.read ? 1 : 0, n.reservedForLinePush ? 1 : 0);
          }
        }
        if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0) {
          const insertAudit = this.sqlite.prepare(`
            INSERT OR IGNORE INTO audit_logs (id, staff_id, staff_name, action, entity_type, entity_id, previous_data, new_data, reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const a of parsed.auditLogs) {
            insertAudit.run(
              a.id, a.staffId, a.staffName, a.action, a.entityType, a.entityId,
              a.previousData ? JSON.stringify(a.previousData) : null,
              a.newData ? JSON.stringify(a.newData) : null,
              a.reason || null, a.timestamp
            );
          }
        }
        if (Array.isArray(parsed.financialEntries) && parsed.financialEntries.length > 0) {
          const insertFin = this.sqlite.prepare(`
            INSERT OR IGNORE INTO financial_entries (
              id, type, category, category_name_th, title, amount, date,
              note, client_id, client_name, source_tx_id, created_by_staff_id,
              created_by_staff_name, created_at, is_auto_generated
            )
            VALUES (
              @id, @type, @category, @categoryNameTh, @title, @amount, @date,
              @note, @clientId, @clientName, @sourceTxId, @createdByStaffId,
              @createdByStaffName, @createdAt, @isAutoGenerated
            )
          `);
          for (const f of parsed.financialEntries) {
            insertFin.run({
              id: f.id,
              type: f.type,
              category: f.category,
              categoryNameTh: f.categoryNameTh,
              title: f.title,
              amount: f.amount,
              date: f.date,
              note: f.note || null,
              clientId: f.clientId || null,
              clientName: f.clientName || null,
              sourceTxId: f.sourceTxId || null,
              createdByStaffId: f.createdByStaffId,
              createdByStaffName: f.createdByStaffName,
              createdAt: f.createdAt,
              isAutoGenerated: f.isAutoGenerated ? 1 : 0,
            });
          }
        }
        if (parsed.backupSettings) {
          this.sqlite.prepare(`
            INSERT INTO settings (id, backup_settings, updated_at)
            VALUES ('app_settings', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              backup_settings = COALESCE(settings.backup_settings, excluded.backup_settings)
          `).run(JSON.stringify(parsed.backupSettings), new Date().toISOString());
        }
        if (parsed.brandSettings) {
          this.sqlite.prepare(`
            INSERT INTO settings (id, brand_settings, updated_at)
            VALUES ('app_settings', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              brand_settings = COALESCE(settings.brand_settings, excluded.brand_settings)
          `).run(JSON.stringify(parsed.brandSettings), new Date().toISOString());
        }

        const hadOldFields =
          'clients' in parsed ||
          'employees' in parsed ||
          'coinWallets' in parsed ||
          'coinTransactions' in parsed ||
          'pointsWallets' in parsed ||
          'pointsTransactions' in parsed ||
          'catalogItems' in parsed ||
          'rewardCatalogItems' in parsed ||
          'clientPackages' in parsed ||
          'clientCoupons' in parsed ||
          'clientOneTimeBookings' in parsed ||
          'notifications' in parsed ||
          'auditLogs' in parsed ||
          'financialEntries' in parsed ||
          'backupSettings' in parsed ||
          'brandSettings' in parsed;
        delete parsed.clients;
        delete parsed.employees;
        delete parsed.coinWallets;
        delete parsed.coinTransactions;
        delete parsed.pointsWallets;
        delete parsed.pointsTransactions;
        delete parsed.catalogItems;
        delete parsed.rewardCatalogItems;
        delete parsed.clientPackages;
        delete parsed.clientCoupons;
        delete parsed.clientOneTimeBookings;
        delete parsed.notifications;
        delete parsed.auditLogs;
        delete parsed.financialEntries;
        delete parsed.backupSettings;
        delete parsed.brandSettings;
        if (hadOldFields) {
          this.saveToDisk(parsed);
        }
        return parsed as DatabaseSchema;
      }
    } catch (err) {
      console.error('Failed to load db.json, initializing fresh store:', err);
    }
    const seed = getInitialData();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(data?: DatabaseSchema) {
    this.pendingSaveData = data || this.db;

    if (this.saveDiskTimer) {
      clearTimeout(this.saveDiskTimer);
    }

    this.saveDiskTimer = setTimeout(() => {
      const dataToSave = this.pendingSaveData;
      this.saveDiskTimer = null;
      this.pendingSaveData = null;

      if (!dataToSave) return;

      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const payload: any = { ...dataToSave };
        delete payload.employees;
        delete payload.clients;

        fs.writeFile(DATA_FILE, JSON.stringify(payload), 'utf-8', (err) => {
          if (err) {
            console.error('Failed to save store to disk:', err);
          }
        });
      } catch (err) {
        console.error('Failed to save store to disk:', err);
      }
    }, 300);
  }

  public getAllClientPackages(): ClientPackage[] {
    const rows = this.sqlite.prepare('SELECT * FROM client_packages ORDER BY created_at DESC').all();
    return rows.map(rowToClientPackage);
  }

  public getAllClientCoupons(): ClientCoupon[] {
    const rows = this.sqlite.prepare('SELECT * FROM client_coupons ORDER BY created_at DESC').all();
    return rows.map(rowToClientCoupon);
  }

  /**
   * Recalculates expiry status for packages and coupons (active, expiring_soon, used_up)
   */
  public refreshItemStatuses() {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const updatePkgStmt = this.sqlite.prepare('UPDATE client_packages SET status = ?, used_up_at = ? WHERE id = ?');
    for (const pkg of this.getAllClientPackages()) {
      if (pkg.status === 'voided') continue;
      let newStatus = pkg.status;
      let newUsedUpAt = pkg.usedUpAt;

      if (pkg.remainingSessions <= 0) {
        newStatus = 'used_up';
        if (!newUsedUpAt) newUsedUpAt = new Date().toISOString();
      } else {
        const expTime = new Date(pkg.expiryDate).getTime();
        if (expTime - now <= sevenDaysMs) {
          newStatus = 'expiring_soon';
        } else {
          newStatus = 'active';
        }
      }

      if (newStatus !== pkg.status || newUsedUpAt !== pkg.usedUpAt) {
        updatePkgStmt.run(newStatus, newUsedUpAt || null, pkg.id);
      }
    }

    const updateCpnStmt = this.sqlite.prepare('UPDATE client_coupons SET status = ?, used_up_at = ? WHERE id = ?');
    for (const cpn of this.getAllClientCoupons()) {
      if (cpn.status === 'voided') continue;
      let newStatus = cpn.status;
      let newUsedUpAt = cpn.usedUpAt;

      if (cpn.usedQuantity >= cpn.totalQuantity) {
        newStatus = 'used_up';
        if (!newUsedUpAt) newUsedUpAt = new Date().toISOString();
      } else {
        const expTime = new Date(cpn.expiryDate).getTime();
        if (expTime - now <= sevenDaysMs) {
          newStatus = 'expiring_soon';
        } else {
          newStatus = 'active';
        }
      }

      if (newStatus !== cpn.status || newUsedUpAt !== cpn.usedUpAt) {
        updateCpnStmt.run(newStatus, newUsedUpAt || null, cpn.id);
      }
    }
  }

  // Helper Audit Logger
  private logAudit(
    staffId: string,
    staffName: string,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    reason: string,
    previousData?: any,
    newData?: any
  ) {
    const log: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffId,
      staffName,
      action,
      entityType,
      entityId,
      previousData,
      newData,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.sqlite.prepare(`
      INSERT INTO audit_logs (id, staff_id, staff_name, action, entity_type, entity_id, previous_data, new_data, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id,
      log.staffId,
      log.staffName,
      log.action,
      log.entityType,
      log.entityId,
      log.previousData !== undefined ? JSON.stringify(log.previousData) : null,
      log.newData !== undefined ? JSON.stringify(log.newData) : null,
      log.reason || null,
      log.timestamp
    );
    // Keep max 2000 records
    this.sqlite.prepare(`
      DELETE FROM audit_logs
      WHERE id NOT IN (
        SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 2000
      )
    `).run();
  }

  // Helper In-App Notification Creator
  private notifyClient(clientId: string, title: string, message: string) {
    const notif: InAppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      reservedForLinePush: true,
    };
    this.sqlite.prepare(`
      INSERT INTO notifications (id, client_id, title, message, created_at, read, reserved_for_line_push)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      notif.id,
      notif.clientId,
      notif.title,
      notif.message,
      notif.createdAt,
      notif.read ? 1 : 0,
      notif.reservedForLinePush ? 1 : 0
    );
  }

  // Employees
  public getEmployees(): Employee[] {
    const rows = this.sqlite.prepare('SELECT * FROM employees ORDER BY id ASC').all();
    return rows.map(rowToEmployee);
  }

  public getEmployeeById(id: string): Employee | undefined {
    if (!id || typeof id !== 'string') return undefined;
    const row = this.sqlite.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    return row ? rowToEmployee(row) : undefined;
  }

  public verifyStaffPinAndGetStaff(pin: string): Employee | null {
    if (!pin || typeof pin !== 'string') return null;
    const trimmed = pin.trim();
    const row = this.sqlite.prepare('SELECT * FROM employees WHERE password = ? OR id = ?').get(trimmed, trimmed);
    return row ? rowToEmployee(row) : null;
  }

  public createEmployee(
    empData: Partial<Employee>,
    staffId: string,
    staffName: string
  ): Employee {
    const existing = this.sqlite.prepare('SELECT id FROM employees WHERE LOWER(username) = LOWER(?)').get((empData.username || '').trim());
    if (existing) {
      throw new Error(`ชื่อผู้ใช้งาน (Username) "${empData.username}" มีอยู่ในระบบแล้ว`);
    }

    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      username: (empData.username || '').trim(),
      password: empData.password ? empData.password.trim() : '123456',
      displayName: (empData.displayName || '').trim() || 'Staff Member',
      role: empData.role || 'staff',
      avatarUrl: empData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    this.sqlite.prepare(`
      INSERT INTO employees (id, username, password, display_name, role, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newEmp.id,
      newEmp.username,
      newEmp.password || null,
      newEmp.displayName,
      newEmp.role,
      newEmp.avatarUrl || null
    );

    this.logAudit(
      staffId,
      staffName,
      'CREATE_EMPLOYEE',
      'staff',
      newEmp.id,
      `สร้างบัญชีผู้ใช้งานใหม่: ${newEmp.displayName} (${newEmp.role})`,
      undefined,
      newEmp
    );
    this.saveToDisk();
    return newEmp;
  }

  public updateEmployee(
    id: string,
    empData: Partial<Employee>,
    staffId: string,
    staffName: string
  ): Employee {
    const current = this.getEmployeeById(id);
    if (!current) {
      throw new Error('Employee not found');
    }

    // Check username uniqueness if changed
    if (empData.username && empData.username.toLowerCase() !== current.username.toLowerCase()) {
      const exists = this.sqlite.prepare('SELECT id FROM employees WHERE id != ? AND LOWER(username) = LOWER(?)').get(id, empData.username.trim());
      if (exists) {
        throw new Error(`ชื่อผู้ใช้งาน "${empData.username}" มีอยู่ในระบบแล้ว`);
      }
    }

    const updated: Employee = {
      ...current,
      username: empData.username ? empData.username.trim() : current.username,
      password: empData.password ? empData.password.trim() : current.password,
      displayName: empData.displayName ? empData.displayName.trim() : current.displayName,
      role: empData.role || current.role,
      avatarUrl: empData.avatarUrl !== undefined ? empData.avatarUrl : current.avatarUrl,
    };

    this.sqlite.prepare(`
      UPDATE employees
      SET username = ?, password = ?, display_name = ?, role = ?, avatar_url = ?
      WHERE id = ?
    `).run(
      updated.username,
      updated.password || null,
      updated.displayName,
      updated.role,
      updated.avatarUrl || null,
      id
    );

    this.logAudit(
      staffId,
      staffName,
      'UPDATE_EMPLOYEE',
      'staff',
      updated.id,
      `แก้ไขข้อมูลบัญชีผู้ใช้งาน: ${updated.displayName} (${updated.role})`,
      current,
      updated
    );
    this.saveToDisk();
    return updated;
  }

  public deleteEmployee(id: string, staffId: string, staffName: string): boolean {
    const current = this.getEmployeeById(id);
    if (!current) {
      throw new Error('Employee not found');
    }

    // Prevent deleting the last admin
    if (current.role === 'admin') {
      const adminCountRow = this.sqlite.prepare("SELECT count(*) as count FROM employees WHERE role = 'admin'").get() as { count: number };
      if (!adminCountRow || adminCountRow.count <= 1) {
        throw new Error('ไม่สามารถลบบัญชี Admin คนสุดท้ายของระบบได้');
      }
    }

    this.sqlite.prepare('DELETE FROM employees WHERE id = ?').run(id);

    this.logAudit(
      staffId,
      staffName,
      'DELETE_EMPLOYEE',
      'staff',
      id,
      `ลบบัญชีผู้ใช้งาน: ${current.displayName} (${current.role})`,
      current,
      undefined
    );
    this.saveToDisk();
    return true;
  }

  public changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
    staffId: string,
    staffName: string
  ): boolean {
    const current = this.getEmployeeById(id);
    if (!current) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานในระบบ');
    }

    if (current.password && current.password !== oldPassword) {
      throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    }

    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
    }

    const updatedPassword = newPassword.trim();
    this.sqlite.prepare('UPDATE employees SET password = ? WHERE id = ?').run(updatedPassword, id);

    this.logAudit(
      staffId,
      staffName,
      'CHANGE_PASSWORD',
      'staff',
      id,
      `เปลี่ยนรหัสผ่านสำหรับผู้ใช้: ${current.displayName}`,
      undefined,
      { id: current.id, username: current.username }
    );
    this.saveToDisk();
    return true;
  }

  // Clients
  public getClients(): Client[] {
    const rows = this.sqlite.prepare('SELECT * FROM clients ORDER BY rowid DESC').all();
    return rows.map(rowToClient);
  }

  public getAllClientsExportData() {
    this.refreshItemStatuses();
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.getClients().map((client) => {
      const coinBalance = this.getCoinBalance(client.id);
      const pointsWallet = this.getPointsWallet(client.id);
      const packages = this.getClientPackages(client.id);
      const coupons = this.getClientCoupons(client.id);
      const coinTxs = this.getCoinTransactions(client.id).filter((tx) => !tx.reversed);

      const coinSpent = coinTxs
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const packageSpent = packages.reduce((sum, p) => sum + (p.pricePaid || 0), 0);
      const couponSpent = coupons.reduce((sum, c) => sum + (c.pricePaid || 0), 0);

      const activePackages = packages.filter((p) => p.status === 'active' && p.remainingSessions > 0);
      const expiringPackages = activePackages.filter((p) => {
        if (!p.expiryDate) return false;
        const exp = new Date(p.expiryDate);
        return exp >= now && exp <= in30Days;
      });

      const activeCoupons = coupons.filter(
        (c) => c.status !== 'used_up' && c.usedQuantity < c.totalQuantity
      );

      return {
        client,
        coinBalance,
        pointsWallet,
        packages,
        coupons,
        totalCoinSpent: coinSpent,
        totalPurchasesSpent: packageSpent + couponSpent,
        totalSpending: coinSpent + packageSpent + couponSpent,
        activePackagesCount: activePackages.length,
        expiringPackagesCount: expiringPackages.length,
        activeCouponsCount: activeCoupons.length,
      };
    });
  }

  public getClientById(id: string): Client | undefined {
    if (!id || typeof id !== 'string') return undefined;
    const row = this.sqlite.prepare(`
      SELECT * FROM clients
      WHERE id = ? OR member_code = ? OR line_user_id = ?
      LIMIT 1
    `).get(id, id, id);
    return row ? rowToClient(row) : undefined;
  }

  public getClientByLineUserId(lineUserId: string): Client | undefined {
    if (!lineUserId || typeof lineUserId !== 'string' || !lineUserId.trim()) {
      return undefined;
    }
    const cleanId = lineUserId.trim();
    const row = this.sqlite.prepare('SELECT * FROM clients WHERE line_user_id = ? LIMIT 1').get(cleanId);
    return row ? rowToClient(row) : undefined;
  }

  public findOrCreateClientByLineProfile(lineProfile: {
    userId: string;
    displayName?: string;
    pictureUrl?: string;
  }): Client {
    let client = this.getClientByLineUserId(lineProfile.userId);
    if (client) {
      let updated = false;
      if (lineProfile.pictureUrl && client.profilePic !== lineProfile.pictureUrl) {
        client.profilePic = lineProfile.pictureUrl;
        updated = true;
      }
      if (
        lineProfile.displayName &&
        (!client.displayName || client.displayName.startsWith('Member ') || client.displayName === 'Unnamed Member')
      ) {
        client.displayName = lineProfile.displayName;
        updated = true;
      }
      if (updated) {
        this.sqlite.prepare(`
          UPDATE clients
          SET profile_pic = ?, display_name = ?
          WHERE id = ?
        `).run(client.profilePic || null, client.displayName, client.id);
      }
      return client;
    }

    // Create new client for this LINE User ID
    return this.createClient(
      {
        lineUserId: lineProfile.userId,
        displayName: lineProfile.displayName || 'LINE Member',
        profilePic:
          lineProfile.pictureUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      },
      'SYSTEM_LIFF',
      'LIFF Auto Registration'
    );
  }

  public createClient(clientData: Partial<Client>, staffId: string, staffName: string): Client {
    // Collect all existing member codes to find the smallest unused sequential number
    const rows = this.sqlite.prepare('SELECT member_code FROM clients').all() as { member_code: string }[];
    const usedNumbers = new Set<number>();
    for (const r of rows) {
      const match = r.member_code?.match(/^MMM-(\d+)$/);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    }
    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }
    const memberCode = `MMM-${String(nextNum).padStart(4, '0')}`;
    const newClient: Client = {
      id: `CLI-${Date.now()}`,
      memberCode,
      lineUserId: clientData.lineUserId || undefined,
      displayName: clientData.displayName || 'Unnamed Member',
      nickname: clientData.nickname || '',
      phone: clientData.phone || '',
      birthday: clientData.birthday || undefined,
      profilePic: clientData.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
      consentAccepted: false,
    };

    this.sqlite.prepare(`
      INSERT INTO clients (
        id, member_code, line_user_id, display_name, nickname, phone,
        birthday, profile_pic, notes, created_at, consent_accepted, consent_accepted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
    `).run(
      newClient.id,
      newClient.memberCode,
      newClient.lineUserId || null,
      newClient.displayName,
      newClient.nickname || null,
      newClient.phone || null,
      newClient.birthday || null,
      newClient.profilePic || null,
      newClient.notes || null,
      newClient.createdAt
    );

    this.sqlite.prepare(`
      INSERT OR IGNORE INTO coin_wallets (id, client_id, balance) VALUES (?, ?, 0)
    `).run(`CW-${newClient.id}`, newClient.id);

    this.sqlite.prepare(`
      INSERT OR IGNORE INTO points_wallets (id, client_id, balance, lifetime_earned, lifetime_redeemed, tier)
      VALUES (?, ?, 0, 0, 0, 'Bronze')
    `).run(`PW-${newClient.id}`, newClient.id);

    this.logAudit(staffId, staffName, 'CREATE_CLIENT', 'client', newClient.id, 'New client registered', null, newClient);

    // Automatically award 100 Bonus Coins for new Me.My.Mind Membership signups!
    try {
      this.addCoinCredit(
        newClient.id,
        100,
        'Welcome Bonus Coins - สมาชิกใหม่ Me.My.Mind Membership รับฟรี 100 Bonus Coins',
        staffId,
        staffName,
        true // isBonus = true
      );
    } catch (err) {
      console.error('Failed to award welcome bonus coins:', err);
    }

    this.saveToDisk();
    return newClient;
  }

  public deleteClientPermanently(clientId: string, staffId: string, staffName: string, reason: string): void {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    }

    // Save audit log with previous snapshot of client
    this.logAudit(
      staffId,
      staffName,
      'DELETE_CLIENT_PERMANENTLY',
      'client',
      clientId,
      `ลบข้อมูลลูกค้าถาวร: ${client.displayName} (${client.memberCode}) | เหตุผล: ${reason}`,
      client,
      null
    );

    // Remove client and wallet/tx records from SQLite
    this.sqlite.prepare('DELETE FROM clients WHERE id = ?').run(client.id);
    this.sqlite.prepare('DELETE FROM coin_wallets WHERE client_id = ?').run(client.id);
    this.sqlite.prepare('DELETE FROM coin_transactions WHERE client_id = ?').run(client.id);
    this.sqlite.prepare('DELETE FROM points_wallets WHERE client_id = ?').run(client.id);
    this.sqlite.prepare('DELETE FROM points_transactions WHERE client_id = ?').run(client.id);
    this.saveToDisk();
  }

  public updateClientProfile(
    clientId: string,
    profileData: { phone?: string; birthday?: string; nickname?: string; displayName?: string },
    staffId: string = 'SYSTEM_USER',
    staffName: string = 'Member Self Service'
  ): Client {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    }

    const trimmedPhone = profileData.phone ? profileData.phone.trim() : '';

    // Smart Account Binding: If customer is setting/updating phone number and has a lineUserId,
    // check if there's an existing staff-created profile with this phone number but no lineUserId yet.
    if (trimmedPhone && client.lineUserId) {
      const normalizedInput = trimmedPhone.replace(/[^0-9]/g, '');
      const allClients = this.getClients();
      const existingWithPhone = allClients.find(
        (c) =>
          c.id !== client.id &&
          c.phone &&
          c.phone.replace(/[^0-9]/g, '') === normalizedInput &&
          !c.lineUserId
      );

      if (existingWithPhone) {
        // Link the lineUserId to the existing staff-created client profile
        existingWithPhone.lineUserId = client.lineUserId;
        if (client.profilePic) existingWithPhone.profilePic = client.profilePic;
        if (profileData.birthday) existingWithPhone.birthday = profileData.birthday;
        if (profileData.nickname) existingWithPhone.nickname = profileData.nickname;
        if (profileData.displayName && profileData.displayName.trim()) {
          existingWithPhone.displayName = profileData.displayName.trim();
        }

        this.sqlite.prepare(`
          UPDATE clients
          SET line_user_id = ?, profile_pic = ?, birthday = ?, nickname = ?, display_name = ?
          WHERE id = ?
        `).run(
          existingWithPhone.lineUserId || null,
          existingWithPhone.profilePic || null,
          existingWithPhone.birthday || null,
          existingWithPhone.nickname || null,
          existingWithPhone.displayName,
          existingWithPhone.id
        );

        // Remove the temporary auto-created client profile from SQLite
        this.sqlite.prepare('DELETE FROM clients WHERE id = ?').run(client.id);

        this.logAudit(
          staffId,
          staffName,
          'UPDATE_CLIENT_PROFILE',
          'client',
          existingWithPhone.id,
          `เชื่อมต่อบัญชี LINE ของสมาชิกเข้ากับประวัติเดิมผ่านเบอร์โทรศัพท์ (${trimmedPhone})`,
          null,
          existingWithPhone
        );

        this.saveToDisk();
        return existingWithPhone;
      }
    }

    const prevData = { phone: client.phone, birthday: client.birthday, nickname: client.nickname, displayName: client.displayName };

    if (profileData.phone !== undefined) client.phone = profileData.phone.trim();
    if (profileData.birthday !== undefined) client.birthday = profileData.birthday;
    if (profileData.nickname !== undefined) client.nickname = profileData.nickname.trim();
    if (profileData.displayName !== undefined && profileData.displayName.trim()) client.displayName = profileData.displayName.trim();

    this.sqlite.prepare(`
      UPDATE clients
      SET phone = ?, birthday = ?, nickname = ?, display_name = ?
      WHERE id = ?
    `).run(
      client.phone || null,
      client.birthday || null,
      client.nickname || null,
      client.displayName,
      client.id
    );

    this.logAudit(
      staffId,
      staffName,
      'UPDATE_CLIENT_PROFILE',
      'client',
      client.id,
      `อัปเดตข้อมูลส่วนตัวสมาชิก ${client.displayName} (เบอร์โทร: ${client.phone || '-'}, วันเกิด: ${client.birthday || '-'})`,
      prevData,
      { phone: client.phone, birthday: client.birthday, nickname: client.nickname, displayName: client.displayName }
    );

    this.saveToDisk();
    return client;
  }

  public updateClientNotes(
    clientId: string,
    notes: string,
    staffId: string,
    staffName: string
  ): Client {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    }
    const oldNotes = client.notes || '';
    client.notes = notes ? notes.trim() : '';

    this.sqlite.prepare('UPDATE clients SET notes = ? WHERE id = ?').run(client.notes || null, client.id);

    this.logAudit(
      staffId,
      staffName,
      'UPDATE_CLIENT_NOTE',
      'client',
      client.id,
      `อัปเดต Staff Note สำหรับสมาชิก ${client.displayName}`,
      { notes: oldNotes },
      { notes: client.notes }
    );
    this.saveToDisk();
    return client;
  }

  public acceptConsent(clientId: string): Client {
    const client = this.getClientById(clientId);
    if (!client) {
      throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    }
    client.consentAccepted = true;
    client.consentAcceptedAt = new Date().toISOString();

    this.sqlite.prepare(`
      UPDATE clients
      SET consent_accepted = 1, consent_accepted_at = ?
      WHERE id = ?
    `).run(client.consentAcceptedAt, client.id);

    this.saveToDisk();
    return client;
  }

  // Coin Wallet Operations
  public getCoinBalance(clientId: string): number {
    const row = this.sqlite.prepare('SELECT balance FROM coin_wallets WHERE client_id = ?').get(clientId) as { balance: number } | undefined;
    return row ? Number(row.balance) : 0;
  }

  public getCoinTransactions(clientId: string): CoinTransaction[] {
    const rows = this.sqlite.prepare('SELECT * FROM coin_transactions WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    return rows.map(rowToCoinTransaction);
  }

  public getAllCoinTransactions(): CoinTransaction[] {
    const rows = this.sqlite.prepare('SELECT * FROM coin_transactions ORDER BY created_at DESC').all();
    return rows.map(rowToCoinTransaction);
  }

  public addCoinCredit(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string,
    isBonus: boolean = false
  ): CoinTransaction {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const currentBalance = this.getCoinBalance(clientId);
    const newBalance = currentBalance + amount;

    // Update wallet in SQLite
    const existing = this.sqlite.prepare('SELECT id FROM coin_wallets WHERE client_id = ?').get(clientId) as { id: string } | undefined;
    if (existing) {
      this.sqlite.prepare('UPDATE coin_wallets SET balance = ? WHERE client_id = ?').run(newBalance, clientId);
    } else {
      this.sqlite.prepare('INSERT INTO coin_wallets (id, client_id, balance) VALUES (?, ?, ?)').run(`CW-${clientId}`, clientId, newBalance);
    }

    const txNote = isBonus
      ? `(Bonus Coins) ${note || 'CRM Marketing Bonus Coins'}`
      : (note || 'Store recorded payment credit');

    const tx: CoinTransaction = {
      id: `TX-COIN-${Date.now()}`,
      clientId,
      amount,
      type: 'credit_added',
      note: txNote,
      isBonus,
      resultingBalance: newBalance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert into SQLite
    this.sqlite.prepare(`
      INSERT INTO coin_transactions (
        id, client_id, amount, type, note, resulting_balance,
        created_by_staff_id, created_by_staff_name, created_at,
        is_bonus, reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `).run(
      tx.id,
      tx.clientId,
      tx.amount,
      tx.type,
      tx.note,
      tx.resultingBalance,
      tx.createdByStaffId,
      tx.createdByStaffName,
      tx.createdAt,
      tx.isBonus ? 1 : 0
    );

    const client = this.getClientById(clientId);

    if (isBonus) {
      // Bonus Coins do NOT count as company revenue!
      // They are recorded as CRM Marketing Expense (ค่าใช้จ่าย Bonus Coins) in accounting.
      const finEntry: FinancialEntry = {
        id: `FIN-EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'expense',
        category: 'marketing',
        categoryNameTh: 'ค่าใช้จ่าย Bonus Coins (CRM Marketing)',
        title: `แจก Bonus Coins ให้ลูกค้า: ${client?.displayName || clientId}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        note: `Bonus Coins CRM Marketing: ${note || 'แจก Bonus Coins ให้ลูกค้า'}`,
        clientId: clientId,
        clientName: client?.displayName,
        sourceTxId: tx.id,
        createdByStaffId: staffId,
        createdByStaffName: staffName,
        createdAt: new Date().toISOString(),
        isAutoGenerated: true,
      };
      this.sqlite.prepare(`
        INSERT INTO financial_entries (
          id, type, category, category_name_th, title, amount, date,
          note, client_id, client_name, source_tx_id, created_by_staff_id,
          created_by_staff_name, created_at, is_auto_generated
        )
        VALUES (
          @id, @type, @category, @categoryNameTh, @title, @amount, @date,
          @note, @clientId, @clientName, @sourceTxId, @createdByStaffId,
          @createdByStaffName, @createdAt, 1
        )
      `).run({
        id: finEntry.id,
        type: finEntry.type,
        category: finEntry.category,
        categoryNameTh: finEntry.categoryNameTh,
        title: finEntry.title,
        amount: finEntry.amount,
        date: finEntry.date,
        note: finEntry.note || null,
        clientId: finEntry.clientId || null,
        clientName: finEntry.clientName || null,
        sourceTxId: finEntry.sourceTxId || null,
        createdByStaffId: finEntry.createdByStaffId,
        createdByStaffName: finEntry.createdByStaffName,
        createdAt: finEntry.createdAt,
      });

      this.notifyClient(
        clientId,
        'คุณได้รับ Bonus Coins ฟรี!',
        `ยินดีด้วย! ร้านค้ามอบ +${amount.toLocaleString()} Bonus Coins ฟรีเข้าบัญชีของคุณเรียบร้อยแล้ว สามารถใช้แทนเงินสดในการรับบริการที่ร้านได้เลย`
      );
    } else {
      // Normal Coin Purchase (Revenue & Points)
      const ptsEarned = Math.floor(amount / BAHT_PER_POINT);
      if (ptsEarned > 0) {
        this.addPoints(
          clientId,
          ptsEarned,
          `สะสมคะแนนจากการเติมเงิน ${amount} บาท`,
          staffId,
          staffName,
          'coin_topup',
          { relatedCoinTxId: tx.id }
        );
      }

      this.notifyClient(
        clientId,
        'เติม Coin สำเร็จ',
        `บันทึกการรับชำระเงินและเติม +${amount.toLocaleString()} Coins เข้ากระเป๋าของคุณเรียบร้อยแล้ว ยอดคงเหลือปัจจุบันคือ ${newBalance.toLocaleString()} Coins`
      );
    }

    this.logAudit(
      staffId,
      staffName,
      isBonus ? 'ADD_BONUS_COINS' : 'ADD_COIN_CREDIT',
      'coin',
      clientId,
      note,
      { balance: currentBalance },
      { balance: newBalance, amount, isBonus }
    );

    this.saveToDisk();
    return tx;
  }

  public deductCoinCredit(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string
  ): CoinTransaction {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const currentBalance = this.getCoinBalance(clientId);
    if (currentBalance < amount) {
      throw new Error(`Insufficient coin balance. Current balance is ฿${currentBalance.toLocaleString()}, requested deduction is ฿${amount.toLocaleString()}`);
    }

    const newBalance = currentBalance - amount;

    // Update wallet in SQLite
    this.sqlite.prepare('UPDATE coin_wallets SET balance = ? WHERE client_id = ?').run(newBalance, clientId);

    const tx: CoinTransaction = {
      id: `TX-COIN-${Date.now()}`,
      clientId,
      amount: -amount,
      type: 'credit_used',
      note: note || 'Deducted for studio service',
      resultingBalance: newBalance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert into SQLite
    this.sqlite.prepare(`
      INSERT INTO coin_transactions (
        id, client_id, amount, type, note, resulting_balance,
        created_by_staff_id, created_by_staff_name, created_at,
        is_bonus, reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, NULL, NULL)
    `).run(
      tx.id,
      tx.clientId,
      tx.amount,
      tx.type,
      tx.note,
      tx.resultingBalance,
      tx.createdByStaffId,
      tx.createdByStaffName,
      tx.createdAt
    );

    this.notifyClient(clientId, 'ตัด Coin ใช้บริการเรียบร้อย', `พนักงานได้ทำการตัด -${amount.toLocaleString()} Coins เพื่อชำระค่าบริการ ยอดคงเหลือคงเหลือ ${newBalance.toLocaleString()} Coins`);
    this.logAudit(staffId, staffName, 'DEDUCT_COIN_CREDIT', 'coin', clientId, note, { balance: currentBalance }, { balance: newBalance, amount });

    this.saveToDisk();
    return tx;
  }

  // Reversals
  public reverseCoinTransaction(
    txId: string,
    reason: string,
    staffId: string,
    staffName: string
  ): CoinTransaction {
    const row = this.sqlite.prepare('SELECT * FROM coin_transactions WHERE id = ?').get(txId);
    if (!row) {
      throw new Error('Transaction not found');
    }
    const originalTx = rowToCoinTransaction(row);
    if (originalTx.reversed) {
      throw new Error('Transaction has already been reversed');
    }

    const currentBalance = this.getCoinBalance(originalTx.clientId);
    const offsetAmount = -originalTx.amount; // Inverse of original amount
    const newBalance = currentBalance + offsetAmount;

    if (newBalance < 0) {
      throw new Error('Reversal would result in a negative coin balance');
    }

    const reversedAt = new Date().toISOString();

    // Mark original as reversed in SQLite
    this.sqlite.prepare(`
      UPDATE coin_transactions
      SET reversed = 1, reversal_reason = ?, reversed_at = ?, reversed_by_staff_name = ?
      WHERE id = ?
    `).run(reason, reversedAt, staffName, originalTx.id);

    originalTx.reversed = true;
    originalTx.reversalReason = reason;
    originalTx.reversedAt = reversedAt;
    originalTx.reversedByStaffName = staffName;

    // Update wallet in SQLite
    this.sqlite.prepare('UPDATE coin_wallets SET balance = ? WHERE client_id = ?').run(newBalance, originalTx.clientId);

    // Create adjustment transaction
    const adjustmentTx: CoinTransaction = {
      id: `TX-COIN-REV-${Date.now()}`,
      clientId: originalTx.clientId,
      amount: offsetAmount,
      type: 'credit_adjusted',
      note: `Reversal of TX #${originalTx.id}: ${reason}`,
      resultingBalance: newBalance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert adjustment tx into SQLite
    this.sqlite.prepare(`
      INSERT INTO coin_transactions (
        id, client_id, amount, type, note, resulting_balance,
        created_by_staff_id, created_by_staff_name, created_at,
        is_bonus, reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, NULL, NULL)
    `).run(
      adjustmentTx.id,
      adjustmentTx.clientId,
      adjustmentTx.amount,
      adjustmentTx.type,
      adjustmentTx.note,
      adjustmentTx.resultingBalance,
      adjustmentTx.createdByStaffId,
      adjustmentTx.createdByStaffName,
      adjustmentTx.createdAt
    );

    this.notifyClient(originalTx.clientId, 'ยกเลิกรายการธุรกรรม (Reversal)', `ระบบได้ทำการปรับปรุงยกเลิกรายการ #${originalTx.id} ยอดคงเหลือปัจจุบันคือ ${newBalance.toLocaleString()} Coins (เหตุผล: ${reason})`);
    this.logAudit(staffId, staffName, 'REVERSE_COIN_TX', 'coin', originalTx.clientId, reason, originalTx, adjustmentTx);

    this.saveToDisk();
    return adjustmentTx;
  }

  // Points Wallet Operations
  public getPointsWallet(clientId: string): PointsWallet {
    const row = this.sqlite.prepare('SELECT * FROM points_wallets WHERE client_id = ?').get(clientId);
    if (!row) {
      const initialWallet: PointsWallet = {
        clientId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        tier: 'Bronze',
      };
      this.sqlite.prepare(`
        INSERT INTO points_wallets (id, client_id, balance, lifetime_earned, lifetime_redeemed, tier)
        VALUES (?, ?, 0, 0, 0, 'Bronze')
      `).run(`PW-${clientId}`, clientId);
      return initialWallet;
    }
    return rowToPointsWallet(row);
  }

  public getPointsTransactions(clientId: string): PointsTransaction[] {
    const rows = this.sqlite.prepare('SELECT * FROM points_transactions WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    return rows.map(rowToPointsTransaction);
  }

  public getAllPointsTransactions(): PointsTransaction[] {
    const rows = this.sqlite.prepare('SELECT * FROM points_transactions ORDER BY created_at DESC').all();
    return rows.map(rowToPointsTransaction);
  }

  public addPoints(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string,
    sourceType: PointsSourceType = 'direct_service',
    relatedIds?: { relatedCoinTxId?: string; relatedPackageId?: string; relatedCouponId?: string; relatedOneTimeBookingId?: string }
  ): PointsTransaction {
    if (amount <= 0) {
      throw new Error('Points amount must be greater than 0');
    }

    const wallet = this.getPointsWallet(clientId);
    wallet.balance += amount;
    wallet.lifetimeEarned += amount;
    wallet.tier = getTierFromPoints(wallet.lifetimeEarned);

    // Update wallet in SQLite
    this.sqlite.prepare(`
      UPDATE points_wallets
      SET balance = ?, lifetime_earned = ?, tier = ?
      WHERE client_id = ?
    `).run(wallet.balance, wallet.lifetimeEarned, wallet.tier, clientId);

    const tx: PointsTransaction = {
      id: `TX-PTS-${Date.now()}`,
      clientId,
      amount,
      type: 'points_earned',
      note: note || 'Points awarded by staff',
      sourceType,
      relatedCoinTxId: relatedIds?.relatedCoinTxId,
      relatedPackageId: relatedIds?.relatedPackageId,
      relatedCouponId: relatedIds?.relatedCouponId,
      relatedOneTimeBookingId: relatedIds?.relatedOneTimeBookingId,
      resultingBalance: wallet.balance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert transaction into SQLite
    this.sqlite.prepare(`
      INSERT INTO points_transactions (
        id, client_id, amount, type, note, source_type,
        related_coin_tx_id, related_package_id, related_coupon_id, related_onetime_booking_id,
        resulting_balance, created_by_staff_id, created_by_staff_name, created_at,
        reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `).run(
      tx.id,
      tx.clientId,
      tx.amount,
      tx.type,
      tx.note,
      tx.sourceType || null,
      tx.relatedCoinTxId || null,
      tx.relatedPackageId || null,
      tx.relatedCouponId || null,
      tx.relatedOneTimeBookingId || null,
      tx.resultingBalance,
      tx.createdByStaffId,
      tx.createdByStaffName,
      tx.createdAt
    );

    this.notifyClient(clientId, 'ได้รับคะแนนสะสมใหม่', `คุณได้รับ +${amount.toLocaleString()} คะแนนสะสม! ยอดคะแนนสะสมรวมปัจจุบันคือ ${wallet.balance.toLocaleString()} คะแนน`);
    this.logAudit(staffId, staffName, 'AWARD_POINTS', 'points', clientId, note, null, wallet);

    this.saveToDisk();
    return tx;
  }

  public redeemPoints(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string
  ): PointsTransaction {
    if (amount <= 0) {
      throw new Error('Points amount must be greater than 0');
    }

    const wallet = this.getPointsWallet(clientId);
    if (wallet.balance < amount) {
      throw new Error(`Insufficient points balance. Current balance is ${wallet.balance} pts.`);
    }

    wallet.balance -= amount;
    wallet.lifetimeRedeemed += amount;

    // Update wallet in SQLite
    this.sqlite.prepare(`
      UPDATE points_wallets
      SET balance = ?, lifetime_redeemed = ?
      WHERE client_id = ?
    `).run(wallet.balance, wallet.lifetimeRedeemed, clientId);

    const tx: PointsTransaction = {
      id: `TX-PTS-${Date.now()}`,
      clientId,
      amount,
      type: 'points_redeemed',
      note: note || 'Points redeemed for in-store reward',
      resultingBalance: wallet.balance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert into SQLite
    this.sqlite.prepare(`
      INSERT INTO points_transactions (
        id, client_id, amount, type, note, source_type,
        related_coin_tx_id, related_package_id, related_coupon_id, related_onetime_booking_id,
        resulting_balance, created_by_staff_id, created_by_staff_name, created_at,
        reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `).run(
      tx.id,
      tx.clientId,
      tx.amount,
      tx.type,
      tx.note,
      tx.resultingBalance,
      tx.createdByStaffId,
      tx.createdByStaffName,
      tx.createdAt
    );

    this.notifyClient(clientId, 'ใช้คะแนนแลกของรางวัล', `พนักงานทำการตัดคะแนน -${amount.toLocaleString()} คะแนน ยอดคะแนนสะสมคงเหลือคือ ${wallet.balance.toLocaleString()} คะแนน`);
    this.logAudit(staffId, staffName, 'REDEEM_POINTS', 'points', clientId, note, null, wallet);

    this.saveToDisk();
    return tx;
  }

  public reversePointsTransaction(
    txId: string,
    reason: string,
    staffId: string,
    staffName: string
  ): PointsTransaction {
    const row = this.sqlite.prepare('SELECT * FROM points_transactions WHERE id = ?').get(txId);
    if (!row) {
      throw new Error('Points transaction not found');
    }
    const originalTx = rowToPointsTransaction(row);
    if (originalTx.reversed) {
      throw new Error('Points transaction has already been reversed');
    }

    const wallet = this.getPointsWallet(originalTx.clientId);
    const offsetAmount = -originalTx.amount;

    if (wallet.balance + offsetAmount < 0) {
      throw new Error('Reversal would result in negative points balance');
    }

    const reversedAt = new Date().toISOString();

    // Mark original as reversed in SQLite
    this.sqlite.prepare(`
      UPDATE points_transactions
      SET reversed = 1, reversal_reason = ?, reversed_at = ?, reversed_by_staff_name = ?
      WHERE id = ?
    `).run(reason, reversedAt, staffName, originalTx.id);

    originalTx.reversed = true;
    originalTx.reversalReason = reason;
    originalTx.reversedAt = reversedAt;
    originalTx.reversedByStaffName = staffName;

    wallet.balance += offsetAmount;
    if (originalTx.amount > 0) {
      wallet.lifetimeEarned = Math.max(0, wallet.lifetimeEarned - originalTx.amount);
      wallet.tier = getTierFromPoints(wallet.lifetimeEarned);
    } else {
      wallet.lifetimeRedeemed = Math.max(0, wallet.lifetimeRedeemed - Math.abs(originalTx.amount));
    }

    // Update wallet in SQLite
    this.sqlite.prepare(`
      UPDATE points_wallets
      SET balance = ?, lifetime_earned = ?, lifetime_redeemed = ?, tier = ?
      WHERE client_id = ?
    `).run(wallet.balance, wallet.lifetimeEarned, wallet.lifetimeRedeemed, wallet.tier, originalTx.clientId);

    const adjustmentTx: PointsTransaction = {
      id: `TX-PTS-REV-${Date.now()}`,
      clientId: originalTx.clientId,
      amount: offsetAmount,
      type: 'points_adjusted',
      note: `Reversal of Points TX #${originalTx.id}: ${reason}`,
      resultingBalance: wallet.balance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    // Insert adjustment tx in SQLite
    this.sqlite.prepare(`
      INSERT INTO points_transactions (
        id, client_id, amount, type, note, source_type,
        related_coin_tx_id, related_package_id, related_coupon_id, related_onetime_booking_id,
        resulting_balance, created_by_staff_id, created_by_staff_name, created_at,
        reversed, reversal_reason, reversed_at, reversed_by_staff_name
      )
      VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `).run(
      adjustmentTx.id,
      adjustmentTx.clientId,
      adjustmentTx.amount,
      adjustmentTx.type,
      adjustmentTx.note,
      adjustmentTx.resultingBalance,
      adjustmentTx.createdByStaffId,
      adjustmentTx.createdByStaffName,
      adjustmentTx.createdAt
    );

    this.notifyClient(originalTx.clientId, 'ปรับปรุงยกเลิกรายการคะแนน', `ระบบได้ทำการยกเลิกรายการคะแนน #${originalTx.id} ยอดคะแนนสะสมปัจจุบันคือ ${wallet.balance.toLocaleString()} คะแนน (เหตุผล: ${reason})`);
    this.logAudit(staffId, staffName, 'REVERSE_POINTS_TX', 'points', originalTx.clientId, reason, originalTx, adjustmentTx);

    this.saveToDisk();
    return adjustmentTx;
  }

  // Catalog Templates Management
  public getCatalogItems(): CatalogItem[] {
    const rows = this.sqlite.prepare('SELECT * FROM catalog_items ORDER BY created_at DESC').all();
    return rows.map(rowToCatalogItem);
  }

  public createCatalogItem(
    data: Omit<CatalogItem, 'id' | 'createdAt'>,
    staffId: string,
    staffName: string
  ): CatalogItem {
    const typePrefix = data.type === 'package' ? 'PKG' : data.type === 'onetime' ? 'ONE' : 'CPN';
    const newItem: CatalogItem = {
      id: `CAT-${typePrefix}-${Date.now()}`,
      type: data.type,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      price: data.price,
      validityDays: data.validityDays,
      defaultSessions: data.type === 'package' ? data.defaultSessions || 1 : undefined,
      category: data.category || '',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      isCrmMarketingVoucher: data.type === 'coupon' ? Boolean(data.isCrmMarketingVoucher) : false,
    };

    this.sqlite.prepare(`
      INSERT INTO catalog_items (
        id, type, name, description, image_url, price, validity_days,
        default_sessions, category, keywords, active, created_at, is_crm_marketing_voucher
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newItem.id,
      newItem.type,
      newItem.name,
      newItem.description || null,
      newItem.imageUrl || null,
      newItem.price,
      newItem.validityDays,
      newItem.defaultSessions !== undefined ? newItem.defaultSessions : null,
      newItem.category || null,
      newItem.keywords ? JSON.stringify(newItem.keywords) : null,
      newItem.active ? 1 : 0,
      newItem.createdAt,
      newItem.isCrmMarketingVoucher ? 1 : 0
    );

    this.logAudit(staffId, staffName, 'CREATE_CATALOG_ITEM', 'catalog', newItem.id, 'New catalog service created', null, newItem);
    this.saveToDisk();
    return newItem;
  }

  public updateCatalogItem(
    id: string,
    updates: Partial<CatalogItem>,
    staffId: string,
    staffName: string
  ): CatalogItem {
    const row = this.sqlite.prepare('SELECT * FROM catalog_items WHERE id = ?').get(id);
    if (!row) throw new Error('Catalog item not found');

    const item = rowToCatalogItem(row);
    const prev = { ...item };
    const updated = { ...item, ...updates };

    this.sqlite.prepare(`
      UPDATE catalog_items
      SET type = ?, name = ?, description = ?, image_url = ?, price = ?,
          validity_days = ?, default_sessions = ?, category = ?, keywords = ?,
          active = ?, is_crm_marketing_voucher = ?
      WHERE id = ?
    `).run(
      updated.type,
      updated.name,
      updated.description || null,
      updated.imageUrl || null,
      updated.price,
      updated.validityDays,
      updated.defaultSessions !== undefined ? updated.defaultSessions : null,
      updated.category || null,
      updated.keywords ? JSON.stringify(updated.keywords) : null,
      updated.active ? 1 : 0,
      updated.isCrmMarketingVoucher ? 1 : 0,
      id
    );

    this.logAudit(staffId, staffName, 'UPDATE_CATALOG_ITEM', 'catalog', updated.id, 'Catalog service updated', prev, updated);
    this.saveToDisk();
    return updated;
  }

  public bulkUpdateCatalogPrices(
    itemIds: string[],
    adjustmentType: 'percent' | 'fixed',
    value: number,
    staffId: string,
    staffName: string
  ): CatalogItem[] {
    const updatedItems: CatalogItem[] = [];
    const getItemStmt = this.sqlite.prepare('SELECT * FROM catalog_items WHERE id = ?');
    const updatePriceStmt = this.sqlite.prepare('UPDATE catalog_items SET price = ? WHERE id = ?');

    itemIds.forEach((id) => {
      const row = getItemStmt.get(id);
      if (!row) return;

      const item = rowToCatalogItem(row);
      const prevPrice = item.price;
      let newPrice = prevPrice;

      if (adjustmentType === 'percent') {
        newPrice = Math.round(prevPrice * (1 + value / 100));
      } else if (adjustmentType === 'fixed') {
        newPrice = Math.max(0, Math.round(prevPrice + value));
      }

      item.price = newPrice;
      updatePriceStmt.run(newPrice, id);
      updatedItems.push(item);

      this.logAudit(
        staffId,
        staffName,
        'BULK_UPDATE_CATALOG_PRICE',
        'catalog',
        item.id,
        `Price adjusted from ฿${prevPrice} to ฿${newPrice} (${adjustmentType === 'percent' ? `${value}%` : `฿${value}`})`,
        { price: prevPrice },
        { price: newPrice }
      );
    });

    this.saveToDisk();
    return updatedItems;
  }

  // Sell/Issue Packages to Clients
  public getClientPackages(clientId: string): ClientPackage[] {
    this.refreshItemStatuses();
    const rows = this.sqlite.prepare('SELECT * FROM client_packages WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    return rows.map(rowToClientPackage);
  }

  public sellPackageToClient(
    clientId: string,
    catalogId: string,
    totalSessions: number,
    pricePaid: number,
    validityDays: number,
    staffId: string,
    staffName: string
  ): ClientPackage {
    const catalog = this.getCatalogItems().find((c) => c.id === catalogId);
    const client = this.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const clientPkg: ClientPackage = {
      id: `CPKG-${Date.now()}`,
      clientId,
      catalogId: catalogId || 'CUSTOM',
      name: catalog?.name || 'Custom Package',
      description: catalog?.description || 'Custom package issued by staff',
      imageUrl: catalog?.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      totalSessions,
      remainingSessions: totalSessions,
      pricePaid,
      purchaseDate: purchaseDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'active',
      createdAt: purchaseDate.toISOString(),
      usageLogs: [],
    };

    this.sqlite.prepare(`
      INSERT INTO client_packages (
        id, client_id, catalog_id, name, description, image_url,
        total_sessions, remaining_sessions, price_paid, purchase_date,
        expiry_date, status, used_up_at, created_at, usage_logs,
        follow_up_status, follow_up_note, follow_up_updated_at, follow_up_updated_by_staff_name,
        voided_at, voided_by, void_reason
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, NULL, ?, ?,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL
      )
    `).run(
      clientPkg.id,
      clientPkg.clientId,
      clientPkg.catalogId,
      clientPkg.name,
      clientPkg.description || null,
      clientPkg.imageUrl || null,
      clientPkg.totalSessions,
      clientPkg.remainingSessions,
      clientPkg.pricePaid,
      clientPkg.purchaseDate,
      clientPkg.expiryDate,
      clientPkg.status,
      clientPkg.createdAt,
      JSON.stringify(clientPkg.usageLogs)
    );

    if (pricePaid > 0) {
      const ptsEarned = Math.floor(pricePaid / BAHT_PER_POINT);
      if (ptsEarned > 0) {
        this.addPoints(
          clientId,
          ptsEarned,
          `สะสมคะแนนจากการซื้อแพ็กเกจ: ${clientPkg.name} (฿${pricePaid.toLocaleString()})`,
          staffId,
          staffName,
          'package_sale',
          { relatedPackageId: clientPkg.id }
        );
      }
    }
    this.refreshItemStatuses();

    this.notifyClient(clientId, 'ออกแพ็กเกจบริการใหม่เรียบร้อย', `คุณได้รับแพ็กเกจ "${clientPkg.name}" (จำนวน ${totalSessions} ครั้ง) สามารถเข้าใช้บริการได้เลย`);
    this.logAudit(staffId, staffName, 'SELL_PACKAGE', 'package', clientPkg.id, `Issued package to ${client.displayName}`, null, clientPkg);

    this.saveToDisk();
    return clientPkg;
  }

  public usePackageSession(
    clientPackageId: string,
    note: string,
    staffId: string,
    staffName: string
  ): ClientPackage {
    const row = this.sqlite.prepare('SELECT * FROM client_packages WHERE id = ?').get(clientPackageId);
    if (!row) throw new Error('Client package not found');
    const pkg = rowToClientPackage(row);
    if (pkg.remainingSessions <= 0) throw new Error('Package has no remaining sessions (used up)');

    pkg.remainingSessions -= 1;
    const sessionNumber = pkg.totalSessions - pkg.remainingSessions;

    const log = {
      id: `LOG-PKG-${Date.now()}`,
      clientPackageId: pkg.id,
      clientId: pkg.clientId,
      sessionNumber,
      usedAt: new Date().toISOString(),
      staffId,
      staffName,
      note: note || `Session ${sessionNumber} used`,
    };

    pkg.usageLogs.unshift(log);

    if (pkg.remainingSessions === 0) {
      pkg.status = 'used_up';
      pkg.usedUpAt = new Date().toISOString();
    }

    this.sqlite.prepare(`
      UPDATE client_packages
      SET remaining_sessions = ?, status = ?, used_up_at = ?, usage_logs = ?
      WHERE id = ?
    `).run(
      pkg.remainingSessions,
      pkg.status,
      pkg.usedUpAt || null,
      JSON.stringify(pkg.usageLogs),
      pkg.id
    );

    this.notifyClient(pkg.clientId, 'ตัดใช้บริการแพ็กเกจ 1 ครั้ง', `บันทึกการใช้บริการ 1 ครั้งสำหรับแพ็กเกจ "${pkg.name}" คงเหลืออีก ${pkg.remainingSessions} ครั้ง`);
    this.logAudit(staffId, staffName, 'USE_PACKAGE_SESSION', 'package', pkg.id, note || `Used session ${sessionNumber}`, null, log);

    this.saveToDisk();
    return pkg;
  }

  public voidClientPackage(
    clientPackageId: string,
    staffId: string,
    staffName: string,
    reason: string
  ): ClientPackage {
    const row = this.sqlite.prepare('SELECT * FROM client_packages WHERE id = ?').get(clientPackageId);
    if (!row) throw new Error('Client package not found');
    const pkg = rowToClientPackage(row);
    if (pkg.status === 'voided') throw new Error('This package has already been voided');

    const previousData = { ...pkg };
    pkg.status = 'voided';
    pkg.voidedAt = new Date().toISOString();
    pkg.voidedBy = staffName;
    pkg.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    this.sqlite.prepare(`
      UPDATE client_packages
      SET status = ?, voided_at = ?, voided_by = ?, void_reason = ?
      WHERE id = ?
    `).run(
      pkg.status,
      pkg.voidedAt,
      pkg.voidedBy,
      pkg.voidReason,
      pkg.id
    );

    // Reverse any points awarded for this package
    const relatedPtsTx = this.getAllPointsTransactions().find(
      (tx) => tx.relatedPackageId === clientPackageId && tx.type === 'points_earned' && !tx.reversed
    );
    if (relatedPtsTx) {
      try {
        this.reversePointsTransaction(relatedPtsTx.id, `ยกเลิกแพ็กเกจ: ${reason || 'คีย์ผิด/ยกเลิก'}`, staffId, staffName);
      } catch (err) {
        console.warn('Could not reverse points for voided package:', err);
      }
    }

    this.notifyClient(
      pkg.clientId,
      'ยกเลิกรายการแพ็กเกจ',
      `แพ็กเกจ "${pkg.name}" ถูกยกเลิกโดยผู้ดูแลระบบ (${reason || 'คีย์ข้อมูลผิด'}) รายได้และคะแนนสะสมที่เกี่ยวข้องถูกปรับปรุงแล้ว`
    );

    this.logAudit(staffId, staffName, 'VOID_PACKAGE', 'package', pkg.id, reason || 'ยกเลิกแพ็กเกจ', previousData, pkg);
    this.saveToDisk();
    return pkg;
  }

  // Issue Coupons to Clients
  public getClientCoupons(clientId: string): ClientCoupon[] {
    this.refreshItemStatuses();
    const rows = this.sqlite.prepare('SELECT * FROM client_coupons WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    return rows.map(rowToClientCoupon);
  }

  public issueCouponToClient(
    clientId: string,
    catalogId: string,
    totalQuantity: number,
    pricePaid: number,
    validityDays: number,
    staffId: string,
    staffName: string
  ): ClientCoupon {
    const catalog = this.getCatalogItems().find((c) => c.id === catalogId);
    const client = this.getClientById(clientId);
    if (!client) throw new Error('Client not found');

    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const couponCode = `CPN-${client.memberCode.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const coupon: ClientCoupon = {
      id: `CCPN-${Date.now()}`,
      clientId,
      catalogId: catalogId || 'CUSTOM',
      name: catalog?.name || 'Custom Coupon',
      description: catalog?.description || 'Special coupon issued by staff',
      imageUrl: catalog?.imageUrl || 'https://images.unsplash.com/photo-1512290900673-3f149ff93ff2?auto=format&fit=crop&w=800&q=80',
      couponCode,
      totalQuantity,
      usedQuantity: 0,
      remainingQuantity: totalQuantity,
      pricePaid,
      purchaseDate: purchaseDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'active',
      createdAt: purchaseDate.toISOString(),
      redemptionLogs: [],
      isCrmMarketingVoucher: catalog?.isCrmMarketingVoucher || false,
    };

    this.sqlite.prepare(`
      INSERT INTO client_coupons (
        id, client_id, catalog_id, name, description, image_url,
        coupon_code, total_quantity, used_quantity, remaining_quantity,
        price_paid, purchase_date, expiry_date, status, used_up_at,
        created_at, redemption_logs, follow_up_status, follow_up_note,
        follow_up_updated_at, follow_up_updated_by_staff_name,
        is_crm_marketing_voucher, voided_at, voided_by, void_reason
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, NULL,
        ?, ?, NULL, NULL,
        NULL, NULL,
        ?, NULL, NULL, NULL
      )
    `).run(
      coupon.id,
      coupon.clientId,
      coupon.catalogId,
      coupon.name,
      coupon.description || null,
      coupon.imageUrl || null,
      coupon.couponCode,
      coupon.totalQuantity,
      coupon.usedQuantity,
      coupon.remainingQuantity,
      coupon.pricePaid,
      coupon.purchaseDate,
      coupon.expiryDate,
      coupon.status,
      coupon.createdAt,
      JSON.stringify(coupon.redemptionLogs),
      coupon.isCrmMarketingVoucher ? 1 : 0
    );

    if (!coupon.isCrmMarketingVoucher && pricePaid > 0) {
      const ptsEarned = Math.floor(pricePaid / BAHT_PER_POINT);
      if (ptsEarned > 0) {
        this.addPoints(
          clientId,
          ptsEarned,
          `สะสมคะแนนจากการซื้อคูปอง: ${coupon.name} (฿${pricePaid.toLocaleString()})`,
          staffId,
          staffName,
          'coupon_sale',
          { relatedCouponId: coupon.id }
        );
      }
    }
    this.refreshItemStatuses();

    this.notifyClient(clientId, 'ได้รับคูปองสิทธิพิเศษใหม่', `คุณได้รับคูปอง "${coupon.name}" (รหัสคูปอง: ${couponCode}) สามารถแจ้งพนักงานเมื่อรับบริการ`);
    this.logAudit(staffId, staffName, 'ISSUE_COUPON', 'coupon', coupon.id, `Issued coupon to ${client.displayName}`, null, coupon);

    this.saveToDisk();
    return coupon;
  }

  public redeemCouponUnit(
    clientCouponId: string,
    note: string,
    staffId: string,
    staffName: string
  ): ClientCoupon {
    const row = this.sqlite.prepare('SELECT * FROM client_coupons WHERE id = ?').get(clientCouponId);
    if (!row) throw new Error('Client coupon not found');
    const cpn = rowToClientCoupon(row);
    if (cpn.usedQuantity >= cpn.totalQuantity) throw new Error('Coupon is fully used up');

    cpn.usedQuantity += 1;
    cpn.remainingQuantity = cpn.totalQuantity - cpn.usedQuantity;
    const redemptionNumber = cpn.usedQuantity;

    const log = {
      id: `LOG-CPN-${Date.now()}`,
      clientCouponId: cpn.id,
      clientId: cpn.clientId,
      redemptionNumber,
      redeemedAt: new Date().toISOString(),
      staffId,
      staffName,
      note: note || `Redeemed unit ${redemptionNumber}`,
    };

    cpn.redemptionLogs.unshift(log);

    if (cpn.isCrmMarketingVoucher) {
      const catalog = this.getCatalogItems().find((c) => c.id === cpn.catalogId);
      const unitCost = catalog && catalog.price > 0
        ? catalog.price / cpn.totalQuantity
        : 0;

      if (unitCost > 0) {
        const client = this.getClientById(cpn.clientId);
        const clientName = client ? `${client.displayName} (${client.nickname || ''})` : 'ลูกค้าทั่วไป';

        const expEntry: FinancialEntry = {
          id: `EXP-CPN-${Date.now()}`,
          type: 'expense',
          category: 'marketing_voucher_cost',
          categoryNameTh: 'ต้นทุนคูปองการตลาด (แจกฟรี)',
          title: `ลูกค้าใช้สิทธิ์ CRM Marketing Voucher: ${cpn.name} (${clientName})`,
          amount: unitCost,
          date: new Date().toISOString().split('T')[0],
          note: note || `Redeemed unit ${redemptionNumber}`,
          clientId: cpn.clientId,
          clientName: clientName,
          sourceTxId: log.id,
          createdByStaffId: staffId,
          createdByStaffName: staffName,
          createdAt: new Date().toISOString(),
          isAutoGenerated: true,
        };
        this.sqlite.prepare(`
          INSERT INTO financial_entries (
            id, type, category, category_name_th, title, amount, date,
            note, client_id, client_name, source_tx_id, created_by_staff_id,
            created_by_staff_name, created_at, is_auto_generated
          )
          VALUES (
            @id, @type, @category, @categoryNameTh, @title, @amount, @date,
            @note, @clientId, @clientName, @sourceTxId, @createdByStaffId,
            @createdByStaffName, @createdAt, 1
          )
        `).run({
          id: expEntry.id,
          type: expEntry.type,
          category: expEntry.category,
          categoryNameTh: expEntry.categoryNameTh,
          title: expEntry.title,
          amount: expEntry.amount,
          date: expEntry.date,
          note: expEntry.note || null,
          clientId: expEntry.clientId || null,
          clientName: expEntry.clientName || null,
          sourceTxId: expEntry.sourceTxId || null,
          createdByStaffId: expEntry.createdByStaffId,
          createdByStaffName: expEntry.createdByStaffName,
          createdAt: expEntry.createdAt,
        });
      }
    }

    if (cpn.remainingQuantity === 0) {
      cpn.status = 'used_up';
      cpn.usedUpAt = new Date().toISOString();
    }

    this.sqlite.prepare(`
      UPDATE client_coupons
      SET used_quantity = ?, remaining_quantity = ?, status = ?, used_up_at = ?, redemption_logs = ?
      WHERE id = ?
    `).run(
      cpn.usedQuantity,
      cpn.remainingQuantity,
      cpn.status,
      cpn.usedUpAt || null,
      JSON.stringify(cpn.redemptionLogs),
      cpn.id
    );

    this.notifyClient(cpn.clientId, 'ตัดใช้สิทธิ์คูปองเรียบร้อย', `พนักงานได้ทำการตัดใช้สิทธิ์ 1 ครั้งสำหรับคูปอง "${cpn.name}" คงเหลืออีก ${cpn.remainingQuantity} สิทธิ์`);
    this.logAudit(staffId, staffName, 'REDEEM_COUPON_UNIT', 'coupon', cpn.id, note || `Redeemed unit ${redemptionNumber}`, null, log);

    this.saveToDisk();
    return cpn;
  }

  public voidClientCoupon(
    clientCouponId: string,
    staffId: string,
    staffName: string,
    reason: string
  ): ClientCoupon {
    const row = this.sqlite.prepare('SELECT * FROM client_coupons WHERE id = ?').get(clientCouponId);
    if (!row) throw new Error('Client coupon not found');
    const cpn = rowToClientCoupon(row);
    if (cpn.status === 'voided') throw new Error('This coupon has already been voided');

    const previousData = { ...cpn };
    cpn.status = 'voided';
    cpn.voidedAt = new Date().toISOString();
    cpn.voidedBy = staffName;
    cpn.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    this.sqlite.prepare(`
      UPDATE client_coupons
      SET status = ?, voided_at = ?, voided_by = ?, void_reason = ?
      WHERE id = ?
    `).run(
      cpn.status,
      cpn.voidedAt,
      cpn.voidedBy,
      cpn.voidReason,
      cpn.id
    );

    // Reverse any points awarded for this coupon
    const relatedPtsTx = this.getAllPointsTransactions().find(
      (tx) => tx.relatedCouponId === clientCouponId && tx.type === 'points_earned' && !tx.reversed
    );
    if (relatedPtsTx) {
      try {
        this.reversePointsTransaction(relatedPtsTx.id, `ยกเลิกคูปอง: ${reason || 'คีย์ผิด/ยกเลิก'}`, staffId, staffName);
      } catch (err) {
        console.warn('Could not reverse points for voided coupon:', err);
      }
    }

    this.notifyClient(
      cpn.clientId,
      'ยกเลิกรายการคูปอง',
      `คูปอง "${cpn.name}" (รหัส: ${cpn.couponCode}) ถูกยกเลิกโดยผู้ดูแลระบบ (${reason || 'คีย์ข้อมูลผิด'}) รายได้และคะแนนสะสมที่เกี่ยวข้องถูกปรับปรุงแล้ว`
    );

    this.logAudit(staffId, staffName, 'VOID_COUPON', 'coupon', cpn.id, reason || 'ยกเลิกคูปอง', previousData, cpn);
    this.saveToDisk();
    return cpn;
  }

  public getAllRawOneTimeBookings(): ClientOneTimeBooking[] {
    const rows = this.sqlite.prepare('SELECT * FROM client_one_time_bookings ORDER BY booking_date_time ASC').all();
    return rows.map(rowToClientOneTimeBooking);
  }

  // One-Time Service Bookings Operations
  public getAllOneTimeBookings(): (ClientOneTimeBooking & { clientName: string; clientPhone: string; clientProfilePic?: string; clientCoinBalance?: number })[] {
    const now = new Date();
    const rows = this.sqlite.prepare("SELECT * FROM client_one_time_bookings WHERE status = 'booked' ORDER BY booking_date_time ASC").all();
    const allBookings = rows.map(rowToClientOneTimeBooking);
    return allBookings
      .filter((b) => new Date(b.bookingDateTime) >= now)
      .map((b) => {
        const client = this.getClientById(b.clientId);
        return {
          ...b,
          clientName: client ? `${client.displayName}${client.nickname ? ` (${client.nickname})` : ''}` : 'ไม่พบข้อมูลลูกค้า',
          clientPhone: client?.phone || '-',
          clientProfilePic: client?.profilePic || undefined,
          clientCoinBalance: client ? this.getCoinBalance(client.id) : 0,
        };
      })
      .sort((a, b) => new Date(a.bookingDateTime).getTime() - new Date(b.bookingDateTime).getTime());
  }

  public getAllActivePackages(): Array<{
    packageId: string;
    clientId: string;
    clientName: string;
    clientPhone: string;
    clientProfilePic?: string;
    packageName: string;
    sessionsUsed: number;
    totalSessions: number;
    remainingSessions: number;
    expiryDate: string;
  }> {
    const rows = this.sqlite.prepare("SELECT * FROM client_packages WHERE status IN ('active', 'expiring_soon') ORDER BY expiry_date ASC").all();
    const packages = rows.map(rowToClientPackage);
    const result: Array<{
      packageId: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      clientProfilePic?: string;
      packageName: string;
      sessionsUsed: number;
      totalSessions: number;
      remainingSessions: number;
      expiryDate: string;
    }> = [];
    const allClients = this.getClients();
    const clientMap = new Map(allClients.map((c) => [c.id, c]));

    for (const pkg of packages) {
      const client = clientMap.get(pkg.clientId);
      if (!client) continue;
      result.push({
        packageId: pkg.id,
        clientId: client.id,
        clientName: `${client.displayName}${client.nickname ? ` (${client.nickname})` : ''}`,
        clientPhone: client.phone || '-',
        clientProfilePic: client.profilePic || undefined,
        packageName: pkg.name,
        sessionsUsed: pkg.totalSessions - pkg.remainingSessions,
        totalSessions: pkg.totalSessions,
        remainingSessions: pkg.remainingSessions,
        expiryDate: pkg.expiryDate,
      });
    }
    return result.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  public rescheduleOneTimeBooking(
    bookingId: string,
    newBookingDateTime: string,
    newEndDateTime: string | undefined,
    staffId: string,
    staffName: string
  ): ClientOneTimeBooking {
    const row = this.sqlite.prepare('SELECT * FROM client_one_time_bookings WHERE id = ?').get(bookingId);
    if (!row) throw new Error('Booking not found');
    const booking = rowToClientOneTimeBooking(row);
    if (booking.status !== 'booked') throw new Error('ไม่สามารถเลื่อนนัดรายการที่ใช้บริการหรือยกเลิกไปแล้วได้');

    const previousData = { ...booking };
    const oldDateTime = booking.bookingDateTime;
    booking.bookingDateTime = newBookingDateTime;
    booking.endDateTime = newEndDateTime || undefined;

    this.sqlite.prepare(`
      UPDATE client_one_time_bookings
      SET booking_date_time = ?, end_date_time = ?
      WHERE id = ?
    `).run(
      booking.bookingDateTime,
      booking.endDateTime || null,
      booking.id
    );

    this.notifyClient(
      booking.clientId,
      'เลื่อนนัดหมายบริการ',
      `นัดหมาย "${booking.name}" ถูกเลื่อนจากเดิมเป็นวันที่ใหม่เรียบร้อยแล้ว`
    );

    this.logAudit(
      staffId,
      staffName,
      'RESCHEDULE_ONETIME_BOOKING',
      'onetime_booking',
      booking.id,
      `เลื่อนนัดจาก ${oldDateTime} เป็น ${newBookingDateTime}`,
      previousData,
      booking
    );

    this.saveToDisk();
    return booking;
  }

  public getClientOneTimeBookings(clientId: string): ClientOneTimeBooking[] {
    const rows = this.sqlite.prepare('SELECT * FROM client_one_time_bookings WHERE client_id = ? ORDER BY booking_date_time DESC').all(clientId);
    return rows.map(rowToClientOneTimeBooking);
  }

  public bookOneTimeService(
    clientId: string,
    catalogId: string,
    fullPrice: number,
    depositAmount: number,
    paymentStatusAtBooking: 'deposit' | 'paid_full' | 'free' | 'deduct_package' | 'deduct_coupon' | 'coin',
    bookingDateTime: string,
    branch: string,
    staffId: string,
    staffName: string,
    endDateTime?: string,
    customName?: string,
    linkedPackageId?: string,
    linkedCouponId?: string,
    coinAmountUsed?: number,
    coinDiscountAtBooking?: number
  ): ClientOneTimeBooking {
    const catalog = catalogId ? this.getCatalogItems().find((c) => c.id === catalogId) : undefined;
    const finalName = customName?.trim() || catalog?.name || 'One-Time Service';
    const isFree = paymentStatusAtBooking === 'free';
    const isPrepaidOrFree = ['free', 'deduct_package', 'deduct_coupon', 'coin'].includes(paymentStatusAtBooking);
    
    // For free, deduct_package, deduct_coupon, coin: depositAmount must be 0
    let finalDeposit = isPrepaidOrFree ? 0 : depositAmount;
    const finalFullPrice = isFree ? 0 : fullPrice;

    if (!isPrepaidOrFree && coinDiscountAtBooking && coinDiscountAtBooking > 0) {
      if (coinDiscountAtBooking > finalDeposit) {
        throw new Error('ส่วนลด Coin มากกว่ายอดเงินสดที่รับชำระวันนี้');
      }
      this.deductCoinCredit(
        clientId,
        coinDiscountAtBooking,
        `ใช้ Coin เป็นส่วนลดตอนจองบริการ: ${finalName}`,
        staffId,
        staffName
      );
      finalDeposit -= coinDiscountAtBooking;
    }

    const booking: ClientOneTimeBooking = {
      id: `OTB-${Date.now()}`,
      clientId,
      catalogId: catalogId || '',
      name: finalName,
      description: catalog?.description || (customName ? 'บริการพิเศษ (Custom Service)' : ''),
      imageUrl: catalog?.imageUrl || '',
      fullPrice: finalFullPrice,
      depositAmount: finalDeposit,
      paymentStatusAtBooking,
      linkedPackageId: paymentStatusAtBooking === 'deduct_package' ? linkedPackageId : undefined,
      linkedCouponId: paymentStatusAtBooking === 'deduct_coupon' ? linkedCouponId : undefined,
      coinAmountUsed: paymentStatusAtBooking === 'coin' ? coinAmountUsed : (coinDiscountAtBooking || undefined),
      bookingDateTime,
      endDateTime: endDateTime || undefined,
      branch: branch || 'Me.My.Mind Spa & Massage',
      status: 'booked',
      createdAt: new Date().toISOString(),
      createdByStaffId: staffId,
      createdByStaffName: staffName,
    };

    this.sqlite.prepare(`
      INSERT INTO client_one_time_bookings (
        id, client_id, catalog_id, name, description, image_url,
        full_price, deposit_amount, payment_status_at_booking, linked_package_id,
        linked_coupon_id, coin_amount_used, remaining_amount_paid, booking_date_time,
        end_date_time, branch, status, used_at, voided_at, voided_by, void_reason,
        created_at, created_by_staff_id, created_by_staff_name
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 0, ?,
        ?, ?, ?, NULL, NULL, NULL, NULL,
        ?, ?, ?
      )
    `).run(
      booking.id,
      booking.clientId,
      booking.catalogId,
      booking.name,
      booking.description || null,
      booking.imageUrl || null,
      booking.fullPrice,
      booking.depositAmount,
      booking.paymentStatusAtBooking,
      booking.linkedPackageId || null,
      booking.linkedCouponId || null,
      booking.coinAmountUsed || 0,
      booking.bookingDateTime,
      booking.endDateTime || null,
      booking.branch,
      booking.status,
      booking.createdAt,
      booking.createdByStaffId,
      booking.createdByStaffName
    );

    // Only award points on booking creation if paying real deposit in cash/deposit mode
    if (!isPrepaidOrFree && finalDeposit > 0) {
      const ptsEarned = Math.floor(finalDeposit / BAHT_PER_POINT);
      if (ptsEarned > 0) {
        this.addPoints(
          clientId,
          ptsEarned,
          `สะสมคะแนนจากการจองบริการ: ${booking.name} (฿${finalDeposit.toLocaleString()})`,
          staffId,
          staffName,
          'onetime_booking',
          { relatedOneTimeBookingId: booking.id }
        );
      }
    }

    let paymentNote = '';
    if (paymentStatusAtBooking === 'free') {
      paymentNote = '(กิจกรรมฟรี - Free)';
    } else if (paymentStatusAtBooking === 'deduct_package') {
      paymentNote = '(ตัดจากแพ็กเกจ)';
    } else if (paymentStatusAtBooking === 'deduct_coupon') {
      paymentNote = '(ใช้สิทธิ์คูปอง)';
    } else if (paymentStatusAtBooking === 'coin') {
      paymentNote = `(ใช้ Coin ฿${(coinAmountUsed || 0).toLocaleString()})`;
    } else if (paymentStatusAtBooking === 'deposit') {
      paymentNote = `(มัดจำ ฿${finalDeposit.toLocaleString()})`;
    } else {
      paymentNote = `(ชำระเต็มจำนวน ฿${finalFullPrice.toLocaleString()})`;
    }

    this.notifyClient(
      clientId,
      'บันทึกการจองบริการเรียบร้อย',
      `พนักงานได้บันทึกการจองบริการ "${booking.name}" (${booking.branch}) สำหรับวันที่ ${bookingDateTime.replace('T', ' ')} ${paymentNote}`
    );

    this.logAudit(staffId, staffName, 'BOOK_ONETIME_SERVICE', 'onetime_booking', booking.id, 'จองบริการ One-Time', null, booking);
    this.saveToDisk();
    return booking;
  }

  public markOneTimeBookingUsed(
    bookingId: string,
    staffId: string,
    staffName: string,
    coinDiscountAmount?: number
  ): ClientOneTimeBooking {
    const row = this.sqlite.prepare('SELECT * FROM client_one_time_bookings WHERE id = ?').get(bookingId);
    if (!row) throw new Error('Booking not found');
    const booking = rowToClientOneTimeBooking(row);
    if (booking.status !== 'booked') throw new Error('Booking is not in a usable state');

    const previousData = { ...booking };

    // Execute deductions/point awards FIRST so if any method throws (e.g. insufficient coin/sessions), booking is not marked used
    if (booking.paymentStatusAtBooking === 'deduct_package' && booking.linkedPackageId) {
      this.usePackageSession(
        booking.linkedPackageId,
        `ใช้บริการ One-Time: ${booking.name} (ตัดจากแพ็กเกจ)`,
        staffId,
        staffName
      );
    } else if (booking.paymentStatusAtBooking === 'deduct_coupon' && booking.linkedCouponId) {
      this.redeemCouponUnit(
        booking.linkedCouponId,
        `ใช้บริการ One-Time: ${booking.name} (ใช้สิทธิ์คูปอง)`,
        staffId,
        staffName
      );
    } else if (booking.paymentStatusAtBooking === 'coin' && booking.coinAmountUsed && booking.coinAmountUsed > 0) {
      this.deductCoinCredit(
        booking.clientId,
        booking.coinAmountUsed,
        `ใช้บริการ One-Time: ${booking.name} (ตัด Coin)`,
        staffId,
        staffName
      );

      const remaining = booking.fullPrice - booking.coinAmountUsed;
      if (remaining > 0) {
        booking.remainingAmountPaid = remaining;
        const ptsEarned = Math.floor(remaining / BAHT_PER_POINT);
        if (ptsEarned > 0) {
          this.addPoints(
            booking.clientId,
            ptsEarned,
            `สะสมคะแนนจากยอดคงเหลือ (ส่วนที่ไม่ได้จ่ายด้วย Coin): ${booking.name} (฿${remaining.toLocaleString()})`,
            staffId,
            staffName,
            'onetime_booking',
            { relatedOneTimeBookingId: booking.id }
          );
        }
      }
    } else if (booking.paymentStatusAtBooking === 'deposit') {
      let remaining = booking.fullPrice - booking.depositAmount - (booking.coinAmountUsed || 0);

      if (coinDiscountAmount && coinDiscountAmount > 0) {
        if (coinDiscountAmount > remaining) {
          throw new Error('ส่วนลด Coin ที่ใช้มากกว่ายอดคงเหลือที่ต้องชำระ');
        }
        this.deductCoinCredit(
          booking.clientId,
          coinDiscountAmount,
          `ใช้ Coin เป็นส่วนลดสำหรับบริการ: ${booking.name}`,
          staffId,
          staffName
        );
        booking.coinAmountUsed = (booking.coinAmountUsed || 0) + coinDiscountAmount;
        remaining -= coinDiscountAmount;
      }

      if (remaining > 0) {
        booking.remainingAmountPaid = remaining;
        const ptsEarned = Math.floor(remaining / BAHT_PER_POINT);
        if (ptsEarned > 0) {
          this.addPoints(
            booking.clientId,
            ptsEarned,
            `สะสมคะแนนจากยอดคงเหลือของบริการ: ${booking.name} (฿${remaining.toLocaleString()})`,
            staffId,
            staffName,
            'onetime_booking',
            { relatedOneTimeBookingId: booking.id }
          );
        }
      } else {
        booking.remainingAmountPaid = 0;
      }
    }

    booking.status = 'used';
    booking.usedAt = new Date().toISOString();

    this.sqlite.prepare(`
      UPDATE client_one_time_bookings
      SET status = ?, used_at = ?, coin_amount_used = ?, remaining_amount_paid = ?
      WHERE id = ?
    `).run(
      booking.status,
      booking.usedAt,
      booking.coinAmountUsed || 0,
      booking.remainingAmountPaid || 0,
      booking.id
    );

    let notifyDetail = '';
    if (booking.paymentStatusAtBooking === 'deposit' && (booking.remainingAmountPaid || 0) > 0) {
      notifyDetail = ` (ชำระส่วนที่เหลือ ฿${booking.remainingAmountPaid?.toLocaleString()})`;
    } else if (booking.paymentStatusAtBooking === 'deduct_package') {
      notifyDetail = ` (ตัด 1 ครั้งจากแพ็กเกจ)`;
    } else if (booking.paymentStatusAtBooking === 'deduct_coupon') {
      notifyDetail = ` (ใช้สิทธิ์คูปอง 1 หน่วย)`;
    } else if (booking.paymentStatusAtBooking === 'coin') {
      notifyDetail = ` (ใช้ Coin ฿${(booking.coinAmountUsed || 0).toLocaleString()}${booking.remainingAmountPaid ? ` + ชำระส่วนที่เหลือ ฿${booking.remainingAmountPaid.toLocaleString()}` : ''})`;
    }

    this.notifyClient(
      booking.clientId,
      'ใช้บริการเรียบร้อย',
      `พนักงานได้บันทึกการเข้ารับบริการ "${booking.name}" เรียบร้อยแล้ว${notifyDetail}`
    );

    this.logAudit(staffId, staffName, 'MARK_ONETIME_USED', 'onetime_booking', booking.id, 'ใช้บริการ One-Time แล้ว', previousData, booking);
    this.saveToDisk();
    return booking;
  }

  public voidOneTimeBooking(
    bookingId: string,
    staffId: string,
    staffName: string,
    reason: string
  ): ClientOneTimeBooking {
    const row = this.sqlite.prepare('SELECT * FROM client_one_time_bookings WHERE id = ?').get(bookingId);
    if (!row) throw new Error('One-time booking not found');
    const booking = rowToClientOneTimeBooking(row);
    if (booking.status === 'voided') throw new Error('This booking has already been voided');

    const previousData = { ...booking };
    booking.status = 'voided';
    booking.voidedAt = new Date().toISOString();
    booking.voidedBy = staffName;
    booking.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    this.sqlite.prepare(`
      UPDATE client_one_time_bookings
      SET status = ?, voided_at = ?, voided_by = ?, void_reason = ?
      WHERE id = ?
    `).run(
      booking.status,
      booking.voidedAt,
      booking.voidedBy,
      booking.voidReason,
      booking.id
    );

    // Reverse any points awarded for this booking
    const relatedPtsTxs = this.getAllPointsTransactions().filter(
      (tx) => tx.relatedOneTimeBookingId === bookingId && tx.type === 'points_earned' && !tx.reversed
    );
    for (const ptsTx of relatedPtsTxs) {
      try {
        this.reversePointsTransaction(ptsTx.id, `ยกเลิกการจองบริการ One-Time: ${reason || 'คีย์ผิด/ยกเลิก'}`, staffId, staffName);
      } catch (err) {
        console.warn('Could not reverse points for voided booking:', err);
      }
    }

    this.notifyClient(
      booking.clientId,
      'ยกเลิกรายการจองบริการ',
      `รายการจองบริการ "${booking.name}" ถูกยกเลิกโดยผู้ดูแลระบบ (${reason || 'คีย์ข้อมูลผิด'}) รายได้และคะแนนสะสมที่เกี่ยวข้องถูกปรับปรุงแล้ว`
    );

    this.logAudit(staffId, staffName, 'VOID_ONETIME_BOOKING', 'onetime_booking', booking.id, reason || 'ยกเลิกการจอง', previousData, booking);
    this.saveToDisk();
    return booking;
  }

  // Expiring Items & Follow-Up Tasks
  public getExpiringTasks(): ExpiringItemTask[] {
    this.refreshItemStatuses();
    const tasks: ExpiringItemTask[] = [];
    const nowMs = Date.now();

    const clientMap = new Map<string, Client>();
    this.getClients().forEach((c) => clientMap.set(c.id, c));

    // Process Packages
    this.getAllClientPackages().forEach((pkg) => {
      if (pkg.status === 'voided' || pkg.remainingSessions <= 0) return;
      const client = clientMap.get(pkg.clientId);
      if (!client) return;

      const expMs = new Date(pkg.expiryDate).getTime();
      const daysRemaining = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));

      tasks.push({
        id: pkg.id,
        itemType: 'package',
        catalogId: pkg.catalogId,
        name: pkg.name,
        description: pkg.description,
        imageUrl: pkg.imageUrl,
        clientId: client.id,
        clientName: client.displayName,
        clientNickname: client.nickname || '',
        memberCode: client.memberCode,
        clientPhone: client.phone || '',
        clientProfilePic: client.profilePic,
        clientLineUserId: client.lineUserId,
        expiryDate: pkg.expiryDate,
        daysRemaining,
        remainingDetails: `คงเหลือ ${pkg.remainingSessions}/${pkg.totalSessions} ครั้ง`,
        followUpStatus: pkg.followUpStatus || 'not_contacted',
        followUpNote: pkg.followUpNote || '',
        followUpUpdatedAt: pkg.followUpUpdatedAt,
        followUpUpdatedByStaffName: pkg.followUpUpdatedByStaffName,
      });
    });

    // Process Coupons
    this.getAllClientCoupons().forEach((cpn) => {
      if (cpn.status === 'voided' || cpn.remainingQuantity <= 0) return;
      const client = clientMap.get(cpn.clientId);
      if (!client) return;

      const expMs = new Date(cpn.expiryDate).getTime();
      const daysRemaining = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));

      tasks.push({
        id: cpn.id,
        itemType: 'coupon',
        catalogId: cpn.catalogId,
        name: cpn.name,
        description: cpn.description,
        imageUrl: cpn.imageUrl,
        clientId: client.id,
        clientName: client.displayName,
        clientNickname: client.nickname || '',
        memberCode: client.memberCode,
        clientPhone: client.phone || '',
        clientProfilePic: client.profilePic,
        clientLineUserId: client.lineUserId,
        expiryDate: cpn.expiryDate,
        daysRemaining,
        remainingDetails: `คงเหลือ ${cpn.remainingQuantity}/${cpn.totalQuantity} ใบ`,
        followUpStatus: cpn.followUpStatus || 'not_contacted',
        followUpNote: cpn.followUpNote || '',
        followUpUpdatedAt: cpn.followUpUpdatedAt,
        followUpUpdatedByStaffName: cpn.followUpUpdatedByStaffName,
      });
    });

    tasks.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return tasks;
  }

  public updatePackageFollowUp(
    packageId: string,
    followUpStatus: FollowUpStatus,
    followUpNote: string,
    staffId: string,
    staffName: string
  ): ClientPackage {
    const row = this.sqlite.prepare('SELECT * FROM client_packages WHERE id = ?').get(packageId);
    if (!row) throw new Error('Client package not found');
    const pkg = rowToClientPackage(row);

    pkg.followUpStatus = followUpStatus;
    pkg.followUpNote = followUpNote;
    pkg.followUpUpdatedAt = new Date().toISOString();
    pkg.followUpUpdatedByStaffName = staffName;

    this.sqlite.prepare(`
      UPDATE client_packages
      SET follow_up_status = ?, follow_up_note = ?, follow_up_updated_at = ?, follow_up_updated_by_staff_name = ?
      WHERE id = ?
    `).run(
      pkg.followUpStatus,
      pkg.followUpNote,
      pkg.followUpUpdatedAt,
      pkg.followUpUpdatedByStaffName,
      pkg.id
    );

    this.logAudit(
      staffId,
      staffName,
      'UPDATE_PACKAGE_FOLLOWUP',
      'package',
      pkg.id,
      `Follow-up status: ${followUpStatus}, Note: ${followUpNote}`,
      null,
      { followUpStatus, followUpNote }
    );
    this.saveToDisk();
    return pkg;
  }

  public updateCouponFollowUp(
    couponId: string,
    followUpStatus: FollowUpStatus,
    followUpNote: string,
    staffId: string,
    staffName: string
  ): ClientCoupon {
    const row = this.sqlite.prepare('SELECT * FROM client_coupons WHERE id = ?').get(couponId);
    if (!row) throw new Error('Client coupon not found');
    const cpn = rowToClientCoupon(row);

    cpn.followUpStatus = followUpStatus;
    cpn.followUpNote = followUpNote;
    cpn.followUpUpdatedAt = new Date().toISOString();
    cpn.followUpUpdatedByStaffName = staffName;

    this.sqlite.prepare(`
      UPDATE client_coupons
      SET follow_up_status = ?, follow_up_note = ?, follow_up_updated_at = ?, follow_up_updated_by_staff_name = ?
      WHERE id = ?
    `).run(
      cpn.followUpStatus,
      cpn.followUpNote,
      cpn.followUpUpdatedAt,
      cpn.followUpUpdatedByStaffName,
      cpn.id
    );

    this.logAudit(
      staffId,
      staffName,
      'UPDATE_COUPON_FOLLOWUP',
      'coupon',
      cpn.id,
      `Follow-up status: ${followUpStatus}, Note: ${followUpNote}`,
      null,
      { followUpStatus, followUpNote }
    );
    this.saveToDisk();
    return cpn;
  }

  // Reward Catalog
  public getRewardCatalog(): RewardCatalogItem[] {
    const rows = this.sqlite.prepare('SELECT * FROM reward_catalog_items').all();
    return rows.map(rowToRewardCatalogItem);
  }

  public createRewardItem(data: Omit<RewardCatalogItem, 'id'>, staffId: string, staffName: string): RewardCatalogItem {
    const item: RewardCatalogItem = {
      id: `RWD-${Date.now()}`,
      name: data.name,
      description: data.description,
      pointsCost: Number(data.pointsCost),
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
      active: data.active ?? true,
      minTier: data.minTier || 'Bronze',
    };

    this.sqlite.prepare(`
      INSERT INTO reward_catalog_items (id, name, description, points_cost, image_url, active, min_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.name,
      item.description || null,
      item.pointsCost,
      item.imageUrl || null,
      item.active ? 1 : 0,
      item.minTier || null
    );

    this.logAudit(staffId, staffName, 'CREATE_REWARD', 'reward', item.id, 'New reward catalog item added', null, item);
    this.saveToDisk();
    return item;
  }

  public updateRewardItem(id: string, updates: Partial<RewardCatalogItem>, staffId: string, staffName: string): RewardCatalogItem {
    const row = this.sqlite.prepare('SELECT * FROM reward_catalog_items WHERE id = ?').get(id);
    if (!row) throw new Error('Reward catalog item not found');

    const item = rowToRewardCatalogItem(row);
    const prev = { ...item };
    const updated = { ...item, ...updates };
    if (updates.pointsCost !== undefined) updated.pointsCost = Number(updates.pointsCost);

    this.sqlite.prepare(`
      UPDATE reward_catalog_items
      SET name = ?, description = ?, points_cost = ?, image_url = ?, active = ?, min_tier = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description || null,
      updated.pointsCost,
      updated.imageUrl || null,
      updated.active ? 1 : 0,
      updated.minTier || null,
      id
    );

    this.logAudit(staffId, staffName, 'UPDATE_REWARD', 'reward', item.id, 'Updated reward catalog item', prev, updated);
    this.saveToDisk();
    return updated;
  }

  // Notifications
  public getNotifications(clientId: string): InAppNotification[] {
    const rows = this.sqlite.prepare('SELECT * FROM notifications WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
    return rows.map(rowToNotification);
  }

  public markNotificationAsRead(notifId: string) {
    this.sqlite.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notifId);
  }

  public markAllNotificationsAsRead(clientId: string): void {
    this.sqlite.prepare('UPDATE notifications SET read = 1 WHERE client_id = ?').run(clientId);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    const rows = this.sqlite.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 2000').all();
    return rows.map(rowToAuditLog);
  }

  // Financial Accounting Engine
  public getFinancialEntries(): FinancialEntry[] {
    const rows = this.sqlite.prepare('SELECT * FROM financial_entries ORDER BY date DESC, created_at DESC').all();
    const manual = rows.map(rowToFinancialEntry);
    const autoEntries: FinancialEntry[] = [];

    // Helper to format client name safely
    const formatClientName = (clientId: string): string => {
      const client = this.getClientById(clientId);
      if (!client) return 'ไม่พบข้อมูลลูกค้า (ถูกลบแล้ว)';
      return `${client.displayName}${client.nickname ? ` (${client.nickname})` : ''}`;
    };

    // 1. Auto-synthesize from Coin topups (ONLY non-bonus cash coin purchases)
    for (const tx of this.getAllCoinTransactions()) {
      if (tx.type === 'credit_added' && !tx.reversed && tx.amount > 0 && !tx.isBonus) {
        const clientName = formatClientName(tx.clientId);
        autoEntries.push({
          id: `AUTO-COIN-${tx.id}`,
          type: 'income',
          category: 'coin_purchase',
          categoryNameTh: 'เติม Cash Coin',
          title: `ลูกค้าเติม Cash Coin (${clientName})`,
          amount: tx.amount,
          date: tx.createdAt.split('T')[0],
          note: tx.note,
          clientId: tx.clientId,
          clientName: clientName,
          sourceTxId: tx.id,
          createdByStaffId: tx.createdByStaffId,
          createdByStaffName: tx.createdByStaffName,
          createdAt: tx.createdAt,
          isAutoGenerated: true,
        });
      }
    }

    // 2. Auto-synthesize from Points transactions (Direct cash/promptpay payments ONLY - exclude points awarded for Coin topups, Bonus Coins, Package or Coupon sales, or One-Time bookings)
    for (const tx of this.getAllPointsTransactions()) {
      if (tx.type === 'points_earned' && !tx.reversed) {
        const sourceType = tx.sourceType;
        const note = tx.note || '';

        // Structured filtering: Exclude points linked to Coin topups, Package sales, Coupon sales, One-Time bookings, or other non-direct sources
        const isExcludedSource = sourceType && ['coin_topup', 'package_sale', 'coupon_sale', 'onetime_booking'].includes(sourceType);
        const hasRelatedRef = Boolean(tx.relatedCoinTxId || tx.relatedPackageId || tx.relatedCouponId || tx.relatedOneTimeBookingId);

        // Fallback string matching for legacy/untyped records
        const isFromCoin = note.includes('เติมเงิน') || note.includes('Coin') || note.includes('โบนัส') || note.includes('Bonus');
        const isFromPackage = note.includes('คอร์ส') || note.includes('แพ็กเกจ') || note.includes('Package');
        const isFromCoupon = note.includes('คูปอง') || note.includes('Coupon');
        const isFromOneTime = note.includes('จองบริการ') || note.includes('One-Time') || note.includes('ยอดคงเหลือของบริการ');

        if (isExcludedSource || hasRelatedRef || isFromCoin || isFromPackage || isFromCoupon || isFromOneTime) {
          continue;
        }

        const clientName = formatClientName(tx.clientId);

        let spendAmt = 0;
        const match = note.match(/ยอดชำระ:\s*฿?\s*([0-9,]+)/i) || note.match(/฿\s*([0-9,]+)/);
        if (match) {
          spendAmt = Number(match[1].replace(/,/g, ''));
        } else if (tx.amount > 0) {
          // Use system constant: BAHT_PER_POINT (100 บาท = 1 แต้ม)
          spendAmt = tx.amount * BAHT_PER_POINT;
        }

        if (spendAmt > 0) {
          autoEntries.push({
            id: `AUTO-PTS-${tx.id}`,
            type: 'income',
            category: 'direct_service',
            categoryNameTh: 'ชำระเงินสด/โอนตรงหน้างาน',
            title: `ชำระเงินสด/โอนตรงหน้างาน (${clientName})`,
            amount: spendAmt,
            date: tx.createdAt.split('T')[0],
            note: tx.note,
            clientId: tx.clientId,
            clientName: clientName,
            sourceTxId: tx.id,
            createdByStaffId: tx.createdByStaffId,
            createdByStaffName: tx.createdByStaffName,
            createdAt: tx.createdAt,
            isAutoGenerated: true,
          });
        }
      }
    }

    // 3. Auto-synthesize from Client Packages sold
    for (const pkg of this.getAllClientPackages()) {
      if (pkg.pricePaid && pkg.pricePaid > 0 && pkg.status !== 'voided') {
        const clientName = formatClientName(pkg.clientId);
        autoEntries.push({
          id: `AUTO-PKG-${pkg.id}`,
          type: 'income',
          category: 'package_sale',
          categoryNameTh: 'ขายคอร์ส/แพ็กเกจ',
          title: `ขายคอร์ส/แพ็กเกจ ${pkg.name} (${clientName})`,
          amount: pkg.pricePaid,
          date: pkg.createdAt.split('T')[0],
          note: pkg.description,
          clientId: pkg.clientId,
          clientName: clientName,
          sourceTxId: pkg.id,
          createdByStaffId: 'EMP-01',
          createdByStaffName: 'Staff Manager',
          createdAt: pkg.createdAt,
          isAutoGenerated: true,
        });
      }
    }

    // 4. Auto-synthesize from Coupons sold (paid coupons only — exclude CRM Marketing Vouchers)
    for (const cpn of this.getAllClientCoupons()) {
      if (cpn.pricePaid && cpn.pricePaid > 0 && !cpn.isCrmMarketingVoucher && cpn.status !== 'voided') {
        const clientName = formatClientName(cpn.clientId);
        autoEntries.push({
          id: `AUTO-CPN-${cpn.id}`,
          type: 'income',
          category: 'coupon_sale',
          categoryNameTh: 'ขายคูปอง/Voucher',
          title: `ขายคูปอง/Voucher ${cpn.name} (${clientName})`,
          amount: cpn.pricePaid,
          date: cpn.createdAt.split('T')[0],
          note: cpn.description,
          clientId: cpn.clientId,
          clientName: clientName,
          sourceTxId: cpn.id,
          createdByStaffId: 'EMP-01',
          createdByStaffName: 'Staff Manager',
          createdAt: cpn.createdAt,
          isAutoGenerated: true,
        });
      }
    }

    // 5. Auto-synthesize from One-Time Service Bookings (deposits and remaining balance upon usage)
    for (const booking of this.getAllRawOneTimeBookings()) {
        if (booking.status === 'voided') continue;
        const clientName = formatClientName(booking.clientId);

        if (booking.depositAmount > 0) {
          autoEntries.push({
            id: `AUTO-OTB-${booking.id}-deposit`,
            type: 'income',
            category: 'onetime_service',
            categoryNameTh: booking.paymentStatusAtBooking === 'paid_full' ? 'บริการ One-Time (ชำระเต็มจำนวน)' : 'บริการ One-Time (เงินมัดจำ)',
            title: `${booking.name} — ${booking.branch} (${clientName})`,
            amount: booking.depositAmount,
            date: booking.bookingDateTime ? booking.bookingDateTime.split('T')[0] : booking.createdAt.split('T')[0],
            note: booking.description || `One-time booking deposit`,
            clientId: booking.clientId,
            clientName,
            sourceTxId: booking.id,
            createdByStaffId: booking.createdByStaffId,
            createdByStaffName: booking.createdByStaffName,
            createdAt: booking.createdAt,
            isAutoGenerated: true,
          });
        }

        if (booking.status === 'used' && booking.paymentStatusAtBooking === 'deposit') {
          const remaining = booking.remainingAmountPaid || (booking.fullPrice - (booking.depositAmount + (booking.coinAmountUsed || 0)));
          if (remaining > 0) {
            autoEntries.push({
              id: `AUTO-OTB-${booking.id}-remaining`,
              type: 'income',
              category: 'onetime_service',
              categoryNameTh: 'บริการ One-Time (ยอดคงเหลือหลังใช้บริการ)',
              title: `${booking.name} — ${booking.branch} (${clientName}) — ยอดคงเหลือ`,
              amount: remaining,
              date: booking.usedAt ? booking.usedAt.split('T')[0] : booking.bookingDateTime.split('T')[0],
              note: `ชำระส่วนที่เหลือหลังใช้บริการจริง`,
              clientId: booking.clientId,
              clientName,
              sourceTxId: `${booking.id}-remaining`,
              createdByStaffId: booking.createdByStaffId,
              createdByStaffName: booking.createdByStaffName,
              createdAt: booking.usedAt || booking.createdAt,
              isAutoGenerated: true,
            });
          }
        }

        if (booking.status === 'used' && booking.paymentStatusAtBooking === 'coin' && booking.remainingAmountPaid && booking.remainingAmountPaid > 0) {
          autoEntries.push({
            id: `AUTO-OTB-${booking.id}-coin-remaining`,
            type: 'income',
            category: 'onetime_service',
            categoryNameTh: 'บริการ One-Time (ยอดคงเหลือหลังใช้ Coin เป็นส่วนลด)',
            title: `${booking.name} — ${booking.branch} (${clientName}) — ยอดคงเหลือ`,
            amount: booking.remainingAmountPaid,
            date: (booking.usedAt || booking.bookingDateTime).split('T')[0],
            note: 'ชำระส่วนที่เหลือหลังใช้ Coin ช่วยเหลือบางส่วน',
            clientId: booking.clientId,
            clientName,
            sourceTxId: `${booking.id}-coin-remaining`,
            createdByStaffId: booking.createdByStaffId,
            createdByStaffName: booking.createdByStaffName,
            createdAt: booking.usedAt || booking.createdAt,
            isAutoGenerated: true,
          });
        }
      }

    // Combine & Sort descending by createdAt
    const all = [...manual, ...autoEntries];
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createFinancialEntry(data: Partial<FinancialEntry>, staffId: string, staffName: string): FinancialEntry {
    const type = data.type === 'expense' ? 'expense' : 'income';
    const amount = Number(data.amount);
    if (!amount || amount <= 0) throw new Error('Valid amount required');

    let categoryNameTh = 'รายการทั่วไป';
    const catMap: Record<string, string> = {
      coin_purchase: 'เติม Cash Coin',
      direct_service: 'ชำระเงินสด/โอนตรงหน้างาน',
      package_sale: 'ขายคอร์ส/แพ็กเกจ',
      coupon_sale: 'ขายคูปอง',
      onetime_service: 'บริการ One-Time',
      online_course: 'ขายคอร์สเรียนออนไลน์',
      product_sale: 'ขายผลิตภัณฑ์หน้าสปา',
      other_income: 'รายรับอื่น ๆ',
      rent: 'ค่าเช่าสถานที่ / ร้าน',
      utilities: 'ค่าน้ำ ค่าไฟ ค่าอินเทอร์เน็ต',
      supplies: 'ค่าอุปกรณ์ / ผลิตภัณฑ์',
      salary: 'เงินเดือน / ค่าคอมพนักงาน',
      marketing: 'ค่าการตลาด / โฆษณา',
      other_expense: 'รายจ่ายอื่น ๆ',
    };
    if (data.category && catMap[data.category]) {
      categoryNameTh = catMap[data.category];
    }

    const entry: FinancialEntry = {
      id: `FIN-${Date.now()}`,
      type,
      category: data.category || (type === 'income' ? 'other_income' : 'other_expense'),
      categoryNameTh,
      title: data.title || (type === 'income' ? 'รายรับอื่น ๆ' : 'รายจ่ายอื่น ๆ'),
      amount,
      date: data.date || new Date().toISOString().split('T')[0],
      note: data.note || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
      isAutoGenerated: false,
    };

    this.sqlite.prepare(`
      INSERT INTO financial_entries (
        id, type, category, category_name_th, title, amount, date,
        note, client_id, client_name, source_tx_id, created_by_staff_id,
        created_by_staff_name, created_at, is_auto_generated
      )
      VALUES (
        @id, @type, @category, @categoryNameTh, @title, @amount, @date,
        @note, @clientId, @clientName, @sourceTxId, @createdByStaffId,
        @createdByStaffName, @createdAt, 0
      )
    `).run({
      id: entry.id,
      type: entry.type,
      category: entry.category,
      categoryNameTh: entry.categoryNameTh,
      title: entry.title,
      amount: entry.amount,
      date: entry.date,
      note: entry.note || null,
      clientId: entry.clientId || null,
      clientName: entry.clientName || null,
      sourceTxId: entry.sourceTxId || null,
      createdByStaffId: entry.createdByStaffId,
      createdByStaffName: entry.createdByStaffName,
      createdAt: entry.createdAt,
    });

    this.logAudit(staffId, staffName, 'CREATE_FINANCIAL_ENTRY', 'financial', entry.id, `Created ${type} entry: ฿${amount}`, null, entry);
    return entry;
  }

  public deleteFinancialEntry(id: string, staffId: string, staffName: string): boolean {
    const row = this.sqlite.prepare('SELECT * FROM financial_entries WHERE id = ?').get(id);
    if (!row) throw new Error('Financial entry not found or cannot delete auto-generated entry');

    const removed = rowToFinancialEntry(row);
    this.sqlite.prepare('DELETE FROM financial_entries WHERE id = ?').run(id);
    this.logAudit(staffId, staffName, 'DELETE_FINANCIAL_ENTRY', 'financial', id, `Deleted ${removed.type} entry: ${removed.title}`, removed, null);
    return true;
  }

  public voidAutoFinancialEntry(
    category: string,
    sourceTxId: string,
    staffId: string,
    staffName: string,
    reason: string
  ): void {
    switch (category) {
      case 'coin_purchase':
        this.reverseCoinTransaction(sourceTxId, reason, staffId, staffName);
        break;
      case 'marketing': {
        this.reverseCoinTransaction(sourceTxId, reason, staffId, staffName);
        // ลบ entry ที่บันทึกถาวรนี้ออกด้วย เพราะไม่ได้ถูกคำนวณสดเหมือน entry อื่น
        this.sqlite.prepare('DELETE FROM financial_entries WHERE source_tx_id = ? AND category = ?').run(sourceTxId, 'marketing');
        break;
      }
      case 'direct_service':
        this.reversePointsTransaction(sourceTxId, reason, staffId, staffName);
        break;
      case 'package_sale':
        this.voidClientPackage(sourceTxId, staffId, staffName, reason);
        break;
      case 'coupon_sale':
        this.voidClientCoupon(sourceTxId, staffId, staffName, reason);
        break;
      case 'onetime_service': {
        const bookingId = sourceTxId.replace('-remaining', '');
        this.voidOneTimeBooking(bookingId, staffId, staffName, reason);
        break;
      }
      default:
        throw new Error(`Cannot void entry with category: ${category}`);
    }
  }

  public purgeSystemData(
    staffId: string,
    password: string,
    targets: { deleteClients?: boolean; deleteCatalog?: boolean; deleteTransactions?: boolean }
  ) {
    // 1. Check staff exists and is admin
    const emp = this.getEmployeeById(staffId);
    if (!emp) {
      throw new Error('ไม่พบข้อมูลบัญชีพนักงาน');
    }
    if (emp.role !== 'admin') {
      throw new Error('ไม่มีสิทธิ์ใช้งาน (เฉพาะ Admin เท่านั้นที่สามารถล้างข้อมูลระบบได้)');
    }

    // 2. Verify password
    if (emp.password !== password) {
      throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่าน Admin ของคุณอีกครั้ง');
    }

    const counts = {
      clients: 0,
      catalog: 0,
      transactions: 0,
    };

    // 3. Purge Clients
    if (targets.deleteClients) {
      const countRow = this.sqlite.prepare('SELECT count(*) as count FROM clients').get() as { count: number };
      counts.clients = countRow ? countRow.count : 0;
      this.sqlite.prepare('DELETE FROM clients').run();
      this.sqlite.prepare('DELETE FROM coin_wallets').run();
      this.sqlite.prepare('DELETE FROM points_wallets').run();
      this.sqlite.prepare('DELETE FROM client_packages').run();
      this.sqlite.prepare('DELETE FROM client_coupons').run();
      this.sqlite.prepare('DELETE FROM client_one_time_bookings').run();
      this.sqlite.prepare('DELETE FROM notifications').run();
    }

    // 4. Purge Catalog & Rewards
    if (targets.deleteCatalog) {
      const catCount = (this.sqlite.prepare('SELECT count(*) as count FROM catalog_items').get() as { count: number })?.count || 0;
      const rwdCount = (this.sqlite.prepare('SELECT count(*) as count FROM reward_catalog_items').get() as { count: number })?.count || 0;
      counts.catalog = catCount + rwdCount;
      this.sqlite.prepare('DELETE FROM catalog_items').run();
      this.sqlite.prepare('DELETE FROM reward_catalog_items').run();
    }

    // 5. Purge Transactions & Financials & Audit Logs
    if (targets.deleteTransactions) {
      const coinTxCount = (this.sqlite.prepare('SELECT count(*) as count FROM coin_transactions').get() as { count: number })?.count || 0;
      const ptsTxCount = (this.sqlite.prepare('SELECT count(*) as count FROM points_transactions').get() as { count: number })?.count || 0;
      const finCount = (this.sqlite.prepare('SELECT count(*) as count FROM financial_entries').get() as { count: number })?.count || 0;
      const auditCount = (this.sqlite.prepare('SELECT count(*) as count FROM audit_logs').get() as { count: number })?.count || 0;
      counts.transactions = coinTxCount + ptsTxCount + finCount + auditCount;
      this.sqlite.prepare('DELETE FROM coin_transactions').run();
      this.sqlite.prepare('DELETE FROM points_transactions').run();
      this.sqlite.prepare('DELETE FROM financial_entries').run();
      this.sqlite.prepare('DELETE FROM audit_logs').run();
    }

    // Log this system purge action
    this.logAudit(
      emp.id,
      emp.displayName,
      'SYSTEM_FACTORY_RESET',
      'staff',
      'GLOBAL',
      `Purged system data with targets: ${JSON.stringify(targets)}`,
      null,
      counts
    );

    return {
      success: true,
      deletedCounts: counts,
      message: 'ล้างข้อมูลระบบสำเร็จเรียบร้อยแล้ว',
    };
  }

  public getBackupSettings() {
    const defaultSettings = {
      email: 'me.my.mind.facialmassage@gmail.com',
      scheduleFrequency: 'daily',
      scheduleTime: '00:00',
      scheduleDayOfWeek: '1',
      scheduleDayOfMonth: '1',
      googleDriveAutoUpload: true,
      googleDriveFolder: 'Me.My.Mind_Membership_Backups',
      includeClients: true,
      includeTransactions: true,
      includeCatalog: true,
      lastBackupAt: new Date().toISOString(),
    };

    const row = this.sqlite.prepare('SELECT backup_settings FROM settings WHERE id = ?').get('app_settings') as { backup_settings: string | null } | undefined;
    if (row && row.backup_settings) {
      try {
        return JSON.parse(row.backup_settings);
      } catch {
        return defaultSettings;
      }
    }

    this.sqlite.prepare(`
      INSERT INTO settings (id, backup_settings, updated_at)
      VALUES ('app_settings', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        backup_settings = excluded.backup_settings,
        updated_at = excluded.updated_at
    `).run(JSON.stringify(defaultSettings), new Date().toISOString());

    return defaultSettings;
  }

  public saveBackupSettings(settings: any) {
    const merged = {
      ...this.getBackupSettings(),
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.sqlite.prepare(`
      INSERT INTO settings (id, backup_settings, updated_at)
      VALUES ('app_settings', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        backup_settings = excluded.backup_settings,
        updated_at = excluded.updated_at
    `).run(JSON.stringify(merged), new Date().toISOString());
    return merged;
  }

  public getBrandSettings() {
    const defaultBrand = {
      brandName: 'Me.My.Mind Membership',
      brandTagline: 'Your Daily Ritual of Self-Love',
      logoUrl: '',
      promoPosterUrl: '',
      updatedAt: Date.now(),
    };

    const row = this.sqlite.prepare('SELECT brand_settings FROM settings WHERE id = ?').get('app_settings') as { brand_settings: string | null } | undefined;
    if (row && row.brand_settings) {
      try {
        return JSON.parse(row.brand_settings);
      } catch {
        return defaultBrand;
      }
    }

    this.sqlite.prepare(`
      INSERT INTO settings (id, brand_settings, updated_at)
      VALUES ('app_settings', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        brand_settings = excluded.brand_settings,
        updated_at = excluded.updated_at
    `).run(JSON.stringify(defaultBrand), new Date().toISOString());

    return defaultBrand;
  }

  public updateBrandSettings(settings: { brandName?: string; brandTagline?: string; logoUrl?: string; promoPosterUrl?: string }) {
    const current = this.getBrandSettings();
    const merged = {
      brandName: settings.brandName !== undefined ? settings.brandName : current.brandName,
      brandTagline: settings.brandTagline !== undefined ? settings.brandTagline : current.brandTagline,
      logoUrl: settings.logoUrl !== undefined ? settings.logoUrl : current.logoUrl,
      promoPosterUrl: settings.promoPosterUrl !== undefined ? settings.promoPosterUrl : current.promoPosterUrl,
      updatedAt: Date.now(),
    };
    this.sqlite.prepare(`
      INSERT INTO settings (id, brand_settings, updated_at)
      VALUES ('app_settings', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        brand_settings = excluded.brand_settings,
        updated_at = excluded.updated_at
    `).run(JSON.stringify(merged), new Date().toISOString());
    return merged;
  }

  public getFullBackupData() {
    const timestamp = new Date().toISOString();
    const allClients = this.getClients();
    const allCoinTxs = this.getAllCoinTransactions();
    const allPointsTxs = this.getAllPointsTransactions();
    const allCatalogItems = this.getCatalogItems();
    const allRewardItems = this.getRewardCatalog();
    const coinWallets: Record<string, number> = {};
    const pointsWallets: Record<string, PointsWallet> = {};

    for (const c of allClients) {
      coinWallets[c.id] = this.getCoinBalance(c.id);
      pointsWallets[c.id] = this.getPointsWallet(c.id);
    }

    const allPackages = this.getAllClientPackages();
    const allCoupons = this.getAllClientCoupons();
    const allBookings = this.getAllRawOneTimeBookings();

    return {
      appName: 'Me.My.Mind Membership',
      backupTimestamp: timestamp,
      summary: {
        totalClients: allClients.length,
        totalCoinTransactions: allCoinTxs.length,
        totalPointsTransactions: allPointsTxs.length,
        totalFinancialEntries: (this.sqlite.prepare('SELECT count(*) as count FROM financial_entries').get() as { count: number })?.count || 0,
        totalCatalogItems: allCatalogItems.length,
      },
      clients: allClients.map((c) => ({
        ...c,
        coinBalance: coinWallets[c.id] || 0,
        pointsWallet: pointsWallets[c.id] || { totalPoints: 0, currentTier: 'Bronze' },
        activePackagesCount: allPackages.filter((p) => p.clientId === c.id && p.status === 'active').length,
        activeCouponsCount: allCoupons.filter((cpn) => cpn.clientId === c.id && cpn.status === 'active').length,
      })),
      coinWallets,
      pointsWallets,
      clientPackages: allPackages,
      clientCoupons: allCoupons,
      clientOneTimeBookings: allBookings,
      coinTransactions: allCoinTxs,
      pointsTransactions: allPointsTxs,
      financialEntries: this.sqlite.prepare('SELECT * FROM financial_entries ORDER BY date DESC, created_at DESC').all().map(rowToFinancialEntry),
      catalogItems: allCatalogItems,
      rewardCatalogItems: allRewardItems,
      backupSettings: this.getBackupSettings(),
    };
  }
}

export const store = new Store();
