-- ============================================================
-- ZUUGROUP - Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: get current user role
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- USERS policies
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (get_my_role() = 'admin');

-- Others: read own profile
CREATE POLICY "read_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Manager: read team members
CREATE POLICY "manager_read_team" ON users
  FOR SELECT USING (
    get_my_role() = 'manager' AND team_id = get_my_team_id()
  );

-- CFO: read all users
CREATE POLICY "cfo_read_all_users" ON users
  FOR SELECT USING (get_my_role() = 'cfo');

-- ============================================================
-- TEAMS policies
-- ============================================================

CREATE POLICY "admin_all_teams" ON teams
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "all_read_teams" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- CUSTOMERS policies
-- ============================================================

CREATE POLICY "admin_all_customers" ON customers
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "all_read_customers" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- CUSTOMER REQUESTS policies
-- ============================================================

CREATE POLICY "admin_all_customer_requests" ON customer_requests
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "sales_manager_insert_request" ON customer_requests
  FOR INSERT WITH CHECK (
    get_my_role() IN ('sales', 'manager') AND requested_by = auth.uid()
  );

CREATE POLICY "read_own_requests" ON customer_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR get_my_role() IN ('admin', 'manager')
  );

-- ============================================================
-- PRODUCTS policies
-- ============================================================

CREATE POLICY "admin_all_products" ON products
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "all_read_products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- PRODUCT CATEGORIES policies
-- ============================================================

CREATE POLICY "admin_all_categories" ON product_categories
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "all_read_categories" ON product_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- QUOTATIONS policies
-- ============================================================

CREATE POLICY "admin_all_quotations" ON quotations
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "sales_own_quotations" ON quotations
  FOR ALL USING (
    get_my_role() = 'sales' AND created_by = auth.uid()
  );

CREATE POLICY "manager_team_quotations" ON quotations
  FOR ALL USING (
    get_my_role() = 'manager' AND created_by IN (
      SELECT id FROM users WHERE team_id = get_my_team_id()
    )
  );

CREATE POLICY "cfo_read_quotations" ON quotations
  FOR SELECT USING (get_my_role() = 'cfo');

-- ============================================================
-- QUOTATION ITEMS policies (inherit quotation access)
-- ============================================================

CREATE POLICY "quotation_items_via_quotation" ON quotation_items
  FOR ALL USING (
    quotation_id IN (SELECT id FROM quotations)
  );

-- ============================================================
-- ORDERS policies
-- ============================================================

CREATE POLICY "admin_all_orders" ON orders
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "sales_own_orders" ON orders
  FOR ALL USING (
    get_my_role() = 'sales' AND created_by = auth.uid()
  );

CREATE POLICY "manager_team_orders" ON orders
  FOR ALL USING (
    get_my_role() = 'manager' AND created_by IN (
      SELECT id FROM users WHERE team_id = get_my_team_id()
    )
  );

CREATE POLICY "cfo_read_orders" ON orders
  FOR SELECT USING (get_my_role() = 'cfo');

-- ============================================================
-- ORDER ITEMS policies
-- ============================================================

CREATE POLICY "order_items_via_order" ON order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM orders)
  );

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================

CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- ACTIVITY LOGS policies
-- ============================================================

CREATE POLICY "admin_all_logs" ON activity_logs
  FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "own_logs_read" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS: Auto-generate document numbers
-- ============================================================

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quotation_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('quotation_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS quotation_seq START 1;

CREATE TRIGGER set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
  EXECUTE FUNCTION generate_quotation_number();

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- FUNCTION: Log activity automatically
-- ============================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Send notification
-- ============================================================

CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title VARCHAR,
  p_message TEXT,
  p_type VARCHAR DEFAULT 'info',
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_entity_type, p_entity_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Update product stock after order completion
-- ============================================================

CREATE OR REPLACE FUNCTION update_stock_on_order_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE products p
    SET quantity = p.quantity - oi.quantity,
        updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order_complete();

-- ============================================================
-- FUNCTION: Auto-update customer price after quotation approval
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_price_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO customer_product_prices (customer_id, product_id, custom_price, updated_at)
    SELECT NEW.customer_id, qi.product_id, 
           COALESCE(qi.negotiated_price, qi.unit_price),
           NOW()
    FROM quotation_items qi
    WHERE qi.quotation_id = NEW.id
    ON CONFLICT (customer_id, product_id) 
    DO UPDATE SET custom_price = EXCLUDED.custom_price, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_price_trigger
  AFTER UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_price_on_approval();

-- ============================================================
-- SEED DATA: Product Categories
-- ============================================================

INSERT INTO product_categories (name) VALUES
  ('ยาแก้ปวด'),
  ('ยาลดไข้'),
  ('ยาปฏิชีวนะ'),
  ('วิตามินและอาหารเสริม'),
  ('ยาโรคเรื้อรัง'),
  ('อุปกรณ์การแพทย์'),
  ('ยาฉีด'),
  ('ยาทาภายนอก');
