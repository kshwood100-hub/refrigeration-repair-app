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
