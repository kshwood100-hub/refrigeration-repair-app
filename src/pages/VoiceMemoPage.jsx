import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Play, Pause, Trash2, Wifi, WifiOff, ChevronLeft, RefreshCw, ChevronRight, Info, Building2 } from 'lucide-react'
import { db } from '../db'
import { startRecording, stopRecording } from '../utils/voiceRecorder'
import { saveRecording, deleteRecording, transcribeRecording, classifyRecording, processRecording, processPendingAll } from '../utils/voiceQueue'
import { showToast } from '../utils/toast'

function fmtDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const AUTO_DELETE_MS = 7 * 24 * 60 * 60 * 1000 // 7일
const MAX_DURATION_SEC = 5 * 60                 // 녹음 최대 5분 (Whisper 한도 + 비용 보호)

function daysLeft(doneAt) {
  if (!doneAt) return null
  const ms = AUTO_DELETE_MS - (Date.now() - doneAt)
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

const STATUS_COLOR = {
  pending: 'text-gray-500 bg-gray-100',
  transcribing: 'text-blue-600 bg-blue-50',
  transcribed: 'text-blue-600 bg-blue-50',
  classifying: 'text-violet-600 bg-violet-50',
  done: 'text-green-700 bg-green-50',
  failed: 'text-red-600 bg-red-50',
}

const STATUS_KEY = {
  pending: 'voice.statusPending',
  transcribing: 'voice.statusTranscribing',
  transcribed: 'voice.statusTranscribed',
  classifying: 'voice.statusClassifying',
  done: 'voice.statusDone',
  failed: 'voice.statusFailed',
}

export default function VoiceMemoPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isRec, setIsRec] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [busyId, setBusyId] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)
  const tickRef = useRef(null)

  const recordings = useLiveQuery(() => db.voice_recordings.orderBy('createdAt').reverse().toArray(), [])
  const customers = useLiveQuery(() => db.customers.orderBy('name').toArray(), [])
  const [customerId, setCustomerId] = useState(null)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  // 7일 지난 완료건 자동삭제
  useEffect(() => {
    if (!recordings) return
    const cutoff = Date.now() - AUTO_DELETE_MS
    const expired = recordings.filter((r) => r.status === 'done' && r.doneAt && r.doneAt < cutoff)
    if (expired.length === 0) return
    ;(async () => {
      for (const r of expired) await db.voice_recordings.delete(r.id)
    })()
  }, [recordings])

  useEffect(() => {
    function handleOnline() { setOnline(true) }
    function handleOffline() { setOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 자동 변환 없음 — 사용자가 "전체 변환" 버튼을 눌러야 변환 시작

  async function handleStart() {
    if (!customerId) {
      showToast(t('knowhow.errCustomer'))
      return
    }
    try {
      await startRecording()
      setIsRec(true)
      setElapsed(0)
      const startTime = Date.now()
      tickRef.current = setInterval(() => {
        const sec = Math.round((Date.now() - startTime) / 1000)
        setElapsed(sec)
        if (sec >= MAX_DURATION_SEC) {
          clearInterval(tickRef.current)
          handleStop()
          showToast(t('voice.toastAutoStopped'))
        }
      }, 1000)
    } catch (err) {
      showToast(t('voice.toastMicFail') + (err.message ?? err))
    }
  }

  async function handleStop() {
    try {
      clearInterval(tickRef.current)
      const result = await stopRecording()
      setIsRec(false)
      setElapsed(0)
      await saveRecording(result)
      showToast(online ? t('voice.toastSaved') : t('voice.toastSavedOffline'))
    } catch (err) {
      setIsRec(false)
      showToast(t('voice.toastSaveFail') + (err.message ?? err))
    }
  }

  function handlePlay(rec) {
    if (playingId === rec.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
    }
    const url = URL.createObjectURL(rec.blob)
    const audio = new Audio(url)
    audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url) }
    audio.play()
    audioRef.current = audio
    setPlayingId(rec.id)
  }

  async function handleProcess(id) {
    setBusyId(id)
    try {
      await processRecording(id)
      showToast(t('voice.toastProcessDone'))
    } catch (err) {
      showToast(t('voice.toastProcessFail') + (err.message ?? err))
    } finally {
      setBusyId(null)
    }
  }

  const [transcribingAll, setTranscribingAll] = useState(false)

  async function handleTranscribeAll() {
    if (transcribingAll) return
    if (!customerId) { showToast(t('knowhow.errCustomer')); return }
    setTranscribingAll(true)
    try {
      let failCount = 0
      await processPendingAll(({ phase, error }) => {
        if (phase === 'fail') failCount += 1
      })
      if (failCount > 0) {
        showToast(t('voice.toastAutoFail') + `${failCount}`)
        return
      }
      // 변환 끝난 모든 transcribed 녹음 가져와서 합치기 (#1, #2, #3 순서)
      const all = await db.voice_recordings
        .where('status').anyOf(['transcribed', 'done'])
        .toArray()
      // 오래된 순서로 정렬 (#1이 첫 녹음)
      all.sort((a, b) => a.createdAt - b.createdAt)
      const combined = all
        .map((r, i) => `[${t('voice.recordingLabel', { n: i + 1 })} ${fmtDateTime(r.createdAt)}]\n${r.transcript ?? ''}`)
        .join('\n\n')
      // KnowhowFormPage로 거래처 + 본문 가지고 진입
      navigate('/knowhow/new', {
        state: {
          customerId,
          prefilledNotes: combined,
          sourceVoiceIds: all.map((r) => r.id),
        },
      })
    } finally {
      setTranscribingAll(false)
    }
  }

  async function handleRetry(id, fromState) {
    setBusyId(id)
    try {
      if (fromState === 'transcribed') {
        await classifyRecording(id)
      } else {
        await processRecording(id)
      }
      showToast(t('voice.toastRetryDone'))
    } catch (err) {
      showToast(t('voice.toastRetryFail') + (err.message ?? err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('voice.confirmDelete'))) return
    if (playingId === id) audioRef.current?.pause()
    await deleteRecording(id)
  }

  return (
    <div className="p-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-600">
          <ChevronLeft size={16} strokeWidth={1.5} /> {t('voice.back')}
        </button>
        <h2 className="text-base font-semibold text-gray-900">{t('voice.title')}</h2>
        <div className={`flex items-center gap-1 text-xs ${online ? 'text-green-600' : 'text-orange-500'}`}>
          {online ? <Wifi size={13} strokeWidth={1.5} /> : <WifiOff size={13} strokeWidth={1.5} />}
          {online ? t('voice.online') : t('voice.offline')}
        </div>
      </div>

      {/* 거래처 선택 (필수) */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 mb-1.5 px-1">{t('knowhow.customerLabel')}</p>
        {customers && customers.length === 0 ? (
          <button
            onClick={() => navigate('/service')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-100 border-2 border-amber-400 text-amber-900 text-xs font-semibold rounded-xl active:bg-amber-200"
          >
            <Building2 size={14} strokeWidth={2} />
            {t('knowhow.customerNoneAdd')}
          </button>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowCustomerList((v) => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-white border-2 rounded-lg outline-none text-left ${customerId ? 'border-blue-400 text-gray-900 font-medium' : 'border-white text-gray-500'}`}
            >
              <Building2 size={16} strokeWidth={2} className={customerId ? 'text-blue-600' : 'text-gray-400'} />
              <span className="flex-1 truncate">
                {customerId
                  ? (customers?.find((c) => c.id === customerId)?.name ?? t('knowhow.customerSelect'))
                  : t('knowhow.customerSelect')}
              </span>
              <span className="text-gray-400 text-xs">{showCustomerList ? '▲' : '▼'}</span>
            </button>

            {showCustomerList && (
              <div className="mt-1 border border-gray-300 rounded-lg overflow-hidden bg-white">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('knowhow.customerSelect')}
                  className="w-full px-3 py-2.5 text-sm border-b border-gray-200 outline-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {customers
                    ?.filter((c) => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id)
                          setShowCustomerList(false)
                          setCustomerSearch('')
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 last:border-b-0 active:bg-blue-50 ${customerId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 녹음 버튼 */}
      <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-4">
        <button
          onClick={isRec ? handleStop : handleStart}
          disabled={!customerId && !isRec}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md text-white transition-colors disabled:bg-gray-400 disabled:opacity-60 ${
            isRec ? 'bg-red-600 active:bg-red-700' : 'bg-blue-600 active:bg-blue-700'
          }`}
        >
          {isRec ? <Square size={28} strokeWidth={2} fill="currentColor" /> : <Mic size={32} strokeWidth={1.8} />}
        </button>
        <p className="mt-3 text-sm text-gray-600">
          {!customerId && !isRec
            ? t('knowhow.errCustomer')
            : (isRec ? t('voice.recording', { time: fmtDuration(elapsed) }) : t('voice.tapToStart'))}
        </p>
        <p className="mt-1 text-xs text-gray-400 text-center">
          {online ? t('voice.autoProcess') : t('voice.offlineNote')}
        </p>
        <p className="mt-1 text-[11px] text-gray-400 text-center">
          {t('voice.maxDurationNote')}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400 text-center">
          {t('voice.continueHint')}
        </p>
      </div>

      {/* 안내: 자동삭제 + 백업 제외 */}
      <div className="flex items-start gap-2 px-3 py-3 mb-4 rounded-lg bg-yellow-200">
        <Info size={18} strokeWidth={2.5} className="text-yellow-900 shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-yellow-900 leading-relaxed">
          {t('voice.autoDeleteNote')}
        </p>
      </div>

      {/* 전체 텍스트 변환 버튼 */}
      {recordings && recordings.filter((r) => r.status === 'pending').length > 0 && (
        <button
          onClick={handleTranscribeAll}
          disabled={!online || transcribingAll}
          className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm active:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={15} strokeWidth={2} className={transcribingAll ? 'animate-spin' : ''} />
          {transcribingAll
            ? t('voice.transcribingAll')
            : online
              ? t('voice.transcribeAllBtn', { count: recordings.filter((r) => r.status === 'pending').length })
              : t('voice.offlineBtn')}
        </button>
      )}

      {/* 녹음 목록 */}
      {!recordings || recordings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">{t('voice.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recordings.map((r, idx) => {
            const statusKey = STATUS_KEY[r.status] ?? STATUS_KEY.pending
            const statusColor = STATUS_COLOR[r.status] ?? STATUS_COLOR.pending
            const busy = busyId === r.id
            // 가장 오래된 게 #1, 최신이 가장 큰 번호 (목록은 최신→오래된 순서)
            const seq = recordings.length - idx
            return (
              <div key={r.id} className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{t('voice.recordingLabel', { n: seq })}</span>
                      <span> · {fmtDateTime(r.createdAt)} · {fmtDuration(r.durationSec)}</span>
                    </p>
                    {r.transcript && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.transcript}</p>
                    )}
                    {r.errorMsg && (
                      <p className="text-xs text-red-500 mt-1 line-clamp-2">{r.errorMsg}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md shrink-0 ${statusColor}`}>{t(statusKey)}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handlePlay(r)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded-lg text-gray-600"
                  >
                    {playingId === r.id ? <Pause size={11} strokeWidth={1.5} /> : <Play size={11} strokeWidth={1.5} />}
                    {t('voice.play')}
                  </button>

                  {(r.status === 'pending' || r.status === 'failed') && (
                    <button
                      onClick={() => handleRetry(r.id, r.status)}
                      disabled={busy || !online}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                      <RefreshCw size={11} strokeWidth={1.8} />
                      {online ? t('voice.retryConvert') : t('voice.offlineBtn')}
                    </button>
                  )}

                  {r.status === 'done' && r.knowhowId && (
                    <>
                      <button
                        onClick={() => navigate(`/knowhow/${r.knowhowId}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg"
                      >
                        {t('voice.viewKnowhow')} <ChevronRight size={11} strokeWidth={1.8} />
                      </button>
                      {daysLeft(r.doneAt) !== null && (
                        <span className="text-xs text-gray-400">
                          {t('voice.daysUntilDelete', { days: daysLeft(r.doneAt) })}
                        </span>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="ml-auto p-1.5 text-gray-400 active:text-red-500"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
