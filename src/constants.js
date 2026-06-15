// フロン冷媒 GWP (地球温暖化係数) 一覧
export const GWP = {
  'R-410A': 2088,
  'R-32': 675,
  'R-134a': 1430,
  'R-404A': 3922,
  'R-407C': 1774,
  'R-22': 1810,
  'R-744': 1,
  'R-290': 3,
  'R-600a': 3,
  'other': 100,
}

export const REFRIGERANT_OPTIONS = [
  { value: 'R-410A', label: 'R-410A (GWP: 2,088)' },
  { value: 'R-32',   label: 'R-32 (GWP: 675)' },
  { value: 'R-134a', label: 'R-134a (GWP: 1,430)' },
  { value: 'R-404A', label: 'R-404A (GWP: 3,922)' },
  { value: 'R-407C', label: 'R-407C (GWP: 1,774)' },
  { value: 'R-22',   label: 'R-22 (GWP: 1,810)' },
  { value: 'R-744',  label: 'R-744 / CO₂ (GWP: 1)' },
  { value: 'R-290',  label: 'R-290 / プロパン (GWP: 3)' },
  { value: 'other',  label: 'その他' },
]

// 法定点検区分 (定格能力 kW による)
export const LEGAL_INSPECTION_INTERVAL = {
  ANNUAL: { label: '1年点検', months: 12, minKw: 50 },
  TRIENNIAL: { label: '3年点検', months: 36, minKw: 7.5 },
}

// 点検結果ラベル
export const LEAK_LABELS = {
  none: '異常なし',
  suspect: '漏洩疑い',
  confirmed: '漏洩確認',
}

export const LEGAL_RESULT_LABELS = {
  ok: '異常なし',
  leak: '漏洩検知',
  repair: '修理要',
}

// 機器ステータス
export const EQUIPMENT_STATUS = {
  active: '稼働中',
  stop: '停止中',
  removed: '撤去済',
}

// 報告義務 CO₂換算閾値 (t-CO₂)
export const REPORT_THRESHOLD = 1000
