import { useState } from 'react'
import { today, daysDiff, nextLegalInspection, legalInspectionType } from '../utils'
import {
  INSPECTION_CATEGORY_OPTIONS, INSPECTION_METHOD_OPTIONS, LEAK_RESULT_OPTIONS,
  LEAK_CAUSE_OPTIONS, LEAK_LOCATION_OPTIONS, REPAIR_CONTENT_OPTIONS,
} from '../constants'
import { Badge, statusVariant, statusLabel } from './Badge'
import { LegalRecordPrint } from './LegalRecordPrint'

const NO_UPDATE_CATEGORIES = ['廃棄', '譲渡']

const emptyForm = () => ({
  eqId: '', date: today(),
  category: '定期点検',
  fillAmount: '', refillAmount: '', recoveryAmount: '',
  method: 'システム漏えい試験（気密試験）',
  result: 'なし',
  cause: '', location: '', repair: '',
  vendorId: '', technicianId: '', note: '',
})

const labelStyle = { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }
const cellStyle = { padding: '6px 6px', fontSize: 11, whiteSpace: 'nowrap' }
const headStyle = { textAlign: 'left', padding: '6px 6px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }

export function LegalInspection({ db, addRecord, deleteRecord, updateRecord, toast }) {
  const [form, setForm] = useState(emptyForm())
  const [listFilter, setListFilter] = useState('')
  const [showPrint, setShowPrint] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const needsRepairInfo = form.category === '漏えい修理' || form.result !== 'なし'

  function save() {
    if (!form.eqId || !form.date) { toast('機器と作業年月日を選択してください', 'error'); return }
    const vendorName = db.vendors.find(v => v.id === form.vendorId)?.name || ''
    const technicianName = db.technicians.find(t => t.id === form.technicianId)?.name || ''
    const { vendorId, technicianId, ...rest } = form
    addRecord('legal', { ...rest, vendor: vendorName, technician: technicianName })
    if (!NO_UPDATE_CATEGORIES.includes(form.category)) {
      const eq = db.equipment.find(e => e.id === form.eqId)
      if (eq) updateRecord('equipment', eq.id, { lastLegal: form.date })
    }
    toast('点検・整備記録を保存しました')
    setForm(emptyForm())
  }

  function del(id) {
    if (!confirm('この記録を削除しますか？')) return
    deleteRecord('legal', id)
    toast('記録を削除しました')
  }

  const records = db.legal
    .filter(r => !listFilter || r.eqId === listFilter)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Form: 冷媒漏えい点検・整備記録簿 準拠 */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>冷媒漏えい点検・整備記録</span>
            <Badge variant="info">第16条</Badge>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>機器選択</label>
            <select value={form.eqId} onChange={set('eqId')} style={{ width: '100%' }}>
              <option value="">— 機器を選択 —</option>
              {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} / {eq.name}（{eq.location}）</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>作業年月日</label><input type="date" value={form.date} onChange={set('date')} style={{ width: '100%' }} /></div>
            <div>
              <label style={labelStyle}>点検・整備区分</label>
              <select value={form.category} onChange={set('category')} style={{ width: '100%' }}>
                {INSPECTION_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>充填量(kg)</label><input type="number" step="0.1" min="0" value={form.fillAmount} onChange={set('fillAmount')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>回収戻し充填量(kg)</label><input type="number" step="0.1" min="0" value={form.refillAmount} onChange={set('refillAmount')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>回収量(kg)</label><input type="number" step="0.1" min="0" value={form.recoveryAmount} onChange={set('recoveryAmount')} style={{ width: '100%' }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>点検内容</label>
              <select value={form.method} onChange={set('method')} style={{ width: '100%' }}>
                {INSPECTION_METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>点検結果</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', height: 30 }}>
                {LEAK_RESULT_OPTIONS.map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                    <input type="radio" name="le-result" value={v} checked={form.result === v} onChange={set('result')} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {needsRepairInfo && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>漏えい・故障の原因</label>
                  <select value={form.cause} onChange={set('cause')} style={{ width: '100%' }}>
                    <option value="">— 選択 —</option>
                    {LEAK_CAUSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>漏えい・故障箇所</label>
                  <select value={form.location} onChange={set('location')} style={{ width: '100%' }}>
                    <option value="">— 選択 —</option>
                    {LEAK_LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>修理の内容</label>
                <select value={form.repair} onChange={set('repair')} style={{ width: '100%' }}>
                  <option value="">— 選択 —</option>
                  {REPAIR_CONTENT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>点検・修理・回収・充塡業者名</label>
              <select value={form.vendorId} onChange={set('vendorId')} style={{ width: '100%' }}>
                <option value="">— 業者を選択 —</option>
                {db.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>技術者氏名</label>
              <select value={form.technicianId} onChange={set('technicianId')} style={{ width: '100%' }}>
                <option value="">— 技術者を選択 —</option>
                {db.technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>備考</label>
            <textarea value={form.note} onChange={set('note')} placeholder="任意メモ..." style={{ width: '100%', minHeight: 44 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setForm(emptyForm())} style={{ padding: '6px 12px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>クリア</button>
            <button onClick={save} style={{ padding: '6px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>記録を保存</button>
          </div>
        </div>

        {/* 機器ごとの次回点検状況 */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>次回点検状況</div>
          {db.equipment.length === 0
            ? <div style={{ color: '#888', fontSize: 12 }}>機器を登録すると表示されます</div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['機器ID', '機器名', '区分', '前回点検', '次回期限', '状態'].map(h => (
                      <th key={h} style={headStyle}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {db.equipment.map(eq => {
                      const nd = nextLegalInspection(eq)
                      const d = nd ? daysDiff(nd) : null
                      const type = legalInspectionType(eq.kw)
                      return (
                        <tr key={eq.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                          <td style={{ ...cellStyle, fontFamily: 'monospace' }}>{eq.id}</td>
                          <td style={cellStyle}>{eq.name}</td>
                          <td style={cellStyle}><Badge variant={type === '1年点検' ? 'info' : type === '3年点検' ? 'teal' : 'gray'}>{type}</Badge></td>
                          <td style={cellStyle}>{eq.lastLegal || <span style={{ color: '#aaa' }}>未実施</span>}</td>
                          <td style={{ ...cellStyle, color: d !== null && d < 0 ? '#A32D2D' : 'inherit' }}>{nd || '—'}</td>
                          <td style={cellStyle}><Badge variant={statusVariant(d)}>{statusLabel(d)}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>

      {/* 点検・整備記録一覧（冷媒漏えい点検・整備記録簿 様式） */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>点検・整備記録一覧</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={listFilter} onChange={e => setListFilter(e.target.value)} style={{ fontSize: 12 }}>
              <option value="">全機器</option>
              {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} / {eq.name}</option>)}
            </select>
            <button
              onClick={() => { if (!listFilter) { toast('印刷する機器を選択してください', 'error'); return } setShowPrint(true) }}
              style={{ padding: '5px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}
            >
              帳票印刷
            </button>
          </div>
        </div>
        {records.length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>記録がありません</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['作業年月日', '機器', '区分', '充填量(kg)', '回収戻し(kg)', '回収量(kg)', '点検内容', '点検結果', '漏えい・故障原因', '漏えい・故障箇所', '修理の内容', '業者名', '技術者氏名', ''].map(h => (
                    <th key={h} style={headStyle}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const eq = db.equipment.find(e => e.id === r.eqId)
                    return (
                      <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                        <td style={cellStyle}>{r.date}</td>
                        <td style={cellStyle}>{eq ? `${eq.id} / ${eq.name}` : r.eqId}</td>
                        <td style={cellStyle}>{r.category}</td>
                        <td style={cellStyle}>{r.fillAmount || '—'}</td>
                        <td style={cellStyle}>{r.refillAmount || '—'}</td>
                        <td style={cellStyle}>{r.recoveryAmount || '—'}</td>
                        <td style={cellStyle}>{r.method}</td>
                        <td style={cellStyle}><Badge variant={r.result === 'あり' ? 'ng' : r.result === '兆候あり' ? 'warn' : 'ok'}>{r.result}</Badge></td>
                        <td style={cellStyle}>{r.cause || '—'}</td>
                        <td style={cellStyle}>{r.location || '—'}</td>
                        <td style={cellStyle}>{r.repair || '—'}</td>
                        <td style={cellStyle}>{r.vendor || '—'}</td>
                        <td style={cellStyle}>{r.technician || '—'}</td>
                        <td style={cellStyle}>
                          <button onClick={() => del(r.id)} style={{ padding: '2px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
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

      {showPrint && (() => {
        const eq = db.equipment.find(e => e.id === listFilter)
        if (!eq) return null
        return (
          <LegalRecordPrint
            eq={eq}
            records={db.legal.filter(r => r.eqId === eq.id)}
            onClose={() => setShowPrint(false)}
          />
        )
      })()}
    </div>
  )
}
