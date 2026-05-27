-- ============================================================
-- ZUUGROUP — TEST DATA SEED
-- ============================================================
-- Run in Supabase SQL Editor for testing.
--
-- Prerequisites:
--   - 01_schema.sql, 02_rls_and_functions.sql must already be run
--   - 03_fix_approve_trigger.sql and 04_orders_add_vat.sql also recommended
--   - At least ONE admin user must exist (created via the app or dashboard),
--     because the script uses subqueries to pick `created_by` values.
--
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING / unique guards
-- where possible. Quotations/orders won't be re-inserted if their number
-- already exists.
-- ============================================================

-- =============================================================
-- 1. TEAMS — 3 teams
-- =============================================================
INSERT INTO teams (name, description) VALUES
  ('ทีมขายกรุงเทพ',  'ดูแลลูกค้าในเขตกรุงเทพและปริมณฑล'),
  ('ทีมขายภาคเหนือ', 'ดูแลลูกค้าในจังหวัดเชียงใหม่ ลำพูน และใกล้เคียง'),
  ('ทีมขายภาคใต้',   'ดูแลลูกค้าในจังหวัดสงขลา ภูเก็ต และใกล้เคียง')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 2. PRODUCTS — 10 products (categories already seeded in 02)
-- =============================================================
INSERT INTO products (name, quantity, price_per_unit, unit, status, category_id) VALUES
  ('Paracetamol 500mg (100x10s)',  120, 280.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาแก้ปวด'      LIMIT 1)),
  ('Ibuprofen 400mg (50x10s)',      80, 320.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาแก้ปวด'      LIMIT 1)),
  ('Amoxicillin 500mg (100caps)',   45, 540.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาปฏิชีวนะ'    LIMIT 1)),
  ('Vitamin C 1000mg (60tabs)',    150, 220.00, 'ขวด',   'available', (SELECT id FROM product_categories WHERE name = 'วิตามินและอาหารเสริม' LIMIT 1)),
  ('Metformin 500mg (100tabs)',     60, 180.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาโรคเรื้อรัง' LIMIT 1)),
  ('Cetirizine 10mg (50x10s)',      90, 260.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาแก้ปวด'      LIMIT 1)),
  ('Insulin Pen (5x3ml)',           25, 1850.00, 'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'ยาฉีด'         LIMIT 1)),
  ('Betadine 60ml',                 70, 95.00,  'ขวด',   'available', (SELECT id FROM product_categories WHERE name = 'ยาทาภายนอก'   LIMIT 1)),
  ('Stethoscope Standard',          15, 1290.00,'อัน',   'available', (SELECT id FROM product_categories WHERE name = 'อุปกรณ์การแพทย์' LIMIT 1)),
  ('Surgical Mask 50pcs',          200, 65.00,  'กล่อง', 'available', (SELECT id FROM product_categories WHERE name = 'อุปกรณ์การแพทย์' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =============================================================
-- 3. CUSTOMERS — 10 customers
-- =============================================================
INSERT INTO customers (company_name, contact_name, phone, email, address, drug_license_number) VALUES
  ('โรงพยาบาลกรุงเทพคริสเตียน',     'พญ. สมหญิง วงศ์ดี',     '02-625-9000', 'contact@bch.co.th',     '124 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', '0105560001234'),
  ('คลินิกหมอชัย',                  'นพ. ชัย ใจดี',          '081-234-5678', 'mochai@gmail.com',     '88/12 ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240', '0125560002233'),
  ('ร้านขายยาเภสัชกร',              'ภญ. นภา สุขศรี',        '085-111-2222', 'napa.pharm@line.me',   '45 ถ.พหลโยธิน ต.หางดง อ.หางดง จ.เชียงใหม่ 50230', '0505560003344'),
  ('โรงพยาบาลศูนย์ภูเก็ต',           'ภก. ปกรณ์ ทะเลใส',     '076-237-237', 'pharm@phuket-hospital.go.th', '353 ถ.เยาวราช ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000', '0835560004455'),
  ('คลินิกแพทย์ผิวหนังเชียงใหม่',    'พญ. มาลี ผิวสวย',      '053-888-999', 'malee.skin@gmail.com', '99 ถ.นิมมานเหมินทร์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200', '0505560005566'),
  ('โรงพยาบาลสมุทรปราการ',           'ภก. สมศักดิ์ มั่นคง',  '02-389-5555', 'admin@samut-hospital.go.th', '11 ถ.สุขุมวิท ต.บางปูใหม่ อ.เมือง จ.สมุทรปราการ 10280', '0115560006677'),
  ('คลินิกหัวหิน เมดิคอล',           'นพ. ธีรชัย กลางใจ',     '032-512-345', 'huahin@medical.co.th', '155 ถ.เพชรเกษม ต.หัวหิน อ.หัวหิน จ.ประจวบคีรีขันธ์ 77110', '0775560007788'),
  ('ร้านยาคลังยาพัทยา',              'ภญ. รัตนา ใส่ใจ',      '038-123-456', 'pattaya.drug@hotmail.com', '78 ถ.พัทยาสายสอง ต.หนองปรือ อ.บางละมุง จ.ชลบุรี 20150', '0205560008899'),
  ('โรงพยาบาลสงขลานครินทร์',         'พญ. ปิยะดา ทะเลสาบ',   '074-451-000', 'admin@psu-hospital.go.th', '15 ถ.กาญจนวนิช ต.คอหงส์ อ.หาดใหญ่ จ.สงขลา 90110', '0905560009900'),
  ('คลินิกเฉพาะทางอุดรธานี',         'นพ. วินัย ดินดี',       '042-345-678', 'udon.clinic@gmail.com', '202 ถ.ทหาร ต.หมากแข้ง อ.เมือง จ.อุดรธานี 41000', '0415560011011')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 4. CUSTOMER REQUESTS — 5 pending requests
-- (uses first manager/sales user as `requested_by` — adjust if needed)
-- =============================================================
WITH requester AS (
  SELECT id FROM users WHERE role IN ('sales', 'manager') ORDER BY created_at LIMIT 1
)
INSERT INTO customer_requests (company_name, address, contact_name, phone, requested_by, status)
SELECT * FROM (VALUES
  ('คลินิกเด็กรามอินทรา',  '12 ถ.รามอินทรา แขวงท่าแร้ง เขตบางเขน กรุงเทพฯ 10220', 'นพ. ภาคย์ เด็กดี',  '02-111-2233', (SELECT id FROM requester), 'pending'::customer_request_status),
  ('โรงพยาบาลพะเยา',       '88 ถ.พหลโยธิน ต.บ้านต๋อม อ.เมือง จ.พะเยา 56000',     'ภก. ดวงใจ พะเยา', '054-111-222',  (SELECT id FROM requester), 'pending'::customer_request_status),
  ('คลินิกเภสัชเชียงราย',   '5/9 ถ.ธนาลัย ต.เวียง อ.เมือง จ.เชียงราย 57000',     'ภญ. สุพรรณี เชียงราย','053-555-666', (SELECT id FROM requester), 'pending'::customer_request_status),
  ('ร้านยาขอนแก่นเมดิคอล',  '404 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',   'ภก. ขจร ขอนแก่น',  '043-222-333', (SELECT id FROM requester), 'pending'::customer_request_status),
  ('คลินิกสัตว์ลำปาง',     '12/3 ถ.บุญวาทย์ ต.หัวเวียง อ.เมือง จ.ลำปาง 52000',  'นสพ. ลำปาง รักสัตว์','054-333-444', (SELECT id FROM requester), 'pending'::customer_request_status)
) AS v(company_name, address, contact_name, phone, requested_by, status)
WHERE EXISTS (SELECT 1 FROM requester);

-- =============================================================
-- 5. QUOTATIONS — 10 quotations (mix of statuses)
-- =============================================================
WITH
  creator AS (SELECT id FROM users WHERE role IN ('sales','manager') ORDER BY created_at LIMIT 1),
  approver AS (SELECT id FROM users WHERE role IN ('manager','admin') ORDER BY created_at LIMIT 1),
  c AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers)
INSERT INTO quotations (customer_id, created_by, subtotal, vat_percent, vat_amount, total_amount, status, approved_by, approved_at, contract_period_days, notes)
SELECT customer_id, (SELECT id FROM creator), subtotal, 7, vat_amount, total_amount, status, approved_by, approved_at, contract_period_days, notes
FROM (VALUES
  ((SELECT id FROM c WHERE rn=1),  9800,  686, 10486, 'approved'::quotation_status, (SELECT id FROM approver), NOW() - INTERVAL '20 days', 30, 'เครดิต 30 วัน'),
  ((SELECT id FROM c WHERE rn=2),  15600, 1092, 16692, 'approved'::quotation_status, (SELECT id FROM approver), NOW() - INTERVAL '15 days', 30, NULL),
  ((SELECT id FROM c WHERE rn=3),  4500,  315, 4815,  'pending'::quotation_status,  NULL,                    NULL,                          15, 'รออนุมัติ'),
  ((SELECT id FROM c WHERE rn=4),  28000, 1960,29960, 'approved'::quotation_status, (SELECT id FROM approver), NOW() - INTERVAL '10 days', 60, 'สั่งซื้อจำนวนมาก'),
  ((SELECT id FROM c WHERE rn=5),  3200,  224, 3424,  'rejected'::quotation_status, NULL,                    NULL,                          15, 'ราคาสูงเกินไป'),
  ((SELECT id FROM c WHERE rn=6),  12300, 861, 13161, 'pending'::quotation_status,  NULL,                    NULL,                          30, NULL),
  ((SELECT id FROM c WHERE rn=7),  7800,  546, 8346,  'draft'::quotation_status,    NULL,                    NULL,                          15, 'ฉบับร่าง'),
  ((SELECT id FROM c WHERE rn=8),  21500, 1505,23005, 'approved'::quotation_status, (SELECT id FROM approver), NOW() - INTERVAL '5 days',   30, NULL),
  ((SELECT id FROM c WHERE rn=9),  9100,  637, 9737,  'pending'::quotation_status,  NULL,                    NULL,                          30, NULL),
  ((SELECT id FROM c WHERE rn=10), 5400,  378, 5778,  'approved'::quotation_status, (SELECT id FROM approver), NOW() - INTERVAL '2 days',   15, NULL)
) AS v(customer_id, subtotal, vat_amount, total_amount, status, approved_by, approved_at, contract_period_days, notes)
WHERE EXISTS (SELECT 1 FROM creator);

-- Add a few items to each quotation (links to product index by name)
WITH
  qs AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM quotations LIMIT 10),
  p1 AS (SELECT id FROM products WHERE name = 'Paracetamol 500mg (100x10s)'  LIMIT 1),
  p2 AS (SELECT id FROM products WHERE name = 'Ibuprofen 400mg (50x10s)'     LIMIT 1),
  p3 AS (SELECT id FROM products WHERE name = 'Amoxicillin 500mg (100caps)'  LIMIT 1),
  p4 AS (SELECT id FROM products WHERE name = 'Vitamin C 1000mg (60tabs)'    LIMIT 1),
  p5 AS (SELECT id FROM products WHERE name = 'Surgical Mask 50pcs'          LIMIT 1)
INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price)
SELECT q.id, prod_id, qty, price, qty*price FROM qs q
CROSS JOIN LATERAL (VALUES
  ((SELECT id FROM p1), 10, 280),
  ((SELECT id FROM p2),  5, 320),
  ((SELECT id FROM p4), 20, 220)
) AS items(prod_id, qty, price)
WHERE NOT EXISTS (SELECT 1 FROM quotation_items qi WHERE qi.quotation_id = q.id);

-- =============================================================
-- 6. ORDERS — 10 orders (mix of statuses)
-- =============================================================
WITH
  creator AS (SELECT id FROM users WHERE role IN ('sales','manager') ORDER BY created_at LIMIT 1),
  reviewer AS (SELECT id FROM users WHERE role IN ('manager','admin') ORDER BY created_at LIMIT 1),
  c AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM customers)
INSERT INTO orders (customer_id, created_by, subtotal, vat_percent, vat_amount, total_amount, status, reviewed_by, reviewed_at, processed_by, processed_at, notes)
SELECT customer_id, (SELECT id FROM creator), subtotal, 7, vat_amount, total_amount, status, reviewed_by, reviewed_at, processed_by, processed_at, notes
FROM (VALUES
  ((SELECT id FROM c WHERE rn=1),  9800,  686,  10486, 'completed'::order_status,      (SELECT id FROM reviewer), NOW() - INTERVAL '18 days', (SELECT id FROM reviewer), NOW() - INTERVAL '15 days', 'จัดส่งแล้ว'),
  ((SELECT id FROM c WHERE rn=2),  15600, 1092, 16692, 'completed'::order_status,      (SELECT id FROM reviewer), NOW() - INTERVAL '12 days', (SELECT id FROM reviewer), NOW() - INTERVAL '10 days', NULL),
  ((SELECT id FROM c WHERE rn=3),  4500,  315,  4815,  'pending_review'::order_status, NULL, NULL, NULL, NULL, 'รอตรวจสอบ'),
  ((SELECT id FROM c WHERE rn=4),  28000, 1960, 29960, 'processing'::order_status,     (SELECT id FROM reviewer), NOW() - INTERVAL '5 days', NULL, NULL, 'กำลังดำเนินการ'),
  ((SELECT id FROM c WHERE rn=5),  3200,  224,  3424,  'rejected'::order_status,       (SELECT id FROM reviewer), NOW() - INTERVAL '8 days', NULL, NULL, 'สินค้าหมด'),
  ((SELECT id FROM c WHERE rn=6),  12300, 861,  13161, 'completed'::order_status,      (SELECT id FROM reviewer), NOW() - INTERVAL '7 days', (SELECT id FROM reviewer), NOW() - INTERVAL '6 days', NULL),
  ((SELECT id FROM c WHERE rn=7),  7800,  546,  8346,  'pending_review'::order_status, NULL, NULL, NULL, NULL, NULL),
  ((SELECT id FROM c WHERE rn=8),  21500, 1505, 23005, 'processing'::order_status,     (SELECT id FROM reviewer), NOW() - INTERVAL '3 days', NULL, NULL, 'รอชำระเงิน'),
  ((SELECT id FROM c WHERE rn=9),  9100,  637,  9737,  'cancelled'::order_status,      NULL, NULL, NULL, NULL, 'ลูกค้ายกเลิก'),
  ((SELECT id FROM c WHERE rn=10), 5400,  378,  5778,  'completed'::order_status,      (SELECT id FROM reviewer), NOW() - INTERVAL '2 days', (SELECT id FROM reviewer), NOW() - INTERVAL '1 day',  NULL)
) AS v(customer_id, subtotal, vat_amount, total_amount, status, reviewed_by, reviewed_at, processed_by, processed_at, notes)
WHERE EXISTS (SELECT 1 FROM creator);

-- Items for orders (3 items each)
WITH
  os AS (SELECT id FROM orders LIMIT 10),
  p1 AS (SELECT id FROM products WHERE name = 'Paracetamol 500mg (100x10s)' LIMIT 1),
  p2 AS (SELECT id FROM products WHERE name = 'Cetirizine 10mg (50x10s)'    LIMIT 1),
  p3 AS (SELECT id FROM products WHERE name = 'Betadine 60ml'               LIMIT 1)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT o.id, prod_id, qty, price, qty*price FROM os o
CROSS JOIN LATERAL (VALUES
  ((SELECT id FROM p1), 8,  280),
  ((SELECT id FROM p2), 6,  260),
  ((SELECT id FROM p3), 12,  95)
) AS items(prod_id, qty, price)
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

-- =============================================================
-- DONE — quick summary
-- =============================================================
SELECT
  (SELECT COUNT(*) FROM teams)              AS teams,
  (SELECT COUNT(*) FROM users)              AS users,
  (SELECT COUNT(*) FROM customers)          AS customers,
  (SELECT COUNT(*) FROM products)           AS products,
  (SELECT COUNT(*) FROM customer_requests)  AS customer_requests,
  (SELECT COUNT(*) FROM quotations)         AS quotations,
  (SELECT COUNT(*) FROM quotation_items)    AS quotation_items,
  (SELECT COUNT(*) FROM orders)             AS orders,
  (SELECT COUNT(*) FROM order_items)        AS order_items;
