# ZUUGROUP — Sales Agent Management System

ระบบจัดการตัวแทนขายยาสำหรับ ZUUGROUP — แยก Backend และ Frontend เป็นคนละโปรเจกต์

## โครงสร้างโปรเจกต์

```
zuugroup-split/
├── backend/          # Express + TypeScript REST API + Supabase service role
└── frontend/         # Next.js 14 (App Router) + Tailwind + jsPDF
```

## Tech Stack

### Backend
- **Express + TypeScript** — REST API server (port 4000)
- **Supabase JS (service role)** — Database client (bypasses RLS, ตรวจ authorization ใน middleware)
- **jose** — Verify Supabase JWT (HS256)
- **zod** — Request validation

### Frontend
- **Next.js 14** (App Router) — Client components
- **Tailwind CSS** — Styling (branding color: `#2563EB`)
- **Recharts** — กราฟ/แดชบอร์ด
- **jsPDF + Sarabun** — สร้าง PDF ภาษาไทย (ใบเสนอราคา + คำสั่งซื้อ)

## Roles

1. **Admin (ผู้ดูแลระบบ)** — CRUD users/customers/products/teams, อนุมัติคำขอเพิ่มลูกค้า, ยืนยันคำสั่งซื้อ, ดู activity logs
2. **Manager (ผู้จัดการทีม)** — อนุมัติใบเสนอราคา + ตรวจสอบคำสั่งซื้อของสมาชิกในทีม + ดูรายงานทีม
3. **Sales (พนักงานขาย)** — สร้างใบเสนอราคา/คำสั่งซื้อ + ส่งคำขอเพิ่มลูกค้า
4. **CFO (ผู้บริหาร)** — ดูแดชบอร์ดและรายงานภาพรวมองค์กร (read-only)

## เริ่มใช้งาน

### 1. ตั้งค่า Supabase Database
1. สร้างโปรเจกต์ใน https://supabase.com
2. ไปที่ SQL Editor แล้วรัน:
   - `backend/sql/01_schema.sql`
   - `backend/sql/02_rls_and_functions.sql`
3. ใน Project Settings > API จดค่า:
   - Project URL
   - `anon` key (public)
   - `service_role` key (เก็บเป็นความลับ)
   - JWT Secret (อยู่ใต้ JWT Settings)

### 2. รัน Backend
```bash
cd backend
npm install
cp .env.example .env
# แก้ค่า SUPABASE_* ใน .env
npm run dev
```
Backend จะรันที่ http://localhost:4000

### 3. รัน Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Frontend จะรันที่ http://localhost:3000

### 4. สร้างบัญชี Admin คนแรก
ใน Supabase Dashboard > Authentication > Users คลิก "Add user" สร้างผู้ใช้ตัวแรก จากนั้นใน SQL Editor:
```sql
INSERT INTO users (id, email, first_name, last_name, role, is_active)
VALUES (
  '<auth-user-id-from-supabase>',
  '<email>',
  'Admin',
  'User',
  'admin',
  true
);
```

จากนั้นใช้ email/password ที่สร้างไป login ที่ http://localhost:3000

## Auth Flow

```
[Frontend Login] 
   → POST /api/auth/login (email, password)
   → [Backend] Supabase Auth → JWT token
   → [Frontend] บันทึก JWT ใน localStorage

[Frontend หน้าอื่น]
   → fetch /api/... + Authorization: Bearer <jwt>
   → [Backend Middleware] jose.jwtVerify(jwt, SUPABASE_JWT_SECRET)
   → ดึง profile จาก users table → req.user
   → ตรวจ role → ทำงาน → ตอบ JSON
```

## เอกสารเพิ่มเติม
- API endpoint ทั้งหมด: `backend/README.md`
- Frontend architecture: `frontend/README.md`
