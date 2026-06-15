import { useState } from 'react'
import { today, daysDiff, nextLegalInspection, legalInspectionType } from '../utils'
import { LEGAL_RESULT_LABELS } from '../constants'
import { Badge, statusVariant, statusLabel } from './Badge'

const emptyForm = () => ({
  eqId: '', date: today(), type: '1year',
  inspector: '', method: '目視確認', result: 'ok', note: '',
})

const DETECTION_METHODS = ['目視確認', '蛍光剤法', '電子式検知器', '超音波検知器', '発泡液']

export function LegalInspection({ db, addRecord, deleteRecord, updateRecord, toast }) {
  const [form, setForm] = useState(emptyForm())
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function save() {
    if (!form.eqId || !form.date) { toast('機器と点検日を選択してください', 'error'); return }
    addRecord('legal', { ...form })
    const eq = db.equipment.find(e => e.id === form.eqId)
    if (eq) updateRecord('equipment', eq.id, { lastLegal: form.date })
    toast('法定点検記録を保存しました')
    setForm(emptyForm())
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Form */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>法定点検 記録入力</span>
          <Badge variant="info">第16条</Badge>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器選択</label>
          <select value={form.eqId} onChange={set('eqId')} style={{ width: '100%' }}>
            <option value="">— 機器を選択 —</option>
            {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} / {eq.name}（{eq.location}）</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>点検実施日</label><input type="date" value={form.date} onChange={set('date')} style={{ width: '100%' }} /></div>
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>点検区分</label>
            <select value={form.type} onChange={set('type')} style={{ width: '100%' }}>
              <option value="1year">1年点検（50kW以上）</option>
              <option value="3year">3年点検（7.5〜50kW未満）</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>点検業者</label><input value={form.inspector} onChange={set('inspector')} placeholder="第一種冷媒フロン類取扱技術者" style={{ width: '100%' }} /></div>
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>漏洩検知方法</label>
            <select value={form.method} onChange={set('method')} style={{ width: '100%' }}>
              {DETECTION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>点検結果</label>
          <div style={{ display: 'flex', gap: 14 }}>
            {Object.entries(LEGAL_RESULT_LABELS).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" name="le-result" value={val} checked={form.result === val} onChange={set('result')} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>所見・措置内容</label>
          <textarea value={form.note} onChange={set('note')} placeholder="点検結果の詳細・措置内容..." style={{ width: '100%', minHeight: 60 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setForm(emptyForm())} style={{ padding: '6px 12px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>クリア</button>
          <button onClick={save} style={{ padding: '6px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>記録を保存</button>
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>法定点検 管理一覧</div>
        {db.equipment.length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>機器を登録すると表示されます</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['機器ID', '機器名', '区分', '前回点検', '次回期限', '状態'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 6px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {db.equipment.map(eq => {
                    const nd = nextLegalInspection(eq)
                    const d = nd ? daysDiff(nd) : null
                    const records = db.legal.filter(l => l.eqId === eq.id).sort((a, b) => b.date.localeCompare(a.date))
                    const last = records[0]
                    const type = legalInspectionType(eq.kw)
                    return (
                      <tr key={eq.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                        <td style={{ padding: '7px 6px', fontFamily: 'monospace', fontSize: 11 }}>{eq.id}</td>
                        <td style={{ padding: '7px 6px', fontSize: 11 }}>{eq.name}</td>
                        <td style={{ padding: '7px 6px' }}><Badge variant={type === '1年点検' ? 'info' : type === '3年点検' ? 'teal' : 'gray'}>{type}</Badge></td>
                        <td style={{ padding: '7px 6px', fontSize: 11 }}>{last ? last.date : <span style={{ color: '#aaa' }}>未実施</span>}</td>
                        <td style={{ padding: '7px 6px', fontSize: 11, color: d !== null && d < 0 ? '#A32D2D' : 'inherit' }}>{nd || '—'}</td>
                        <td style={{ padding: '7px 6px' }}><Badge variant={statusVariant(d)}>{statusLabel(d)}</Badge></td>
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
