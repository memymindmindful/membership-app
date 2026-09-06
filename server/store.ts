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

interface DatabaseSchema {
  coinWallets: Record<string, number>; // clientId -> balance
  coinTransactions: CoinTransaction[];
  pointsWallets: Record<string, PointsWallet>; // clientId -> wallet
  pointsTransactions: PointsTransaction[];
  catalogItems: CatalogItem[];
  clientPackages: ClientPackage[];
  clientCoupons: ClientCoupon[];
  clientOneTimeBookings?: ClientOneTimeBooking[];
  rewardCatalogItems: RewardCatalogItem[];
  notifications: InAppNotification[];
  backupSettings?: {
    email: string;
    scheduleFrequency: 'daily' | 'weekly' | 'monthly';
    scheduleTime: string; // e.g. "00:00"
    scheduleDayOfWeek?: string; // e.g. "1" for Monday
    scheduleDayOfMonth?: string; // e.g. "1"
    googleDriveAutoUpload: boolean;
    googleDriveFolder: string;
    includeClients: boolean;
    includeTransactions: boolean;
    includeCatalog: boolean;
    lastBackupAt?: string;
  };
  auditLogs: AuditLog[];
  financialEntries?: FinancialEntry[];
  brandSettings?: {
    brandName: string;
    brandTagline: string;
    logoUrl: string;
    promoPosterUrl?: string;
    updatedAt?: number;
  };
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

// Initial Seed Data
function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nearExpiryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days from now
  const farExpiryDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  const coinWallets: Record<string, number> = {
    'CLI-0001': 3500,
    'CLI-0002': 8000,
    'CLI-0003': 500,
  };

  const pointsWallets: Record<string, PointsWallet> = {
    'CLI-0001': {
      clientId: 'CLI-0001',
      balance: 850,
      lifetimeEarned: 1100,
      lifetimeRedeemed: 250,
      tier: 'Silver',
    },
    'CLI-0002': {
      clientId: 'CLI-0002',
      balance: 2400,
      lifetimeEarned: 2400,
      lifetimeRedeemed: 0,
      tier: 'Gold',
    },
    'CLI-0003': {
      clientId: 'CLI-0003',
      balance: 200,
      lifetimeEarned: 200,
      lifetimeRedeemed: 0,
      tier: 'Bronze',
    },
  };

