import Dexie from 'dexie'

export const db = new Dexie('RefrigerationRepairDB')

// 다른 탭이 DB를 열고 있을 때 자동 새로고침
db.on('versionchange', () => { db.close(); window.location.reload() })
db.on('blocked', () => window.location.reload())

db.version(1).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
})

db.version(2).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
})

db.version(3).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
})

db.version(4).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
})

db.version(5).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
})

db.version(6).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
}).upgrade(async (tx) => {
  await tx.table('flow_categories').clear()
  await tx.table('flow_nodes').clear()
})

db.version(7).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
}).upgrade(async (tx) => {
  await tx.table('flow_categories').clear()
  await tx.table('flow_nodes').clear()
})

db.version(8).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
}).upgrade(async (tx) => {
  await tx.table('flow_categories').clear()
  await tx.table('flow_nodes').clear()
})

db.version(9).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
}).upgrade(async (tx) => {
  await tx.table('flow_categories').clear()
  await tx.table('flow_nodes').clear()
})

db.version(10).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
})

db.version(11).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
}).upgrade(async (tx) => {
  await tx.table('checklist_templates').clear()
})

db.version(12).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
})

db.version(13).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
}).upgrade(async (tx) => {
  await tx.table('flow_categories').clear()
  await tx.table('flow_nodes').clear()
})

db.version(14).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
})

db.version(15).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
})

db.version(16).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
})

db.version(17).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
  voice_recordings: '++id, createdAt, status',
})

db.version(18).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
  voice_recordings: '++id, createdAt, status',
  suppliers: '++id, name, createdAt',
  supplier_transactions: '++id, supplierId, date, createdAt',
})

// v19: knowhow에 customerId 인덱스 추가 (거래처별 설비 기록 조회용, 거래처 필수 입력)
db.version(19).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, customerId, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
  voice_recordings: '++id, createdAt, status',
  suppliers: '++id, name, createdAt',
  supplier_transactions: '++id, supplierId, date, createdAt',
})

// v20: share_queue 테이블 추가 (v2 가동용 스캐폴드, 현재는 비어있음)
db.version(20).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, customerId, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
  voice_recordings: '++id, createdAt, status',
  suppliers: '++id, name, createdAt',
  supplier_transactions: '++id, supplierId, date, createdAt',
  share_queue: '++id, recordType, status, createdAt',
})

// v21: 출시 전 테스트 더미 데이터 일괄 정리 (testData.js 폐기와 함께 1회 실행)
db.version(21).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, date, symptomId, equipmentName',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, name, phone',
  service_jobs: '++id, customerId, status, receiptDate, visitDate',
  job_photos: '++id, jobId',
  backups: '++id, createdAt',
  knowhow: '++id, customerId, category, location, createdAt, updatedAt',
  business_cards: '++id, customerId, createdAt',
  expenses: '++id, jobId, date, createdAt',
  checklist_results: '++id, templateTitle, createdAt, level',
  equipment_maintenance: '++id, customerId, nextDueDate',
  user_alarms: '++id, date, fired',
  voice_recordings: '++id, createdAt, status',
  suppliers: '++id, name, createdAt',
  supplier_transactions: '++id, supplierId, date, createdAt',
  share_queue: '++id, recordType, status, createdAt',
}).upgrade(async (tx) => {
  await Promise.all([
    tx.table('customers').clear(),
    tx.table('service_jobs').clear(),
    tx.table('job_photos').clear(),
    tx.table('repair_logs').clear(),
    tx.table('checklist_results').clear(),
    tx.table('expenses').clear(),
    tx.table('knowhow').clear(),
    tx.table('business_cards').clear(),
    tx.table('equipment_maintenance').clear(),
    tx.table('user_alarms').clear(),
    tx.table('suppliers').clear(),
    tx.table('supplier_transactions').clear(),
  ])
})

