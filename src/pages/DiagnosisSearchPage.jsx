import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import casesData from '../data/cases.v3.json'
import casesV4Pilot from '../data/cases_v4_pilot.json'
import synonymsData from '../data/synonyms.json'
import { mapToStandardForm, getStandardLabels } from '../utils/standardForm'

// v4 (인과 중심) 스키마를 v3 (기존 UI 호환) 스키마로 런타임 변환
// 기존 CaseCard UI 재사용하면서 새 데이터 검수 가능하게 함
function v4ToV3(v4case) {
  const langKeys = ['ko','en','zh','ja','es','hi','vi','th','id','ar']
  // 다국어 객체에서 배열을 줄바꿈으로 합쳐 하나의 string으로 만듦
  function joinLang(field) {
    if (!field) return undefined
    const out = {}
    for (const l of langKeys) {
      if (Array.isArray(field[l])) out[l] = field[l].map(x => '• ' + x).join('\n')
    }
    return Object.keys(out).length ? out : undefined
  }
  const downstream = joinLang(v4case.downstream_effects)
  const causesObj = joinLang(v4case.root_causes)
  const indicators = joinLang(v4case.diagnostic_indicators)
  const actionsObj = joinLang(v4case.actions)

  return {
    id: 'v4_' + v4case.id,
    title: v4case.title,
    keywords: v4case.search_keywords || [],
    causes: [
      // 1번째: 인과 흐름 (사용자 핵심 요청 — 이 고장이 일으키는 증상)
      {
        name: { ko: '🔗 이 고장이 일으키는 증상 (인과 흐름)', en: '🔗 What This Fault Causes (Effects)' },
        check: indicators ?? { ko: '', en: '' },
        fix: downstream ?? { ko: '', en: '' },
      },
      // 2번째: 근본 원인 + 조치
      {
        name: { ko: '🔧 근본 원인 + 조치 절차', en: '🔧 Root Causes + Actions' },
        check: causesObj ?? { ko: '', en: '' },
        fix: actionsObj ?? { ko: '', en: '' },
      },
    ],
  }
}

function pickLang(field, lang) {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field[lang] || field.en || field.ko || ''
}

// 소문자만 적용. 공백은 보존 (영문 단어 경계 매칭 위해).
// 옛 알고리즘은 공백을 제거해서 "ingress via" 같은 인접 단어가 합쳐져 "sv" 같은 짧은 약어와 우연 매칭되던 결함이 있었음.
function norm(s) {
  return (s || '').toLowerCase()
}

// 동의어 매칭 — 영문/숫자/하이픈만으로 구성된 단어는 단어 경계 매칭 (\b...\b).
// CJK·아랍·태국어 등은 단어 경계 의미 없으므로 부분 문자열 그대로.
function matchTerm(text, term) {
  if (!term) return false
  if (/^[a-z0-9-]+$/.test(term)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp('\\b' + escaped + '\\b').test(text)
  }
  return text.includes(term)
}

// 검색은 모든 언어 필드에서 동시 매칭 (글로벌 사용자가 자기 언어로 검색해도 결과 보장)
const ALL_LANGS = ['ko', 'en', 'zh', 'ja', 'es', 'hi', 'vi', 'th', 'id', 'ar']

// 동의어 그룹 사전 → norm된 단어 → 그룹의 모든 norm 동의어 배열로 변환한 룩업 테이블
// 검색 시 사용자 입력어가 어떤 그룹에 속하면, 그 그룹의 모든 언어·약어·구어 동의어를 OR 매칭 후보로 확장.
// 예: "전자변" → ["전자변","솔밸","솔레노이드밸브","sv","solenoid valve","电磁阀",...] 모두 매칭 시도.
const SYNONYM_LOOKUP = (() => {
  const map = new Map()
  const groups = synonymsData.groups || {}
  for (const groupKey of Object.keys(groups)) {
    const g = groups[groupKey]
    const allTerms = []
    for (const lang of ALL_LANGS) {
      const arr = g[lang] || []
      for (const term of arr) allTerms.push(norm(term))
    }
    // 그룹 내 동의어를 한 단어 → 그룹 전체로 매핑
    for (const term of allTerms) {
      if (!term) continue
      // 한 단어가 여러 그룹에 들어있으면 합집합 누적
      const existing = map.get(term) || new Set()
      for (const t of allTerms) existing.add(t)
      map.set(term, existing)
    }
  }
  // Set → Array로 동결 (검색 시 includes 빠르게)
  const frozen = new Map()
  for (const [k, v] of map.entries()) frozen.set(k, Array.from(v))
  return frozen
})()

// 사용자 입력어를 동의어 그룹으로 확장. 동의어 없는 단어는 자기 자신만 반환.
function expandWord(word) {
  return SYNONYM_LOOKUP.get(word) || [word]
}

function allLangs(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  return ALL_LANGS.map(l => field[l] || '').join(' ')
}

// 검색 매칭 대상 = 제목 + 키워드 + 원인 이름만.
// 본문(check/fix/tip)은 제외 — 부속 부품이 절차 설명에 한 번 언급된 case가 검색 결과에 떠서 노이즈 발생하던 결함 차단.
// 핵심 부품이 제목·원인 이름에 들어간 case만 매칭 → 정확도 ↑ (실측 -68% 노이즈 감소).
function getSearchableText(caseItem) {
  const parts = [
    allLangs(caseItem.title),
    ...(caseItem.keywords || []),
    ...(caseItem.causes || []).map(c => allLangs(c.name)),
  ]
  return norm(parts.join(' '))
}

