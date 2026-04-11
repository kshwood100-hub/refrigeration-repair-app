import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, XCircle, AlertCircle } from 'lucide-react'
import { db } from '../db'

const PASS_THRESHOLD = 0.8 // 80%

// 답변 옵션
const OPTIONS = [
  { value: 'ok',  label: '정상', score: 1.0, color: 'bg-emerald-500 text-white', border: 'border-emerald-500' },
  { value: 'mid', label: '보통', score: 0.5, color: 'bg-amber-400 text-white',   border: 'border-amber-400' },
  { value: 'bad', label: '비정상', score: 0,  color: 'bg-red-500 text-white',    border: 'border-red-500' },
]

function itemBg(ans) {
  if (ans === 'ok')  return 'bg-emerald-50 border-emerald-200'
  if (ans === 'mid') return 'bg-amber-50  border-amber-200'
  if (ans === 'bad') return 'bg-red-50    border-red-200'
  return 'bg-white border-gray-200'
}

export default function ChecklistPage() {
  const { t } = useTranslation()
  const templates = useLiveQuery(() => db.checklist_templates.toArray(), [])
  const [selected, setSelected]   = useState(null)
  const [answers,  setAnswers]    = useState({})   // { [i]: 'ok' | 'mid' | 'bad' }
  const [view,     setView]       = useState('list') // 'list' | 'check' | 'result'
  const [saved,    setSaved]      = useState(false)

  if (!templates) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  const setAnswer = (i, val) => setAnswers(prev => ({ ...prev, [i]: val }))

  const total         = selected?.items.length ?? 0
  const answeredCount = Object.keys(answers).length
  const rawScore      = selected
    ? selected.items.reduce((sum, _, i) => {
        const opt = OPTIONS.find(o => o.value === answers[i])
        return sum + (opt ? opt.score : 0)
      }, 0)
    : 0
  const scorePct   = total ? rawScore / total : 0
  const passed     = scorePct >= PASS_THRESHOLD
  const badItems   = selected ? selected.items.filter((_, i) => answers[i] === 'bad') : []
  const midItems   = selected ? selected.items.filter((_, i) => answers[i] === 'mid') : []

  async function saveResult() {
    if (saved || !selected) return
    try {
      await db.checklist_results.add({
        templateId:    selected.id,
        templateTitle: selected.title,
        createdAt:     new Date().toISOString(),
        score:         Math.round(scorePct * 100),
        level:         passed ? 'pass' : 'fail',
        answers:       { ...answers },
        badItems,
        midItems,
      })
      setSaved(true)
    } catch (e) { console.error(e) }
  }

  const dateStr   = new Date().toLocaleDateString('ko-KR')
  const shareText = selected ? [
    `[냉동기 점검 결과]`,
    `점검항목: ${selected.title}`,
    `점검일: ${dateStr}`,
    `점수: ${Math.round(scorePct * 100)}점`,
    `판정: ${passed ? '✅ 선택조치 가능' : '⚠️ 즉각조치 필요'}`,
    badItems.length  ? `\n[즉각조치 항목 ${badItems.length}건]`  : '',
    ...badItems.map(item => `  • ${item}`),
    midItems.length  ? `\n[주의 항목 ${midItems.length}건]`       : '',
    ...midItems.map(item => `  • ${item}`),
  ].filter(Boolean).join('\n') : ''

  /* ─── 목록 ─────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <div className="p-4 pb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">{t('checklist.title')}</h2>
        <div className="space-y-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => { setSelected(tmpl); setAnswers({}); setSaved(false); setView('check') }}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm text-left active:bg-gray-50"
            >
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 block mb-0.5">{tmpl.category}</span>
                <span className="text-sm font-medium text-gray-800">{tmpl.title}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{tmpl.items.length}개</span>
              <ChevronRight size={15} strokeWidth={1.5} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ─── 결과 ─────────────────────────────────────────── */
  if (view === 'result') {
    return (
      <div className="p-4 pb-10">
        <button
          onClick={() => setView('check')}
          className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          점검 내용 보기
        </button>

        {/* 판정 배너 */}
        <div className={`rounded-2xl p-5 mb-4 text-center ${passed ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div className="text-3xl mb-2">{passed ? '✅' : '⚠️'}</div>
          <div className="text-white font-black text-2xl mb-1">
            {passed ? '선택조치 가능' : '즉각조치 필요'}
          </div>
          <div className="text-white/80 text-sm">
            종합 점수 {Math.round(scorePct * 100)}점 / 100점
          </div>
        </div>

        {/* 점수 바 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{selected.title}</span>
            <span className={`font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.round(scorePct * 100)}점
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-3 rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.round(scorePct * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>합격선 {Math.round(PASS_THRESHOLD * 100)}점</span>
            <span>정상 {selected.items.filter((_, i) => answers[i] === 'ok').length}개 · 보통 {midItems.length}개 · 비정상 {badItems.length}개</span>
          </div>
        </div>

        {/* 즉각조치 항목 */}
        {badItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
              <XCircle size={14} />
              즉각조치 항목 ({badItems.length}건)
            </h3>
            <div className="space-y-1.5">
              {badItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <XCircle size={13} className="text-red-500 shrink-0" />
                  <span className="text-sm text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주의 항목 */}
        {midItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
              <AlertCircle size={14} />
              주의 항목 ({midItems.length}건)
            </h3>
            <div className="space-y-1.5">
              {midItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <AlertCircle size={13} className="text-amber-500 shrink-0" />
                  <span className="text-sm text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공유 미리보기 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">고객 공유용 문자 미리보기</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">{shareText}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={async () => {
              await saveResult()
              if (navigator.share) {
                navigator.share({ text: shareText }).catch(() => {})
              } else {
                navigator.clipboard?.writeText(shareText)
                alert('클립보드에 복사되었습니다.')
              }
            }}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl text-sm active:bg-blue-700"
          >
            📤 저장 &amp; 고객에게 공유
          </button>
          <button
            onClick={() => { setView('list'); setSelected(null); setAnswers({}); setSaved(false) }}
            className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-2xl text-sm active:bg-gray-200"
          >
            🔄 새 점검 시작
          </button>
        </div>
      </div>
    )
  }

  /* ─── 체크리스트 (정상/보통/비정상) ────────────────── */
  const pct        = total ? Math.round((answeredCount / total) * 100) : 0
  const allAnswered = answeredCount === total

  return (
    <div className="p-4 pb-6">
      <button
        onClick={() => setView('list')}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        목록으로
      </button>

      <h2 className="text-base font-semibold text-gray-900 mb-4 truncate">{selected.title}</h2>

      {/* 진행률 */}
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>진행률</span>
          <span className="font-semibold text-gray-800">{answeredCount} / {total}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-300 bg-gray-800"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 항목 */}
      <div className="space-y-2 mb-4">
        {selected.items.map((item, i) => {
          const ans = answers[i]
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 transition-colors ${itemBg(ans)}`}
            >
              <p className="text-sm mb-2.5 leading-snug text-gray-800">
                <span className="text-xs text-gray-400 mr-1.5">{i + 1}.</span>
                {item}
              </p>
              <div className="flex gap-1.5">
                {OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(i, opt.value)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                      ans === opt.value
                        ? `${opt.color} ${opt.border}`
                        : 'bg-gray-100 text-gray-600 border-gray-100 active:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {allAnswered && (
        <button
          onClick={() => setView('result')}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl text-sm active:bg-gray-800 shadow-lg"
        >
          📋 점검 결과 보기
        </button>
      )}
    </div>
  )
}
