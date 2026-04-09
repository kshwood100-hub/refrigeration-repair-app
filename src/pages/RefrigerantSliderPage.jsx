import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronDown, Search, X, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { loadSettings } from '../utils/settings'
import {
  REFRIGERANTS,
  UNITS,
  tempToPressureAbs,
  pressureAbsToTemp,
  toDisplay,
  fromDisplay,
  REF_TEMPS,
} from '../data/refrigerantsData'

export default function RefrigerantSliderPage() {
  const navigate = useNavigate()
  const [rfgId, setRfgId]             = useState('R-22')
  const [mode, setMode]               = useState('t2p')
  const [tempC, setTempC]             = useState(-10)
  const [pressureInput, setPressureInput] = useState('')
  const [unitKey, setUnitKey]         = useState(() => loadSettings().unitKey)
  const [isGauge, setIsGauge]         = useState(() => loadSettings().isGauge)
  const [showTable, setShowTable]     = useState(false)
  const [showPicker, setShowPicker]   = useState(false)
  const [search, setSearch]           = useState('')

  const rfg  = REFRIGERANTS.find((r) => r.id === rfgId)
  const unit = UNITS[unitKey]

  useEffect(() => {
    setTempC((v) => Math.min(rfg.tMax, Math.max(rfg.tMin, v)))
  }, [rfgId, rfg.tMin, rfg.tMax])

  const calculatedPressure = useMemo(() => {
    const pAbs = tempToPressureAbs(rfg, tempC)
    return toDisplay(pAbs, unitKey, isGauge)
  }, [rfg, tempC, unitKey, isGauge])

  const calculatedTemp = useMemo(() => {
    const pNum = parseFloat(pressureInput)
    if (isNaN(pNum)) return null
    const pAbs = fromDisplay(pNum, unitKey, isGauge)
    return pressureAbsToTemp(rfg, pAbs)
  }, [rfg, pressureInput, unitKey, isGauge])

  const unitLabel = `${unit.label}(${isGauge ? 'g' : 'a'})`

  const filteredRfg = REFRIGERANTS.filter((r) =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.note.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">냉매 PT 변환</h2>
      </div>

      {/* 냉매 선택 버튼 */}
      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm active:bg-gray-50"
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rfg.color }} />
          <span className="font-semibold text-gray-900 flex-1 text-left">{rfg.name}</span>
          <span className="text-xs text-gray-400 truncate max-w-[140px]">
            {rfg.note.replace(' (NIST)', '').replace(' (*근사)', '')}
          </span>
          <ChevronDown size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
        </button>
      ) : (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <Search size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="냉매 검색 (예: R-22, 프로판...)"
              className="flex-1 text-sm bg-transparent outline-none text-gray-800"
            />
            <button
              onClick={() => { setShowPicker(false); setSearch('') }}
              className="text-gray-400"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-56">
            {filteredRfg.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRfgId(r.id); setShowPicker(false); setSearch('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-gray-50 active:bg-gray-50"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                <span className="font-semibold text-sm w-16 text-left text-gray-800">{r.id}</span>
                <span className="text-xs text-gray-400 truncate flex-1 text-left">
                  {r.note.replace(' (NIST)', '').replace(' (*근사)', '')}
                </span>
                {rfgId === r.id && <Check size={13} strokeWidth={2} className="text-gray-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 단위 선택 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
          {Object.entries(UNITS).map(([key, u]) => (
            <button
              key={key}
              onClick={() => setUnitKey(key)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                unitKey === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
          {[
            { val: true,  label: '게이지(g)' },
            { val: false, label: '절대(a)' },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              onClick={() => setIsGauge(val)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                isGauge === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 모드 탭 */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
        <button
          onClick={() => setMode('t2p')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 't2p' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          온도 → 압력
        </button>
        <button
          onClick={() => setMode('p2t')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'p2t' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          압력 → 온도
        </button>
      </div>

      {/* 온도 → 압력 */}
      {mode === 't2p' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-3">온도 (°C)</p>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setTempC((v) => Math.max(rfg.tMin, v - 1))}
                className="w-10 h-10 bg-gray-100 rounded-full text-xl font-light text-gray-700 active:bg-gray-200 flex items-center justify-center"
              >−</button>
              <input
                type="number"
                value={tempC}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v)) setTempC(Math.min(rfg.tMax, Math.max(rfg.tMin, v)))
                }}
                className="flex-1 text-center text-4xl font-bold text-gray-900 bg-transparent border-none outline-none"
              />
              <button
                onClick={() => setTempC((v) => Math.min(rfg.tMax, v + 1))}
                className="w-10 h-10 bg-gray-100 rounded-full text-xl font-light text-gray-700 active:bg-gray-200 flex items-center justify-center"
              >+</button>
            </div>
            <input
              type="range"
              min={rfg.tMin} max={rfg.tMax} step={1}
              value={tempC}
              onChange={(e) => setTempC(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: rfg.color }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{rfg.tMin}°C</span>
              <span>{rfg.tMax}°C</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-2">포화압력</p>
            <div className="text-5xl font-bold mb-1" style={{ color: rfg.color }}>
              {calculatedPressure.toFixed(unit.decimals)}
            </div>
            <p className="text-sm text-gray-500">{unitLabel}</p>
          </div>

          <RefInfo rfg={rfg} />
        </div>
      )}

      {/* 압력 → 온도 */}
      {mode === 'p2t' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-2">압력 ({unitLabel})</p>
            <input
              type="number"
              step="0.01"
              value={pressureInput}
              onChange={(e) => setPressureInput(e.target.value)}
              placeholder="압력 입력"
              className="w-full text-center text-4xl font-bold text-gray-900 bg-transparent border-none outline-none"
            />
            <p className="text-xs text-gray-400 text-center mt-1">
              범위: {toDisplay(rfg.pt[0][1], unitKey, isGauge).toFixed(unit.decimals)} –{' '}
              {toDisplay(rfg.pt[rfg.pt.length - 1][1], unitKey, isGauge).toFixed(unit.decimals)} {unitLabel}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-2">포화온도</p>
            <div className="text-5xl font-bold mb-1" style={{ color: rfg.color }}>
              {calculatedTemp !== null ? calculatedTemp.toFixed(1) : '—'}
            </div>
            <p className="text-sm text-gray-500">°C</p>
          </div>

          <RefInfo rfg={rfg} />
        </div>
      )}

      {/* 참조 표 */}
      <div className="mt-5">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="w-full py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl active:bg-gray-200 flex items-center justify-center gap-2"
        >
          <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${showTable ? 'rotate-180' : ''}`} />
          {rfg.name} 참조 표
        </button>

        {showTable && (
          <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: rfg.color }}>
              <span>온도 (°C)</span>
              <span className="text-right">압력 ({unitLabel})</span>
            </div>
            <div className="overflow-y-auto max-h-52">
              {REF_TEMPS
                .filter((t) => t >= rfg.tMin && t <= rfg.tMax)
                .map((t) => {
                  const pDisp = toDisplay(tempToPressureAbs(rfg, t), unitKey, isGauge)
                  return (
                    <div key={t} className="grid grid-cols-2 px-4 py-2 text-sm border-t border-gray-50 odd:bg-gray-50">
                      <span className="text-gray-600">{t}°C</span>
                      <span className="text-right font-semibold text-gray-800">
                        {pDisp.toFixed(unit.decimals)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RefInfo({ rfg }) {
  const { info } = rfg
  if (!info) return null

  const groupColor = {
    A1: '#16A34A', A2L: '#CA8A04', A2: '#EA580C', A3: '#DC2626',
    B1: '#7C3AED', B2L: '#B45309', B2: '#9A3412', B3: '#991B1B',
  }[info.group] ?? '#6B7280'

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 border-b border-gray-50">
        냉매 정보
      </p>
      <div className="divide-y divide-gray-50">
        {[
          { label: '안전그룹', value: info.group, badge: true },
          { label: 'GWP',      value: info.gwp === 0 ? '~0' : info.gwp.toLocaleString() },
          { label: 'ODP',      value: info.odp === 0 ? '0' : String(info.odp) },
          { label: '끓는점',   value: info.tBoil != null ? `${info.tBoil}°C` : '대기압 액상 없음' },
          { label: '임계온도', value: `${info.tCrit}°C` },
        ].map(({ label, value, badge }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-gray-400">{label}</span>
            {badge
              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: groupColor }}>{value}</span>
              : <span className="text-xs font-semibold text-gray-800">{value}</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