// v22: 클라우드 동기화 도입 — 모든 사용자 데이터에 cloudId(UUID) + updatedAt + deletedAt 추가
// cloudId: Firestore doc ID, 기기 간 동일 보장 (UUID v4)
// updatedAt: 충돌 해결용 last-write-wins 비교
// deletedAt: tombstone — 삭제된 doc도 sync 위해 일정 기간 보관
db.version(22).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, &cloudId, date, symptomId, equipmentName, updatedAt, deletedAt',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, &cloudId, name, phone, updatedAt, deletedAt',
  service_jobs: '++id, &cloudId, customerId, status, receiptDate, visitDate, updatedAt, deletedAt',
  job_photos: '++id, &cloudId, jobId, updatedAt, deletedAt',
  backups: '++id, createdAt',
  knowhow: '++id, &cloudId, customerId, category, location, createdAt, updatedAt, deletedAt',
  business_cards: '++id, &cloudId, customerId, createdAt, updatedAt, deletedAt',
  expenses: '++id, &cloudId, jobId, date, createdAt, updatedAt, deletedAt',
  checklist_results: '++id, &cloudId, templateTitle, createdAt, level, updatedAt, deletedAt',
  equipment_maintenance: '++id, &cloudId, customerId, nextDueDate, updatedAt, deletedAt',
  user_alarms: '++id, &cloudId, date, fired, updatedAt, deletedAt',
  voice_recordings: '++id, &cloudId, createdAt, status, updatedAt, deletedAt',
  suppliers: '++id, &cloudId, name, createdAt, updatedAt, deletedAt',
  supplier_transactions: '++id, &cloudId, supplierId, date, createdAt, updatedAt, deletedAt',
  share_queue: '++id, recordType, status, createdAt',
  sync_state: '&key',  // 마지막 sync 타임스탬프 보관 (key: 'lastPull', 'lastPush' 등)
}).upgrade(async (tx) => {
  // 기존 row 모두에 cloudId(UUID) + updatedAt 채움
  const now = new Date().toISOString()
  const SYNC_TABLES = [
    'customers', 'service_jobs', 'job_photos', 'repair_logs',
    'knowhow', 'business_cards', 'expenses', 'checklist_results',
    'equipment_maintenance', 'user_alarms', 'voice_recordings',
    'suppliers', 'supplier_transactions',
  ]
  for (const tableName of SYNC_TABLES) {
    await tx.table(tableName).toCollection().modify((row) => {
      if (!row.cloudId) row.cloudId = crypto.randomUUID()
      if (!row.updatedAt) row.updatedAt = row.createdAt || now
    })
  }
})

// v23: 외래 키 cloudId 추가 — 기기 간 안전한 매칭 위해 integer 외래 키 옆에 cloudId 외래 키 병기
// 페이지 코드는 그대로 유지 (integer customerId 등 사용). cloudSync에서 cloudId 외래 키만 클라우드로 push.
// pull 시엔 받은 cloudId 외래 키를 로컬 integer로 변환해서 페이지 코드와 호환.
db.version(23).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, &cloudId, date, symptomId, equipmentName, updatedAt, deletedAt',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, &cloudId, name, phone, updatedAt, deletedAt',
  service_jobs: '++id, &cloudId, customerId, customerCloudId, status, receiptDate, visitDate, updatedAt, deletedAt',
  job_photos: '++id, &cloudId, jobId, jobCloudId, updatedAt, deletedAt',
  backups: '++id, createdAt',
  knowhow: '++id, &cloudId, customerId, customerCloudId, category, location, createdAt, updatedAt, deletedAt',
  business_cards: '++id, &cloudId, customerId, customerCloudId, createdAt, updatedAt, deletedAt',
  expenses: '++id, &cloudId, jobId, jobCloudId, customerId, customerCloudId, date, createdAt, updatedAt, deletedAt',
  checklist_results: '++id, &cloudId, templateTitle, createdAt, level, updatedAt, deletedAt',
  equipment_maintenance: '++id, &cloudId, customerId, customerCloudId, nextDueDate, updatedAt, deletedAt',
  user_alarms: '++id, &cloudId, customerId, customerCloudId, jobId, jobCloudId, equipmentId, equipmentCloudId, date, fired, updatedAt, deletedAt',
  voice_recordings: '++id, &cloudId, createdAt, status, updatedAt, deletedAt',
  suppliers: '++id, &cloudId, name, createdAt, updatedAt, deletedAt',
  supplier_transactions: '++id, &cloudId, supplierId, supplierCloudId, date, createdAt, updatedAt, deletedAt',
  share_queue: '++id, recordType, status, createdAt',
  sync_state: '&key',
}).upgrade(async (tx) => {
  // 기존 row의 integer 외래 키 → 해당 row의 cloudId로 변환
  // 1단계: integer id → cloudId 매핑 빌드
  const buildMap = async (table) => {
    const map = new Map()
    await tx.table(table).toCollection().each((r) => {
      if (r.cloudId) map.set(r.id, r.cloudId)
    })
    return map
  }
  const customerMap = await buildMap('customers')
  const jobMap = await buildMap('service_jobs')
  const supplierMap = await buildMap('suppliers')
  const equipMap = await buildMap('equipment_maintenance')

  // 2단계: 외래 키 cloudId 채움
  await tx.table('service_jobs').toCollection().modify((r) => {
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
  })
  await tx.table('job_photos').toCollection().modify((r) => {
    if (!r.jobCloudId && r.jobId != null) r.jobCloudId = jobMap.get(r.jobId) || null
  })
  await tx.table('knowhow').toCollection().modify((r) => {
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
  })
  await tx.table('business_cards').toCollection().modify((r) => {
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
  })
  await tx.table('expenses').toCollection().modify((r) => {
    if (!r.jobCloudId && r.jobId != null) r.jobCloudId = jobMap.get(r.jobId) || null
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
  })
  await tx.table('equipment_maintenance').toCollection().modify((r) => {
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
  })
  await tx.table('user_alarms').toCollection().modify((r) => {
    if (!r.customerCloudId && r.customerId != null) r.customerCloudId = customerMap.get(r.customerId) || null
    if (!r.jobCloudId && r.jobId != null) r.jobCloudId = jobMap.get(r.jobId) || null
    if (!r.equipmentCloudId && r.equipmentId != null) r.equipmentCloudId = equipMap.get(r.equipmentId) || null
  })
  await tx.table('supplier_transactions').toCollection().modify((r) => {
    if (!r.supplierCloudId && r.supplierId != null) r.supplierCloudId = supplierMap.get(r.supplierId) || null
  })
})

