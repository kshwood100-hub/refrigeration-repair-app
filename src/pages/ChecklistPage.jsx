import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, XCircle, AlertCircle } from 'lucide-react'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { useLocalField } from '../hooks/useLang'

const PASS_THRESHOLD = 0.8 // 80%

function itemBg(ans) {
  if (ans === 'ok')  return 'bg-emerald-50 border-emerald-200'
  if (ans === 'mid') return 'bg-amber-50  border-amber-200'
  if (ans === 'bad') return 'bg-red-50    border-red-200'
  return 'bg-white border-gray-200'
}

export default function ChecklistPage() {
  const { t, i18n } = useTranslation()
  const lf = useLocalField()
  const lang = i18n.language.split('-')[0]
  const templates = useLiveQuery(() => db.checklist_templates.toArray(), [])
  const localItems = (tmpl) => {
    if (!tmpl) return []
    if (lang === 'ko') return tmpl.items || []
    const arr = tmpl[`items_${lang}`] ?? tmpl.items_en ?? tmpl.items
    return arr || []
  }
  const [selected, setSelected]   = useState(null)
  const [answers,  setAnswers]    = useState({})
  const [view,     setView]       = useState('list') // 'list' | 'check' | 'result'
  const [saved,    setSaved]      = useState(false)

  const OPTIONS = [
    { value: 'ok',  label: t('checklist.optionOk'),  score: 1.0, color: 'bg-emerald-500 text-white', border: 'border-emerald-500' },
    { value: 'mid', label: t('checklist.optionMid'), score: 0.5, color: 'bg-amber-400 text-white',   border: 'border-amber-400' },
    { value: 'bad', label: t('checklist.optionBad'), score: 0,   color: 'bg-red-500 text-white',     border: 'border-red-500' },
  ]

  if (!templates) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  const setAnswer = (i, val) => setAnswers(prev => ({ ...prev, [i]: val }))

  const selectedItems = selected ? localItems(selected) : []
  const total         = selectedItems.length
  const answeredCount = Object.keys(answers).length
  const rawScore      = selected
    ? selectedItems.reduce((sum, _, i) => {
        const opt = OPTIONS.find(o => o.value === answers[i])
        return sum + (opt ? opt.score : 0)
      }, 0)
    : 0
  const scorePct   = total ? rawScore / total : 0
  const passed     = scorePct >= PASS_THRESHOLD
  const badItems   = selectedItems.filter((_, i) => answers[i] === 'bad')
  const midItems   = selectedItems.filter((_, i) => answers[i] === 'mid')

  async function saveResult() {
    if (saved || !selected) return
    try {
      await db.checklist_results.add({
        templateId:    selected.id,
        templateTitle: lf(selected, 'title'),
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

  const dateStr   = new Date().toLocaleDateString()
  const shareText = selected ? [
    t('checklist.shareTitle'),
    `${t('checklist.shareItemLabel')}: ${lf(selected, 'title')}`,
    `${t('checklist.shareDateLabel')}: ${dateStr}`,
    `${t('checklist.shareScoreLabel')}: ${Math.round(scorePct * 100)}`,
    `${t('checklist.shareJudgmentLabel')}: ${passed ? `✅ ${t('checklist.passResult')}` : `⚠️ ${t('checklist.failResult')}`}`,
    badItems.length ? `\n${t('checklist.shareImmediateHeader', { count: badItems.length })}` : '',
    ...badItems.map(item => `  • ${item}`),
    midItems.length ? `\n${t('checklist.shareCautionHeader', { count: midItems.length })}` : '',
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
                <span className="text-xs font-medium text-gray-400 block mb-0.5">{lf(tmpl, 'category')}</span>
                <span className="text-sm font-medium text-gray-800">{lf(tmpl, 'title')}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{localItems(tmpl).length}{t('checklist.itemUnit')}</span>
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
          {t('checklist.viewChecklist')}
        </button>

        {/* 판정 배너 */}
        <div className={`rounded-2xl p-5 mb-4 text-center ${passed ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div className="text-3xl mb-2">{passed ? '✅' : '⚠️'}</div>
          <div className="text-white font-black text-2xl mb-1">
            {passed ? t('checklist.passResult') : t('checklist.failResult')}
          </div>
          <div className="text-white/80 text-sm">
            {t('checklist.totalScore', { score: Math.round(scorePct * 100) })}
          </div>
        </div>

        {/* 점수 바 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">{lf(selected, 'title')}</span>
            <span className={`font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.round(scorePct * 100)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-3 rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.round(scorePct * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t('checklist.passLine', { threshold: Math.round(PASS_THRESHOLD * 100) })}</span>
            <span>{t('checklist.scoreSummary', {
              ok:  selectedItems.filter((_, i) => answers[i] === 'ok').length,
              mid: midItems.length,
              bad: badItems.length,
            })}</span>
          </div>
        </div>

        {/* 즉각조치 항목 */}
        {badItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
              <XCircle size={14} />
              {t('checklist.immediateItems', { count: badItems.length })}
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
              {t('checklist.cautionItems', { count: midItems.length })}
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
          <p className="text-xs font-semibold text-gray-500 mb-2">{t('checklist.sharePreview')}</p>
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
                showToast(t('checklist.copied'))
              }
            }}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl text-sm active:bg-blue-700"
          >
            📤 {t('checklist.saveAndShare')}
          </button>
          <button
            onClick={() => { setView('list'); setSelected(null); setAnswers({}); setSaved(false) }}
            className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-2xl text-sm active:bg-gray-200"
          >
            🔄 {t('checklist.newCheck')}
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
        {t('checklist.backToList')}
      </button>

      <h2 className="text-base font-semibold text-gray-900 mb-4 truncate">{lf(selected, 'title')}</h2>

      {/* 진행률 */}
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{t('checklist.progressLabel')}</span>
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
        {selectedItems.map((item, i) => {
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
          📋 {t('checklist.viewResult')}
        </button>
      )}
    </div>
  )
}
