# ZUUGROUP Frontend

Next.js 14 (App Router) + TypeScript + Tailwind — เรียก ZUUGROUP Backend API ผ่าน `fetch`

## Architecture

- **Next.js App Router** — Client components ทั้งหมด (ไม่มี Server Component ที่เรียก DB ตรง — Backend จัดการให้)
- **JWT** เก็บใน `localStorage` (key: `zuugroup_token`), ส่ง `Authorization: Bearer <jwt>` ทุก request
- **Auth gating** — `app/dashboard/layout.tsx` ตรวจ session ใน client + redirect ถ้าไม่ login หรือเข้าผิด role

## Setup

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า env
```bash
cp .env.local.example .env.local
```
ใน `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. รัน Backend ก่อน
ดู `../backend/README.md`

### 4. รัน Frontend
```bash
npm run dev
```

เปิด http://localhost:3000

## Structure

```
frontend/
├── public/
│   └── fonts/                    # Sarabun font สำหรับ PDF ภาษาไทย
└── src/
    ├── app/
    │   ├── auth/login/           # หน้า login
    │   ├── dashboard/
    │   │   ├── layout.tsx        # Client-side auth gating
    │   │   ├── admin/            # ผู้ดูแล (CRUD users/customers/products/teams + reports)
    │   │   ├── manager/          # ผู้จัดการ (อนุมัติ + รายงานทีม)
    │   │   ├── sales/            # พนักงานขาย (สร้างเอกสาร + ขอเพิ่มลูกค้า)
    │   │   └── cfo/              # ผู้บริหาร (รายงานภาพรวม)
    │   ├── layout.tsx
    │   └── page.tsx              # redirect → /auth/login
    ├── components/
    │   ├── layout/               # Sidebar, TopBar
    │   └── shared/               # CustomerForm, CustomersView, ProductsView
    └── lib/
        ├── api/
        │   ├── client.ts         # fetch wrapper + token management
        │   ├── auth.ts           # login, logout, forgotPassword, fetchMe
        │   └── services.ts       # customersApi, productsApi, ...
        └── pdf/                  # jsPDF + Sarabun สำหรับ PDF ภาษาไทย
```

## Auth Flow

1. POST `/api/auth/login` → ได้ `{session, user}` → เก็บ token + user ใน localStorage
2. ทุก request ส่ง `Authorization: Bearer <token>` อัตโนมัติ
3. ถ้า Backend ตอบ 401 → clear localStorage + redirect ไป `/auth/login`
4. `dashboard/layout.tsx` redirect ตาม role ถ้าผู้ใช้พยายามเข้า section ที่ไม่ตรง

## API Services

```typescript
import { customersApi, ordersApi, quotationsApi } from '@/lib/api/services'

const customers = await customersApi.list()
await ordersApi.confirm(orderId)
const docs = await quotationsApi.list({ scope: 'team' })
```

ดู `src/lib/api/services.ts` สำหรับ API ทั้งหมด

## หมายเหตุ Image Upload

เนื่องจาก Frontend ไม่ติดต่อ Supabase Storage ตรง (Backend เป็น API gateway), ฟอร์มอัปโหลดรูปจึงใช้วิธี **paste URL** แทน

ถ้าต้องการรองรับ file upload จริงๆ ให้เพิ่ม endpoint `POST /api/uploads` ใน Backend ที่รับ multipart/form-data แล้วโยนเข้า Supabase Storage (หรือ S3) แล้วคืน URL กลับ
