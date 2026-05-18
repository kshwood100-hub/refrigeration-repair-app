import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Sparkles, Camera, X, Building2, Trash2 } from 'lucide-react'
import { db } from '../db'
import {
  KNOWHOW_CATEGORIES, COMPRESSOR_TYPES, COMPRESSOR_STRUCTURES,
  COOLING_METHODS, TEMP_RANGES, REFRIGERANT_TYPES, SYSTEM_TYPES,
} from '../data/refrigerationTypes'
import { showToast } from '../utils/toast'
import { scanEquipment } from '../utils/scanEquipment'
import { apiFetch } from '../utils/apiClient'
import MediaImage from './MediaImage'
import { captureAttr } from '../utils/deviceCapture'

// 한국어 DB값 → i18n 키 매핑 (표시용)
const CATEGORY_KEY = {
  '압축기': 'catCompressor', '냉매계통': 'catRefrigerant', '전기/제어': 'catElectrical',
  '팬/모터': 'catFan', '착상/제상': 'catDefrost', '결로/배수': 'catDrain',
  '소음/진동': 'catNoise', '냉각불량': 'catCooling', '오일계통': 'catOil', '기타': 'catOther',
}
const EQUIP_KEY = {
  '왕복동식': 'eqReciprocating', '스크롤식': 'eqScroll', '로터리식': 'eqRotary',
  '스크류식': 'eqScrew', '터보(원심)식': 'eqTurbo', '리니어식': 'eqLinear',
  '밀폐형': 'eqHermetic', '반밀폐형': 'eqSemiHermetic', '개방형': 'eqOpen',
  '공랭식': 'eqAirCooled', '수랭식': 'eqWaterCooled', '증발식(쿨링타워)': 'eqEvaporative',
  '고온용 (+5~+15°C)': 'eqTempHigh', '중온용 (0~+5°C)': 'eqTempMedium',
  '저온용 (-5~-25°C)': 'eqTempLow', '초저온용 (-25~-60°C)': 'eqTempUltraLow',
  'R-717 (암모니아)': 'eqR717', 'R-744 (CO₂)': 'eqR744',
  'R-290 (프로판)': 'eqR290', 'R-600a (이소부탄)': 'eqR600a',
  '냉장 쇼케이스': 'eqShowcaseRefrig', '냉동 쇼케이스': 'eqShowcaseFrozen',
  '업소용 냉장고': 'eqCommRefrig', '업소용 냉동고': 'eqCommFreezer',
  '냉장창고': 'eqColdStorageRefrig', '냉동창고': 'eqColdStorageFrozen', '저온창고': 'eqColdStorageLow',
  '워크인 냉장': 'eqWalkinRefrig', '워크인 냉동': 'eqWalkinFreezer',
  '칠러 (공랭식)': 'eqChillerAir', '칠러 (수랭식)': 'eqChillerWater',
  '브라인 냉동기': 'eqBrineChiller', '글리콜 냉동기': 'eqGlycolChiller',
  '제빙기': 'eqIceMachine', '급속냉동기': 'eqBlastFreezer', '터널 프리져': 'eqTunnelFreezer',
  '큐어링 냉장고': 'eqCuringChamber', '중앙집중식 랙 시스템': 'eqRackSystem', '콘덴싱 유니트': 'eqCondensingUnit',
  '이원 냉동기': 'eqCascade', '이단 압축기': 'eqTwoStage', '챔버냉동기': 'eqChamberFreezer',
  '캡쿨러': 'eqCapCooler', '초저온 냉동기 (-40°C이하)': 'eqUltraLowFreezer',
  '암모니아 냉동기': 'eqAmmoniaSystem', 'CO₂ 냉동기': 'eqCO2System',
  '흡수식 냉동기': 'eqAbsorption', '응용/주문제작': 'eqCustom',
  '에어컨 (패키지)': 'eqPackageAC', '에어컨 (스플릿)': 'eqSplitAC',
  '항온항습기': 'eqPAHU', '냉동 제습기': 'eqDehumidifier', '항공/특수 냉각': 'eqAviationCooling',
  '일반 냉동기': 'eqGrpGeneral', '산업용 냉동기': 'eqGrpIndustrial',
  '특수 냉동기': 'eqGrpSpecial', '공조/기타': 'eqGrpHvac',
  '기타': 'eqOther',
}

