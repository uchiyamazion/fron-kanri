import { useState } from 'react'
import { today, daysDiff, nextLegalInspection, legalInspectionType } from '../utils'
import {
  INSPECTION_CATEGORY_OPTIONS, INSPECTION_METHOD_OPTIONS, LEAK_RESULT_OPTIONS,
  LEAK_CAUSE_OPTIONS, LEAK_LOCATION_OPTIONS, REPAIR_CONTENT_OPTIONS,
} from '../constants'
import { Badge, statusVariant, statusLabel } from './Badge'
import { LegalRecordPrint } from './LegalRecordPrint'

const NO_UPDATE_CATEGORIES = ['廃棄', '譲渡']
const REPAIR_CATEGORIES = ['漏えい修理']

const newRow = eqId => ({
  eqId, date: today(),
  category: '定期点検',
  fillAmount: '', refillAmount: '', recoveryAmount: '',
  method: 'システム漏えい試験（気密試験）',
  result: 'なし',
  cause: '', location: '', repair: '',
  vendor: '', technician: '', repairReason: '', repairDueDate: '', note: '',
})

const headStyle = { textAlign: 'left', padding: '5px 5px', borderBottom: '1px solid rgba(0,0,0,.15)', fontSize: 10.5, color: '#666', fontWeight: 600, whiteSpace: 'nowrap', background: '#f5f3ee' }
const tdStyle = { padding: '2px 3px', borderBottom: '0.5px solid rgba(0,0,0,.08)', verticalAlign: 'middle' }
const inputStyle = { width: '100%', fontSize: 11.5, border: '1px solid transparent', padding: '4px 4px', borderRadius: 4, background: 'transparent' }
const inputFocusable = { ...inputStyle }

