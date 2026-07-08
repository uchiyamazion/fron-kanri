import { GWP_REFERENCE_ROW } from '../constants'

const box = { border: '1px solid #000' }
const cell = { border: '1px solid #000', padding: '3px 6px', fontSize: 10.5, verticalAlign: 'middle' }
const labelCell = { ...cell, background: '#f0f0f0', fontWeight: 500, whiteSpace: 'nowrap' }

function sum(records, key) {
  return records.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0)
}

export function LegalRecordPrint({ eq, records, db, onClose }) {
  const sorted = records.slice().sort((a, b) => a.date.localeCompare(b.date))
  const firstDate = sorted[0]?.date || ''
  const lastDate = sorted[sorted.length - 1]?.date || ''

  const totalFill = sum(sorted, 'fillAmount')
  const totalRefill = sum(sorted, 'refillAmount')
  const totalRecovery = sum(sorted, 'recoveryAmount')
  const totalDischarge = Math.max(totalFill - totalRecovery, 0)

  const facilityName = eq.facilityName || eq.name
  const facilityAddress = eq.facilityAddress || eq.location

  // 直近の記録に記載された業者名から、業者マスタの住所・電話番号を解決（無ければ名前のみ表示）
  const latestVendorName = sorted[sorted.length - 1]?.vendor || ''
  const vendor = db?.vendors?.find(v => v.name === latestVendorName)
  const vendorLine = vendor
    ? `${vendor.name}　${vendor.address || ''}${vendor.tel ? `　TEL ${vendor.tel}` : ''}`
    : latestVendorName

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '24px 0' }}>
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>印刷 / PDF保存</button>
        <button onClick={onClose} style={{ padding: '8px 18px', background: '#fff', border: '0.5px solid rgba(255,255,255,.6)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>閉じる</button>
      </div>

      <div className="print-area" style={{ background: '#fff', width: 1050, padding: 24, fontFamily: '"MS PGothic","Hiragino Kaku Gothic ProN",sans-serif', color: '#000' }}>
        <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>冷媒漏えい点検・整備記録簿</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
          <span>期間：{firstDate || '—'} 〜 {lastDate || '—'}</span>
          <span>管理番号：{eq.id}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ ...labelCell, width: 90 }}>機器の管理者</td>
              <td style={{ ...cell, width: 60 }}>氏名・名称</td>
              <td style={{ ...cell, width: 220 }}>{eq.customerName || eq.name}</td>
              <td style={{ ...labelCell, width: 90 }}>設備製造者</td>
              <td style={cell} colSpan={3}>{eq.model || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>機器の所在</td>
              <td style={cell}>施設名称</td>
              <td style={cell}>{facilityName}</td>
              <td style={labelCell}>系統名</td>
              <td style={cell} colSpan={3}>{eq.name}</td>
            </tr>
            <tr>
              <td style={labelCell}></td>
              <td style={cell}>住所</td>
              <td style={cell}>{facilityAddress}</td>
              <td style={labelCell}>設置年月日</td>
              <td style={cell} colSpan={3}>{eq.installed || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>運転管理責任者</td>
              <td style={cell} colSpan={2}>{eq.operManager || ''}</td>
              <td style={labelCell}>使用機器 分類</td>
              <td style={cell} colSpan={3}>{eq.model || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>点検等業者名住所</td>
              <td style={cell} colSpan={2}>{vendorLine}</td>
              <td style={labelCell}>製番</td>
              <td style={cell} colSpan={3}>{eq.id}</td>
            </tr>
            <tr>
              <td style={labelCell}>使用冷媒</td>
              <td style={cell} colSpan={2}>{eq.ref}</td>
              <td style={labelCell}>初期総充塡量(kg)</td>
              <td style={cell} colSpan={3}>{eq.charge || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>冷媒量(kg)</td>
              <td style={cell}>合計充てん量</td>
              <td style={cell}>{totalFill.toFixed(1)}</td>
              <td style={cell}>合計回収量</td>
              <td style={cell}>{totalRecovery.toFixed(1)}</td>
              <td style={cell}>合計排出量</td>
              <td style={cell}>{totalDischarge.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ ...labelCell, width: 110 }}>主要冷媒の GWP値</td>
              {GWP_REFERENCE_ROW.map(g => (
                <td key={g.label} style={{ ...cell, textAlign: 'center' }}>{g.label}</td>
              ))}
            </tr>
            <tr>
              <td style={labelCell}></td>
              {GWP_REFERENCE_ROW.map(g => (
                <td key={g.label} style={{ ...cell, textAlign: 'center' }}>{g.gwp.toLocaleString()}</td>
              ))}
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['作業年月日', '点検・整備区分', '充填量(kg)', '回収戻し充填量(kg)', '回収量(kg)', '点検内容', '点検結果', '漏えい・故障の原因', '漏えい・故障箇所', '修理の内容', '点検・修理・回収・充塡業者名', '技術者氏名', '技術者No.', '修理困難理由', '修理予定日'].map(h => (
                <th key={h} style={{ ...cell, background: '#e5e5e5', fontWeight: 700, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td style={cell} colSpan={15}>記録がありません</td></tr>
            )}
            {sorted.map(r => (
              <tr key={r.id} style={{ breakInside: 'avoid' }}>
                <td style={cell}>{r.date}</td>
                <td style={cell}>{r.category}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{r.fillAmount || ''}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{r.refillAmount || ''}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{r.recoveryAmount || ''}</td>
                <td style={cell}>{r.method}</td>
                <td style={cell}>{r.result}</td>
                <td style={cell}>{r.cause}</td>
                <td style={cell}>{r.location}</td>
                <td style={cell}>{r.repair}</td>
                <td style={cell}>{r.vendor}</td>
                <td style={cell}>{r.technician}</td>
                <td style={cell}>{db?.technicians?.find(t => t.name === r.technician)?.qualNo || ''}</td>
                <td style={cell}>{r.repairReason || ''}</td>
                <td style={cell}>{r.repairDueDate || ''}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...labelCell, textAlign: 'center' }} colSpan={2}>計</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{totalFill.toFixed(1)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{totalRefill.toFixed(1)}</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{totalRecovery.toFixed(1)}</td>
              <td style={cell} colSpan={10}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
