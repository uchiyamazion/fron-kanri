import { useState } from 'react'
import { today, calcCO2 } from '../utils'
import { GWP } from '../constants'
import { Badge } from './Badge'

const emptyFill = () => ({ eqId: '', date: today(), amount: '', vendor: '', reason: '定期補充', note: '' })
const emptyRec  = () => ({ eqId: '', date: today(), amount: '', vendor: '', cert: '', reason: '廃棄時回収' })

const FILL_REASONS = ['定期補充', '漏洩対応', '修理後補充', '新規設置']
const REC_REASONS  = ['廃棄時回収', '修理時回収', '更新工事']

export function FillRecovery({ db, addRecord, deleteRecord, toast }) {
  const [fill, setFill] = useState(emptyFill())
  const [rec, setRec]   = useState(emptyRec())

  const setF = k => e => setFill(f => ({ ...f, [k]: e.target.value }))
  const setR = k => e => setRec(r => ({ ...r, [k]: e.target.value }))

  function saveFill() {
    if (!fill.eqId || !fill.date || !fill.amount) { toast('機器・日付・充填量を入力してください', 'error'); return }
    addRecord('fills', { ...fill, amount: parseFloat(fill.amount) })
    toast('充填記録を保存しました')
    setFill(emptyFill())
  }

  function saveRec() {
    if (!rec.eqId || !rec.date || !rec.amount) { toast('機器・日付・回収量を入力してください', 'error'); return }
    addRecord('recoveries', { ...rec, amount: parseFloat(rec.amount) })
    toast('回収記録を保存しました')
    setRec(emptyRec())
  }

  const all = [
    ...db.fills.map(f => ({ ...f, kind: 'fill' })),
    ...db.recoveries.map(r => ({ ...r, kind: 'recovery' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40)

  function del(id, kind) {
    if (!confirm('削除しますか？')) return
    deleteRecord(kind === 'fill' ? 'fills' : 'recoveries', id)
    toast('削除しました')
  }

  const EqSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={{ width: '100%' }}>
      <option value="">— 機器を選択 —</option>
      {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} / {eq.name}（{eq.location}）</option>)}
    </select>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Fill */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>充填記録</div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器</label><EqSelect value={fill.eqId} onChange={setF('eqId')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填日</label><input type="date" value={fill.date} onChange={setF('date')} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填量 (kg)</label><input type="number" value={fill.amount} onChange={setF('amount')} step="0.1" min="0" style={{ width: '100%' }} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填業者</label><input value={fill.vendor} onChange={setF('vendor')} placeholder="業者名" style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填理由</label>
            <select value={fill.reason} onChange={setF('reason')} style={{ width: '100%' }}>{FILL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>備考</label><textarea value={fill.note} onChange={setF('note')} style={{ width: '100%', minHeight: 50 }} /></div>
          <button onClick={saveFill} style={{ width: '100%', padding: '8px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>充填記録を保存</button>
        </div>

        {/* Recovery */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>回収記録</div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器</label><EqSelect value={rec.eqId} onChange={setR('eqId')} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収日</label><input type="date" value={rec.date} onChange={setR('date')} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収量 (kg)</label><input type="number" value={rec.amount} onChange={setR('amount')} step="0.1" min="0" style={{ width: '100%' }} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収業者（第一種フロン類充塡回収業者）</label><input value={rec.vendor} onChange={setR('vendor')} placeholder="登録業者名" style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収証明書番号</label><input value={rec.cert} onChange={setR('cert')} placeholder="証明書番号" style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収理由</label>
            <select value={rec.reason} onChange={setR('reason')} style={{ width: '100%' }}>{REC_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
          </div>
          <button onClick={saveRec} style={{ width: '100%', padding: '8px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>回収記録を保存</button>
        </div>
      </div>

      {/* History */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>充填・回収 履歴</div>
        {all.length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>記録がありません</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['日付', '機器', '種別', '冷媒', '量(kg)', 'CO₂換算(t)', '業者', '証明書番号', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {all.map(r => {
                    const eq = db.equipment.find(e => e.id === r.eqId)
                    const co2 = eq ? calcCO2(r.amount, eq.ref).toFixed(2) : '—'
                    return (
                      <tr key={r.id + r.kind} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                        <td style={{ padding: '7px 8px', fontSize: 11 }}>{r.date}</td>
                        <td style={{ padding: '7px 8px', fontSize: 11 }}>{r.eqId} {eq?.name}</td>
                        <td style={{ padding: '7px 8px' }}><Badge variant={r.kind === 'fill' ? 'info' : 'ok'}>{r.kind === 'fill' ? '充填' : '回収'}</Badge></td>
                        <td style={{ padding: '7px 8px' }}><span style={{ background: '#f1efe8', color: '#5f5e5a', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{eq?.ref || '—'}</span></td>
                        <td style={{ padding: '7px 8px' }}>{(r.amount || 0).toFixed(1)}</td>
                        <td style={{ padding: '7px 8px' }}>{co2} t</td>
                        <td style={{ padding: '7px 8px', fontSize: 11 }}>{r.vendor || '—'}</td>
                        <td style={{ padding: '7px 8px', fontSize: 11 }}>{r.cert || '—'}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <button onClick={() => del(r.id, r.kind)} style={{ padding: '2px 6px', background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F09595', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>削除</button>
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
    </div>
  )
}
