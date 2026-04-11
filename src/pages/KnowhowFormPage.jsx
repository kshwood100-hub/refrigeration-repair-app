import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2, Mic, MicOff, Sparkles, Plus, X } from 'lucide-react'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import {
  KNOWHOW_CATEGORIES, COMPRESSOR_TYPES, COMPRESSOR_STRUCTURES,
  COOLING_METHODS, TEMP_RANGES, REFRIGERANT_TYPES, SYSTEM_TYPES, EXPANSION_TYPES,
} from '../data/refrigerationTypes'

const LOCATIONS = ['압축기', '응축기', '증발기', '전기패널', '배관/냉매', '팬/모터', '컨트롤러', '기타']

const EMPTY = {
  title:          '',
  category:       '기타',
  location:       '기타',
  compressorType: '',
  compressorStr:  '',
  coolingMethod:  '',
  tempRange:      '',
  refrigerant:    '',
  systemType:     '',
  symptoms:       '',
  cause:          '',
  checkSteps:     '',
  solution:       '',
  parts:          '',
  notes:          '',
}

export default function KnowhowFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'

  const existing = useLiveQuery(
    () => !isNew ? db.knowhow.get(Number(id)) : undefined, [id]
  )

  const [form, setForm] = useState(EMPTY)
  const [initialized, setInitialized] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const recognitionRef = useRef(null)

  if (!isNew && existing && !initialized) {
    setForm({
      title:          existing.title          ?? '',
      category:       existing.category       ?? '기타',
      location:       existing.location       ?? '기타',
      compressorType: existing.compressorType ?? '',
      compressorStr:  existing.compressorStr  ?? '',
      coolingMethod:  existing.coolingMethod  ?? '',
      tempRange:      existing.tempRange      ?? '',
      refrigerant:    existing.refrigerant    ?? '',
      systemType:     existing.systemType     ?? '',
      symptoms:       existing.symptoms       ?? '',
      cause:          existing.cause          ?? '',
      checkSteps:     existing.checkSteps     ?? '',
      solution:       existing.solution       ?? '',
      parts:          existing.parts          ?? '',
      notes:          existing.notes          ?? '',
    })
    setInitialized(true)
  }

  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }))

  // 음성 녹음
  const finalTranscriptRef = useRef('')
  const isRecordingRef = useRef(false)

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Chrome 브라우저에서 사용해주세요.'); return }
    finalTranscriptRef.current = transcript
    isRecordingRef.current = true

    function createAndStart() {
      const r = new SR()
      r.lang = 'ko-KR'
      r.continuous = false
      r.interimResults = true
      r.onresult = (e) => {
        let interim = ''
        let final = finalTranscriptRef.current
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const chunk = e.results[i][0].transcript.trim()
            final += (final ? ' ' : '') + chunk
            finalTranscriptRef.current = final
          } else {
            interim += e.results[i][0].transcript
          }
        }
        setTranscript(final + interim)
      }
      r.onend = () => {
        if (isRecordingRef.current) {
          // 말이 끊겨도 자동 재시작
          try { createAndStart() } catch(e) {}
        } else {
          setIsRecording(false)
        }
      }
      r.onerror = (e) => {
        if (e.error === 'no-speech' && isRecordingRef.current) {
          try { createAndStart() } catch(err) {}
        } else {
          isRecordingRef.current = false
          setIsRecording(false)
        }
      }
      r.start()
      recognitionRef.current = r
    }

    createAndStart()
    setIsRecording(true)
  }

  function stopRecording() {
    isRecordingRef.current = false
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  async function handleAiClassify() {
    if (!transcript.trim()) return
    const apiKey = loadSettings().claudeApiKey
    if (!apiKey) { alert('설정 > AI 기능 설정에서 API 키를 입력해주세요.'); return }
    setAiLoading(true)
    try {
      // 노하우 특화 프롬프트
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `냉동기 수리 노하우를 아래 형식 JSON으로 정리해줘. JSON만 반환.\n\n"${transcript}"\n\n{"title":"한줄 제목","category":"압축기/냉매/전기/팬/착상/결로/소음/기타 중 하나","location":"압축기/응축기/증발기/전기패널/배관·냉매/팬·모터/컨트롤러/기타 중 하나","symptoms":"증상 키워드들 (콤마로 구분)","cause":"원인 설명","checkSteps":"1. 점검 순서\\n2. 다음 단계\\n3. ...","solution":"해결 방법","parts":"교체 부품 (없으면 빈값)","notes":"추가 메모 (없으면 빈값)"}`,
          }],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))
      if (!data.content?.[0]?.text) throw new Error('API 응답 없음: ' + JSON.stringify(data))
      const match = data.content[0].text.match(/\{[\s\S]*\}/)
      if (match) {
        const r = JSON.parse(match[0])
        setForm((p) => ({
          ...p,
          title:      r.title      || p.title,
          category:   KNOWHOW_CATEGORIES.includes(r.category) ? r.category : p.category,
          location:   LOCATIONS.includes(r.location)  ? r.location  : p.location,
          symptoms:   r.symptoms   || p.symptoms,
          cause:      r.cause      || p.cause,
          checkSteps: r.checkSteps || p.checkSteps,
          solution:   r.solution   || p.solution,
          parts:      r.parts      || p.parts,
          notes:      r.notes      || p.notes,
        }))
        setTranscript('')
      }
    } catch (e) {
      alert('AI 오류: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return }
    const now = new Date().toISOString()
    try {
      if (isNew) {
        await db.knowhow.add({ ...form, createdAt: now, updatedAt: now })
        navigate('/knowhow', { replace: true })
      } else {
        await db.knowhow.update(Number(id), { ...form, updatedAt: now })
        navigate(`/knowhow/${id}`, { replace: true })
      }
    } catch (e) {
      alert('저장 오류: ' + e.message)
    }
  }

  async function handleDelete() {
    await db.knowhow.delete(Number(id))
    navigate('/knowhow', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">{isNew ? '노하우 추가' : '노하우 수정'}</h2>
        <button onClick={handleSave} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
          저장
        </button>
      </div>

      <div className="space-y-4">

        {/* 음성 입력 */}
        <Section title="음성으로 빠른 입력">
          <p className="text-xs text-gray-400">현장에서 경험한 내용을 말하면 AI가 항목별로 자동 정리합니다.</p>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
              isRecording ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'
            }`}
          >
            {isRecording
              ? <><MicOff size={15} strokeWidth={1.5} /><span className="animate-pulse">녹음 정지</span></>
              : <><Mic size={15} strokeWidth={1.5} />녹음 시작</>
            }
          </button>
          {transcript && (
            <div>
              <p className="text-xs text-gray-400 mb-1">인식된 내용</p>
              <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{transcript}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setTranscript('')} className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-xl text-gray-500">지우기</button>
                <button
                  onClick={handleAiClassify}
                  disabled={aiLoading}
                  className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} strokeWidth={1.5} />
                  {aiLoading ? 'AI 정리 중...' : 'AI로 자동 정리'}
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* 제목 */}
        <Section title="제목">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="예) 압축기 주변 딱딱 소리 — 전자마그네틱 접점 불량"
            className="w-full text-sm text-gray-900 outline-none"
          />
        </Section>

        {/* 분류 */}
        <Section title="분류">
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5">카테고리</p>
            <div className="flex gap-1.5 flex-wrap">
              {KNOWHOW_CATEGORIES.map((c) => (
                <button key={c} onClick={() => set('category', c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">발생 위치</p>
            <div className="flex gap-1.5 flex-wrap">
              {LOCATIONS.map((l) => (
                <button key={l} onClick={() => set('location', l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.location === l ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* 설비 분류 */}
        <Section title="설비 분류">
          <ChipGroup label="압축기 종류" items={COMPRESSOR_TYPES} field="compressorType" form={form} set={set} single />
          <ChipGroup label="압축기 구조" items={COMPRESSOR_STRUCTURES} field="compressorStr" form={form} set={set} single />
          <ChipGroup label="응축 방식" items={COOLING_METHODS} field="coolingMethod" form={form} set={set} single />
          <ChipGroup label="사용 온도" items={TEMP_RANGES} field="tempRange" form={form} set={set} single />
          <ChipGroup label="냉매" items={REFRIGERANT_TYPES} field="refrigerant" form={form} set={set} single />
          {SYSTEM_TYPES.map(({ group, items }) => (
            <ChipGroup key={group} label={group} items={items} field="systemType" form={form} set={set} single />
          ))}
        </Section>

        {/* 증상 키워드 */}
        <Section title="증상 키워드">
          <p className="text-xs text-gray-400 mb-1.5">검색에 사용됩니다. 콤마로 구분해서 입력하세요.</p>
          <input
            type="text"
            value={form.symptoms}
            onChange={(e) => set('symptoms', e.target.value)}
            placeholder="딱딱 소리, 냉동기 안에서, 주기적 소음"
            className="w-full text-sm text-gray-900 outline-none"
          />
        </Section>

        {/* 원인 */}
        <Section title="원인">
          <textarea
            value={form.cause}
            onChange={(e) => set('cause', e.target.value)}
            placeholder="전자마그네틱(접촉기) 접점 불량으로 인한 떨림음"
            rows={2}
            className="w-full text-sm text-gray-900 outline-none resize-none"
          />
        </Section>

        {/* 점검 순서 */}
        <Section title="점검 순서">
          <textarea
            value={form.checkSteps}
            onChange={(e) => set('checkSteps', e.target.value)}
            placeholder={"1. 전기패널 문 열고 전자마그네틱 확인\n2. 작동 중 접점 떨림 여부 육안 확인\n3. 전류 측정 — 정격 대비 확인\n4. 접점 마모 확인"}
            rows={4}
            className="w-full text-sm text-gray-900 outline-none resize-none"
          />
        </Section>

        {/* 해결책 */}
        <Section title="해결 방법">
          <textarea
            value={form.solution}
            onChange={(e) => set('solution', e.target.value)}
            placeholder="전자마그네틱 교체. 같은 용량/전압 규격 확인 후 교체."
            rows={2}
            className="w-full text-sm text-gray-900 outline-none resize-none"
          />
        </Section>

        {/* 교체 부품 */}
        <Section title="교체 부품">
          <input
            type="text"
            value={form.parts}
            onChange={(e) => set('parts', e.target.value)}
            placeholder="전자마그네틱(접촉기) AC220V 20A"
            className="w-full text-sm text-gray-900 outline-none"
          />
        </Section>

        {/* 메모 */}
        <Section title="추가 메모">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="소리가 일정 주기로 반복되면 압축기 내부보다 전기계통 먼저 확인."
            rows={2}
            className="w-full text-sm text-gray-900 outline-none resize-none"
          />
        </Section>

        {/* 저장 버튼 (하단) */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gray-900 text-white text-base font-semibold rounded-xl"
        >
          저장
        </button>

        {/* 삭제 */}
        {!isNew && (
          <div className="pt-2">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 font-medium border border-red-100 rounded-xl"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                노하우 삭제
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-red-600 mb-3">정말 삭제하시겠습니까?</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-600">취소</button>
                  <button onClick={handleDelete} className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg">삭제</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm space-y-3">
        {children}
      </div>
    </div>
  )
}

function ChipGroup({ label, items, field, form, set, single }) {
  const selected = form[field] ? form[field].split(',').map(s => s.trim()).filter(Boolean) : []
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {items.map((item) => {
          const isSelected = selected.includes(item)
          return (
            <button
              key={item}
              onClick={() => {
                if (single) {
                  set(field, isSelected ? '' : item)
                } else {
                  const next = isSelected ? selected.filter(s => s !== item) : [...selected, item]
                  set(field, next.join(', '))
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isSelected ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}
