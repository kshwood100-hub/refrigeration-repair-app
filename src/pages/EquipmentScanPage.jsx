import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Camera, Loader, RotateCw, AlertCircle } from 'lucide-react'
import { scanEquipment } from '../utils/scanEquipment'
import { showToast } from '../utils/toast'

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
  const autoOpenedRef = useRef(false)

  const [photoUrl, setPhotoUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (!autoOpenedRef.current) {
      autoOpenedRef.current = true
      setTimeout(() => fileRef.current?.click(), 150)
    }
  }, [])

  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPhotoUrl(dataUrl)
      setResult(null)
      setErrMsg('')
      setScanning(true)
      try {
        const r = await scanEquipment(dataUrl)
        setResult(r)
      } catch (err) {
        setErrMsg(err.message || String(err))
        showToast(t('scan.err') + (err.message || ''))
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function retry() {
    setPhotoUrl('')
    setResult(null)
    setErrMsg('')
    fileRef.current?.click()
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
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
        <h2 className="text-base font-semibold text-gray-900">{t('scan.title')}</h2>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
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

      {/* 빈 상태 — 자동 트리거 실패 시 */}
      {!photoUrl && !scanning && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Camera size={52} strokeWidth={1} className="mb-4 opacity-30" />
          <p className="text-sm mb-4 text-center px-6">{t('scan.emptyDesc')}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-xl active:bg-blue-700"
          >
            <Camera size={16} strokeWidth={2} />
            {t('scan.takePhoto')}
          </button>
        </div>
      )}

      {/* 액션 */}
      {(result || errMsg) && !scanning && (
        <div className="flex gap-2 mt-2">
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
      )}
    </div>
  )
}
