-- ============================================================
-- FIX: Quotation approve fails because trigger errors rollback
-- ============================================================
-- Issue: update_customer_price_on_approval() runs as caller's
-- security context. If it errors (e.g. RLS on customer_product_prices
-- has no policy and caller isn't service_role), the whole UPDATE
-- on quotations is rolled back, so status stays 'pending'.
--
-- Fix:
--   1. Replace the function as SECURITY DEFINER so it always
--      bypasses RLS on customer_product_prices.
--   2. Wrap the body in EXCEPTION block so any error inside the
--      trigger is logged but does NOT roll back the parent UPDATE.
--   3. Add explicit RLS policy on customer_product_prices for safety.
-- ============================================================

-- Step 1+2: replace trigger function with safer version
CREATE OR REPLACE FUNCTION update_customer_price_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    BEGIN
      INSERT INTO customer_product_prices (customer_id, product_id, custom_price, updated_at)
      SELECT NEW.customer_id, qi.product_id,
             COALESCE(qi.negotiated_price, qi.unit_price),
             NOW()
      FROM quotation_items qi
      WHERE qi.quotation_id = NEW.id
      ON CONFLICT (customer_id, product_id)
      DO UPDATE SET custom_price = EXCLUDED.custom_price, updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      -- Don't block the approval if price sync fails
      RAISE WARNING 'update_customer_price_on_approval failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: explicit RLS policies for customer_product_prices
DROP POLICY IF EXISTS "admin_all_customer_prices" ON customer_product_prices;
CREATE POLICY "admin_all_customer_prices" ON customer_product_prices
  FOR ALL USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "all_read_customer_prices" ON customer_product_prices;
CREATE POLICY "all_read_customer_prices" ON customer_product_prices
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Same fix for the stock update trigger (was also without SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_stock_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    BEGIN
      UPDATE products p
      SET quantity = p.quantity - oi.quantity,
          updated_at = NOW()
      FROM order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'update_stock_on_order_complete failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
