/**
 * Localization dictionary for Thai (th) and English (en)
 * Default language: Thai (th)
 */

import { AppLanguage, PointsTier } from '../types';

export const translations = {
  th: {
    // General & Brand
    brandName: 'Me.My.Mind Membership',
    brandTagline: 'Your Daily Ritual of Self-Love',
    currency: '฿',
    currencyUnit: 'บาท',
    pointsUnit: 'คะแนน',
    sessionsUnit: 'ครั้ง',
    itemsUnit: 'สิทธิ์',
    confirm: 'ยืนยัน',
    cancel: 'ยกเลิก',
    back: 'ย้อนกลับ',
    save: 'บันทึก',
    search: 'ค้นหา',
    filter: 'ตัวกรอง',
    close: 'ปิด',
    loading: 'กำลังโหลด...',
    success: 'ทำรายการสำเร็จ',
    error: 'เกิดข้อผิดพลาด',
    reasonRequired: 'กรุณาระบุเหตุผลในการทำรายการ',
    note: 'บันทึกเพิ่มเติม',
    
    // Status Badges
    statusActive: 'ใช้งานได้',
    statusExpiringSoon: 'ใกล้หมดอายุ (ภายใน 7 วัน)',
    statusUsedUp: 'ใช้งานครบแล้ว',
    statusReversed: 'ยกเลิกรายการแล้ว',

    // Customer App Views
    navHome: 'หน้าแรก',
    navPackages: 'แพ็กเกจของฉัน',
    navCoupons: 'คูปองของฉัน',
    navCoin: 'Me.My.Mind Coin',
    navPoints: 'คะแนนสะสม',
    navHistory: 'ประวัติรวม',
    navQr: 'คิวอาร์โค้ดสมาชิก',
    navNotifications: 'การแจ้งเตือน',

    // Home Screen
    welcomeUser: 'ยินดีต้อนรับคุณ',
    memberCodeLabel: 'รหัสสมาชิก',
    coinBalanceTitle: 'ยอดเงิน Me.My.Mind Coin',
    coinDisclaimer: 'Me.My.Mind Coin คือเครดิตแทนเงินสดสำหรับใช้บริการต่าง ๆ ภายใน Me.My.Mind Mindfulness Studio ไม่ใช่เงินสดตามกฎหมาย ไม่สามารถถอนเป็นเงินสดหรือโอนย้ายได้',
    quickStatsPackages: 'แพ็กเกจคงเหลือ',
    quickStatsCoupons: 'คูปองใช้งานได้',
    quickStatsPoints: 'คะแนนสะสม',
    membershipTierLabel: 'ระดับสมาชิก',
    recentNotificationsTitle: 'การแจ้งเตือนล่าสุด',
    noNotifications: 'ไม่มีการแจ้งเตือนใหม่',

    // Packages & Coupons Views
    myPackagesTitle: 'แพ็กเกจบริการของคุณ',
    myPackagesSubtitle: 'แพ็กเกจที่สามารถใช้งานได้ในปัจจุบัน',
    noActivePackages: 'คุณยังไม่มีแพ็กเกจที่ใช้งานได้ในขณะนี้',
    sessionsRemaining: 'คงเหลือ {remaining} จากทั้งหมด {total} ครั้ง',
    purchaseDate: 'วันที่ซื้อ',
    expiryDate: 'วันหมดอายุ',
    usedUpSectionTitle: 'ประวัติแพ็กเกจที่ใช้งานครบแล้ว',

    myCouponsTitle: 'คูปองสิทธิพิเศษของคุณ',
    myCouponsSubtitle: 'ยื่นคูปองให้พนักงานสแกนหรือตรวจสอบเพื่อใช้สิทธิ์',
    noActiveCoupons: 'คุณยังไม่มีคูปองที่ใช้งานได้ในขณะนี้',
    couponQuantityRemaining: 'คงเหลือ {remaining} จากทั้งหมด {total} สิทธิ์',
    couponCodeLabel: 'รหัสคูปองสำหรับพนักงาน',
    couponNotice: 'กรุณาแสดงรหัสคูปองแก่พนักงานขณะรับบริการ (คูปองสแกนโดยพนักงานเท่านั้น)',

    // Coin & Points Views
    coinWalletTitle: 'กระเป๋า Me.My.Mind Coin',
    coinNoticeBanner: 'Me.My.Mind Coin คือเครดิตแทนเงินสดสำหรับใช้บริการต่าง ๆ ภายใน Me.My.Mind Mindfulness Studio ไม่ใช่เงินสดตามกฎหมาย ไม่สามารถถอนเป็นเงินสดหรือโอนย้ายได้',
    coinTransactionHistory: 'ประวัติการเคลื่อนไหว Coin',

    pointsTitle: 'คะแนนสะสม & ระดับสมาชิก',
    pointsTierBadge: 'ระดับสมาชิก {tier}',
    lifetimePointsEarned: 'คะแนนสะสมทั้งหมดที่ได้รับ',
    lifetimePointsRedeemed: 'คะแนนที่ใช้แลกไปแล้ว',
    rewardsCatalogTitle: 'รายการของรางวัลสำหรับแลก',
    rewardsCatalogSubtitle: 'แจ้งพนักงานที่หน้าร้านเพื่อรับของรางวัลด้วยคะแนนสะสม',
    pointsTransactionHistory: 'ประวัติคะแนนสะสม',
    ptsCost: '{pts} คะแนน',
    redeemInPersonNotice: 'แจ้งพนักงานเพื่อใช้คะแนนแลกของรางวัลหน้าร้าน',

    // Member QR
    memberQrTitle: 'คิวอาร์โค้ดประจำตัวสมาชิก',
    memberQrSubtitle: 'แสดงคิวอาร์โค้ดนี้ให้พนักงานสแกนเพื่อค้นหาข้อมูล สะสมคะแนน หรือตัดใช้บริการ',
    copyMemberCode: 'คัดลอกรหัสสมาชิก',
    memberCodeCopied: 'คัดลอกรหัสสมาชิกแล้ว',

    // Staff Dashboard
    staffDashboardTitle: 'ระบบจัดการสมาชิกร้าน Me.My.Mind',
    staffRoleBadge: 'พนักงาน (Staff)',
    adminRoleBadge: 'ผู้ดูแลระบบ (Admin)',
    switchRoleBtn: 'สลับบัญชีพนักงาน',
    switchCustomerViewBtn: 'มุมมองลูกค้า (LIFF Simulation)',
    clientLookupTitle: 'ค้นหาและจัดการข้อมูลลูกค้า',
    searchPlaceholder: 'ค้นหาด้วย ชื่อ, เบอร์โทรศัพท์ หรือ รหัสสมาชิก (MMM-XXXX)...',
    scanQrBtn: 'สแกนคิวอาร์โค้ด',
    addNewClientBtn: '+ เพิ่มลูกค้าใหม่',
    viewCatalogBtn: 'แคตตาล็อกบริการ',
    viewAuditLogBtn: 'บันทึกการทำงาน (Audit Log)',

    // Client Profile (Staff View)
    clientProfileTitle: 'ข้อมูลสมาชิก',
    registeredOn: 'วันที่สมัครสมาชิก',
    lineConnected: 'เชื่อมต่อ LINE แล้ว',
    lineNotConnected: 'ยังไม่ได้เชื่อมต่อ LINE',
    addCoinBtn: '+ เติม Coin (บันทึกรับชำระเงิน)',
    deductCoinBtn: '- ตัด Coin (ใช้บริการ)',
    awardPointsBtn: '+ ให้คะแนนสะสม',
    deductPointsBtn: '- ตัดคะแนนสะสม',
    sellPackageBtn: '+ ขาย / ออกแพ็กเกจให้ลูกค้า',
    sellCouponBtn: '+ ออกคูปองให้ลูกค้า',
    useOneSessionBtn: 'ใช้บริการ 1 ครั้ง',
    useOneCouponBtn: 'ใช้สิทธิ์คูปอง 1 สิทธิ์',
    completedItemsTitle: 'ประวัติแพ็กเกจและคูปองที่ใช้งานครบแล้ว (Used-up)',
    noCompletedItems: 'ยังไม่มีประวัติแพ็กเกจหรือคูปองที่ใช้งานหมดแล้ว',
    completedOn: 'ใช้งานครบเมื่อ',
    pricePaidLabel: 'ราคาที่ชำระ',

    // Modals & Action Titles
    recordPaymentTitle: 'บันทึกการรับชำระเงิน (เพิ่ม Coin)',
    recordPaymentNote: 'พนักงานได้ตรวจสอบยืนยันการรับชำระเงิน (เงินสด/เงินโอน) เรียบร้อยแล้ว',
    deductCoinTitle: 'ตัด Coin ใช้บริการ',
    amountLabel: 'จำนวนเงิน (บาท)',
    pointsAmountLabel: 'จำนวนคะแนน',
    actionNoteLabel: 'บันทึกหมายเหตุ / รายละเอียดการชำระ',
    confirmActionHeader: 'ยืนยันการทำรายการ',

    sellPackageTitle: 'ออกแพ็กเกจบริการให้ลูกค้า',
    sellCouponTitle: 'ออกคูปองสิทธิพิเศษให้ลูกค้า',
    selectCatalogTemplate: 'เลือกประเภทจากแคตตาล็อก',
    customSessionsLabel: 'จำนวนครั้งทั้งหมด (ปรับเปลี่ยนได้)',
    customQuantityLabel: 'จำนวนสิทธิ์ทั้งหมด (ปรับเปลี่ยนได้)',
    customPriceLabel: 'ราคาขายจริง (บาท) (ปรับเปลี่ยนได้)',
    customValidityLabel: 'ระยะเวลาใช้งาน (วัน)',
    customExpiryLabel: 'วันหมดอายุ',

    useSessionConfirmTitle: 'ยืนยันการตัดใช้แพ็กเกจ 1 ครั้ง',
    useSessionConfirmMessage: 'คุณกำลังจะตัดการใช้งาน 1 ครั้งสำหรับแพ็กเกจ "{name}" ของคุณ {clientName}',
    useCouponConfirmTitle: 'ยืนยันการตัดใช้คูปอง 1 สิทธิ์',
    useCouponConfirmMessage: 'คุณกำลังจะตัดใช้คูปอง 1 สิทธิ์สำหรับ "{name}" (รหัส {code}) ของคุณ {clientName}',

    // Reversals
    reversalBtn: 'ยกเลิกรายการ (Undo/Reversal)',
    reversalConfirmTitle: 'ยืนยันการยกเลิกรายการธุรกรรม',
    reversalReasonLabel: 'เหตุผลในการยกเลิกรายการ (จำเป็น)',
    reversalNotice: 'การยกเลิกรายการจะสร้างธุรกรรมปรับปรุงย้อนกลับเพื่อคืนค่า และเก็บประวัติการยกเลิกไว้ในระบบ',

    // Catalog Management Page
    catalogPageTitle: 'จัดการแคตตาล็อกแพ็กเกจและคูปอง',
    addNewServiceBtn: '+ เพิ่มบริการใหม่ในระบบ',
    serviceTypeLabel: 'ประเภทบริการ',
    serviceTypePackage: 'แพ็กเกจ (Package - กำหนดจำนวนครั้ง)',
    serviceTypeCoupon: 'คูปอง (Coupon - กำหนดจำนวนสิทธิ์)',
    serviceNameLabel: 'ชื่อบริการ / แพ็กเกจ',
    serviceDescLabel: 'รายละเอียดบริการ',
    serviceImageLabel: 'รูปภาพประกอบ (อัปโหลดรูปภาพ)',
    serviceImageUploadPrompt: 'คลิกเพื่อเลือกรูปภาพ หรือ ลากไฟล์มาวางที่นี่',
    servicePriceLabel: 'ราคาอ้างอิง (บาท)',
    serviceSessionsLabel: 'จำนวนครั้งเริ่มต้น',
    serviceValidityLabel: 'จำนวนวันหมดอายุเริ่มต้น',
    activeStatusLabel: 'เปิดใช้งานอยู่ในระบบ',
    inactiveStatusLabel: 'ปิดใช้งาน (ไม่แสดงในหน้าขายใหม่)',
    editServiceBtn: 'แก้ไข',
    
    // Create Client Modal
    createClientTitle: 'สร้างบัญชีลูกค้าใหม่',
    clientDisplayName: 'ชื่อ-นามสกุล',
    clientNickname: 'ชื่อเล่น',
    clientPhone: 'เบอร์โทรศัพท์',
    clientBirthday: 'วันเกิด',
    clientNotes: 'หมายเหตุเพิ่มเติม',

    // Audit Log Page
    auditLogTitle: 'บันทึกประวัติการปฏิบัติงานของพนักงาน (Audit Log)',
    auditStaffHeader: 'พนักงาน',
    auditActionHeader: 'การกระทำ',
    auditEntityHeader: 'รายการที่เกี่ยวข้อง',
    auditReasonHeader: 'เหตุผล / หมายเหตุ',
    auditTimestampHeader: 'เวลาที่ทำรายการ',

    // Timezone & Formatting
    timeZoneNotice: 'เวลาแสดงผลตามเขตเวลา Asia/Bangkok',
  },
  en: {
    // General & Brand
    brandName: 'Me.My.Mind Membership',
    brandTagline: 'Your Daily Ritual of Self-Love',
    currency: '฿',
    currencyUnit: 'THB',
    pointsUnit: 'pts',
    sessionsUnit: 'sessions',
    itemsUnit: 'units',
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    search: 'Search',
    filter: 'Filter',
    close: 'Close',
    loading: 'Loading...',
    success: 'Action completed successfully',
    error: 'An error occurred',
    reasonRequired: 'Reason is required for this action',
    note: 'Additional Note',

    // Status Badges
    statusActive: 'Active',
    statusExpiringSoon: 'Expiring Soon (within 7 days)',
    statusUsedUp: 'Used Up',
    statusReversed: 'Reversed',

    // Customer App Views
    navHome: 'Home',
    navPackages: 'My Packages',
    navCoupons: 'My Coupons',
    navCoin: 'Me.My.Mind Coin',
    navPoints: 'Loyalty Points',
    navHistory: 'History',
    navQr: 'Member QR',
    navNotifications: 'Notifications',

    // Home Screen
    welcomeUser: 'Welcome,',
    memberCodeLabel: 'Member Code',
    coinBalanceTitle: 'Me.My.Mind Coin Balance',
    coinDisclaimer: 'In-store credit for Me.My.Mind services only (non-cash, non-refundable, non-transferable)',
    quickStatsPackages: 'Active Packages',
    quickStatsCoupons: 'Available Coupons',
    quickStatsPoints: 'Loyalty Points',
    membershipTierLabel: 'Membership Tier',
    recentNotificationsTitle: 'Recent Notifications',
    noNotifications: 'No new notifications',

    // Packages & Coupons Views
    myPackagesTitle: 'Your Service Packages',
    myPackagesSubtitle: 'Active packages available for your upcoming visits',
    noActivePackages: 'No active packages at the moment',
    sessionsRemaining: '{remaining} of {total} sessions remaining',
    purchaseDate: 'Purchased',
    expiryDate: 'Expires',
    usedUpSectionTitle: 'Completed (Used-up) Packages History',

    myCouponsTitle: 'Your Special Coupons',
    myCouponsSubtitle: 'Show your coupon code to studio staff during checkout',
    noActiveCoupons: 'No active coupons at the moment',
    couponQuantityRemaining: '{remaining} of {total} usages remaining',
    couponCodeLabel: 'Staff Coupon Code',
    couponNotice: 'Please show this coupon code to staff when receiving services. (Scanned by staff only)',

    // Coin & Points Views
    coinWalletTitle: 'Me.My.Mind Coin Wallet',
    coinNoticeBanner: 'Me.My.Mind Coin is in-store credit issued by Me.My.Mind Wellness Studio. It holds no cash value, cannot be withdrawn, and is non-transferable.',
    coinTransactionHistory: 'Coin Transaction History',

    pointsTitle: 'Loyalty Points & Tier',
    pointsTierBadge: '{tier} Tier Member',
    lifetimePointsEarned: 'Lifetime Points Earned',
    lifetimePointsRedeemed: 'Lifetime Points Redeemed',
    rewardsCatalogTitle: 'Rewards Catalog',
    rewardsCatalogSubtitle: 'Browse rewards and speak with studio staff to redeem in person',
    pointsTransactionHistory: 'Points History',
    ptsCost: '{pts} points',
    redeemInPersonNotice: 'In-store staff redemption only',

    // Member QR
    memberQrTitle: 'Your Member QR Code',
    memberQrSubtitle: 'Show this QR code to studio staff to scan for quick profile lookup',
    copyMemberCode: 'Copy Member Code',
    memberCodeCopied: 'Member code copied to clipboard',

    // Staff Dashboard
    staffDashboardTitle: 'Me.My.Mind Staff Management Console',
    staffRoleBadge: 'Staff Member',
    adminRoleBadge: 'Admin Console',
    switchRoleBtn: 'Switch Staff Account',
    switchCustomerViewBtn: 'View Customer App (LIFF Sim)',
    clientLookupTitle: 'Client Search & Lookup',
    searchPlaceholder: 'Search by Name, Phone, or Member Code (MMM-XXXX)...',
    scanQrBtn: 'Scan Member QR',
    addNewClientBtn: '+ Add New Client',
    viewCatalogBtn: 'Service Catalog',
    viewAuditLogBtn: 'Audit Log',

    // Client Profile (Staff View)
    clientProfileTitle: 'Client Profile Workspace',
    registeredOn: 'Joined Studio',
    lineConnected: 'LINE Connected',
    lineNotConnected: 'LINE Not Linked',
    addCoinBtn: '+ Add Coin (Record Payment)',
    deductCoinBtn: '- Deduct Coin (Service Spend)',
    awardPointsBtn: '+ Award Points',
    deductPointsBtn: '- Deduct Points',
    sellPackageBtn: '+ Sell / Issue Package',
    sellCouponBtn: '+ Issue Coupon',
    useOneSessionBtn: 'Use 1 Session',
    useOneCouponBtn: 'Use 1 Unit',
    completedItemsTitle: 'Completed (Used-up) Packages & Coupons History',
    noCompletedItems: 'No completed packages or coupons yet',
    completedOn: 'Completed on',
    pricePaidLabel: 'Price Paid',

    // Modals & Action Titles
    recordPaymentTitle: 'Record Client Payment (Add Coin)',
    recordPaymentNote: 'Staff confirmed payment received via cash or bank transfer',
    deductCoinTitle: 'Deduct Coin for Service',
    amountLabel: 'Amount (THB)',
    pointsAmountLabel: 'Points Amount',
    actionNoteLabel: 'Note / Payment Reference',
    confirmActionHeader: 'Confirm Transaction',

    sellPackageTitle: 'Sell / Issue Package to Client',
    sellCouponTitle: 'Issue Coupon to Client',
    selectCatalogTemplate: 'Select Catalog Template',
    customSessionsLabel: 'Total Sessions (Editable)',
    customQuantityLabel: 'Total Quantity / Usages (Editable)',
    customPriceLabel: 'Actual Price Paid (THB) (Editable)',
    customValidityLabel: 'Validity Period (Days)',
    customExpiryLabel: 'Expiry Date',

    useSessionConfirmTitle: 'Confirm 1 Session Usage',
    useSessionConfirmMessage: 'Deduct 1 session from "{name}" for client {clientName}?',
    useCouponConfirmTitle: 'Confirm 1 Coupon Usage',
    useCouponConfirmMessage: 'Deduct 1 usage from coupon "{name}" (Code {code}) for client {clientName}?',

    // Reversals
    reversalBtn: 'Reverse Transaction (Undo)',
    reversalConfirmTitle: 'Confirm Transaction Reversal',
    reversalReasonLabel: 'Reason for Reversal (Required)',
    reversalNotice: 'Reversing this transaction will create an offsetting adjustment transaction and log the full audit record.',

    // Catalog Management Page
    catalogPageTitle: 'Manage Package & Coupon Catalog',
    addNewServiceBtn: '+ Add New Service Template',
    serviceTypeLabel: 'Service Type',
    serviceTypePackage: 'Package (Session-based)',
    serviceTypeCoupon: 'Coupon (Quantity-based)',
    serviceNameLabel: 'Service / Package Name',
    serviceDescLabel: 'Description',
    serviceImageLabel: 'Service Image (File Upload)',
    serviceImageUploadPrompt: 'Click to select or drop an image file',
    servicePriceLabel: 'Default Reference Price (THB)',
    serviceSessionsLabel: 'Default Total Sessions',
    serviceValidityLabel: 'Default Validity (Days)',
    activeStatusLabel: 'Active in Catalog',
    inactiveStatusLabel: 'Inactive (Soft disabled)',
    editServiceBtn: 'Edit',

    // Create Client Modal
    createClientTitle: 'Create New Client Profile',
    clientDisplayName: 'Full Name',
    clientNickname: 'Nickname',
    clientPhone: 'Phone Number',
    clientBirthday: 'Birthday',
    clientNotes: 'Staff Notes',

    // Audit Log Page
    auditLogTitle: 'Staff Operations Audit Log',
    auditStaffHeader: 'Staff Member',
    auditActionHeader: 'Action',
    auditEntityHeader: 'Target Entity',
    auditReasonHeader: 'Reason / Notes',
    auditTimestampHeader: 'Timestamp',

    // Timezone & Formatting
    timeZoneNotice: 'All timestamps in Asia/Bangkok timezone',
  }
};

