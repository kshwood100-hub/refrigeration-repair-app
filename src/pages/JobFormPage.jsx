import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Camera, X, Users, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { requestNotificationPermission } from '../utils/alarmManager'
import KnowhowFormBody, { EMPTY_KNOWHOW } from '../components/KnowhowFormBody'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_JOB = {
  status: 'received',
  receiptDate: today(),
  visitDate: '',
  visitTime: '',
  symptoms: '',  // (옛 symptom)
  partsCost: '',
  laborCost: '',
}

const EMPTY_CUSTOMER = { name: '', phone: '', address: '' }

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
  const allCustomers = useLiveQuery(() => db.customers.orderBy('name').toArray(), [])

  const [job, setJob] = useState(EMPTY_JOB)
  const [knowhow, setKnowhow] = useState(EMPTY_KNOWHOW)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [photos, setPhotos] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [alarmDate, setAlarmDate] = useState('')
  const [alarmTime, setAlarmTime] = useState('')
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
      })
      setInitialized(true)
    }
  }, [isNew, preloadCustomer, initialized])

  if (!isNew && existingJob && existingCustomer && !initialized) {
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
    setCustomer({
      name:    existingCustomer.name    ?? '',
      phone:   existingCustomer.phone   ?? '',
      address: existingCustomer.address ?? '',
    })
    setInitialized(true)
  }

  function setJ(field, val) { setJob((p) => ({ ...p, [field]: val })) }
  function setC(field, val) { setCustomer((p) => ({ ...p, [field]: val })) }

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
    setCustomer({ name: c.name, phone: c.phone, address: c.address ?? '' })
    setShowCustomerList(false)
    setCustomerSearch('')
  }

  async function handleSave() {
    if (!customer.name.trim()) { showToast(t('job.labelCustomerName').replace(' *', '') + ' required'); return }
    if ((alarmDate && !alarmTime) || (!alarmDate && alarmTime)) {
      showToast(t('userAlarm.dateTimeRequired')); return
    }

    let customerId = isNew ? (preloadCustomerId ?? null) : existingJob?.customerId
    if (!customerId) {
      customerId = await db.customers.add({
        name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
      })
    } else {
      await db.customers.update(customerId, {
        name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
      })
    }

    const jobData = {
      customerId,
      status:      isNew ? 'received' : job.status,
      receiptDate: job.receiptDate,
      visitDate:   job.visitDate,
      visitTime:   job.visitTime,
      partsCost:   Number(job.partsCost) || 0,
      laborCost:   Number(job.laborCost) || 0,
      cost:        totalCost,
      ...knowhow,
      updatedAt:   new Date().toISOString(),
    }

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
        <h2 className="text-base font-semibold text-gray-900">{isNew ? t('job.newTitle') : t('job.editTitle')}</h2>
        {!isNew && (
          <button onClick={handleSave} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
            {t('job.save')}
          </button>
        )}
      </div>

      <div className="space-y-4">

        {/* 고객 정보 */}
        <Section title={t('job.sectionCustomer')}>
          <div className="mb-2">
            <button
              onClick={() => setShowCustomerList((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg px-3 py-1.5"
            >
              <Users size={12} strokeWidth={1.5} />
              {showCustomerList ? t('settings.close') : t('job.loadCustomer')}
            </button>
            {showCustomerList && (
              <div className="mt-2 border border-gray-300 rounded-xl overflow-hidden">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('job.customerSearch')}
                  className="w-full px-3 py-2 text-sm border-b border-gray-300 outline-none"
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0
                    ? <p className="text-xs text-gray-400 px-3 py-2">{t('job.noSearchResult')}</p>
                    : filteredCustomers.map((c) => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-sm border-t border-gray-50 active:bg-gray-50">
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="ml-2 text-gray-400 text-xs">{c.phone}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          <Field label={t('job.labelCustomerName')} value={customer.name}    onChange={(v) => setC('name', v)}    placeholder={t('job.phCustomer')} />
          <Field label={t('job.labelPhone')}        value={customer.phone}   onChange={(v) => setC('phone', v)}   type="tel" placeholder="010-0000-0000" />
          <Field label={t('job.labelAddress')}      value={customer.address} onChange={(v) => setC('address', v)} placeholder={t('job.phAddress')} />
        </Section>

        {/* 의뢰 정보 */}
        <Section title={t('job.sectionRequest')}>
          <Field label={t('job.labelReceiptDate')} value={job.receiptDate} onChange={(v) => setJ('receiptDate', v)} type="date" />
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">{t('job.labelVisitSchedule')}</label>
            <input
              type="date"
              value={job.visitDate}
              onChange={(e) => setJ('visitDate', e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
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
              <input
                type="date"
                value={alarmDate}
                onChange={(e) => {
                  setAlarmDate(e.target.value)
                  if (e.target.value && !alarmTime && job.visitTime) setAlarmTime(job.visitTime)
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
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
            className="w-full py-4 bg-slate-700 text-white text-base font-semibold rounded-xl border-2 border-slate-400 shadow-md active:bg-slate-600"
          >
            {t('job.save')}
          </button>
        )}

        {/* 편집 모드 전용 필드 */}
        {!isNew && (
          <>
            {/* 설비/고장 정보 (공통 폼) */}
            <KnowhowFormBody form={knowhow} setForm={setKnowhow} />

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
              className="w-full py-4 bg-slate-700 text-white text-base font-semibold rounded-xl border-2 border-slate-400 shadow-md active:bg-slate-600"
            >
              {t('job.save')}
            </button>
          </>
        )}

      </div>
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
