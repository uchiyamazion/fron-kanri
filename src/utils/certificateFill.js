import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/destruction-cert-template.pdf`
const FONT_URL = `${import.meta.env.BASE_URL}fonts/NotoSansJP-subset.otf`

const PAGE_H = 841.44 // A4 pt

// 元PDFの空欄座標（pdfplumberで実測したラベル位置を基準にオフセット）
// top = ページ上端からの距離(pt)、x = 左端からの距離(pt)
const FIELDS = {
  issueYear:  { x: 232, top: 224, size: 9 },
  issueMonth: { x: 296, top: 224, size: 9 },
  issueDay:   { x: 362, top: 224, size: 9 },

  ownerAddress: { x: 216, top: 258.5, size: 8.5 },
  ownerName:    { x: 216, top: 277.9, size: 8.5 },

  managerAddress: { x: 216, top: 304.4, size: 8.5 },
  managerName:    { x: 216, top: 331.2, size: 8.5 },
  managerTel:     { x: 216, top: 357.9, size: 8.5 },

  facilityAddress: { x: 216, top: 384.1, size: 8.5 },
  facilityName:    { x: 253, top: 410.9, size: 8.5 },

  manageNo: { x: 235, top: 464.2, size: 9 },
  model:    { x: 235, top: 490.1, size: 9 },
  serial:   { x: 425, top: 490.1, size: 9 },

  note: { x: 158, top: 517.3, size: 8.5 },

  // 回収 行1・行2 / 充填 行1・行2
  row1_date: { x: 137, top: 580.2, size: 8.5 },
  row1_ref:  { x: 200, top: 580.2, size: 8.5 },
  row1_qty:  { x: 258, top: 580.2, size: 8.5 },
  row1_gwp:  { x: 410, top: 580.2, size: 8.5 },

  row2_date: { x: 137, top: 598.7, size: 8.5 },
  row2_ref:  { x: 200, top: 598.7, size: 8.5 },
  row2_qty:  { x: 258, top: 598.7, size: 8.5 },
  row2_gwp:  { x: 410, top: 598.7, size: 8.5 },

  row3_date: { x: 137, top: 617.1, size: 8.5 },
  row3_ref:  { x: 200, top: 617.1, size: 8.5 },
  row3_qty:  { x: 258, top: 617.1, size: 8.5 },
  row3_gwp:  { x: 410, top: 617.1, size: 8.5 },

  row4_date: { x: 137, top: 635.3, size: 8.5 },
  row4_ref:  { x: 200, top: 635.3, size: 8.5 },
  row4_qty:  { x: 258, top: 635.3, size: 8.5 },
  row4_gwp:  { x: 410, top: 635.3, size: 8.5 },

  qualNo: { x: 402, top: 709.8, size: 8.5 },

  // 機器の種類チェック（□の中に✓）
  checkAircon: { x: 211, top: 436.8, size: 9 },
  checkFridge:  { x: 390, top: 436.8, size: 9 },
}

async function loadResources() {
  const [templateBytes, fontBytes] = await Promise.all([
    fetch(TEMPLATE_URL).then(r => r.arrayBuffer()),
    fetch(FONT_URL).then(r => r.arrayBuffer()),
  ])
  const pdfDoc = await PDFDocument.load(templateBytes)
  pdfDoc.registerFontkit(fontkit)
  const font = await pdfDoc.embedFont(fontBytes, { subset: true })
  return { pdfDoc, font }
}

function draw(page, font, key, text) {
  if (text === undefined || text === null || text === '') return
  const f = FIELDS[key]
  if (!f) return
  page.drawText(String(text), {
    x: f.x,
    y: PAGE_H - f.top - f.size * 0.85,
    size: f.size,
    font,
    color: rgb(0, 0, 0.05),
  })
}

/**
 * 充填・回収破壊証明書（原本PDF）へデータを差し込んでBlob化する
 * @param {object} eq - 機器情報
 * @param {object[]} recoveries - 回収レコード（最大2件使用）
 * @param {object[]} fills - 充填レコード（最大2件使用）
 * @param {object} opts - { issueDate, note, qualNo }
 */
export async function fillDestructionCertificate(eq, recoveries = [], fills = [], opts = {}) {
  const { pdfDoc, font } = await loadResources()
  const page = pdfDoc.getPages()[0]

  const issue = opts.issueDate ? new Date(opts.issueDate) : new Date()
  draw(page, font, 'issueYear', issue.getFullYear())
  draw(page, font, 'issueMonth', issue.getMonth() + 1)
  draw(page, font, 'issueDay', issue.getDate())

  draw(page, font, 'ownerAddress', eq.location || '')
  draw(page, font, 'ownerName', eq.customerName || '')

  draw(page, font, 'managerAddress', eq.location || '')
  draw(page, font, 'managerName', eq.operManager || '')

  draw(page, font, 'facilityAddress', eq.facilityAddress || eq.location || '')
  draw(page, font, 'facilityName', eq.facilityName || eq.name || '')

  draw(page, font, 'manageNo', eq.id || '')
  draw(page, font, 'model', eq.model || '')
  draw(page, font, 'serial', eq.serial || '')

  draw(page, font, 'note', opts.note || '')
  draw(page, font, 'qualNo', opts.qualNo || '')

  const gwp = (opts.gwp !== undefined && opts.gwp !== '') ? opts.gwp : ''

  const rec = recoveries.slice(0, 2)
  const fil = fills.slice(0, 2)
  ;[0, 1].forEach(i => {
    const r = rec[i]
    if (!r) return
    draw(page, font, `row${i + 1}_date`, r.date || '')
    draw(page, font, `row${i + 1}_ref`, eq.ref || '')
    draw(page, font, `row${i + 1}_qty`, r.amount || '')
    draw(page, font, `row${i + 1}_gwp`, gwp)
  })
  ;[0, 1].forEach(i => {
    const f = fil[i]
    if (!f) return
    draw(page, font, `row${i + 3}_date`, f.date || '')
    draw(page, font, `row${i + 3}_ref`, eq.ref || '')
    draw(page, font, `row${i + 3}_qty`, f.amount || '')
    draw(page, font, `row${i + 3}_gwp`, gwp)
  })

  if ((eq.model || '').includes('冷蔵') || (eq.model || '').includes('冷凍')) {
    draw(page, font, 'checkFridge', 'V')
  } else {
    draw(page, font, 'checkAircon', 'V')
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}
