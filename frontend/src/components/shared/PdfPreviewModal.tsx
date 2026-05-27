'use client'

import { useEffect, useState } from 'react'
import { X, Download, ExternalLink, Printer, FileText } from 'lucide-react'

interface Props {
  /** Full standalone HTML doc shown in the preview iframe via srcdoc */
  html: string | null
  /** Suggested filename when user downloads */
  filename: string
  /** Optional title displayed in the modal header */
  title?: string
  /** Called when user closes the modal */
  onClose: () => void
  /** Generate the actual PDF blob. Called when user clicks Download / Print / Open-in-new-tab. */
  generatePdf: () => Promise<Blob>
}

export default function PdfPreviewModal({ html, filename, title, onClose, generatePdf }: Props) {
  const [busy, setBusy] = useState(false)

  // Lock body scroll + Esc-to-close while open
  useEffect(() => {
    if (!html) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [html, onClose])

  const runWithPdf = async (action: 'download' | 'newtab' | 'print') => {
    if (busy) return
    setBusy(true)
    try {
      const blob = await generatePdf()
      const url = URL.createObjectURL(blob)
      if (action === 'download') {
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else if (action === 'newtab') {
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else if (action === 'print') {
        const w = window.open(url, '_blank')
        if (w) w.addEventListener('load', () => { try { w.print() } catch { /* ignore */ } })
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (err: any) {
      console.error('PDF action failed:', err)
      alert('สร้าง PDF ไม่สำเร็จ: ' + (err?.message ?? 'unknown error'))
    } finally {
      setBusy(false)
    }
  }

  if (!html) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{title ?? filename}</h3>
              <p className="text-xs text-gray-500">ตัวอย่างก่อนดาวน์โหลด · {filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => runWithPdf('print')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
              title="พิมพ์"
            >
              <Printer size={15} />
              <span className="hidden md:inline">พิมพ์</span>
            </button>
            <button
              onClick={() => runWithPdf('newtab')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 px-3 py-2 rounded-lg text-sm font-medium"
            >
              <ExternalLink size={15} />
              <span className="hidden md:inline">เปิดแท็บใหม่</span>
            </button>
            <button
              onClick={() => runWithPdf('download')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Download size={15} />
              <span className="hidden sm:inline">{busy ? 'กำลังสร้าง…' : 'ดาวน์โหลด'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview body — pure HTML in iframe (always renders) */}
        <div className="flex-1 bg-gray-200 overflow-hidden">
          <iframe
            srcDoc={html}
            title={title ?? 'preview'}
            className="w-full h-full bg-gray-200"
            style={{ border: 0 }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between gap-3">
          <span>ตัวอย่างนี้แสดงรูปแบบเอกสารก่อนสร้าง PDF — กดปุ่ม "ดาวน์โหลด" เพื่อบันทึกไฟล์</span>
          <span>{busy ? 'กำลังสร้าง PDF…' : 'กด Esc เพื่อปิด'}</span>
        </div>
      </div>
    </div>
  )
}
