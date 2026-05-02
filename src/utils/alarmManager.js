import { db } from '../db'
import i18n from '../i18n'
import { todayLocal, tomorrowLocal } from './date'

const t = (key, opts) => i18n.t(key, opts)

const today = todayLocal
const tomorrow = tomorrowLocal

// 알람 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// 브라우저 알림 표시 (모바일은 SW 경유 필수)
async function showNotification(title, body, url = '/alarms', tag) {
  if (Notification.permission !== 'granted') return
  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url },
    tag, // 같은 tag면 기존 알림 교체 (중복 방지)
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
      return
    }
  } catch (e) {
    // SW 경로 실패 시 데스크톱 폴백
  }
  try {
    new Notification(title, options)
  } catch (e) {
    // 모바일 등 직접 생성 불가 환경 → 무시
  }
}

// 오늘 날짜에서 특정 시각까지 남은 ms 계산
function msUntil(hour, minute = 0) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  return target.getTime() - now.getTime()
}

// "HH:MM" 문자열 + 날짜 → 남은 ms
function msUntilDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return -1
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date(dateStr + 'T00:00:00')
  target.setHours(h, m, 0, 0)
  return target.getTime() - Date.now()
}

// 이미 예약된 타이머 추적 (중복 방지)
const scheduledTimers = new Set()

function scheduleOnce(key, ms, fn) {
  if (ms <= 0) return
  if (scheduledTimers.has(key)) return
  scheduledTimers.add(key)
  setTimeout(() => {
    fn()
    scheduledTimers.delete(key)
  }, ms)
}

// 오늘 AS 방문 일정 → 9시, 10시 자동 알림
async function scheduleJobAlarms() {
  const todayStr = today()
  const jobs = await db.service_jobs
    .where('visitDate').equals(todayStr)
    .filter(j => j.status !== 'completed')
    .toArray()

  if (jobs.length === 0) return

  const customerIds = [...new Set(jobs.map(j => j.customerId).filter(Boolean))]
  const customers = await db.customers.bulkGet(customerIds)
  const customerMap = Object.fromEntries(
    customers.filter(Boolean).map(c => [c.id, c])
  )

  const names = jobs.map(j => customerMap[j.customerId]?.name ?? t('alarm.unknownCustomer')).join(', ')
  const body = t('alarm.visitScheduled', { names })

  const ms9 = msUntil(9)
  const ms10 = msUntil(10)

  scheduleOnce('job-alarm-9', ms9, () =>
    showNotification(t('alarm.todayVisit'), body, '/service', 'job-alarm-9')
  )
  scheduleOnce('job-alarm-10', ms10, () =>
    showNotification(t('alarm.todayVisitReminder'), body, '/service', 'job-alarm-10')
  )
}

// 오늘 정기점검 예정 장비 → 9:30 자동 알림
async function scheduleMaintenanceAlarms() {
  const todayStr = today()
  const items = await db.equipment_maintenance
    .where('nextDueDate').equals(todayStr)
    .toArray()

  if (items.length === 0) return

  const customerIds = [...new Set(items.map(i => i.customerId).filter(Boolean))]
  const customers = await db.customers.bulkGet(customerIds)
  const customerMap = Object.fromEntries(
    customers.filter(Boolean).map(c => [c.id, c])
  )

  items.forEach(item => {
    const customerName = customerMap[item.customerId]?.name ?? t('alarm.unknownCustomer')
    scheduleOnce(`maint-alarm-${item.id}`, msUntil(9, 30), () =>
      showNotification(t('alarm.maintenanceDue'), `${customerName} - ${item.name}`, '/service', `maint-alarm-${item.id}`)
    )
  })
}

// 사용자가 직접 만든 알람 스케줄링 (이미 울린 것은 제외)
// - 미래 알람: setTimeout 예약 (페이지 살아있는 동안 발화)
// - 과거 알람 (ms<=0): 앱 열 때 즉시 표시 → 사용자가 늦게 앱 열어도 누락 방지
async function scheduleUserAlarms() {
  const alarms = await db.user_alarms.filter((a) => !a.fired && !a.deletedAt).toArray()

  for (const alarm of alarms) {
    const ms = msUntilDateTime(alarm.date, alarm.time)
    const fire = async () => {
      showNotification(
        alarm.title || t('userAlarm.defaultTitle'),
        alarm.note || '',
        `/alarms?id=${alarm.id}`,
        `user-alarm-${alarm.id}`
      )
      await db.user_alarms.update(alarm.id, { fired: 1 })
    }
    if (ms <= 0) {
      // 이미 시각 지난 알람 → 즉시 표시
      fire()
    } else {
      scheduleOnce(`user-alarm-${alarm.id}`, ms, fire)
    }
  }
}

// 내일 일정 조회 (홈페이지 배너용)
export async function getTomorrowSchedule() {
  const tmr = tomorrow()

  const jobs = await db.service_jobs
    .where('visitDate').equals(tmr)
    .filter(j => j.status !== 'completed')
    .toArray()

  const maintenances = await db.equipment_maintenance
    .where('nextDueDate').equals(tmr)
    .toArray()

  return { jobs, maintenances }
}

// 오늘 정기점검 예정 조회 (홈페이지 표시용)
export async function getTodayMaintenances() {
  return db.equipment_maintenance
    .where('nextDueDate').equals(today())
    .toArray()
}

// 앱 시작 시 호출
export async function initAlarms() {
  const granted = await requestNotificationPermission()
  if (!granted) return
  await scheduleJobAlarms()
  await scheduleMaintenanceAlarms()
  await scheduleUserAlarms()
}