// v24: _synced 플래그 도입 — push 영구 누락 결함 차단
// dirty filter가 lastPushAt 외에도 _synced=false인 row 잡아냄. 백업 복원/시계 어긋남에서도 자동 회복.
// 마이그레이션: 기존 row 모두 _synced=false (1회 다시 push 시도). push 성공 후 _synced=true 박힘.
db.version(24).stores({
  symptoms: '++id, category, title',
  checklist_templates: '++id, category, title',
  repair_logs: '++id, &cloudId, date, symptomId, equipmentName, updatedAt, deletedAt, _synced',
  flow_categories: '&id',
  flow_nodes: '&nodeId, categoryId, type',
  customers: '++id, &cloudId, name, phone, updatedAt, deletedAt, _synced',
  service_jobs: '++id, &cloudId, customerId, customerCloudId, status, receiptDate, visitDate, updatedAt, deletedAt, _synced',
  job_photos: '++id, &cloudId, jobId, jobCloudId, updatedAt, deletedAt, _synced',
  backups: '++id, createdAt',
  knowhow: '++id, &cloudId, customerId, customerCloudId, category, location, createdAt, updatedAt, deletedAt, _synced',
  business_cards: '++id, &cloudId, customerId, customerCloudId, createdAt, updatedAt, deletedAt, _synced',
  expenses: '++id, &cloudId, jobId, jobCloudId, customerId, customerCloudId, date, createdAt, updatedAt, deletedAt, _synced',
  checklist_results: '++id, &cloudId, templateTitle, createdAt, level, updatedAt, deletedAt, _synced',
  equipment_maintenance: '++id, &cloudId, customerId, customerCloudId, nextDueDate, updatedAt, deletedAt, _synced',
  user_alarms: '++id, &cloudId, customerId, customerCloudId, jobId, jobCloudId, equipmentId, equipmentCloudId, date, fired, updatedAt, deletedAt, _synced',
  voice_recordings: '++id, &cloudId, createdAt, status, updatedAt, deletedAt, _synced',
  suppliers: '++id, &cloudId, name, createdAt, updatedAt, deletedAt, _synced',
  supplier_transactions: '++id, &cloudId, supplierId, supplierCloudId, date, createdAt, updatedAt, deletedAt, _synced',
  share_queue: '++id, recordType, status, createdAt',
  sync_state: '&key',
}).upgrade(async (tx) => {
  // 모든 동기화 테이블의 row에 _synced=false 박기
  // 다음 sync에서 dirty filter가 _synced=false 잡고 push 1회 — 옛 row 전부 클라우드 도달 보장
  const SYNC_TABLES = [
    'customers', 'service_jobs', 'job_photos', 'repair_logs',
    'knowhow', 'business_cards', 'expenses', 'checklist_results',
    'equipment_maintenance', 'user_alarms', 'voice_recordings',
    'suppliers', 'supplier_transactions',
  ]
  for (const tableName of SYNC_TABLES) {
    await tx.table(tableName).toCollection().modify((row) => {
      row._synced = false
    })
  }
})

