import { useState } from 'react'
import { GWP } from '../constants'
import { today } from '../utils'
import { DestructionCertificatePrint } from './DestructionCertificatePrint'

export function CertificatePrint({ db, onClose, toast }) {
  const [eqId, setEqId] = useState('')
  const [issueDate, setIssueDate] = useState(today())
  const [selRec, setSelRec] = useState([])
  const [selFill, setSelFill] = useState([])
  const [note, setNote] = useState('')
  const [qualNo, setQualNo] = useState('')
  const [technician, setTechnician] = useState('')
  const [showPrint, setShowPrint] = useState(false)

  const eq = db.equipment.find(e => e.id === eqId)
  const recOptions = db.recoveries.filter(r => r.eqId === eqId).sort((a, b) => b.date.localeCompare(a.date))
  const fillOptions = db.fills.filter(f => f.eqId === eqId).sort((a, b) => b.date.localeCompare(a.date))

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter(x => x !== id) : list.length >= 2 ? [list[1], id] : [...list, id])
  }

  function openPrint() {
    if (!eq) { toast('機器を選択してください', 'error'); return }
    setShowPrint(true)
  }

  if (showPrint && eq) {
    const recs = recOptions.filter(r => selRec.includes(r.id))
    const fils = fillOptions.filter(f => selFill.includes(f.id))
    const gwp = GWP?.[eq.ref] || ''
    return (
      <DestructionCertificatePrint
        eq={eq}
        recoveries={recs}
        fills={fils}
        opts={{ issueDate, note, qualNo, technician, gwp }}
        onClose={onClose}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>充填・回収破壊証明書 発行</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器</label>
          <select value={eqId} onChange={e => { setEqId(e.target.value); setSelRec([]); setSelFill([]) }} style={{ width: '100%' }}>
            <option value="">— 機器を選択 —</option>
            {db.equipment.map(o => <option key={o.id} value={o.id}>{o.id} / {o.name}（{o.location}）</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>交付年月日</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ width: '100%' }} /></div>
          <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>資格者番号</label><input value={qualNo} onChange={e => setQualNo(e.target.value)} style={{ width: '100%' }} /></div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填作業者又は立会者（冷媒フロン類取扱技術者）</label>
          <input value={technician} onChange={e => setTechnician(e.target.value)} style={{ width: '100%' }} />
        </div>

        {eq && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>回収記録（最大2件）</label>
              {recOptions.length === 0
                ? <div style={{ fontSize: 12, color: '#aaa' }}>回収記録がありません</div>
                : recOptions.map(r => (
                  <label key={r.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selRec.includes(r.id)} onChange={() => toggle(selRec, setSelRec, r.id)} />
                    {r.date} / {r.amount}kg {r.vendor ? `/ ${r.vendor}` : ''}
                  </label>
                ))
              }
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填記録（最大2件）</label>
              {fillOptions.length === 0
                ? <div style={{ fontSize: 12, color: '#aaa' }}>充填記録がありません</div>
                : fillOptions.map(f => (
                  <label key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selFill.includes(f.id)} onChange={() => toggle(selFill, setSelFill, f.id)} />
                    {f.date} / {f.amount}kg {f.vendor ? `/ ${f.vendor}` : ''}
                  </label>
                ))
              }
            </div>
          </>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>備考</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', minHeight: 44 }} />
        </div>

        <button onClick={openPrint} disabled={!eq} style={{ width: '100%', padding: '9px', background: eq ? '#185FA5' : '#9db6d3', color: '#fff', border: 'none', borderRadius: 8, cursor: eq ? 'pointer' : 'default', fontSize: 13 }}>
          プレビュー / 印刷
        </button>
      </div>
    </div>
  )
}
