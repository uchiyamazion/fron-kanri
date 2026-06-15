import { useState } from 'react'
import { Badge, statusVariant, statusLabel } from './Badge'
import { REFRIGERANT_OPTIONS, EQUIPMENT_STATUS } from '../constants'
import { today, daysDiff, nextLegalInspection, legalInspectionType } from '../utils'

const empty = () => ({
  id: '', name: '', model: '', location: '',
  ref: 'R-410A', charge: '', kw: '',
  installed: today(), status: 'active', note: '',
})

export function Equipment({ db, upsertEquipment, deleteRecord, toast }) {
  const [search, setSearch] = useState('')
  const [filterRef, setFilterRef] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty())
  const [editId, setEditId] = useState(null)

  const refs = [...new Set(db.equipment.map(e => e.ref))]

  const filtered = db.equipment.filter(eq => {
    const q = search.toLowerCase()
    const match = !q || [eq.id, eq.name, eq.location, eq.ref].some(v => v?.toLowerCase().includes(q))
    return match && (!filterRef || eq.ref === filterRef)
  })

  function openNew() { setForm(empty()); setEditId(null); setModal(true) }
  function openEdit(eq) { setForm({ ...eq }); setEditId(eq.id); setModal(true) }
  function closeModal() { setModal(false) }

  function save() {
    if (!form.id || !form.name || !form.location) { toast('必須項目を入力してください', 'error'); return }
    if (!editId && db.equipment.find(e => e.id === form.id)) { toast('その機器IDは既に存在します', 'error'); return }
    upsertEquipment(form)
    closeModal()
    toast(editId ? '機器情報を更新しました' : '機器を登録しました')
  }

  function del(id) {
    if (!confirm(`機器 ${id} を削除しますか？`)) return
    deleteRecord('equipment', id)
    toast('機器を削除しました')
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="機器名・設置場所・冷媒で検索..." style={{ flex: 1 }} />
        <select value={filterRef} onChange={e => setFilterRef(e.target.value)} style={{ width: 120 }}>
          <option value="">全冷媒</option>
          {refs.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={openNew} style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          + 機器追加
        </button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', minWidth: 640 }}>
            <colgroup>
              <col style={{ width: 90 }} /><col style={{ width: 150 }} /><col style={{ width: 110 }} />
              <col style={{ width: 80 }} /><col style={{ width: 70 }} /><col style={{ width: 110 }} />
              <col style={{ width: 80 }} /><col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>{['機器ID','機器名','設置場所','冷媒','充填量','次回点検','状態','操作'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 20 }}>機器が登録されていません</td></tr>
                : filtered.map(eq => {
                  const nd = nextLegalInspection(eq)
                  const d = nd ? daysDiff(nd) : null
                  const statColor = eq.status === 'active' ? 'ok' : eq.status === 'stop' ? 'warn' : 'gray'
                  return (
                    <tr key={eq.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>
                      <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 11 }}>{eq.id}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <div style={{ fontWeight: 500 }}>{eq.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{eq.model}</div>
                      </td>
                      <td style={{ padding: '8px 8px', fontSize: 11 }}>{eq.location}</td>
                      <td style={{ padding: '8px 8px' }}><span style={{ background: '#f1efe8', color: '#5f5e5a', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{eq.ref}</span></td>
                      <td style={{ padding: '8px 8px' }}>{eq.charge ? `${eq.charge} kg` : '—'}</td>
                      <td style={{ padding: '8px 8px', fontSize: 11 }}>
                        {nd
                          ? <span style={{ color: d !== null && d < 0 ? '#A32D2D' : d !== null && d <= 7 ? '#854F0B' : 'inherit' }}>{nd}</span>
                          : <span style={{ color: '#aaa' }}>未点検</span>
                        }
                      </td>
                      <td style={{ padding: '8px 8px' }}><Badge variant={statColor}>{EQUIPMENT_STATUS[eq.status]}</Badge></td>
                      <td style={{ padding: '8px 8px' }}>
                        <button onClick={() => openEdit(eq)} style={{ padding: '3px 7px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, marginRight: 4 }}>編集</button>
                        <button onClick={() => del(eq.id)} style={{ padding: '3px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontWeight: 500, fontSize: 14 }}>
              <span>{editId ? '機器編集' : '機器登録'}</span>
              <button onClick={closeModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器ID *</label><input value={form.id} onChange={set('id')} placeholder="例: AC-001" disabled={!!editId} /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器名 *</label><input value={form.name} onChange={set('name')} placeholder="例: 業務用エアコン" /></div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>型番・メーカー</label><input value={form.model} onChange={set('model')} placeholder="例: 三菱 PEA-P224" /></div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>設置場所 *</label><input value={form.location} onChange={set('location')} placeholder="例: A棟1F 会議室" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>冷媒種別 *</label>
                <select value={form.ref} onChange={set('ref')}>
                  {REFRIGERANT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填量 (kg)</label><input type="number" value={form.charge} onChange={set('charge')} step="0.1" min="0" /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>定格能力 (kW)</label><input type="number" value={form.kw} onChange={set('kw')} step="0.1" min="0" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>設置日</label><input type="date" value={form.installed} onChange={set('installed')} /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>ステータス</label>
                <select value={form.status} onChange={set('status')}>
                  {Object.entries(EQUIPMENT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>備考</label><textarea value={form.note} onChange={set('note')} style={{ width: '100%', minHeight: 60 }} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeModal} style={{ padding: '7px 14px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
              <button onClick={save} style={{ padding: '7px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