const LOCATION_KEYS = [
  'locCompressor', 'locCondenser', 'locEvaporator', 'locElecPanel',
  'locPiping', 'locFanMotor', 'locController', 'locOther',
]
const LOCATION_DB_VALUES = ['압축기', '응축기', '증발기', '전기패널', '배관/냉매', '팬/모터', '컨트롤러', '기타']

// 분류·설비분류 칩 UI 표시 여부 — false: 카메라 분석 결과로 자동 채움 (state/저장은 유지)
const SHOW_CHIP_INPUTS = false

// 장비 분석 결과 1개 슬롯 — 사진 + AI 분석 데이터를 함께 보관
export const EMPTY_EQUIPMENT = {
  photo:       '',  // 사진 dataUrl
  kind:        '',  // 종류 (압축기/응축기/증발기/...)
  brand:       '',
  model:       '',
  serial:      '',
  capacity:    '',
  refrigerant: '',
  tempClass:   '',
  stage:       '',
  confidence:  '',
  notes:       '',
}

export const MAX_EQUIPMENTS = 5

export const EMPTY_KNOWHOW = {
  customerId:     null,
  title:          '',
  category:       '기타',
  location:       '기타',
  compressorType: '',
  compressorStr:  '',
  coolingMethod:  '',
  tempRange:      '',
  refrigerant:    '',
  systemType:     '',
  symptoms:       '',
  cause:          '',
  checkSteps:     '',
  solution:       '',
  parts:          '',
  notes:          '',
  equipPhotos:    [],   // 옛 호환: 사진 dataUrl만 보관 (UI는 equipments 사용)
  equipments:    [],    // 신규: 사진 + 분석 결과 통합 (최대 5개)
}

// 단계별 폼 필드 매핑 (stage 1 = 도착 직후, stage 2 = 점검 후)
const STAGE_FIELDS = {
  1: ['title', 'symptoms', 'category', 'location'],            // 1차: 제목·증상 + 자동 분류
  2: ['cause', 'checkSteps', 'solution', 'parts', 'notes'],    // 2차: 원인·조치
}

