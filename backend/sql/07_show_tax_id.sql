-- ============================================================
-- 07_show_tax_id.sql — "show tax id" per-document toggle
-- ============================================================
-- Adds a `show_tax_id` flag to quotations and orders so the
-- creator can choose whether the customer's tax id is printed
-- on the generated PDF (without exposing the number in the
-- create form).
--
--   show_tax_id = TRUE  → print the tax id on the document (default)
--   show_tax_id = FALSE → hide it
--
-- Run after 01..06. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS show_tax_id BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE orders     ADD COLUMN IF NOT EXISTS show_tax_id BOOLEAN NOT NULL DEFAULT TRUE;

-- Self-documenting column comments (handy when re-reading the schema later)
COMMENT ON COLUMN quotations.show_tax_id IS 'พิมพ์เลขประจำตัวผู้เสียภาษีของลูกค้าลงในเอกสาร PDF หรือไม่ (TRUE = แสดง)';
COMMENT ON COLUMN orders.show_tax_id     IS 'พิมพ์เลขประจำตัวผู้เสียภาษีของลูกค้าลงในเอกสาร PDF หรือไม่ (TRUE = แสดง)';

-- ------------------------------------------------------------
-- Verify (optional) — should return both columns, default = true:
-- ------------------------------------------------------------
-- SELECT table_name, column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE column_name = 'show_tax_id'
--   AND table_name IN ('quotations', 'orders');
