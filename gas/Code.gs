/**
 * ============================================================
 * シオンテクノス 統合管理システム — Google Apps Script
 * ============================================================
 *
 * 【統合内容】
 *   - 空調点検・作業報告システム（既存）
 *   - フロン管理システム（新規）
 *   ↓ 同一スプレッドシートで一元管理
 *
 * 【シート構成】
 *   点検報告       … 既存の作業報告データ（変更なし）
 *   機器マスタ     … 両システム共有の機器DB
 *   fron_data      … フロン管理JSONデータ（新規）
 *   充填・回収記録 … 自動転記 + 手動入力
 *   法定点検記録   … 法定点検の履歴
 *   漏洩量サマリ   … 年度別CO₂換算自動集計
 *
 * 【セットアップ手順】
 *   1. 既存スプレッドシートを開く
 *   2. 拡張機能 > Apps Script > このコードを全貼り付け
 *   3. デプロイ > 新しいデプロイ > ウェブアプリ
 *      実行: 自分 / アクセス: 全員
 *   4. フロン管理側 .env に VITE_GAS_URL=<URL> を設定
 *   5. 既存ac-inspectionの VITE_GAS_URL も同じURLに更新
 * ============================================================
 */

// ── シート名定数 ──────────────────────────────────────────────
const SHEET_INSPECTION  = '点検報告';
const SHEET_EQUIPMENT   = '機器マスタ';
const SHEET_FRON_DATA   = 'fron_data';
const SHEET_FILL        = '充填・回収記録';
const SHEET_LEGAL       = '法定点検記録';
const SHEET_LEAK_SUMMARY = '漏洩量サマリ';

// ── 既存: 作業報告カラム（変更しない） ───────────────────────
const INSPECTION_COLUMNS = [
  'id', 'customerName', 'address', 'requester', 'reception',
  'systemName', 'productType', 'maker', 'model', 'serial', 'refrigerant',
  'refShip', 'refAdd', 'refRecover', 'refFill',
  'workDate', 'workStart', 'workEnd',
  'symptom', 'cause', 'workContent', 'remarks',
  'tempIndoorIn', 'tempIndoorOut', 'pressDischarge', 'pressSuction',
  'tempDischarge', 'tempSuction', 'tempOutdoor', 'current',
  'parts',
  'status', 'worker', 'confirmer',
  'createdAt', 'updatedAt', 'customerSign',
  'eqMasterId'  // ← 追加: 機器マスタとの紐付けID
];

// ── 機器マスタカラム ──────────────────────────────────────────
const EQUIPMENT_COLUMNS = [
  'id',           // 機器マスタID（例: EQ-001）
  'customerName', // 顧客名
  'address',      // 設置住所
  'systemName',   // 機器名称
  'productType',  // 機器種別
  'maker',        // メーカー
  'model',        // 型番
  'serial',       // 製造番号
  'refrigerant',  // 冷媒種別（R-410A など）
  'refShip',      // 初期充填量 (kg)
  'kw',           // 定格能力 (kW)
  'installed',    // 設置日
  'status',       // 稼働中 / 停止中 / 撤去済
  'note',
  'lastSimpleDate',  // 最終簡易点検日
  'lastLegalDate',   // 最終法定点検日
  'facilityName',    // 施設名称（帳票用、未入力時はcustomerNameを使用）
  'facilityAddress', // 施設住所（帳票用、未入力時はaddressを使用）
  'operManager',     // 運転管理責任者（帳票用）
  'createdAt',
  'updatedAt'
];

// ── 充填・回収カラム ──────────────────────────────────────────
const FILL_COLUMNS = [
  'id', 'eqMasterId', 'inspectionId',
  'kind',       // fill / recovery
  'date', 'amount', 'refrigerant', 'gwp', 'co2Ton',
  'vendor', 'cert', 'reason', 'note',
  'source',     // manual / auto_inspection（自動転記か手入力か）
  'createdAt'
];

