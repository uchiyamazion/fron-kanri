/**
 * 統合GAS APIクライアント
 * 空調点検報告システム + フロン管理システム 共通ハブ
 */

const GAS_URL = import.meta.env.VITE_GAS_URL || ''

export const gasEnabled = () => Boolean(GAS_URL)

export const SyncStatus = {
  IDLE:    'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR:   'error',
}

async function gasGet(params) {
  if (!gasEnabled()) throw new Error('GAS URL not configured')
  const qs = new URLSearchParams({ ...params, t: Date.now() }).toString()
  const res = await fetch(`${GAS_URL}?${qs}`)
  if (!res.ok) throw new Error(`GAS error: ${res.status}`)
  const json = await res.json()
  if (json.status === 'error') throw new Error(json.data?.message || 'GAS error')
  return json.data
}

async function gasPost(body) {
  if (!gasEnabled()) throw new Error('GAS URL not configured')
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GAS error: ${res.status}`)
  const json = await res.json()
  if (json.status === 'error') throw new Error(json.data?.message || 'GAS error')
  return json.data
}

// ── フロン管理データ ──────────────────────────────────────────

/** スプレッドシートから全データを取得（点検報告データも含む） */
export async function gasLoad() {
  return gasGet({ action: 'fron_load' })
}

/** フロン管理JSONをバックアップ保存 + サマリ再計算 */
export async function gasSave(db) {
  return gasPost({ action: 'fron_save', data: db })
}

// ── 機器マスタ ────────────────────────────────────────────────

export async function gasFetchEquipment() {
  return gasGet({ action: 'eq_list' })
}

export async function gasSearchEquipment(q) {
  return gasGet({ action: 'eq_search', q })
}

export async function gasUpsertEquipment(data) {
  return gasPost({ action: 'eq_upsert', data })
}

export async function gasDeleteEquipment(id) {
  return gasPost({ action: 'eq_delete', id })
}

// ── 充填・回収記録 ────────────────────────────────────────────

export async function gasFetchFillRecords(eqId, year) {
  return gasGet({ action: 'fill_list', eqId: eqId || '', year: year || '' })
}

export async function gasCreateFillRecord(data) {
  return gasPost({ action: 'fill_create', data })
}

export async function gasDeleteFillRecord(id) {
  return gasPost({ action: 'fill_delete', id })
}

// ── 法定点検 ──────────────────────────────────────────────────

export async function gasCreateLegalRecord(data) {
  return gasPost({ action: 'legal_create', data })
}

export async function gasDeleteLegalRecord(id) {
  return gasPost({ action: 'legal_delete', id })
}

// ── 漏洩量サマリ ──────────────────────────────────────────────

export async function gasGetLeakSummary(year) {
  return gasGet({ action: 'leak_summary', year: year || '' })
}

// ── 手動同期: 点検報告 → フロン管理 ─────────────────────────

export async function gasSyncInspection(inspectionId) {
  return gasPost({ action: 'sync_inspection_to_fron', inspectionId })
}
