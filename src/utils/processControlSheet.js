import * as XLSX from 'xlsx'

const TEMPLATE_URL = `${import.meta.env.BASE_URL}templates/process-control-sheet-template.xlsx`

function setCell(ws, addr, value) {
  if (value === undefined || value === null || value === '') return
  const existing = ws[addr] || {}
  ws[addr] = { ...existing, t: typeof value === 'number' ? 'n' : 's', v: value }
  delete ws[addr].f // 万一数式が入っていた場合は値で上書き
}

/**
 * フロンガス行程管理票テンプレート(初期入力シート)へ値を書き込み、
 * A〜F票は元ファイルの数式のまま、同じExcelファイルとしてダウンロードする
 */
export async function downloadProcessControlSheet(data, filename) {
  const buf = await fetch(TEMPLATE_URL).then(r => r.arrayBuffer())
  const wb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true })
  const ws = wb.Sheets['初期入力']
  if (!ws) throw new Error('初期入力シートが見つかりません')

  // 機器所有者等
  setCell(ws, 'B2', data.deliveryDate)
  setCell(ws, 'B3', data.approvalDate)
  setCell(ws, 'B4', data.ownerName)
  setCell(ws, 'B5', data.ownerAddress)
  setCell(ws, 'B6', data.buildingName)
  setCell(ws, 'B7', data.buildingAddress)
  setCell(ws, 'B8', data.abbr)
  setCell(ws, 'B9', data.contactName)
  setCell(ws, 'B10', data.deptName)
  setCell(ws, 'B11', data.tel)
  setCell(ws, 'B12', data.fax)

  // 廃棄する機器の種類及び台数
  setCell(ws, 'E2', data.airconCount)
  setCell(ws, 'E3', data.fridgeCount)

  // 取次者(1)
  setCell(ws, 'B15', data.agent1Date)
  setCell(ws, 'B16', data.agent1Name)
  setCell(ws, 'B17', data.agent1Address)
  setCell(ws, 'B18', data.agent1Contact)
  setCell(ws, 'B19', data.agent1Dept)
  setCell(ws, 'B20', data.agent1Tel)
  setCell(ws, 'B21', data.agent1Fax)

  // 回収内容（エアコン/冷蔵冷凍/計/銘板記載充塡量 × CFC/HCFC/HFC/計 の内訳）
  ;['16', '17', '18', '19'].forEach(row => {
    ;['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
      const key = `grid_${col}${row}`
      if (data[key] !== undefined) setCell(ws, `${col}${row}`, data[key])
    })
  })
  setCell(ws, 'E20', data.uncollectedCount)

  // 取次者(2)
  setCell(ws, 'B24', data.agent2Date)
  setCell(ws, 'B25', data.agent2Name)
  setCell(ws, 'B26', data.agent2Address)
  setCell(ws, 'B27', data.agent2Contact)
  setCell(ws, 'B28', data.agent2Dept)
  setCell(ws, 'B29', data.agent2Tel)
  setCell(ws, 'B30', data.agent2Fax)

  // 充填回収業者（未指定ならテンプレートの初期値のまま）
  setCell(ws, 'B33', data.vendorRegNo)
  setCell(ws, 'B34', data.vendorPref)
  setCell(ws, 'B35', data.vendorName)
  setCell(ws, 'B36', data.vendorAddress)
  setCell(ws, 'B37', data.vendorContact)
  setCell(ws, 'B38', data.vendorDept)
  setCell(ws, 'B39', data.vendorTechnician)
  setCell(ws, 'B40', data.pickupDate)
  setCell(ws, 'B41', data.certIssueDate)
  setCell(ws, 'B42', data.vendorTel)
  setCell(ws, 'B43', data.vendorFax)

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellStyles: true })
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'フロンガス行程管理票.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
