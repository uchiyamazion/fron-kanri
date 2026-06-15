import { GWP, LEGAL_INSPECTION_INTERVAL } from '../constants'

export const today = () => new Date().toISOString().split('T')[0]

export function daysDiff(dateStr) {
  const d = new Date(dateStr)
  const now = new Date(today())
  return Math.round((d - now) / (1000 * 60 * 60 * 24))
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export function nextSimpleInspection(lastDate) {
  return lastDate ? addMonths(lastDate, 3) : null
}

export function nextLegalInspection(equipment) {
  const kw = parseFloat(equipment.kw) || 0
  if (!equipment.lastLegal) return null
  if (kw >= LEGAL_INSPECTION_INTERVAL.ANNUAL.minKw)
    return addMonths(equipment.lastLegal, LEGAL_INSPECTION_INTERVAL.ANNUAL.months)
  if (kw >= LEGAL_INSPECTION_INTERVAL.TRIENNIAL.minKw)
    return addMonths(equipment.lastLegal, LEGAL_INSPECTION_INTERVAL.TRIENNIAL.months)
  return null
}

export function legalInspectionType(kw) {
  const k = parseFloat(kw) || 0
  if (k >= 50) return '1年点検'
  if (k >= 7.5) return '3年点検'
  return '任意'
}

export function calcCO2(amountKg, refrigerant) {
  const gwp = GWP[refrigerant] || GWP.other
  return (amountKg * gwp) / 1000
}

export function calcLeakSummary(fills, recoveries, equipment) {
  const year = new Date(today()).getFullYear()
  const yearFills = fills.filter(f => String(f.date).startsWith(year))
  const yearRecs = recoveries.filter(r => String(r.date).startsWith(year))

  const totalFill = yearFills.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
  const totalRec = yearRecs.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const refMap = {}
  yearFills.forEach(f => {
    const eq = equipment.find(e => e.id === f.eqId)
    const ref = eq?.ref || 'other'
    const gwp = GWP[ref] || GWP.other
    if (!refMap[ref]) refMap[ref] = { leak: 0, gwp }
    refMap[ref].leak += parseFloat(f.amount) || 0
  })

  const totalCO2 = Object.values(refMap).reduce((s, v) => s + v.leak * v.gwp / 1000, 0)

  return { totalFill, totalRec, totalLeak: totalFill, totalCO2, refMap, year }
}

export function alertStatus(diffDays) {
  if (diffDays === null || diffDays === undefined) return 'none'
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'urgent'
  if (diffDays <= 30) return 'warning'
  return 'ok'
}

export function exportCSV(fills, recoveries, equipment) {
  const rows = [['種別', '日付', '機器ID', '機器名', '冷媒', '量(kg)', 'CO₂換算(t)', '業者', '理由・証明書番号']]
  fills.forEach(f => {
    const eq = equipment.find(e => e.id === f.eqId)
    const co2 = eq ? calcCO2(f.amount, eq.ref).toFixed(3) : ''
    rows.push(['充填', f.date, f.eqId, eq?.name || '', eq?.ref || '', f.amount, co2, f.vendor, f.reason])
  })
  recoveries.forEach(r => {
    const eq = equipment.find(e => e.id === r.eqId)
    rows.push(['回収', r.date, r.eqId, eq?.name || '', eq?.ref || '', r.amount, '', r.vendor, r.cert])
  })
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `フロン管理記録_${today()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