export function LegalInspection({ db, addRecord, updateRecord, deleteRecord, toast }) {
  const [eqId, setEqId] = useState('')
  const [showPrint, setShowPrint] = useState(false)

  const eq = db.equipment.find(e => e.id === eqId)
  const rows = db.legal.filter(r => r.eqId === eqId).slice().sort((a, b) => a.date.localeCompare(b.date))

  function field(row, key) {
    return {
      value: row[key] || '',
      onChange: e => {
        const value = e.target.value
        updateRecord('legal', row.id, { [key]: value })
        if (key === 'date' && !NO_UPDATE_CATEGORIES.includes(row.category)) {
          updateRecord('equipment', row.eqId, { lastLegal: value })
        }
        if (key === 'category' && !NO_UPDATE_CATEGORIES.includes(value) && row.date) {
          updateRecord('equipment', row.eqId, { lastLegal: row.date })
        }
      },
    }
  }

  function addRow() {
    if (!eqId) { toast('先に機器を選択してください', 'error'); return }
    addRecord('legal', newRow(eqId))
  }

  function delRow(id) {
    if (!confirm('この行を削除しますか？')) return
    deleteRecord('legal', id)
  }

  const Select = ({ row, k, options, placeholder }) => (
    <select {...field(row, k)} style={inputFocusable}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  const VendorSelect = ({ row }) => (
    <select {...field(row, 'vendor')} style={inputFocusable}>
      <option value="">—</option>
      {db.vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
    </select>
  )

  const TechSelect = ({ row }) => (
    <select {...field(row, 'technician')} style={inputFocusable}>
      <option value="">—</option>
      {db.technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
    </select>
  )

  const techQualNo = name => db.technicians.find(t => t.name === name)?.qualNo || ''

  return (
    <div>
      {/* 対象機器選択 */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant="info">第16条</Badge>
            <span style={{ fontWeight: 500, fontSize: 13 }}>冷媒漏えい点検・整備記録簿</span>
            <span style={{ fontSize: 11, color: '#999' }}>（機器ごとに1枚）</span>
          </div>
          <select value={eqId} onChange={e => setEqId(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">— 対象機器を選択 —</option>
            {db.equipment.map(o => <option key={o.id} value={o.id}>{o.id} / {o.name}（{o.location}）</option>)}
          </select>
        </div>

        {eq && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginTop: 10, paddingTop: 10, borderTop: '0.5px dashed rgba(0,0,0,.1)', fontSize: 11.5, color: '#555' }}>
            <span>管理番号: <b>{eq.id}</b></span>
            <span>機器管理者: <b>{eq.customerName || '未設定'}</b></span>
            <span>系統名: <b>{eq.name}</b></span>
            <span>使用冷媒: <b>{eq.ref}</b></span>
            <span>区分: <b>{legalInspectionType(eq.kw)}</b></span>
            <span style={{ color: '#aaa' }}>機器情報は「機器台帳」で編集できます</span>
          </div>
        )}
      </div>

      {!eq ? (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 30, textAlign: 'center', color: '#999', fontSize: 13, marginBottom: 12 }}>
          機器を選択すると、その機器の点検・整備記録をここに直接入力できます
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>点検・整備記録（表に直接入力）</span>
            <button onClick={() => setShowPrint(true)} style={{ padding: '5px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>帳票印刷</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
              <thead>
                <tr>
                  {['作業年月日', '点検・整備区分', '充填量(kg)', '回収戻し(kg)', '回収量(kg)', '点検内容', '点検結果', '漏えい・故障原因', '漏えい・故障箇所', '修理の内容', '業者名', '技術者氏名', '技術者No.', '修理困難理由', '修理予定日', ''].map(h => (
                    <th key={h} style={headStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td style={{ ...tdStyle, padding: 14, color: '#999', fontSize: 12 }} colSpan={16}>まだ記録がありません。「+ 行を追加」から入力してください</td></tr>
                )}
                {rows.map(row => {
                  const needsRepair = REPAIR_CATEGORIES.includes(row.category) || (row.result && row.result !== 'なし')
                  return (
                    <tr key={row.id}>
                      <td style={tdStyle}><input type="date" {...field(row, 'date')} style={inputFocusable} /></td>
                      <td style={tdStyle}><Select row={row} k="category" options={INSPECTION_CATEGORY_OPTIONS} /></td>
                      <td style={{ ...tdStyle, width: 70 }}><input type="number" step="0.1" min="0" {...field(row, 'fillAmount')} style={inputFocusable} /></td>
                      <td style={{ ...tdStyle, width: 70 }}><input type="number" step="0.1" min="0" {...field(row, 'refillAmount')} style={inputFocusable} /></td>
                      <td style={{ ...tdStyle, width: 70 }}><input type="number" step="0.1" min="0" {...field(row, 'recoveryAmount')} style={inputFocusable} /></td>
                      <td style={tdStyle}><Select row={row} k="method" options={INSPECTION_METHOD_OPTIONS} /></td>
                      <td style={tdStyle}><Select row={row} k="result" options={LEAK_RESULT_OPTIONS} /></td>
                      <td style={tdStyle}>{needsRepair ? <Select row={row} k="cause" options={LEAK_CAUSE_OPTIONS} placeholder="—" /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}</td>
                      <td style={tdStyle}>{needsRepair ? <Select row={row} k="location" options={LEAK_LOCATION_OPTIONS} placeholder="—" /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}</td>
                      <td style={tdStyle}>{needsRepair ? <Select row={row} k="repair" options={REPAIR_CONTENT_OPTIONS} placeholder="—" /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}</td>
                      <td style={tdStyle}><VendorSelect row={row} /></td>
                      <td style={tdStyle}><TechSelect row={row} /></td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#888', padding: '4px 6px', whiteSpace: 'nowrap' }}>{techQualNo(row.technician) || '—'}</td>
                      <td style={tdStyle}><input {...field(row, 'repairReason')} placeholder="やむを得ない理由" style={inputFocusable} /></td>
                      <td style={{ ...tdStyle, width: 130 }}><input type="date" {...field(row, 'repairDueDate')} style={inputFocusable} /></td>
                      <td style={tdStyle}>
                        <button onClick={() => delRow(row.id)} style={{ padding: '2px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button onClick={addRow} style={{ marginTop: 10, padding: '7px 14px', border: '1px dashed #185FA5', borderRadius: 8, background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12 }}>+ 行を追加</button>
        </div>
      )}

      {/* 機器ごとの次回点検状況（全機器） */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>次回点検状況（全機器）</div>
        {db.equipment.length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>機器を登録すると表示されます</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['機器ID', '機器名', '区分', '前回点検', '次回期限', '状態', ''].map(h => (
                    <th key={h} style={headStyle}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {db.equipment.map(e => {
                    const nd = nextLegalInspection(e)
                    const d = nd ? daysDiff(nd) : null
                    const type = legalInspectionType(e.kw)
                    return (
                      <tr key={e.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                        <td style={{ padding: '6px', fontSize: 11, fontFamily: 'monospace' }}>{e.id}</td>
                        <td style={{ padding: '6px', fontSize: 11 }}>{e.name}</td>
                        <td style={{ padding: '6px', fontSize: 11 }}><Badge variant={type === '1年点検' ? 'info' : type === '3年点検' ? 'teal' : 'gray'}>{type}</Badge></td>
                        <td style={{ padding: '6px', fontSize: 11 }}>{e.lastLegal || <span style={{ color: '#aaa' }}>未実施</span>}</td>
                        <td style={{ padding: '6px', fontSize: 11, color: d !== null && d < 0 ? '#A32D2D' : 'inherit' }}>{nd || '—'}</td>
                        <td style={{ padding: '6px', fontSize: 11 }}><Badge variant={statusVariant(d)}>{statusLabel(d)}</Badge></td>
                        <td style={{ padding: '6px', fontSize: 11 }}>
                          <button onClick={() => setEqId(e.id)} style={{ padding: '2px 8px', border: '0.5px solid rgba(24,95,165,.4)', borderRadius: 6, background: '#EAF2FB', color: '#185FA5', cursor: 'pointer', fontSize: 11 }}>記録を開く</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showPrint && eq && (
        <LegalRecordPrint
          eq={eq}
          records={rows}
          db={db}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  )
}
