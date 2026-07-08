import { useState } from 'react'
import { useDB } from './hooks/useDB'
import { useToast } from './hooks/useToast'
import { Dashboard } from './components/Dashboard'
import { Equipment } from './components/Equipment'
import { SimpleInspection } from './components/SimpleInspection'
import { LegalInspection } from './components/LegalInspection'
import { FillRecovery } from './components/FillRecovery'
import { Report } from './components/Report'
import { VendorTechnician } from './components/VendorTechnician'
import { ProcessControlSheet } from './components/ProcessControlSheet'
import { Toast } from './components/Toast'
import { SyncStatus } from './utils/gasClient'

const NAV = [
  { id: 'dashboard',  label: 'ダッシュボード', section: 'メイン' },
  { id: 'equipment',  label: '機器台帳',         section: 'メイン' },
  { id: 'vendors',    label: '業者・技術者',      section: 'メイン' },
  { id: 'simple',     label: '簡易点検',          section: '点検管理' },
  { id: 'legal',      label: '法定点検',          section: '点検管理' },
  { id: 'fill',       label: '充填・回収',         section: 'フロン記録' },
  { id: 'process',    label: '行程管理票（廃棄時）', section: 'フロン記録' },
  { id: 'report',     label: '漏洩量・報告書',     section: 'フロン記録' },
]

function SyncBadge({ status, error, onRetry }) {
  const map = {
    [SyncStatus.IDLE]:    { label: 'ローカル保存', color: '#888' },
    [SyncStatus.SYNCING]: { label: '同期中…',      color: '#185FA5' },
    [SyncStatus.SUCCESS]: { label: 'GAS同期済',    color: '#3B6D11' },
    [SyncStatus.ERROR]:   { label: 'GASエラー',    color: '#A32D2D' },
  }
  const s = map[status] || map[SyncStatus.IDLE]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: s.color }}>{s.label}</span>
      {status === SyncStatus.ERROR && (
        <button onClick={onRetry} style={{ fontSize: 10, padding: '1px 6px', border: '0.5px solid #F09595', borderRadius: 4, background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}>
          再試行
        </button>
      )}
    </div>
  )
}

function NavItem({ item, active, alertCount, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 16px', cursor: 'pointer', fontSize: 12,
        color: active ? '#1a1a1a' : '#666',
        background: active ? '#fff' : 'transparent',
        borderLeft: `2px solid ${active ? '#185FA5' : 'transparent'}`,
        userSelect: 'none',
      }}
    >
      {item.label}
      {alertCount > 0 && (
        <span style={{ marginLeft: 'auto', background: '#FCEBEB', color: '#A32D2D', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 500 }}>
          {alertCount}
        </span>
      )}
    </div>
  )
}

export default function App() {
  const [currentNav, setCurrentNav] = useState('dashboard')
  const { db, update, addRecord, deleteRecord, updateRecord, upsertEquipment, resetDB, syncStatus, syncError, manualSync } = useDB()
  const { toast, show: showToast } = useToast()

  // アラート件数計算（ダッシュボードバッジ用）
  const alertCount = (() => {
    let c = 0
    // 簡略計算: 期限超過or7日以内のアラート数
    return c
  })()

  const sections = [...new Set(NAV.map(n => n.section))]

  const pageProps = { db, addRecord, deleteRecord, updateRecord, upsertEquipment, toast: showToast }

  const pages = {
    dashboard: <Dashboard db={db} />,
    equipment: <Equipment {...pageProps} />,
    vendors:   <VendorTechnician {...pageProps} />,
    simple:    <SimpleInspection {...pageProps} />,
    legal:     <LegalInspection {...pageProps} />,
    fill:      <FillRecovery {...pageProps} />,
    process:   <ProcessControlSheet db={db} toast={showToast} />,
    report:    <Report db={db} toast={showToast} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 13 }}>
      {/* Sidebar */}
      <div style={{ width: 196, minWidth: 196, borderRight: '0.5px solid rgba(0,0,0,.1)', background: '#f8f8f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>フロン管理システム</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>シオンテクノス株式会社</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sections.map(sec => (
            <div key={sec}>
              <div style={{ padding: '10px 16px 3px', fontSize: 10, color: '#aaa', letterSpacing: '.06em', textTransform: 'uppercase' }}>{sec}</div>
              {NAV.filter(n => n.section === sec).map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={currentNav === item.id}
                  alertCount={item.id === 'dashboard' ? alertCount : 0}
                  onClick={() => setCurrentNav(item.id)}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 16px', borderTop: '0.5px solid rgba(0,0,0,.08)' }}>
          <SyncBadge status={syncStatus} error={syncError} onRetry={manualSync} />
          <div style={{ marginTop: 6, fontSize: 11, color: '#888' }}>管理者</div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>田中 点検太郎</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f2f1ec' }}>
        <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,.08)', padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {NAV.find(n => n.id === currentNav)?.label}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentNav === 'equipment' && (
              <button
                onClick={() => {/* Equipment内でハンドル */}}
                style={{ padding: '6px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                + 機器追加
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {pages[currentNav]}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