// ── 法定点検カラム（冷媒漏えい点検・整備記録簿 準拠）──────────────
const LEGAL_COLUMNS = [
  'id', 'eqMasterId', 'inspectionId',
  'date', 'category',                        // 作業年月日 / 点検・整備区分
  'fillAmount', 'refillAmount', 'recoveryAmount', // 充填量 / 回収戻し充填量 / 回収量
  'method', 'result',                        // 点検内容 / 点検結果
  'cause', 'location', 'repair',             // 漏えい・故障の原因 / 箇所 / 修理の内容
  'vendor', 'technician',                    // 業者名 / 技術者氏名
  'note', 'createdAt'
];

// ── GWP テーブル ──────────────────────────────────────────────
const GWP_TABLE = {
  'R-410A': 2088, 'R-32': 675, 'R-134a': 1430,
  'R-404A': 3922, 'R-407C': 1774, 'R-22': 1810,
  'R-744': 1, 'R-290': 3, 'R-600a': 3
};

function getGWP(ref) {
  return GWP_TABLE[ref] || 100;
}

// ============================================================
// ── ルーティング ─────────────────────────────────────────────
// ============================================================

function doGet(e) {
  const p = e.parameter;
  try {
    const action = p.action || 'list';

    // ── 既存: 作業報告 ──
    if (action === 'list')      return makeRes(listInspections());
    if (action === 'get')       return makeRes(getInspection(p.id));
    if (action === 'create')    return makeRes(createInspection(JSON.parse(decodeURIComponent(p.data))));
    if (action === 'update')    return makeRes(updateInspection(p.id, JSON.parse(decodeURIComponent(p.data))));
    if (action === 'delete')    return makeRes(deleteInspection(p.id));
    if (action === 'saveSign')  return makeRes(saveSignImage(p.id, p.signData, 'jpeg'));

    // ── フロン管理: JSONデータ ──
    if (action === 'fron_load') return makeRes(fronLoad());

    // ── 機器マスタ ──
    if (action === 'eq_list')   return makeRes(listEquipment());
    if (action === 'eq_get')    return makeRes(getEquipmentById(p.id));
    if (action === 'eq_search') return makeRes(searchEquipment(p.q));

    // ── 充填・回収履歴 ──
    if (action === 'fill_list') return makeRes(listFillRecords(p.eqId, p.year));

    // ── 漏洩量サマリ ──
    if (action === 'leak_summary') return makeRes(getLeakSummary(p.year));

    return makeRes({ message: '不明なaction' }, 'error');
  } catch (err) {
    return makeRes({ message: err.message, stack: err.stack }, 'error');
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    // ── 既存: 作業報告 ──
    if (action === 'saveSign') return makeRes(saveSignImage(body.id, body.signData));
    if (action === 'update')   return makeRes(updateInspection(body.id, body.data));
    if (action === 'create')   return makeRes(createInspection(body.data));
    if (action === 'delete')   return makeRes(deleteInspection(body.id));

    // ── フロン管理: JSONまとめ保存 ──
    if (action === 'fron_save') return makeRes(fronSave(body.data));

    // ── 機器マスタ: CRUD ──
    if (action === 'eq_upsert') return makeRes(upsertEquipment(body.data));
    if (action === 'eq_delete') return makeRes(deleteEquipment(body.id));

    // ── 充填・回収: 手動登録 ──
    if (action === 'fill_create')   return makeRes(createFillRecord(body.data));
    if (action === 'fill_delete')   return makeRes(deleteFillRecord(body.id));

    // ── 法定点検: 手動登録 ──
    if (action === 'legal_create')  return makeRes(createLegalRecord(body.data));
    if (action === 'legal_delete')  return makeRes(deleteLegalRecord(body.id));

    // ── 同期: 点検報告 → フロン管理へ自動転記 ──
    if (action === 'sync_inspection_to_fron') return makeRes(syncInspectionToFron(body.inspectionId));

    return makeRes({ message: '不明なaction' }, 'error');
  } catch (err) {
    return makeRes({ message: err.message, stack: err.stack }, 'error');
  }
}

// ============================================================
// ── 既存: 作業報告 CRUD（元のコードを維持）────────────────────
// ============================================================

function listInspections() {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const records = rows.slice(1).map(row => rowToObj(headers, row));
  records.sort((a, b) => {
    const da = a.workDate ? new Date(a.workDate).getTime() : 0;
    const db = b.workDate ? new Date(b.workDate).getTime() : 0;
    return db - da;
  });
  return records;
}

