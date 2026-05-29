-- ============================================================
-- SHOW TAX ID toggle — per-document flag
-- ============================================================
-- Adds a `show_tax_id` flag to quotations and orders so the
-- creator can choose whether the customer's tax id is printed
-- on the generated PDF document (without exposing the number
-- in the create form).
--
-- Default TRUE = show the tax id on the document.
-- Run after 01..06. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS show_tax_id BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE orders     ADD COLUMN IF NOT EXISTS show_tax_id BOOLEAN NOT NULL DEFAULT TRUE;
