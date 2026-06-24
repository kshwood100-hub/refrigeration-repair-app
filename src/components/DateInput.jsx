import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getWeekStart } from '../utils/date'

function pad(n) { return String(n).padStart(2, '0') }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function parseISO(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export default function DateInput({ value, onChange, placeholder, className }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  // 모달과 stacking context 충돌 회피 위해 캘린더를 createPortal로 document.body에 마운트
  const [anchor, setAnchor] = useState({ top: 0, left: 0, width: 0 })
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const today = new Date()
  const selected = parseISO(value)
  const [viewYear, setViewYear] = useState((selected ?? today).getFullYear())
  const [viewMonth, setViewMonth] = useState((selected ?? today).getMonth())

  useEffect(() => {
    if (!open) return
    function onClick(e) {
      const inAnchor = wrapRef.current && wrapRef.current.contains(e.target)
      const inPanel = panelRef.current && panelRef.current.contains(e.target)
      if (!inAnchor && !inPanel) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
    }
  }, [open])

  function openPicker() {
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    } else {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
    }
    // 캘린더 높이(약 280px) 기준 — 아래 공간 부족하면 위로 펼침 (모달 안 bottom-sheet 대응)
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const CAL_HEIGHT = 280
      const up = spaceBelow < CAL_HEIGHT && spaceAbove > spaceBelow
      setDropUp(up)
      setAnchor({ top: up ? rect.top : rect.bottom, left: rect.left, width: rect.width })
    }
    setOpen(true)
  }

  function pick(day) {
    const d = new Date(viewYear, viewMonth, day)
    onChange?.(toISO(d))
    setOpen(false)
  }

  function clear() {
    onChange?.('')
    setOpen(false)
  }

  function pickToday() {
    onChange?.(toISO(today))
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  // 자국 주 시작 요일 (0=일..6=토) — 유럽 월요일, 미국·한국 일요일 등
  const weekStart = getWeekStart(i18n.language)

  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() - weekStart + 7) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1
    return d >= 1 && d <= daysInMonth ? d : null
  })

  // 모든 언어에 대해 Intl API 사용 (10개 언어 자연스럽게 처리)
  const weekday = (() => {
    try {
      const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
      // 주 시작 요일부터 7일 (2024-01-07이 일요일 → weekStart만큼 이동)
      const base = new Date(2024, 0, 7 + weekStart)
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(base)
        d.setDate(base.getDate() + i)
        return fmt.format(d)
      })
    } catch {
      return ['S','M','T','W','T','F','S']
    }
  })()
  const monthLabel = (() => {
    try {
      return new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' })
    } catch {
      return `${viewYear} / ${viewMonth + 1}`
    }
  })()

  const display = selected ? toISO(selected) : ''
  const todayISO = toISO(today)

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-between gap-2 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-left active:bg-gray-50 focus:border-blue-400 outline-none"
      >
        <span className={display ? 'text-gray-900' : 'text-gray-400'}>
          {display || placeholder || t('common.selectDate')}
        </span>
        <Calendar size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white border border-gray-300 rounded-xl shadow-xl p-2"
          style={{
            zIndex: 9999,
            width: 240,
            left: anchor.left,
            top: dropUp ? undefined : anchor.top + 4,
            bottom: dropUp ? window.innerHeight - anchor.top + 4 : undefined,
          }}>
          <div className="flex items-center justify-between mb-1.5">
            <button type="button" onClick={prevMonth} className="p-1 text-gray-500 active:text-gray-800 rounded active:bg-gray-100">
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <div className="text-xs font-semibold text-gray-900">{monthLabel}</div>
            <button type="button" onClick={nextMonth} className="p-1 text-gray-500 active:text-gray-800 rounded active:bg-gray-100">
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px mb-0.5">
            {weekday.map((w, i) => (
              <div key={i} className={`text-center text-[9px] font-medium py-0.5 ${(i + weekStart) % 7 === 0 ? 'text-red-400' : (i + weekStart) % 7 === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} className="h-7" />
              const cellISO = toISO(new Date(viewYear, viewMonth, d))
              const isSelected = display === cellISO
              const isToday = todayISO === cellISO
              const dow = i % 7
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={`text-xs h-7 rounded flex items-center justify-center font-medium transition-colors ${
                    isSelected ? 'bg-blue-600 text-white'
                    : isToday ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : (dow + weekStart) % 7 === 0 ? 'text-red-500 active:bg-gray-100'
                    : (dow + weekStart) % 7 === 6 ? 'text-blue-500 active:bg-gray-100'
                    : 'text-gray-700 active:bg-gray-100'
                  }`}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-100">
            <button type="button" onClick={clear} className="text-[10px] text-gray-500 px-1.5 py-0.5 active:text-red-500">
              {t('common.clear')}
            </button>
            <button type="button" onClick={pickToday} className="text-[10px] text-blue-600 font-semibold px-1.5 py-0.5">
              {t('common.today')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
