import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Camera, Loader, RotateCw, AlertCircle, Sparkles, Building2 } from 'lucide-react'
import { scanEquipment } from '../utils/scanEquipment'
import { showToast } from '../utils/toast'
import { db } from '../db'
import { captureAttr } from '../utils/deviceCapture'

const TEMP_KEYS = {
  low_temp: 'scan.tempLow',
  medium_temp: 'scan.tempMedium',
  high_temp: 'scan.tempHigh',
  unknown: 'scan.tempUnknown',
}
const STAGE_KEYS = {
  single: 'scan.stageSingle',
  two_stage: 'scan.stageTwo',
  unknown: 'scan.stageUnknown',
}
const CONF_KEYS = {
  high: 'scan.confHigh',
  medium: 'scan.confMedium',
  low: 'scan.confLow',
}
const KIND_KEYS = {
  compressor:    'scan.kindCompressor',
  condenser:     'scan.kindCondenser',
  evaporator:    'scan.kindEvaporator',
  chiller:       'scan.kindChiller',
  freezer:       'scan.kindFreezer',
  AHU:           'scan.kindAHU',
  pump:          'scan.kindPump',
  motor:         'scan.kindMotor',
  control_panel: 'scan.kindControlPanel',
  piping:        'scan.kindPiping',
  other:         'scan.kindOther',
}

