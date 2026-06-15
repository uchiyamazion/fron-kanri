import { Badge, statusVariant, statusLabel } from './Badge'
import { daysDiff, nextLegalInspection, nextSimpleInspection, calcLeakSummary, addMonths } from '../utils'

function MetricCard({ label, value, sub, danger }) {
  return (
    <div style={{ background: 'var(--color-background-secondary,#f5f5f0)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: danger ? '#A32D2D' : 'inherit' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export function Dashboard({ db }) {
  const { equipment, simple, legal, fills, recoveries } = db
  const summary = calcLeakSummary(fills, recoveries, equipment)

  const alerts = []
  const upcoming = []

  equipment.forEach(eq => {
    // Legal inspection alerts
    const nd = nextLegalInspection(eq)
    if (nd) {
      const d = daysDiff(nd)
      if (d < 0) alerts.push({ type: 'ng', title: `法定点検 超過`, desc: `${eq.id} ${eq.name}`, date: `期限: ${nd}（${Math.abs(d)}日超過）` })
      else if (d <= 7) alerts.push({ type: 'warn', title: `法定点検 ${d}日以内`, desc: `${eq.id} ${eq.name}`, date: `期限: ${nd}` })
      upcoming.push({ date: nd, name: `${eq.id} ${eq.name}`, type: '法定', diff: d })
    }
    // Simple inspection
    const lastSi = simple.filter(s => s.eqId === eq.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    const nextSi = lastSi ? addMonths(lastSi.date, 3) : null
    if (nextSi) {
      const ds = daysDiff(nextSi)
      if (ds < 0) alerts.push({ type: 'ng', title: `簡易点検 超過`, desc: `${eq.id} ${eq.name}`, date: `期限: ${nextSi}` })
      else if (ds <= 7) alerts.push({ type: 'warn', title: `簡易点検 ${ds}日以内`, desc: `${eq.id} ${eq.name}`, date: `期限: ${nextSi}` })
      upcoming.push({ date: nextSi, name: `${eq.id} ${eq.name}`, type: '簡易', diff: ds })
    }
  })

  upcoming.sort((a, b) => a.date.localeCompare(b.date))
  const upcomingTop5 = upcoming.slice(0, 5)

  const active = equipment.filter(e => e.status === 'active').length
  const withSi = equipment.filter(eq => simple.some(s => s.eqId === eq.id)).length
  const rate = equipment.length ? Math.round(withSi / equipment.length * 100) : null

  // Refrigerant summary
  const refMap = {}
  equipment.forEach(eq => {
    if (!refMap[eq.ref]) refMap[eq.ref] = { count: 0, charge: 0, leak: 0 }
    refMap[eq.ref].count++
    refMap[eq.ref].charge += parseFloat(eq.charge) || 0
  })
  fills.forEach(f => {
    const eq = equipment.find(e => e.id === f.eqId)
    if (eq && refMap[eq.ref]) refMap[eq.ref].leak += parseFloat(f.amount) || 0
  })

  return (
    <div>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <MetricCard label="管理機器数" value={equipment.length} sub={`稼働中 ${active} / 停止等 ${equipment.length - active}`} />
        <MetricCard label="点検要対応" value={alerts.length} danger={alerts.length > 0} sub="台（期限超過・7日以内）" />
        <MetricCard label="今年度漏洩量" value={`${summary.totalLeak.toFixed(1)} kg`} sub={`CO₂換算 ${Math.round(summary.totalCO2).toLocaleString()} t`} />
        <MetricCard label="点検完了率" value={rate !== null ? `${rate}%` : '—'} sub="全機器 簡易点検実施率" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Alerts */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>アラート</div>
          {alerts.length === 0
            ? <div style={{ color: '#888', fontSize: 12 }}>アラートはありません</div>
            : alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 9, borderBottom: i < alerts.length - 1 ? '0.5px solid rgba(0,0,0,.07)' : 'none', marginBottom: i < alerts.length - 1 ? 9 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.type === 'ng' ? '#FCEBEB' : '#FAEEDA', color: a.type === 'ng' ? '#A32D2D' : '#854F0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>!</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{a.desc}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{a.date}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Schedule */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>点検予定（直近5件）</div>
          {upcomingTop5.length === 0
            ? <div style={{ color: '#888', fontSize: 12 }}>点検予定がありません</div>
            : upcomingTop5.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < upcomingTop5.length - 1 ? '0.5px solid rgba(0,0,0,.07)' : 'none', fontSize: 12 }}>
                <div><span style={{ color: '#888' }}>{u.date}</span> {u.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge variant="gray">{u.type}</Badge>
                  <Badge variant={statusVariant(u.diff)}>{statusLabel(u.diff)}</Badge>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Refrigerant table */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 12 }}>冷媒別 管理状況</div>
        {Object.keys(refMap).length === 0
          ? <div style={{ color: '#888', fontSize: 12 }}>機器・充填記録を登録すると集計されます</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['冷媒種別', '台数', '充填量計', '漏洩量', 'CO₂換算(t)'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '0.5px solid rgba(0,0,0,.1)', fontSize: 11, color: '#888', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {Object.entries(refMap).map(([ref, v]) => {
                  const { GWP } = require('../constants')
                  const gwp = GWP[ref] || 100
                  const co2 = Math.round(v.leak * gwp / 1000)
                  return (
                    <tr key={ref}>
                      <td style={{ padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}><span style={{ background: '#f1efe8', color: '#5f5e5a', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{ref}</span></td>
                      <td style={{ padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>{v.count}台</td>
                      <td style={{ padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>{v.charge.toFixed(1)} kg</td>
                      <td style={{ padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>{v.leak.toFixed(1)} kg</td>
                      <td style={{ padding: '7px 8px', borderBottom: '0.5px solid rgba(0,0,0,.06)' }}>{co2.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}
