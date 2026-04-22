// 음성 녹음 큐 관리 유틸
// DB 저장, 상태 변경, 자동 처리(Whisper 변환 → AI 분류 → 노하우 저장)

import { db } from '../db'

// 상태: pending(대기) → transcribing(변환중) → transcribed(변환완료)
//       → classifying(분류중) → done(완료) → failed(실패)

export async function saveRecording({ blob, mimeType, durationSec }) {
  return await db.voice_recordings.add({
    blob,
    mimeType,
    durationSec,
    createdAt: Date.now(),
    status: 'pending',
    transcript: null,
    knowhowId: null,
    errorMsg: null,
  })
}

export async function deleteRecording(id) {
  await db.voice_recordings.delete(id)
}

export async function listRecordings() {
  return await db.voice_recordings.orderBy('createdAt').reverse().toArray()
}

export async function setStatus(id, status, extra = {}) {
  await db.voice_recordings.update(id, { status, ...extra })
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
export async function transcribeRecording(id) {
  const rec = await db.voice_recordings.get(id)
  if (!rec) throw new Error('Recording not found')

  await setStatus(id, 'transcribing', { errorMsg: null })

  try {
    const base64 = await blobToBase64(rec.blob)
    const res = await fetch('/api/whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mimeType: rec.mimeType, language: 'ko' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
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
    const res = await fetch('/api/classify-knowhow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: rec.transcript }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)

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
export async function processRecording(id) {
  await transcribeRecording(id)
  await classifyRecording(id)
}

// 대기 중인 모든 녹음 자동 처리 (온라인 시 호출)
export async function processPendingAll(onProgress) {
  const list = await db.voice_recordings.where('status').anyOf(['pending', 'failed']).toArray()
  for (const rec of list) {
    try {
      onProgress?.({ id: rec.id, phase: 'start' })
      await processRecording(rec.id)
      onProgress?.({ id: rec.id, phase: 'done' })
    } catch (err) {
      onProgress?.({ id: rec.id, phase: 'fail', error: err })
    }
  }
}
