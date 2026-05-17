import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Camera, Sparkles, X, ThumbsUp, ThumbsDown, Loader, Mic, MicOff } from 'lucide-react'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { apiFetch } from '../utils/apiClient'
import { captureAttr } from '../utils/deviceCapture'
import { compressImage } from '../utils/image'
import { loadSettings } from '../utils/settings'
import { anonymizeAiDiagnosis } from '../utils/anonymize'
import { matchCases, casesToContext } from '../utils/standardForm'
import StandardFormDisplay from '../components/StandardFormDisplay'
import { auth, firestore } from '../firebase'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// AI 통합 진단 페이지 (격리됨 — 다른 영역 데이터 연동 X)
// 사진 + 텍스트/음성 → GPT-4o mini → 표준 폼 응답 → 본인 평가 → AI 진단 리스트
export default function QuickDiagPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const fileRef = useRef(null)

  const [userText, setUserText] = useState('')
  const [photoData, setPhotoData] = useState('')  // dataURL
  const [photoMime, setPhotoMime] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)  // { rawResponse, language }
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const isRecordingRef = useRef(false)
  const finalTranscriptRef = useRef('')

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { showToast(t('knowhow.errChrome')); return }
    finalTranscriptRef.current = userText
    isRecordingRef.current = true
    function createAndStart() {
      const r = new SR()
      const SPEECH_LANG = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', es: 'es-ES', hi: 'hi-IN', vi: 'vi-VN', th: 'th-TH', id: 'id-ID', ar: 'ar-SA' }
      r.lang = SPEECH_LANG[i18n.language.split('-')[0]] ?? 'en-US'
      r.continuous = false
      r.interimResults = true
      r.onresult = (e) => {
        let interim = ''
        let final = finalTranscriptRef.current
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const chunk = e.results[i][0].transcript.trim()
            final += (final ? ' ' : '') + chunk
            finalTranscriptRef.current = final
          } else {
            interim += e.results[i][0].transcript
          }
        }
        setUserText(final + interim)
      }
      r.onend = () => {
        if (isRecordingRef.current) {
          try { createAndStart() } catch (e) {}
        } else {
          setIsRecording(false)
        }
      }
      r.onerror = (e) => {
        if (e.error === 'no-speech' && isRecordingRef.current) {
          try { createAndStart() } catch (err) {}
        } else {
          isRecordingRef.current = false
          setIsRecording(false)
        }
      }
      r.start()
      recognitionRef.current = r
    }
    createAndStart()
    setIsRecording(true)
  }

  function stopRecording() {
    isRecordingRef.current = false
    try { recognitionRef.current?.stop() } catch (e) {}
    try { recognitionRef.current?.abort() } catch (e) {}
    recognitionRef.current = null
    setIsRecording(false)
  }

  // unmount 시 마이크 정리 (페이지 이탈해도 마이크 ON 유지되는 결함 차단)
  useEffect(() => {
    return () => {
      isRecordingRef.current = false
      try { recognitionRef.current?.stop() } catch (e) {}
      try { recognitionRef.current?.abort() } catch (e) {}
      recognitionRef.current = null
    }
  }, [])

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      setPhotoData(dataUrl)
      setPhotoMime('image/jpeg')
    } catch (err) {
      showToast(err.message || String(err))
    }
  }

  function clearPhoto() {
    setPhotoData('')
    setPhotoMime('')
  }

  async function handleDiagnose() {
    if (loading) return
    if (!userText.trim()) return showToast(t('quickDiag.errTextRequired'))
    // 마이크 ON 상태면 즉시 정지 (AI 분석 시작 = 입력 끝났다는 신호)
    if (isRecordingRef.current) stopRecording()
    setLoading(true)
    setResult(null)
    try {
      const photoBase64 = photoData ? photoData.split(',')[1] : ''
      const lang = (i18n.language || 'ko').slice(0, 2)
      // RAG: 사용자 입력 → 우리 cases 421건 중 top 5 매칭 → AI 컨텍스트로 전송
      // = AI 가 우리 데이터 기반으로 구체적 답변 (일반 LLM 답 X)
      const matched = matchCases(userText.trim(), lang, 5)
      const ragContext = casesToContext(matched, lang)
      const body = {
        userText: userText.trim(),
        language: lang,
        ragContext: ragContext || '',
      }
      if (photoBase64) {
        body.photoBase64 = photoBase64
        body.photoMimeType = photoMime || 'image/jpeg'
      }
      const data = await apiFetch('/api/quickDiag', body)
      setResult({ rawResponse: data.rawResponse || '', language: data.language || 'ko' })
    } catch (err) {
      showToast(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleFeedback(value) {
    if (!result || savingFeedback) return
    setSavingFeedback(true)
    try {
      if (value === 'helpful') {
        // 도움됨 = AI 진단 리스트로 영구 저장
        const now = new Date().toISOString()
        const item = {
          createdAt: now,
          updatedAt: now,
          userText: userText.trim(),
          photoData: photoData || '',
          language: result.language,
          rawResponse: result.rawResponse,
          feedback: 'helpful',
          feedbackAt: now,
          userMemo: '',
          sharedToCommunityCases: false,
        }
        const localId = await db.ai_diagnosis_list.add(item)

        // 공유 동의 사용자 = community_cases로 즉시 익명 push (격리 — ai_diagnosis_list와 별개)
        try {
          const { shareConsent } = loadSettings()
          const email = auth.currentUser?.email
          if (shareConsent && email) {
            const saved = await db.ai_diagnosis_list.get(localId)
            const payload = anonymizeAiDiagnosis(saved)
            if (payload) {
              const caseDocId = saved.cloudId || crypto.randomUUID()
              await setDoc(doc(firestore, 'users', email, 'community_cases', caseDocId), {
                ...payload,
                status: 'pending_review',
                _serverCreatedAt: serverTimestamp(),
                createdAt: now,
              })
              await db.ai_diagnosis_list.update(localId, { sharedToCommunityCases: true })
            }
          }
        } catch (e) {
          // 공유 실패해도 본인 저장은 보존 (silent)
          console.warn('community_cases push failed:', e?.message)
        }

        showToast(t('quickDiag.savedToList'))
        navigate('/knowhow/ai-list', { replace: true })
      } else {
        // 별로 = 폐기 (저장 안 함)
        showToast(t('quickDiag.discarded'))
        setUserText('')
        setPhotoData('')
        setPhotoMime('')
        setResult(null)
      }
    } catch (err) {
      showToast(err.message || String(err))
    } finally {
      setSavingFeedback(false)
    }
  }

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate('/diagnosis')}
        className="flex items-center justify-center gap-2 w-full py-3 mb-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={20} strokeWidth={2} className="text-emerald-600" />
        <h1 className="text-lg font-bold text-gray-900">{t('quickDiag.title')}</h1>
      </div>

      {/* 안내 (vivid 단색 — 햇빛 가독성) */}
      <div className="bg-emerald-600 text-white text-sm font-medium leading-snug rounded-lg px-4 py-3 mb-4 shadow-md">
        💡 {t('quickDiag.intro')}
      </div>

      {!result && (
        <>
          {/* 증상 입력 (필수) + 음성 버튼 */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {t('quickDiag.symptomLabel')} <span className="text-red-600">*</span>
            </label>
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder={t('quickDiag.symptomPlaceholder')}
              rows={4}
              className="w-full text-sm text-gray-900 outline-none resize-y min-h-[5rem] border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 [field-sizing:content]"
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full mt-2 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md ${
                isRecording
                  ? 'bg-red-600 text-white active:bg-red-700'
                  : 'bg-indigo-600 text-white active:bg-indigo-700'
              }`}
            >
              {isRecording
                ? <><MicOff size={18} strokeWidth={2} /> <span className="animate-pulse">{t('quickDiag.voiceStop')}</span></>
                : <><Mic size={18} strokeWidth={2} /> {t('quickDiag.voiceStart')}</>
              }
            </button>
            <p className="text-[11px] text-gray-400 mt-1">{t('quickDiag.voiceHint')}</p>
          </div>

          {/* 사진 첨부 (선택) */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {t('quickDiag.photoLabel')} <span className="text-gray-400 text-[11px]">({t('quickDiag.optional')})</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              {...captureAttr()}
              className="hidden"
              onChange={handlePhoto}
            />
            {photoData ? (
              <div className="relative">
                <img src={photoData} alt="" className="w-full max-h-48 object-contain rounded-lg border-2 border-gray-300 bg-gray-50" />
                <button
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 active:bg-gray-50"
              >
                <Camera size={22} strokeWidth={1.5} />
                <span className="text-xs">{t('quickDiag.photoBtn')}</span>
              </button>
            )}
            <p className="text-[11px] text-gray-400 mt-1">{t('quickDiag.photoHint')}</p>
          </div>

          {/* AI 진단 버튼 (vivid 단색) */}
          <button
            onClick={handleDiagnose}
            disabled={loading || !userText.trim()}
            className="w-full py-3.5 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md active:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader size={18} className="animate-spin" strokeWidth={2} /> {t('quickDiag.analyzing')}</>
              : <><Sparkles size={18} strokeWidth={2} /> {t('quickDiag.diagnoseBtn')}</>
            }
          </button>
        </>
      )}

      {/* 결과 화면 — 표준 폼 7개 섹션 색깔 헤더 (일반 검색과 동일 색상 시스템) */}
      {result && (
        <>
          <div className="bg-white border-2 border-gray-300 rounded-xl p-4 mb-3 shadow-sm">
            <StandardFormDisplay text={result.rawResponse} lang={result.language || (i18n.language || 'ko').slice(0,2)} />
          </div>

          {/* 안내 박스 + [도움됨/별로] 버튼 통합 */}
          <div className="bg-blue-600 rounded-xl p-3 mb-2 shadow-md">
            <p className="text-white text-sm font-medium leading-snug mb-2.5">
              ✓ {t('quickDiag.resultIntro')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFeedback('helpful')}
                disabled={savingFeedback}
                className="py-3 text-sm font-bold bg-emerald-600 text-white rounded-lg shadow-md active:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ThumbsUp size={18} strokeWidth={2} />
                {t('quickDiag.helpfulBtn')}
              </button>
              <button
                onClick={() => handleFeedback('not_helpful')}
                disabled={savingFeedback}
                className="py-3 text-sm font-bold bg-gray-600 text-white rounded-lg shadow-md active:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ThumbsDown size={18} strokeWidth={2} />
                {t('quickDiag.notHelpfulBtn')}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 text-center">{t('quickDiag.feedbackHint')}</p>
        </>
      )}
    </div>
  )
}
