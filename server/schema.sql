-- SQLite Schema for Me.My.Mind Membership App
-- Phase 0: SQLite Infrastructure & Migration Schema

PRAGMA foreign_keys = ON;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT
);

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  member_code TEXT UNIQUE NOT NULL,
  line_user_id TEXT,
  display_name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  birthday TEXT,
  profile_pic TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  consent_accepted INTEGER NOT NULL DEFAULT 0,
  consent_accepted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_clients_member_code ON clients(member_code);
CREATE INDEX IF NOT EXISTS idx_clients_line_user_id ON clients(line_user_id);

-- 3. Coin Wallets Table
CREATE TABLE IF NOT EXISTS coin_wallets (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  balance REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_coin_wallets_client_id ON coin_wallets(client_id);

-- 4. Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  resulting_balance REAL NOT NULL,
  created_by_staff_id TEXT NOT NULL,
  created_by_staff_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_bonus INTEGER NOT NULL DEFAULT 0,
  reversed INTEGER NOT NULL DEFAULT 0,
  reversal_reason TEXT,
  reversed_at TEXT,
  reversed_by_staff_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_coin_tx_client_id ON coin_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_coin_tx_created_at ON coin_transactions(created_at);

-- 5. Points Wallets Table
CREATE TABLE IF NOT EXISTS points_wallets (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  lifetime_earned REAL NOT NULL DEFAULT 0,
  lifetime_redeemed REAL NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Bronze'
);
CREATE INDEX IF NOT EXISTS idx_points_wallets_client_id ON points_wallets(client_id);

-- 6. Points Transactions Table
CREATE TABLE IF NOT EXISTS points_transactions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  note TEXT,
  source_type TEXT,
  related_coin_tx_id TEXT,
  related_package_id TEXT,
  related_coupon_id TEXT,
  related_onetime_booking_id TEXT,
  resulting_balance REAL NOT NULL,
  created_by_staff_id TEXT NOT NULL,
  created_by_staff_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reversed INTEGER NOT NULL DEFAULT 0,
  reversal_reason TEXT,
  reversed_at TEXT,
  reversed_by_staff_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_points_tx_client_id ON points_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_points_tx_created_at ON points_transactions(created_at);

-- 7. Catalog Items Table
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price REAL NOT NULL,
  validity_days INTEGER NOT NULL,
  default_sessions INTEGER,
  category TEXT,
  keywords TEXT, -- JSON array string
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  is_crm_marketing_voucher INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_catalog_type ON catalog_items(type);

-- 8. Client Packages Table
CREATE TABLE IF NOT EXISTS client_packages (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  price_paid REAL NOT NULL,
  purchase_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status TEXT NOT NULL,
  used_up_at TEXT,
  created_at TEXT NOT NULL,
  usage_logs TEXT NOT NULL DEFAULT '[]', -- JSON array string
  follow_up_status TEXT,
  follow_up_note TEXT,
  follow_up_updated_at TEXT,
  follow_up_updated_by_staff_name TEXT,
  voided_at TEXT,
  voided_by TEXT,
  void_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_packages_client_id ON client_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON client_packages(status);

-- 9. Client Coupons Table
CREATE TABLE IF NOT EXISTS client_coupons (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  coupon_code TEXT NOT NULL,
  total_quantity INTEGER NOT NULL,
  used_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  price_paid REAL NOT NULL,
  purchase_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status TEXT NOT NULL,
  used_up_at TEXT,
  created_at TEXT NOT NULL,
  redemption_logs TEXT NOT NULL DEFAULT '[]', -- JSON array string
  follow_up_status TEXT,
  follow_up_note TEXT,
  follow_up_updated_at TEXT,
  follow_up_updated_by_staff_name TEXT,
  is_crm_marketing_voucher INTEGER NOT NULL DEFAULT 0,
  voided_at TEXT,
  voided_by TEXT,
  void_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_coupons_client_id ON client_coupons(client_id);
CREATE INDEX IF NOT EXISTS idx_coupons_coupon_code ON client_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON client_coupons(status);

-- 10. Client One-Time Bookings Table
CREATE TABLE IF NOT EXISTS client_one_time_bookings (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  full_price REAL NOT NULL,
  deposit_amount REAL NOT NULL DEFAULT 0,
  payment_status_at_booking TEXT NOT NULL,
  linked_package_id TEXT,
  linked_coupon_id TEXT,
  coin_amount_used REAL NOT NULL DEFAULT 0,
  remaining_amount_paid REAL NOT NULL DEFAULT 0,
  booking_date_time TEXT NOT NULL,
  end_date_time TEXT,
  branch TEXT NOT NULL,
  status TEXT NOT NULL,
  used_at TEXT,
  voided_at TEXT,
  voided_by TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL,
  created_by_staff_id TEXT NOT NULL,
  created_by_staff_name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON client_one_time_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON client_one_time_bookings(status);

-- 11. Reward Catalog Items Table
CREATE TABLE IF NOT EXISTS reward_catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost REAL NOT NULL,
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  min_tier TEXT
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  reserved_for_line_push INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_data TEXT, -- JSON string
  new_data TEXT, -- JSON string
  reason TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 14. Financial Entries Table (Permanent Records)
CREATE TABLE IF NOT EXISTS financial_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  category_name_th TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  client_id TEXT,
  client_name TEXT,
  source_tx_id TEXT,
  created_by_staff_id TEXT NOT NULL,
  created_by_staff_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_auto_generated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_entries(date);
CREATE INDEX IF NOT EXISTS idx_financial_client_id ON financial_entries(client_id);

-- 15. Settings Table (Single row for app-wide settings)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  backup_settings TEXT, -- JSON string
  brand_settings TEXT, -- JSON string
  updated_at TEXT
);
