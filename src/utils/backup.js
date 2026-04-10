import { db } from '../db'

const MAX_BACKUPS = 3

// 데이터 압축
async function compress(text) {
  const stream = new Blob([text]).stream()
  const compressed = stream.pipeThrough(new CompressionStream('gzip'))
  return new Response(compressed).blob()
}

// 데이터 해제
async function decompress(blob) {
  const stream = blob.stream()
  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'))
  return new Response(decompressed).text()
}

// 백업 생성 (롤링 3개 유지)
export async function createBackup() {
  const [jobs, customers, photos] = await Promise.all([
    db.service_jobs.toArray(),
    db.customers.toArray(),
    db.job_photos.toArray(),
  ])

  const payload = JSON.stringify({ jobs, customers, photos, exportedAt: new Date().toISOString() })
  const blob = await compress(payload)
  const size = blob.size

  await db.backups.add({
    createdAt: new Date().toISOString(),
    size,
    blob,
  })

  // 3개 초과 시 오래된 것 삭제
  const all = await db.backups.orderBy('createdAt').toArray()
  if (all.length > MAX_BACKUPS) {
    const toDelete = all.slice(0, all.length - MAX_BACKUPS)
    await db.backups.bulkDelete(toDelete.map((b) => b.id))
  }
}

// 백업 목록 조회
export async function listBackups() {
  return db.backups.orderBy('createdAt').reverse().toArray()
}

// 백업 파일로 내려받기
export async function downloadBackup(backup) {
  const url = URL.createObjectURL(backup.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `냉동기수리_백업_${backup.createdAt.slice(0, 10)}.rfg`
  a.click()
  URL.revokeObjectURL(url)
}

// 백업 복원
export async function restoreBackup(backup) {
  const text = await decompress(backup.blob)
  const { jobs, customers, photos } = JSON.parse(text)

  await db.transaction('rw', db.customers, db.service_jobs, db.job_photos, async () => {
    await db.customers.clear()
    await db.service_jobs.clear()
    await db.job_photos.clear()
    if (customers.length) await db.customers.bulkAdd(customers)
    if (jobs.length)      await db.service_jobs.bulkAdd(jobs)
    if (photos.length)    await db.job_photos.bulkAdd(photos)
  })
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 전체 데이터 JSON 파일로 내보내기 (공유 or 다운로드)
export async function exportAllData() {
  const [customers, service_jobs, job_photos, expenses, knowhow, business_cards] = await Promise.all([
    db.customers.toArray(),
    db.service_jobs.toArray(),
    db.job_photos.toArray(),
    db.expenses.toArray(),
    db.knowhow.toArray(),
    db.business_cards.toArray(),
  ])

  const payload = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    customers,
    service_jobs,
    job_photos,
    expenses,
    knowhow,
    business_cards,
  }, null, 2)

  const fileName = `냉동기수리_데이터_${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([payload], { type: 'application/json' })
  const file = new File([blob], fileName, { type: 'application/json' })

  // 모바일: 기기 공유창 (메일, 드라이브, 카카오 등)
  if (navigator.share) {
    try {
      await navigator.share({
        title: '냉동기수리 데이터 백업',
        text: `백업 날짜: ${new Date().toISOString().slice(0, 10)}`,
        files: [file],
      })
      return
    } catch {
      // 공유 취소 또는 미지원 → 파일 다운로드로 전환
    }
  }

  // 폴백: 파일 다운로드
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

// JSON 파일에서 전체 데이터 가져오기
export async function importAllData(file) {
  const text = await file.text()
  const data = JSON.parse(text)

  const customers      = data.customers      ?? []
  const service_jobs   = data.service_jobs   ?? []
  const job_photos     = data.job_photos     ?? []
  const expenses       = data.expenses       ?? []
  const knowhow        = data.knowhow        ?? []
  const business_cards = data.business_cards ?? []

  await db.transaction('rw',
    db.customers, db.service_jobs, db.job_photos, db.expenses, db.knowhow, db.business_cards,
    async () => {
      await db.customers.clear()
      await db.service_jobs.clear()
      await db.job_photos.clear()
      await db.expenses.clear()
      await db.knowhow.clear()
      await db.business_cards.clear()

      if (customers.length)      await db.customers.bulkAdd(customers)
      if (service_jobs.length)   await db.service_jobs.bulkAdd(service_jobs)
      if (job_photos.length)     await db.job_photos.bulkAdd(job_photos)
      if (expenses.length)       await db.expenses.bulkAdd(expenses)
      if (knowhow.length)        await db.knowhow.bulkAdd(knowhow)
      if (business_cards.length) await db.business_cards.bulkAdd(business_cards)
    }
  )
}
