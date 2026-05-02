import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, Phone, MapPin, Plus, ChevronRight,
  Calendar, CreditCard, Trash2, Wrench, CheckCircle2, X, Bell, Camera, Mail,
} from 'lucide-react'
import DateInput from '../components/DateInput'
import { db } from '../db'
import { softDelete, softDeleteCustomerCascade } from '../utils/cloudSync'
import MediaImage from '../components/MediaImage'
import { requestNotificationPermission } from '../utils/alarmManager'
import { showToast } from '../utils/toast'
import { compressImage } from '../utils/image'
import { toLocalISO } from '../utils/date'

const INTERVAL_OPTIONS = [1, 2, 3, 6, 12]

export default function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const [showDelete, setShowDelete] = useState(false)
  const [siteLightboxIdx, setSiteLightboxIdx] = useState(null)
  const [analyzedLightboxIdx, setAnalyzedLightboxIdx] = useState(null)
  const [showEquipForm, setShowEquipForm] = useState(false)
  const [equipName, setEquipName] = useState('')
  const [equipInterval, setEquipInterval] = useState(null)
  const [equipPhoto, setEquipPhoto] = useState('')
  const [previewEquip, setPreviewEquip] = useState(null)
  const equipFileRef = useRef(null)
  const [alarmEquip, setAlarmEquip] = useState(null)
  const [alarmDate, setAlarmDate] = useState('')
  const [alarmTime, setAlarmTime] = useState('')
  const [previewCard, setPreviewCard] = useState(null)
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [savingAlarm, setSavingAlarm] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)

  const customer = useLiveQuery(async () => {
    const c = await db.customers.get(Number(id))
    return c?.deletedAt ? null : c
  }, [id])
  const jobs = useLiveQuery(
    async () => (await db.service_jobs.where('customerId').equals(Number(id)).reverse().sortBy('receiptDate')).filter((r) => !r.deletedAt),
    [id]
  )
  const cards = useLiveQuery(
    () => db.business_cards.where('customerId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(),
    [id]
  )
  const equipments = useLiveQuery(
    () => db.equipment_maintenance.where('customerId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(),
    [id]
  )
  const knowhowList = useLiveQuery(
    () => db.knowhow.where('customerId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(),
    [id]
  )
  // 분석된 장비 통합 — AS와 설비기록에서 모은 equipments
  const analyzedEquipments = useLiveQuery(async () => {
    const cid = Number(id)
    const jobs = await db.service_jobs.where('customerId').equals(cid).filter(r => !r.deletedAt).toArray()
    const fromJobs = jobs.flatMap(j => (j.equipments ?? []).map(eq => ({ ...eq, sourceType: 'job', sourceId: j.id })))
    const ks = await db.knowhow.where('customerId').equals(cid).filter(r => !r.deletedAt).toArray()
    const fromKnowhow = ks.flatMap(k => (k.equipments ?? []).map(eq => ({ ...eq, sourceType: 'knowhow', sourceId: k.id })))
    return [...fromJobs, ...fromKnowhow]
  }, [id])
  const alarms = useLiveQuery(async () => {
    const cid = Number(id)
    const cust = await db.customers.get(cid)
    const customerJobs = await db.service_jobs.where('customerId').equals(cid).filter((r) => !r.deletedAt).toArray()
    const myJobIds = new Set(customerJobs.map(j => j.id))
    const all = await db.user_alarms.filter((r) => !r.deletedAt).toArray()
    return all.filter(a =>
      a.customerId === cid ||
      (a.jobId && myJobIds.has(a.jobId)) ||
      (cust?.name && typeof a.title === 'string' && a.title.startsWith(cust.name + ' -'))
    ).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  }, [id])

  function calcNextDue(intervalMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + intervalMonths)
    return toLocalISO(d)
  }

  async function handleAddEquipment() {
    if (!equipPhoto && !equipName.trim()) return
    await db.equipment_maintenance.add({
      customerId: Number(id),
      name: equipName.trim(),
      photoUrl: equipPhoto,
      intervalMonths: equipInterval,
      lastCheckedDate: null,
      nextDueDate: equipInterval ? calcNextDue(equipInterval) : null,
    })
    setEquipName('')
    setEquipInterval(null)
    setEquipPhoto('')
    setShowEquipForm(false)
  }

  async function handleCancelEquip() {
    if (equipPhoto) {
      await db.equipment_maintenance.add({
        customerId: Number(id),
        name: equipName.trim(),
        photoUrl: equipPhoto,
        intervalMonths: null,
        lastCheckedDate: null,
        nextDueDate: null,
      })
    }
    setEquipName('')
    setEquipInterval(null)
    setEquipPhoto('')
    setShowEquipForm(false)
  }

  async function handleEquipCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Firestore 1MB 한도 + IDB 용량 절감 위해 1200px / JPEG 75% 압축
    const dataUrl = await compressImage(file)
    setEquipPhoto(dataUrl)
    e.target.value = ''
  }

  async function handleCheckDone(equip) {
    const nextDueDate = calcNextDue(equip.intervalMonths)
    await db.equipment_maintenance.update(equip.id, {
      lastCheckedDate: toLocalISO(new Date()),
      nextDueDate,
    })
  }

  async function handleDeleteEquipment(equipId) {
    await softDelete('equipment_maintenance', equipId)
  }

  function openAlarmForEquip(equip) {
    setAlarmEquip(equip)
    setAlarmDate(equip.nextDueDate || '')
    setAlarmTime('')
  }

  async function handleSaveEquipAlarm() {
    if (savingAlarm) return
    if (!alarmDate || !alarmTime) return showToast(t('userAlarm.dateTimeRequired'))
    setSavingAlarm(true)
    try {
      const granted = await requestNotificationPermission()
      if (!granted) {
        showToast(t('userAlarm.permissionDenied'))
        setSavingAlarm(false)
        return
      }
      await db.user_alarms.add({
        title: `${customer?.name} - ${alarmEquip.name}`,
        date: alarmDate,
        time: alarmTime,
        note: t('customer.nextDue') + ': ' + alarmEquip.nextDueDate,
        customerId: Number(id),
        equipmentId: alarmEquip.id,
        fired: 0,
        createdAt: new Date().toISOString(),
      })
      setAlarmEquip(null)
      showToast(t('userAlarm.saved'))
    } catch (e) {
      console.error('Alarm save failed:', e)
    } finally {
      setSavingAlarm(false)
    }
  }

  if (!customer) return <div className="p-4 text-gray-400 text-sm">{t('customer.loading')}</div>

  const STATUS = {
    received:   { text: t('service.statusReceived'),   dot: 'bg-gray-400',    card: 'bg-gray-50 border-gray-300' },
    scheduled:  { text: t('service.statusScheduled'),  dot: 'bg-blue-500',    card: 'bg-blue-50 border-blue-300' },
    inprogress: { text: t('service.statusInProgress'), dot: 'bg-amber-500',   card: 'bg-amber-50 border-amber-300' },
    completed:  { text: t('service.statusCompleted'),  dot: 'bg-emerald-500', card: 'bg-emerald-50 border-emerald-300' },
  }

  const totalRevenue = (jobs ?? [])
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + (j.cost || 0), 0)

  // 미결제 = 결제 안 받은 작업 중 cost > 0 (완료 여부 무관)
  const unpaidJobs = (jobs ?? []).filter((j) => (j.cost || 0) > 0 && !j.paid)
  const unpaidTotal = unpaidJobs.reduce((sum, j) => sum + (j.cost || 0), 0)

  function openEditCustomer() {
    setEditName(customer?.name ?? '')
    setEditPhone(customer?.phone ?? '')
    setEditEmail(customer?.email ?? '')
    setEditAddress(customer?.address ?? '')
    setShowEditCustomer(true)
  }

  async function handleSaveCustomer() {
    if (savingCustomer) return
    setSavingCustomer(true)
    try {
      await db.customers.update(Number(id), {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        address: editAddress.trim(),
      })
      setShowEditCustomer(false)
    } catch (e) {
      console.error('Customer save failed:', e)
    } finally {
      setSavingCustomer(false)
    }
  }

  async function handleDeleteCustomer() {
    await softDeleteCustomerCascade(Number(id))
    navigate('/service', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('customer.back')}
      </button>
      {/* 헤더 */}
      <div className="flex items-center justify-end mb-5">
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 text-gray-400"
        >
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-4">

        {/* 1. 기본 정보 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{t('customer.basicInfo')}</p>
          <div
            onClick={openEditCustomer}
            className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50 relative"
          >
            <span className="absolute top-2 right-3 text-[10px] text-gray-300">{t('customer.tapToEdit')}</span>
            <p className="text-lg font-bold text-gray-900 mb-2">{customer.name}</p>
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-1"
              >
                <Phone size={13} strokeWidth={1.5} />
                {customer.phone}
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-gray-300 mb-1">
                <Phone size={11} strokeWidth={1.5} />
                {t('customer.phoneNone')}
              </p>
            )}
            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-blue-600 mt-1 break-all"
              >
                <Mail size={11} strokeWidth={1.5} />
                {customer.email}
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-gray-300 mt-1">
                <Mail size={11} strokeWidth={1.5} />
                {t('customer.emailNone')}
              </p>
            )}
            {customer.address ? (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin size={11} strokeWidth={1.5} />
                {customer.address}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                <MapPin size={11} strokeWidth={1.5} />
                {t('customer.addressNone')}
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-400">{t('customer.jobsCount', { count: (jobs ?? []).length })}</p>
              </div>
              {totalRevenue > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">{t('customer.totalRevenue')}</p>
                  <p className="text-sm font-semibold text-gray-800">{totalRevenue.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1.5 — 고객 성향 메모 */}
        {customer.traits && (
          <div className="bg-amber-600 rounded-xl p-3 shadow-md">
            <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">{t('customerForm.traits')}</p>
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{customer.traits}</p>
          </div>
        )}

        {/* 1.7 — 현장 사진 */}
        {(customer.sitePhotos ?? []).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('customerForm.sitePhotos')}</p>
            <div className="flex flex-wrap gap-2">
              {customer.sitePhotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSiteLightboxIdx(i)}
                  className="w-20 h-20 block"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1.8 — 분석된 장비 통합 (AS + 설비기록) */}
        {(analyzedEquipments ?? []).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {t('customer.analyzedEquipments', { count: analyzedEquipments.length })}
            </p>
            <div className="space-y-2">
              {analyzedEquipments.map((eq, i) => (
                <div key={i} className="relative w-full bg-white border-2 border-gray-300 rounded-xl p-2 shadow-sm">
                  <span className="absolute -top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                    {eq.sourceType === 'job' ? t('customer.fromJob') : t('customer.fromKnowhow')}
                  </span>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <button
                      onClick={() => setAnalyzedLightboxIdx(i)}
                      className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-md overflow-hidden block"
                    >
                      {eq.photo && <img src={eq.photo} alt="" className="w-full h-full object-cover" />}
                    </button>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-[11px] leading-tight grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 content-start overflow-hidden">
                      {eq.kind && (<><span className="text-gray-400 shrink-0">{t('scan.kind')}</span><span className="text-gray-900 font-medium truncate">{eq.kind}</span></>)}
                      {eq.brand && (<><span className="text-gray-400 shrink-0">{t('scan.brand')}</span><span className="text-gray-900 font-medium truncate">{eq.brand}</span></>)}
                      {eq.model && (<><span className="text-gray-400 shrink-0">{t('scan.model')}</span><span className="text-gray-900 font-medium truncate">{eq.model}</span></>)}
                      {eq.serial && (<><span className="text-gray-400 shrink-0">{t('scan.serial')}</span><span className="text-gray-900 font-medium truncate">{eq.serial}</span></>)}
                      {eq.capacity && (<><span className="text-gray-400 shrink-0">{t('scan.capacity')}</span><span className="text-gray-900 font-medium truncate">{eq.capacity}</span></>)}
                      {eq.refrigerant && (<><span className="text-gray-400 shrink-0">{t('scan.refrigerant')}</span><span className="text-gray-900 font-medium truncate">{eq.refrigerant}</span></>)}
                      {!eq.kind && !eq.brand && !eq.model && (
                        <span className="col-span-2 text-gray-400">{t('knowhow.equipNoData')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. AS 이력 */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('customer.repairHistory')}</p>
            <span className="text-xs text-gray-400">{t('customer.historyCount', { count: (jobs ?? []).length })}</span>
          </div>
          {(!jobs || jobs.length === 0) ? (
            <div className="bg-white border border-gray-300 rounded-xl p-6 text-center shadow-sm">
              <p className="text-xs text-gray-400">{t('customer.noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const st = STATUS[job.status] ?? STATUS.received
                return (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/service/${job.id}`)}
                    className={`w-full border rounded-xl p-3.5 text-left shadow-sm active:opacity-80 ${st.card}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-1 font-medium">
                          {(job.symptoms ?? job.symptom) || t('customer.noSymptom')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} strokeWidth={1.5} />
                            {job.receiptDate}
                          </span>
                          {job.cost > 0 && (
                            <span className="font-medium text-gray-700">
                              {Number(job.cost).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className="text-xs text-gray-600">{st.text}</span>
                        <ChevronRight size={13} strokeWidth={1.5} className="text-gray-400 ml-0.5" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. 점검일 내역 (장비별) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('customer.maintenance')}</p>
            {!showEquipForm && (
              <button
                onClick={() => setShowEquipForm(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded-lg active:bg-gray-50"
              >
                <Plus size={11} strokeWidth={2} />
                {t('customer.addEquipment')}
              </button>
            )}
          </div>

          {showEquipForm && (
            <div className="bg-white border border-gray-300 rounded-xl p-3 mb-2 shadow-sm space-y-2">
              <input
                ref={equipFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleEquipCapture}
              />
              {equipPhoto ? (
                <div className="relative">
                  <img
                    src={equipPhoto}
                    alt="equipment"
                    className="w-full rounded-lg border border-gray-200 object-cover max-h-32"
                  />
                  <button
                    onClick={() => setEquipPhoto('')}
                    className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-black/60 rounded-full text-white"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => equipFileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-1 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 active:bg-gray-50"
                >
                  <Camera size={22} strokeWidth={1.5} />
                  <span className="text-xs">{t('customer.takePhoto')}</span>
                </button>
              )}
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400"
                placeholder={t('customer.equipmentMemo')}
                value={equipName}
                onChange={e => setEquipName(e.target.value)}
              />
              <div>
                <span className="text-xs text-gray-500 block mb-1.5">{t('customer.inspectionCycle')}</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {INTERVAL_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => setEquipInterval(equipInterval === m ? null : m)}
                      className={`py-1.5 text-xs rounded-lg border-2 font-medium transition-colors ${
                        equipInterval === m
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-transparent text-gray-500 border-gray-400'
                      }`}
                    >
                      {t('customer.months', { count: m })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEquip}
                  className="flex-1 py-2 text-xs border border-gray-200 rounded-lg text-gray-500"
                >
                  {t('customer.cancel')}
                </button>
                <button
                  onClick={handleAddEquipment}
                  className="flex-1 py-2 text-xs bg-gray-900 text-white rounded-lg font-medium"
                >
                  {t('customer.save')}
                </button>
              </div>
            </div>
          )}

          {(!equipments || equipments.length === 0) ? (
            <div className="bg-white border border-gray-300 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400">{t('customer.noEquipment')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {equipments.map(equip => (
                <div key={equip.id} className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm">
                  <div className="flex gap-3">
                    {equip.photoUrl ? (
                      <img
                        src={equip.photoUrl}
                        alt="equipment"
                        onClick={() => setPreviewEquip(equip)}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-300 shrink-0 bg-gray-50 cursor-pointer active:opacity-80"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                        <Wrench size={16} strokeWidth={1} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {equip.name && (
                            <p className="text-sm font-medium text-gray-800 break-words">{equip.name}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{t('customer.months', { count: equip.intervalMonths })}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => openAlarmForEquip(equip)}
                            className="p-1.5 text-amber-500"
                            title={t('userAlarm.setForMaint')}
                          >
                            <Bell size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleCheckDone(equip)}
                            className="p-1.5 text-emerald-500"
                            title={t('customer.checkDone')}
                          >
                            <CheckCircle2 size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(equip.id)}
                            className="p-1.5 text-gray-300"
                          >
                            <X size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                        <span>{t('customer.nextDue')}: <span className="text-blue-500 font-medium">{equip.nextDueDate}</span></span>
                        {equip.lastCheckedDate && (
                          <span>{t('customer.lastChecked')}: {equip.lastCheckedDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 미결제 내역 */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('customer.unpaid')}</p>
            {unpaidTotal > 0 && (
              <span className="text-xs font-semibold text-red-600">{unpaidTotal.toLocaleString()}</span>
            )}
          </div>
          {unpaidJobs.length === 0 ? (
            <div className="bg-white border border-gray-300 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400">{t('customer.unpaidNone')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {unpaidJobs.map((job) => {
                const st = STATUS[job.status] ?? STATUS.received
                return (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/service/${job.id}`)}
                    className="w-full bg-white border border-red-200 rounded-xl p-3 text-left shadow-sm active:bg-red-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-1">
                          {(job.symptoms ?? job.symptom) || t('customer.noSymptom')}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} strokeWidth={1.5} />
                            {job.receiptDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.text}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-600 shrink-0">
                        {Number(job.cost).toLocaleString()}
                      </span>
                    </div>
                  </button>
                )
              })}
              {unpaidJobs.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2.5 bg-red-600 rounded-xl">
                  <span className="text-xs text-white font-medium">{t('customer.unpaidTotal')}</span>
                  <span className="text-sm font-bold text-white">{unpaidTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. 알람 내역 */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('customer.alarms')}</p>
            {alarms && alarms.length > 0 && (
              <span className="text-xs text-gray-400">{t('customer.historyCount', { count: alarms.length })}</span>
            )}
          </div>
          {(!alarms || alarms.length === 0) ? (
            <div className="bg-white border border-gray-300 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400">{t('customer.alarmsNone')}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {alarms.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex items-start gap-2"
                >
                  <Bell size={13} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${a.fired ? 'text-gray-300' : 'text-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{a.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {a.date} {a.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. 명함 */}
        {cards && cards.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{t('customer.businessCards')}</p>
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setPreviewCard(card)}
                  className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3 items-start active:bg-gray-50 cursor-pointer"
                >
                  {(card.dataUrl || card.storagePath) ? (
                    <MediaImage
                      dataUrl={card.dataUrl}
                      storagePath={card.storagePath}
                      alt={t('customer.businessCards')}
                      className="w-20 h-12 object-cover rounded-lg border border-gray-300 shrink-0 bg-gray-50"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                      <CreditCard size={18} strokeWidth={1} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-xs text-gray-500 space-y-0.5">
                    {card.company && <p className="font-medium text-gray-700">{card.company}</p>}
                    {card.title && <p>{card.title}</p>}
                    {card.email && <p className="text-gray-400">{card.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 설비 사진 확대 보기 */}
      {previewEquip && (
        <div
          onClick={() => setPreviewEquip(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        >
          <img
            src={previewEquip.photoUrl}
            alt="equipment"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewEquip(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/20 rounded-full text-white"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* 명함 상세 보기 */}
      {previewCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{t('bc.confirmInfo')}</p>
              <button
                onClick={() => setPreviewCard(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-600"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {(previewCard.dataUrl || previewCard.storagePath) && (
                <MediaImage
                  dataUrl={previewCard.dataUrl}
                  storagePath={previewCard.storagePath}
                  alt={t('customer.businessCards')}
                  className="w-full rounded-xl border border-gray-200"
                />
              )}
              <div className="space-y-2.5 text-sm">
                {[
                  ['fieldName', previewCard.name],
                  ['fieldCompany', previewCard.company],
                  ['fieldTitle', previewCard.title],
                  ['fieldMobile', previewCard.mobile],
                  ['fieldPhone', previewCard.phone],
                  ['fieldEmail', previewCard.email],
                  ['fieldAddress', previewCard.address],
                  ['fieldMemo', previewCard.memo],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 mb-0.5">{t(`bc.${k}`)}</p>
                    <p className="text-gray-800 break-words whitespace-pre-line">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 고객 정보 편집 모달 */}
      {showEditCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 pb-8 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900">{t('customer.editTitle')}</h3>
              <button
                onClick={() => setShowEditCustomer(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">{t('customer.fieldName')}</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">{t('customer.fieldPhone')}</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">{t('customer.fieldEmail')}</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">{t('customer.fieldAddress')}</label>
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={handleSaveCustomer}
              disabled={savingCustomer}
              className={`w-full py-3 text-white text-sm font-bold rounded-xl mt-2 ${savingCustomer ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700'}`}
            >
              {savingCustomer ? t('common.saving') : t('customer.save')}
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 — cascade 영향 데이터 개수 표시 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-2">{t('customer.deleteConfirm')}</p>
            <p className="text-sm text-gray-600 mb-3">{t('customer.deleteCascadeWarning')}</p>
            <ul className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 space-y-0.5">
              <li>• {t('customer.cascadeJobs')}: <span className="font-bold">{(jobs ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('customer.cascadeKnowhow')}: <span className="font-bold">{(knowhowList ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('customer.cascadeCards')}: <span className="font-bold">{(cards ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('customer.cascadeEquipments')}: <span className="font-bold">{(equipments ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('customer.cascadeAlarms')}: <span className="font-bold">{(alarms ?? []).length}{t('customer.cascadeUnit')}</span></li>
            </ul>
            <p className="text-xs text-red-600 font-semibold mb-4 leading-relaxed">⚠️ {t('customer.deleteIrreversibleDetail')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                {t('customer.cancel')}
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl active:bg-red-700"
              >
                {t('customer.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 장비 알람 설정 모달 */}
      {alarmEquip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('userAlarm.setForMaint')}</h3>
              <button onClick={() => setAlarmEquip(null)} className="text-gray-400 text-sm">{t('settings.close')}</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {customer?.name} · {alarmEquip.name}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.date')}</label>
                <DateInput value={alarmDate} onChange={setAlarmDate} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.time')}</label>
                <input
                  type="time"
                  value={alarmTime}
                  onChange={e => setAlarmTime(e.target.value)}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <button
              onClick={handleSaveEquipAlarm}
              className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl mt-4 active:bg-blue-700"
            >
              {t('userAlarm.save')}
            </button>
          </div>
        </div>
      )}

      {/* 분석 장비 사진 라이트박스 */}
      {analyzedLightboxIdx != null && (analyzedEquipments ?? [])[analyzedLightboxIdx]?.photo && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setAnalyzedLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setAnalyzedLightboxIdx(null) }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {analyzedLightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setAnalyzedLightboxIdx(analyzedLightboxIdx - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ‹
            </button>
          )}
          {analyzedLightboxIdx < (analyzedEquipments ?? []).length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setAnalyzedLightboxIdx(analyzedLightboxIdx + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ›
            </button>
          )}
          <img
            src={(analyzedEquipments ?? [])[analyzedLightboxIdx]?.photo}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {analyzedLightboxIdx + 1} / {(analyzedEquipments ?? []).length}
          </div>
        </div>
      )}

      {/* 현장 사진 라이트박스 */}
      {siteLightboxIdx != null && (customer.sitePhotos ?? [])[siteLightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setSiteLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setSiteLightboxIdx(null) }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {siteLightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSiteLightboxIdx(siteLightboxIdx - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ‹
            </button>
          )}
          {siteLightboxIdx < (customer.sitePhotos ?? []).length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSiteLightboxIdx(siteLightboxIdx + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ›
            </button>
          )}
          <img
            src={(customer.sitePhotos ?? [])[siteLightboxIdx]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {siteLightboxIdx + 1} / {(customer.sitePhotos ?? []).length}
          </div>
        </div>
      )}
    </div>
  )
}