export default function EquipmentScanPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileRef = useRef()

  const [photoUrl, setPhotoUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')
  const [savedRowId, setSavedRowId] = useState(null)  // 사진 박힌 직후 자동 저장 박힌 row id (분석 통과 후 update 박힘)

  // 거래처 선택 (필수) — knowhow / 음성메모 패턴과 통일.
  // AI 비용 발생 전에 거래처 결정 + 분석 후 저장 흐름 명확화.
  const [customerId, setCustomerId] = useState(null)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  const customers = useLiveQuery(
    () => db.customers.orderBy('name').filter((r) => !r.deletedAt).toArray(),
    []
  )

  // 사진 박힘 → 자동 저장 박힘 (분석 X 박힌 채 = name 측 일반 라벨). 분석 X 박을지 = 사용자 선택.
  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!customerId) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPhotoUrl(dataUrl)
      setResult(null)
      setErrMsg('')
      const customer = customers?.find((c) => c.id === customerId)
      if (!customer) return
      // 자동 저장 (분석 X 박힌 채 = name 측 일반 라벨)
      try {
        const newId = await db.equipment_maintenance.add({
          customerId: customer.id,
          name: t('scan.kindOther'),
          photoUrl: dataUrl,
          intervalMonths: null,
          lastCheckedDate: null,
          nextDueDate: null,
          kind: null,
          brand: null,
          model: null,
          serial: null,
          capacity: null,
          refrigerant: null,
          tempClass: null,
          stage: null,
          notes: null,
        })
        setSavedRowId(newId)
        showToast(t('scan.savedToast', { name: customer.name }))
      } catch (err) {
        setErrMsg(err.message || String(err))
        showToast(t('scan.err') + (err.message || ''))
      }
    }
    reader.readAsDataURL(file)
  }

  function retry() {
    setPhotoUrl('')
    setResult(null)
    setErrMsg('')
    setSavedRowId(null)
    fileRef.current?.click()
  }

  // [분석] 클릭 시 = AI 분석 박힘 + 저장된 row update (= brand / model 등 자동 채움)
  async function handleAnalyze() {
    if (!photoUrl || !savedRowId || scanning) return
    setScanning(true)
    setErrMsg('')
    try {
      const r = await scanEquipment(photoUrl)
      setResult(r)
      const equipName = [r.brand, r.model].filter(Boolean).join(' ') || t('scan.kindOther')
      await db.equipment_maintenance.update(savedRowId, {
        name: equipName,
        kind: r.kind ?? null,
        brand: r.brand ?? null,
        model: r.model ?? null,
        serial: r.serial ?? null,
        capacity: r.capacity ?? null,
        refrigerant: r.refrigerant ?? null,
        tempClass: r.tempClass ?? null,
        stage: r.stage ?? null,
        notes: r.notes ?? null,
      })
    } catch (err) {
      setErrMsg(err.message || String(err))
      showToast(t('scan.err') + (err.message || ''))
    } finally {
      setScanning(false)
    }
  }

  const rows = result ? [
    { label: t('scan.kind'),        value: t(KIND_KEYS[result.kind] ?? 'scan.kindOther') },
    { label: t('scan.tempClass'),   value: t(TEMP_KEYS[result.tempClass] ?? 'scan.tempUnknown'), highlight: true },
    { label: t('scan.stage'),       value: t(STAGE_KEYS[result.stage] ?? 'scan.stageUnknown'), highlight: true },
    { label: t('scan.brand'),       value: result.brand || '-' },
    { label: t('scan.model'),       value: result.model || '-' },
    { label: t('scan.serial'),      value: result.serial || '-' },
    { label: t('scan.capacity'),    value: result.capacity || '-' },
    { label: t('scan.refrigerant'), value: result.refrigerant || '-' },
    { label: t('scan.confidence'),  value: t(CONF_KEYS[result.confidence] ?? 'scan.confLow') },
  ] : []

  return (
    <div className="p-4 pb-10">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">{t('scan.title')}</h2>
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        {...captureAttr()}
        className="hidden"
        onChange={handleCapture}
      />

      {/* 사진 */}
      {photoUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center">
          <img src={photoUrl} alt="" className="w-full max-h-56 object-contain" />
        </div>
      )}

      {/* 분석 중 */}
      {scanning && (
        <div className="flex items-center justify-center gap-2 py-4 mb-3 text-blue-700 text-sm bg-blue-50 rounded-xl border border-blue-200">
          <Loader size={16} className="animate-spin" strokeWidth={2} />
          {t('scan.analyzing')}
        </div>
      )}

      {/* 오류 */}
      {errMsg && !scanning && (
        <div className="flex items-start gap-2 py-3 px-4 mb-3 bg-amber-50 border border-amber-300 rounded-xl">
          <AlertCircle size={16} strokeWidth={2} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{errMsg}</p>
        </div>
      )}

      {/* 결과 */}
      {result && !scanning && (
        <>
          <div className="bg-white border border-gray-300 rounded-xl p-4 mb-3 shadow-sm">
            <div className="space-y-2.5">
              {rows.map(({ label, value, highlight }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-gray-400 shrink-0">{label}</span>
                  <span className={`text-sm text-right ${
                    highlight
                      ? 'font-bold text-blue-700'
                      : 'font-medium text-gray-900'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result.notes && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">{t('scan.notes')}</p>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{result.notes}</p>
            </div>
          )}
        </>
      )}

      {/* 빈 상태 — 거래처 선택해야 [사진 찍기] 버튼 활성 */}
      {!photoUrl && !scanning && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Camera size={52} strokeWidth={1} className="mb-4 opacity-30" />
          <p className="text-sm mb-4 text-center px-6">
            {customerId ? t('scan.emptyDesc') : t('knowhow.errCustomer')}
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!customerId}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-xl active:bg-blue-700 disabled:opacity-50"
          >
            <Camera size={16} strokeWidth={2} />
            {t('scan.takePhoto')}
          </button>
        </div>
      )}

      {/* 액션 — 사진 박힌 후 항상 표시 (result X 박힌 채도 [분석] 버튼 박힘) */}
      {photoUrl && !scanning && (
        <>
          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={!savedRowId}
              className="w-full py-3 mb-2 text-sm font-bold bg-violet-600 text-white rounded-xl flex items-center justify-center gap-1.5 active:bg-violet-700 disabled:opacity-50"
            >
              <Sparkles size={15} strokeWidth={2} />
              {t('scan.btnAnalyze')}
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={retry}
              className="flex-1 py-3 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 flex items-center justify-center gap-1.5 bg-white"
            >
              <RotateCw size={14} strokeWidth={2} />
              {t('scan.retry')}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 text-sm font-medium bg-gray-900 text-white rounded-xl"
            >
              {t('scan.close')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
