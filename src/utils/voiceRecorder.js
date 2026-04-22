// 음성 녹음 유틸 (MediaRecorder 래퍼)
// 녹음 시작/정지 → Blob 반환. 마이크 권한 요청 포함.

let mediaRecorder = null
let audioChunks = []
let stream = null
let startedAt = 0

// 브라우저가 지원하는 가장 좋은 포맷 선택
function pickMime() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

export async function startRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    throw new Error('Already recording')
  }
  stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMime()
  mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  audioChunks = []
  startedAt = Date.now()

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) audioChunks.push(e.data)
  }
  mediaRecorder.start(1000) // 1초마다 chunk 저장 (앱이 죽어도 부분 데이터 보존)
}

export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('녹음 중이 아닙니다'))
      return
    }
    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType || 'audio/webm'
      const blob = new Blob(audioChunks, { type: mimeType })
      const durationSec = Math.round((Date.now() - startedAt) / 1000)
      stream?.getTracks().forEach((t) => t.stop())
      mediaRecorder = null
      audioChunks = []
      stream = null
      resolve({ blob, mimeType, durationSec })
    }
    mediaRecorder.onerror = (e) => reject(e.error || new Error('녹음 오류'))
    mediaRecorder.stop()
  })
}

export function isRecording() {
  return mediaRecorder?.state === 'recording'
}

export function getElapsedSec() {
  return mediaRecorder?.state === 'recording' ? Math.round((Date.now() - startedAt) / 1000) : 0
}
