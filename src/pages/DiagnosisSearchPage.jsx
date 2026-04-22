import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import casesData from '../data/cases.v3.json'

function pickLang(field, lang) {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field[lang] || field.en || field.ko || ''
}

function norm(s) {
  return (s || '').toLowerCase().replace(/\s+/g, '')
}

function getSearchableText(caseItem, lang) {
  const parts = [
    pickLang(caseItem.title, lang),
    pickLang(caseItem.tip, lang),
    ...(caseItem.keywords || []),
    ...(caseItem.causes || []).flatMap(c => [
      pickLang(c.name, lang),
      pickLang(c.check, lang),
      pickLang(c.fix, lang),
    ]),
  ]
  return norm(parts.join(' '))
}

function matchLocation(caseItem, lang, words) {
  const title = norm(pickLang(caseItem.title, lang))
  const tip = norm(pickLang(caseItem.tip, lang))
  const keywords = norm((caseItem.keywords || []).join(' '))
  const causeNames = norm((caseItem.causes || []).map(c => pickLang(c.name, lang)).join(' '))
  const causeActions = norm((caseItem.causes || []).map(c =>
    pickLang(c.check, lang) + ' ' + pickLang(c.fix, lang)
  ).join(' '))

  const inTitle = words.every(w => title.includes(w))
  if (inTitle) return 'title'

  const inCauses = words.every(w => causeNames.includes(w))
  if (inCauses) return 'cause'

  const inActions = words.every(w => causeActions.includes(w))
  if (inActions) return 'action'

  const inOther = words.every(w => (tip + keywords).includes(w))
  if (inOther) return 'other'

  return null
}

export default function DiagnosisSearchPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.split('-')[0]
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const cases = casesData.cases || []

  const results = useMemo(() => {
    const q = submitted.trim().toLowerCase()
    if (!q) return null
    const words = q.split(/\s+/).filter(Boolean)
    if (!words.length) return null

    const groups = { title: [], cause: [], action: [], other: [] }
    for (const c of cases) {
      const text = getSearchableText(c, lang)
      if (!words.every(w => text.includes(w))) continue
      const loc = matchLocation(c, lang, words)
      if (loc) groups[loc].push(c)
    }
    return groups
  }, [submitted, lang, cases])

  const totalResults = results
    ? results.title.length + results.cause.length + results.action.length + results.other.length
    : 0

  const groupLabels = {
    title: t('diagSearch.matchTitle'),
    cause: t('diagSearch.matchCause'),
    action: t('diagSearch.matchAction'),
    other: t('diagSearch.matchOther'),
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(query)
    setExpandedId(null)
  }

  const clear = () => {
    setQuery('')
    setSubmitted('')
    setExpandedId(null)
  }

  return (
    <div className="p-4 pb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">
        {t('diagSearch.title')}
      </h2>

      <form onSubmit={onSubmit} className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('diagSearch.placeholder')}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </form>

      {!submitted && (
        <div className="text-xs text-gray-500 space-y-2 mt-6">
          <p>{t('diagSearch.hintLine1')}</p>
          <p>{t('diagSearch.hintLine2')}</p>
          <p className="text-gray-400">{t('diagSearch.hintLine3')}</p>
        </div>
      )}

      {submitted && totalResults === 0 && (
        <div className="text-sm text-gray-500 mt-4 text-center">
          <p className="mb-2">{t('diagSearch.noResults', { q: submitted })}</p>
          <p className="text-xs text-gray-400">{t('diagSearch.noResultsHint')}</p>
        </div>
      )}

      {submitted && totalResults > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            {t('diagSearch.resultsCount', { count: totalResults })}
          </p>

          {['title', 'cause', 'action', 'other'].map(group => {
            const list = results[group]
            if (!list.length) return null
            return (
              <div key={group}>
                <h3 className="text-xs font-medium text-gray-600 mb-2">
                  {groupLabels[group]} ({list.length})
                </h3>
                <div className="space-y-1.5">
                  {list.map(c => (
                    <CaseCard
                      key={c.id}
                      caseItem={c}
                      lang={lang}
                      expanded={expandedId === c.id}
                      onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CaseCard({ caseItem, lang, expanded, onToggle }) {
  const { t } = useTranslation()
  const title = pickLang(caseItem.title, lang)
  const tip = pickLang(caseItem.tip, lang)

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left active:bg-gray-50"
      >
        <span className="text-sm text-gray-900 flex-1">{title}</span>
        {expanded
          ? <ChevronUp size={14} className="text-gray-400 shrink-0" strokeWidth={1.5} />
          : <ChevronDown size={14} className="text-gray-400 shrink-0" strokeWidth={1.5} />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
          {(caseItem.causes || []).map((cause, idx) => (
            <div key={idx} className="pt-3">
              <p className="text-xs font-medium text-gray-700 mb-1">
                {idx + 1}. {pickLang(cause.name, lang)}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <span className="text-gray-400">{t('diagSearch.check')}: </span>
                {pickLang(cause.check, lang)}
              </p>
              <p className="text-xs text-gray-600">
                <span className="text-gray-400">{t('diagSearch.fix')}: </span>
                {pickLang(cause.fix, lang)}
              </p>
            </div>
          ))}
          {tip && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">{t('diagSearch.tip')}: </span>
                {tip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
