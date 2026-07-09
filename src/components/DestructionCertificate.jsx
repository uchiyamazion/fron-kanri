import { useState } from 'react'
import { today } from '../utils'
import { Badge } from './Badge'
import { DestructionCertificatePrint, certificateViewUrl } from './DestructionCertificatePrint'

const headStyle = { textAlign: 'left', padding: '5px 5px', borderBottom: '1px solid rgba(0,0,0,.15)', fontSize: 10.5, color: '#666', fontWeight: 600, whiteSpace: 'nowrap', background: '#f5f3ee' }
const tdStyle = { padding: '2px 3px', borderBottom: '0.5px solid rgba(0,0,0,.08)', verticalAlign: 'middle' }
const inputFocusable = { width: '100%', fontSize: 11.5, border: '1px solid transparent', padding: '4px 4px', borderRadius: 4, background: 'transparent' }

const newCert = eq => ({
  eqId: eq.id,
  issueDate: today(),
  orderAddress: eq.location || '',
  orderCustomerName: eq.customerName || '',
  adminAddress: eq.location || '',
  adminName: eq.operManager || '',
  adminTel: '',
  facilityAddress: eq.facilityAddress || eq.location || '',
  facilityName: eq.facilityName || eq.name || '',
  equipmentType: (eq.model || '').includes('冷蔵') || (eq.model || '').includes('冷凍') ? 'fridge' : 'aircon',
  rec1Date: '', rec1Amount: '', rec2Date: '', rec2Amount: '',
  fill1Date: '', fill1Amount: '', fill2Date: '', fill2Amount: '',
  vendorId: '', technicianId: '',
  note: '',
})

export function DestructionCertificate({ db, addRecord, updateRecord, deleteRecord, toast }) {
  const [eqId, setEqId] = useState('')
  const [printId, setPrintId] = useState(null)

  const eq = db.equipment.find(e => e.id === eqId)
  const rows = (db.certificates || []).filter(r => r.eqId === eqId).slice().sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))

  function field(row, key) {
    return {
      value: row[key] || '',
      onChange: e => updateRecord('certificates', row.id, { [key]: e.target.value }),
    }
  }

  function addRow() {
    if (!eq) { toast('先に機器を選択してください', 'error'); return }
    addRecord('certificates', newCert(eq))
  }

  function delRow(id) {
    if (!confirm('この証明書を削除しますか？')) return
    deleteRecord('certificates', id)
  }

  function copyLink(id) {
    const url = certificateViewUrl(id)
    navigator.clipboard?.writeText(url).then(
      () => toast('共有リンクをコピーしました', 'success'),
      () => toast(url, 'info')
    )
  }

  const VendorSelect = ({ row }) => (
    <select {...field(row, 'vendorId')} style={inputFocusable}>
      <option value="">— 業者 —</option>
      {db.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
    </select>
  )
  const TechSelect = ({ row }) => (
    <select {...field(row, 'technicianId')} style={inputFocusable}>
      <option value="">— 技術者 —</option>
      {db.technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  )

  const printCert = rows.find(r => r.id === printId)

  return (
    <div>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant="info">充填・回収破壊証明書</Badge>
            <span style={{ fontWeight: 500, fontSize: 13 }}>フロン類充填・回収破壊証明書</span>
            <span style={{ fontSize: 11, color: '#999' }}>（機器ごとに発行履歴を管理）</span>
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
            <span style={{ color: '#aaa' }}>機器情報・施設情報は「機器台帳」で編集できます（新規行を追加した時点の値が初期値として入ります）</span>
          </div>
        )}
      </div>

      {!eq ? (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>
          機器を選択すると、その機器の証明書発行履歴をここに直接入力できます
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>発行履歴（表に直接入力・保存すると再印刷/QR共有できます）</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1900 }}>
              <thead>
                <tr>
                  {['交付年月日', '発注管理者住所', '発注管理者氏名', '管理担当者住所', '管理担当者氏名', '管理担当者電話', '施設住所', '施設名称', '機器種類',
                    '回収①日付', '回収①kg', '回収②日付', '回収②kg', '充填①日付', '充填①kg', '充填②日付', '充填②kg',
                    '充填回収業者', '技術者', '備考', ''].map(h => (
                    <th key={h} style={headStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td style={{ ...tdStyle, padding: 14, color: '#999', fontSize: 12 }} colSpan={21}>まだ証明書がありません。「+ 証明書を追加」から入力してください</td></tr>
                )}
                {rows.map(row => (
                  <tr key={row.id}>
                    <td style={{ ...tdStyle, width: 120 }}><input type="date" {...field(row, 'issueDate')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'orderAddress')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'orderCustomerName')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'adminAddress')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'adminName')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'adminTel')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'facilityAddress')} style={inputFocusable} /></td>
                    <td style={tdStyle}><input {...field(row, 'facilityName')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 110 }}>
                      <select {...field(row, 'equipmentType')} style={inputFocusable}>
                        <option value="aircon">エアコン</option>
                        <option value="fridge">冷蔵・冷凍</option>
                      </select>
                    </td>
                    <td style={{ ...tdStyle, width: 120 }}><input type="date" {...field(row, 'rec1Date')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 60 }}><input type="number" step="0.1" min="0" {...field(row, 'rec1Amount')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 120 }}><input type="date" {...field(row, 'rec2Date')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 60 }}><input type="number" step="0.1" min="0" {...field(row, 'rec2Amount')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 120 }}><input type="date" {...field(row, 'fill1Date')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 60 }}><input type="number" step="0.1" min="0" {...field(row, 'fill1Amount')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 120 }}><input type="date" {...field(row, 'fill2Date')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, width: 60 }}><input type="number" step="0.1" min="0" {...field(row, 'fill2Amount')} style={inputFocusable} /></td>
                    <td style={tdStyle}><VendorSelect row={row} /></td>
                    <td style={tdStyle}><TechSelect row={row} /></td>
                    <td style={tdStyle}><input {...field(row, 'note')} style={inputFocusable} /></td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button onClick={() => setPrintId(row.id)} style={{ padding: '2px 7px', border: '0.5px solid rgba(24,95,165,.4)', borderRadius: 6, background: '#EAF2FB', color: '#185FA5', cursor: 'pointer', fontSize: 11, marginRight: 4 }}>印刷/QR</button>
                      <button onClick={() => copyLink(row.id)} style={{ padding: '2px 7px', border: '0.5px solid rgba(0,0,0,.15)', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, marginRight: 4 }}>リンク</button>
                      <button onClick={() => delRow(row.id)} style={{ padding: '2px 7px', border: '0.5px solid #F09595', borderRadius: 6, background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer', fontSize: 11 }}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} style={{ marginTop: 10, padding: '7px 14px', border: '1px dashed #185FA5', borderRadius: 8, background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12 }}>+ 証明書を追加</button>
        </div>
      )}

      {printCert && (
        <DestructionCertificatePrint
          cert={printCert}
          eq={eq}
          vendor={db.vendors.find(v => v.id === printCert.vendorId)}
          technician={db.technicians.find(t => t.id === printCert.technicianId)}
          onClose={() => setPrintId(null)}
        />
      )}
    </div>
  )
}
