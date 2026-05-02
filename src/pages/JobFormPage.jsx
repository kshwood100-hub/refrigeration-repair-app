import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Camera, X, Users, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { requestNotificationPermission } from '../utils/alarmManager'
import KnowhowFormBody, { EMPTY_KNOWHOW } from '../components/KnowhowFormBody'
import DateInput from '../components/DateInput'
import TrialLimitModal from '../components/TrialLimitModal'
import CustomerPickerModal from '../components/CustomerPickerModal'
import { consumeTrial } from '../utils/trial'
import { todayLocal } from '../utils/date'

const today = todayLocal

const EMPTY_JOB = {
  status: 'received',
  receiptDate: today(),
  visitDate: '',
  visitTime: '',
  symptoms: '',  // (옛 symptom)
  partsCost: '',
  laborCost: '',
}

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', email: '' }

const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'))
const MINS  = ['00', '10', '20', '30', '40', '50']

export default function JobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const isNew = !id

  const existingJob = useLiveQuery(
    () => id ? db.service_jobs.get(Number(id)) : undefined, [id]
  )
  const existingCustomer = useLiveQuery(
    () => existingJob?.customerId ? db.customers.get(existingJob.customerId) : undefined,
    [existingJob?.customerId]
  )
  const allCustomers = useLiveQuery(() => db.customers.orderBy('name').filter((r) => !r.deletedAt).toArray(), [])

  const [job, setJob] = useState(EMPTY_JOB)
  const [knowhow, setKnowhow] = useState(EMPTY_KNOWHOW)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [photos, setPhotos] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [alarmDate, setAlarmDate] = useState('')
  const [alarmTime, setAlarmTime] = useState('')
  const [trialBlocked, setTrialBlocked] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const preloadCustomerId = location.state?.customerId
  const preloadCustomer = useLiveQuery(
    () => preloadCustomerId ? db.customers.get(preloadCustomerId) : undefined,
    [preloadCustomerId]
  )
  useEffect(() => {
    if (isNew && preloadCustomer && !initialized) {
      setCustomer({
        name: preloadCustomer.name ?? '',
        phone: preloadCustomer.phone ?? '',
        address: preloadCustomer.address ?? '',
        email: preloadCustomer.email ?? '',
      })
      setInitialized(true)
    }
  }, [isNew, preloadCustomer, initialized])

  // existingCustomer 매칭 안 되더라도 (stale customerId) job 데이터는 초기화 — 데이터 손실 방지
  if (!isNew && existingJob && !initialized) {
    setJob({
      status:      existingJob.status      ?? 'received',
      receiptDate: existingJob.receiptDate ?? today(),
      visitDate:   existingJob.visitDate   ?? '',
      visitTime:   existingJob.visitTime   ?? '',
      symptoms:    existingJob.symptoms    ?? existingJob.symptom ?? '',
      partsCost:   existingJob.partsCost   ?? '',
      laborCost:   existingJob.laborCost   ?? '',
    })
    setKnowhow({
      title:          existingJob.title          ?? '',
      category:       existingJob.category       ?? '기타',
      location:       existingJob.location       ?? '기타',
      compressorType: existingJob.compressorType ?? '',
      compressorStr:  existingJob.compressorStr  ?? '',
      coolingMethod:  existingJob.coolingMethod  ?? '',
      tempRange:      existingJob.tempRange      ?? '',
      refrigerant:    existingJob.refrigerant    ?? '',
      systemType:     existingJob.systemType     ?? '',
      symptoms:       existingJob.symptoms       ?? existingJob.symptom   ?? '',
      cause:          existingJob.cause          ?? existingJob.diagnosis ?? '',
      checkSteps:     existingJob.checkSteps     ?? '',
      solution:       existingJob.solution       ?? existingJob.workDone  ?? '',
      parts:          existingJob.parts          ?? existingJob.materials ?? '',
      notes:          existingJob.notes          ?? '',
    })
    if (existingCustomer) {
      setCustomer({
        name:    existingCustomer.name    ?? '',
        phone:   existingCustomer.phone   ?? '',
        address: existingCustomer.address ?? '',
        email:   existingCustomer.email   ?? '',
      })
    }
    setInitialized(true)
  }

  function setJ(field, val) { setJob((p) => ({ ...p, [field]: val })) }

  const totalCost = (Number(job.partsCost) || 0) + (Number(job.laborCost) || 0)

  function compressImage(file) {
    return new Promise((resolve) => {
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
      img.src = url
    })
  }

  async function handlePhoto(e) {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const dataUrl = await compressImage(file)
      setPhotos((p) => [...p, { dataUrl, caption: '' }])
    }
    e.target.value = ''
  }

  function selectCustomer(c) {
    setCustomer({ name: c.name, phone: c.phone, address: c.address ?? '', email: c.email ?? '' })
    setSelectedCustomerId(c.id)
    setShowCustomerList(false)
    setCustomerSearch('')
  }

  // 모달에서 거래처 선택
  function handlePickCustomer(c) {
    selectCustomer(c)
  }

  async function handleSave() {
    if (saving) return // 중복 클릭 차단
    if ((alarmDate && !alarmTime) || (!alarmDate && alarmTime)) {
      showToast(t('userAlarm.dateTimeRequired')); return
    }

    setSaving(true)
    try {
      await doSave()
    } catch (e) {
      console.error('Save failed:', e)
      showToast(String(e?.message || e))
      setSaving(false)
    }
  }

  async function doSave() {
    if (isNew) {
      try {
        await consumeTrial('jobs')
      } catch (e) {
        if (String(e?.message || e).includes('Trial limit')) {
          setTrialBlocked('jobs')
          setSaving(false)
          return
        }
      }
    }

    let customerId
    if (isNew) {
      // 신규 AS는 반드시 기존(혹은 방금 등록한) 거래처 선택 필수.
      // 거래처 신규 등록은 별도 폼(/customers/new)에서만.
      customerId = selectedCustomerId ?? preloadCustomerId ?? null
      if (!customerId) {
        showToast(t('job.selectCustomerRequired'))
        setSaving(false)
        return
      }
    } else {
      // 편집: 거래처 정보는 절대 수정 안 함 (CustomerDetailPage 담당).
      // 사용자가 거래처 변경 버튼으로 다른 거래처 선택했으면 customerId만 갈아끼움.
      customerId = selectedCustomerId ?? existingJob?.customerId ?? null
      if (!customerId) {
        showToast(t('job.staleCustomerError') || 'Customer required')
        setSaving(false)
        return
      }
    }

    // 명시적 picking — spread로 우발적 함수 prop 박힘 방지 + JSON 통과로 한 번 더 정리
    const rawJobData = {
      customerId,
      status:         isNew ? 'received' : job.status,
      receiptDate:    job.receiptDate || '',
      visitDate:      job.visitDate || '',
      visitTime:      job.visitTime || '',
      partsCost:      Number(job.partsCost) || 0,
      laborCost:      Number(job.laborCost) || 0,
      cost:           totalCost,
      updatedAt:      new Date().toISOString(),
      title:          knowhow.title || '',
      category:       knowhow.category || '',
      location:       knowhow.location || '',
      compressorType: knowhow.compressorType || '',
      compressorStr:  knowhow.compressorStr || '',
      coolingMethod:  knowhow.coolingMethod || '',
      tempRange:      knowhow.tempRange || '',
      refrigerant:    knowhow.refrigerant || '',
      systemType:     knowhow.systemType || '',
      symptoms:       knowhow.symptoms || '',
      cause:          knowhow.cause || '',
      checkSteps:     knowhow.checkSteps || '',
      solution:       knowhow.solution || '',
      parts:          knowhow.parts || '',
      notes:          knowhow.notes || '',
      equipPhotos:    Array.isArray(knowhow.equipPhotos) ? knowhow.equipPhotos.filter((p) => typeof p === 'string') : [],
      equipments:     Array.isArray(knowhow.equipments)  ? knowhow.equipments.filter((eq) => eq && typeof eq === 'object')  : [],
    }
    const jobData = JSON.parse(JSON.stringify(rawJobData))

    let jobId
    if (isNew) {
      jobData.createdAt = new Date().toISOString()
      jobId = await db.service_jobs.add(jobData)
    } else {
      await db.service_jobs.update(Number(id), jobData)
      jobId = Number(id)
    }

    for (const photo of photos) {
      await db.job_photos.add({ jobId, dataUrl: photo.dataUrl, caption: photo.caption, takenAt: new Date().toISOString() })
    }

    if (alarmDate && alarmTime) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        showToast(t('userAlarm.permissionDenied'))
      } else {
        await db.user_alarms.add({
          title: `${customer.name.trim()} - ${knowhow.symptoms || t('job.sectionReceipt')}`,
          date: alarmDate,
          time: alarmTime,
          note: job.visitDate ? `${t('job.visitPrefix')} ${job.visitDate}` : '',
          jobId,
          customerId,
          fired: 0,
          createdAt: new Date().toISOString(),
        })
      }
    }

    navigate('/service', { replace: true })
  }

  const filteredCustomers = (allCustomers ?? []).filter((c) =>
    c.name.includes(customerSearch) || c.phone.includes(customerSearch)
  )

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">{t('job.back')}</span>
        </button>
        {/* 신규 진입 시 타이틀 생략(고객등록 → AS접수 흐름이라 중복 표시 불필요), 편집 모드에선 표시 */}
        {isNew ? <div /> : <h2 className="text-base font-semibold text-gray-900">{t('job.editTitle')}</h2>}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-3 py-1.5 text-white text-sm font-bold rounded-lg shadow-sm ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 active:bg-emerald-700'}`}
        >
          {saving ? t('common.saving') : (isNew ? t('job.newTitle') : t('job.save'))}
        </button>
      </div>

      <div className="space-y-4">

        {/* 고객 정보 */}
        <Section title={t('job.sectionCustomer')}>
          {isNew ? (
            <>
              {/* 신규 AS는 거래처 선택만. 신규 거래처 등록은 별도 폼으로 이동. */}
              {(selectedCustomerId || preloadCustomerId) && customer.name ? (
                <div className="bg-white border border-gray-300 rounded-xl p-3 mb-2">
                  <div className="text-xs text-gray-400 mb-1">{t('job.currentCustomer')}</div>
                  <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                  {customer.phone && <div className="text-xs text-gray-500 mt-0.5">{customer.phone}</div>}
                  {customer.address && <div className="text-xs text-gray-500 mt-0.5">{customer.address}</div>}
                  <button
                    onClick={() => setShowCustomerList(true)}
                    className="mt-2 text-xs font-medium text-blue-600 active:text-blue-800"
                  >
                    {t('job.changeCustomer')}
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-2">
                  <div className="text-xs text-amber-700 font-bold mb-2">{t('job.noCustomerSelected')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowCustomerList(true)}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-lg active:bg-blue-700 shadow-sm"
                    >
                      <Users size={14} strokeWidth={2} />
                      {t('job.selectExistingBtn')}
                    </button>
                    <button
                      onClick={() => navigate('/customers/new', { state: { returnTo: '/service/new' } })}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-lg active:bg-emerald-700 shadow-sm"
                    >
                      <Users size={14} strokeWidth={2} />
                      {t('job.newCustomerBtn')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 편집: 거래처는 표시 + 변경 버튼만 (모달). 거래처 정보 자체 수정은 거래처 상세 페이지에서. */}
              {existingCustomer ? (
                <div className="bg-white border border-gray-300 rounded-xl p-3 mb-2">
                  <div className="text-xs text-gray-400 mb-1">{t('job.currentCustomer')}</div>
                  <div className="text-sm font-bold text-gray-900">
                    {selectedCustomerId ? customer.name : existingCustomer.name}
                  </div>
                  {(selectedCustomerId ? customer.phone : existingCustomer.phone) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedCustomerId ? customer.phone : existingCustomer.phone}
                    </div>
                  )}
                  {selectedCustomerId && (
                    <div className="mt-2 text-[11px] text-blue-600 font-bold">
                      {t('job.willChangeOnSave')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3 mb-2">
                  <div className="text-sm font-bold text-red-600">⚠ {t('service.staleCustomer')}</div>
                  <div className="text-xs text-red-500 mt-1">{t('job.stalePickHint')}</div>
                  {selectedCustomerId && (
                    <div className="mt-2 p-2 bg-white rounded border border-red-200">
                      <div className="text-xs text-gray-400 mb-0.5">{t('job.willChangeTo')}</div>
                      <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                      {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowCustomerList(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg px-3 py-2.5 active:bg-blue-700 shadow-sm"
              >
                <Users size={14} strokeWidth={2} />
                {t('service.fixCustomerBtn')}
              </button>
            </>
          )}
        </Section>

        {/* 의뢰 정보 */}
        <Section title={t('job.sectionRequest')}>
          <Field label={t('job.labelReceiptDate')} value={job.receiptDate} onChange={(v) => setJ('receiptDate', v)} type="date" />
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">{t('job.labelVisitSchedule')}</label>
            <DateInput value={job.visitDate} onChange={(v) => setJ('visitDate', v)} />
          </div>
          <TimeSelect
            label={t('job.labelVisitTime')}
            optionalLabel={t('job.labelOptional')}
            hourLabel={t('job.hourLabel')}
            minLabel={t('job.minLabel')}
            hourUnit={t('job.hourUnit')}
            minUnit={t('job.minUnit')}
            value={job.visitTime}
            onChange={(v) => setJ('visitTime', v)}
          />
          <div className="pt-1">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1">
              <Bell size={12} strokeWidth={1.5} />
              {t('userAlarm.setForJob')} <span className="text-gray-400 font-normal">{t('job.labelOptional')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <DateInput
                value={alarmDate}
                onChange={(v) => {
                  setAlarmDate(v)
                  if (v && !alarmTime && job.visitTime) setAlarmTime(job.visitTime)
                }}
              />
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>
            {alarmDate && job.visitDate && alarmDate !== job.visitDate && (
              <p className="text-xs text-amber-600 mt-1">{t('job.visitPrefix')}: {job.visitDate}</p>
            )}
          </div>
        </Section>

        {/* 신규: 간단 증상만 */}
        {isNew && (
          <Section title={t('job.sectionFaultHistory')}>
            <Textarea label={t('job.labelSymptom')} value={knowhow.symptoms} onChange={(v) => setKnowhow((p) => ({ ...p, symptoms: v }))} placeholder={t('job.phSymptom')} />
          </Section>
        )}

        {/* 새 의뢰 저장 버튼 */}
        {isNew && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 text-white text-base font-semibold rounded-xl border-2 shadow-md ${saving ? 'bg-gray-400 border-gray-300 cursor-not-allowed' : 'bg-slate-700 border-slate-400 active:bg-slate-600'}`}
          >
            {saving ? t('common.saving') : t('job.save')}
          </button>
        )}

        {/* 편집 모드 전용 필드 */}
        {!isNew && (
          <>
            {/* 설비/고장 정보 (공통 폼) */}
            <KnowhowFormBody form={knowhow} setForm={setKnowhow} hideCustomer />

            <Section title={t('job.sectionCost')}>
              <Field label={t('job.labelPartsCost')} value={job.partsCost} onChange={(v) => setJ('partsCost', v)} decimal placeholder="0" />
              <Field label={t('job.labelLaborCost')} value={job.laborCost} onChange={(v) => setJ('laborCost', v)} decimal placeholder="0" />
              {(job.partsCost || job.laborCost) && (
                <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg flex justify-between text-sm font-semibold">
                  <span className="text-gray-500">{t('job.labelTotal')}</span>
                  <span className="text-gray-900">{totalCost.toLocaleString()}</span>
                </div>
              )}
            </Section>

            <Section title={t('job.sectionPhotos')}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-24 h-24">
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50">
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-xs">{t('job.photoCapture')}</span>
                </button>
              </div>
            </Section>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-4 text-white text-base font-semibold rounded-xl border-2 shadow-md ${saving ? 'bg-gray-400 border-gray-300 cursor-not-allowed' : 'bg-slate-700 border-slate-400 active:bg-slate-600'}`}
            >
              {saving ? t('common.saving') : t('job.save')}
            </button>
          </>
        )}

      </div>
      {trialBlocked && <TrialLimitModal category={trialBlocked} onClose={() => setTrialBlocked(null)} />}
      <CustomerPickerModal
        open={showCustomerList}
        customers={allCustomers}
        onSelect={handlePickCustomer}
        onClose={() => setShowCustomerList(false)}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 space-y-3 shadow-sm">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, decimal = false }) {
  if (type === 'date') {
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
        <DateInput value={value} onChange={onChange} placeholder={placeholder} />
      </div>
    )
  }
  if (decimal) {
    const display = value === '' || value == null ? '' : (() => {
      const [int, dec] = String(value).split('.')
      const intF = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return dec !== undefined ? `${intF}.${dec}` : intF
    })()
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
        <input
          type="text"
          inputMode="decimal"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1')
            onChange(raw)
          }}
          placeholder={placeholder}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
        />
      </div>
    )
  }
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400" />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none" />
    </div>
  )
}

function TimeSelect({ label, optionalLabel, hourLabel, minLabel, hourUnit, minUnit, value, onChange }) {
  const [h, m] = value ? value.split(':') : ['', '']

  function update(newH, newM) {
    if (!newH && !newM) { onChange(''); return }
    onChange(`${newH || '09'}:${newM || '00'}`)
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">
        {label} <span className="text-gray-400 font-normal">{optionalLabel}</span>
      </label>
      <div className="flex gap-2">
        <select
          value={h ?? ''}
          onChange={(e) => update(e.target.value, m)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">{hourLabel}</option>
          {HOURS.map((hh) => <option key={hh} value={hh}>{hh}{hourUnit}</option>)}
        </select>
        <select
          value={m ?? ''}
          onChange={(e) => update(h, e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">{minLabel}</option>
          {MINS.map((mm) => <option key={mm} value={mm}>{mm}{minUnit}</option>)}
        </select>
      </div>
    </div>
  )
}