  const catalogItems: CatalogItem[] = [
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

  const rewardCatalogItems: RewardCatalogItem[] = [
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

  const clientPackages: ClientPackage[] = [
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

  const clientCoupons: ClientCoupon[] = [
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

  const coinTransactions: CoinTransaction[] = [
    {
      id: 'TX-COIN-001',
      clientId: 'CLI-0001',
      amount: 5000,
      type: 'credit_added',
      note: 'พนักงานบันทึกการรับชำระเงินสดที่สตูดิโอ',
      resultingBalance: 5000,
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: pastDate,
    },
    {
      id: 'TX-COIN-002',
      clientId: 'CLI-0001',
      amount: -1500,
      type: 'credit_used',
      note: 'ตัด Coin ชำระค่าบริการนวดหน้า',
      resultingBalance: 3500,
      createdByStaffId: 'EMP-03',
      createdByStaffName: 'Khun Joy (Therapist)',
      createdAt: pastDate,
    },
    {
      id: 'TX-COIN-003',
      clientId: 'CLI-0002',
      amount: 8000,
      type: 'credit_added',
      note: 'พนักงานยืนยันการโอนเงินเข้าบัญชีธนาคาร',
      resultingBalance: 8000,
      createdByStaffId: 'EMP-01',
      createdByStaffName: 'Khun Nat (Admin)',
      createdAt: pastDate,
    },
    {
      id: 'TX-COIN-004',
      clientId: 'CLI-0003',
      amount: 500,
      type: 'credit_added',
      note: 'บันทึกการเติมเงินครั้งแรกโดยพนักงาน',
      resultingBalance: 500,
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: now,
    },
  ];

  const pointsTransactions: PointsTransaction[] = [
    {
      id: 'TX-PTS-001',
      clientId: 'CLI-0001',
      amount: 1100,
      type: 'points_earned',
      note: 'ได้รับคะแนนสะสมจากการซื้อแพ็กเกจ 12,000 บาท',
      sourceType: 'package_sale',
      relatedPackageId: 'PKG-001',
      resultingBalance: 1100,
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: pastDate,
    },
    {
      id: 'TX-PTS-002',
      clientId: 'CLI-0001',
      amount: -250,
      type: 'points_redeemed',
      note: 'ใช้คะแนนแลกรับของขวัญ Lip Balm หน้าร้าน',
      sourceType: 'manual_award',
      resultingBalance: 850,
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: pastDate,
    },
    {
      id: 'TX-PTS-003',
      clientId: 'CLI-0002',
      amount: 2400,
      type: 'points_earned',
      note: 'ได้รับคะแนนสะสมจากการลงทะเบียนคอร์สเรียน',
      sourceType: 'package_sale',
      resultingBalance: 2400,
      createdByStaffId: 'EMP-01',
      createdByStaffName: 'Khun Nat (Admin)',
      createdAt: pastDate,
    },
    {
      id: 'TX-PTS-004',
      clientId: 'CLI-0003',
      amount: 200,
      type: 'points_earned',
      note: 'คะแนนโบนัสต้อนรับสมาชิกใหม่',
      sourceType: 'other',
      resultingBalance: 200,
      createdByStaffId: 'EMP-02',
      createdByStaffName: 'Khun May (Manager)',
      createdAt: now,
    },
  ];

  const notifications: InAppNotification[] = [
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

  const auditLogs: AuditLog[] = [
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

  const financialEntries: FinancialEntry[] = [
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

  return {
    coinWallets,
    coinTransactions,
    pointsWallets,
    pointsTransactions,
    catalogItems,
    clientPackages,
    clientCoupons,
    rewardCatalogItems,
    notifications,
    auditLogs,
    financialEntries,
    clientOneTimeBookings: [],
  };
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
    db.pragma('journal_mode = WAL');
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
        const hadClientsOrEmployees = 'clients' in parsed || 'employees' in parsed;
        delete parsed.clients;
        delete parsed.employees;
        if (!parsed.clientOneTimeBookings) {
          parsed.clientOneTimeBookings = [];
        }
        if (hadClientsOrEmployees) {
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

        fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8', (err) => {
          if (err) {
            console.error('Failed to save store to disk:', err);
          }
        });
      } catch (err) {
        console.error('Failed to save store to disk:', err);
      }
    }, 300);
  }

  /**
   * Recalculates expiry status for packages and coupons (active, expiring_soon, used_up)
   */
  public refreshItemStatuses() {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    this.db.clientPackages.forEach((pkg) => {
      if (pkg.status === 'voided') return;
      if (pkg.remainingSessions <= 0) {
        pkg.status = 'used_up';
        if (!pkg.usedUpAt) pkg.usedUpAt = new Date().toISOString();
      } else {
        const expTime = new Date(pkg.expiryDate).getTime();
        if (expTime - now <= sevenDaysMs) {
          pkg.status = 'expiring_soon';
        } else {
          pkg.status = 'active';
        }
      }
    });

    this.db.clientCoupons.forEach((cpn) => {
      if (cpn.status === 'voided') return;
      if (cpn.usedQuantity >= cpn.totalQuantity) {
        cpn.status = 'used_up';
        if (!cpn.usedUpAt) cpn.usedUpAt = new Date().toISOString();
      } else {
        const expTime = new Date(cpn.expiryDate).getTime();
        if (expTime - now <= sevenDaysMs) {
          cpn.status = 'expiring_soon';
        } else {
          cpn.status = 'active';
        }
      }
    });

    this.saveToDisk();
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
    if (!this.db.auditLogs) {
      this.db.auditLogs = [];
    }
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
    this.db.auditLogs.unshift(log);
    if (this.db.auditLogs.length > 2000) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 2000);
    }
    this.saveToDisk();
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
    this.db.notifications.unshift(notif);
    this.saveToDisk();
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
      const packages = this.db.clientPackages.filter((p) => p.clientId === client.id);
      const coupons = this.db.clientCoupons.filter((c) => c.clientId === client.id);
      const coinTxs = this.db.coinTransactions.filter((tx) => tx.clientId === client.id && !tx.reversed);

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

    this.db.coinWallets[newClient.id] = 0;
    this.db.pointsWallets[newClient.id] = {
      clientId: newClient.id,
      balance: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      tier: 'Bronze',
    };

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

    // Remove client record from SQLite
    this.sqlite.prepare('DELETE FROM clients WHERE id = ?').run(client.id);
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
    return this.db.coinWallets[clientId] ?? 0;
  }

