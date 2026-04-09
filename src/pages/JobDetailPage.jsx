import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Pencil, Phone, Calendar, MapPin,
  Trash2, Sparkles, ClipboardList, Mic, MicOff, Camera, X,
} from 'lucide-react'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import { extractKnowhow } from '../utils/aiKnowhow'
import { classifyRepairNote } from '../utils/aiClassify'

const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'))
const MINS  = ['00', '10', '20', '30', '40', '50']

export default function JobDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showDelete, setShowDelete] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [classifyLoading, setClassifyLoading] = useState(false)
  const fileRef = useRef()
  const recognitionRef = useRef(null)

  const job      = useLiveQuery(() => db.service_jobs.get(Number(id)), [id])
  const customer = useLiveQuery(
    () => job?.customerId ? db.customers.get(job.customerId) : undefined,
    [job?.customerId]
  )
  const photos = useLiveQuery(
    () => db.job_photos.where('jobId').equals(Number(id)).toArray(), [id]
  )

  if (!job) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  const totalCost  = (job.partsCost || 0) + (job.laborCost || 0)
  const isProgress = job.status === 'inprogress'
  const isDone     = job.status === 'completed'
  const visitH     = job.visitTime ? job.visitTime.split(':')[0] : ''
  const visitM     = job.visitTime ? job.visitTime.split(':')[1] : ''

  async function patch(data) {
    await db.service_jobs.update(Number(id), { ...data, updatedAt: new Date().toISOString() })
  }

  async function handleComplete() {
    await patch({ status: 'completed' })
  }

  // 사진 압축
  function compressImage(file) {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1200
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = url
    })
  }

  async function handlePhoto(e) {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const dataUrl = await compressImage(file)
      await db.job_photos.add({ jobId: Number(id), dataUrl, caption: '', takenAt: new Date().toISOString() })
    }
    e.target.value = ''
  }

  async function deletePhoto(photoId) {
    await db.job_photos.delete(photoId)
  }

  // 음성 녹음
  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('이 브라우저는 음성 인식을 지원하지 않습니다.\n(Chrome 권장)'); return }
    const r = new SR()
    r.lang = 'ko-KR'; r.continuous = true; r.interimResults = true
    r.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setTranscript(text)
    }
    r.onerror = (e) => { alert('음성 인식 오류: ' + e.error); setIsRecording(false) }
    r.onend = () => setIsRecording(false)
    r.start()
    recognitionRef.current = r
    setIsRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  async function handleAiClassify() {
    const apiKey = loadSettings().claudeApiKey
    if (!transcript.trim()) { alert('음성 내용이 없습니다.'); return }
    if (!navigator.onLine || !apiKey) {
      const prefix = !navigator.onLine ? '[오프라인 음성기록]\n' : '[API 키 없음]\n'
      await patch({ notes: job.notes ? job.notes + '\n\n' + prefix + transcript : prefix + transcript })
      setTranscript('')
      return
    }
    setClassifyLoading(true)
    try {
      const result = await classifyRepairNote(transcript, apiKey)
      const updates = {}
      if (result.symptom)   updates.symptom   = result.symptom
      if (result.diagnosis) updates.diagnosis = result.diagnosis
      if (result.materials) updates.materials = result.materials
      if (result.workDone)  updates.workDone  = result.workDone
      if (result.notes)     updates.notes     = job.notes ? job.notes + '\n' + result.notes : result.notes
      await patch(updates)
      setTranscript('')
    } catch (e) {
      alert('AI 오류: ' + e.message)
    } finally {
      setClassifyLoading(false)
    }
  }

  async function handleExtract() {
    const apiKey = loadSettings().claudeApiKey
    if (!apiKey) { alert('설정 > AI 기능 설정에서 Claude API 키를 입력해주세요.'); return }
    if (!job.symptom && !job.diagnosis && !job.workDone) {
      alert('증상, 진단, 수리 내용 중 하나 이상을 입력해야 노하우를 추출할 수 있습니다.')
      return
    }
    setAiLoading(true)
    try {
      const result = await extractKnowhow(job, customer, apiKey)
      const now = new Date().toISOString()
      const newId = await db.knowhow.add({
        title: result.title, category: result.category,
        content: result.content, tags: result.tags,
        sourceJobId: job.id, createdAt: now, updatedAt: now,
      })
      if (confirm(`노하우가 추출됐습니다.\n"${result.title}"\n\n확인하러 가시겠습니까?`)) {
        navigate(`/knowhow/${newId}`)
      }
    } catch (e) {
      alert('AI 오류: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleDelete() {
    await db.job_photos.where('jobId').equals(Number(id)).delete()
    await db.service_jobs.delete(Number(id))
    navigate('/service', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/service')} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400">
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate(`/service/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700"
          >
            <Pencil size={12} strokeWidth={1.5} />
            수정
          </button>
        </div>
      </div>

      <div className="space-y-3">

        {/* 고객 카드 */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{customer?.name ?? '고객 미등록'}</p>
              {customer && (
                <button onClick={() => navigate(`/customers/${customer.id}`)} className="text-xs text-blue-500 font-medium mt-0.5">
                  고객 이력 보기
                </button>
              )}
              {customer?.address && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={11} strokeWidth={1.5} />
                  {customer.address}
                </p>
              )}
            </div>
            {customer?.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg shrink-0">
                <Phone size={12} strokeWidth={1.5} />
                {customer.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} strokeWidth={1.5} />
              접수 {job.receiptDate}
            </span>
            {job.visitDate && (
              <span className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} />
                방문 {job.visitDate}{job.visitTime ? ` ${job.visitTime}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 단계 버튼: 접수 / 진행 (완료 시 완료 표시) */}
        {!isDone ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => patch({ status: 'received' })}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                !isProgress ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-300'
              }`}
            >
              접수
            </button>
            <button
              onClick={() => patch({ status: 'inprogress' })}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                isProgress ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-300'
              }`}
            >
              진행
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-xs font-semibold text-emerald-600">완료된 의뢰</span>
          </div>
        )}

        {/* ── 접수 정보 ── */}
        <Section title="접수 정보">
          {job.symptom
            ? <InfoRow label="증상 (고객 설명)" value={job.symptom} />
            : <p className="text-sm text-gray-400">증상 미입력</p>
          }
          {job.notes && !isProgress && !isDone && <InfoRow label="메모" value={job.notes} />}
        </Section>

        {/* ── 방문 예약 ── */}
        <Section title="방문 예약">
          <div>
            <label className="text-xs text-gray-400 block mb-1">방문 날짜</label>
            <input
              type="date"
              defaultValue={job.visitDate ?? ''}
              onBlur={(e) => patch({ visitDate: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">방문 시간 <span className="text-gray-300">(선택)</span></label>
            <div className="flex gap-2">
              <select
                defaultValue={visitH}
                onChange={(e) => {
                  const newH = e.target.value
                  patch({ visitTime: newH ? `${newH}:${visitM || '00'}` : '' })
                }}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400"
              >
                <option value="">시</option>
                {HOURS.map((hh) => <option key={hh} value={hh}>{hh}시</option>)}
              </select>
              <select
                defaultValue={visitM}
                onChange={(e) => {
                  const newM = e.target.value
                  patch({ visitTime: visitH ? `${visitH}:${newM || '00'}` : '' })
                }}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400"
              >
                <option value="">분</option>
                {MINS.map((mm) => <option key={mm} value={mm}>{mm}분</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── 진행 단계 내용 ── */}
        {(isProgress || isDone) && (
          <>
            {/* 음성 빠른 입력 */}
            {!isDone && (
              <Section title="음성 빠른 입력">
                <p className="text-xs text-gray-400">현장에서 말한 내용을 AI가 각 항목에 자동 분류합니다.</p>
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
                      <button onClick={handleAiClassify} disabled={classifyLoading}
                        className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                        <Sparkles size={13} strokeWidth={1.5} />
                        {classifyLoading ? 'AI 분류 중...' : 'AI로 자동 정리'}
                      </button>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* 진단 결과 */}
            <Section title="진단 결과">
              {isDone
                ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.diagnosis || '미입력'}</p>
                : <textarea
                    key={`diag-${id}`}
                    defaultValue={job.diagnosis ?? ''}
                    onBlur={(e) => patch({ diagnosis: e.target.value })}
                    placeholder="진단 내용을 입력하세요"
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                  />
              }
            </Section>

            {/* 준비 자재 */}
            <Section title="준비 자재">
              {isDone
                ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.materials || '미입력'}</p>
                : <textarea
                    key={`mat-${id}`}
                    defaultValue={job.materials ?? ''}
                    onBlur={(e) => patch({ materials: e.target.value })}
                    placeholder="필요한 자재를 입력하세요"
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                  />
              }
            </Section>

            {/* 수리 완료 내용 */}
            <Section title="수리 완료 내용">
              {isDone
                ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.workDone || '미입력'}</p>
                : <textarea
                    key={`work-${id}`}
                    defaultValue={job.workDone ?? ''}
                    onBlur={(e) => patch({ workDone: e.target.value })}
                    placeholder="완료된 수리 내용을 입력하세요"
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                  />
              }
            </Section>

            {/* 금액 */}
            <Section title="금액 청구">
              {isDone ? (
                <div className="space-y-2">
                  {job.partsCost > 0 && <InfoRow label="부품비" value={`${Number(job.partsCost).toLocaleString()} 원`} />}
                  {job.laborCost > 0 && <InfoRow label="공임비" value={`${Number(job.laborCost).toLocaleString()} 원`} />}
                  {totalCost > 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-300 text-sm font-semibold">
                      <span className="text-gray-500">합계</span>
                      <span className="text-gray-900">{totalCost.toLocaleString()} 원</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">부품비 (원)</label>
                    <input type="number" key={`parts-${id}`} defaultValue={job.partsCost || ''}
                      onBlur={(e) => patch({ partsCost: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">공임비 (원)</label>
                    <input type="number" key={`labor-${id}`} defaultValue={job.laborCost || ''}
                      onBlur={(e) => patch({ laborCost: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400" />
                  </div>
                  {totalCost > 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-300 text-sm font-semibold">
                      <span className="text-gray-500">합계</span>
                      <span className="text-gray-900">{totalCost.toLocaleString()} 원</span>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* 현장 사진 */}
            <Section title="현장 사진">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
              <div className="flex gap-2 flex-wrap">
                {(photos ?? []).map((p) => (
                  <div key={p.id} className="relative w-24 h-24">
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    {!isDone && (
                      <button onClick={() => deletePhoto(p.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!isDone && (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50">
                    <Camera size={20} strokeWidth={1.5} />
                    <span className="text-xs">촬영/추가</span>
                  </button>
                )}
              </div>
            </Section>

            {/* 기타 */}
            <Section title="기타 사항">
              {isDone
                ? <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.notes || '미입력'}</p>
                : <textarea
                    key={`notes-${id}`}
                    defaultValue={job.notes ?? ''}
                    onBlur={(e) => patch({ notes: e.target.value })}
                    placeholder="특이사항, 주의사항 등"
                    rows={2}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                  />
              }
            </Section>

            {/* 완료 처리 버튼 */}
            {!isDone && (
              <button onClick={handleComplete} className="w-full py-3.5 text-sm font-semibold bg-emerald-500 text-white rounded-xl active:opacity-80">
                완료 처리
              </button>
            )}

            {/* AI 노하우 추출 */}
            {isDone && (
              <button onClick={handleExtract} disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-50">
                <Sparkles size={15} strokeWidth={1.5} />
                {aiLoading ? 'AI 노하우 추출 중...' : 'AI로 노하우 추출 · 저장'}
              </button>
            )}
          </>
        )}

        {/* 계약 점검 리스트 */}
        <button onClick={() => navigate('/checklist')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl active:bg-gray-50 shadow-sm">
          <ClipboardList size={15} strokeWidth={1.5} />
          계약 점검 리스트
        </button>

      </div>

      {/* 삭제 확인 모달 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">의뢰를 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-400 mb-5">사진을 포함한 모든 데이터가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
