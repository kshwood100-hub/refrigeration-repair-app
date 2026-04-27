import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Sparkles, Camera, X, Building2 } from 'lucide-react'
import { db } from '../db'
import {
  KNOWHOW_CATEGORIES, COMPRESSOR_TYPES, COMPRESSOR_STRUCTURES,
  COOLING_METHODS, TEMP_RANGES, REFRIGERANT_TYPES, SYSTEM_TYPES,
} from '../data/refrigerationTypes'
import { showToast } from '../utils/toast'
import { scanEquipment } from '../utils/scanEquipment'
import { apiFetch } from '../utils/apiClient'

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
  equipPhotos:    [],
}

export default function KnowhowFormBody({ form, setForm }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  // 거래처 목록 (id, name)
  const customers = useLiveQuery(
    () => db.customers.orderBy('name').toArray(), []
  )

  const [showCustomerList, setShowCustomerList] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [equipResult, setEquipResult] = useState(null)
  const [equipLoading, setEquipLoading] = useState(false)
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

  function triggerEquipScan() {
    equipFileRef.current?.click()
  }

  async function handleEquipFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setEquipLoading(true)
    try {
      const dataUrl = await compressImage(file)
      setForm((p) => ({ ...p, equipPhotos: [...(p.equipPhotos ?? []), dataUrl] }))
      const r = await scanEquipment(dataUrl)
      setEquipResult(r)
    } catch (err) {
      showToast(t('knowhow.errAi') + err.message)
    } finally {
      setEquipLoading(false)
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
    setForm((p) => ({ ...p, equipPhotos: (p.equipPhotos ?? []).filter((_, i) => i !== idx) }))
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
        setForm((p) => ({
          ...p,
          title:      r.title      || p.title,
          category:   KNOWHOW_CATEGORIES.includes(r.category) ? r.category : p.category,
          location:   LOCATION_DB_VALUES.includes(r.location)  ? r.location  : p.location,
          symptoms:   r.symptoms   || p.symptoms,
          cause:      r.cause      || p.cause,
          checkSteps: r.checkSteps || p.checkSteps,
          solution:   r.solution   || p.solution,
          parts:      r.parts      || p.parts,
          notes:      r.notes      || p.notes,
        }))
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

      {/* 거래처 선택 (필수) */}
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

      {/* 음성/카메라 입력 */}
      <Section title={t('knowhow.voiceInput')}>
        <p className="text-xs text-gray-400">{t('knowhow.voiceDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={triggerEquipScan}
            disabled={equipLoading}
            className="py-3 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-1 bg-emerald-600 text-white disabled:opacity-60 active:bg-emerald-700 text-center leading-tight"
          >
            <Camera size={18} strokeWidth={1.8} />
            <span>{equipLoading ? t('scan.analyzing') : t('camera.equipment')}</span>
          </button>
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
        <input
          ref={equipFileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleEquipFile}
          className="hidden"
        />
        {equipResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs text-gray-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-emerald-800">{t('scan.title')}</span>
              <button onClick={() => setEquipResult(null)} className="text-gray-400 active:text-gray-600">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-0.5">
              {equipResult.kind        && <Row k={t('scan.kind')}        v={equipResult.kind} />}
              {equipResult.brand       && <Row k={t('scan.brand')}       v={equipResult.brand} />}
              {equipResult.model       && <Row k={t('scan.model')}       v={equipResult.model} />}
              {equipResult.serial      && <Row k={t('scan.serial')}      v={equipResult.serial} />}
              {equipResult.capacity    && <Row k={t('scan.capacity')}    v={equipResult.capacity} />}
              {equipResult.tempClass   && <Row k={t('scan.tempClass')}   v={equipResult.tempClass} bold />}
              {equipResult.stage       && <Row k={t('scan.stage')}       v={equipResult.stage} bold />}
              {equipResult.refrigerant && <Row k={t('scan.refrigerant')} v={equipResult.refrigerant} />}
              {equipResult.confidence  && <Row k={t('scan.confidence')}  v={equipResult.confidence} />}
            </div>
            {equipResult.notes && (
              <p className="mt-2 text-gray-600 leading-snug">{equipResult.notes}</p>
            )}
          </div>
        )}
        {(form.equipPhotos ?? []).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {form.equipPhotos.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => removeEquipPhoto(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            ))}
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

      {/* 제목 */}
      <Section title={t('knowhow.sectionTitle')}>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('knowhow.phTitle')}
          className="w-full text-sm text-gray-900 outline-none"
        />
      </Section>

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

      {/* 증상 키워드 */}
      <Section title={t('knowhow.sectionSymptoms')}>
        <p className="text-xs text-gray-400 mb-1.5">{t('knowhow.symptomsDesc')}</p>
        <input
          type="text"
          value={form.symptoms}
          onChange={(e) => set('symptoms', e.target.value)}
          placeholder={t('knowhow.phSymptoms')}
          className="w-full text-sm text-gray-900 outline-none"
        />
      </Section>

      {/* 원인 */}
      <Section title={t('knowhow.sectionCause')}>
        <textarea
          value={form.cause}
          onChange={(e) => set('cause', e.target.value)}
          placeholder={t('knowhow.phCause')}
          rows={2}
          className="w-full text-sm text-gray-900 outline-none resize-none"
        />
      </Section>

      {/* 점검 순서 */}
      <Section title={t('knowhow.sectionCheckSteps')}>
        <textarea
          value={form.checkSteps}
          onChange={(e) => set('checkSteps', e.target.value)}
          placeholder={t('knowhow.phCheckSteps')}
          rows={4}
          className="w-full text-sm text-gray-900 outline-none resize-none"
        />
      </Section>

      {/* 해결책 */}
      <Section title={t('knowhow.sectionSolution')}>
        <textarea
          value={form.solution}
          onChange={(e) => set('solution', e.target.value)}
          placeholder={t('knowhow.phSolution')}
          rows={2}
          className="w-full text-sm text-gray-900 outline-none resize-none"
        />
      </Section>

      {/* 교체 부품 */}
      <Section title={t('knowhow.sectionParts')}>
        <input
          type="text"
          value={form.parts}
          onChange={(e) => set('parts', e.target.value)}
          placeholder={t('knowhow.phParts')}
          className="w-full text-sm text-gray-900 outline-none"
        />
      </Section>

      {/* 메모 */}
      <Section title={t('knowhow.sectionNotes')}>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('knowhow.phNotes')}
          rows={2}
          className="w-full text-sm text-gray-900 outline-none resize-none"
        />
      </Section>

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