  public getCoinTransactions(clientId: string): CoinTransaction[] {
    return this.db.coinTransactions.filter((tx) => tx.clientId === clientId);
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
    this.db.coinWallets[clientId] = newBalance;

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

    this.db.coinTransactions.unshift(tx);

    const client = this.getClientById(clientId);

    if (isBonus) {
      // Bonus Coins do NOT count as company revenue!
      // They are recorded as CRM Marketing Expense (ค่าใช้จ่าย Bonus Coins) in accounting.
      if (!this.db.financialEntries) this.db.financialEntries = [];
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
      this.db.financialEntries.unshift(finEntry);

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
    this.db.coinWallets[clientId] = newBalance;

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

    this.db.coinTransactions.unshift(tx);
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
    const originalTx = this.db.coinTransactions.find((t) => t.id === txId);
    if (!originalTx) {
      throw new Error('Transaction not found');
    }
    if (originalTx.reversed) {
      throw new Error('Transaction has already been reversed');
    }

    const currentBalance = this.getCoinBalance(originalTx.clientId);
    const offsetAmount = -originalTx.amount; // Inverse of original amount
    const newBalance = currentBalance + offsetAmount;

    if (newBalance < 0) {
      throw new Error('Reversal would result in a negative coin balance');
    }

    // Mark original as reversed
    originalTx.reversed = true;
    originalTx.reversalReason = reason;
    originalTx.reversedAt = new Date().toISOString();
    originalTx.reversedByStaffName = staffName;

    // Update wallet
    this.db.coinWallets[originalTx.clientId] = newBalance;

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

    this.db.coinTransactions.unshift(adjustmentTx);
    this.notifyClient(originalTx.clientId, 'ยกเลิกรายการธุรกรรม (Reversal)', `ระบบได้ทำการปรับปรุงยกเลิกรายการ #${originalTx.id} ยอดคงเหลือปัจจุบันคือ ${newBalance.toLocaleString()} Coins (เหตุผล: ${reason})`);
    this.logAudit(staffId, staffName, 'REVERSE_COIN_TX', 'coin', originalTx.clientId, reason, originalTx, adjustmentTx);

    this.saveToDisk();
    return adjustmentTx;
  }

  // Points Wallet Operations
  public getPointsWallet(clientId: string): PointsWallet {
    if (!this.db.pointsWallets[clientId]) {
      this.db.pointsWallets[clientId] = {
        clientId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        tier: 'Bronze',
      };
    }
    return this.db.pointsWallets[clientId];
  }

  public getPointsTransactions(clientId: string): PointsTransaction[] {
    return this.db.pointsTransactions.filter((tx) => tx.clientId === clientId);
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

    this.db.pointsTransactions.unshift(tx);
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

    const tx: PointsTransaction = {
      id: `TX-PTS-${Date.now()}`,
      clientId,
      amount: -amount,
      type: 'points_redeemed',
      note: note || 'Points redeemed for in-store reward',
      resultingBalance: wallet.balance,
      createdByStaffId: staffId,
      createdByStaffName: staffName,
      createdAt: new Date().toISOString(),
    };

    this.db.pointsTransactions.unshift(tx);
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
    const originalTx = this.db.pointsTransactions.find((t) => t.id === txId);
    if (!originalTx) {
      throw new Error('Points transaction not found');
    }
    if (originalTx.reversed) {
      throw new Error('Points transaction has already been reversed');
    }

    const wallet = this.getPointsWallet(originalTx.clientId);
    const offsetAmount = -originalTx.amount;

    if (wallet.balance + offsetAmount < 0) {
      throw new Error('Reversal would result in negative points balance');
    }

    originalTx.reversed = true;
    originalTx.reversalReason = reason;
    originalTx.reversedAt = new Date().toISOString();
    originalTx.reversedByStaffName = staffName;

    wallet.balance += offsetAmount;
    if (originalTx.amount > 0) {
      wallet.lifetimeEarned = Math.max(0, wallet.lifetimeEarned - originalTx.amount);
      wallet.tier = getTierFromPoints(wallet.lifetimeEarned);
    } else {
      wallet.lifetimeRedeemed = Math.max(0, wallet.lifetimeRedeemed - Math.abs(originalTx.amount));
    }

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

    this.db.pointsTransactions.unshift(adjustmentTx);
    this.notifyClient(originalTx.clientId, 'ปรับปรุงยกเลิกรายการคะแนน', `ระบบได้ทำการยกเลิกรายการคะแนน #${originalTx.id} ยอดคะแนนสะสมปัจจุบันคือ ${wallet.balance.toLocaleString()} คะแนน (เหตุผล: ${reason})`);
    this.logAudit(staffId, staffName, 'REVERSE_POINTS_TX', 'points', originalTx.clientId, reason, originalTx, adjustmentTx);

    this.saveToDisk();
    return adjustmentTx;
  }

  // Catalog Templates Management
  public getCatalogItems(): CatalogItem[] {
    return this.db.catalogItems;
  }

  public createCatalogItem(
    data: Omit<CatalogItem, 'id' | 'createdAt'>,
    staffId: string,
    staffName: string
  ): CatalogItem {
    const newItem: CatalogItem = {
      id: `CAT-${data.type === 'package' ? 'PKG' : 'CPN'}-${Date.now()}`,
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

    this.db.catalogItems.unshift(newItem);
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
    const item = this.db.catalogItems.find((c) => c.id === id);
    if (!item) throw new Error('Catalog item not found');

    const prev = { ...item };
    Object.assign(item, updates);

    this.logAudit(staffId, staffName, 'UPDATE_CATALOG_ITEM', 'catalog', item.id, 'Catalog service updated', prev, item);
    this.saveToDisk();
    return item;
  }

  public bulkUpdateCatalogPrices(
    itemIds: string[],
    adjustmentType: 'percent' | 'fixed',
    value: number,
    staffId: string,
    staffName: string
  ): CatalogItem[] {
    const updatedItems: CatalogItem[] = [];

    itemIds.forEach((id) => {
      const item = this.db.catalogItems.find((c) => c.id === id);
      if (!item) return;

      const prevPrice = item.price;
      let newPrice = prevPrice;

      if (adjustmentType === 'percent') {
        newPrice = Math.round(prevPrice * (1 + value / 100));
      } else if (adjustmentType === 'fixed') {
        newPrice = Math.max(0, Math.round(prevPrice + value));
      }

      item.price = newPrice;
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
    return this.db.clientPackages.filter((p) => p.clientId === clientId);
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
    const catalog = this.db.catalogItems.find((c) => c.id === catalogId);
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

    this.db.clientPackages.unshift(clientPkg);
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
    const pkg = this.db.clientPackages.find((p) => p.id === clientPackageId);
    if (!pkg) throw new Error('Client package not found');
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
    const pkg = this.db.clientPackages.find((p) => p.id === clientPackageId);
    if (!pkg) throw new Error('Client package not found');
    if (pkg.status === 'voided') throw new Error('This package has already been voided');

    const previousData = { ...pkg };
    pkg.status = 'voided';
    pkg.voidedAt = new Date().toISOString();
    pkg.voidedBy = staffName;
    pkg.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    // Reverse any points awarded for this package
    const relatedPtsTx = this.db.pointsTransactions.find(
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
    return this.db.clientCoupons.filter((c) => c.clientId === clientId);
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
    const catalog = this.db.catalogItems.find((c) => c.id === catalogId);
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

    this.db.clientCoupons.unshift(coupon);
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
    const cpn = this.db.clientCoupons.find((c) => c.id === clientCouponId);
    if (!cpn) throw new Error('Client coupon not found');
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
      const catalog = this.db.catalogItems.find((c) => c.id === cpn.catalogId);
      const unitCost = catalog && catalog.price > 0
        ? catalog.price / cpn.totalQuantity
        : 0;

      if (unitCost > 0) {
        const client = this.getClientById(cpn.clientId);
        const clientName = client ? `${client.displayName} (${client.nickname || ''})` : 'ลูกค้าทั่วไป';

        if (!this.db.financialEntries) {
          this.db.financialEntries = [];
        }
        this.db.financialEntries.push({
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
        });
      }
    }

    if (cpn.remainingQuantity === 0) {
      cpn.status = 'used_up';
      cpn.usedUpAt = new Date().toISOString();
    }

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
    const cpn = this.db.clientCoupons.find((c) => c.id === clientCouponId);
    if (!cpn) throw new Error('Client coupon not found');
    if (cpn.status === 'voided') throw new Error('This coupon has already been voided');

    const previousData = { ...cpn };
    cpn.status = 'voided';
    cpn.voidedAt = new Date().toISOString();
    cpn.voidedBy = staffName;
    cpn.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    // Reverse any points awarded for this coupon
    const relatedPtsTx = this.db.pointsTransactions.find(
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

  // One-Time Service Bookings Operations
  public getAllOneTimeBookings(): (ClientOneTimeBooking & { clientName: string; clientPhone: string; clientProfilePic?: string; clientCoinBalance?: number })[] {
    if (!this.db.clientOneTimeBookings) return [];
    const now = new Date();
    return this.db.clientOneTimeBookings
      .filter((b) => b.status === 'booked' && new Date(b.bookingDateTime) >= now)
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
    if (!this.db.clientPackages) return [];
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
    for (const client of allClients) {
      const packages = this.db.clientPackages.filter(
        (p) => p.clientId === client.id && (p.status === 'active' || p.status === 'expiring_soon')
      );
      for (const pkg of packages) {
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
    if (!this.db.clientOneTimeBookings) {
      this.db.clientOneTimeBookings = [];
    }
    const booking = this.db.clientOneTimeBookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'booked') throw new Error('ไม่สามารถเลื่อนนัดรายการที่ใช้บริการหรือยกเลิกไปแล้วได้');

    const previousData = { ...booking };
    const oldDateTime = booking.bookingDateTime;
    booking.bookingDateTime = newBookingDateTime;
    booking.endDateTime = newEndDateTime || undefined;

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
    if (!this.db.clientOneTimeBookings) {
      this.db.clientOneTimeBookings = [];
    }
    return this.db.clientOneTimeBookings.filter((b) => b.clientId === clientId);
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
    const catalog = catalogId ? this.db.catalogItems.find((c) => c.id === catalogId) : undefined;
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

    if (!this.db.clientOneTimeBookings) {
      this.db.clientOneTimeBookings = [];
    }
    this.db.clientOneTimeBookings.unshift(booking);

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
    if (!this.db.clientOneTimeBookings) {
      this.db.clientOneTimeBookings = [];
    }
    const booking = this.db.clientOneTimeBookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
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
    if (!this.db.clientOneTimeBookings) {
      this.db.clientOneTimeBookings = [];
    }
    const booking = this.db.clientOneTimeBookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('One-time booking not found');
    if (booking.status === 'voided') throw new Error('This booking has already been voided');

    const previousData = { ...booking };
    booking.status = 'voided';
    booking.voidedAt = new Date().toISOString();
    booking.voidedBy = staffName;
    booking.voidReason = reason || 'ยกเลิกรายการโดยผู้ดูแลระบบ';

    // Reverse any points awarded for this booking
    const relatedPtsTxs = this.db.pointsTransactions.filter(
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
    this.db.clientPackages.forEach((pkg) => {
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
    this.db.clientCoupons.forEach((cpn) => {
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
    const pkg = this.db.clientPackages.find((p) => p.id === packageId);
    if (!pkg) throw new Error('Client package not found');

    pkg.followUpStatus = followUpStatus;
    pkg.followUpNote = followUpNote;
    pkg.followUpUpdatedAt = new Date().toISOString();
    pkg.followUpUpdatedByStaffName = staffName;

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
    const cpn = this.db.clientCoupons.find((c) => c.id === couponId);
    if (!cpn) throw new Error('Client coupon not found');

    cpn.followUpStatus = followUpStatus;
    cpn.followUpNote = followUpNote;
    cpn.followUpUpdatedAt = new Date().toISOString();
    cpn.followUpUpdatedByStaffName = staffName;

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
    return this.db.rewardCatalogItems;
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
    this.db.rewardCatalogItems.unshift(item);
    this.logAudit(staffId, staffName, 'CREATE_REWARD', 'reward', item.id, 'New reward catalog item added', null, item);
    this.saveToDisk();
    return item;
  }

  public updateRewardItem(id: string, updates: Partial<RewardCatalogItem>, staffId: string, staffName: string): RewardCatalogItem {
    const item = this.db.rewardCatalogItems.find((r) => r.id === id);
    if (!item) throw new Error('Reward catalog item not found');
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.pointsCost !== undefined) item.pointsCost = Number(updates.pointsCost);
    if (updates.imageUrl !== undefined) item.imageUrl = updates.imageUrl;
    if (updates.active !== undefined) item.active = updates.active;
    if (updates.minTier !== undefined) item.minTier = updates.minTier;

    this.logAudit(staffId, staffName, 'UPDATE_REWARD', 'reward', item.id, 'Updated reward catalog item', null, item);
    this.saveToDisk();
    return item;
  }

  // Notifications
  public getNotifications(clientId: string): InAppNotification[] {
    return this.db.notifications.filter((n) => n.clientId === clientId);
  }

  public markNotificationAsRead(notifId: string) {
    const n = this.db.notifications.find((notif) => notif.id === notifId);
    if (n) {
      n.read = true;
      this.saveToDisk();
    }
  }

  public markAllNotificationsAsRead(clientId: string): void {
    if (!this.db.notifications) return;
    let changed = false;
    for (const n of this.db.notifications) {
      if (n.clientId === clientId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) {
      this.saveToDisk();
    }
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.db.auditLogs;
  }

  // Financial Accounting Engine
  public getFinancialEntries(): FinancialEntry[] {
    if (!this.db.financialEntries) {
      this.db.financialEntries = [];
    }

    const manual = [...this.db.financialEntries];
    const autoEntries: FinancialEntry[] = [];

    // Helper to format client name safely
    const formatClientName = (clientId: string): string => {
      const client = this.getClientById(clientId);
      if (!client) return 'ไม่พบข้อมูลลูกค้า (ถูกลบแล้ว)';
      return `${client.displayName}${client.nickname ? ` (${client.nickname})` : ''}`;
    };

    // 1. Auto-synthesize from Coin topups (ONLY non-bonus cash coin purchases)
    for (const tx of this.db.coinTransactions) {
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
    for (const tx of this.db.pointsTransactions) {
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
    for (const pkg of this.db.clientPackages) {
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
    for (const cpn of this.db.clientCoupons) {
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
    if (this.db.clientOneTimeBookings) {
      for (const booking of this.db.clientOneTimeBookings) {
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
    }

    // Combine & Sort descending by createdAt
    const all = [...manual, ...autoEntries];
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createFinancialEntry(data: Partial<FinancialEntry>, staffId: string, staffName: string): FinancialEntry {
    if (!this.db.financialEntries) {
      this.db.financialEntries = [];
    }

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

    this.db.financialEntries.unshift(entry);
    this.logAudit(staffId, staffName, 'CREATE_FINANCIAL_ENTRY', 'financial', entry.id, `Created ${type} entry: ฿${amount}`, null, entry);
    this.saveToDisk();
    return entry;
  }

  public deleteFinancialEntry(id: string, staffId: string, staffName: string): boolean {
    if (!this.db.financialEntries) return false;
    const index = this.db.financialEntries.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Financial entry not found or cannot delete auto-generated entry');

    const removed = this.db.financialEntries.splice(index, 1)[0];
    this.logAudit(staffId, staffName, 'DELETE_FINANCIAL_ENTRY', 'financial', id, `Deleted ${removed.type} entry: ${removed.title}`, removed, null);
    this.saveToDisk();
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
        if (this.db.financialEntries) {
          const idx = this.db.financialEntries.findIndex(
            (f) => f.sourceTxId === sourceTxId && f.category === 'marketing'
          );
          if (idx !== -1) {
            this.db.financialEntries.splice(idx, 1);
          }
        }
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
      this.db.coinWallets = {};
      this.db.pointsWallets = {};
      this.db.clientPackages = [];
      this.db.clientCoupons = [];
      this.db.clientOneTimeBookings = [];
      this.db.notifications = [];
    }

    // 4. Purge Catalog & Rewards
    if (targets.deleteCatalog) {
      counts.catalog = this.db.catalogItems.length + (this.db.rewardCatalogItems ? this.db.rewardCatalogItems.length : 0);
      this.db.catalogItems = [];
      this.db.rewardCatalogItems = [];
    }

    // 5. Purge Transactions & Financials & Audit Logs
    if (targets.deleteTransactions) {
      counts.transactions =
        (this.db.coinTransactions ? this.db.coinTransactions.length : 0) +
        (this.db.pointsTransactions ? this.db.pointsTransactions.length : 0) +
        (this.db.financialEntries ? this.db.financialEntries.length : 0) +
        (this.db.auditLogs ? this.db.auditLogs.length : 0);
      this.db.coinTransactions = [];
      this.db.pointsTransactions = [];
      this.db.financialEntries = [];
      this.db.auditLogs = [];
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

    this.saveToDisk();

    return {
      success: true,
      deletedCounts: counts,
      message: 'ล้างข้อมูลระบบสำเร็จเรียบร้อยแล้ว',
    };
  }

  public getBackupSettings() {
    if (!this.db.backupSettings) {
      this.db.backupSettings = {
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
    }
    return this.db.backupSettings;
  }

  public saveBackupSettings(settings: any) {
    this.db.backupSettings = {
      ...this.getBackupSettings(),
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.db.backupSettings;
  }

  public getBrandSettings() {
    if (!this.db.brandSettings) {
      this.db.brandSettings = {
        brandName: 'Me.My.Mind Membership',
        brandTagline: 'Your Daily Ritual of Self-Love',
        logoUrl: '',
        promoPosterUrl: '',
        updatedAt: Date.now(),
      };
    }
    return this.db.brandSettings;
  }

  public updateBrandSettings(settings: { brandName?: string; brandTagline?: string; logoUrl?: string; promoPosterUrl?: string }) {
    const current = this.getBrandSettings();
    this.db.brandSettings = {
      brandName: settings.brandName !== undefined ? settings.brandName : current.brandName,
      brandTagline: settings.brandTagline !== undefined ? settings.brandTagline : current.brandTagline,
      logoUrl: settings.logoUrl !== undefined ? settings.logoUrl : current.logoUrl,
      promoPosterUrl: settings.promoPosterUrl !== undefined ? settings.promoPosterUrl : current.promoPosterUrl,
      updatedAt: Date.now(),
    };
    this.saveToDisk();
    return this.db.brandSettings;
  }

  public getFullBackupData() {
    const timestamp = new Date().toISOString();
    const allClients = this.getClients();
    return {
      appName: 'Me.My.Mind Membership',
      backupTimestamp: timestamp,
      summary: {
        totalClients: allClients.length,
        totalCoinTransactions: this.db.coinTransactions ? this.db.coinTransactions.length : 0,
        totalPointsTransactions: this.db.pointsTransactions ? this.db.pointsTransactions.length : 0,
        totalFinancialEntries: this.db.financialEntries ? this.db.financialEntries.length : 0,
        totalCatalogItems: this.db.catalogItems.length,
      },
      clients: allClients.map((c) => ({
        ...c,
        coinBalance: this.db.coinWallets[c.id] || 0,
        pointsWallet: this.db.pointsWallets[c.id] || { totalPoints: 0, currentTier: 'SILVER' },
        activePackagesCount: (this.db.clientPackages || []).filter((p) => p.clientId === c.id && p.status === 'active').length,
        activeCouponsCount: (this.db.clientCoupons || []).filter((cpn) => cpn.clientId === c.id && cpn.status === 'active').length,
      })),
      coinWallets: this.db.coinWallets,
      pointsWallets: this.db.pointsWallets,
      clientPackages: this.db.clientPackages,
      clientCoupons: this.db.clientCoupons,
      clientOneTimeBookings: this.db.clientOneTimeBookings || [],
      coinTransactions: this.db.coinTransactions,
      pointsTransactions: this.db.pointsTransactions,
      financialEntries: this.db.financialEntries,
      catalogItems: this.db.catalogItems,
      rewardCatalogItems: this.db.rewardCatalogItems,
      backupSettings: this.getBackupSettings(),
    };
  }
}

export const store = new Store();
