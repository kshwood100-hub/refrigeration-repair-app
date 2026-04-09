import Dexie from 'dexie'

export const db = new Dexie('RefrigerationRepairDB')

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

export async function seedIfEmpty() {
  const [symptomsCount, checklistCount, flowCatCount] = await Promise.all([
    db.symptoms.count(),
    db.checklist_templates.count(),
    db.flow_categories.count(),
  ])

  if (symptomsCount === 0) {
    const { symptoms } = await import('./data/symptoms.json')
    await db.symptoms.bulkAdd(symptoms)
  }

  if (checklistCount === 0) {
    const { templates } = await import('./data/checklist.json')
    await db.checklist_templates.bulkAdd(templates)
  }

  if (flowCatCount === 0) {
    const { categories, nodes } = await import('./data/flowchart.json')
    await db.flow_categories.bulkAdd(categories)

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

    await db.flow_nodes.bulkAdd(nodeRecords)
  }
}
