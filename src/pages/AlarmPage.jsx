import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Trash2, Bell, BellOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { softDelete } from '../utils/cloudSync'
import { requestNotificationPermission } from '../utils/alarmManager'
import { showToast } from '../utils/toast'
import DateInput from '../components/DateInput'
import { todayLocal } from '../utils/date'

export default function AlarmPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const highlightId = Number(searchParams.get('id')) || null
  const highlightRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const alarms = useLiveQuery(
    () => db.user_alarms?.orderBy('date').filter((r) => !r.deletedAt).toArray().catch(() => []),
    []
  )

  // 알림에서 들어온 경우 → 해당 알람으로 스크롤 + 2초간 강조
  useEffect(() => {
    if (!highlightId || !alarms) return
    const el = highlightRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, alarms])

  const todayStr = todayLocal()

  async function handleAdd() {
    if (!date || !time) return showToast(t('userAlarm.dateTimeRequired'))
    const granted = await requestNotificationPermission()
    if (!granted) return showToast(t('userAlarm.permissionDenied'))

    await db.user_alarms.add({
      title: title.trim() || '',
      date,
      time,
      note: note.trim(),
      fired: 0,
      createdAt: new Date().toISOString(),
    })

    setTitle('')
    setDate('')
    setTime('')
    setNote('')
    setShowForm(false)
  }

  async function handleDelete(id) {
    await softDelete('user_alarms', id)
  }

  const upcoming = (alarms ?? []).filter(a => !a.fired && (a.date > todayStr || (a.date === todayStr && a.time >= new Date().toTimeString().slice(0, 5))))
  const past = (alarms ?? []).filter(a => a.fired || a.date < todayStr || (a.date === todayStr && a.time < new Date().toTimeString().slice(0, 5)))

  return (
    <div className="p-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <h2 className="text-lg font-bold flex-1">{t('userAlarm.title')}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"
        >
          <Plus size={18} strokeWidth={2} />
        </button>
      </div>

      {/* 예정된 알람 */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('userAlarm.upcoming')}</div>
          <div className="space-y-2">
            {upcoming.map(a => (
              <div
                key={a.id}
                ref={a.id === highlightId ? highlightRef : null}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${a.id === highlightId ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}`}
              >
                <Bell size={16} strokeWidth={1.5} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{a.title || t('userAlarm.defaultTitle')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.date} {a.time}</div>
                  {a.note && <div className="text-xs text-gray-500 mt-1">{a.note}</div>}
                </div>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 active:text-red-500">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 지난 알람 */}
      {past.length > 0 && (
        <section className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('userAlarm.past')}</div>
          <div className="space-y-2">
            {past.map(a => (
              <div
                key={a.id}
                ref={a.id === highlightId ? highlightRef : null}
                className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${a.id === highlightId ? 'border-blue-500 ring-2 ring-blue-300 opacity-100' : 'border-gray-200 opacity-50'}`}
              >
                <BellOff size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-600 truncate">{a.title || t('userAlarm.defaultTitle')}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.date} {a.time}</div>
                </div>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 active:text-red-500">
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 비어있을 때 */}
      {(alarms ?? []).length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-16">
          <Bell size={32} strokeWidth={1} className="mx-auto mb-3 text-gray-300" />
          <p>{t('userAlarm.empty')}</p>
          <p className="text-xs mt-1">{t('userAlarm.emptyHint')}</p>
        </div>
      )}

      {/* 알람 생성 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('userAlarm.new')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-sm">{t('settings.close')}</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.alarmTitle')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('userAlarm.titlePlaceholder')}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.date')}</label>
                  <DateInput value={date} onChange={setDate} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.time')}</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.note')}</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('userAlarm.notePlaceholder')}
                  rows={2}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
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
