// src/lib/translateError.ts
//
// Translates raw error messages (Postgres / Supabase / Zod / Node) into
// short, friendly Thai messages so end users aren't shown internal jargon.

interface Rule {
  match: RegExp | ((msg: string) => boolean)
  to: string | ((m: RegExpMatchArray | null, raw: string) => string)
}

// --- Postgres / Supabase common errors ---------------------------------
const RULES: Rule[] = [
  // Empty string for type date/timestamp/numeric/uuid
  {
    match: /invalid input syntax for type (date|timestamp[a-z]*|numeric|integer|boolean|uuid)/i,
    to: (m) => {
      const t = m?.[1]?.toLowerCase() ?? ''
      if (t.startsWith('date') || t.startsWith('timestamp')) return 'รูปแบบวันที่ไม่ถูกต้อง — กรุณาตรวจสอบช่องวันที่อีกครั้ง'
      if (t.includes('numeric') || t.includes('integer')) return 'รูปแบบตัวเลขไม่ถูกต้อง — กรุณากรอกตัวเลขเท่านั้น'
      if (t === 'boolean') return 'ค่าไม่ถูกต้อง (ต้องเป็น จริง/เท็จ)'
      if (t === 'uuid') return 'รหัสอ้างอิงไม่ถูกต้อง'
      return 'รูปแบบข้อมูลไม่ถูกต้อง'
    },
  },

  // Duplicate key (unique violation)
  {
    match: /duplicate key value violates unique constraint.*?customer_code/i,
    to: 'รหัสลูกค้านี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น',
  },
  {
    match: /duplicate key value violates unique constraint.*?product_code/i,
    to: 'รหัสสินค้านี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น',
  },
  {
    match: /duplicate key value violates unique constraint.*?order_number/i,
    to: 'เลขที่คำสั่งซื้อนี้มีอยู่แล้ว — กรุณาใช้เลขอื่น',
  },
  {
    match: /duplicate key value violates unique constraint.*?quotation_number/i,
    to: 'เลขที่ใบเสนอราคานี้มีอยู่แล้ว — กรุณาใช้เลขอื่น',
  },
  {
    match: /duplicate key value violates unique constraint.*?email/i,
    to: 'อีเมลนี้ถูกใช้งานแล้ว',
  },
  {
    match: /duplicate key value violates unique constraint.*?code/i,
    to: 'รหัสนี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น',
  },
  {
    match: /duplicate key value violates unique constraint/i,
    to: 'ข้อมูลนี้มีอยู่แล้วในระบบ — กรุณาตรวจสอบอีกครั้ง',
  },

  // NOT NULL violation
  {
    match: /null value in column "(.+?)" .* violates not-null/i,
    to: (m) => {
      const col = m?.[1] ?? 'ข้อมูล'
      return `กรุณากรอกข้อมูลในช่อง "${friendlyCol(col)}"`
    },
  },

  // Foreign key violation
  {
    match: /violates foreign key constraint/i,
    to: 'ข้อมูลอ้างอิงไม่ถูกต้อง — กรุณาเลือกค่าจากรายการให้ครบ',
  },

  // Check constraint
  {
    match: /violates check constraint/i,
    to: 'ค่าที่กรอกไม่ผ่านเงื่อนไขของระบบ — กรุณาตรวจสอบ',
  },

  // Invalid enum
  {
    match: /invalid input value for enum/i,
    to: 'ค่าที่เลือกไม่ถูกต้อง',
  },

  // Auth-related
  {
    match: /Invalid login credentials/i,
    to: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  },
  {
    match: /Email not confirmed/i,
    to: 'อีเมลยังไม่ได้รับการยืนยัน',
  },
  {
    match: /User already registered/i,
    to: 'อีเมลนี้ถูกใช้สมัครแล้ว',
  },
  {
    match: /Password should be at least/i,
    to: 'รหัสผ่านสั้นเกินไป — กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร',
  },
  {
    match: /email rate limit exceeded/i,
    to: 'ระบบส่งอีเมลถูกจำกัดชั่วคราว กรุณารอประมาณ 60 นาที',
  },

  // Network / fetch
  {
    match: /fetch failed/i,
    to: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กรุณาลองใหม่อีกครั้ง',
  },
  {
    match: /ECONNREFUSED|ETIMEDOUT/i,
    to: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กรุณาลองใหม่อีกครั้ง',
  },

  // Permission
  {
    match: /permission denied/i,
    to: 'คุณไม่มีสิทธิ์ทำรายการนี้',
  },
  {
    match: /Row level security|RLS/i,
    to: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
  },

  // Zod parse errors (often a JSON string)
  {
    match: /^\[\{"code"/i,    // raw Zod error array as JSON
    to: 'ข้อมูลที่ส่งไม่ถูกต้อง — กรุณาตรวจสอบช่องที่จำเป็น',
  },

  // Misc
  {
    match: /JSON object requested, multiple .* rows returned/i,
    to: 'พบข้อมูลซ้ำในระบบ — กรุณาติดต่อผู้ดูแลระบบ',
  },
  {
    match: /value too long for type/i,
    to: 'ข้อความยาวเกินไป — กรุณาลดความยาวลง',
  },
]

const COL_LABEL: Record<string, string> = {
  email: 'อีเมล',
  password: 'รหัสผ่าน',
  first_name: 'ชื่อ',
  last_name: 'นามสกุล',
  phone: 'เบอร์โทรศัพท์',
  company_name: 'ชื่อบริษัท',
  customer_code: 'รหัสลูกค้า',
  product_code: 'รหัสสินค้า',
  name: 'ชื่อ',
  quantity: 'จำนวน',
  price_per_unit: 'ราคา',
  cost_price: 'ราคาต้นทุน',
  tax_id: 'เลขผู้เสียภาษี',
  customer_id: 'ลูกค้า',
  product_id: 'สินค้า',
  team_id: 'ทีม',
  zone_id: 'เขตการขาย',
  role: 'บทบาท',
  status: 'สถานะ',
  address: 'ที่อยู่',
  notes: 'หมายเหตุ',
  vat_percent: 'VAT',
}

function friendlyCol(col: string): string {
  return COL_LABEL[col] ?? col
}

/** Convert any raw error message to a friendly Thai message. */
export function translateError(raw: string | undefined | null): string {
  if (!raw) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  const msg = String(raw)

  for (const rule of RULES) {
    if (typeof rule.match === 'function') {
      if (rule.match(msg)) {
        return typeof rule.to === 'function' ? rule.to(null, msg) : rule.to
      }
    } else {
      const m = msg.match(rule.match)
      if (m) {
        return typeof rule.to === 'function' ? rule.to(m, msg) : rule.to
      }
    }
  }

  // If already in Thai (contains Thai char), pass through as-is.
  if (/[฀-๿]/.test(msg)) return msg

  // English / technical → generic Thai fallback so user doesn't see jargon
  return 'เกิดข้อผิดพลาด — กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง'
}