function getInspection(id) {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return null;
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) return rowToObj(headers, rows[i]);
  }
  return null;
}

function createInspection(data) {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const id = Utilities.getUuid();
  const now = new Date().toISOString();

  // 機器マスタとの自動紐付け
  const eqMasterId = findOrCreateEquipmentFromInspection(data) || '';

  const row = INSPECTION_COLUMNS.map(col => {
    if (col === 'id')        return id;
    if (col === 'createdAt' || col === 'updatedAt') return now;
    if (col === 'parts')     return JSON.stringify(data.parts || []);
    if (col === 'eqMasterId') return eqMasterId;
    return data[col] !== undefined ? data[col] : '';
  });
  sheet.appendRow(row);

  // 充填・回収データを自動転記
  autoSyncFillFromInspection(id, eqMasterId, data);

  return { id, eqMasterId };
}

function updateInspection(id, data) {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) {
      const now = new Date().toISOString();
      const eqMasterId = findOrCreateEquipmentFromInspection(data) || rows[i][headers.indexOf('eqMasterId')] || '';
      INSPECTION_COLUMNS.forEach((col, j) => {
        if (col === 'id' || col === 'createdAt') return;
        if (col === 'updatedAt')  { sheet.getRange(i+1, j+1).setValue(now); return; }
        if (col === 'parts')      { sheet.getRange(i+1, j+1).setValue(JSON.stringify(data.parts || [])); return; }
        if (col === 'eqMasterId') { sheet.getRange(i+1, j+1).setValue(eqMasterId); return; }
        if (data[col] !== undefined) sheet.getRange(i+1, j+1).setValue(data[col]);
      });
      // 充填・回収を再同期（既存自動転記分を削除して再作成）
      deleteFillByInspectionId(id);
      autoSyncFillFromInspection(id, eqMasterId, data);
      return { id, eqMasterId };
    }
  }
  throw new Error('レコードが見つかりません: ' + id);
}

function deleteInspection(id) {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      deleteFillByInspectionId(id);
      return { id };
    }
  }
  throw new Error('レコードが見つかりません: ' + id);
}

function syncInspectionToFron(inspectionId) {
  const rec = getInspection(inspectionId);
  if (!rec) throw new Error('点検記録が見つかりません');
  const eqMasterId = rec.eqMasterId || findOrCreateEquipmentFromInspection(rec);
  deleteFillByInspectionId(inspectionId);
  autoSyncFillFromInspection(inspectionId, eqMasterId, rec);
  return { synced: true, eqMasterId };
}

// ============================================================
// ── 機器マスタ ────────────────────────────────────────────────
// ============================================================

function listEquipment() {
  const sheet = getOrCreateSheet(SHEET_EQUIPMENT, EQUIPMENT_COLUMNS, '#0066cc');
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => rowToObj(headers, row));
}

function getEquipmentById(id) {
  const list = listEquipment();
  return list.find(e => e.id === id) || null;
}

function searchEquipment(q) {
  if (!q) return listEquipment();
  const lq = q.toLowerCase();
  return listEquipment().filter(e =>
    [e.customerName, e.systemName, e.model, e.serial, e.refrigerant, e.address]
      .some(v => v && String(v).toLowerCase().includes(lq))
  );
}

function upsertEquipment(data) {
  const sheet = getOrCreateSheet(SHEET_EQUIPMENT, EQUIPMENT_COLUMNS, '#0066cc');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  const now = new Date().toISOString();

  // UPDATE
  if (data.id) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idCol] === data.id) {
        EQUIPMENT_COLUMNS.forEach((col, j) => {
          if (col === 'id' || col === 'createdAt') return;
          if (col === 'updatedAt') { sheet.getRange(i+1, j+1).setValue(now); return; }
          if (data[col] !== undefined) sheet.getRange(i+1, j+1).setValue(data[col]);
        });
        return { id: data.id, action: 'updated' };
      }
    }
  }

  // INSERT
  const id = data.id || generateEqId();
  const row = EQUIPMENT_COLUMNS.map(col => {
    if (col === 'id')        return id;
    if (col === 'createdAt' || col === 'updatedAt') return now;
    return data[col] !== undefined ? data[col] : '';
  });
  sheet.appendRow(row);
  return { id, action: 'created' };
}

