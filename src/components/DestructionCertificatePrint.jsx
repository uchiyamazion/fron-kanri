import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { COMPANY_OFFICES, GWP } from '../constants'

const cell = { border: '1px solid #4FB3C4', padding: '5px 8px', fontSize: 10.5, verticalAlign: 'middle', color: '#000' }
const labelCell = { ...cell, color: '#2E9CB0', fontWeight: 500, whiteSpace: 'nowrap', width: 110 }
const subLabelCell = { ...cell, color: '#2E9CB0', width: 70, whiteSpace: 'nowrap' }

function fmtDate(d) {
  if (!d) return { y: '', m: '', d: '' }
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return { y: '', m: '', d: '' }
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() }
}

// 証明書のシェアURL（QRコードの読み取り先）を組み立てる
export function certificateViewUrl(id) {
  const base = location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/[^/]*$/, '/')
  return `${base}view-certificate.html?id=${id}`
}

export function DestructionCertificatePrint({ cert, eq, vendor, technician, onClose }) {
  const issue = fmtDate(cert.issueDate)
  const isFridge = cert.equipmentType === 'fridge'
  const v = vendor || {}
  const gwp = eq?.ref ? (GWP[eq.ref] || '') : ''
  const qrRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!cert.id) return
    const url = certificateViewUrl(cert.id)
    QRCode.toDataURL(url, { width: 132, margin: 0, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [cert.id])

  const Box = ({ checked }) => (
    <span style={{ display: 'inline-block', width: 12, height: 12, border: '1.3px solid #2E9CB0', textAlign: 'center', lineHeight: '11px', fontSize: 10, fontWeight: 700, marginRight: 6 }}>
      {checked ? '✓' : ''}
    </span>
  )

  const recRows = [
    { date: cert.rec1Date, amount: cert.rec1Amount },
    { date: cert.rec2Date, amount: cert.rec2Amount },
  ]
  const fillRows = [
    { date: cert.fill1Date, amount: cert.fill1Amount },
    { date: cert.fill2Date, amount: cert.fill2Amount },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '24px 0' }}>
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>印刷 / PDF保存</button>
        <button onClick={onClose} style={{ padding: '8px 18px', background: '#fff', border: '0.5px solid rgba(255,255,255,.6)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>閉じる</button>
      </div>

      <div className="print-area" style={{ background: '#fff', width: 760, padding: 28, fontFamily: '"MS PGothic","Hiragino Kaku Gothic ProN",sans-serif', color: '#000' }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            <tr>
              <td style={{ border: '1.5px solid #4FB3C4', borderRadius: 4, padding: '10px 20px', fontSize: 19, fontWeight: 700, color: '#2E9CB0', textAlign: 'center', width: '58%' }}>
                フロン類充填・回収破壊証明書
              </td>
              <td style={{ border: 'none', width: '3%' }}></td>
              <td style={{ border: '1.3px solid #4FB3C4', padding: '7px 10px', fontSize: 9, color: '#2E9CB0', verticalAlign: 'top', lineHeight: 1.5 }}>
                {COMPANY_OFFICES.map((o, i) => (
                  <div key={o.label} style={{ marginBottom: i < COMPANY_OFFICES.length - 1 ? 3 : 0, display: 'flex', gap: 4 }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: i === 0 ? 700 : 500, fontSize: i === 0 ? 11 : 9 }}>{o.label}</span>
                    <span>
                      {i === 0 && <span style={{ fontWeight: 700 }}>シオンテクノス株式会社　</span>}
                      {o.address}<br />
                      電話{o.tel}　FAX{o.fax}
                    </span>
                  </div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 14, borderBottom: '1px solid #000', paddingBottom: 4, width: '55%' }}>
          <span style={{ fontSize: 13 }}>{cert.orderCustomerName || eq?.customerName || ''}</span>
          <span style={{ marginLeft: 'auto', fontSize: 13 }}>御中</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={labelCell}>交付年月日</td>
              <td style={cell} colSpan={5}>
                {issue.y}　年　　{issue.m}　月　　{issue.d}　日
              </td>
            </tr>
            <tr>
              <td style={{ ...labelCell }} rowSpan={2}>整備を発注した管理者<br /><span style={{ fontSize: 9, fontWeight: 400 }}>（機器の所有者等）</span></td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={4}>{cert.orderAddress || eq?.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>氏名・名称</td>
              <td style={cell} colSpan={4}>{cert.orderCustomerName || eq?.customerName || ''}</td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={3}>管理担当者</td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={4}>{cert.adminAddress || eq?.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>氏名・名称</td>
              <td style={cell} colSpan={4}>{cert.adminName || eq?.operManager || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>電話番号</td>
              <td style={cell} colSpan={4}>{cert.adminTel || ''}</td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={2}>充填・回収する機器がある施設(建物)名</td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={4}>{cert.facilityAddress || eq?.facilityAddress || eq?.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>施設の名称<br />(建物名)</td>
              <td style={cell} colSpan={4}>{cert.facilityName || eq?.facilityName || eq?.name || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>機器の種類<br /><span style={{ fontSize: 9, fontWeight: 400 }}>※□にチェック</span></td>
              <td style={cell} colSpan={2}><Box checked={!isFridge} />エアコンディショナー</td>
              <td style={cell} colSpan={3}><Box checked={isFridge} />冷蔵機器及び冷凍機器</td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={2}>機器の特定情報</td>
              <td style={subLabelCell}>管理番号</td>
              <td style={cell} colSpan={4}>{eq?.id || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>型式</td>
              <td style={cell}>{eq?.model || ''}</td>
              <td style={subLabelCell}>製造番号</td>
              <td style={cell} colSpan={2}>{eq?.serial || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>備　考</td>
              <td style={cell} colSpan={5}>{cert.note || ''}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 10.5, margin: '8px 0 2px' }}>【下記の通りフロン類を充填・回収いたしました】</div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <thead>
            <tr>
              <td style={{ ...cell, width: 60 }}></td>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }}>作業年月日</td>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }}>フロンの種類</td>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }}>フロンの量</td>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }}>事由</td>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }}>GWP値</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }} rowSpan={2}>回収<br /><span style={{ fontSize: 8 }}>（無し充填量は含まず）</span></td>
              <td style={cell}>{recRows[0].date || ''}</td>
              <td style={cell}>{recRows[0].amount ? eq?.ref : ''}</td>
              <td style={cell}>{recRows[0].amount || ''} {recRows[0].amount ? 'kg' : ''}</td>
              <td style={cell}>修繕・廃棄</td>
              <td style={cell}>{recRows[0].amount ? '－' : ''}</td>
            </tr>
            <tr>
              <td style={cell}>{recRows[1].date || ''}</td>
              <td style={cell}>{recRows[1].amount ? eq?.ref : ''}</td>
              <td style={cell}>{recRows[1].amount || ''} {recRows[1].amount ? 'kg' : ''}</td>
              <td style={cell}>修繕・廃棄</td>
              <td style={cell}>{recRows[1].amount ? '－' : ''}</td>
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }} rowSpan={2}>充填</td>
              <td style={cell}>{fillRows[0].date || ''}</td>
              <td style={cell}>{fillRows[0].amount ? eq?.ref : ''}</td>
              <td style={cell}>{fillRows[0].amount || ''} {fillRows[0].amount ? 'kg' : ''}</td>
              <td style={cell}>設置時・整備時</td>
              <td style={cell}>{fillRows[0].amount ? gwp : ''}</td>
            </tr>
            <tr>
              <td style={cell}>{fillRows[1].date || ''}</td>
              <td style={cell}>{fillRows[1].amount ? eq?.ref : ''}</td>
              <td style={cell}>{fillRows[1].amount || ''} {fillRows[1].amount ? 'kg' : ''}</td>
              <td style={cell}>設置時・整備時</td>
              <td style={cell}>{fillRows[1].amount ? gwp : ''}</td>
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }} rowSpan={3}>充填回収業者</td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={2}>{v.address || ''}</td>
              <td style={subLabelCell}>電話番号</td>
              <td style={cell}>{v.tel || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>氏名・名称</td>
              <td style={cell} colSpan={2}>{v.name || ''}</td>
              <td style={subLabelCell}>登録番号</td>
              <td style={cell}>{v.registrationNo || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>充填作業者又は<br />立会者（冷媒フロン類取扱技術者）</td>
              <td style={cell} colSpan={2}>{technician?.name || ''}</td>
              <td style={subLabelCell}>資格者番号</td>
              <td style={cell}>{technician?.qualNo || ''}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10 }}>
            <div>機器の管理者の皆様へ</div>
            <div>※この「充填・回収証明書」は、算定漏えい量の計算に必要な書類となりますので、保存しておいてください。</div>
          </div>
          {qrDataUrl && (
            <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 12 }}>
              <img ref={qrRef} src={qrDataUrl} alt="QR" style={{ width: 66, height: 66, display: 'block' }} />
              <div style={{ fontSize: 7, color: '#888', marginTop: 2 }}>スマホで読取・保存</div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 15, fontWeight: 700, color: '#2E9CB0' }}>
          シオンテクノス株式会社
        </div>
      </div>
    </div>
  )
}
