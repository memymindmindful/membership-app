/**
 * Migration Script: Migrate JSON Database (data/db.json) to SQLite (data/membership.db)
 * Phase 0: Standalone CLI Migration Tool
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_DB_FILE = path.join(DATA_DIR, 'db.json');
const SQLITE_DB_FILE = path.join(DATA_DIR, 'membership.db');
const SCHEMA_FILE = path.join(process.cwd(), 'server', 'schema.sql');

function runMigration() {
  console.log('--------------------------------------------------');
  console.log('Starting Migration: data/db.json -> data/membership.db');
  console.log('--------------------------------------------------');

  if (!fs.existsSync(JSON_DB_FILE)) {
    console.error(`Error: Source JSON file not found at ${JSON_DB_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`Error: Schema SQL file not found at ${SCHEMA_FILE}`);
    process.exit(1);
  }

  // 1. Read source data
  console.log(`Reading source data from: ${JSON_DB_FILE}`);
  const rawData = fs.readFileSync(JSON_DB_FILE, 'utf-8');
  let sourceDb: any = {};
  try {
    sourceDb = JSON.parse(rawData);
  } catch (err: any) {
    console.error(`Error parsing data/db.json: ${err.message}`);
    process.exit(1);
  }

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 2. Initialize SQLite Database and apply schema
  console.log(`Initializing SQLite database at: ${SQLITE_DB_FILE}`);
  const db = new Database(SQLITE_DB_FILE);
  db.pragma('journal_mode = DELETE');
  db.pragma('mmap_size = 0');
  db.pragma('foreign_keys = ON');

  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  db.exec(schemaSql);
  console.log('Applied SQLite schema from server/schema.sql successfully.');

  // Counters for report
  const counts = {
    employees: 0,
    clients: 0,
    coinWallets: 0,
    coinTransactions: 0,
    pointsWallets: 0,
    pointsTransactions: 0,
    catalogItems: 0,
    clientPackages: 0,
    clientCoupons: 0,
    clientOneTimeBookings: 0,
    rewardCatalogItems: 0,
    notifications: 0,
    auditLogs: 0,
    financialEntries: 0,
    settings: 0,
  };

  // 3. Migrate data within a single transaction
  const migrateAll = db.transaction(() => {
    // 3.1 Employees
    if (Array.isArray(sourceDb.employees)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO employees (id, username, password, display_name, role, avatar_url)
        VALUES (@id, @username, @password, @displayName, @role, @avatarUrl)
      `);
      for (const emp of sourceDb.employees) {
        stmt.run({
          id: emp.id,
          username: emp.username,
          password: emp.password || null,
          displayName: emp.displayName,
          role: emp.role,
          avatarUrl: emp.avatarUrl || null,
        });
        counts.employees++;
      }
    }

    // 3.2 Clients
    if (Array.isArray(sourceDb.clients)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO clients (
          id, member_code, line_user_id, display_name, nickname, phone,
          birthday, profile_pic, notes, created_at, consent_accepted, consent_accepted_at
        )
        VALUES (
          @id, @memberCode, @lineUserId, @displayName, @nickname, @phone,
          @birthday, @profilePic, @notes, @createdAt, @consentAccepted, @consentAcceptedAt
        )
      `);
      for (const c of sourceDb.clients) {
        stmt.run({
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
          consentAccepted: c.consentAccepted ? 1 : 0,
          consentAcceptedAt: c.consentAcceptedAt || null,
        });
        counts.clients++;
      }
    }

    // 3.3 Coin Wallets
    if (sourceDb.coinWallets && typeof sourceDb.coinWallets === 'object') {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO coin_wallets (id, client_id, balance)
        VALUES (@id, @clientId, @balance)
      `);
      for (const [clientId, balance] of Object.entries(sourceDb.coinWallets)) {
        stmt.run({
          id: clientId,
          clientId,
          balance: Number(balance) || 0,
        });
        counts.coinWallets++;
      }
    }

    // 3.4 Coin Transactions
    if (Array.isArray(sourceDb.coinTransactions)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO coin_transactions (
          id, client_id, amount, type, note, resulting_balance,
          created_by_staff_id, created_by_staff_name, created_at,
          is_bonus, reversed, reversal_reason, reversed_at, reversed_by_staff_name
        )
        VALUES (
          @id, @clientId, @amount, @type, @note, @resultingBalance,
          @createdByStaffId, @createdByStaffName, @createdAt,
          @isBonus, @reversed, @reversalReason, @reversedAt, @reversedByStaffName
        )
      `);
      for (const tx of sourceDb.coinTransactions) {
        stmt.run({
          id: tx.id,
          clientId: tx.clientId,
          amount: Number(tx.amount) || 0,
          type: tx.type,
          note: tx.note || null,
          resultingBalance: Number(tx.resultingBalance) || 0,
          createdByStaffId: tx.createdByStaffId,
          createdByStaffName: tx.createdByStaffName,
          createdAt: tx.createdAt,
          isBonus: tx.isBonus ? 1 : 0,
          reversed: tx.reversed ? 1 : 0,
          reversalReason: tx.reversalReason || null,
          reversedAt: tx.reversedAt || null,
          reversedByStaffName: tx.reversedByStaffName || null,
        });
        counts.coinTransactions++;
      }
    }

    // 3.5 Points Wallets
    if (sourceDb.pointsWallets && typeof sourceDb.pointsWallets === 'object') {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO points_wallets (
          id, client_id, balance, lifetime_earned, lifetime_redeemed, tier
        )
        VALUES (
          @id, @clientId, @balance, @lifetimeEarned, @lifetimeRedeemed, @tier
        )
      `);
      for (const [clientId, pw] of Object.entries(sourceDb.pointsWallets as Record<string, any>)) {
        stmt.run({
          id: clientId,
          clientId,
          balance: Number(pw.balance) || 0,
          lifetimeEarned: Number(pw.lifetimeEarned) || 0,
          lifetimeRedeemed: Number(pw.lifetimeRedeemed) || 0,
          tier: pw.tier || 'Bronze',
        });
        counts.pointsWallets++;
      }
    }

    // 3.6 Points Transactions
    if (Array.isArray(sourceDb.pointsTransactions)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO points_transactions (
          id, client_id, amount, type, note, source_type,
          related_coin_tx_id, related_package_id, related_coupon_id, related_onetime_booking_id,
          resulting_balance, created_by_staff_id, created_by_staff_name, created_at,
          reversed, reversal_reason, reversed_at, reversed_by_staff_name
        )
        VALUES (
          @id, @clientId, @amount, @type, @note, @sourceType,
          @relatedCoinTxId, @relatedPackageId, @relatedCouponId, @relatedOneTimeBookingId,
          @resultingBalance, @createdByStaffId, @createdByStaffName, @createdAt,
          @reversed, @reversalReason, @reversedAt, @reversedByStaffName
        )
      `);
      for (const tx of sourceDb.pointsTransactions) {
        stmt.run({
          id: tx.id,
          clientId: tx.clientId,
          amount: Number(tx.amount) || 0,
          type: tx.type,
          note: tx.note || null,
          sourceType: tx.sourceType || null,
          relatedCoinTxId: tx.relatedCoinTxId || null,
          relatedPackageId: tx.relatedPackageId || null,
          relatedCouponId: tx.relatedCouponId || null,
          relatedOneTimeBookingId: tx.relatedOneTimeBookingId || null,
          resultingBalance: Number(tx.resultingBalance) || 0,
          createdByStaffId: tx.createdByStaffId,
          createdByStaffName: tx.createdByStaffName,
          createdAt: tx.createdAt,
          reversed: tx.reversed ? 1 : 0,
          reversalReason: tx.reversalReason || null,
          reversedAt: tx.reversedAt || null,
          reversedByStaffName: tx.reversedByStaffName || null,
        });
        counts.pointsTransactions++;
      }
    }

    // 3.7 Catalog Items
    if (Array.isArray(sourceDb.catalogItems)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO catalog_items (
          id, type, name, description, image_url, price,
          validity_days, default_sessions, category, keywords, active,
          created_at, is_crm_marketing_voucher
        )
        VALUES (
          @id, @type, @name, @description, @imageUrl, @price,
          @validityDays, @defaultSessions, @category, @keywords, @active,
          @createdAt, @isCrmMarketingVoucher
        )
      `);
      for (const item of sourceDb.catalogItems) {
        stmt.run({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description || null,
          imageUrl: item.imageUrl || null,
          price: Number(item.price) || 0,
          validityDays: Number(item.validityDays) || 0,
          defaultSessions: item.defaultSessions ? Number(item.defaultSessions) : null,
          category: item.category || null,
          keywords: Array.isArray(item.keywords) ? JSON.stringify(item.keywords) : null,
          active: item.active ? 1 : 0,
          createdAt: item.createdAt,
          isCrmMarketingVoucher: item.isCrmMarketingVoucher ? 1 : 0,
        });
        counts.catalogItems++;
      }
    }

    // 3.8 Client Packages
    if (Array.isArray(sourceDb.clientPackages)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO client_packages (
          id, client_id, catalog_id, name, description, image_url,
          total_sessions, remaining_sessions, price_paid, purchase_date,
          expiry_date, status, used_up_at, created_at, usage_logs,
          follow_up_status, follow_up_note, follow_up_updated_at, follow_up_updated_by_staff_name,
          voided_at, voided_by, void_reason
        )
        VALUES (
          @id, @clientId, @catalogId, @name, @description, @imageUrl,
          @totalSessions, @remainingSessions, @pricePaid, @purchaseDate,
          @expiryDate, @status, @usedUpAt, @createdAt, @usageLogs,
          @followUpStatus, @followUpNote, @followUpUpdatedAt, @followUpUpdatedByStaffName,
          @voidedAt, @voidedBy, @voidReason
        )
      `);
      for (const pkg of sourceDb.clientPackages) {
        stmt.run({
          id: pkg.id,
          clientId: pkg.clientId,
          catalogId: pkg.catalogId,
          name: pkg.name,
          description: pkg.description || null,
          imageUrl: pkg.imageUrl || null,
          totalSessions: Number(pkg.totalSessions) || 0,
          remainingSessions: Number(pkg.remainingSessions) || 0,
          pricePaid: Number(pkg.pricePaid) || 0,
          purchaseDate: pkg.purchaseDate,
          expiryDate: pkg.expiryDate,
          status: pkg.status,
          usedUpAt: pkg.usedUpAt || null,
          createdAt: pkg.createdAt,
          usageLogs: JSON.stringify(pkg.usageLogs || []),
          followUpStatus: pkg.followUpStatus || null,
          followUpNote: pkg.followUpNote || null,
          followUpUpdatedAt: pkg.followUpUpdatedAt || null,
          followUpUpdatedByStaffName: pkg.followUpUpdatedByStaffName || null,
          voidedAt: pkg.voidedAt || null,
          voidedBy: pkg.voidedBy || null,
          voidReason: pkg.voidReason || null,
        });
        counts.clientPackages++;
      }
    }

    // 3.9 Client Coupons
    if (Array.isArray(sourceDb.clientCoupons)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO client_coupons (
          id, client_id, catalog_id, name, description, image_url,
          coupon_code, total_quantity, used_quantity, remaining_quantity,
          price_paid, purchase_date, expiry_date, status, used_up_at,
          created_at, redemption_logs, follow_up_status, follow_up_note,
          follow_up_updated_at, follow_up_updated_by_staff_name,
          is_crm_marketing_voucher, voided_at, voided_by, void_reason
        )
        VALUES (
          @id, @clientId, @catalogId, @name, @description, @imageUrl,
          @couponCode, @totalQuantity, @usedQuantity, @remainingQuantity,
          @pricePaid, @purchaseDate, @expiryDate, @status, @usedUpAt,
          @createdAt, @redemptionLogs, @followUpStatus, @followUpNote,
          @followUpUpdatedAt, @followUpUpdatedByStaffName,
          @isCrmMarketingVoucher, @voidedAt, @voidedBy, @voidReason
        )
      `);
      for (const cpn of sourceDb.clientCoupons) {
        stmt.run({
          id: cpn.id,
          clientId: cpn.clientId,
          catalogId: cpn.catalogId,
          name: cpn.name,
          description: cpn.description || null,
          imageUrl: cpn.imageUrl || null,
          couponCode: cpn.couponCode,
          totalQuantity: Number(cpn.totalQuantity) || 0,
          usedQuantity: Number(cpn.usedQuantity) || 0,
          remainingQuantity: Number(cpn.remainingQuantity) || 0,
          pricePaid: Number(cpn.pricePaid) || 0,
          purchaseDate: cpn.purchaseDate,
          expiryDate: cpn.expiryDate,
          status: cpn.status,
          usedUpAt: cpn.usedUpAt || null,
          createdAt: cpn.createdAt,
          redemptionLogs: JSON.stringify(cpn.redemptionLogs || []),
          followUpStatus: cpn.followUpStatus || null,
          followUpNote: cpn.followUpNote || null,
          followUpUpdatedAt: cpn.followUpUpdatedAt || null,
          followUpUpdatedByStaffName: cpn.followUpUpdatedByStaffName || null,
          isCrmMarketingVoucher: cpn.isCrmMarketingVoucher ? 1 : 0,
          voidedAt: cpn.voidedAt || null,
          voidedBy: cpn.voidedBy || null,
          voidReason: cpn.voidReason || null,
        });
        counts.clientCoupons++;
      }
    }

    // 3.10 Client One-Time Bookings
    if (Array.isArray(sourceDb.clientOneTimeBookings)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO client_one_time_bookings (
          id, client_id, catalog_id, name, description, image_url,
          full_price, deposit_amount, payment_status_at_booking,
          linked_package_id, linked_coupon_id, coin_amount_used,
          remaining_amount_paid, booking_date_time, end_date_time,
          branch, status, used_at, voided_at, voided_by, void_reason,
          created_at, created_by_staff_id, created_by_staff_name
        )
        VALUES (
          @id, @clientId, @catalogId, @name, @description, @imageUrl,
          @fullPrice, @depositAmount, @paymentStatusAtBooking,
          @linkedPackageId, @linkedCouponId, @coinAmountUsed,
          @remainingAmountPaid, @bookingDateTime, @endDateTime,
          @branch, @status, @usedAt, @voidedAt, @voidedBy, @voidReason,
          @createdAt, @createdByStaffId, @createdByStaffName
        )
      `);
      for (const b of sourceDb.clientOneTimeBookings) {
        stmt.run({
          id: b.id,
          clientId: b.clientId,
          catalogId: b.catalogId,
          name: b.name,
          description: b.description || null,
          imageUrl: b.imageUrl || null,
          fullPrice: Number(b.fullPrice) || 0,
          depositAmount: Number(b.depositAmount) || 0,
          paymentStatusAtBooking: b.paymentStatusAtBooking,
          linkedPackageId: b.linkedPackageId || null,
          linkedCouponId: b.linkedCouponId || null,
          coinAmountUsed: Number(b.coinAmountUsed) || 0,
          remainingAmountPaid: Number(b.remainingAmountPaid) || 0,
          bookingDateTime: b.bookingDateTime,
          endDateTime: b.endDateTime || null,
          branch: b.branch,
          status: b.status,
          usedAt: b.usedAt || null,
          voidedAt: b.voidedAt || null,
          voidedBy: b.voidedBy || null,
          voidReason: b.voidReason || null,
          createdAt: b.createdAt,
          createdByStaffId: b.createdByStaffId,
          createdByStaffName: b.createdByStaffName,
        });
        counts.clientOneTimeBookings++;
      }
    }

    // 3.11 Reward Catalog Items
    if (Array.isArray(sourceDb.rewardCatalogItems)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO reward_catalog_items (
          id, name, description, points_cost, image_url, active, min_tier
        )
        VALUES (
          @id, @name, @description, @pointsCost, @imageUrl, @active, @minTier
        )
      `);
      for (const r of sourceDb.rewardCatalogItems) {
        stmt.run({
          id: r.id,
          name: r.name,
          description: r.description || null,
          pointsCost: Number(r.pointsCost) || 0,
          imageUrl: r.imageUrl || null,
          active: r.active ? 1 : 0,
          minTier: r.minTier || null,
        });
        counts.rewardCatalogItems++;
      }
    }

    // 3.12 Notifications
    if (Array.isArray(sourceDb.notifications)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO notifications (
          id, client_id, title, message, created_at, read, reserved_for_line_push
        )
        VALUES (
          @id, @clientId, @title, @message, @createdAt, @read, @reservedForLinePush
        )
      `);
      for (const n of sourceDb.notifications) {
        stmt.run({
          id: n.id,
          clientId: n.clientId,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read ? 1 : 0,
          reservedForLinePush: n.reservedForLinePush ? 1 : 0,
        });
        counts.notifications++;
      }
    }

    // 3.13 Audit Logs
    if (Array.isArray(sourceDb.auditLogs)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO audit_logs (
          id, staff_id, staff_name, action, entity_type, entity_id,
          previous_data, new_data, reason, timestamp
        )
        VALUES (
          @id, @staffId, @staffName, @action, @entityType, @entityId,
          @previousData, @newData, @reason, @timestamp
        )
      `);
      for (const log of sourceDb.auditLogs) {
        stmt.run({
          id: log.id,
          staffId: log.staffId,
          staffName: log.staffName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          previousData: log.previousData ? JSON.stringify(log.previousData) : null,
          newData: log.newData ? JSON.stringify(log.newData) : null,
          reason: log.reason || null,
          timestamp: log.timestamp,
        });
        counts.auditLogs++;
      }
    }

    // 3.14 Financial Entries (permanent entries only)
    if (Array.isArray(sourceDb.financialEntries)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO financial_entries (
          id, type, category, category_name_th, title, amount, date,
          note, client_id, client_name, source_tx_id,
          created_by_staff_id, created_by_staff_name, created_at, is_auto_generated
        )
        VALUES (
          @id, @type, @category, @categoryNameTh, @title, @amount, @date,
          @note, @clientId, @clientName, @sourceTxId,
          @createdByStaffId, @createdByStaffName, @createdAt, @isAutoGenerated
        )
      `);
      for (const fin of sourceDb.financialEntries) {
        // Only migrate persistent/manual financial entries, skipping transient auto-generated entries
        if (fin.isAutoGenerated) continue;
        stmt.run({
          id: fin.id,
          type: fin.type,
          category: fin.category,
          categoryNameTh: fin.categoryNameTh,
          title: fin.title,
          amount: Number(fin.amount) || 0,
          date: fin.date,
          note: fin.note || null,
          clientId: fin.clientId || null,
          clientName: fin.clientName || null,
          sourceTxId: fin.sourceTxId || null,
          createdByStaffId: fin.createdByStaffId,
          createdByStaffName: fin.createdByStaffName,
          createdAt: fin.createdAt,
          isAutoGenerated: 0,
        });
        counts.financialEntries++;
      }
    }

    // 3.15 Settings (Single row)
    const backupSettings = sourceDb.backupSettings ? JSON.stringify(sourceDb.backupSettings) : null;
    const brandSettings = sourceDb.brandSettings ? JSON.stringify(sourceDb.brandSettings) : null;
    if (backupSettings || brandSettings) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (id, backup_settings, brand_settings, updated_at)
        VALUES ('app_settings', @backupSettings, @brandSettings, @updatedAt)
      `);
      stmt.run({
        backupSettings,
        brandSettings,
        updatedAt: new Date().toISOString(),
      });
      counts.settings = 1;
    }
  });

  // Execute migration in transaction
  migrateAll();

  // 4. Verify and report
  console.log('\n==================================================');
  console.log('Migration Completed Successfully! Summary:');
  console.log('==================================================');
  console.log(`- Employees:                 ${counts.employees}`);
  console.log(`- Clients:                   ${counts.clients}`);
  console.log(`- Coin Wallets:              ${counts.coinWallets}`);
  console.log(`- Coin Transactions:         ${counts.coinTransactions}`);
  console.log(`- Points Wallets:            ${counts.pointsWallets}`);
  console.log(`- Points Transactions:       ${counts.pointsTransactions}`);
  console.log(`- Catalog Items:             ${counts.catalogItems}`);
  console.log(`- Client Packages:           ${counts.clientPackages}`);
  console.log(`- Client Coupons:            ${counts.clientCoupons}`);
  console.log(`- Client One-Time Bookings:  ${counts.clientOneTimeBookings}`);
  console.log(`- Reward Catalog Items:      ${counts.rewardCatalogItems}`);
  console.log(`- Notifications:             ${counts.notifications}`);
  console.log(`- Audit Logs:                ${counts.auditLogs}`);
  console.log(`- Financial Entries:         ${counts.financialEntries}`);
  console.log(`- App Settings:              ${counts.settings}`);
  console.log('--------------------------------------------------');
  console.log(`SQLite database successfully populated at: ${SQLITE_DB_FILE}`);
  console.log(`Source backup remains intact at:           ${JSON_DB_FILE}`);
  console.log('==================================================\n');

  db.close();
}

runMigration();
