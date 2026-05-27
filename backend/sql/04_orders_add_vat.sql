-- ============================================================
-- Add VAT / subtotal columns to orders (parity with quotations)
-- + ensure order_status enum has 'cancelled' (needed by /orders/:id/cancel)
-- ============================================================
-- Run this once in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS for enum value).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal     DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_percent  DECIMAL(5, 2)  NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS vat_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes        TEXT;

-- Add 'cancelled' to order_status enum if missing.
-- (Schema originally lacked it but the backend cancel endpoint uses it.)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Backfill subtotal / vat for existing rows (if any) using current total_amount.
-- Assume existing total_amount already includes VAT @ 7%.
UPDATE orders
SET
  subtotal    = ROUND(total_amount / 1.07, 2),
  vat_amount  = ROUND(total_amount - (total_amount / 1.07), 2)
WHERE subtotal = 0 AND total_amount > 0;
