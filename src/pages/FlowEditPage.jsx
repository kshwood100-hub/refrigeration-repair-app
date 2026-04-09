import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

function Field({ label, value, onChange, multiline, placeholder }) {
  return (
    <div className="mb-3">
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-400"
          rows={4}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-400"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export default function FlowEditPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('categories')
  const [selCatId, setSelCatId] = useState(null)
  const [selNodeId, setSelNodeId] = useState(null)
  const [addCtx, setAddCtx] = useState(null) // { parentNodeId, slot }
  const [form, setForm] = useState({})

  const categories = useLiveQuery(() => db.flow_categories.toArray())
  const nodes = useLiveQuery(
    () => selCatId
      ? db.flow_nodes.where('categoryId').equals(selCatId).toArray()
      : Promise.resolve([]),
    [selCatId]
  )

  function upd(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function genNodeId() {
    const prefix = (selCatId ?? 'node').replace(/_/g, '').slice(0, 4)
    const suffix = Math.random().toString(36).slice(2, 6)
    return `${prefix}_${suffix}`
  }

  // ── Category handlers ──────────────────────────────────
  function openCatNodes(cat) {
    setSelCatId(cat.id)
    setView('nodes')
  }

  function editCat(cat) {
    setForm({ ...cat })
    setView('editCat')
  }

  function addCat() {
    setForm({ id: '', icon: '🔧', title: '', title_en: '', startNode: '' })
    setView('editCat')
  }

  async function saveCat() {
    if (!form.id?.trim() || !form.title?.trim()) {
      alert('ID와 제목은 필수입니다.')
      return
    }
    await db.flow_categories.put(form)
    setView('categories')
  }

  async function deleteCat() {
    if (!window.confirm(`"${form.title}" 카테고리와 모든 노드를 삭제하시겠습니까?`)) return
    await db.flow_nodes.where('categoryId').equals(form.id).delete()
    await db.flow_categories.delete(form.id)
    setView('categories')
  }

  // ── Node handlers ──────────────────────────────────────
  function openAddNode(ctx = null) {
    setAddCtx(ctx)
    setSelNodeId(null)
    setForm({
      nodeId: genNodeId(),
      categoryId: selCatId,
      type: 'question',
      question: '',
      question_en: '',
      yes: '',
      no: '',
    })
    setView('editNode')
  }

  function editNode(node) {
    setAddCtx(null)
    setSelNodeId(node.nodeId)
    setForm({
      ...node,
      causesText: (node.causes ?? []).join('\n'),
      causesEnText: (node.causes_en ?? []).join('\n'),
      stepsText: (node.steps ?? []).join('\n'),
      stepsEnText: (node.steps_en ?? []).join('\n'),
    })
    setView('editNode')
  }

  async function saveNode() {
    if (!form.nodeId?.trim()) return
    if (form.type === 'multi' && !(form.choices ?? []).some((c) => c.label)) {
      alert('선택지를 최소 1개 입력하세요.')
      return
    }

    const node = { ...form }
    if (form.type === 'result') {
      node.causes = (form.causesText || '').split('\n').filter(Boolean)
      node.causes_en = (form.causesEnText || '').split('\n').filter(Boolean)
      node.steps = (form.stepsText || '').split('\n').filter(Boolean)
      node.steps_en = (form.stepsEnText || '').split('\n').filter(Boolean)
    }
    delete node.causesText; delete node.causesEnText
    delete node.stepsText; delete node.stepsEnText

    try {
      await db.flow_nodes.put(node)

      // 자동 연결
      if (addCtx) {
        const { parentNodeId, slot } = addCtx
        if (slot === 'startNode') {
          await db.flow_categories.update(selCatId, { startNode: node.nodeId })
        } else {
          const parent = await db.flow_nodes.get(parentNodeId)
          if (parent) {
            if (slot === 'yes') parent.yes = node.nodeId
            else if (slot === 'no') parent.no = node.nodeId
            else if (slot.startsWith('choice-')) {
              const idx = parseInt(slot.replace('choice-', ''))
              if (parent.choices?.[idx]) parent.choices[idx].next = node.nodeId
            }
            await db.flow_nodes.put(parent)
          }
        }
        setAddCtx(null)
      }
      setView('nodes')
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
  }

  async function deleteNode() {
    if (!window.confirm('이 노드를 삭제하시겠습니까?')) return
    await db.flow_nodes.delete(selNodeId)
    setView('nodes')
  }

  // ── Loading ────────────────────────────────────────────
  if (!categories) return <div className="p-4 text-gray-400">로딩 중...</div>

  // ── View: categories ───────────────────────────────────
  if (view === 'categories') {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('/diagnosis')} className="text-blue-600 text-sm">← 뒤로</button>
          <h2 className="text-lg font-bold flex-1">진단 트리 편집</h2>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-xl">
              <button onClick={() => openCatNodes(cat)} className="flex items-center gap-3 flex-1 text-left">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <div className="font-medium text-gray-800 text-sm">{cat.title}</div>
                  <div className="text-xs text-gray-400">{cat.id}</div>
                </div>
              </button>
              <button onClick={() => editCat(cat)} className="text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5">편집</button>
            </div>
          ))}
        </div>
        <button onClick={addCat} className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-sm">
          + 카테고리 추가
        </button>
      </div>
    )
  }

  // ── View: editCat ──────────────────────────────────────
  if (view === 'editCat') {
    return (
      <div className="p-4 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('categories')} className="text-blue-600 text-sm">← 취소</button>
          <h2 className="text-lg font-bold">카테고리 {form.id ? '편집' : '추가'}</h2>
        </div>
        <Field label="ID (영문·숫자·밑줄)" value={form.id} onChange={(v) => upd('id', v)} placeholder="예: compressor_no_start" />
        <Field label="아이콘" value={form.icon} onChange={(v) => upd('icon', v)} placeholder="🔧" />
        <Field label="제목 *" value={form.title} onChange={(v) => upd('title', v)} placeholder="압축기 미작동" />
        <Field label="제목 (영어)" value={form.title_en} onChange={(v) => upd('title_en', v)} placeholder="Compressor Not Starting" />
        <button onClick={saveCat} className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl mb-3 mt-2">저장</button>
        {form.id && (
          <button onClick={deleteCat} className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl border border-red-200">카테고리 삭제</button>
        )}
      </div>
    )
  }

  // ── View: nodes (트리 편집) ────────────────────────────
  if (view === 'nodes') {
    const cat = categories.find((c) => c.id === selCatId)
    const nodesMap = Object.fromEntries((nodes ?? []).map((n) => [n.nodeId, n]))

    const typeBadge = (t) => t === 'result' ? 'bg-green-100 text-green-700' : t === 'multi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
    const typeLabel = (t) => t === 'result' ? '결과' : t === 'multi' ? '멀티' : '질문'

    function AddSlot({ label, ctx }) {
      return (
        <div className="flex items-center gap-2 py-0.5">
          <span className="text-xs text-gray-400 shrink-0">{label}</span>
          <button
            onClick={() => openAddNode(ctx)}
            className="text-xs text-blue-500 border border-dashed border-blue-300 rounded-md px-2 py-0.5 active:bg-blue-50"
          >
            + 추가
          </button>
        </div>
      )
    }

    function TreeNode({ nodeId, depth, path }) {
      const indent = depth * 14
      if (!nodeId) return null
      if (path.includes(nodeId)) {
        return <div style={{ paddingLeft: indent }} className="text-xs text-yellow-500 py-0.5">↩ 순환 참조</div>
      }
      const node = nodesMap[nodeId]
      if (!node) {
        return (
          <div style={{ paddingLeft: indent }} className="py-0.5">
            <span className="text-xs text-red-400">⚠ {nodeId} (없음)</span>
          </div>
        )
      }
      const newPath = [...path, nodeId]
      return (
        <div style={{ paddingLeft: indent }}>
          {/* 노드 카드 */}
          <button
            onClick={() => editNode(node)}
            className="w-full text-left flex items-start gap-1.5 py-1.5 px-2 rounded-lg active:bg-gray-100 border border-transparent hover:border-gray-300"
          >
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${typeBadge(node.type)}`}>
              {typeLabel(node.type)}
            </span>
            <span className="text-sm text-gray-800 leading-snug">
              {(node.question ?? node.title ?? '—').slice(0, 35)}
            </span>
            <span className="text-gray-300 ml-auto shrink-0 text-xs">편집</span>
          </button>

          {/* 자식 분기 */}
          {node.type === 'question' && (
            <div className="ml-3 border-l border-gray-300 pl-2 mt-0.5 space-y-0.5">
              <div>
                <div className="text-xs text-gray-400 mt-1">✓ 예</div>
                {node.yes
                  ? <TreeNode nodeId={node.yes} depth={0} path={newPath} />
                  : <AddSlot label="" ctx={{ parentNodeId: nodeId, slot: 'yes' }} />}
              </div>
              <div>
                <div className="text-xs text-gray-400 mt-1">✗ 아니요</div>
                {node.no
                  ? <TreeNode nodeId={node.no} depth={0} path={newPath} />
                  : <AddSlot label="" ctx={{ parentNodeId: nodeId, slot: 'no' }} />}
              </div>
            </div>
          )}
          {node.type === 'multi' && (
            <div className="ml-3 border-l border-gray-300 pl-2 mt-0.5 space-y-0.5">
              {(node.choices ?? []).map((c, i) => (
                <div key={i}>
                  <div className="text-xs text-gray-400 mt-1">▸ {c.label || `선택지 ${i + 1}`}</div>
                  {c.next
                    ? <TreeNode nodeId={c.next} depth={0} path={newPath} />
                    : <AddSlot label="" ctx={{ parentNodeId: nodeId, slot: `choice-${i}` }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="p-4 pb-8">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setView('categories')} className="text-blue-600 text-sm">← 뒤로</button>
          <h2 className="text-base font-bold flex-1 truncate">{cat?.icon} {cat?.title}</h2>
        </div>

        {(!nodes || nodes.length === 0) ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 mb-1">아직 트리가 비어있습니다</p>
            <p className="text-xs text-gray-400 mb-6">첫 번째 노드를 추가해보세요</p>
            <button
              onClick={() => openAddNode({ slot: 'startNode' })}
              className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl"
            >
              + 첫 노드 추가
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-xl p-3">
            {cat?.startNode && nodesMap[cat.startNode]
              ? <TreeNode nodeId={cat.startNode} depth={0} path={[]} />
              : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">시작 노드가 없습니다</p>
                  <button
                    onClick={() => openAddNode({ slot: 'startNode' })}
                    className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5"
                  >
                    + 시작 노드 추가
                  </button>
                </div>
              )}
          </div>
        )}
      </div>
    )
  }

  // ── View: editNode ─────────────────────────────────────
  if (view === 'editNode') {
    const ctxLabel = addCtx?.slot === 'startNode' ? '시작 노드 추가'
      : addCtx?.slot === 'yes' ? '"예" 경로에 노드 추가'
      : addCtx?.slot === 'no' ? '"아니요" 경로에 노드 추가'
      : addCtx?.slot?.startsWith('choice-') ? `선택지 ${parseInt(addCtx.slot.replace('choice-', '')) + 1}에 노드 추가`
      : '노드 편집'

    return (
      <div className="p-4 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => { setAddCtx(null); setView('nodes') }} className="text-blue-600 text-sm">← 취소</button>
          <h2 className="text-base font-bold">{ctxLabel}</h2>
        </div>

        {/* 노드 ID */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-400">ID</span>
          <span className="flex-1 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-300 rounded px-2 py-1">{form.nodeId}</span>
          {!selNodeId && (
            <button onClick={() => upd('nodeId', genNodeId())} className="text-xs text-gray-400 border border-gray-300 rounded px-2 py-1">
              재생성
            </button>
          )}
        </div>

        {/* 노드 유형 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">유형</label>
          <div className="flex gap-2">
            {[
              { v: 'question', label: '예/아니오 질문' },
              { v: 'multi', label: '선택지 질문' },
              { v: 'result', label: '최종 결과' },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => upd('type', v)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  form.type === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 예/아니오 질문 */}
        {form.type === 'question' && (
          <Field label="질문" value={form.question} onChange={(v) => upd('question', v)} placeholder="압축기가 동작하나요?" />
        )}

        {/* 선택지 질문 */}
        {form.type === 'multi' && (
          <>
            <Field label="질문" value={form.question} onChange={(v) => upd('question', v)} placeholder="소음이 어디서 나오나요?" />
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 mb-2 block">선택지 항목</label>
              <div className="space-y-2 mb-2">
                {(form.choices ?? []).map((c, i) => (
                  <div key={i} className="flex gap-2 items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                    <input
                      className="flex-1 text-sm bg-transparent outline-none"
                      placeholder={`선택지 ${i + 1}`}
                      value={c.label}
                      onChange={(e) => {
                        const choices = [...(form.choices ?? [])]
                        choices[i] = { ...choices[i], label: e.target.value }
                        upd('choices', choices)
                      }}
                    />
                    <button
                      onClick={() => upd('choices', (form.choices ?? []).filter((_, j) => j !== i))}
                      className="text-red-400 font-bold text-lg leading-none shrink-0"
                    >×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => upd('choices', [...(form.choices ?? []), { label: '', next: '' }])}
                className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500"
              >
                + 선택지 추가
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">💡 저장 후 각 선택지에서 "+ 추가"로 다음 노드를 연결하세요</p>
          </>
        )}

        {/* 결과 노드 */}
        {form.type === 'result' && (
          <>
            <Field label="진단명" value={form.title} onChange={(v) => upd('title', v)} placeholder="압축기 전원 공급 불량" />

            {/* 결론 — 가장 중요한 항목 */}
            <div className="mb-4 bg-gray-900 rounded-xl p-3">
              <label className="text-xs font-semibold text-white mb-1 block">결론 (최종 지침) *</label>
              <textarea
                className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-400 resize-none"
                rows={3}
                value={form.conclusion ?? ''}
                onChange={(e) => upd('conclusion', e.target.value)}
                placeholder={'예: 기동 콘덴서를 교체하세요.\n교체 후 기동 전류를 재측정하세요.'}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 mb-1 block">난이도</label>
              <div className="flex gap-2">
                {[{ v: 'easy', label: '초급' }, { v: 'medium', label: '중급' }, { v: 'hard', label: '고급' }].map(({ v, label }) => (
                  <button key={v} onClick={() => upd('level', v)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${form.level === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="원인 (줄바꿈으로 구분)" value={form.causesText} onChange={(v) => upd('causesText', v)} multiline placeholder={'원인1\n원인2'} />
            <Field label="수리 절차 (줄바꿈으로 구분)" value={form.stepsText} onChange={(v) => upd('stepsText', v)} multiline placeholder={'1단계: ...\n2단계: ...'} />
            {/* 경고 등급 */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 mb-1 block">경고 등급 (선택)</label>
              <div className="flex gap-2">
                {[
                  { v: '', label: '없음', cls: 'bg-white text-gray-400 border-gray-300' },
                  { v: 'caution', label: '주의', cls: 'bg-orange-50 text-orange-600 border-orange-300' },
                  { v: 'danger', label: '위험', cls: 'bg-red-50 text-red-600 border-red-400' },
                ].map(({ v, label, cls }) => (
                  <button
                    key={v}
                    onClick={() => upd('warningLevel', v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      (form.warningLevel ?? '') === v ? cls + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="경고 내용 (선택)" value={form.warning} onChange={(v) => upd('warning', v)} placeholder="고전압 주의 — 작업 전 전원 차단" />
          </>
        )}

        <button onClick={saveNode} className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl mb-3 mt-4">
          저장
        </button>
        {selNodeId && (
          <button onClick={deleteNode} className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-xl border border-red-200">
            노드 삭제
          </button>
        )}
      </div>
    )
  }

  return null
}
