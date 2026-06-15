import { calcLeakSummary, exportCSV } from '../utils'
import { REPORT_THRESHOLD } from '../constants'
import { Badge } from './Badge'

export function Report({ db, toast }) {
  const { fills, recoveries, equipment } = db
  const summary = calcLeakSummary(fills, recoveries, equipment)
  const { totalFill, totalRec, totalLeak, totalCO2, refMap, year } = summary
  const needsReport = totalCO2 >= REPORT_THRESHOLD

  function handleExport() {
    exportCSV(fills, recoveries, equipment)
    toast('CSVをダウンロードしました')
  }

  return (
    <div>
      {/* Alert banner */}
      {totalCO2 > 0 && (
        <div style={{
          background: needsReport ? '#FCEBEB' : '#FAEEDA',
          border: `0.5px solid ${needsReport ? '#F09595' : '#EF9F27'}`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12,
          color: needsReport ? '#A32D2D' : '#854F0B',
        }}>
          {needsReport
            ? `⚠️ 報告義務あり — CO₂換算量が1,000tを超えています。都道府県知事への報告が必要です（提出期限: ${year + 1}年7月31日）`
            : `ℹ️ CO₂換算量: ${Math.round(totalCO2).toLocaleString()} t — 1,000t未満のため今年度の報告義務はありません`
          }
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: `${year}年度 充填量合計`, value: `${totalFill.toFixed(1)} kg` },
          { label: `${year}年度 回収量合計`, value: `${totalRec.toFixed(1)} kg` },
          { label: '算定漏洩量', value: `${totalLeak.toFixed(1)} kg`, danger: true },
          { label: 'CO₂換算量', value: `${Math.round(totalCO2).toLocaleString()} t`, sub: '報告基準: 1,000t以上' },
        ].map(m => (
          <div key={m.label} style={{ background: '#f5f5f0', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: m.danger ? '#A32D2D' : 'inherit' }}>{m.value}</div>
            {m.sub && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Refrigerant breakdown */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>冷媒別 漏洩計算（フロン排出抑制法 第19条）</div>
        {Object.keys(refMap).length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>充填・回収記録を登録すると自動計算されます</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['冷媒種別', 'GWP', '漏洩量 (kg)', 'CO₂換算 (t)', '算定方法'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {Object.entries(refMap).map(([ref, v]) => {
                  const co2 = Math.round(v.leak * v.gwp / 1000)
                  return (
                    <tr key={ref} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)' }}>
                      <td style={{ padding: '7px 8px' }}><span style={{ background: '#f1efe8', color: '#5f5e5a', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{ref}</span></td>
                      <td style={{ padding: '7px 8px' }}>{v.gwp.toLocaleString()}</td>
                      <td style={{ padding: '7px 8px' }}>{v.leak.toFixed(1)}</td>
                      <td style={{ padding: '7px 8px' }}>{co2.toLocaleString()}</td>
                      <td style={{ padding: '7px 8px', color: '#888' }}>充填量按分法</td>
                    </tr>
                  )
                })}
                <tr style={{ fontWeight: 600, background: '#f5f5f0' }}>
                  <td style={{ padding: '7px 8px' }}>合計</td>
                  <td style={{ padding: '7px 8px' }}>—</td>
                  <td style={{ padding: '7px 8px' }}>{totalLeak.toFixed(1)}</td>
                  <td style={{ padding: '7px 8px' }}>{Math.round(totalCO2).toLocaleString()}</td>
                  <td style={{ padding: '7px 8px' }}></td>
                </tr>
              </tbody>
            </table>
          )
        }
      </div>

      {/* Export */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>帳票出力</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { title: '算定漏洩量報告書', desc: '都道府県知事提出用（第19条）', action: handleExport, label: 'CSV出力' },
            { title: '機器整備記録簿', desc: '充填・回収・点検の総合台帳（3年保管義務）', action: handleExport, label: 'CSV出力' },
          ].map(item => (
            <div key={item.title} style={{ padding: 12, border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 8 }}>
              <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>{item.desc}</div>
              <button onClick={item.action} style={{ width: '100%', padding: '7px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                ⬇ {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