// 입력 단어 각각을 동의어 그룹으로 확장 후 (그룹 내 어느 하나라도) matchTerm 통과하면 OK
// 모든 단어가 각각의 그룹 OR 매칭을 통과해야 최종 매칭 (AND of OR)
function matchAllExpanded(text, words) {
  return words.every(w => {
    const expansions = expandWord(w)
    return expansions.some(t => matchTerm(text, t))
  })
}

function matchLocation(caseItem, words) {
  const title = norm(allLangs(caseItem.title))
  const keywords = norm((caseItem.keywords || []).join(' '))
  const causeNames = norm((caseItem.causes || []).map(c => allLangs(c.name)).join(' '))

  if (matchAllExpanded(title, words)) return 'title'
  if (matchAllExpanded(causeNames, words)) return 'cause'
  if (matchAllExpanded(keywords, words)) return 'other'
  // 분산 매칭 fallback — 두 단어가 다른 위치(예: title에 부품 + cause name에 증상)에 분산돼 있어도
  // getSearchableText 통합 텍스트에선 둘 다 통과한 case는 'other' 그룹으로 분류.
  // 메인 루프에서 이미 통합 텍스트 매칭 통과 후 호출되므로 여기 도달한 case는 매칭 case.
  return 'other'
}

export default function DiagnosisSearchPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.split('-')[0]
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // v3 (기존 418건) + v4 pilot (인과 중심 신규) 통합. v4는 search_keywords 풍부 + downstream_effects 인과 흐름.
  // v4 결과가 검색 결과에 자연스럽게 섞이며, v4ToV3 변환으로 기존 CaseCard UI 그대로 사용.
  const cases = useMemo(
    () => [...(casesData.cases || []), ...(casesV4Pilot.cases || []).map(v4ToV3)],
    []
  )

  const results = useMemo(() => {
    const q = submitted.trim().toLowerCase()
    if (!q) return null
    const words = q.split(/\s+/).filter(Boolean)
    if (!words.length) return null

    const groups = { title: [], cause: [], action: [], other: [] }
    for (const c of cases) {
      const text = getSearchableText(c)
      if (!matchAllExpanded(text, words)) continue
      const loc = matchLocation(c, words)
      if (loc) groups[loc].push(c)
    }
    return groups
  }, [submitted, cases])

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

  const navigate = useNavigate()
  return (
    <div className="p-4 pb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">
        {t('diagSearch.title')}
      </h2>

      {/* AI 진단 진입 버튼 (vivid 단색 — 햇빛 가독성) */}
      <button
        onClick={() => navigate('/diagnosis/ai')}
        className="w-full flex items-center justify-center gap-2 py-3 mb-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-emerald-700"
      >
        <Sparkles size={18} strokeWidth={2} />
        {t('quickDiag.entryBtn')}
      </button>

      {/* AI 사용 한도 안내 (베타 단계) */}
      <div className="bg-amber-600 text-white text-xs leading-snug rounded-lg px-3 py-2.5 mb-3 shadow-md">
        ℹ️ {t('quickDiag.dailyLimitNotice')}
      </div>

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
          style={{ backgroundColor: '#ffffff', color: '#111827' }}
          className="w-full pl-9 pr-9 py-3 text-sm border-2 border-gray-300 rounded-xl shadow-md placeholder-gray-400 focus:outline-none focus:border-blue-500"
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

// CaseCard — 표준 폼 6개 섹션 (장비 정보 빼고)
// 일반 검색 결과는 사용자가 장비 사진/스캔 입력 X → 장비 정보 섹션 표시 X
// 시스템 일관성: STANDARD_FORM_PROMPT 와 동일 7개 섹션 (장비 정보 제외)
function CaseCard({ caseItem, lang, expanded, onToggle }) {
  const title = pickLang(caseItem.title, lang)
  const std = mapToStandardForm(caseItem, lang, false)
  const L = getStandardLabels(lang)

  // 섹션 헤더 스타일 — vivid 단색, 시각적 일관성
  const SectionHeader = ({ children, color = 'blue' }) => (
    <div className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-${color}-600`}>
      [{children}]
    </div>
  )

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
          {/* [증상] */}
          <div className="pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-blue-600">
              [{L.symptoms}]
            </div>
            <p className="text-xs text-gray-800 leading-relaxed">{std.symptoms}</p>
          </div>

          {/* [가능 원인 (가능성 순)] */}
          {std.causes.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-violet-600">
                [{L.causes}]
              </div>
              <ol className="text-xs text-gray-800 leading-relaxed space-y-0.5 list-decimal list-inside">
                {std.causes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
            </div>
          )}

          {/* [점검 순서] */}
          {std.inspectionSteps.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-emerald-600">
                [{L.inspectionSteps}]
              </div>
              <ol className="text-xs text-gray-800 leading-relaxed space-y-0.5 list-decimal list-inside">
                {std.inspectionSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* [해결 방법] */}
          {std.solutions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-teal-600">
                [{L.solutions}]
              </div>
              <ol className="text-xs text-gray-800 leading-relaxed space-y-0.5 list-decimal list-inside">
                {std.solutions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* [예상] — 데이터 없음, 확인 필요 안내 */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-amber-500">
              [{L.estimates}]
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              - {L.workTime}: {L.verifyNeeded} / {L.partsCost}: {L.verifyNeeded} / {L.laborCost}: {L.verifyNeeded}
            </p>
          </div>

          {/* [참고] */}
          {(std.references.tip || std.references.keywords) && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white bg-gray-500">
                [{L.references}]
              </div>
              {std.references.tip && (
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="text-gray-400">- {L.relatedTip}: </span>
                  {std.references.tip}
                </p>
              )}
              {std.references.keywords && (
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  <span className="text-gray-400">- {L.keywords}: </span>
                  {std.references.keywords}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
