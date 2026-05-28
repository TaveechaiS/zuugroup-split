// src/lib/api/translateError.ts
//
// Mirror of the backend translateError, used to translate any error
// message that comes from the network/client side (Supabase JS, fetch
// failures, etc.) before showing it in the UI.

interface Rule {
  match: RegExp
  to: string | ((m: RegExpMatchArray) => string)
}

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
const labelFor = (k: string) => COL_LABEL[k] ?? k

const RULES: Rule[] = [
  {
    match: /invalid input syntax for type (date|timestamp[a-z]*|numeric|integer|boolean|uuid)/i,
    to: (m) => {
      const t = m[1]?.toLowerCase() ?? ''
      if (t.startsWith('date') || t.startsWith('timestamp')) return 'รูปแบบวันที่ไม่ถูกต้อง — กรุณาตรวจสอบช่องวันที่อีกครั้ง'
      if (t.includes('numeric') || t.includes('integer')) return 'รูปแบบตัวเลขไม่ถูกต้อง — กรุณากรอกตัวเลขเท่านั้น'
      if (t === 'boolean') return 'ค่าไม่ถูกต้อง (ต้องเป็น จริง/เท็จ)'
      if (t === 'uuid') return 'รหัสอ้างอิงไม่ถูกต้อง'
      return 'รูปแบบข้อมูลไม่ถูกต้อง'
    },
  },
  { match: /duplicate key value violates unique constraint.*?customer_code/i, to: 'รหัสลูกค้านี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น' },
  { match: /duplicate key value violates unique constraint.*?product_code/i, to: 'รหัสสินค้านี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น' },
  { match: /duplicate key value violates unique constraint.*?order_number/i, to: 'เลขที่คำสั่งซื้อนี้มีอยู่แล้ว — กรุณาใช้เลขอื่น' },
  { match: /duplicate key value violates unique constraint.*?quotation_number/i, to: 'เลขที่ใบเสนอราคานี้มีอยู่แล้ว — กรุณาใช้เลขอื่น' },
  { match: /duplicate key value violates unique constraint.*?email/i, to: 'อีเมลนี้ถูกใช้งานแล้ว' },
  { match: /duplicate key value violates unique constraint.*?code/i, to: 'รหัสนี้มีอยู่แล้ว — กรุณาใช้รหัสอื่น' },
  { match: /duplicate key value violates unique constraint/i, to: 'ข้อมูลนี้มีอยู่แล้วในระบบ — กรุณาตรวจสอบอีกครั้ง' },
  {
    match: /null value in column "(.+?)" .* violates not-null/i,
    to: (m) => `กรุณากรอกข้อมูลในช่อง "${labelFor(m[1])}"`,
  },
  { match: /violates foreign key constraint/i, to: 'ข้อมูลอ้างอิงไม่ถูกต้อง — กรุณาเลือกค่าจากรายการให้ครบ' },
  { match: /violates check constraint/i, to: 'ค่าที่กรอกไม่ผ่านเงื่อนไขของระบบ' },
  { match: /invalid input value for enum/i, to: 'ค่าที่เลือกไม่ถูกต้อง' },
  { match: /Invalid login credentials/i, to: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
  { match: /Email not confirmed/i, to: 'อีเมลยังไม่ได้รับการยืนยัน' },
  { match: /User already registered/i, to: 'อีเมลนี้ถูกใช้สมัครแล้ว' },
  { match: /Password should be at least/i, to: 'รหัสผ่านสั้นเกินไป — กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร' },
  { match: /email rate limit exceeded/i, to: 'ระบบส่งอีเมลถูกจำกัดชั่วคราว กรุณารอประมาณ 60 นาที' },
  { match: /Failed to fetch|fetch failed|NetworkError/i, to: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่อีกครั้ง' },
  { match: /permission denied/i, to: 'คุณไม่มีสิทธิ์ทำรายการนี้' },
  { match: /Row level security|RLS/i, to: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
  { match: /value too long for type/i, to: 'ข้อความยาวเกินไป — กรุณาลดความยาวลง' },
  { match: /Request failed/i, to: 'การส่งข้อมูลล้มเหลว — กรุณาลองใหม่อีกครั้ง' },
]

export function translateError(raw: string | undefined | null): string {
  if (!raw) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  const msg = String(raw)
  for (const rule of RULES) {
    const m = msg.match(rule.match)
    if (m) return typeof rule.to === 'function' ? rule.to(m) : rule.to
  }
  if (/[฀-๿]/.test(msg)) return msg
  return 'เกิดข้อผิดพลาด — กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง'
}