function deleteEquipment(id) {
  const sheet = getOrCreateSheet(SHEET_EQUIPMENT, EQUIPMENT_COLUMNS, '#0066cc');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) { sheet.deleteRow(i + 1); return { id }; }
  }
  throw new Error('機器が見つかりません: ' + id);
}

/**
 * 点検報告から機器マスタを検索 or 自動作成
 * customerName + systemName + serial で一致判定
 */
function findOrCreateEquipmentFromInspection(data) {
  if (!data.customerName && !data.systemName) return '';
  const list = listEquipment();
  // シリアル番号が一致 → 既存確定
  if (data.serial) {
    const bySerial = list.find(e => e.serial && e.serial === data.serial);
    if (bySerial) return bySerial.id;
  }
  // 顧客名 + 機器名 + 型番で一致
  const byName = list.find(e =>
    e.customerName === data.customerName &&
    e.systemName   === data.systemName   &&
    (!data.model || e.model === data.model)
  );
  if (byName) {
    // 冷媒・充填量など最新値でマスタを更新
    upsertEquipment({
      id: byName.id,
      refrigerant: data.refrigerant || byName.refrigerant,
      refShip: data.refShip || byName.refShip,
    });
    return byName.id;
  }
  // 新規作成
  const result = upsertEquipment({
    customerName: data.customerName || '',
    address:      data.address      || '',
    systemName:   data.systemName   || '',
    productType:  data.productType  || '',
    maker:        data.maker        || '',
    model:        data.model        || '',
    serial:       data.serial       || '',
    refrigerant:  data.refrigerant  || '',
    refShip:      data.refShip      || '',
    installed:    data.workDate     || '',
    status:       'active',
  });
  return result.id;
}

/** EQ-001 形式のIDを採番 */
function generateEqId() {
  const sheet = getOrCreateSheet(SHEET_EQUIPMENT, EQUIPMENT_COLUMNS, '#0066cc');
  const count = Math.max(sheet.getLastRow() - 1, 0);
  return 'EQ-' + String(count + 1).padStart(3, '0');
}

// ============================================================
// ── 充填・回収記録 ────────────────────────────────────────────
// ============================================================

function listFillRecords(eqId, year) {
  const sheet = getOrCreateSheet(SHEET_FILL, FILL_COLUMNS, '#2E7D32');
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1)
    .map(row => rowToObj(headers, row))
    .filter(r => {
      if (eqId && r.eqMasterId !== eqId) return false;
      if (year  && !String(r.date).startsWith(String(year))) return false;
      return true;
    });
}

function createFillRecord(data) {
  const sheet = getOrCreateSheet(SHEET_FILL, FILL_COLUMNS, '#2E7D32');
  const id = Utilities.getUuid();
  const ref = data.refrigerant || '';
  const gwp = getGWP(ref);
  const co2 = ((parseFloat(data.amount) || 0) * gwp / 1000).toFixed(4);
  const row = FILL_COLUMNS.map(col => {
    if (col === 'id')        return id;
    if (col === 'gwp')       return gwp;
    if (col === 'co2Ton')    return parseFloat(co2);
    if (col === 'source')    return data.source || 'manual';
    if (col === 'createdAt') return new Date().toISOString();
    return data[col] !== undefined ? data[col] : '';
  });
  sheet.appendRow(row);
  // 機器マスタの最終充填日を更新
  if (data.eqMasterId && data.kind === 'fill') {
    updateEquipmentLastDates(data.eqMasterId, { lastSimpleDate: data.date });
  }
  return { id };
}

function deleteFillRecord(id) {
  return deleteRowById(SHEET_FILL, FILL_COLUMNS, id);
}