// 새 row 생성 시 cloudId / updatedAt + 외래 키 cloudId 자동 부여
// 외래 키 매핑 (integer 외래 키 → 자동으로 cloudId 외래 키 채움)
// cloudSync에서도 import해서 사용함
export const FK_MAP = {
  service_jobs:           [['customerId', 'customerCloudId', 'customers']],
  job_photos:             [['jobId', 'jobCloudId', 'service_jobs']],
  knowhow:                [['customerId', 'customerCloudId', 'customers']],
  business_cards:         [['customerId', 'customerCloudId', 'customers']],
  expenses:               [['jobId', 'jobCloudId', 'service_jobs'], ['customerId', 'customerCloudId', 'customers']],
  equipment_maintenance:  [['customerId', 'customerCloudId', 'customers']],
  user_alarms:            [['customerId', 'customerCloudId', 'customers'], ['jobId', 'jobCloudId', 'service_jobs'], ['equipmentId', 'equipmentCloudId', 'equipment_maintenance']],
  supplier_transactions:  [['supplierId', 'supplierCloudId', 'suppliers']],
}

const SYNC_HOOKS_TABLES = [
  'customers', 'service_jobs', 'job_photos',
  'knowhow', 'business_cards', 'expenses', 'checklist_results',
  'equipment_maintenance', 'user_alarms', 'voice_recordings',
  'suppliers', 'supplier_transactions',
]

// (sanitize 함수 제거 — 진짜 원인 찾기 전엔 미봉책 안 둠)

// hook은 동기 단순 처리만 — 외래 키 cloudId 채움은 페이지 코드가 명시적으로 책임짐
// (이전: 비동기 Promise.all 반환으로 인한 IDB add 충돌 의심 → 단순화)
//
// _synced 처리 규칙:
//  - creating: 새 row는 항상 _synced=false (다음 sync에서 push 대상)
//  - updating: 변경 시 _synced=false 자동 박기 — 단 modifications에 _synced가 명시되면 그 값 그대로 (push 성공 후 cloudSync가 true로 박는 케이스)
for (const tableName of SYNC_HOOKS_TABLES) {
  db.table(tableName).hook('creating', (_primKey, obj) => {
    if (!obj.cloudId) obj.cloudId = crypto.randomUUID()
    if (!obj.updatedAt) obj.updatedAt = new Date().toISOString()
    if (!('_synced' in obj)) obj._synced = false
  })
  db.table(tableName).hook('updating', (modifications, _primKey, _obj) => {
    if (!modifications || typeof modifications !== 'object') return
    const next = { ...modifications }
    // updatedAt이 명시되지 않았으면 자동 갱신 (변경 발생 표시)
    if (!('updatedAt' in next)) next.updatedAt = new Date().toISOString()
    // _synced가 명시되지 않았으면 false (변경 발생 = 다음 sync에서 push 대상)
    // 명시된 경우는 그대로 (cloudSync가 push 성공 후 true 박는 케이스 보존)
    if (!('_synced' in next)) next._synced = false
    return next
  })
}

/* global __DATA_HASH__ */
const DATA_HASH = typeof __DATA_HASH__ !== 'undefined' ? __DATA_HASH__ : ''

export async function seedIfEmpty() {
  const storedHash = localStorage.getItem('rfg_data_hash') || ''

  if (storedHash === DATA_HASH && DATA_HASH) return

  // 시스템 데이터 갱신 (bulkPut = 있으면 덮어쓰기, 없으면 추가)
  const { symptoms } = await import('./data/symptoms.json')
  await db.symptoms.bulkPut(symptoms)

  const { templates } = await import('./data/checklist.json')
  await db.checklist_templates.bulkPut(templates)

  const { categories, nodes } = await import('./data/flowchart.json')
  await db.flow_categories.bulkPut(categories)

  // BFS from each category startNode to assign categoryId
  const nodeRecords = []
  const processed = new Set()

  for (const cat of categories) {
    const queue = [cat.startNode]
    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (!nodeId || processed.has(nodeId) || !nodes[nodeId]) continue
      processed.add(nodeId)
      const node = nodes[nodeId]
      nodeRecords.push({
        ...node,
        nodeId,
        categoryId: cat.id,
        type: node.type ?? 'question',
      })
      if (node.yes) queue.push(node.yes)
      if (node.no) queue.push(node.no)
      if (node.choices) node.choices.forEach((c) => { if (c.next) queue.push(c.next) })
    }
  }

  await db.flow_nodes.bulkPut(nodeRecords)

  localStorage.setItem('rfg_data_hash', DATA_HASH)
}
