// 영상 파일 → 오디오 추출 유틸 (Whisper 전송용)
// 1차: AudioContext.decodeAudioData (즉시) → 16kHz mono WAV 인코딩
// 2차 폴백: hidden video + MediaRecorder 실시간 캡처 (Safari 등 decode 실패 시)

const TARGET_SAMPLE_RATE = 16000

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const wavBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(wavBuffer)

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

async function extractViaDecode(file) {
  const arrayBuffer = await file.arrayBuffer()
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) throw new Error('AudioContext unsupported')
  const ctx = new Ctx()
  let audioBuffer
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    try { await ctx.close() } catch {}
  }
  // 16kHz mono로 리샘플 (파일 크기 줄이고 Whisper 표준에 맞춤)
  const targetFrames = Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE)
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, targetFrames, TARGET_SAMPLE_RATE)
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start()
  const rendered = await offlineCtx.startRendering()
  return { blob: audioBufferToWav(rendered), durationSec: Math.round(audioBuffer.duration) }
}

async function extractViaPlayback(file) {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.muted = true
  video.preload = 'auto'
  video.crossOrigin = 'anonymous'
  // off-DOM 재생: 일부 브라우저는 DOM에 붙어야 동작 → 화면 밖에 부착
  video.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0'
  document.body.appendChild(video)
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve
    video.onerror = () => reject(new Error('Video load failed'))
  })
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  const sourceNode = ctx.createMediaElementSource(video)
  const dest = ctx.createMediaStreamDestination()
  sourceNode.connect(dest)
  // (옵션) 사용자에게는 무음으로 들리도록 destination 미연결
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '')
  const recorder = mime ? new MediaRecorder(dest.stream, { mimeType: mime }) : new MediaRecorder(dest.stream)
  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data) }
  const stopped = new Promise((resolve) => { recorder.onstop = resolve })
  recorder.start(1000)
  await video.play()
  await new Promise((resolve) => { video.onended = resolve })
  recorder.stop()
  await stopped
  try { await ctx.close() } catch {}
  document.body.removeChild(video)
  URL.revokeObjectURL(url)
  const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
  return { blob, durationSec: Math.round(video.duration) }
}

export async function extractAudioFromVideo(file) {
  // 1차 시도: 즉시 디코드 (Chrome/Edge/최신 브라우저)
  try {
    return await extractViaDecode(file)
  } catch (err) {
    // 2차 폴백: 실시간 재생 캡처 (Safari·일부 모바일)
    return await extractViaPlayback(file)
  }
}
