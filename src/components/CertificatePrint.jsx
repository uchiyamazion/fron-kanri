import { useState } from 'react'
import { GWP } from '../constants'
import { today } from '../utils'
import { DestructionCertificatePrint } from './DestructionCertificatePrint'

const labelStyle = { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }

function findEquipmentForInspection(insp, equipment) {
  return equipment.find(eq =>
    eq.customerName && eq.customerName === insp.customerName &&
    eq.name === insp.systemName &&
    (!insp.serial || eq.serial === insp.serial)
  )
}

export function CertificatePrint({ db, onClose, toast }) {
  const [mode, setMode] = useState(db.inspections.length > 0 ? 'auto' : 'manual')
  const [inspectionId, setInspectionId] = useState('')
  const [eqId, setEqId] = useState('')
  const [issueDate, setIssueDate] = useState(today())
  const [selRec, setSelRec] = useState([])
  const [selFill, setSelFill] = useState([])
  const [vendorId, setVendorId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [note, setNote] = useState('')
  const [showPrint, setShowPrint] = useState(false)

  const insp = db.inspections.find(i => i.id === inspectionId)
  const eq = mode === 'auto'
    ? (insp ? findEquipmentForInspection(insp, db.equipment) : null)
    : db.equipment.find(e => e.id === eqId)

  const recOptions = eq ? db.recoveries.filter(r => r.eqId === eq.id).sort((a, b) => b.date.localeCompare(a.date)) : []
  const fillOptions = eq ? db.fills.filter(f => f.eqId === eq.id).sort((a, b) => b.date.localeCompare(a.date)) : []

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter(x => x !== id) : list.length >= 2 ? [list[1], id] : [...list, id])
  }

  function openPrint() {
    if (mode === 'auto') {
      if (!insp) { toast('点検報告を選択してください', 'error'); return }
      if (!eq) { toast('この点検報告に対応する機器が機器台帳に見つかりません。先に機器台帳で登録してください', 'error'); return }
    } else if (!eq) {
      toast('機器を選択してください', 'error'); return
    }
    setShowPrint(true)
  }

  if (showPrint && eq) {
    const vendor = db.vendors.find(v => v.id === vendorId)
    const technician = db.technicians.find(t => t.id === technicianId)
    const gwp = GWP?.[eq.ref] || ''

    let recs, fils, effectiveDate = issueDate
    if (mode === 'auto' && insp) {
      recs = (parseFloat(insp.refRecover) || 0) > 0 ? [{ date: insp.workDate, amount: insp.refRecover }] : []
      fils = (parseFloat(insp.refAdd) || 0) > 0 ? [{ date: insp.workDate, amount: insp.refAdd }] : []
      effectiveDate = insp.workDate || issueDate
    } else {
      recs = recOptions.filter(r => selRec.includes(r.id))
      fils = fillOptions.filter(f => selFill.includes(f.id))
    }

    return (
      <DestructionCertificatePrint
        eq={eq}
        vendor={vendor}
        technician={technician}
        recoveries={recs}
        fills={fils}
        opts={{ issueDate: effectiveDate, note, gwp }}
        onClose={onClose}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>充填・回収破壊証明書 発行</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#f1efe8', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setMode('auto')}
            style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: mode === 'auto' ? '#fff' : 'transparent', fontWeight: mode === 'auto' ? 600 : 400 }}
          >
            自社点検報告から自動作成
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: mode === 'manual' ? '#fff' : 'transparent', fontWeight: mode === 'manual' ? 600 : 400 }}
          >
            手動で記録を選ぶ
          </button>
        </div>

        {mode === 'auto' ? (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>フロン充填/回収がある点検報告</label>
            {db.inspections.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>対象の点検報告がありません（空調点検・作業報告アプリで充填/回収量を記入した報告のみ表示されます）</div>
              : (
                <select value={inspectionId} onChange={e => setInspectionId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">— 点検報告を選択 —</option>
                  {db.inspections.slice().sort((a, b) => (b.workDate || '').localeCompare(a.workDate || '')).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.workDate} / {i.customerName} {i.systemName}
                      {(parseFloat(i.refAdd) || 0) > 0 ? ` 充填${i.refAdd}kg` : ''}
                      {(parseFloat(i.refRecover) || 0) > 0 ? ` 回収${i.refRecover}kg` : ''}
                    </option>
                  ))}
                </select>
              )
            }
            {insp && !eq && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#A32D2D' }}>
                対応する機器が機器台帳に見つかりません（{insp.customerName} / {insp.systemName}）。機器台帳で登録すると選べるようになります。
              </div>
            )}
            {insp && eq && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#3B6D11' }}>
                機器を自動検出しました：{eq.id} / {eq.name}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>機器</label>
            <select value={eqId} onChange={e => { setEqId(e.target.value); setSelRec([]); setSelFill([]) }} style={{ width: '100%' }}>
              <option value="">— 機器を選択 —</option>
              {db.equipment.map(o => <option key={o.id} value={o.id}>{o.id} / {o.name}（{o.location}）</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>充填回収業者</label>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)} style={{ width: '100%' }}>
              <option value="">— 業者を選択 —</option>
              {db.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>冷媒フロン類取扱技術者</label>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} style={{ width: '100%' }}>
              <option value="">— 技術者を選択 —</option>
              {db.technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        {(db.vendors.length === 0 || db.technicians.length === 0) && (
          <div style={{ fontSize: 11, color: '#8a6d1a', marginBottom: 10 }}>「業者・技術者」ページで先に登録してください</div>
        )}

        {mode === 'manual' && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>交付年月日</label>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ width: '100%' }} />
          </div>
        )}

        {mode === 'manual' && eq && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>回収記録（最大2件）</label>
              {recOptions.length === 0
                ? <div style={{ fontSize: 12, color: '#aaa' }}>回収記録がありません</div>
                : recOptions.map(r => (
                  <label key={r.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selRec.includes(r.id)} onChange={() => toggle(selRec, setSelRec, r.id)} />
                    {r.date} / {r.amount}kg
                  </label>
                ))
              }
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>充填記録（最大2件）</label>
              {fillOptions.length === 0
                ? <div style={{ fontSize: 12, color: '#aaa' }}>充填記録がありません</div>
                : fillOptions.map(f => (
                  <label key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 3, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selFill.includes(f.id)} onChange={() => toggle(selFill, setSelFill, f.id)} />
                    {f.date} / {f.amount}kg
                  </label>
                ))
              }
            </div>
          </>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>備考</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', minHeight: 44 }} />
        </div>

        <button onClick={openPrint} style={{ width: '100%', padding: '9px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          プレビュー / 印刷
        </button>
      </div>
    </div>
  )
}
