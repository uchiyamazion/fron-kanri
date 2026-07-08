import { useState } from 'react'
import { today } from '../utils'
import { COMPANY_INFO } from '../constants'
import { downloadProcessControlSheet } from '../utils/processControlSheet'

const labelStyle = { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }
const sectionStyle = { background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14, marginBottom: 12 }
const gridCellInput = { width: 64, fontSize: 11, padding: '4px 3px', textAlign: 'right' }

const GRID_ROWS = [
  { key: '16', label: 'エアコンディショナー' },
  { key: '17', label: '冷蔵機器及び冷凍機器' },
  { key: '18', label: '計' },
  { key: '19', label: '銘板記載充塡量' },
]
const GRID_GROUPS = [
  { label: 'CFC (R11・12・502)', cols: ['E', 'F'] },
  { label: 'HCFC (R22・123)', cols: ['G', 'H'] },
  { label: 'HFC (R407C・410A・32・134a)', cols: ['I', 'J'] },
  { label: '計', cols: ['K', 'L'] },
]

const emptyForm = () => ({
  eqId: '',
  deliveryDate: today(), approvalDate: '',
  ownerName: '', ownerAddress: '', buildingName: '', buildingAddress: '',
  abbr: '', contactName: '', deptName: '', tel: '', fax: '',
  airconCount: 1, fridgeCount: 0,
  useAgent1: false,
  agent1Date: '', agent1Name: '', agent1Address: '', agent1Contact: '', agent1Dept: '', agent1Tel: '', agent1Fax: '',
  useAgent2: false,
  agent2Date: '', agent2Name: '', agent2Address: '', agent2Contact: '', agent2Dept: '', agent2Tel: '', agent2Fax: '',
  uncollectedCount: 0,
  vendorId: '', pickupDate: '', certIssueDate: '',
})

