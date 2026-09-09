import { useState } from 'react'
import { Badge, statusVariant } from './Badge'
import { REFRIGERANT_OPTIONS, EQUIPMENT_STATUS, EQUIPMENT_CATEGORY_OPTIONS, EQUIPMENT_USAGE_OPTIONS } from '../constants'
import { today, daysDiff, nextLegalInspection } from '../utils'

const emptyProperty = () => ({
  name: '', address: '', customerName: '', operManager: '',
})

const emptyEquipment = (propertyId, property) => ({
  id: '', name: '', maker: '', model: '', serial: '', category: '', usage: '',
  location: property?.address || '',
  customerName: property?.customerName || '',
  ref: 'R-410A', charge: '', kw: '',
  installed: today(), status: 'active', note: '',
  facilityName: property?.name || '', facilityAddress: property?.address || '',
  operManager: property?.operManager || '',
  propertyId: propertyId || '',
})

export function Property({ db, addRecord, updateRecord, deleteRecord, upsertEquipment, toast }) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyProperty())
  const [editId, setEditId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [eqModal, setEqModal] = useState(false)
  const [eqForm, setEqForm] = useState(emptyEquipment())
  const [eqEditId, setEqEditId] = useState(null)

  const properties = db.properties || []

  const equipmentCountOf = (propId) => db.equipment.filter(e => e.propertyId === propId).length

  const filtered = properties.filter(p => {
    const q = search.toLowerCase()
    return !q || [p.name, p.address, p.customerName, p.operManager].some(v => v?.toLowerCase().includes(q))
  })

  const selectedProperty = properties.find(p => p.id === selectedId) || null
  const selectedEquipment = selectedId ? db.equipment.filter(e => e.propertyId === selectedId) : []

  // ── 物件モーダル ──
  function openNewProperty() { setForm(emptyProperty()); setEditId(null); setModal(true) }
  function openEditProperty(p) { setForm({ ...p }); setEditId(p.id); setModal(true) }
  function closePropertyModal() { setModal(false) }

  function saveProperty() {
    if (!form.name) { toast('物件名を入力してください', 'error'); return }
    if (editId) {
      updateRecord('properties', editId, form)
      toast('物件情報を更新しました')
    } else {
      addRecord('properties', form)
      toast('物件を登録しました')
    }
    closePropertyModal()
  }

  function delProperty(p) {
    const count = equipmentCountOf(p.id)
    if (count > 0) {
      if (!confirm(`「${p.name}」には${count}件の機器が紐づいています。物件を削除しても機器データは残ります（紐付けだけ外れます）。削除しますか？`)) return
    } else {
      if (!confirm(`物件「${p.name}」を削除しますか？`)) return
    }
    deleteRecord('properties', p.id)
    if (selectedId === p.id) setSelectedId(null)
    toast('物件を削除しました')
  }

  const setP = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── 機器モーダル（選択中の物件に紐づけて追加/編集） ──
  function openNewEquipment() {
    setEqForm(emptyEquipment(selectedId, selectedProperty))
    setEqEditId(null)
    setEqModal(true)
  }
  function openEditEquipment(eq) { setEqForm({ ...eq }); setEqEditId(eq.id); setEqModal(true) }
  function closeEquipmentModal() { setEqModal(false) }

  function saveEquipment() {
    if (!eqForm.id || !eqForm.name || !eqForm.location) { toast('必須項目を入力してください', 'error'); return }
    if (!eqEditId && db.equipment.find(e => e.id === eqForm.id)) { toast('その機器IDは既に存在します', 'error'); return }
    upsertEquipment(eqForm)
    closeEquipmentModal()
    toast(eqEditId ? '機器情報を更新しました' : '機器を登録しました')
  }

  function delEquipment(eq) {
    if (!confirm(`機器 ${eq.id} を削除しますか？`)) return
    deleteRecord('equipment', eq.id)
    toast('機器を削除しました')
  }

  const setE = k => e => setEqForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      {/* ── 物件一覧 ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="物件名・住所・顧客名で検索..." style={{ flex: 1 }} />
        <button onClick={openNewProperty} style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          + 物件追加
        </button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', minWidth: 640 }}>
            <colgroup>
              <col style={{ width: 160 }} /><col style={{ width: 200 }} /><col style={{ width: 140 }} />
              <col style={{ width: 120 }} /><col style={{ width: 70 }} /><col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>{['物件名', '住所', '顧客名', '運転管理責任者', '機器数', '操作'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 20 }}>物件が登録されていません</td></tr>
                : filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                    style={{
                      borderBottom: '0.5px solid rgba(0,0,0,.06)',
                      cursor: 'pointer',
                      background: selectedId === p.id ? '#EDF3FA' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px 8px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '8px 8px', fontSize: 11 }}>{p.address || '—'}</td>
                    <td style={{ padding: '8px 8px', fontSize: 11 }}>{p.customerName || '—'}</td>
                    <td style={{ padding: '8px 8px', fontSize: 11 }}>{p.operManager || '—'}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ background: '#f1efe8', color: '#5f5e5a', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                        {equipmentCountOf(p.id)}台
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditProperty(p)} style={{ padding: '3px 7px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, marginRight: 4 }}>編集</button>
                      <button onClick={() => delProperty(p)} style={{ padding: '3px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ドリルダウン: 選択した物件の機器一覧 ── */}
      {selectedProperty && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>「{selectedProperty.name}」の機器一覧</div>
            <button onClick={openNewEquipment} style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              + この物件に機器を追加
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
                  <tr>{['機器ID', '機器名', '設置場所', '冷媒', '充填量', '次回点検', '状態', '操作'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {selectedEquipment.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 20 }}>この物件に紐づく機器がありません</td></tr>
                    : selectedEquipment.map(eq => {
                      const nd = nextLegalInspection(eq)
                      const d = nd ? daysDiff(nd) : null
                      const statColor = eq.status === 'active' ? 'ok' : eq.status === 'stop' ? 'warn' : 'gray'
                      return (
                        <tr key={eq.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>
                          <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 11 }}>{eq.id}</td>
                          <td style={{ padding: '8px 8px' }}>
                            <div style={{ fontWeight: 500 }}>{eq.name}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{[eq.maker, eq.model].filter(Boolean).join(' ')}{eq.serial ? `（製番: ${eq.serial}）` : ''}</div>
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
                            <button onClick={() => openEditEquipment(eq)} style={{ padding: '3px 7px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, marginRight: 4 }}>編集</button>
                            <button onClick={() => delEquipment(eq)} style={{ padding: '3px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 物件登録/編集モーダル ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontWeight: 500, fontSize: 14 }}>
              <span>{editId ? '物件編集' : '物件登録'}</span>
              <button onClick={closePropertyModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>物件名 *</label><input value={form.name} onChange={setP('name')} placeholder="例: ○○ビル" /></div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>住所</label><input value={form.address} onChange={setP('address')} placeholder="例: 札幌市中央区北1条西1丁目" /></div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>顧客名（法人名）</label><input value={form.customerName} onChange={setP('customerName')} placeholder="例: 株式会社○○" /></div>
            <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>運転管理責任者</label><input value={form.operManager} onChange={setP('operManager')} placeholder="例: 山田 太郎" /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closePropertyModal} style={{ padding: '7px 14px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
              <button onClick={saveProperty} style={{ padding: '7px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 機器登録/編集モーダル（この物件に紐づく） ── */}
      {eqModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontWeight: 500, fontSize: 14 }}>
              <span>{eqEditId ? '機器編集' : `機器登録（${selectedProperty?.name}）`}</span>
              <button onClick={closeEquipmentModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器ID *</label><input value={eqForm.id} onChange={setE('id')} placeholder="例: AC-001" disabled={!!eqEditId} /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>機器名 *</label><input value={eqForm.name} onChange={setE('name')} placeholder="例: 業務用エアコン" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>設備製造者（メーカー）</label><input value={eqForm.maker} onChange={setE('maker')} placeholder="例: 三菱電機株式会社" /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>型式</label><input value={eqForm.model} onChange={setE('model')} placeholder="例: ECOV-EN110C1" /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>製番</label><input value={eqForm.serial} onChange={setE('serial')} placeholder="例: 86W00470" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>分類</label>
                <input value={eqForm.category} onChange={setE('category')} placeholder="例: 冷凍冷蔵ユニット" list="p-category-options" />
                <datalist id="p-category-options">{EQUIPMENT_CATEGORY_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
              </div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>用途</label>
                <input value={eqForm.usage} onChange={setE('usage')} placeholder="例: 冷凍用・プロセス冷却用" list="p-usage-options" />
                <datalist id="p-usage-options">{EQUIPMENT_USAGE_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>設置場所 *</label><input value={eqForm.location} onChange={setE('location')} placeholder="例: A棟1F 会議室" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>冷媒種別 *</label>
                <select value={eqForm.ref} onChange={setE('ref')}>
                  {REFRIGERANT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>充填量 (kg)</label><input type="number" value={eqForm.charge} onChange={setE('charge')} step="0.1" min="0" /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>定格能力 (kW)</label><input type="number" value={eqForm.kw} onChange={setE('kw')} step="0.1" min="0" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>設置日</label><input type="date" value={eqForm.installed} onChange={setE('installed')} /></div>
              <div><label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>ステータス</label>
                <select value={eqForm.status} onChange={setE('status')}>
                  {Object.entries(EQUIPMENT_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeEquipmentModal} style={{ padding: '7px 14px', border: '0.5px solid rgba(0,0,0,.2)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
              <button onClick={saveEquipment} style={{ padding: '7px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
