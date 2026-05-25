// src/lib/pdf/createThaiPdf.ts
// Helper to create a jsPDF instance with embedded Sarabun font, Thai-ready.
import jsPDF from 'jspdf'
import { SARABUN_REGULAR_BASE64, SARABUN_BOLD_BASE64 } from './sarabunFont'

export function createThaiPdf(): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // Register Sarabun fonts
  doc.addFileToVFS('Sarabun-Regular.ttf', SARABUN_REGULAR_BASE64)
  doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal')
  doc.addFileToVFS('Sarabun-Bold.ttf', SARABUN_BOLD_BASE64)
  doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold')

  doc.setFont('Sarabun', 'normal')
  return doc
}
