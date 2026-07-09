import { useState } from 'react'
import { today, addMonths } from '../utils'
import { LEAK_LABELS } from '../constants'
import { Badge } from './Badge'

const CHECK_ITEMS = [
  '外観に損傷・腐食なし',
  '冷媒配管に油汚れなし',
  '霜付き・着氷なし',
  '異音・異臭なし',
  '接続部に腐食なし',
  '機器全体の外観確認',
]

const emptyForm = () => ({
  eqId: '', date: today(), inspector: '',
  checks: Array(6).fill(false), leak: 'none', note: '',
})

export function SimpleInspection({ db, addRecord, deleteRecord, updateRecord, toast }) {
  const [form, setForm] = useState(emptyForm())

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleCheck(i) {
    setForm(f => {
      const checks = [...f.checks]
      checks[i] = !checks[i]
      return { ...f, checks }
    })
  }

  function save() {
    if (!form.eqId || !form.date) { toast('機器と点検日を選択してください', 'error'); return }
    const record = addRecord('simple', { ...form })
    // Update equipment lastSimple
    const eq = db.equipment.find(e => e.id === form.eqId)
    if (eq) updateRecord('equipment', eq.id, { lastSimple: form.date })
    toast('簡易点検記録を保存しました')
    setForm(emptyForm())
  }

  const sorted = [...db.simple].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Form */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>新規 簡易点検 記録</span>
          <Badge variant="info">3ヶ月ごと義務</Badge>
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
          <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>点検者</label><input value={form.inspector} onChange={set('inspector')} placeholder="氏名" style={{ width: '100%' }} /></div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>チェック項目</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CHECK_ITEMS.map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.checks[i]} onChange={() => toggleCheck(i)} />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>漏洩の有無</label>
          <div style={{ display: 'flex', gap: 14 }}>
            {Object.entries(LEAK_LABELS).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" name="si-leak" value={val} checked={form.leak === val} onChange={set('leak')} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>特記事項</label>
          <textarea value={form.note} onChange={set('note')} placeholder="点検結果の詳細..." style={{ width: '100%', minHeight: 60 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setForm(emptyForm())} style={{ padding: '6px 12px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12 }}>クリア</button>
          <button onClick={save} style={{ padding: '6px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>記録を保存</button>
        </div>
      </div>

      {/* History */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>簡易点検 履歴</div>
        {sorted.length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>記録がありません</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['点検日', '機器', '点検者', '漏洩', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 6px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sorted.map(s => {
                    const eq = db.equipment.find(e => e.id === s.eqId)
                    const leakVariant = s.leak === 'none' ? 'ok' : s.leak === 'suspect' ? 'warn' : 'ng'
                    return (
                      <tr key={s.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                        <td style={{ padding: '7px 6px', fontSize: 11 }}>{s.date}</td>
                        <td style={{ padding: '7px 6px', fontSize: 11 }}>{s.eqId} {eq?.name}</td>
                        <td style={{ padding: '7px 6px', fontSize: 11 }}>{s.inspector || '—'}</td>
                        <td style={{ padding: '7px 6px' }}><Badge variant={leakVariant}>{LEAK_LABELS[s.leak]}</Badge></td>
                        <td style={{ padding: '7px 6px' }}>
                          <button onClick={() => { if (confirm('削除しますか？')) { deleteRecord('simple', s.id); toast('削除しました') } }} style={{ padding: '2px 6px', background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F09595', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>削除</button>
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
