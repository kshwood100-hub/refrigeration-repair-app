// 설비 기록 공유 모델 — 큐 헬퍼 (스캐폴드)
// v2 가동 시 service_jobs/knowhow 저장 시점에 enqueue 호출.
// 현재 어디서도 호출하지 않음. 실제 업로드는 v2에서 Cloud Function 연결.

import { db } from '../db'
import { loadSettings } from './settings'
import { anonymizeServiceJob, anonymizeKnowhow } from './anonymize'

const TYPE_TO_ANONYMIZE = {
  service_job: anonymizeServiceJob,
  knowhow: anonymizeKnowhow,
}

// v2에서 호출: 사용자가 동의한 경우에만 큐에 적재
export async function enqueueShare(recordType, record) {
  const { shareConsent } = loadSettings()
  if (!shareConsent) return null

  const anonymizer = TYPE_TO_ANONYMIZE[recordType]
  if (!anonymizer) return null

  const payload = anonymizer(record)
  if (!payload) return null

  return db.share_queue.add({
    recordType,
    recordId: record.id ?? null,
    payload,
    status: 'pending',
    createdAt: Date.now(),
  })
}

// v2에서 호출: 백그라운드 워커가 pending → sent 처리
export async function listPending(limit = 50) {
  return db.share_queue
    .where('status').equals('pending')
    .limit(limit)
    .toArray()
}

export async function markSent(id) {
  return db.share_queue.update(id, { status: 'sent', sentAt: Date.now() })
}

export async function markFailed(id, reason) {
  return db.share_queue.update(id, { status: 'failed', failedAt: Date.now(), reason })
}
