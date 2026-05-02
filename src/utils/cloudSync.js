// 클라우드 동기화 엔진 (Dexie ↔ Firestore)
// 정책: 오프라인 우선, last-write-wins(updatedAt 비교), tombstone(deletedAt)으로 삭제 전파.
// 사용자 데이터: users/{email}/{collection}/{cloudId}
// Firestore doc ID = 로컬 row의 cloudId (UUID, 기기 간 동일 보장)

import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { ref as sref, uploadString, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { firestore, storage, auth } from '../firebase'
import { db, FK_MAP } from '../db'

// sync 대상 컬렉션 목록 (db.js의 SYNC_HOOKS_TABLES와 일치)
export const SYNC_COLLECTIONS = [
  'customers', 'service_jobs', 'job_photos',
  'knowhow', 'business_cards', 'expenses', 'checklist_results',
  'equipment_maintenance', 'user_alarms', 'voice_recordings',
  'suppliers', 'supplier_transactions',
]

// tombstone 보관 기간 (90일) — 그 후 자동 삭제
const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

function currentEmail() {
  return auth.currentUser?.email?.toLowerCase()?.trim() || null
}

// 마지막 sync 타임스탬프 (해당 컬렉션 기준)
async function getLastPullAt(collectionName) {
  const row = await db.sync_state.get(`lastPull:${collectionName}`)
  return row?.value || 0
}

async function setLastPullAt(collectionName, ts) {
  await db.sync_state.put({ key: `lastPull:${collectionName}`, value: ts })
}

// === Push: 로컬 변경 → Firestore ===
// 마지막 push 이후 변경된 로컬 row를 Firestore에 올림.
// 신규/수정/삭제(tombstone) 모두 처리.
export async function pushCollection(collectionName) {
  const email = currentEmail()
  if (!email) return { pushed: 0, skipped: 'no-auth' }

  const lastPushAt = (await db.sync_state.get(`lastPush:${collectionName}`))?.value || 0
  const rows = await db.table(collectionName).toArray()
  // dirty: cloudId 있고, _synced=false이거나 updatedAt > lastPushAt
  // _synced=false 잡아내는 게 핵심 — lastPushAt 누락 결함 차단 (백업 복원/시계 어긋남 회복)
  const dirty = rows.filter((r) => {
    if (!r.cloudId) return false
    if (r._synced === false) return true
    const updated = new Date(r.updatedAt || 0).getTime()
    return updated > lastPushAt
  })

  if (dirty.length === 0) return { pushed: 0 }

  let maxUpdated = lastPushAt
  // 미디어 컬렉션은 Storage 분리 (큰 dataUrl/blob을 Firestore에 안 올림)
  const isMedia = ['job_photos', 'business_cards', 'voice_recordings'].includes(collectionName)
  // Firestore writeBatch는 500개 제한 — 안전하게 200개씩 청크
  const CHUNK = 200
  for (let i = 0; i < dirty.length; i += CHUNK) {
    const chunk = dirty.slice(i, i + CHUNK)
    // 미디어인 경우 Storage 업로드를 먼저 (병렬)
    const prepared = isMedia
      ? await Promise.all(chunk.map((row) => externalizeMedia(collectionName, row, email)))
      : chunk
    const batch = writeBatch(firestore)
    const fks = FK_MAP[collectionName] || []

    // 외래 키 cloudId 동적 lookup (chunk 단위 bulkGet으로 효율화)
    // 페이지 코드는 integer 외래 키만 set하므로 push 직전에 cloudId를 채워서 보냄.
    // 못 찾으면 null — 다음 sync 또는 relinkOrphanForeignKeys에서 재시도.
    const fkLookup = {} // intKey → { intId → cloudId }
    if (fks.length > 0) {
      for (const [intKey, , refTable] of fks) {
        const ids = [...new Set(chunk.map((r) => r[intKey]).filter((v) => v != null))]
        if (ids.length === 0) { fkLookup[intKey] = {}; continue }
        const refs = await db.table(refTable).bulkGet(ids)
        const map = {}
        ids.forEach((id, idx) => {
          if (refs[idx]?.cloudId) map[id] = refs[idx].cloudId
        })
        fkLookup[intKey] = map
      }
    }

    for (let k = 0; k < chunk.length; k++) {
      const original = chunk[k]
      const cleaned = prepared[k]
      const ref = doc(firestore, 'users', email, collectionName, original.cloudId)
      // 로컬 integer id 및 모든 integer 외래 키 제거 (다른 기기에서 의미 없음)
      // *CloudId 외래 키만 남김 → 모든 기기가 같은 값으로 매칭
      const { id: _localId, ...payload } = cleaned
      // 외래 키 cloudId 채움 (이미 있으면 유지, 없으면 lookup 결과로)
      for (const [intKey, cloudKey] of fks) {
        if (!payload[cloudKey] && payload[intKey] != null) {
          const found = fkLookup[intKey]?.[payload[intKey]]
          if (found) payload[cloudKey] = found
        }
        delete payload[intKey]
      }
      batch.set(ref, {
        ...payload,
        _serverUpdatedAt: serverTimestamp(),
      }, { merge: false })
      const updated = new Date(original.updatedAt || 0).getTime()
      if (updated > maxUpdated) maxUpdated = updated
    }
    await batch.commit()
    // 청크 commit 성공 후 _synced=true 박음.
    // race 안전: push 시점 updatedAt과 현재 IDB의 updatedAt 일치할 때만 박음 (중간 변경 보존)
    // updatedAt도 명시적으로 같이 전달 → updating hook의 자동 갱신 우회
    for (const original of chunk) {
      try {
        const current = await db.table(collectionName).get(original.id)
        if (current && current.updatedAt === original.updatedAt) {
          await db.table(collectionName).update(original.id, {
            _synced: true,
            updatedAt: original.updatedAt,
          })
        }
      } catch (e) {
        console.warn(`[push] mark _synced failed for ${collectionName}/${original.id}:`, e?.message)
      }
    }
  }

  await db.sync_state.put({ key: `lastPush:${collectionName}`, value: maxUpdated })
  return { pushed: dirty.length }
}

// === Pull: Firestore → 로컬 ===
// 마지막 pull 이후 Firestore에서 갱신된 doc만 가져옴.
// updatedAt > 로컬.updatedAt이면 적용, 아니면 무시 (last-write-wins).
export async function pullCollection(collectionName) {
  const email = currentEmail()
  if (!email) return { pulled: 0, skipped: 'no-auth' }

  const lastPullAt = await getLastPullAt(collectionName)
  const colRef = collection(firestore, 'users', email, collectionName)

  // updatedAt 기준으로 변경된 것만 (인덱스 자동, ISO string lexicographical 비교)
  let q = colRef
  if (lastPullAt) {
    const sinceIso = new Date(lastPullAt).toISOString()
    q = query(colRef, where('updatedAt', '>', sinceIso))
  }
  const snap = await getDocs(q)

  // 외래 키 cloudId → 로컬 integer 변환 (페이지 코드는 integer 외래 키로 query하므로)
  const fks = FK_MAP[collectionName] || []
  async function resolveLocalForeignKeys(payload) {
    for (const [intKey, cloudKey, refTable] of fks) {
      if (payload[cloudKey]) {
        const refRow = await db.table(refTable).where('cloudId').equals(payload[cloudKey]).first()
        payload[intKey] = refRow?.id ?? null
      } else {
        payload[intKey] = null
      }
    }
  }

  let pulled = 0
  let maxUpdated = lastPullAt
  for (const snapDoc of snap.docs) {
    const remote = snapDoc.data()
    const cloudId = snapDoc.id
    const remoteUpdatedMs = new Date(remote.updatedAt || 0).getTime()

    const local = await db.table(collectionName).where('cloudId').equals(cloudId).first()
    const localUpdatedMs = local ? new Date(local.updatedAt || 0).getTime() : 0

    if (remoteUpdatedMs > localUpdatedMs) {
      const { _serverUpdatedAt, ...clean } = remote
      // 외래 키 cloudId → 로컬 integer 매핑 (해당 기기 기준)
      await resolveLocalForeignKeys(clean)
      // 클라우드에서 받은 doc은 클라우드와 동일 = _synced=true 명시 (push 대상 아님)
      clean._synced = true
      if (local) {
        // 로컬 integer id 유지하면서 다른 필드 갱신
        await db.table(collectionName).update(local.id, clean)
      } else {
        // 신규 → 로컬에 추가 (id는 Dexie auto)
        await db.table(collectionName).add(clean)
      }
      pulled++
    }
    if (remoteUpdatedMs > maxUpdated) maxUpdated = remoteUpdatedMs
  }

  if (maxUpdated > lastPullAt) await setLastPullAt(collectionName, maxUpdated)
  return { pulled }
}

// === Tombstone: 로컬 삭제 시 호출 (실제 row 삭제 대신 deletedAt 마크) ===
// 단일 row 삭제 (locId = Dexie integer id)
export async function softDelete(collectionName, locId) {
  if (locId == null) return
  const ts = new Date().toISOString()
  await db.table(collectionName).update(locId, {
    deletedAt: ts,
    updatedAt: ts,
  })
}

// 다수 row 삭제 (Dexie WhereClause)
// 사용 예: softDeleteWhere('service_jobs', (t) => t.where('customerId').equals(cid))
export async function softDeleteWhere(collectionName, whereFn) {
  const ts = new Date().toISOString()
  const rows = await whereFn(db.table(collectionName)).toArray()
  if (rows.length === 0) return 0
  await db.table(collectionName).bulkPut(
    rows.map((r) => ({ ...r, deletedAt: ts, updatedAt: ts }))
  )
  return rows.length
}

// 오래된 tombstone 완전 삭제 — 로컬 + Firestore + Storage 모두 (90일 지난 것)
// 다른 기기가 그 사이 sync해서 deletedAt을 받아갔을 거라는 가정
export async function purgeTombstones(collectionName) {
  const email = currentEmail()
  const cutoff = new Date(Date.now() - TOMBSTONE_RETENTION_MS).toISOString()
  const stale = await db.table(collectionName)
    .where('deletedAt').belowOrEqual(cutoff)
    .toArray()

  if (stale.length === 0) return { purged: 0 }

  const isMedia = ['job_photos', 'business_cards', 'voice_recordings'].includes(collectionName)
  let purged = 0

  for (const row of stale) {
    try {
      // 1) Storage 파일 삭제 (미디어 컬렉션 + storagePath 있을 때만)
      if (email && isMedia && row.storagePath) {
        try {
          await deleteObject(sref(storage, row.storagePath))
        } catch (e) {
          // 이미 없거나 권한 문제 — 로그만 남기고 계속
          if (e?.code !== 'storage/object-not-found') {
            console.warn(`[purge] storage delete failed:`, row.storagePath, e?.message)
          }
        }
      }
      // 2) Firestore doc 삭제 (cloudId + email 있을 때만)
      if (email && row.cloudId) {
        try {
          await deleteDoc(doc(firestore, 'users', email, collectionName, row.cloudId))
        } catch (e) {
          console.warn(`[purge] firestore delete failed:`, row.cloudId, e?.message)
        }
      }
      // 3) 로컬 삭제
      await db.table(collectionName).delete(row.id)
      purged++
    } catch (e) {
      console.warn(`[purge] ${collectionName}/${row.id} failed:`, e?.message)
    }
  }
  return { purged }
}

// 환불·탈퇴 사용자 데이터 즉시 삭제 (관리자 호출용 — 약관 "철회권 즉시" 정합성)
// 사용자가 직접 호출할 일은 없고, 출시 후 admin tool에서 사용 예정
export async function purgeAllUserData() {
  const email = currentEmail()
  if (!email) return { ok: false, reason: 'no-auth' }

  for (const c of SYNC_COLLECTIONS) {
    const rows = await db.table(c).toArray()
    const isMedia = ['job_photos', 'business_cards', 'voice_recordings'].includes(c)
    for (const row of rows) {
      if (isMedia && row.storagePath) {
        try { await deleteObject(sref(storage, row.storagePath)) } catch (_) {}
      }
      if (row.cloudId) {
        try { await deleteDoc(doc(firestore, 'users', email, c, row.cloudId)) } catch (_) {}
      }
    }
    await db.table(c).clear()
  }
  return { ok: true }
}

// useLiveQuery에서 활성 row만 필터링하는 헬퍼
// 사용: const rows = useLiveQuery(() => liveActive('customers'), [])
// 또는: useLiveQuery(() => liveActive('customers', (t) => t.orderBy('name')), [])
export function liveActive(table, refine) {
  const t = db.table(table)
  const base = refine ? refine(t) : t
  return base.filter((r) => !r.deletedAt).toArray()
}

// === Cascade 헬퍼 ===
// 거래처 삭제: 의존하는 jobs/expenses/photos/cards/maintenance/alarms/knowhow 모두 soft delete
export async function softDeleteCustomerCascade(localCustomerId) {
  const cid = localCustomerId
  const jobs = await db.service_jobs.where('customerId').equals(cid).toArray()
  const jobIds = jobs.map((j) => j.id)
  const ts = new Date().toISOString()

  if (jobIds.length) {
    await softDeleteWhere('job_photos', (t) => t.where('jobId').anyOf(jobIds))
    await softDeleteWhere('expenses', (t) => t.where('jobId').anyOf(jobIds))
    const jobAlarms = await db.user_alarms.filter((a) => jobIds.includes(a.jobId)).toArray()
    if (jobAlarms.length) {
      await db.user_alarms.bulkPut(jobAlarms.map((a) => ({ ...a, deletedAt: ts, updatedAt: ts })))
    }
  }

  // customer 직접 의존
  const cExpenses = await db.expenses.filter((e) => e.customerId === cid).toArray()
  if (cExpenses.length) {
    await db.expenses.bulkPut(cExpenses.map((e) => ({ ...e, deletedAt: ts, updatedAt: ts })))
  }
  // customerId 직접 등록된 알람도 cascade
  const directAlarms = await db.user_alarms.filter((a) => a.customerId === cid).toArray()
  if (directAlarms.length) {
    await db.user_alarms.bulkPut(directAlarms.map((a) => ({ ...a, deletedAt: ts, updatedAt: ts })))
  }
  await softDeleteWhere('service_jobs', (t) => t.where('customerId').equals(cid))
  await softDeleteWhere('business_cards', (t) => t.where('customerId').equals(cid))
  await softDeleteWhere('equipment_maintenance', (t) => t.where('customerId').equals(cid))
  await softDeleteWhere('knowhow', (t) => t.where('customerId').equals(cid))
  await softDelete('customers', cid)
}

// AS 작업 삭제: photos/expenses/alarms cascade
export async function softDeleteJobCascade(localJobId) {
  const jid = localJobId
  const ts = new Date().toISOString()
  await softDeleteWhere('job_photos', (t) => t.where('jobId').equals(jid))
  await softDeleteWhere('expenses', (t) => t.where('jobId').equals(jid))
  const alarms = await db.user_alarms.filter((a) => a.jobId === jid).toArray()
  if (alarms.length) {
    await db.user_alarms.bulkPut(alarms.map((a) => ({ ...a, deletedAt: ts, updatedAt: ts })))
  }
  await softDelete('service_jobs', jid)
}

// 거래처/공급업체 삭제: supplier_transactions cascade
export async function softDeleteSupplierCascade(localSupplierId) {
  const sid = localSupplierId
  await softDeleteWhere('supplier_transactions', (t) => t.where('supplierId').equals(sid))
  await softDelete('suppliers', sid)
}

// === Storage 업로드/다운로드 ===
// dataUrl(base64) → Storage path 업로드 후 path 반환
async function uploadDataUrlToStorage(path, dataUrl) {
  const r = sref(storage, path)
  await uploadString(r, dataUrl, 'data_url')
  return path
}

// Blob → Storage path 업로드
async function uploadBlobToStorage(path, blob) {
  const r = sref(storage, path)
  await uploadBytes(r, blob)
  return path
}

// 로컬 storagePath → 다운로드 URL (캐시는 브라우저가 처리)
const _urlCache = new Map()
export async function getMediaUrl(storagePath) {
  if (!storagePath) return null
  if (_urlCache.has(storagePath)) return _urlCache.get(storagePath)
  try {
    const r = sref(storage, storagePath)
    const url = await getDownloadURL(r)
    _urlCache.set(storagePath, url)
    return url
  } catch (e) {
    console.warn('[storage] download URL failed:', storagePath, e?.message)
    return null
  }
}

// 컬렉션별로 미디어 필드를 Storage로 분리
// 반환: 정제된 row (push에 사용 가능)
async function externalizeMedia(collectionName, row, email) {
  const out = { ...row }
  const cloudId = row.cloudId
  if (!cloudId) return out

  // 주: storagePath 박을 때 updatedAt 명시 → hook 자동 갱신 우회 (push 후 race-safe 비교 보존)
  if (collectionName === 'job_photos' && row.dataUrl && !row.storagePath) {
    const path = `users/${email}/photos/${cloudId}.jpg`
    await uploadDataUrlToStorage(path, row.dataUrl)
    out.storagePath = path
    delete out.dataUrl
    // 로컬에도 storagePath 저장(다음 sync부터 안 올림). dataUrl은 로컬에 유지(빠른 표시).
    await db.job_photos.update(row.id, { storagePath: path, updatedAt: row.updatedAt })
  } else if (collectionName === 'business_cards' && row.dataUrl && !row.storagePath) {
    const path = `users/${email}/cards/${cloudId}.jpg`
    await uploadDataUrlToStorage(path, row.dataUrl)
    out.storagePath = path
    delete out.dataUrl
    await db.business_cards.update(row.id, { storagePath: path, updatedAt: row.updatedAt })
  } else if (collectionName === 'voice_recordings' && row.blob && !row.storagePath) {
    const ext = (row.mimeType || '').includes('mp4') ? 'mp4'
              : (row.mimeType || '').includes('ogg') ? 'ogg'
              : 'webm'
    const path = `users/${email}/voice/${cloudId}.${ext}`
    await uploadBlobToStorage(path, row.blob)
    out.storagePath = path
    delete out.blob
    await db.voice_recordings.update(row.id, { storagePath: path, updatedAt: row.updatedAt })
  } else {
    // 미디어 컬렉션이라도 이미 storagePath 있으면 dataUrl/blob은 push에서 제외
    delete out.dataUrl
    delete out.blob
  }
  return out
}

// 고아 외래 키 재연결 — sync 도중 ref가 아직 도착 안 해서 integer 외래 키가 null인 row를 재시도
export async function relinkOrphanForeignKeys() {
  for (const collectionName of SYNC_COLLECTIONS) {
    const fks = FK_MAP[collectionName] || []
    if (!fks.length) continue
    for (const [intKey, cloudKey, refTable] of fks) {
      const orphans = await db.table(collectionName)
        .filter((r) => r[cloudKey] && (r[intKey] == null))
        .toArray()
      for (const r of orphans) {
        const refRow = await db.table(refTable).where('cloudId').equals(r[cloudKey]).first()
        if (refRow?.id != null) {
          await db.table(collectionName).update(r.id, { [intKey]: refRow.id })
        }
      }
    }
  }
}

// === 전체 sync (모든 컬렉션 push + pull) ===
export async function syncAll() {
  const email = currentEmail()
  if (!email) return { ok: false, reason: 'no-auth' }

  const results = {}
  for (const c of SYNC_COLLECTIONS) {
    try {
      const pushed = await pushCollection(c)
      const pulled = await pullCollection(c)
      results[c] = { pushed: pushed.pushed, pulled: pulled.pulled }
    } catch (e) {
      console.warn(`[sync] ${c} failed:`, e?.message)
      results[c] = { error: e?.message }
    }
  }

  // 고아 외래 키 재연결 (parent ref가 늦게 도착한 경우 처리)
  try {
    await relinkOrphanForeignKeys()
  } catch (e) {
    console.warn('[sync] relink failed:', e?.message)
  }

  // 하루 1회 tombstone 정리 (90일 지난 deletedAt row 완전 삭제)
  try {
    const last = (await db.sync_state.get('lastPurgeAt'))?.value || 0
    if (Date.now() - last > 24 * 60 * 60 * 1000) {
      for (const c of SYNC_COLLECTIONS) {
        try { await purgeTombstones(c) } catch (e) {
          console.warn(`[purge] ${c} failed:`, e?.message)
        }
      }
      await db.sync_state.put({ key: 'lastPurgeAt', value: Date.now() })
    }
  } catch (e) {
    console.warn('[purge] cycle failed:', e?.message)
  }

  return { ok: true, results }
}

// 트리거: 앱 시작, visibilitychange visible, 5분 인터벌
// 5분: Firestore 무료 한도 여유 + 모바일 활성 시간 기준 사용자당 ~2K read/day로 안전
let syncInFlight = false
let syncIntervalId = null

export async function safeSyncAll() {
  if (syncInFlight) return
  syncInFlight = true
  try {
    await syncAll()
  } finally {
    syncInFlight = false
  }
}

export function startAutoSync() {
  if (syncIntervalId) return
  // 즉시 한 번
  safeSyncAll()
  // 5분 인터벌 (이전 30초 → 비용 1/10로 절감)
  syncIntervalId = setInterval(safeSyncAll, 5 * 60 * 1000)
  // visibility 변경 시 즉시 sync (포그라운드 복귀 시 최신화)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') safeSyncAll()
  })
}

export function stopAutoSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId)
    syncIntervalId = null
  }
}