export function ProcessControlSheet({ db, toast }) {
  const defaultVendor = db.vendors.find(v => v.name === COMPANY_INFO.name)
  const [form, setForm] = useState({ ...emptyForm(), vendorId: defaultVendor?.id || '' })
  const [grid, setGrid] = useState({})
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setChk = k => e => setForm(f => ({ ...f, [k]: e.target.checked }))
  const setGridCell = (col, row) => e => setGrid(g => ({ ...g, [`grid_${col}${row}`]: e.target.value }))

  function pickEquipment(eqId) {
    const eq = db.equipment.find(e => e.id === eqId)
    setForm(f => ({
      ...f,
      eqId,
      ownerName: eq?.customerName || f.ownerName,
      ownerAddress: eq?.location || f.ownerAddress,
      buildingName: eq?.facilityName || eq?.name || f.buildingName,
      buildingAddress: eq?.facilityAddress || eq?.location || f.buildingAddress,
      contactName: eq?.operManager || f.contactName,
    }))
  }

  function pickVendor(vendorId) {
    const v = db.vendors.find(x => x.id === vendorId)
    setForm(f => ({
      ...f,
      vendorId,
      vendorRegNoOverride: v?.registrationNo,
      vendorNameOverride: v?.name,
      vendorAddressOverride: v?.address,
      vendorTelOverride: v?.tel,
      vendorFaxOverride: v?.fax,
    }))
  }

  async function download() {
    if (!form.ownerName) { toast('機器所有者等の名称を入力してください（機器を選ぶと自動入力されます）', 'error'); return }
    try {
      const vendor = db.vendors.find(v => v.id === form.vendorId) || COMPANY_INFO
      const payload = {
        ...form,
        ...grid,
        agent1Date: form.useAgent1 ? form.agent1Date : '',
        agent1Name: form.useAgent1 ? form.agent1Name : '',
        agent1Address: form.useAgent1 ? form.agent1Address : '',
        agent1Contact: form.useAgent1 ? form.agent1Contact : '',
        agent1Dept: form.useAgent1 ? form.agent1Dept : '',
        agent1Tel: form.useAgent1 ? form.agent1Tel : '',
        agent1Fax: form.useAgent1 ? form.agent1Fax : '',
        agent2Date: form.useAgent2 ? form.agent2Date : '',
        agent2Name: form.useAgent2 ? form.agent2Name : '',
        agent2Address: form.useAgent2 ? form.agent2Address : '',
        agent2Contact: form.useAgent2 ? form.agent2Contact : '',
        agent2Dept: form.useAgent2 ? form.agent2Dept : '',
        agent2Tel: form.useAgent2 ? form.agent2Tel : '',
        agent2Fax: form.useAgent2 ? form.agent2Fax : '',
        vendorRegNo: vendor?.registrationNo,
        vendorName: vendor?.name,
        vendorAddress: vendor?.address,
        vendorTel: vendor?.tel,
        vendorFax: vendor?.fax,
      }
      const eq = db.equipment.find(e => e.id === form.eqId)
      await downloadProcessControlSheet(payload, `フロンガス行程管理票_${eq ? eq.id : today()}.xlsx`)
      toast('Excelファイルをダウンロードしました')
    } catch (e) {
      console.error(e)
      toast('ダウンロードに失敗しました: ' + e.message, 'error')
    }
  }

  return (
    <div>
      <div style={sectionStyle}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>フロンガス行程管理票（廃棄時）</div>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>
          入力内容は元のExcelテンプレートの「初期入力」シートへ書き込まれ、A〜F票は元ファイルの数式でそのまま自動反映されます。ダウンロードしたファイルをそのまま提出できます。
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>機器（選ぶと所有者・施設情報を自動入力）</label>
          <select value={form.eqId} onChange={e => pickEquipment(e.target.value)} style={{ width: '100%' }}>
            <option value="">— 機器を選択（任意） —</option>
            {db.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} / {eq.name}（{eq.location}）</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={labelStyle}>回付年月日</label><input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>承諾年月日</label><input type="date" value={form.approvalDate} onChange={set('approvalDate')} style={{ width: '100%' }} /></div>
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#555', margin: '10px 0 6px' }}>機器の所有者等</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={labelStyle}>所有者の名称</label><input value={form.ownerName} onChange={set('ownerName')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>所有者の住所</label><input value={form.ownerAddress} onChange={set('ownerAddress')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>建物の名称</label><input value={form.buildingName} onChange={set('buildingName')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>建物の住所</label><input value={form.buildingAddress} onChange={set('buildingAddress')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>略称</label><input value={form.abbr} onChange={set('abbr')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>担当者</label><input value={form.contactName} onChange={set('contactName')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>部署名</label><input value={form.deptName} onChange={set('deptName')} style={{ width: '100%' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>電話</label><input value={form.tel} onChange={set('tel')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>FAX</label><input value={form.fax} onChange={set('fax')} style={{ width: '100%' }} /></div>
          </div>
        </div>

        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#555', margin: '10px 0 6px' }}>廃棄する機器の種類及び台数</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>エアコンディショナー（台）</label><input type="number" min="0" value={form.airconCount} onChange={set('airconCount')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>冷蔵・冷凍機器（台）</label><input type="number" min="0" value={form.fridgeCount} onChange={set('fridgeCount')} style={{ width: '100%' }} /></div>
        </div>
      </div>

      {/* 取次者(1) */}
      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', marginBottom: form.useAgent1 ? 12 : 0 }}>
          <input type="checkbox" checked={form.useAgent1} onChange={setChk('useAgent1')} />
          取次者(1)を経由する
        </label>
        {form.useAgent1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>回付年月日</label><input type="date" value={form.agent1Date} onChange={set('agent1Date')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>名称</label><input value={form.agent1Name} onChange={set('agent1Name')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>住所</label><input value={form.agent1Address} onChange={set('agent1Address')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>担当者</label><input value={form.agent1Contact} onChange={set('agent1Contact')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>部署名</label><input value={form.agent1Dept} onChange={set('agent1Dept')} style={{ width: '100%' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>電話</label><input value={form.agent1Tel} onChange={set('agent1Tel')} style={{ width: '100%' }} /></div>
              <div><label style={labelStyle}>FAX</label><input value={form.agent1Fax} onChange={set('agent1Fax')} style={{ width: '100%' }} /></div>
            </div>
          </div>
        )}
      </div>

      {/* 回収内容 */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>回収内容</div>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>Excel原本と同じマス目です。各セルに数量(kg)を入力してください</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px' }}></th>
                {GRID_GROUPS.map(g => (
                  <th key={g.label} colSpan={2} style={{ padding: '4px 8px', borderBottom: '1px solid #ccc', color: '#666', fontWeight: 600 }}>{g.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRID_ROWS.map(row => (
                <tr key={row.key}>
                  <td style={{ padding: '4px 8px', color: '#666', whiteSpace: 'nowrap' }}>{row.label}</td>
                  {GRID_GROUPS.flatMap(g => g.cols).map(col => (
                    <td key={col} style={{ padding: '2px' }}>
                      <input type="number" step="0.1" style={gridCellInput} value={grid[`grid_${col}${row.key}`] || ''} onChange={setGridCell(col, row.key)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, width: 220 }}>
          <label style={labelStyle}>回収不能台数</label>
          <input type="number" min="0" value={form.uncollectedCount} onChange={set('uncollectedCount')} style={{ width: '100%' }} />
        </div>
      </div>

      {/* 取次者(2) */}
      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', marginBottom: form.useAgent2 ? 12 : 0 }}>
          <input type="checkbox" checked={form.useAgent2} onChange={setChk('useAgent2')} />
          取次者(2)を経由する
        </label>
        {form.useAgent2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>回付年月日</label><input type="date" value={form.agent2Date} onChange={set('agent2Date')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>名称</label><input value={form.agent2Name} onChange={set('agent2Name')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>住所</label><input value={form.agent2Address} onChange={set('agent2Address')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>担当者</label><input value={form.agent2Contact} onChange={set('agent2Contact')} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>部署名</label><input value={form.agent2Dept} onChange={set('agent2Dept')} style={{ width: '100%' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>電話</label><input value={form.agent2Tel} onChange={set('agent2Tel')} style={{ width: '100%' }} /></div>
              <div><label style={labelStyle}>FAX</label><input value={form.agent2Fax} onChange={set('agent2Fax')} style={{ width: '100%' }} /></div>
            </div>
          </div>
        )}
      </div>

      {/* 充填回収業者 */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>充填回収業者</div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>業者を選択（未選択の場合、テンプレート原本の初期値のまま出力されます）</label>
          <select value={form.vendorId} onChange={e => pickVendor(e.target.value)} style={{ width: '100%' }}>
            <option value="">— テンプレートの初期値を使う —</option>
            {db.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>引取り年月日</label><input type="date" value={form.pickupDate} onChange={set('pickupDate')} style={{ width: '100%' }} /></div>
          <div><label style={labelStyle}>証明書発行日</label><input type="date" value={form.certIssueDate} onChange={set('certIssueDate')} style={{ width: '100%' }} /></div>
        </div>
      </div>

      <button onClick={download} style={{ width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
        Excelファイルをダウンロード（A〜F票 自動反映）
      </button>
    </div>
  )
}
