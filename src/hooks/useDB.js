import { useState, useEffect, useCallback, useRef } from 'react'
import { gasLoad, gasSave, gasEnabled, SyncStatus, gasDeleteRecord, gasDeleteEquipment } from '../utils/gasClient'

const STORAGE_KEY = 'sion-fron-db'
const SYNC_DEBOUNCE_MS = 2000

const defaultDB = {
  equipment: [],
  simple: [],
  legal: [],
  fills: [],
  recoveries: [],
  vendors: [],
  technicians: [],
  inspections: [],
  certificates: [],
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultDB, ...JSON.parse(raw) } : defaultDB
  } catch {
    return defaultDB
  }
}

function saveToLocal(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (e) {
    console.error('localStorage error:', e)
  }
}

export function useDB() {
  const [db, setDB] = useState(loadFromLocal)
  const [syncStatus, setSyncStatus] = useState(SyncStatus.IDLE)
  const [syncError, setSyncError] = useState(null)
  const syncTimer = useRef(null)

  // GASが有効なら起動時にロード
  useEffect(() => {
    if (!gasEnabled()) return
    setSyncStatus(SyncStatus.SYNCING)
    gasLoad()
      .then(data => {
        const merged = { ...defaultDB, ...data }
        setDB(merged)
        saveToLocal(merged)
        setSyncStatus(SyncStatus.SUCCESS)
        setSyncError(null)
      })
      .catch(err => {
        console.warn('GAS load failed, using local data:', err)
        setSyncStatus(SyncStatus.ERROR)
        setSyncError(err.message)
      })
  }, [])

  // DB変更時: localStorageへ即時保存 + GASへデバウンス同期
  useEffect(() => {
    saveToLocal(db)
    if (!gasEnabled()) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      setSyncStatus(SyncStatus.SYNCING)
      gasSave(db)
        .then(() => { setSyncStatus(SyncStatus.SUCCESS); setSyncError(null) })
        .catch(err => { setSyncStatus(SyncStatus.ERROR); setSyncError(err.message) })
    }, SYNC_DEBOUNCE_MS)
  }, [db])

  const update = useCallback((key, updater) => {
    setDB(prev => ({
      ...prev,
      [key]: typeof updater === 'function' ? updater(prev[key]) : updater,
    }))
  }, [])

  const addRecord = useCallback((key, record) => {
    const newRecord = { ...record, id: Date.now().toString() }
    setDB(prev => ({ ...prev, [key]: [...prev[key], newRecord] }))
    return newRecord
  }, [])

  const deleteRecord = useCallback((key, id) => {
    setDB(prev => ({ ...prev, [key]: prev[key].filter(r => r.id !== id) }))
    if (!gasEnabled()) return
    if (key === 'equipment') {
      gasDeleteEquipment(id).catch(err => console.warn('gasDeleteEquipment failed:', err))
    } else if (['legal', 'simple', 'vendors', 'technicians', 'certificates'].includes(key)) {
      gasDeleteRecord(key, id).catch(err => console.warn('gasDeleteRecord failed:', err))
    }
    // fills / recoveries: 充填・回収記録シートは列構成不明のため個別削除は行わない（従来通りローカルのみ）
  }, [])

  const updateRecord = useCallback((key, id, patch) => {
    setDB(prev => ({
      ...prev,
      [key]: prev[key].map(r => r.id === id ? { ...r, ...patch } : r),
    }))
  }, [])

  const upsertEquipment = useCallback((eq) => {
    setDB(prev => {
      const exists = prev.equipment.find(e => e.id === eq.id)
      return {
        ...prev,
        equipment: exists
          ? prev.equipment.map(e => e.id === eq.id ? { ...e, ...eq } : e)
          : [...prev.equipment, eq],
      }
    })
  }, [])

  const manualSync = useCallback(async () => {
    if (!gasEnabled()) return
    setSyncStatus(SyncStatus.SYNCING)
    try {
      await gasSave(db)
      setSyncStatus(SyncStatus.SUCCESS)
      setSyncError(null)
    } catch (err) {
      setSyncStatus(SyncStatus.ERROR)
      setSyncError(err.message)
    }
  }, [db])

  const resetDB = useCallback(() => { setDB(defaultDB) }, [])

  return {
    db, update, addRecord, deleteRecord, updateRecord, upsertEquipment, resetDB,
    syncStatus, syncError, manualSync,
  }
}
