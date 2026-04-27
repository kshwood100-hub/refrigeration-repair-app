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
