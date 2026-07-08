import { useState } from 'react'
import { Badge } from './Badge'

const emptyVendor = () => ({ name: '', address: '', tel: '', fax: '', registrationNo: '' })
const emptyTech = () => ({ name: '', qualNo: '', vendorId: '' })

const labelStyle = { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }

export function VendorTechnician({ db, addRecord, deleteRecord, toast }) {
  const [vForm, setVForm] = useState(emptyVendor())
  const [tForm, setTForm] = useState(emptyTech())
  const setV = k => e => setVForm(f => ({ ...f, [k]: e.target.value }))
  const setT = k => e => setTForm(f => ({ ...f, [k]: e.target.value }))

  function saveVendor() {
    if (!vForm.name) { toast('業者名を入力してください', 'error'); return }
    addRecord('vendors', { ...vForm })
    toast('業者を登録しました')
    setVForm(emptyVendor())
  }

  function saveTech() {
    if (!tForm.name) { toast('氏名を入力してください', 'error'); return }
    addRecord('technicians', { ...tForm })
    toast('技術者を登録しました')
    setTForm(emptyTech())
  }

  function delVendor(id) {
    if (!confirm('この業者を削除しますか？ 既存の記録の表示には影響しません')) return
    deleteRecord('vendors', id)
    toast('削除しました')
  }

  function delTech(id) {
    if (!confirm('この技術者を削除しますか？ 既存の記録の表示には影響しません')) return
    deleteRecord('technicians', id)
    toast('削除しました')
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* 充填回収業者 */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>充填回収業者マスタ</div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>業者名 *</label>
            <input value={vForm.name} onChange={setV('name')} placeholder="例: シオンテクノス株式会社" style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>住所</label>
            <input value={vForm.address} onChange={setV('address')} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <div><label style={labelStyle}>電話番号</label><input value={vForm.tel} onChange={setV('tel')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>FAX</label><input value={vForm.fax} onChange={setV('fax')} style={{ width: '100%' }} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>フロン類回収業 登録番号</label>
            <input value={vForm.registrationNo} onChange={setV('registrationNo')} style={{ width: '100%' }} />
          </div>
          <button onClick={saveVendor} style={{ width: '100%', padding: '8px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, marginBottom: 14 }}>業者を登録</button>

          {db.vendors.length === 0
            ? <div style={{ color: '#888', fontSize: 12 }}>登録された業者がありません</div>
            : db.vendors.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{[v.address, v.tel].filter(Boolean).join(' / ')}</div>
                </div>
                <button onClick={() => delVendor(v.id)} style={{ padding: '3px 9px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
              </div>
            ))
          }
        </div>

        {/* 技術者 */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>冷媒フロン類取扱技術者マスタ</div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>氏名 *</label>
            <input value={tForm.name} onChange={setT('name')} placeholder="例: 佐藤 太郎" style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>資格者番号（第一種/第二種 講習修了証番号等）</label>
            <input value={tForm.qualNo} onChange={setT('qualNo')} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>所属業者</label>
            <select value={tForm.vendorId} onChange={setT('vendorId')} style={{ width: '100%' }}>
              <option value="">— 未選択 —</option>
              {db.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <button onClick={saveTech} style={{ width: '100%', padding: '8px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, marginBottom: 14 }}>技術者を登録</button>

          {db.technicians.length === 0
            ? <div style={{ color: '#888', fontSize: 12 }}>登録された技術者がいません</div>
            : db.technicians.map(t => {
              const v = db.vendors.find(x => x.id === t.vendorId)
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t.name} {t.qualNo && <Badge variant="gray">{t.qualNo}</Badge>}</div>
                    {v && <div style={{ fontSize: 11, color: '#888' }}>{v.name}</div>}
                  </div>
                  <button onClick={() => delTech(t.id)} style={{ padding: '3px 9px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