function deleteFillByInspectionId(inspectionId) {
  const sheet = getOrCreateSheet(SHEET_FILL, FILL_COLUMNS, '#2E7D32');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const insCol = headers.indexOf('inspectionId');
  const srcCol = headers.indexOf('source');
  // 後ろから削除してインデックスがずれないようにする
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][insCol] === inspectionId && rows[i][srcCol] === 'auto_inspection') {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * 点検報告の充填・回収データをフロン管理に自動転記
 * refAdd (追加充填) / refRecover (回収) が入力されていたら転記
 */
function autoSyncFillFromInspection(inspectionId, eqMasterId, data) {
  if (!eqMasterId) return;
  const ref = data.refrigerant || '';
  const date = data.workDate || '';

  // 追加充填
  const fillAmt = parseFloat(data.refAdd) || 0;
  if (fillAmt > 0) {
    createFillRecord({
      eqMasterId,
      inspectionId,
      kind:        'fill',
      date,
      amount:      fillAmt,
      refrigerant: ref,
      vendor:      data.worker || '',
      reason:      '作業報告より自動転記',
      source:      'auto_inspection',
    });
  }

  // 回収
  const recAmt = parseFloat(data.refRecover) || 0;
  if (recAmt > 0) {
    createFillRecord({
      eqMasterId,
      inspectionId,
      kind:        'recovery',
      date,
      amount:      recAmt,
      refrigerant: ref,
      vendor:      data.worker || '',
      reason:      '作業報告より自動転記',
      source:      'auto_inspection',
    });
  }
}

// ============================================================
// ── 法定点検記録 ──────────────────────────────────────────────
// ============================================================

function createLegalRecord(data) {
  const sheet = getOrCreateSheet(SHEET_LEGAL, LEGAL_COLUMNS, '#1565C0');
  const id = Utilities.getUuid();
  const row = LEGAL_COLUMNS.map(col => {
    if (col === 'id')        return id;
    if (col === 'createdAt') return new Date().toISOString();
    return data[col] !== undefined ? data[col] : '';
  });
  sheet.appendRow(row);
  // 機器マスタの最終法定点検日を更新
  if (data.eqMasterId) {
    updateEquipmentLastDates(data.eqMasterId, { lastLegalDate: data.date });
  }
  return { id };
}

function deleteLegalRecord(id) {
  return deleteRowById(SHEET_LEGAL, LEGAL_COLUMNS, id);
}

// ============================================================
// ── フロン管理: JSONまとめ保存・読み込み ──────────────────────
// ============================================================

function fronLoad() {
  // スプレッドシートから組み立ててフロント側のDB形式で返す
  const equipment = listEquipment().map(eq => ({
    id:       eq.id,
    name:     eq.systemName,
    model:    [eq.maker, eq.model].filter(Boolean).join(' '),
    location: [eq.customerName, eq.address].filter(Boolean).join(' '),
    ref:      eq.refrigerant,
    charge:   eq.refShip,
    kw:       eq.kw,
    installed:eq.installed,
    status:   eq.status || 'active',
    note:     eq.note,
    customerName: eq.customerName,
    lastSimple: eq.lastSimpleDate,
    lastLegal:  eq.lastLegalDate,
    facilityName:    eq.facilityName,
    facilityAddress: eq.facilityAddress,
    operManager:     eq.operManager,
  }));

  const allFills = listFillRecords();
  const fills = allFills
    .filter(r => r.kind === 'fill')
    .map(r => ({
      id: r.id, eqId: r.eqMasterId, date: r.date,
      amount: r.amount, vendor: r.vendor, reason: r.reason, note: r.note,
    }));
  const recoveries = allFills
    .filter(r => r.kind === 'recovery')
    .map(r => ({
      id: r.id, eqId: r.eqMasterId, date: r.date,
      amount: r.amount, vendor: r.vendor, cert: r.cert,
    }));

  const legalSheet = getOrCreateSheet(SHEET_LEGAL, LEGAL_COLUMNS, '#1565C0');
  const legalRows = legalSheet.getDataRange().getValues();
  const legalHeaders = legalRows[0];
  const legal = legalRows.slice(1).map(row => {
    const obj = rowToObj(legalHeaders, row);
    return {
      id: obj.id, eqId: obj.eqMasterId, date: obj.date,
      category: obj.category,
      fillAmount: obj.fillAmount, refillAmount: obj.refillAmount, recoveryAmount: obj.recoveryAmount,
      method: obj.method, result: obj.result,
      cause: obj.cause, location: obj.location, repair: obj.repair,
      vendor: obj.vendor, technician: obj.technician, note: obj.note,
    };
  });

  // 簡易点検は点検報告から取得（status=完了 or 異常なし相当）
  const inspections = listInspections();
  const simple = inspections
    .filter(r => r.status && r.eqMasterId)
    .map(r => ({
      id:        r.id,
      eqId:      r.eqMasterId,
      date:      r.workDate,
      inspector: r.worker,
      leak:      (parseFloat(r.refAdd) > 0 || parseFloat(r.refRecover) > 0)
                   ? 'suspect' : 'none',
      note:      [r.symptom, r.workContent].filter(Boolean).join(' / '),
    }));

  return { equipment, simple, legal, fills, recoveries };
}

function fronSave(data) {
  // フロン管理フロントから送られたJSONをfron_dataシートにバックアップ
  const sheet = getOrCreateSheet(SHEET_FRON_DATA, ['json', 'savedAt']);
  sheet.clearContents();
  sheet.appendRow(['json', 'savedAt']);
  sheet.getRange(2, 1).setValue(JSON.stringify(data));
  sheet.getRange(2, 2).setValue(new Date().toISOString());

  // 機器マスタへ差分反映
  if (data.equipment) {
    data.equipment.forEach(eq => {
      upsertEquipment({
        id:           eq.id,
        systemName:   eq.name,
        customerName: eq.customerName,
        refrigerant:  eq.ref,
        refShip:      eq.charge,
        kw:           eq.kw,
        installed:    eq.installed,
        status:       eq.status,
        note:         eq.note,
        facilityName:    eq.facilityName,
        facilityAddress: eq.facilityAddress,
        operManager:     eq.operManager,
      });
    });
  }

  // 点検・整備記録（法定点検）をシートへ全件反映（フロント側が唯一の管理元のため全洗い替え）
  if (data.legal) {
    const legalSheet = getOrCreateSheet(SHEET_LEGAL, LEGAL_COLUMNS, '#1565C0');
    legalSheet.clearContents();
    legalSheet.appendRow(LEGAL_COLUMNS);
    const now = new Date().toISOString();
    data.legal.forEach(r => {
      const row = LEGAL_COLUMNS.map(col => {
        if (col === 'id')          return r.id || Utilities.getUuid();
        if (col === 'eqMasterId')  return r.eqId || r.eqMasterId || '';
        if (col === 'createdAt')   return r.createdAt || now;
        return r[col] !== undefined ? r[col] : '';
      });
      legalSheet.appendRow(row);
    });
  }

  // 漏洩量サマリを再計算して保存
  rebuildLeakSummary();

  return { status: 'ok', savedAt: new Date().toISOString() };
}

// ============================================================
// ── 漏洩量サマリ（年度別自動集計）────────────────────────────
// ============================================================

function getLeakSummary(year) {
  rebuildLeakSummary();
  const sheet = getOrCreateSheet(SHEET_LEAK_SUMMARY,
    ['year','refrigerant','gwp','fillKg','recoverKg','leakKg','co2Ton','updatedAt'],
    '#6A1B9A');
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const all = rows.slice(1).map(row => rowToObj(headers, row));
  return year ? all.filter(r => String(r.year) === String(year)) : all;
}

function rebuildLeakSummary() {
  const allFills = listFillRecords();
  // 年 × 冷媒 でグループ集計
  const map = {};
  allFills.forEach(r => {
    if (!r.date) return;
    const y = String(r.date).substring(0, 4);
    const ref = r.refrigerant || 'other';
    const key = y + '|' + ref;
    if (!map[key]) map[key] = { year: y, refrigerant: ref, gwp: getGWP(ref), fill: 0, rec: 0 };
    const amt = parseFloat(r.amount) || 0;
    if (r.kind === 'fill')     map[key].fill += amt;
    if (r.kind === 'recovery') map[key].rec  += amt;
  });

  const sheet = getOrCreateSheet(SHEET_LEAK_SUMMARY,
    ['year','refrigerant','gwp','fillKg','recoverKg','leakKg','co2Ton','updatedAt'],
    '#6A1B9A');
  sheet.clearContents();
  sheet.appendRow(['year','refrigerant','gwp','fillKg','recoverKg','leakKg','co2Ton','updatedAt']);
  const now = new Date().toISOString();
  Object.values(map).forEach(v => {
    const leak = v.fill; // 算定漏洩量 = 充填量（フロン排出抑制法の計算式）
    const co2  = (leak * v.gwp / 1000).toFixed(4);
    sheet.appendRow([v.year, v.refrigerant, v.gwp, v.fill.toFixed(3), v.rec.toFixed(3),
                     leak.toFixed(3), parseFloat(co2), now]);
  });
}

// ============================================================
// ── Google Drive: サイン画像保存（既存のまま）────────────────
// ============================================================

function saveSignImage(reportId, base64Data, imgType) {
  imgType = imgType || 'png';
  const mimeType = imgType === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext      = imgType === 'jpeg' ? 'jpg' : 'png';
  const base64   = base64Data.replace(/^data:image\/(png|jpeg);base64,/, '');
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64), mimeType, 'sign_' + reportId + '.' + ext
  );
  const folderName = '点検報告_サイン';
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  const existing = folder.getFilesByName('sign_' + reportId + '.' + ext);
  const pngFiles = folder.getFilesByName('sign_' + reportId + '.png');
  while (pngFiles.hasNext()) pngFiles.next().setTrashed(true);
  while (existing.hasNext()) existing.next().setTrashed(true);

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const imageUrl = 'https://lh3.googleusercontent.com/d/' + file.getId();
  updateSignUrl(reportId, imageUrl);
  return { imageUrl, fileId: file.getId() };
}

