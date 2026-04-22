import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, Phone, MapPin, Plus, ChevronRight,
  Calendar, CreditCard, Trash2, Wrench, CheckCircle2, X, Bell, Camera,
} from 'lucide-react'
import { db } from '../db'
import { requestNotificationPermission } from '../utils/alarmManager'
import { showToast } from '../utils/toast'

const INTERVAL_OPTIONS = [1, 2, 3, 6, 12]

export default function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const [showDelete, setShowDelete] = useState(false)
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
  const [editAddress, setEditAddress] = useState('')

  const customer = useLiveQuery(() => db.customers.get(Number(id)), [id])
  const jobs = useLiveQuery(
    () => db.service_jobs.where('customerId').equals(Number(id)).reverse().sortBy('receiptDate'),
    [id]
  )
  const cards = useLiveQuery(
    () => db.business_cards.where('customerId').equals(Number(id)).toArray(),
    [id]
  )
  const equipments = useLiveQuery(
    () => db.equipment_maintenance.where('customerId').equals(Number(id)).toArray(),
    [id]
  )

  function calcNextDue(intervalMonths) {
    const d = new Date()
    d.setMonth(d.getMonth() + intervalMonths)
    return d.toISOString().slice(0, 10)
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
    const reader = new FileReader()
    reader.onload = () => setEquipPhoto(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCheckDone(equip) {
    const nextDueDate = calcNextDue(equip.intervalMonths)
    await db.equipment_maintenance.update(equip.id, {
      lastCheckedDate: new Date().toISOString().slice(0, 10),
      nextDueDate,
    })
  }

  async function handleDeleteEquipment(equipId) {
    await db.equipment_maintenance.delete(equipId)
  }

  function openAlarmForEquip(equip) {
    setAlarmEquip(equip)
    setAlarmDate(equip.nextDueDate || '')
    setAlarmTime('')
  }

  async function handleSaveEquipAlarm() {
    if (!alarmDate || !alarmTime) return showToast(t('userAlarm.dateTimeRequired'))
    const granted = await requestNotificationPermission()
    if (!granted) return showToast(t('userAlarm.permissionDenied'))
    await db.user_alarms.add({
      title: `${customer?.name} - ${alarmEquip.name}`,
      date: alarmDate,
      time: alarmTime,
      note: t('customer.nextDue') + ': ' + alarmEquip.nextDueDate,
      fired: 0,
      createdAt: new Date().toISOString(),
    })
    setAlarmEquip(null)
    showToast(t('userAlarm.saved'))
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

  function openEditCustomer() {
    setEditName(customer?.name ?? '')
    setEditPhone(customer?.phone ?? '')
    setEditAddress(customer?.address ?? '')
    setShowEditCustomer(true)
  }

  async function handleSaveCustomer() {
    await db.customers.update(Number(id), {
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    })
    setShowEditCustomer(false)
  }

  async function handleDeleteCustomer() {
    const cid = Number(id)
    const jobIds = (await db.service_jobs.where('customerId').equals(cid).toArray()).map((j) => j.id)
    if (jobIds.length) {
      await db.job_photos.where('jobId').anyOf(jobIds).delete()
      await db.expenses.where('jobId').anyOf(jobIds).delete()
      await db.user_alarms.filter((a) => jobIds.includes(a.jobId)).delete()
    }
    await db.expenses.filter((e) => e.customerId === cid).delete()
    await db.service_jobs.where('customerId').equals(cid).delete()
    await db.business_cards.where('customerId').equals(cid).delete()
    await db.equipment_maintenance.where('customerId').equals(cid).delete()
    await db.customers.delete(cid)
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

      <div className="space-y-3">

        {/* 고객 정보 카드 */}
        <div
          onClick={openEditCustomer}
          className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50 relative"
        >
          <span className="absolute top-2 right-3 text-[10px] text-gray-300">{t('customer.tapToEdit')}</span>
          <p className="text-lg font-bold text-gray-900 mb-1">{customer.name}</p>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-1"
            >
              <Phone size={13} strokeWidth={1.5} />
              {customer.phone}
            </a>
          )}
          {customer.address && (
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <MapPin size={11} strokeWidth={1.5} />
              {customer.address}
            </p>
          )}
          {totalRevenue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">{t('customer.totalRevenue')}</span>
              <span className="text-sm font-semibold text-gray-800">{totalRevenue.toLocaleString()}</span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/service/new', { state: { customerId: Number(id) } }) }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg active:bg-blue-700"
          >
            <Plus size={14} strokeWidth={2.5} />
            {t('customer.newRequest')}
          </button>
        </div>

        {/* 명함 */}
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
                  {card.dataUrl ? (
                    <img
                      src={card.dataUrl}
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

        {/* 장비 관리 */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('customer.equipment')}</p>
            {!showEquipForm && (
              <button
                onClick={() => setShowEquipForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm active:bg-blue-700"
              >
                <Plus size={16} strokeWidth={2.5} />
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

        {/* 수리 이력 */}
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
              {previewCard.dataUrl && (
                <img
                  src={previewCard.dataUrl}
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
              <label className="text-xs text-gray-400 block mb-1">{t('customer.fieldAddress')}</label>
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={handleSaveCustomer}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl mt-2"
            >
              {t('customer.save')}
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('customer.deleteConfirm')}</p>
            <p className="text-sm text-gray-400 mb-5">{t('customer.deleteDesc')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                {t('customer.cancel')}
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
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
                <input
                  type="date"
                  value={alarmDate}
                  onChange={e => setAlarmDate(e.target.value)}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400"
                />
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
    </div>
  )
}
