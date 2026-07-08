const cell = { border: '1px solid #4FB3C4', padding: '5px 8px', fontSize: 10.5, verticalAlign: 'middle', color: '#000' }
const labelCell = { ...cell, color: '#2E9CB0', fontWeight: 500, whiteSpace: 'nowrap', width: 110 }
const subLabelCell = { ...cell, color: '#2E9CB0', width: 70, whiteSpace: 'nowrap' }

function fmtDate(d) {
  if (!d) return { y: '', m: '', d: '' }
  const dt = new Date(d)
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() }
}

export function DestructionCertificatePrint({ eq, vendor, technician, recoveries = [], fills = [], opts = {}, onClose }) {
  const issue = fmtDate(opts.issueDate || new Date())
  const rec = recoveries.slice(0, 2)
  const fil = fills.slice(0, 2)
  const isFridge = (eq.model || '').includes('冷蔵') || (eq.model || '').includes('冷凍')
  const v = vendor || {}

  const Box = ({ checked }) => (
    <span style={{ display: 'inline-block', width: 12, height: 12, border: '1.3px solid #2E9CB0', textAlign: 'center', lineHeight: '11px', fontSize: 10, fontWeight: 700, marginRight: 6 }}>
      {checked ? 'V' : ''}
    </span>
  )

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
              <td style={{ border: '1.5px solid #4FB3C4', borderRadius: 4, padding: '10px 20px', fontSize: 19, fontWeight: 700, color: '#2E9CB0', textAlign: 'center', width: '60%' }}>
                フロン類充填・回収破壊証明書
              </td>
              <td style={{ border: 'none', width: '4%' }}></td>
              <td style={{ border: '1.3px solid #4FB3C4', padding: '8px 12px', fontSize: 10, color: '#2E9CB0', verticalAlign: 'top' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{v.name || ''}</div>
                <div>{v.address || ''}</div>
                <div>電話 {v.tel || ''}{v.fax ? `　FAX ${v.fax}` : ''}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 14, borderBottom: '1px solid #000', paddingBottom: 4, width: '55%' }}>
          <span style={{ fontSize: 13 }}>{eq.customerName || ''}</span>
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
              <td style={cell} colSpan={4}>{eq.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>氏名・名称</td>
              <td style={cell} colSpan={4}>{eq.customerName || ''}</td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={3}>管理担当者</td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={4}>{eq.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>氏名・名称</td>
              <td style={cell} colSpan={4}>{eq.operManager || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>電話番号</td>
              <td style={cell} colSpan={4}></td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={2}>充填・回収する機器がある施設(建物)名</td>
              <td style={subLabelCell}>住所</td>
              <td style={cell} colSpan={4}>{eq.facilityAddress || eq.location || ''}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>施設の名称<br />(建物名)</td>
              <td style={cell} colSpan={4}>{eq.facilityName || eq.name || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>機器の種類<br /><span style={{ fontSize: 9, fontWeight: 400 }}>※□にチェック</span></td>
              <td style={cell} colSpan={2}><Box checked={!isFridge} />エアコンディショナー</td>
              <td style={cell} colSpan={3}><Box checked={isFridge} />冷蔵機器及び冷凍機器</td>
            </tr>
            <tr>
              <td style={labelCell} rowSpan={2}>機器の特定情報</td>
              <td style={subLabelCell}>管理番号</td>
              <td style={cell} colSpan={4}>{eq.id}</td>
            </tr>
            <tr>
              <td style={subLabelCell}>型式</td>
              <td style={cell}>{eq.model || ''}</td>
              <td style={subLabelCell}>製造番号</td>
              <td style={cell} colSpan={2}>{eq.serial || ''}</td>
            </tr>
            <tr>
              <td style={labelCell}>備　考</td>
              <td style={cell} colSpan={5}>{opts.note || ''}</td>
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
              <td style={cell}>{rec[0]?.date || ''}</td>
              <td style={cell}>{rec[0] ? eq.ref : ''}</td>
              <td style={cell}>{rec[0]?.amount || ''} {rec[0] ? 'kg' : ''}</td>
              <td style={cell}>修繕・廃棄</td>
              <td style={cell}>{rec[0] ? '－' : ''}</td>
            </tr>
            <tr>
              <td style={cell}>{rec[1]?.date || ''}</td>
              <td style={cell}>{rec[1] ? eq.ref : ''}</td>
              <td style={cell}>{rec[1]?.amount || ''} {rec[1] ? 'kg' : ''}</td>
              <td style={cell}>修繕・廃棄</td>
              <td style={cell}>{rec[1] ? '－' : ''}</td>
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'center', color: '#2E9CB0' }} rowSpan={2}>充填</td>
              <td style={cell}>{fil[0]?.date || ''}</td>
              <td style={cell}>{fil[0] ? eq.ref : ''}</td>
              <td style={cell}>{fil[0]?.amount || ''} {fil[0] ? 'kg' : ''}</td>
              <td style={cell}>設置時・整備時</td>
              <td style={cell}>{fil[0] ? (opts.gwp || '') : ''}</td>
            </tr>
            <tr>
              <td style={cell}>{fil[1]?.date || ''}</td>
              <td style={cell}>{fil[1] ? eq.ref : ''}</td>
              <td style={cell}>{fil[1]?.amount || ''} {fil[1] ? 'kg' : ''}</td>
              <td style={cell}>設置時・整備時</td>
              <td style={cell}>{fil[1] ? (opts.gwp || '') : ''}</td>
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

        <div style={{ fontSize: 10 }}>
          <div>機器の管理者の皆様へ</div>
          <div>※この「充填・回収証明書」は、算定漏えい量の計算に必要な書類となりますので、保存しておいてください。</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 15, fontWeight: 700, color: '#2E9CB0' }}>
          {v.name || ''}
        </div>
      </div>
    </div>
  )
}
