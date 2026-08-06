/**
 * Server Store and Data Persistence for Me.My.Mind Membership App
 */

import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  CatalogItem,
  Client,
  ClientCoupon,
  ClientPackage,
  CoinTransaction,
  Employee,
  InAppNotification,
  PointsTransaction,
  PointsWallet,
  RewardCatalogItem,
  ItemStatus,
  FinancialEntry
} from '../src/types';
import { getTierFromPoints } from '../src/lib/translations';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  employees: Employee[];
  clients: Client[];
  coinWallets: Record<string, number>; // clientId -> balance
  coinTransactions: CoinTransaction[];
  pointsWallets: Record<string, PointsWallet>; // clientId -> wallet
  pointsTransactions: PointsTransaction[];
  catalogItems: CatalogItem[];
  clientPackages: ClientPackage[];
  clientCoupons: ClientCoupon[];
  rewardCatalogItems: RewardCatalogItem[];
  notifications: InAppNotification[];
  auditLogs: AuditLog[];
  financialEntries?: FinancialEntry[];
}

// Initial Seed Data
function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const nearExpiryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days from now
  const farExpiryDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  const employees: Employee[] = [
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

  const clients: Client[] = [
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
      createdAt: now,
    },
  ];

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
    employees,
    clients,
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
  };
}

class Store {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadFromDisk();
    this.refreshItemStatuses();
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(fileData);
        // Ensure employees list exists and includes initial roles if empty
        if (!parsed.employees || parsed.employees.length === 0) {
          parsed.employees = getInitialData().employees;
        } else {
          // Merge initial roles if missing
          const initialEmps = getInitialData().employees;
          initialEmps.forEach((initEmp) => {
            if (!parsed.employees.some((e) => e.username.toLowerCase() === initEmp.username.toLowerCase())) {
              parsed.employees.push(initEmp);
            }
          });
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load db.json, initializing fresh store:', err);
    }
    const seed = getInitialData();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(data?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data || this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store to disk:', err);
    }
  }

  /**
   * Recalculates expiry status for packages and coupons (active, expiring_soon, used_up)
   */
  public refreshItemStatuses() {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    this.db.clientPackages.forEach((pkg) => {
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
    return this.db.employees;
  }

  public createEmployee(
    empData: Partial<Employee>,
    staffId: string,
    staffName: string
  ): Employee {
    const existing = this.db.employees.find(
      (e) => e.username.toLowerCase() === (empData.username || '').trim().toLowerCase()
    );
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

    this.db.employees.push(newEmp);
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
    const index = this.db.employees.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }

    const current = this.db.employees[index];

    // Check username uniqueness if changed
    if (empData.username && empData.username.toLowerCase() !== current.username.toLowerCase()) {
      const exists = this.db.employees.some(
        (e) => e.id !== id && e.username.toLowerCase() === empData.username!.trim().toLowerCase()
      );
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

    this.db.employees[index] = updated;
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
    const current = this.db.employees.find((e) => e.id === id);
    if (!current) {
      throw new Error('Employee not found');
    }

    // Prevent deleting the last admin
    if (current.role === 'admin') {
      const adminCount = this.db.employees.filter((e) => e.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('ไม่สามารถลบบัญชี Admin คนสุดท้ายของระบบได้');
      }
    }

    this.db.employees = this.db.employees.filter((e) => e.id !== id);
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
    const index = this.db.employees.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานในระบบ');
    }

    const current = this.db.employees[index];
    if (current.password && current.password !== oldPassword) {
      throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    }

    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
    }

    current.password = newPassword.trim();
    this.db.employees[index] = current;

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
    return this.db.clients;
  }

  public getAllClientsExportData() {
    this.refreshItemStatuses();
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.db.clients.map((client) => {
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
    return this.db.clients.find((c) => c.id === id || c.memberCode === id);
  }

  public createClient(clientData: Partial<Client>, staffId: string, staffName: string): Client {
    const nextNum = this.db.clients.length + 1;
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
    };

    this.db.clients.unshift(newClient);
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

  public updateClientNotes(
    clientId: string,
    notes: string,
    staffId: string,
    staffName: string
  ): Client {
    const client = this.db.clients.find((c) => c.id === clientId || c.memberCode === clientId);
    if (!client) {
      throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    }
    const oldNotes = client.notes || '';
    client.notes = notes ? notes.trim() : '';

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

    const client = this.db.clients.find((c) => c.id === clientId || c.memberCode === clientId);

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
      const ptsEarned = Math.floor(amount / 10);
      if (ptsEarned > 0) {
        this.addPoints(clientId, ptsEarned, `สะสมคะแนนจากการเติมเงิน ${amount} บาท`, staffId, staffName);
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
    staffName: string
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
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
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
    };

    this.db.clientCoupons.unshift(coupon);
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

    if (cpn.remainingQuantity === 0) {
      cpn.status = 'used_up';
      cpn.usedUpAt = new Date().toISOString();
    }

    this.notifyClient(cpn.clientId, 'ตัดใช้สิทธิ์คูปองเรียบร้อย', `พนักงานได้ทำการตัดใช้สิทธิ์ 1 ครั้งสำหรับคูปอง "${cpn.name}" คงเหลืออีก ${cpn.remainingQuantity} สิทธิ์`);
    this.logAudit(staffId, staffName, 'REDEEM_COUPON_UNIT', 'coupon', cpn.id, note || `Redeemed unit ${redemptionNumber}`, null, log);

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

    // 1. Auto-synthesize from Coin topups
    for (const tx of this.db.coinTransactions) {
      if (tx.type === 'credit_added' && !tx.reversed && tx.amount > 0) {
        const client = this.db.clients.find((c) => c.id === tx.clientId);
        const clientName = client ? `${client.displayName} (${client.nickname})` : 'ลูกค้าทั่วไป';
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

    // 2. Auto-synthesize from Points transactions (Direct cash/promptpay payments)
    for (const tx of this.db.pointsTransactions) {
      if (tx.type === 'points_earned' && !tx.reversed) {
        const client = this.db.clients.find((c) => c.id === tx.clientId);
        const clientName = client ? `${client.displayName} (${client.nickname})` : 'ลูกค้าทั่วไป';

        let spendAmt = 0;
        const match = tx.note.match(/ยอดชำระ:\s*฿?\s*([0-9,]+)/i) || tx.note.match(/฿\s*([0-9,]+)/);
        if (match) {
          spendAmt = Number(match[1].replace(/,/g, ''));
        } else if (tx.amount > 0) {
          spendAmt = tx.amount * 10;
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
      if (pkg.pricePaid && pkg.pricePaid > 0) {
        const client = this.db.clients.find((c) => c.id === pkg.clientId);
        const clientName = client ? `${client.displayName} (${client.nickname})` : 'ลูกค้าทั่วไป';
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
}

export const store = new Store();