/**
 * Format date in Asia/Bangkok time
 */
export function formatDate(isoString: string, lang: AppLanguage = 'th'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', options).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format short date (without time)
 */
export function formatShortDate(isoString: string, lang: AppLanguage = 'th'): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', options).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format number with commas and 2 decimals or 0 decimals
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate tier based on lifetime points
 */
export function getTierFromPoints(lifetimePoints: number): PointsTier {
  if (lifetimePoints >= 5000) return 'Platinum';
  if (lifetimePoints >= 2000) return 'Gold';
  if (lifetimePoints >= 500) return 'Silver';
  return 'Bronze';
}

/**
 * Helper to translate notification titles and messages into Thai when lang is 'th'
 */
export function translateNotificationTitle(title: string, lang: AppLanguage = 'th'): string {
  if (lang !== 'th' || !title) return title;

  const titleDict: Record<string, string> = {
    'Store confirmed your credit addition': 'ยืนยันการเติม Coin เรียบร้อย',
    'Package Session Completed': 'ใช้บริการแพ็กเกจเรียบร้อย',
    'Coupon Expiring Soon': 'คูปองใกล้หมดอายุ',
    'Store Confirmed Payment': 'ยืนยันการรับชำระเงิน',
    'Coin Service Deduction': 'ตัด Coin ใช้บริการเรียบร้อย',
    'Transaction Reversed': 'ปรับปรุงยกเลิกรายการ',
    'Points Awarded': 'ได้รับคะแนนสะสมใหม่',
    'Points Redeemed': 'ใช้คะแนนแลกของรางวัล',
    'Points Transaction Adjusted': 'ปรับปรุงรายการคะแนน',
    'New Package Issued': 'ออกแพ็กเกจใหม่เรียบร้อย',
    'Package Session Deducted': 'ตัดใช้บริการแพ็กเกจ',
    'New Coupon Issued': 'ได้รับคูปองสิทธิพิเศษใหม่',
    'Coupon Redeemed': 'ตัดใช้สิทธิ์คูปองเรียบร้อย',
  };

  return titleDict[title] || title;
}

export function translateNotificationMessage(message: string, lang: AppLanguage = 'th'): string {
  if (lang !== 'th' || !message) return message;

  const msgDict: Record<string, string> = {
    'Staff recorded 5,000 THB Me.My.Mind Coin added to your account.': 'พนักงานบันทึกการเติม 5,000 Coins เข้าบัญชีของคุณเรียบร้อยแล้ว',
    'Staff recorded 1 session deducted from your Glow & Lift Facial Package.': 'พนักงานบันทึกการตัดใช้บริการ 1 ครั้ง จาก Glow & Lift Facial Package ของคุณ',
  };

  if (msgDict[message]) return msgDict[message];

  let result = message;
  result = result.replace(/Staff recorded ([0-9,]+) THB Me\.My\.Mind Coin added to your account\./i, 'พนักงานบันทึกการเติม $1 Coins เข้าบัญชีของคุณเรียบร้อยแล้ว');
  result = result.replace(/Staff recorded \+?([0-9,]+) THB credit to your wallet\./i, 'พนักงานเติม +$1 Coins เข้ากระเป๋าของคุณ');
  result = result.replace(/Staff recorded ([0-9]+) session deducted from your (.+)\./i, 'พนักงานบันทึกการตัดใช้บริการ $1 ครั้ง จาก $2');
  result = result.replace(/Your "(.+)" coupon expires in (\d+) days\./i, 'คูปอง "$1" ของคุณจะหมดอายุภายใน $2 วัน');
  result = result.replace(/You acquired (.+) \((\d+) sessions\)\./i, 'คุณได้รับแพ็กเกจ "$1" (จำนวน $2 ครั้ง)');
  result = result.replace(/Used (\d+) session of (.+)\. Remaining: (\d+) sessions\./i, 'ใช้บริการ $1 ครั้งสำหรับ "$2" คงเหลือ $3 ครั้ง');
  result = result.replace(/You received coupon "(.+)" \(Code: (.+)\)\./i, 'คุณได้รับคูปอง "$1" (รหัสคูปอง: $2)');
  result = result.replace(/Staff redeemed (\d+) unit of coupon "(.+)"\. Remaining: (\d+) units\./i, 'พนักงานตัดใช้สิทธิ์ $1 ครั้ง สำหรับคูปอง "$2" คงเหลือ $3 สิทธิ์');
  result = result.replace(/You earned \+([0-9,]+) points! Total balance: ([0-9,]+) pts\./i, 'คุณได้รับ +$1 คะแนนสะสม! ยอดสะสมรวม $2 คะแนน');
  result = result.replace(/Redeemed ([0-9,]+) points for reward\. Remaining points: ([0-9,]+) pts\./i, 'ใช้คะแนน -$1 คะแนนแลกรับของรางวัล ยอดคงเหลือ $2 คะแนน');
  result = result.replace(/Staff adjusted transaction #(.+)\. Reason: (.*)/i, 'ระบบได้ปรับปรุงยกเลิกรายการ #$1 (เหตุผล: $2)');
  result = result.replace(/Reversed points transaction #(.+)\. Reason: (.*)/i, 'ระบบได้ปรับปรุงยกเลิกรายการคะแนน #$1 (เหตุผล: $2)');

  return result;
}

/**
 * Helper to translate transaction notes into Thai when lang is 'th'
 */
export function translateTxNote(note: string, lang: AppLanguage = 'th'): string {
  if (lang !== 'th' || !note) return note;

  const dictionary: Record<string, string> = {
    'Staff recorded cash payment in studio': 'พนักงานบันทึกการรับชำระเงินสดที่สตูดิโอ',
    'Facial massage individual service deduction': 'ตัด Coin ชำระค่าบริการนวดหน้า',
    'Points awarded for 12,000 THB package purchase': 'ได้รับคะแนนสะสมจากการซื้อแพ็กเกจ 12,000 บาท',
    'Redeemed in-store for Lip Balm reward': 'ใช้คะแนนแลกรับของขวัญ Lip Balm หน้าร้าน',
    'Store recorded payment credit': 'พนักงานบันทึกการเติม Coin',
    'Welcome Bonus Coins - สมาชิกใหม่ Me.My.Mind Membership รับฟรี 100 Bonus Coins': 'โบนัสต้อนรับสมาชิกใหม่ Me.My.Mind Membership (100 Bonus Coins)',
    'Welcome Bonus Coins': 'โบนัสต้อนรับสมาชิกใหม่ (100 Bonus Coins)',
    'Staff recorded store payment': 'พนักงานบันทึกการรับชำระเงินหน้าร้าน',
  };

  if (dictionary[note]) return dictionary[note];

  let result = note;
  result = result.replace(/^Staff recorded \+?([0-9,]+) THB credit to your wallet\.?/i, 'พนักงานเติม +$1 Coins เข้ากระเป๋าของคุณ');
  result = result.replace(/^Staff recorded ฿?([0-9,]+) deducted for service\.?/i, 'พนักงานตัด -$1 Coins สำหรับค่าบริการ');
  result = result.replace(/^Points earned from ([0-9,]+) THB credit payment/i, 'ได้รับคะแนนสะสมจากการเติมเงิน $1 บาท');
  result = result.replace(/^Used 1 session of (.+)\. Remaining: (\d+) sessions\./i, 'ใช้บริการ 1 ครั้งสำหรับ $1 คงเหลือ $2 ครั้ง');
  result = result.replace(/^Staff redeemed 1 unit of coupon "(.+)"\. Remaining: (\d+) units\./i, 'ตัดใช้สิทธิ์ 1 ครั้งสำหรับคูปอง "$1" คงเหลือ $2 สิทธิ์');
  result = result.replace(/^Reversed points transaction #(.+)\. Reason: (.*)/i, 'ยกเลิกรายการคะแนน #$1 (เหตุผล: $2)');
  result = result.replace(/^Reversed transaction #(.+)\. Reason: (.*)/i, 'ยกเลิกรายการ #$1 (เหตุผล: $2)');

  return result;
}


