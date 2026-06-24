import { useState, useRef, useEffect } from 'react'
import { money } from '../utils/money'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Pencil, Phone, Calendar, MapPin,
  Trash2, ClipboardList, Camera, X, Bell, Save, Printer,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { softDelete, softDeleteJobCascade } from '../utils/cloudSync'
import { requestNotificationPermission } from '../utils/alarmManager'
import { showToast } from '../utils/toast'
import { compressImage } from '../utils/image'
import { todayLocal, toLocalISO } from '../utils/date'
import KnowhowFormBody, { EMPTY_KNOWHOW } from '../components/KnowhowFormBody'
import DateInput from '../components/DateInput'
import TimeInput from '../components/TimeInput'
import MediaImage from '../components/MediaImage'
import { printJobReport } from '../utils/printJobReport'
import { captureAttr } from '../utils/deviceCapture'
import { scanEquipment } from '../utils/scanEquipment'
import { Sparkles } from 'lucide-react'

export default function JobDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const [showDelete, setShowDelete] = useState(false)
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [alarmTime, setAlarmTime] = useState('')
  const [alarmDate, setAlarmDate] = useState('')
  const [editingAlarmId, setEditingAlarmId] = useState(null)
  const [knowhow, setKnowhowState] = useState(EMPTY_KNOWHOW)
  const [knowhowReady, setKnowhowReady] = useState(false)
  const [savingAlarm, setSavingAlarm] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [equipLightboxIdx, setEquipLightboxIdx] = useState(null)
  const [scanningIdxs, setScanningIdxs] = useState(() => new Set())  // 완료 의뢰 카드별 분석 진행 표시
  const fileRef = useRef()
  const stageTopRef = useRef(null)
  const [completing, setCompleting] = useState(false)
  const [tempSaving, setTempSaving] = useState(false)
  // 1차/2차 단계 선택 (진행 중에만 사용, 통합 폼 X)
  const [stage, setStage] = useState(null)

  const job      = useLiveQuery(async () => {
    const j = await db.service_jobs.get(Number(id))
    return j?.deletedAt ? null : j
  }, [id])
  const customer = useLiveQuery(
    () => job?.customerId ? db.customers.get(job.customerId) : undefined,
    [job?.customerId]
  )
  const photos = useLiveQuery(
    () => db.job_photos.where('jobId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(), [id]
  )
  // 삭제 모달용 — 영향 데이터 개수 미리보기
  const jobExpenses = useLiveQuery(
    () => db.expenses.where('jobId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(), [id]
  )
  // knowhow는 cascade 대상 X (별도 자산으로 보존). 단 사용자에게 안내 위해 개수 미리보기.
  const linkedKnowhow = useLiveQuery(
    () => db.knowhow.filter((k) => k.sourceJobId === Number(id) && !k.deletedAt).toArray(), [id]
  )
  const jobAlarms = useLiveQuery(
    () => db.user_alarms.filter(a => a.jobId === Number(id) && !a.deletedAt).toArray(), [id]
  )

  // 렌더링 중 setState 안티패턴 방지 — useEffect로 분리
  // (job이 useLiveQuery 비동기로 채워진 직후 1회 knowhow 초기화)
  useEffect(() => {
    if (!job || knowhowReady) return
    setKnowhowState({
      title:          job.title          ?? '',
      category:       job.category       ?? '기타',
      location:       job.location       ?? '기타',
      compressorType: job.compressorType ?? '',
      compressorStr:  job.compressorStr  ?? '',
      coolingMethod:  job.coolingMethod  ?? '',
      tempRange:      job.tempRange      ?? '',
      refrigerant:    job.refrigerant    ?? '',
      systemType:     job.systemType     ?? '',
      symptoms:       job.symptoms       ?? job.symptom   ?? '',
      cause:          job.cause          ?? job.diagnosis ?? '',
      checkSteps:     job.checkSteps     ?? '',
      solution:       job.solution       ?? job.workDone  ?? '',
      parts:          job.parts          ?? job.materials ?? '',
      notes:          job.notes          ?? '',
      equipPhotos:    Array.isArray(job.equipPhotos) ? job.equipPhotos : [],
      equipments:     Array.isArray(job.equipments)  ? job.equipments  : [],
    })
    setKnowhowReady(true)
  }, [job?.id, knowhowReady])

  if (!job) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  function setKnowhow(updater) {
    setKnowhowState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      db.service_jobs.update(Number(id), { ...next, updatedAt: new Date().toISOString() })
      return next
    })
  }

  // 13종 비용 합계 (BillingPage 자동 계산 결과 우선 사용, 없으면 즉석 합산)
  // job.cost가 BillingPage에서 자동 갱신됨 (양수합 - 할인 + 세금)
  const totalCost = job.cost ?? (
    (job.generalRevenue || 0) + (job.diagnosisFee || 0) + (job.emergencyFee || 0) +
    (job.maintenanceFee || 0) + (job.demolitionFee || 0) + (job.rentalFee || 0) +
    (job.deliveryFee || 0) + (job.partsCost || 0) + (job.laborCost || 0) +
    (job.travelCost || 0) + (job.otherCost || 0) - (job.discount || 0) + (job.taxAmount || 0)
  )
  const isProgress = job.status === 'inprogress'
  const isDone     = job.status === 'completed'
  const visitH     = job.visitTime ? job.visitTime.split(':')[0] : ''
  const visitM     = job.visitTime ? job.visitTime.split(':')[1] : ''

  async function patch(data) {
    await db.service_jobs.update(Number(id), { ...data, updatedAt: new Date().toISOString() })
  }

  // 완료 의뢰의 분석 안 박힌 카드 / 또는 [재분석] 박힌 카드 = 사무실에서 사진 보고 직접 분석
  // 결과 박힌 후 IDB update + cloud push 안전망 (재진입해도 박혀있음)
  async function handleEquipScanInDone(realIdx) {
    const target = (job.equipments ?? [])[realIdx]
    if (!target?.photo) return
    if (scanningIdxs.has(realIdx)) return
    setScanningIdxs((prev) => {
      const next = new Set(prev)
      next.add(realIdx)
      return next
    })
    try {
      const r = await scanEquipment(target.photo)
      const newEquips = (job.equipments ?? []).map((eq, i) =>
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
      )
      await patch({ equipments: newEquips })
    } catch (e) {
      showToast(t('knowhow.errAi') + (e.message || ''))
    } finally {
      setScanningIdxs((prev) => {
        const next = new Set(prev)
        next.delete(realIdx)
        return next
      })
    }
  }

  async function handleComplete() {
    if (completing) return
    setCompleting(true)
    try {
      // 1차/2차 분기 후엔 폼이 즉시 IDB 저장이라 별도 처리 없음. 상태만 완료로.
      await patch({ status: 'completed', completedAt: new Date().toISOString() })
      showToast(t('job.completedToast'))
    } catch (e) {
      showToast(t('job.aiError', { message: e.message }))
    } finally {
      setCompleting(false)
    }
  }

  // [임시저장] — IDB 저장은 입력 즉시 이미 반영됨. 토스트 + 1차 → 2차 자동 전환 (현장 흐름에 맞춤)
  async function handleTempSave() {
    if (tempSaving) return
    setTempSaving(true)
    try {
      if (job.status !== 'inprogress' && !isDone) {
        await patch({ status: 'inprogress' })
      }
      const counts = {
        photos: (photos ?? []).length,
        equips: (knowhow.equipments ?? []).length,
      }
      showToast(t('job.tempSavedToast', counts))
      // 1차 → 2차 자동 전환 + 2차 카드 상단(토글 버튼 위치)으로 스크롤
      setStage(2)
      // 다음 프레임에서 스크롤 (state 적용 후 DOM 갱신 대기)
      setTimeout(() => {
        stageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } finally {
      setTempSaving(false)
    }
  }

  async function handleCreateKnowhow() {
    if (!job?.customerId) {
      showToast(t('job.knowhowNeedCustomer'))
      return
    }
    // 이미 이 AS로 만든 설비기록이 있으면 거기로 이동
    if ((linkedKnowhow ?? []).length > 0) {
      showToast(t('job.knowhowAlreadyAdded'))
      navigate(`/knowhow/${linkedKnowhow[0].id}`)
      return
    }
    const now = new Date().toISOString()
    try {
      const newId = await db.knowhow.add({
        sourceJobId:    Number(id),
        customerId:     job.customerId,
        title:          knowhow.title          || job.title          || (job.symptoms ?? job.symptom ?? '').slice(0, 30) || t('job.knowhowDefaultTitle'),
        category:       knowhow.category       || job.category       || '기타',
        location:       knowhow.location       || job.location       || '기타',
        compressorType: knowhow.compressorType || job.compressorType || '',
        compressorStr:  knowhow.compressorStr  || job.compressorStr  || '',
        coolingMethod:  knowhow.coolingMethod  || job.coolingMethod  || '',
        tempRange:      knowhow.tempRange      || job.tempRange      || '',
        refrigerant:    knowhow.refrigerant    || job.refrigerant    || '',
        systemType:     knowhow.systemType     || job.systemType     || '',
        symptoms:       knowhow.symptoms       || job.symptoms       || job.symptom   || '',
        cause:          knowhow.cause          || job.cause          || job.diagnosis || '',
        checkSteps:     knowhow.checkSteps     || job.checkSteps     || '',
        solution:       knowhow.solution       || job.solution       || job.workDone  || '',
        parts:          knowhow.parts          || job.parts          || job.materials || '',
        notes:          knowhow.notes          || job.notes          || '',
        equipments:     Array.isArray(knowhow.equipments) ? knowhow.equipments : (Array.isArray(job.equipments) ? job.equipments : []),
        createdAt:      now,
        updatedAt:      now,
      })
      showToast(t('job.savedToKnowhowToast'))
      navigate(`/knowhow/${newId}`)
    } catch (e) {
      showToast(t('job.knowhowSaveError') + (e.message || ''))
    }
  }

  async function handlePhoto(e) {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const dataUrl = await compressImage(file)
      await db.job_photos.add({ jobId: Number(id), dataUrl, caption: '', takenAt: new Date().toISOString() })
    }
    e.target.value = ''
  }

  async function deletePhoto(photoId) {
    await softDelete('job_photos', photoId)
  }

  async function handleSaveAlarm() {
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
      if (editingAlarmId) {
        await db.user_alarms.update(editingAlarmId, { date: alarmDate, time: alarmTime, fired: 0 })
      } else {
        await db.user_alarms.add({
          title: `${customer?.name ?? t('home.noCustomer')} - ${(job.symptoms ?? job.symptom) || t('job.sectionReceipt')}`,
          date: alarmDate,
          time: alarmTime,
          note: job.visitDate ? `${t('job.visitPrefix')} ${job.visitDate}` : '',
          jobId: Number(id),
          customerId: job.customerId ?? null,
          fired: 0,
          createdAt: new Date().toISOString(),
        })
      }
      setAlarmOpen(false)
      setAlarmTime('')
      setAlarmDate('')
      setEditingAlarmId(null)
      showToast(t('userAlarm.saved'))
    } catch (e) {
      console.error('Alarm save failed:', e)
    } finally {
      setSavingAlarm(false)
    }
  }

  async function handleDelete() {
    await softDeleteJobCascade(Number(id))
    navigate('/service', { replace: true })
  }

  // 작업 내역서 출력 — 진행 중이면 임시 출력 (배지 표시), 완료면 정식 출력
  // async: Storage 사진 URL 비동기 다운로드 필요
  async function handlePrintReport() {
    // 진행 중 입력값(knowhow state)이 IDB로 즉시 저장되지만 useLiveQuery 한 템포 늦을 수 있어 merge해서 전달
    const merged = !isDone ? { ...job, ...knowhow } : job
    try {
      const ok = await printJobReport({
        job: merged,
        customer,
        photos: photos ?? [],
        isDraft: !isDone,
        t,
      })
      if (ok === false) showToast(t('print.popupBlocked'))
    } catch (e) {
      showToast(e?.message || 'Print failed')
    }
  }

  return (
    <div className="p-4 pb-10">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('job.backToList')}
      </button>
      {/* 헤더 */}
      <div className="flex items-center justify-end gap-2 mb-5">
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400">
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={handlePrintReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-violet-600 active:bg-violet-700 shadow-md"
        >
          <Printer size={12} strokeWidth={2} />
          {isDone ? t('print.btnPrint') : t('print.btnPrintDraft')}
        </button>
        <button
          onClick={() => navigate(`/service/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700"
        >
          <Pencil size={12} strokeWidth={1.5} />
          {t('job.edit')}
        </button>
      </div>

      <div className="space-y-3">

        {/* 고객 카드 */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{customer?.name ?? t('home.noCustomer')}</p>
              {customer && (
                <button onClick={() => navigate(`/customers/${customer.id}`)} className="text-xs text-blue-500 font-medium mt-0.5">
                  {t('job.viewHistory')}
                </button>
              )}
              {customer?.address && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={11} strokeWidth={1.5} />
                  {customer.address}
                </p>
              )}
            </div>
            {customer?.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg shrink-0">
                <Phone size={12} strokeWidth={1.5} />
                {customer.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} strokeWidth={1.5} />
              {t('job.receiptPrefix')} {job.receiptDate}
            </span>
            {job.visitDate && (
              <span className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} />
                {t('job.visitPrefix')} {job.visitDate}{job.visitTime ? ` ${job.visitTime}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 단계 버튼 */}
        {!isDone ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => patch({ status: 'received' })}
              className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                !isProgress
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md ring-2 ring-blue-300'
                  : 'bg-white text-gray-500 border-gray-300 font-medium'
              }`}
            >
              {t('job.statusReceived')}
            </button>
            <button
              onClick={() => patch({ status: 'inprogress' })}
              className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                isProgress
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md ring-2 ring-blue-300'
                  : 'bg-white text-gray-500 border-gray-300 font-medium'
              }`}
            >
              {t('job.statusInProgress')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-xs font-semibold text-emerald-600">{t('job.statusDone')}</span>
              {job.completedAt && (
                <span className="text-xs text-emerald-700">
                  {toLocalISO(new Date(job.completedAt))}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate(`/service/${id}/billing`)}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-900 border border-blue-950 rounded-xl shadow-sm active:opacity-80"
            >
              <span className="text-sm font-medium text-white">{t('job.sectionCost')}</span>
              <span className="text-sm font-bold text-white">
                {totalCost > 0 ? `${money(totalCost)}` : t('job.notEntered')}
              </span>
            </button>
          </>
        )}

        {/* 결제 받음 토글 — cost > 0 일 때만 */}
        {(job.cost || 0) > 0 && (
          <button
            onClick={() => patch({ paid: !job.paid })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl shadow-md text-white font-bold transition-colors ${
              job.paid
                ? 'bg-emerald-600 active:bg-emerald-700'
                : 'bg-amber-500 active:bg-amber-600'
            }`}
          >
            <span className="text-sm">
              {job.paid ? t('job.paidYes') : t('job.paidNo')}
            </span>
            <span className="text-sm">
              {money((job.cost || 0))}
            </span>
          </button>
        )}

        {/* 접수 정보 */}
        <Section title={t('job.sectionReceipt')}>
          {(job.symptoms ?? job.symptom)
            ? <InfoRow label={t('job.labelSymptom')} value={job.symptoms ?? job.symptom} />
            : <p className="text-sm text-gray-400">{t('home.noSymptom')}</p>
          }
          {job.notes && !isProgress && !isDone && <InfoRow label={t('job.labelNotes')} value={job.notes} />}
        </Section>

        {/* 방문 예약 — 접수 단계에서만 (진행/완료 시엔 이미 방문 다녀온 상태) */}
        {!isProgress && !isDone && (
        <Section title={t('job.sectionReservation')}>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('job.labelVisitDate')}</label>
            <DateInput value={job.visitDate ?? ''} onChange={(v) => patch({ visitDate: v })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('job.labelVisitTime')} <span className="text-gray-300">{t('job.labelOptional')}</span></label>
            <TimeInput
              value={job.visitTime ?? ''}
              onChange={(v) => patch({ visitTime: v })}
            />
          </div>
        </Section>
        )}

        {/* 알람 설정 (접수 단계에서만) */}
        {!isProgress && !isDone && (
          <>
            <button
              onClick={() => { setEditingAlarmId(null); setAlarmDate(job.visitDate || todayLocal()); setAlarmTime(''); setAlarmOpen(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 active:bg-amber-100"
            >
              <Bell size={15} strokeWidth={1.5} />
              {t('userAlarm.setForJob')}
            </button>

            {/* 이 건 알람 리스트 */}
            {jobAlarms && jobAlarms.length > 0 && (
              <div className="space-y-2 mt-2">
                {jobAlarms.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                    <button
                      onClick={() => { setEditingAlarmId(a.id); setAlarmDate(a.date); setAlarmTime(a.time); setAlarmOpen(true) }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      <Bell size={16} strokeWidth={1.5} className="text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">{a.date} {a.time}</span>
                      {a.fired ? <span className="text-xs font-medium text-yellow-500">({t('userAlarm.fired')})</span> : null}
                    </button>
                    <button
                      onClick={async () => { await softDelete('user_alarms', a.id); }}
                      className="text-gray-400 active:text-red-400 p-1"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 진행 단계 내용 */}
        {(isProgress || isDone) && (
          <>
            {/* 입력 모드: 1차/2차 토글 + 선택된 단계 폼 */}
            {!isDone && knowhowReady && (
              <>
                {/* 단계 미선택 시 매뉴얼 안내 (다크/라이트 모두 가독) */}
                {!stage && (
                  <div className="bg-violet-600/15 border border-violet-500/40 rounded-lg px-4 py-3 text-xs text-gray-200 leading-relaxed space-y-1.5">
                    <p className="font-semibold text-violet-300">{t('job.stageIntroTitle')}</p>
                    <p>{t('job.stageIntro1')}</p>
                    <p>{t('job.stageIntro2')}</p>
                    <p className="text-[11px] text-gray-400 pt-1">{t('job.stageIntroHint')}</p>
                  </div>
                )}
                <div ref={stageTopRef} className="grid grid-cols-2 gap-2 scroll-mt-4">
                  <button
                    onClick={() => setStage(1)}
                    className={`py-3 rounded-xl text-sm font-semibold text-white transition-all ${
                      stage === 1
                        ? 'bg-blue-600 shadow-md ring-2 ring-blue-300'
                        : 'bg-blue-700/70 active:bg-blue-700'
                    }`}
                  >
                    {t('job.stage1Btn')}
                  </button>
                  <button
                    onClick={() => setStage(2)}
                    className={`py-3 rounded-xl text-sm font-semibold text-white transition-all ${
                      stage === 2
                        ? 'bg-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-emerald-700/70 active:bg-emerald-700'
                    }`}
                  >
                    {t('job.stage2Btn')}
                  </button>
                </div>

                {stage && (
                  <>
                    <div className={`rounded-lg px-3 py-2.5 text-sm leading-snug font-medium text-white shadow-md ${
                      stage === 1 ? 'bg-blue-600 border border-blue-500'
                                  : 'bg-emerald-600 border border-emerald-500'
                    }`}>
                      💡 {stage === 1 ? t('job.stage1Guide') : t('job.stage2Guide')}
                    </div>
                    <KnowhowFormBody form={knowhow} setForm={setKnowhow} hideCustomer stage={stage} />
                  </>
                )}
              </>
            )}

            {/* 완료 모드: 읽기 전용 */}
            {isDone && (
              <>
                <Section title={t('job.sectionDiagnosis')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.cause ?? job.diagnosis) || t('job.notEntered')}</p>
                </Section>
                <Section title={t('job.sectionMaterials')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.parts ?? job.materials) || t('job.notEntered')}</p>
                </Section>
                <Section title={t('job.sectionWorkDone')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.solution ?? job.workDone) || t('job.notEntered')}</p>
                </Section>
                {/* 장비 정보 — equipments 우선, 없으면 옛 equipPhotos만 표시 */}
                {((job.equipments ?? []).length > 0 || (job.equipPhotos ?? []).length > 0) && (
                  <Section title={t('knowhow.equipPhotos')}>
                    {(job.equipments ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {job.equipments.map((eq, i) => {
                          const isAnalyzed = !!(eq.kind || eq.brand || eq.model)
                          const isScanning = scanningIdxs.has(i)
                          return (
                          <div key={i} className="relative w-full bg-white border-2 border-gray-300 rounded-xl p-2 shadow-sm">
                            <div className="grid grid-cols-[96px_1fr] gap-2">
                              <button
                                onClick={() => setEquipLightboxIdx(i)}
                                className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-md overflow-hidden block"
                              >
                                {(eq.photo || eq.storagePath) && (
                                  <MediaImage
                                    dataUrl={eq.photo}
                                    storagePath={eq.storagePath}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </button>
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
                                      onClick={() => handleEquipScanInDone(i)}
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
                                    onClick={() => handleEquipScanInDone(i)}
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
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {(() => {
                          const photos = job.equipPhotos ?? []
                          const paths = job.equipPhotoPaths ?? []
                          const len = Math.max(photos.length, paths.length)
                          return Array.from({ length: len }).map((_, i) => (
                            <MediaImage
                              key={i}
                              dataUrl={photos[i]}
                              storagePath={paths[i]}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          ))
                        })()}
                      </div>
                    )}
                  </Section>
                )}
              </>
            )}

            {/* 완료 모드: 메모 (입력 모드는 KnowhowFormBody 안) */}
            {isDone && (
              <Section title={t('job.sectionNotes')}>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.notes || t('job.notEntered')}</p>
              </Section>
            )}

            {/* 1차 단계: 임시 저장 (단계 선택했을 때만 노출) */}
            {!isDone && stage === 1 && (
              <div className="space-y-2">
                <button
                  onClick={handleTempSave}
                  disabled={tempSaving || completing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl active:bg-violet-700 shadow-md disabled:opacity-50"
                >
                  <Save size={15} strokeWidth={2} />
                  {tempSaving ? t('common.saving') : t('job.tempSave')}
                </button>
              </div>
            )}

            {/* 2차 단계: 완료 처리 (2차 필드 1개라도 채워지면 활성) */}
            {!isDone && stage === 2 && (() => {
              const stage2Has = !!(
                knowhow.cause || knowhow.checkSteps || knowhow.solution ||
                knowhow.parts || knowhow.notes ||
                (knowhow.equipments ?? []).length > 0 ||
                (photos ?? []).length > 0
              )
              return (
                <div className="space-y-2">
                  <button
                    onClick={handleComplete}
                    disabled={completing || tempSaving || !stage2Has}
                    className="w-full py-3.5 text-sm font-semibold bg-emerald-500 text-white rounded-xl active:opacity-80 disabled:opacity-50"
                  >
                    {completing ? t('common.saving') : t('job.complete')}
                  </button>
                  {!stage2Has && (
                    <p className="text-[11px] text-gray-400 text-center px-2 leading-snug">
                      {t('job.completeNeedStage2')}
                    </p>
                  )}
                </div>
              )
            })()}

            {/* 설비 기록 만들기 (AS 데이터 prefill) */}
            {isDone && (
              <button onClick={handleCreateKnowhow}
                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl active:bg-violet-700 shadow-md">
                <ClipboardList size={15} strokeWidth={2} />
                {t('job.saveAsKnowhow')}
              </button>
            )}

          </>
        )}

        {/* 계약 점검 리스트 */}
        <button onClick={() => navigate('/checklist')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl active:bg-gray-50 shadow-sm">
          <ClipboardList size={15} strokeWidth={1.5} />
          {t('job.contractChecklist')}
        </button>

      </div>

      {/* 사진 라이트박스 모달 — 큰 화면 보기 + 좌우 네비게이션 */}
      {lightboxIndex != null && photos?.[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null) }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={24} strokeWidth={2} className="rotate-180" />
            </button>
          )}
          <MediaImage
            dataUrl={photos[lightboxIndex].dataUrl}
            storagePath={photos[lightboxIndex].storagePath}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* 장비 사진 라이트박스 (완료 모드) */}
      {equipLightboxIdx != null && (() => {
        const eq = (job.equipments ?? [])[equipLightboxIdx]
        return eq && (eq.photo || eq.storagePath)
      })() && (
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
          {equipLightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(equipLightboxIdx - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ‹
            </button>
          )}
          {equipLightboxIdx < (job.equipments ?? []).length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(equipLightboxIdx + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ›
            </button>
          )}
          <MediaImage
            dataUrl={(job.equipments ?? [])[equipLightboxIdx]?.photo}
            storagePath={(job.equipments ?? [])[equipLightboxIdx]?.storagePath}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {equipLightboxIdx + 1} / {(job.equipments ?? []).length}
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 — cascade 영향 데이터 개수 표시 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-2">{t('job.deleteTitle')}</p>
            <p className="text-sm text-gray-600 mb-3">{t('customer.deleteCascadeWarning')}</p>
            <ul className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 space-y-0.5">
              <li>• {t('job.cascadePhotos')}: <span className="font-bold">{(photos ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('job.cascadeExpenses')}: <span className="font-bold">{(jobExpenses ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('job.cascadeAlarms')}: <span className="font-bold">{(jobAlarms ?? []).length}{t('customer.cascadeUnit')}</span></li>
            </ul>
            {(linkedKnowhow ?? []).length > 0 && (
              <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                ℹ️ {t('job.knowhowPreserved', { count: linkedKnowhow.length })}
              </p>
            )}
            <p className="text-xs text-red-600 font-semibold mb-4 leading-relaxed">⚠️ {t('job.deleteIrreversibleDetail')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600">{t('job.cancel')}</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl active:bg-red-700">{t('job.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 알람 설정 모달 */}
      {alarmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editingAlarmId ? t('userAlarm.editAlarm') : t('userAlarm.setForJob')}</h3>
              <button onClick={() => { setAlarmOpen(false); setEditingAlarmId(null) }} className="text-gray-400 text-sm">{t('settings.close')}</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {customer?.name ?? t('home.noCustomer')} · {job.visitDate || '-'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.date')}</label>
                <DateInput value={alarmDate} onChange={setAlarmDate} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.alarmTime')}</label>
                <TimeInput value={alarmTime} onChange={setAlarmTime} />
              </div>
            </div>
            <button
              onClick={handleSaveAlarm}
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

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
