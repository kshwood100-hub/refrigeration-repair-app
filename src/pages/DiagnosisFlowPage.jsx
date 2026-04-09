import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocalField } from '../hooks/useLang'
import { db } from '../db'

const levelColor = {
  easy:   { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  label: '초급',  label_en: 'Easy' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', label: '중급',  label_en: 'Medium' },
  hard:   { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    label: '고급',  label_en: 'Advanced' },
}

export default function DiagnosisFlowPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lf = useLocalField()
  const isKo = i18n.language.startsWith('ko')

  const category = useLiveQuery(() => db.flow_categories.get(categoryId), [categoryId])
  const nodesArray = useLiveQuery(
    () => db.flow_nodes.where('categoryId').equals(categoryId).toArray(),
    [categoryId]
  )
  const nodesMap = useMemo(
    () => nodesArray ? Object.fromEntries(nodesArray.map((n) => [n.nodeId, n])) : null,
    [nodesArray]
  )

  const [history, setHistory] = useState([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (category && nodesMap && history.length === 0) {
      setHistory([category.startNode])
    }
  }, [category, nodesMap])

  if (!category || !nodesMap) {
    return <div className="p-4 text-gray-400">{t('logs.loading')}</div>
  }

  if (nodesMap && Object.keys(nodesMap).length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-4xl mb-4">🌿</div>
        <p className="text-base font-semibold text-gray-700 mb-2">아직 진단 트리가 없습니다</p>
        <p className="text-sm text-gray-400 mb-6">편집 화면에서 질문과 답변을 직접 만들어 보세요</p>
        <button
          onClick={() => navigate('/flow-edit')}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl"
        >
          트리 편집하러 가기
        </button>
      </div>
    )
  }

  if (history.length === 0) {
    return <div className="p-4 text-gray-400">{t('logs.loading')}</div>
  }

  const currentNodeId = history[history.length - 1]
  const node = nodesMap[currentNodeId]

  const handleAnswer = (nextId) => {
    const nextNode = nodesMap[nextId]
    if (!nextNode) return
    setHistory([...history, nextId])
    if (nextNode.type === 'result') setDone(true)
  }

  const handleBack = () => {
    if (history.length <= 1) { navigate(-1); return }
    setHistory(history.slice(0, -1))
    setDone(false)
  }

  const handleRestart = () => {
    setHistory([category.startNode])
    setDone(false)
  }

  const stepNumber = history.length - 1
  const question = isKo ? node?.question : (node?.question_en ?? node?.question)
  const level = done && levelColor[node?.level]

  return (
    <div className="p-4 flex flex-col min-h-[calc(100vh-80px)]">

      {/* 헤더 */}
      <div className="mb-4">
        <button onClick={() => navigate('/diagnosis')} className="text-blue-600 text-sm mb-2">
          ← {t('diagnosis.back')}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <h2 className="text-lg font-bold text-gray-800">{lf(category, 'title')}</h2>
        </div>
      </div>

      {/* 진행 스텝 표시 */}
      {!done && (
        <div className="flex items-center gap-1 mb-5">
          {history.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                i < history.length - 1 ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            />
          ))}
          <div className="h-1.5 rounded-full flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 ml-1">{stepNumber}번째 질문</span>
        </div>
      )}

      {/* 질문 카드 */}
      {!done && node && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <div className="text-xs text-blue-500 font-medium mb-2">Q{stepNumber + 1}</div>
            <p className="text-gray-800 font-medium text-base leading-relaxed">{question}</p>
          </div>

          {node.type === 'multi' ? (
            <div className="space-y-2.5">
              {(node.choices ?? []).map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(c.next)}
                  className="w-full py-3.5 px-4 bg-white border-2 border-gray-200 text-gray-800 font-medium rounded-2xl text-sm text-left active:bg-gray-50 active:border-blue-400"
                >
                  {c.label}
                </button>
              ))}
              {history.length > 1 && (
                <button onClick={handleBack} className="w-full py-3 text-gray-400 text-sm active:text-gray-600">
                  ← {t('diagnosis.prevQuestion')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleAnswer(node.yes)}
                className="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl text-lg active:bg-blue-700 shadow-sm"
              >
                {t('diagnosis.yes')}
              </button>
              <button
                onClick={() => handleAnswer(node.no)}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl text-lg active:bg-gray-50"
              >
                {t('diagnosis.no')}
              </button>

              {history.length > 1 && (
                <button
                  onClick={handleBack}
                  className="w-full py-3 text-gray-400 text-sm active:text-gray-600"
                >
                  ← {t('diagnosis.prevQuestion')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 결과 카드 */}
      {done && node && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-800">{t('diagnosis.result')}</span>
            {level && (
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${level.bg} ${level.border} ${level.text}`}>
                {isKo ? level.label : level.label_en}
              </span>
            )}
          </div>

          {/* 진단명 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <div className="text-lg font-bold text-gray-900">{lf(node, 'title')}</div>
          </div>

          {/* 결론 — 최우선 표시 */}
          {node.conclusion && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4">
              <div className="text-xs font-semibold text-gray-400 mb-1.5">결론</div>
              <p className="text-white font-medium text-sm leading-relaxed whitespace-pre-line">{node.conclusion}</p>
            </div>
          )}

          {/* 경고 */}
          {node.warning && (
            <div className={`rounded-xl p-3 mb-4 ${
              node.warningLevel === 'danger'
                ? 'bg-red-600 border border-red-700'
                : 'bg-orange-50 border border-orange-300'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  node.warningLevel === 'danger'
                    ? 'bg-white text-red-600'
                    : 'bg-orange-500 text-white'
                }`}>
                  {node.warningLevel === 'danger' ? '위험' : '주의'}
                </span>
              </div>
              <span className={`text-sm font-medium leading-relaxed ${
                node.warningLevel === 'danger' ? 'text-white' : 'text-orange-900'
              }`}>
                {isKo ? node.warning : (node.warning_en ?? node.warning)}
              </span>
            </div>
          )}

          {/* 원인 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('symptoms.causes')}</h3>
            <ul className="space-y-1.5">
              {(isKo ? node.causes : (node.causes_en ?? node.causes) ?? []).map((c, i) => (
                <li key={i} className="flex gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
                  <span className="text-red-500 font-bold">{i + 1}</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 수리 절차 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('symptoms.procedures')}</h3>
            <ol className="space-y-1.5">
              {(isKo ? node.steps : (node.steps_en ?? node.steps) ?? []).map((s, i) => (
                <li key={i} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm">
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {/* 다시 시작 */}
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-2xl text-sm active:bg-gray-200"
          >
            🔄 {t('diagnosis.restart')}
          </button>
        </div>
      )}
    </div>
  )
}
