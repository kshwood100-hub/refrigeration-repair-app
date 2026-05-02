import { db } from '../db'
import i18n from '../i18n'
import { showToast } from './toast'
import { todayLocal } from './date'

const t = (key, opts) => i18n.t(key, opts)

const MAX_BACKUPS = 3

// 시스템 테이블 — JSON에서 자동 시드되므로 백업 불필요
const SYSTEM_TABLES = new Set([
  'symptoms', 'checklist_templates', 'flow_categories', 'flow_nodes', 'backups',
])

// QR 용량 제약으로 제외할 테이블 (사진은 용량 큼)
const QR_EXCLUDED_TABLES = new Set(['job_photos'])

// 구버전 백업 키 호환 (이전 포맷 복원용)
const LEGACY_KEY_ALIAS = {
  service_jobs: 'jobs',
  job_photos: 'photos',
}

function getUserTables() {
  return db.tables.filter((tb) => !SYSTEM_TABLES.has(tb.name))
}

function getQRTables() {
  return db.tables.filter((tb) => !SYSTEM_TABLES.has(tb.name) && !QR_EXCLUDED_TABLES.has(tb.name))
}

async function collectData(tables) {
  const data = {}
  await Promise.all(tables.map(async (tb) => {
    data[tb.name] = await tb.toArray()
  }))
  return data
}

async function restoreTables(tables, data) {
  await db.transaction('rw', tables, async () => {
    for (const tb of tables) {
      await tb.clear()
      const rows = data[tb.name] ?? data[LEGACY_KEY_ALIAS[tb.name]] ?? []
      if (rows.length) await tb.bulkAdd(rows)
    }
  })
}

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

// 백업 생성 (롤링 3개 유지) — 모든 사용자 테이블 자동 포함
export async function createBackup() {
  const data = await collectData(getUserTables())
  const payload = JSON.stringify({ ...data, exportedAt: new Date().toISOString() })
  const blob = await compress(payload)

  await db.backups.add({
    createdAt: new Date().toISOString(),
    size: blob.size,
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

// 자동 백업 — 마지막 백업이 24시간 지났으면 새로 생성
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000
export async function autoBackupIfDue() {
  try {
    const last = await db.backups.orderBy('createdAt').reverse().first()
    if (last && Date.now() - new Date(last.createdAt).getTime() < AUTO_BACKUP_INTERVAL_MS) return
    await createBackup()
  } catch (e) {
    console.warn('autoBackup failed:', e)
  }
}

// 백업 파일로 내려받기
export async function downloadBackup(backup) {
  const url = URL.createObjectURL(backup.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rpro_backup_${backup.createdAt.slice(0, 10)}.rfg`
  a.click()
  URL.revokeObjectURL(url)
}

// 백업 복원
export async function restoreBackup(backup) {
  const text = await decompress(backup.blob)
  const data = JSON.parse(text)
  await restoreTables(getUserTables(), data)
}

const CHUNK_SIZE = 2500 // chars per QR code (QR byte mode limit ~2953)

// QR 내보내기용 청크 생성 (사진 제외)
export async function exportQRChunks() {
  const data = await collectData(getQRTables())
  const payload = JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    ...data,
  })

  const blob = await compress(payload)
  const buffer = await blob.arrayBuffer()
  const uint8 = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < uint8.length; i += 8192) {
    binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + 8192, uint8.length)))
  }
  const base64 = btoa(binary)

  const n = Math.ceil(base64.length / CHUNK_SIZE)
  return Array.from({ length: n }, (_, i) => JSON.stringify({
    i, n, d: base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
  }))
}

// QR 스캔 청크 조합 후 복원
export async function importQRChunks(chunkMap, total) {
  const base64 = Array.from({ length: total }, (_, i) => JSON.parse(chunkMap[i]).d).join('')
  const binary = atob(base64)
  const uint8 = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i)
  const text = await decompress(new Blob([uint8]))
  const data = JSON.parse(text)
  await restoreTables(getQRTables(), data)
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 전체 데이터 JSON 파일로 내보내기 (공유 or 다운로드)
export async function exportAllData() {
  const data = await collectData(getUserTables())
  const payload = JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    ...data,
  }, null, 2)

  const fileName = `rpro_backup_${todayLocal()}.json`
  const blob = new Blob([payload], { type: 'text/plain' })
  const file = new File([blob], fileName, { type: 'text/plain' })

  // 모바일: 기기 공유창 (메일, 드라이브, 카카오 등)
  if (navigator.share) {
    try {
      await navigator.share({
        title: t('backup.shareTitle'),
        text: t('backup.shareText', { date: todayLocal() }),
        files: [file],
      })
      return
    } catch {
      // 공유 취소 또는 미지원 → 파일 다운로드로 전환
    }
  }

  // 파일 다운로드
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  setTimeout(() => {
    showToast(t('backup.fileSaved'))
  }, 500)
}

// JSON 파일에서 전체 데이터 가져오기
export async function importAllData(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  await restoreTables(getUserTables(), data)
}
