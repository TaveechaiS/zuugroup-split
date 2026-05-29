-- ============================================================
-- 08_quotation_to_order.sql — convert an approved quotation into an order
-- ============================================================
-- Adds:
--   • quotation_status value 'ordered' (ออกคำสั่งซื้อแล้ว) — set once an
--     order has been created from the quotation.
--   • orders.source_quotation_id — links an order back to the quotation
--     it was generated from (NULL for normal, manually-created orders).
--   • a partial index to look up orders by their source quotation.
--
-- Workflow note: an order created from an approved quotation skips the
-- manager review step and goes straight to 'processing' (ready for the
-- admin to confirm the sale) — the manager already approved the same
-- items & prices on the quotation.
--
-- Run after 01..07. Safe to re-run (uses IF NOT EXISTS everywhere).
-- ============================================================

-- ------------------------------------------------------------
-- 1) New enum value 'ordered'
-- ------------------------------------------------------------
-- On PostgreSQL 12+ (Supabase) this runs fine alongside the statements
-- below, because 'ordered' is NOT *used* anywhere in this script — a new
-- enum value only becomes usable once its transaction has committed.
-- IF NOT EXISTS makes it safe to re-run.
--
-- ⚠️ Only if your migration tool wraps the whole file in one transaction
--    AND errors with "ALTER TYPE ... ADD VALUE cannot run inside a
--    transaction block": run just this one line on its own first, then
--    run the rest. (Not needed in the Supabase SQL Editor.)
ALTER TYPE quotation_status ADD VALUE IF NOT EXISTS 'ordered';

-- ------------------------------------------------------------
-- 2) Link orders back to their source quotation
-- ------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_quotation_id UUID
    REFERENCES quotations(id) ON DELETE SET NULL;

COMMENT ON COLUMN orders.source_quotation_id IS 'ใบเสนอราคาต้นทางที่ออกคำสั่งซื้อนี้ (NULL = สร้างคำสั่งซื้อเองโดยไม่ผ่านใบเสนอราคา)';

-- ------------------------------------------------------------
-- 3) Index for "find the order(s) made from this quotation"
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_source_quotation
  ON orders (source_quotation_id)
  WHERE source_quotation_id IS NOT NULL;

-- ------------------------------------------------------------
-- Verify (optional):
-- ------------------------------------------------------------
-- -- 'ordered' should appear in the enum:
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'quotation_status'::regtype ORDER BY enumsortorder;
--
-- -- the new column should exist:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'source_quotation_id';