function updateSignUrl(reportId, imageUrl) {
  const sheet = getOrCreateSheet(SHEET_INSPECTION, INSPECTION_COLUMNS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol   = headers.indexOf('id');
  const signCol = headers.indexOf('customerSign');
  if (signCol === -1) return;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === reportId) {
      sheet.getRange(i + 1, signCol + 1).setValue(imageUrl);
      return;
    }
  }
}

// ============================================================
// ── ユーティリティ ────────────────────────────────────────────
// ============================================================

function makeRes(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status || 'ok', data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name, columns, headerBg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(columns);
    const hr = sheet.getRange(1, 1, 1, columns.length);
    hr.setBackground(headerBg || '#0066cc');
    hr.setFontColor('white');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, columns.length);
  }
  return sheet;
}

function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    const val = row[i];
    if (val instanceof Date) {
      if (h === 'workStart' || h === 'workEnd') {
        obj[h] = Utilities.formatDate(val, 'Asia/Tokyo', 'HH:mm');
        if (obj[h] === '00:00') obj[h] = '';
      } else {
        obj[h] = Utilities.formatDate(val, 'Asia/Tokyo', 'yyyy-MM-dd');
      }
    } else {
      obj[h] = val;
    }
  });
  if (obj.parts && typeof obj.parts === 'string') {
    try { obj.parts = JSON.parse(obj.parts); } catch(e) { obj.parts = []; }
  }
  return obj;
}

function deleteRowById(sheetName, columns, id) {
  const sheet = getOrCreateSheet(sheetName, columns);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === id) { sheet.deleteRow(i + 1); return { id }; }
  }
  throw new Error('レコードが見つかりません: ' + id);
}

function updateEquipmentLastDates(eqMasterId, dates) {
  const sheet = getOrCreateSheet(SHEET_EQUIPMENT, EQUIPMENT_COLUMNS, '#0066cc');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idCol] === eqMasterId) {
      if (dates.lastSimpleDate !== undefined) {
        const col = headers.indexOf('lastSimpleDate');
        if (col >= 0) sheet.getRange(i+1, col+1).setValue(dates.lastSimpleDate);
      }
      if (dates.lastLegalDate !== undefined) {
        const col = headers.indexOf('lastLegalDate');
        if (col >= 0) sheet.getRange(i+1, col+1).setValue(dates.lastLegalDate);
      }
      return;
    }
  }
}

function authorizeApp() {
  DriveApp.getFolders();
  DriveApp.createFolder('__auth_test_delete_me__').setTrashed(true);
  SpreadsheetApp.getActiveSpreadsheet();
}
