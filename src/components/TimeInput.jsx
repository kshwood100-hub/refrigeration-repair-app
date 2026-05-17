import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// 인라인 시간 입력 — 두 input box (HH : MM) 직접 입력 방식.
// 드롭다운/팝업 없음 → 모달 안에서도 잘림 0, OS 의존 0.
// inputMode="numeric"으로 모바일 숫자 키패드 자동 호출.
function pad(n) { return String(n).padStart(2, '0') }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

export default function TimeInput({
  value,
  onChange,
  minHour = 0,
  maxHour = 23,
  // minuteStep / placeholder는 인라인 폼에서 의미 없지만 호출자 호환을 위해 받아만 둠
  minuteStep,
  placeholder,
  className,
}) {
  const { t } = useTranslation()
  const hourRef = useRef(null)
  const minRef = useRef(null)

  // value="HH:MM" 형식 → 두 칸으로 분리. 빈 값 또는 잘못된 형식이면 빈 칸.
  const initial = (() => {
    if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
      const [hh, mm] = value.split(':')
      return [hh.padStart(2, '0'), mm]
    }
    return ['', '']
  })()
  const [hh, setHh] = useState(initial[0])
  const [mm, setMm] = useState(initial[1])

  // 외부 value 바뀌면 동기화
  useEffect(() => {
    if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
      const [a, b] = value.split(':')
      setHh(a.padStart(2, '0'))
      setMm(b)
    } else if (!value) {
      setHh('')
      setMm('')
    }
  }, [value])

  function emit(newHh, newMm) {
    if (newHh === '' && newMm === '') {
      onChange?.('')
      return
    }
    if (newHh !== '' && newMm !== '') {
      onChange?.(`${pad(newHh)}:${pad(newMm)}`)
    }
  }

  // 1자리 입력 시 emit X — 불완전 상태로 부모 갱신 시 useEffect 재진입으로 입력 락 결함 발생
  // 2자리 완료 또는 blur(onHourBlur/onMinuteBlur)에서만 emit
  function onHourChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
    setHh(raw)
    if (raw.length === 2) {
      const n = clamp(Number(raw), minHour, maxHour)
      const fixed = pad(n)
      setHh(fixed)
      emit(fixed, mm)
      minRef.current?.focus()
      minRef.current?.select?.()
    }
  }

  function onMinuteChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
    setMm(raw)
    if (raw.length === 2) {
      const n = clamp(Number(raw), 0, 59)
      const fixed = pad(n)
      setMm(fixed)
      emit(hh, fixed)
    }
  }

  // blur 시 1자리 입력 처리 — pad해서 emit (예: "5" → "05")
  // hh/mm state 대신 e.target.value 직접 읽기 — stale closure 회피
  // (onHourChange의 length===2 분기에서 minRef.focus() 호출 시 시 칸 blur가 발생,
  //  그 시점의 closure hh는 아직 '1' 상태라 잘못된 length 1 분기 진입 → 입력 덮어씀)
  function onHourBlur(e) {
    const raw = (e.target.value || '').replace(/[^\d]/g, '')
    if (raw.length === 1) {
      const n = clamp(Number(raw), minHour, maxHour)
      const fixed = pad(n)
      setHh(fixed)
      emit(fixed, mm)
    }
  }

  function onMinuteBlur(e) {
    const raw = (e.target.value || '').replace(/[^\d]/g, '')
    if (raw.length === 1) {
      const n = clamp(Number(raw), 0, 59)
      const fixed = pad(n)
      setMm(fixed)
      emit(hh, fixed)
    }
  }

  // 분 칸에서 백스페이스 + 빈 칸이면 시 칸으로 포커스 이동
  function onMinuteKeyDown(e) {
    if (e.key === 'Backspace' && mm === '') {
      hourRef.current?.focus()
    }
  }

  function clear() {
    setHh('')
    setMm('')
    onChange?.('')
    hourRef.current?.focus()
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={hh}
        onChange={onHourChange}
        onBlur={onHourBlur}
        onFocus={(e) => e.target.select()}
        placeholder="HH"
        className="w-14 text-center text-base font-semibold border border-gray-300 rounded-lg px-2 py-2 bg-white text-gray-900 outline-none focus:border-blue-500"
      />
      <span className="text-base font-semibold text-gray-500">:</span>
      <input
        ref={minRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={mm}
        onChange={onMinuteChange}
        onKeyDown={onMinuteKeyDown}
        onBlur={onMinuteBlur}
        placeholder="MM"
        className="w-14 text-center text-base font-semibold border border-gray-300 rounded-lg px-2 py-2 bg-white text-gray-900 outline-none focus:border-blue-500"
      />
      {(hh || mm) && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-gray-400 active:text-red-500 px-1.5 py-1"
        >
          {t('common.clear')}
        </button>
      )}
    </div>
  )
}
