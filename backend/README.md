# ZUUGROUP Backend API

REST API server สำหรับ ZUUGROUP สร้างด้วย **Express + TypeScript + Supabase**

## Architecture

- **Express** — Web server
- **Supabase JS (service role)** — Database client (bypasses RLS; auth enforced ใน middleware)
- **jose** — Verify Supabase JWT (HS256)
- **zod** — Request validation

Frontend → POST `/api/auth/login` → Backend → Supabase Auth → JWT
Frontend → ส่งทุก request พร้อม `Authorization: Bearer <jwt>` → Backend ตรวจ JWT → ดึง profile จาก `users` → ใส่ใน `req.user`

## Setup

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า .env
```bash
cp .env.example .env
```

แก้ค่าใน `.env`:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — จาก Supabase Dashboard > Project Settings > API
- `SUPABASE_JWT_SECRET` — จาก Supabase Dashboard > Project Settings > API > JWT Settings > JWT Secret
- `CORS_ORIGIN` — origin ของ Frontend (default: `http://localhost:3000`)

### 3. รัน SQL schema
ใน Supabase SQL Editor รันไฟล์ตามลำดับ:
1. `sql/01_schema.sql`
2. `sql/02_rls_and_functions.sql`

### 4. รันเซิร์ฟเวอร์
```bash
npm run dev       # development (watch mode)
npm run build && npm start  # production
```

Server: http://localhost:4000

## API Endpoints

### Auth
- `POST /api/auth/login` `{email, password}` → `{session, user}`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password` `{email}`

### Users (admin)
- `GET    /api/users`
- `GET    /api/users/:id`
- `POST   /api/users` `{email, password, first_name, last_name, role, team_id?, phone?}`
- `PATCH  /api/users/:id`
- `DELETE /api/users/:id` (soft delete)

### Customers
- `GET    /api/customers` — all authenticated
- `GET    /api/customers/:id`
- `GET    /api/customers/:id/prices` — custom prices for this customer
- `POST   /api/customers` (admin)
- `PATCH  /api/customers/:id` (admin)
- `DELETE /api/customers/:id` (admin)

### Customer Requests
- `GET    /api/customer-requests` (admin) — pending list
- `GET    /api/customer-requests/:id` (admin)
- `POST   /api/customer-requests` (sales/manager)
- `POST   /api/customer-requests/:id/approve` (admin)
- `POST   /api/customer-requests/:id/reject` `{reason}` (admin)

### Products
- `GET    /api/products`
- `GET    /api/products/categories`
- `GET    /api/products/:id`
- `POST   /api/products` (admin)
- `PATCH  /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

### Teams
- `GET    /api/teams`
- `GET    /api/teams/my` — current user's team
- `POST   /api/teams` (admin)
- `PATCH  /api/teams/:id` (admin)
- `DELETE /api/teams/:id` (admin)

### Quotations
- `GET   /api/quotations?scope=my|team|pending&status=...`
- `GET   /api/quotations/:id`
- `POST  /api/quotations` (sales/manager) `{customer_id, items: [{product_id, quantity, unit_price, negotiated_price?}], vat_percent, notes?, status?, contract_period_days?}`
- `POST  /api/quotations/:id/approve` (manager/admin)
- `POST  /api/quotations/:id/reject` `{reason}` (manager/admin)

### Orders
- `GET   /api/orders?scope=my|team|pending&status=...`
- `GET   /api/orders/:id`
- `POST  /api/orders` (sales/manager) `{customer_id, items: [{product_id, quantity, unit_price}]}`
- `POST  /api/orders/:id/review-pass` (manager/admin)
- `POST  /api/orders/:id/review-reject` `{reason}` (manager/admin)
- `POST  /api/orders/:id/confirm` (admin)
- `POST  /api/orders/:id/cancel` `{reason}` (admin)

### Notifications
- `GET   /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/mark-all-read`

### Dashboard
- `GET /api/dashboard/admin` (admin)
- `GET /api/dashboard/manager` (manager)
- `GET /api/dashboard/cfo` (cfo)

### Reports
- `GET /api/reports/admin` (admin/cfo)
- `GET /api/reports/manager` (manager)

### Activity Logs
- `GET /api/activity-logs` (admin) — last 500 entries

## Structure

```
backend/
├── sql/                         # Schema + RLS
└── src/
    ├── index.ts                 # Server entry
    ├── lib/
    │   └── supabase.ts          # Service-role client + per-user client
    ├── middleware/
    │   ├── auth.ts              # JWT verify + role guard
    │   └── errorHandler.ts
    └── routes/
        ├── auth.ts
        ├── users.ts
        ├── customers.ts
        ├── customerRequests.ts
        ├── products.ts
        ├── teams.ts
        ├── quotations.ts
        ├── orders.ts
        ├── notifications.ts
        ├── dashboard.ts
        ├── reports.ts
        └── activityLogs.ts
```