export default function KnowhowFormBody({ form, setForm, hideCustomer = false, stage = null }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  // 단계별 장비 필터 + 원본 인덱스 보존 (삭제·라이트박스에서 사용)
  const stageEquipments = (form.equipments ?? [])
    .map((eq, realIdx) => ({ ...eq, realIdx }))
    .filter((eq) => stage == null || eq.stage === stage)
  const stageEquipCount = stageEquipments.length

  // 거래처 목록 (id, name)
  const customers = useLiveQuery(
    () => db.customers.orderBy('name').filter((r) => !r.deletedAt).toArray(), []
  )

  const [showCustomerList, setShowCustomerList] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [equipLoading, setEquipLoading] = useState(false)
  const [scanningIdxs, setScanningIdxs] = useState(() => new Set())
  const [equipLightboxIdx, setEquipLightboxIdx] = useState(null)
  const recognitionRef = useRef(null)
  const equipFileRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const isRecordingRef = useRef(false)

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }))

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { showToast(t('knowhow.errChrome')); return }
    finalTranscriptRef.current = transcript
    isRecordingRef.current = true

    function createAndStart() {
      const r = new SR()
      const SPEECH_LANG = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', es: 'es-ES', hi: 'hi-IN' }
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
        setTranscript(final + interim)
      }
      r.onend = () => {
        if (isRecordingRef.current) {
          try { createAndStart() } catch(e) {}
        } else {
          setIsRecording(false)
        }
      }
      r.onerror = (e) => {
        if (e.error === 'no-speech' && isRecordingRef.current) {
          try { createAndStart() } catch(err) {}
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
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  useEffect(() => {
    return () => {
      isRecordingRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  // 옛 데이터 호환: equipPhotos만 있고 equipments가 비어있으면 자동 변환 (1회)
  useEffect(() => {
    const photos = form.equipPhotos ?? []
    const equips = form.equipments ?? []
    if (photos.length > 0 && equips.length === 0) {
      setForm((p) => ({
        ...p,
        equipments: photos.map((photo) => ({ ...EMPTY_EQUIPMENT, photo })),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function triggerEquipScan() {
    if (stageEquipCount >= MAX_EQUIPMENTS) {
      showToast(t('knowhow.equipMaxReached', { max: MAX_EQUIPMENTS }))
      return
    }
    equipFileRef.current?.click()
  }

  async function handleEquipFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (stageEquipCount >= MAX_EQUIPMENTS) {
      showToast(t('knowhow.equipMaxReached', { max: MAX_EQUIPMENTS }))
      return
    }

    // 사진만 박고 즉시 종료 — AI 분석은 카드별 [스캔] 버튼으로 사용자가 직접 트리거
    setEquipLoading(true)
    try {
      const dataUrl = await compressImage(file)
      setForm((p) => ({
        ...p,
        equipments:  [...(p.equipments  ?? []), { ...EMPTY_EQUIPMENT, photo: dataUrl, stage: stage }],
        equipPhotos: [...(p.equipPhotos ?? []), dataUrl],
      }))
    } catch (err) {
      showToast(t('knowhow.errAi') + (err.message || ''))
    } finally {
      setEquipLoading(false)
    }
  }

  async function handleScanOne(realIdx) {
    const target = (form.equipments ?? [])[realIdx]
    if (!target?.photo) return
    if (scanningIdxs.has(realIdx)) return
    setScanningIdxs((prev) => {
      const next = new Set(prev)
      next.add(realIdx)
      return next
    })
    try {
      const r = await scanEquipment(target.photo)
      setForm((p) => ({
        ...p,
        equipments: (p.equipments ?? []).map((eq, i) =>
          i === realIdx
            ? {
                ...eq,
                kind:        r.kind        || '',
                brand:       r.brand       || '',
                model:       r.model       || '',
                serial:      r.serial      || '',
                capacity:    r.capacity    || '',
                refrigerant: r.refrigerant || '',
                tempClass:   r.tempClass   || '',
                compStage:   r.stage       || '',
                confidence:  r.confidence  || '',
                notes:       r.notes       || '',
              }
            : eq
        ),
      }))
    } catch (err) {
      showToast(t('knowhow.errAi') + (err.message || ''))
    } finally {
      setScanningIdxs((prev) => {
        const next = new Set(prev)
        next.delete(realIdx)
        return next
      })
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1200
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = url
    })
  }

  function removeEquipPhoto(idx) {
    // equipments + equipPhotos 동시 제거 (인덱스 매칭)
    setForm((p) => ({
      ...p,
      equipments:  (p.equipments  ?? []).filter((_, i) => i !== idx),
      equipPhotos: (p.equipPhotos ?? []).filter((_, i) => i !== idx),
    }))
  }

  async function handleAiClassify() {
    if (!transcript.trim()) return
    stopRecording()
    setAiLoading(true)
    try {
      const data = await apiFetch('/api/classify-knowhow', { transcript })
      const text = data.choices?.[0]?.message?.content ?? ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const r = JSON.parse(match[0])
        // 단계별 setForm — stage=1: 제목·증상 + 자동 분류 / stage=2: 원인·조치 / stage=null: 통합
        setForm((p) => {
          const next = { ...p }
          const allow = stage ? STAGE_FIELDS[stage] : null
          const apply = (key, val) => { if (!allow || allow.includes(key)) next[key] = val }
          if (r.title)      apply('title',      r.title)
          if (r.symptoms)   apply('symptoms',   r.symptoms)
          if (r.cause)      apply('cause',      r.cause)
          if (r.checkSteps) apply('checkSteps', r.checkSteps)
          if (r.solution)   apply('solution',   r.solution)
          if (r.parts)      apply('parts',      r.parts)
          if (r.notes)      apply('notes',      r.notes)
          if (KNOWHOW_CATEGORIES.includes(r.category)) apply('category', r.category)
          if (LOCATION_DB_VALUES.includes(r.location)) apply('location', r.location)
          return next
        })
        setTranscript('')
      }
    } catch (e) {
      showToast(t('knowhow.errAi') + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* 거래처 선택 (필수) — 작업 상세 등 이미 고객이 정해진 경우 숨김 */}
      {!hideCustomer && (
      <Section title={t('knowhow.customerLabel')}>
        <p className="text-xs text-gray-400 mb-1.5">{t('knowhow.customerDesc')}</p>
        {customers && customers.length === 0 ? (
          <button
            onClick={() => navigate('/service')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-100 border-2 border-amber-400 text-amber-900 text-sm font-semibold rounded-xl active:bg-amber-200"
          >
            <Building2 size={16} strokeWidth={2} />
            {t('knowhow.customerNoneAdd')}
          </button>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowCustomerList((v) => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-white border-2 rounded-lg outline-none text-left ${form.customerId ? 'border-blue-400 text-gray-900 font-medium' : 'border-white text-gray-500'}`}
            >
              <Building2 size={16} strokeWidth={2} className={form.customerId ? 'text-blue-600' : 'text-gray-400'} />
              <span className="flex-1 truncate">
                {form.customerId
                  ? (customers?.find((c) => c.id === form.customerId)?.name ?? t('knowhow.customerSelect'))
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
                          set('customerId', c.id)
                          setShowCustomerList(false)
                          setCustomerSearch('')
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 last:border-b-0 active:bg-blue-50 ${form.customerId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
      )}

      {/* 음성/카메라 입력 */}
      <Section title={t('knowhow.voiceInput')}>
        <p className="text-xs text-gray-400">{t('knowhow.voiceDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {/* 장비 분석 = label + 내장 input 패턴 (button.click() 우회 X — chromium 시뮬 모드·신버전 차단 정책 회피).
              MAX_EQUIPMENTS 체크는 handleEquipFile 시작 시 박혀있어 안전. */}
          <label
            className={`py-3 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white text-center leading-tight ${
              equipLoading ? 'opacity-60 pointer-events-none' : 'cursor-pointer active:bg-emerald-700'
            }`}
          >
            <Camera size={18} strokeWidth={1.8} />
            <span>{equipLoading ? t('scan.analyzing') : t('camera.equipment')}</span>
            <input
              type="file"
              accept="image/*"
              {...captureAttr()}
              onChange={handleEquipFile}
              className="hidden"
            />
          </label>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`py-3 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-1 text-center leading-tight ${
              isRecording ? 'bg-red-500 text-white active:bg-red-600' : 'bg-indigo-600 text-white active:bg-indigo-700'
            }`}
          >
            {isRecording
              ? <><MicOff size={18} strokeWidth={1.8} /><span className="animate-pulse">{t('knowhow.recordStop')}</span></>
              : <><Mic size={18} strokeWidth={1.8} /><span>{t('knowhow.recordStart')}</span></>
            }
          </button>
        </div>
        <p className="text-[11px] text-gray-400 text-center leading-snug">
          {t('knowhow.perRecordLimitNote')}
        </p>
        {stageEquipCount > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              {t('knowhow.equipCount', { current: stageEquipCount, max: MAX_EQUIPMENTS })}
            </p>
            {stageEquipments.map((eq) => {
              const isScanning = scanningIdxs.has(eq.realIdx)
              const isAnalyzed = !!(eq.kind || eq.brand || eq.model)
              return (
                <div key={eq.realIdx} className="relative w-full bg-white border-2 border-gray-300 rounded-xl p-2 shadow-sm">
                  <button
                    onClick={() => removeEquipPhoto(eq.realIdx)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-300 text-gray-600 rounded-full flex items-center justify-center shadow-sm z-10"
                    aria-label="remove"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    {/* 좌: 사진 */}
                    <button
                      onClick={() => setEquipLightboxIdx(eq.realIdx)}
                      className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-md overflow-hidden block"
                    >
                      <MediaImage
                        dataUrl={eq.photo}
                        storagePath={eq.storagePath}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {/* 우: 스펙 + 스캔 버튼 (분석 안된 카드만) */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-[11px] leading-tight overflow-hidden flex flex-col justify-center">
                      {isAnalyzed ? (
                        <>
                          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 content-start">
                            {eq.kind && (<><span className="text-gray-400 shrink-0">{t('scan.kind')}</span><span className="text-gray-900 font-medium truncate">{eq.kind}</span></>)}
                            {eq.brand && (<><span className="text-gray-400 shrink-0">{t('scan.brand')}</span><span className="text-gray-900 font-medium truncate">{eq.brand}</span></>)}
                            {eq.model && (<><span className="text-gray-400 shrink-0">{t('scan.model')}</span><span className="text-gray-900 font-medium truncate">{eq.model}</span></>)}
                            {eq.serial && (<><span className="text-gray-400 shrink-0">{t('scan.serial')}</span><span className="text-gray-900 font-medium truncate">{eq.serial}</span></>)}
                            {eq.capacity && (<><span className="text-gray-400 shrink-0">{t('scan.capacity')}</span><span className="text-gray-900 font-medium truncate">{eq.capacity}</span></>)}
                            {eq.refrigerant && (<><span className="text-gray-400 shrink-0">{t('scan.refrigerant')}</span><span className="text-gray-900 font-medium truncate">{eq.refrigerant}</span></>)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleScanOne(eq.realIdx)}
                            disabled={isScanning}
                            className="mt-1.5 self-end py-1 px-2 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-300 rounded active:bg-blue-100 disabled:opacity-60 flex items-center gap-1"
                          >
                            <Sparkles size={10} strokeWidth={2} />
                            {isScanning ? t('scan.analyzing') : t('knowhow.rescanBtn')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleScanOne(eq.realIdx)}
                          disabled={isScanning}
                          className="w-full py-2 px-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg active:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          <Sparkles size={12} strokeWidth={2} />
                          {isScanning ? t('scan.analyzing') : t('knowhow.scanBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {transcript && (
          <div>
            <p className="text-xs text-gray-400 mb-1">{t('knowhow.recognized')}</p>
            <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{transcript}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setTranscript('')} className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-xl text-gray-500">{t('knowhow.clear')}</button>
              <button
                onClick={handleAiClassify}
                disabled={aiLoading}
                className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} strokeWidth={1.5} />
                {aiLoading ? t('knowhow.aiClassifying') : t('knowhow.aiClassify')}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* 제목 — 1차/통합에서만 노출 */}
      {(stage == null || stage === 1) && (
      <Section title={t('knowhow.sectionTitle')}>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('knowhow.phTitle')}
          className="w-full text-sm text-gray-900 outline-none"
        />
      </Section>
      )}

      {/* 분류 — UI 숨김 (카메라 분석 결과로 자동 입력 예정) */}
      {SHOW_CHIP_INPUTS && (
        <Section title={t('knowhow.sectionCategory')}>
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5">{t('knowhow.categoryLabel')}</p>
            <div className="flex gap-1.5 flex-wrap">
              {KNOWHOW_CATEGORIES.map((c) => (
                <button key={c} onClick={() => set('category', c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
                  }`}>{t(`knowhow.${CATEGORY_KEY[c]}`, c)}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">{t('knowhow.locationLabel')}</p>
            <div className="flex gap-1.5 flex-wrap">
              {LOCATION_KEYS.map((key, i) => {
                const dbVal = LOCATION_DB_VALUES[i]
                return (
                  <button key={key} onClick={() => set('location', dbVal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.location === dbVal ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
                    }`}>{t(`knowhow.${key}`)}</button>
                )
              })}
            </div>
          </div>
        </Section>
      )}

      {/* 설비 분류 — UI 숨김 */}
      {SHOW_CHIP_INPUTS && (
        <Section title={t('knowhow.sectionEquip')}>
          <ChipGroup label={t('knowhow.chipCompressorType')} items={COMPRESSOR_TYPES} field="compressorType" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          <ChipGroup label={t('knowhow.chipCompressorStr')} items={COMPRESSOR_STRUCTURES} field="compressorStr" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          <ChipGroup label={t('knowhow.chipCoolingMethod')} items={COOLING_METHODS} field="coolingMethod" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          <ChipGroup label={t('knowhow.chipTempRange')} items={TEMP_RANGES} field="tempRange" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          <ChipGroup label={t('knowhow.chipRefrigerant')} items={REFRIGERANT_TYPES} field="refrigerant" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          {SYSTEM_TYPES.map(({ group, items }) => (
            <ChipGroup key={group} label={t(`knowhow.${EQUIP_KEY[group]}`, group)} items={items} field="systemType" form={form} set={set} single labelFn={(v) => t(`knowhow.${EQUIP_KEY[v]}`, v)} />
          ))}
        </Section>
      )}

      {/* 증상 키워드 — 1차/통합에서만, 1차는 textarea로 넉넉히 */}
      {(stage == null || stage === 1) && (
      <Section title={t('knowhow.sectionSymptoms')}>
        <p className="text-xs text-gray-400 mb-1.5">{t('knowhow.symptomsDesc')}</p>
        {stage === 1 ? (
          <textarea
            value={form.symptoms}
            onChange={(e) => set('symptoms', e.target.value)}
            placeholder={t('knowhow.phSymptoms')}
            rows={5}
            className="w-full text-sm text-gray-900 outline-none resize-y min-h-[6rem] [field-sizing:content]"
          />
        ) : (
          <input
            type="text"
            value={form.symptoms}
            onChange={(e) => set('symptoms', e.target.value)}
            placeholder={t('knowhow.phSymptoms')}
            className="w-full text-sm text-gray-900 outline-none"
          />
        )}
      </Section>
      )}

      {/* 원인 — 2차/통합에서만 */}
      {(stage == null || stage === 2) && (
      <Section title={t('knowhow.sectionCause')}>
        <textarea
          value={form.cause}
          onChange={(e) => set('cause', e.target.value)}
          placeholder={t('knowhow.phCause')}
          rows={4}
          className="w-full text-sm text-gray-900 outline-none resize-y min-h-[5rem] [field-sizing:content]"
        />
      </Section>
      )}

      {/* 점검 순서 — 2차/통합에서만 */}
      {(stage == null || stage === 2) && (
      <Section title={t('knowhow.sectionCheckSteps')}>
        <textarea
          value={form.checkSteps}
          onChange={(e) => set('checkSteps', e.target.value)}
          placeholder={t('knowhow.phCheckSteps')}
          rows={6}
          className="w-full text-sm text-gray-900 outline-none resize-y min-h-[8rem] [field-sizing:content]"
        />
      </Section>
      )}

      {/* 해결책 — 2차/통합에서만 */}
      {(stage == null || stage === 2) && (
      <Section title={t('knowhow.sectionSolution')}>
        <textarea
          value={form.solution}
          onChange={(e) => set('solution', e.target.value)}
          placeholder={t('knowhow.phSolution')}
          rows={4}
          className="w-full text-sm text-gray-900 outline-none resize-y min-h-[5rem] [field-sizing:content]"
        />
      </Section>
      )}

      {/* 교체 부품 — 2차/통합에서만 (여러 부품·모델명·규격 박을 수 있게 textarea) */}
      {(stage == null || stage === 2) && (
      <Section title={t('knowhow.sectionParts')}>
        <textarea
          value={form.parts}
          onChange={(e) => set('parts', e.target.value)}
          placeholder={t('knowhow.phParts')}
          rows={3}
          className="w-full text-sm text-gray-900 outline-none resize-y min-h-[4rem] [field-sizing:content]"
        />
      </Section>
      )}

      {/* 메모 — 2차/통합에서만 */}
      {(stage == null || stage === 2) && (
      <Section title={t('knowhow.sectionNotes')}>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('knowhow.phNotes')}
          rows={4}
          className="w-full text-sm text-gray-900 outline-none resize-y min-h-[5rem] [field-sizing:content]"
        />
      </Section>
      )}

      {/* 장비 사진 라이트박스 — 단계별 항목 내에서만 좌우 이동 */}
      {(() => {
        if (equipLightboxIdx == null) return null
        const cursor = stageEquipments.findIndex((eq) => eq.realIdx === equipLightboxIdx)
        if (cursor < 0) return null
        const cur = stageEquipments[cursor]
        const prev = stageEquipments[cursor - 1]
        const next = stageEquipments[cursor + 1]
        return (
          <div
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
            onClick={() => setEquipLightboxIdx(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(null) }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              <X size={20} strokeWidth={2} />
            </button>
            {prev && (
              <button
                onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(prev.realIdx) }}
                className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-white text-2xl"
              >
                ‹
              </button>
            )}
            {next && (
              <button
                onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(next.realIdx) }}
                className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-white text-2xl"
              >
                ›
              </button>
            )}
            <MediaImage
              dataUrl={cur.photo}
              storagePath={cur.storagePath}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 text-white/70 text-xs">
              {cursor + 1} / {stageEquipments.length}
            </div>
          </div>
        )
      })()}

    </div>
  )
}

function Row({ k, v, bold }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-gray-500 shrink-0">{k}:</span>
      <span className={bold ? 'font-bold text-blue-700' : 'text-gray-800'}>{v}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm space-y-3">
        {children}
      </div>
    </div>
  )
}

function ChipGroup({ label, items, field, form, set, single, labelFn }) {
  const selected = form[field] ? form[field].split(',').map(s => s.trim()).filter(Boolean) : []
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {items.map((item) => {
          const isSelected = selected.includes(item)
          return (
            <button
              key={item}
              onClick={() => {
                if (single) {
                  set(field, isSelected ? '' : item)
                } else {
                  const next = isSelected ? selected.filter(s => s !== item) : [...selected, item]
                  set(field, next.join(', '))
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isSelected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
              }`}
            >
              {labelFn ? labelFn(item) : item}
            </button>
          )
        })}
      </div>
    </div>
  )
}
