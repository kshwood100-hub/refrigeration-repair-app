import { getStandardLabels } from '../utils/standardForm'

// StandardFormDisplay — AI 진단 답 (plain text [섹션] 형식) → 표준 폼 7개 섹션 색깔 헤더
// 일반 검색 (DiagnosisSearchPage CaseCard) 과 동일 색상 시스템:
// [장비 정보]=gray / [증상]=blue / [가능 원인]=violet / [점검 순서]=emerald
// [해결 방법]=teal / [예상]=amber / [참고]=gray

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const COLOR_BY_KEY = {
  equipmentInfo: 'gray',
  symptoms: 'blue',
  causes: 'violet',
  inspectionSteps: 'emerald',
  solutions: 'teal',
  estimates: 'amber',
  references: 'gray',
}

// Tailwind JIT — 동적 색깔 클래스 정적 명시 필요
const BG_CLASS = {
  gray: 'bg-gray-500',
  blue: 'bg-blue-600',
  violet: 'bg-violet-600',
  emerald: 'bg-emerald-600',
  teal: 'bg-teal-600',
  amber: 'bg-amber-500',
}

export default function StandardFormDisplay({ text, lang }) {
  if (!text || typeof text !== 'string') return null
  const L = getStandardLabels(lang)
  const sectionMap = [
    { key: 'equipmentInfo', label: L.equipmentInfo },
    { key: 'symptoms', label: L.symptoms },
    { key: 'causes', label: L.causes },
    { key: 'inspectionSteps', label: L.inspectionSteps },
    { key: 'solutions', label: L.solutions },
    { key: 'estimates', label: L.estimates },
    { key: 'references', label: L.references },
  ]

  // [라벨] 정규식 매칭 — 모든 가능한 헤더 박혀있어
  const allHeaders = sectionMap.map(s => `\\[${escapeRegex(s.label)}\\]`).join('|')
  const regex = new RegExp(`(${allHeaders})`, 'g')
  const parts = text.split(regex)

  const sections = []
  let currentLabel = null
  for (const p of parts) {
    if (!p) continue
    const matched = sectionMap.find(s => p === `[${s.label}]`)
    if (matched) {
      currentLabel = matched
      sections.push({ ...matched, content: '' })
    } else if (currentLabel && sections.length > 0) {
      sections[sections.length - 1].content += p
    }
  }

  // 헤더 못 찾았으면 그대로 출력 (fallback)
  if (sections.length === 0) {
    return (
      <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words font-sans leading-relaxed">
        {text}
      </pre>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const content = s.content.trim()
        if (!content) return null
        return (
          <div key={i}>
            <div className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-1 rounded inline-block text-white ${BG_CLASS[COLOR_BY_KEY[s.key]] || 'bg-gray-500'}`}>
              [{s.label}]
            </div>
            <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed ml-0">
              {content}
            </pre>
          </div>
        )
      })}
    </div>
  )
}
