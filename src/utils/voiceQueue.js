// 음성 녹음 큐 관리 유틸
// DB 저장, 상태 변경, 자동 처리(Whisper 변환 → AI 분류 → 노하우 저장)

import { db } from '../db'
import { apiFetch } from './apiClient'
import { softDelete } from './cloudSync'

// 상태: pending(대기) → transcribing(변환중) → transcribed(변환완료)
//       → classifying(분류중) → done(완료) → failed(실패)

// jobId/customerId — 어디에 속한 녹음인지 (옵션). AS 진행 중 녹음이면 jobId, 거래처 음성 메모면 customerId.
export async function saveRecording({ blob, mimeType, durationSec, jobId, customerId }) {
  return await db.voice_recordings.add({
    blob,
    mimeType,
    durationSec,
    jobId: jobId ?? null,
    customerId: customerId ?? null,
    createdAt: Date.now(),
    status: 'pending',
    transcript: null,
    knowhowId: null,
    errorMsg: null,
  })
}

// AS의 모든 녹음 transcript 합쳐서 AI 1회 호출 → 작업 폼 필드(증상/원인/조치 등) 자동 박음.
// 완료처리 시 호출되며, 음성이 없으면 그냥 통과 (현재 폼 보존).
export async function classifyAllForJob(jobId) {
  const recordings = await db.voice_recordings
    .where('jobId').equals(jobId)
    .filter((r) => !r.deletedAt && r.transcript)
    .toArray()
  if (recordings.length === 0) return null

  // 시간순 정렬 후 transcript 합치기
  recordings.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  const combined = recordings
    .map((r, i) => `[#${i + 1}] ${r.transcript ?? ''}`)
    .join('\n\n')

  const data = await apiFetch('/api/classify-knowhow', { transcript: combined })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  const r = JSON.parse(match[0])

  // 작업 폼 필드 박음 (사용자안 옵션 1: 자동 덮어쓰기)
  const updates = {
    title:      r.title      ?? undefined,
    category:   r.category   ?? undefined,
    location:   r.location   ?? undefined,
    symptoms:   r.symptoms   ?? undefined,
    cause:      r.cause      ?? undefined,
    checkSteps: r.checkSteps ?? undefined,
    solution:   r.solution   ?? undefined,
    parts:      r.parts      ?? undefined,
    notes:      r.notes      ?? undefined,
  }
  // undefined 제거 (Dexie update는 undefined 필드를 안 건드림)
  const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v != null && v !== ''))
  if (Object.keys(filtered).length > 0) {
    filtered.updatedAt = new Date().toISOString()
    await db.service_jobs.update(jobId, filtered)
  }
  return { recordingCount: recordings.length, applied: filtered }
}

export async function deleteRecording(id) {
  await softDelete('voice_recordings', id)
}

export async function listRecordings() {
  return await db.voice_recordings.orderBy('createdAt').reverse().toArray()
}

export async function setStatus(id, status, extra = {}) {
  // statusUpdatedAt — stuck 자동 복구를 위한 시점 표식. 5분 이상 지난 transcribing/classifying을 pending으로 되돌릴 때 사용.
  await db.voice_recordings.update(id, { status, statusUpdatedAt: Date.now(), ...extra })
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Whisper 변환 호출 (백엔드 /api/whisper)
// language: 사용자가 설정한 i18n 언어 코드 (ko/en/zh/ja/es/hi/vi/th/id/ar 등). 옵션 — 없으면 OpenAI 자동 감지.
export async function transcribeRecording(id, language) {
  const rec = await db.voice_recordings.get(id)
  if (!rec) throw new Error('Recording not found')

  await setStatus(id, 'transcribing', { errorMsg: null })

  try {
    const base64 = await blobToBase64(rec.blob)
    const payload = { base64, mimeType: rec.mimeType }
    if (language) payload.language = language
    const data = await apiFetch('/api/whisper', payload)
    await setStatus(id, 'transcribed', { transcript: data.text })
    return data.text
  } catch (err) {
    await setStatus(id, 'failed', { errorMsg: String(err.message ?? err) })
    throw err
  }
}

// AI 분류 → 노하우 저장
export async function classifyRecording(id) {
  const rec = await db.voice_recordings.get(id)
  if (!rec || !rec.transcript) throw new Error('No transcribed text')

  await setStatus(id, 'classifying', { errorMsg: null })

  try {
    const data = await apiFetch('/api/classify-knowhow', { transcript: rec.transcript })

    // OpenAI 응답에서 JSON 텍스트 추출
    const text = data.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI 응답에서 JSON을 찾을 수 없음')
    const r = JSON.parse(match[0])

    const now = new Date().toISOString()
    const knowhowId = await db.knowhow.add({
      title:      r.title      || rec.transcript.slice(0, 30),
      category:   r.category   || '기타',
      location:   r.location   || '기타',
      symptoms:   r.symptoms   || '',
      cause:      r.cause      || '',
      checkSteps: r.checkSteps || '',
      solution:   r.solution   || '',
      parts:      r.parts      || '',
      notes:      r.notes      || '',
      createdAt:  now,
      updatedAt:  now,
    })
    await setStatus(id, 'done', { knowhowId, doneAt: Date.now() })
    return knowhowId
  } catch (err) {
    await setStatus(id, 'failed', { errorMsg: String(err.message ?? err) })
    throw err
  }
}

// 변환 + 분류 한번에
export async function processRecording(id, language) {
  await transcribeRecording(id, language)
  await classifyRecording(id)
}

// 대기 중인 모든 녹음 자동 변환 (온라인 시 호출)
// 자동으로는 텍스트 변환(transcribe)만 진행. AI 분류는 사용자가 직접 버튼 눌러야 실행됨.
export async function processPendingAll(onProgress, language) {
  const list = await db.voice_recordings.where('status').equals('pending').toArray()
  for (const rec of list) {
    try {
      onProgress?.({ id: rec.id, phase: 'start' })
      await transcribeRecording(rec.id, language)
      onProgress?.({ id: rec.id, phase: 'done' })
    } catch (err) {
      onProgress?.({ id: rec.id, phase: 'fail', error: err })
    }
  }
}
