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

// 帳票出力用 自社情報（点検・整備実施者としての既定値）
export const COMPANY_INFO = {
  name: 'シオンテクノス株式会社',
  address: '〒007-0824 札幌市東区北24条東4丁目1-1',
  tel: '011-751-8686',
  fax: '011-702-0070',
}

// 帳票参考表示用 主要冷媒GWP値（一部）
export const GWP_REFERENCE_ROW = [
  { label: 'R22',    gwp: 1810 },
  { label: 'R32',    gwp: 675 },
  { label: 'R134a',  gwp: 1430 },
  { label: 'R404A',  gwp: 3922 },
  { label: 'R407C',  gwp: 1774 },
  { label: 'R410A',  gwp: 2088 },
]

// ④ 点検・整備区分
export const INSPECTION_CATEGORY_OPTIONS = [
  '出荷時初期充填量', '設置時追加充填量',
  '設置時点検', '定期点検', '呼出点検', '漏えい修理', '整備(修理)後点検', '廃棄', '譲渡', 'その他',
]

// ⑤ 点検内容
export const INSPECTION_METHOD_OPTIONS = [
  'システム漏えい試験（気密試験）',
  'システム漏えい試験（加圧漏えい試験）',
  'システム漏えい試験（真空検査）',
  '目視外観点検（システム漏えい点検）',
  '間接法', '直接法', 'その他',
]

// ⑥ 漏えい点検結果
export const LEAK_RESULT_OPTIONS = ['なし', '兆候あり', 'あり']

// ⑦ 漏えい・故障の原因
export const LEAK_CAUSE_OPTIONS = [
  '振動・共振', '経年劣化（摩耗）', '経年劣化（疲労）', '経年腐食', '液ハンマー',
  '偶発的な故障', '損傷（こすれ、亀裂など）', '締め付け不足', 'シート部ゴミ噛み',
  '水分・空気混入', '熱膨張・収縮', '材質・構造の不適', '基礎・支持方法不適',
  '設置環境不適', '水質管理の問題', '運転操作ミス', '誤診・判断遅れ',
  '操作不良（ミス）', '潤滑油、冷媒の劣化', 'その他',
]

// ⑧ 漏えい・故障箇所
export const LEAK_LOCATION_OPTIONS = [
  'ろう付け部', '溶接部', 'フレア継手部', 'ガスケット部', 'ねじ部',
  'シール部', '部材内外面部', 'その他',
]

// ⑨ 修理の内容
export const REPAIR_CONTENT_OPTIONS = [
  '異物の除去（清掃）', 'フレア部再加工', 'フレアアダプタ使用', 'ろう付け補修',
  '溶接補修', '配管支持補修', '部品交換', '配管支持', 'ガスケット交換',
  'Ｏリング交換', 'ストレーナ交換', 'フィルター交換', '防震ゴム交換',
  '送風系統部品交換', 'ドレン系統部品交換', 'ヒータ類交換', '低圧側配管交換',
  '高圧側配管交換', 'ドライヤ交換', 'ポンプ類交換', '膨張弁交換',
  '電磁弁・四方弁等交換', '安全弁交換', '圧力・連成計交換', '圧力・温度スイッチ交換',
  '圧力・温度センサー交換', '可溶栓交換', '加湿器部品交換', '液面計交換',
  'シャフトシール交換', '空気熱交換器交換', '水熱交換器交換', '制御装置・電装部品交換',
  '開閉器類交換', 'その他',
]

// 機器ステータス
export const EQUIPMENT_STATUS = {
  active: '稼働中',
  stop: '停止中',
  removed: '撤去済',
}

// 報告義務 CO₂換算閾値 (t-CO₂)
export const REPORT_THRESHOLD = 1000
