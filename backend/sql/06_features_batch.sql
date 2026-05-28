-- ============================================================
-- FEATURES BATCH — schema changes for the new features
-- ============================================================
-- Adds:
--   • sales_zones table + customer/user zone_id FK
--   • customer_code / product_code (auto-generated + editable)
--   • product cost_price / sale_price (with role-based visibility in API)
--   • product lot_number / manufacture_date / expiry_date
--   • stock_logs table (refill / adjustment history)
--   • customer has_tax_id flag (toggle whether tax id is filled)
--   • quotation/order document-level discount fields
--
-- Run after 01..05. Safe to re-run (uses IF NOT EXISTS where possible).
-- ============================================================

-- =============================================================
-- 1. SALES ZONES — territory model
-- =============================================================
CREATE TABLE IF NOT EXISTS sales_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(50) UNIQUE NOT NULL,   -- manual, e.g. "BKK", "CNX", "S-01"
  name         VARCHAR(100) NOT NULL,         -- e.g. "กรุงเทพและปริมณฑล"
  region       VARCHAR(50),                   -- e.g. "ภาคกลาง", "ภาคเหนือ"
  province     VARCHAR(100),                  -- e.g. "กรุงเทพมหานคร"
  description  TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all_read_sales_zones" ON sales_zones;
CREATE POLICY "all_read_sales_zones" ON sales_zones
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_all_sales_zones" ON sales_zones;
CREATE POLICY "admin_all_sales_zones" ON sales_zones
  FOR ALL USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "manager_insert_sales_zones" ON sales_zones;
CREATE POLICY "manager_insert_sales_zones" ON sales_zones
  FOR INSERT WITH CHECK (get_my_role() = 'manager');

-- =============================================================
-- 2. USERS / CUSTOMERS — zone link
-- =============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES sales_zones(id) ON DELETE SET NULL;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES sales_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS has_tax_id BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);

-- unique customer_code (allowing NULL for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_customer_code
  ON customers(customer_code) WHERE customer_code IS NOT NULL;

-- =============================================================
-- 3. PRODUCTS — cost / sale price, codes, lot / dates
-- =============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_code     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cost_price       DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lot_number       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS manufacture_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date      DATE;

-- rename clarity: existing `price_per_unit` is the SALE price.
-- Don't rename (would break existing code) — backend will treat it as sale_price.

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_product_code
  ON products(product_code) WHERE product_code IS NOT NULL;

-- =============================================================
-- 4. STOCK LOGS — record every quantity change (refill/sale/adjust)
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change       INTEGER NOT NULL,            -- +N for refill, -N for sale/adjust
  before_qty   INTEGER NOT NULL,
  after_qty    INTEGER NOT NULL,
  action       VARCHAR(50) NOT NULL,        -- 'refill' | 'manual_adjust' | 'order_complete' | 'order_cancel'
  reason       TEXT,
  lot_number   VARCHAR(50),
  expiry_date  DATE,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  related_entity_type VARCHAR(50),
  related_entity_id   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_stock_logs" ON stock_logs;
CREATE POLICY "admin_all_stock_logs" ON stock_logs
  FOR ALL USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "read_stock_logs" ON stock_logs;
CREATE POLICY "read_stock_logs" ON stock_logs
  FOR SELECT USING (get_my_role() IN ('admin', 'cfo', 'manager'));

CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON stock_logs(product_id, created_at DESC);

-- =============================================================
-- 5. QUOTATIONS / ORDERS — document-level adjustments
-- =============================================================
-- Discount: percent (0..100) OR fixed amount (Baht), one or the other (or both).
-- Other adjustment: arbitrary line for "ค่าขนส่ง" / "ค่าบริการ" etc.
-- include_vat: whether VAT is added on top of the (subtotal - discount)
-- or already included.
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS include_vat       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS discount_percent  DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_label       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS other_amount      DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS include_vat       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS discount_percent  DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_label       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS other_amount      DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- =============================================================
-- 6. AUTO-GEN sequences for customer_code / product_code
-- =============================================================
CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS product_code_seq  START 1;

-- Trigger: assign code on insert if not provided
CREATE OR REPLACE FUNCTION assign_customer_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code := 'CUS-' || LPAD(nextval('customer_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_customer_code ON customers;
CREATE TRIGGER trg_assign_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION assign_customer_code();

CREATE OR REPLACE FUNCTION assign_product_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
    NEW.product_code := 'PRD-' || LPAD(nextval('product_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_product_code ON products;
CREATE TRIGGER trg_assign_product_code
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION assign_product_code();

-- Backfill codes for existing rows
UPDATE customers SET customer_code = 'CUS-' || LPAD(nextval('customer_code_seq')::TEXT, 4, '0')
WHERE customer_code IS NULL;

UPDATE products SET product_code = 'PRD-' || LPAD(nextval('product_code_seq')::TEXT, 4, '0')
WHERE product_code IS NULL;

-- =============================================================
-- 7. Migrate existing customer drug_license_number → tax_id (one-time)
-- =============================================================
UPDATE customers
SET tax_id = drug_license_number,
    has_tax_id = (drug_license_number IS NOT NULL AND drug_license_number <> '')
WHERE tax_id IS NULL AND drug_license_number IS NOT NULL;
