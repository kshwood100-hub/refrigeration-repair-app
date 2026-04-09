import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Mic, MicOff, Camera, X, Users, Sparkles } from 'lucide-react'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import { classifyRepairNote } from '../utils/aiClassify'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_JOB = {
  status: 'received',
  receiptDate: today(),
  visitDate: '',
  visitTime: '',
  symptom: '',
  diagnosis: '',
  materials: '',
  workDone: '',
  partsCost: '',
  laborCost: '',
  notes: '',
}

const EMPTY_CUSTOMER = { name: '', phone: '', address: '' }

export default function JobFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isNew = !id

  const existingJob = useLiveQuery(
    () => id ? db.service_jobs.get(Number(id)) : undefined, [id]
  )
  const existingCustomer = useLiveQuery(
    () => existingJob?.customerId ? db.customers.get(existingJob.customerId) : undefined,
    [existingJob?.customerId]
  )
  const allCustomers = useLiveQuery(() => db.customers.orderBy('name').toArray(), [])

  const [job, setJob] = useState(EMPTY_JOB)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [photos, setPhotos] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const fileRef = useRef()
  const recognitionRef = useRef(null)

  // 명함/고객 상세에서 넘어온 경우 고객 자동 로드
  const preloadCustomerId = location.state?.customerId
  const preloadCustomer = useLiveQuery(
    () => preloadCustomerId ? db.customers.get(preloadCustomerId) : undefined,
    [preloadCustomerId]
  )
  useEffect(() => {
    if (isNew && preloadCustomer && !initialized) {
      setCustomer({
        name: preloadCustomer.name ?? '',
        phone: preloadCustomer.phone ?? '',
        address: preloadCustomer.address ?? '',
      })
      setInitialized(true)
    }
  }, [isNew, preloadCustomer, initialized])

  // 기존 데이터 로드 (편집 모드)
  if (!isNew && existingJob && existingCustomer && !initialized) {
    setJob({
      status:      existingJob.status      ?? 'received',
      receiptDate: existingJob.receiptDate ?? today(),
      visitDate:   existingJob.visitDate   ?? '',
      visitTime:   existingJob.visitTime   ?? '',
      symptom:     existingJob.symptom     ?? '',
      diagnosis:   existingJob.diagnosis   ?? '',
      materials:   existingJob.materials   ?? '',
      workDone:    existingJob.workDone    ?? '',
      partsCost:   existingJob.partsCost   ?? '',
      laborCost:   existingJob.laborCost   ?? '',
      notes:       existingJob.notes       ?? '',
    })
    setCustomer({
      name:    existingCustomer.name    ?? '',
      phone:   existingCustomer.phone   ?? '',
      address: existingCustomer.address ?? '',
    })
    setInitialized(true)
  }

  function setJ(field, val) { setJob((p) => ({ ...p, [field]: val })) }
  function setC(field, val) { setCustomer((p) => ({ ...p, [field]: val })) }

  // 음성 녹음 (편집 모드 전용)
  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('이 브라우저는 음성 인식을 지원하지 않습니다.\n(Chrome 권장)'); return }
    const r = new SR()
    r.lang = 'ko-KR'
    r.continuous = true
    r.interimResults = true
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
      const prefix = !navigator.onLine ? '[오프라인 음성기록]\n' : '[API 키 없음 — 음성 원문]\n'
      setJ('notes', job.notes ? job.notes + '\n\n' + prefix + transcript : prefix + transcript)
      setTranscript('')
      return
    }
    setAiLoading(true)
    try {
      const result = await classifyRepairNote(transcript, apiKey)
      if (result.symptom)   setJ('symptom',   result.symptom)
      if (result.diagnosis) setJ('diagnosis', result.diagnosis)
      if (result.materials) setJ('materials', result.materials)
      if (result.workDone)  setJ('workDone',  result.workDone)
      if (result.notes)     setJ('notes', job.notes ? job.notes + '\n' + result.notes : result.notes)
      setTranscript('')
    } catch (e) {
      alert('AI 오류: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const totalCost = (Number(job.partsCost) || 0) + (Number(job.laborCost) || 0)

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
      setPhotos((p) => [...p, { dataUrl, caption: '' }])
    }
    e.target.value = ''
  }

  function selectCustomer(c) {
    setCustomer({ name: c.name, phone: c.phone, address: c.address ?? '' })
    setShowCustomerList(false)
    setCustomerSearch('')
  }

  async function handleSave() {
    if (!customer.name.trim()) { alert('업체명/고객명을 입력해 주세요.'); return }

    let customerId = isNew ? null : existingJob?.customerId
    if (isNew || !customerId) {
      customerId = await db.customers.add({
        name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
      })
    } else {
      await db.customers.update(customerId, {
        name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
      })
    }

    const jobData = {
      customerId,
      status:      isNew ? 'received' : job.status,
      receiptDate: job.receiptDate,
      visitDate:   job.visitDate,
      visitTime:   job.visitTime,
      symptom:     job.symptom,
      diagnosis:   job.diagnosis,
      materials:   job.materials,
      workDone:    job.workDone,
      partsCost:   Number(job.partsCost) || 0,
      laborCost:   Number(job.laborCost) || 0,
      cost:        totalCost,
      notes:       job.notes,
      updatedAt:   new Date().toISOString(),
    }

    let jobId
    if (isNew) {
      jobData.createdAt = new Date().toISOString()
      jobId = await db.service_jobs.add(jobData)
    } else {
      await db.service_jobs.update(Number(id), jobData)
      jobId = Number(id)
    }

    for (const photo of photos) {
      await db.job_photos.add({ jobId, dataUrl: photo.dataUrl, caption: photo.caption, takenAt: new Date().toISOString() })
    }

    navigate(`/service/${jobId}`)
  }

  const filteredCustomers = (allCustomers ?? []).filter((c) =>
    c.name.includes(customerSearch) || c.phone.includes(customerSearch)
  )

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">{isNew ? '새 수리 의뢰' : '의뢰 수정'}</h2>
        <button onClick={handleSave} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
          저장
        </button>
      </div>

      <div className="space-y-4">

        {/* ── 고객 정보 ── */}
        <Section title="고객 정보">
          <div className="mb-2">
            <button
              onClick={() => setShowCustomerList((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg px-3 py-1.5"
            >
              <Users size={12} strokeWidth={1.5} />
              {showCustomerList ? '닫기' : '기존 고객 불러오기'}
            </button>
            {showCustomerList && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="업체명 또는 전화번호"
                  className="w-full px-3 py-2 text-sm border-b border-gray-100 outline-none"
                />
                <div className="max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0
                    ? <p className="text-xs text-gray-400 px-3 py-2">검색 결과 없음</p>
                    : filteredCustomers.map((c) => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-sm border-t border-gray-50 active:bg-gray-50">
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="ml-2 text-gray-400 text-xs">{c.phone}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          <Field label="업체명 / 고객명 *" value={customer.name}    onChange={(v) => setC('name', v)}    placeholder="예) 홍길동 마트" />
          <Field label="전화번호"           value={customer.phone}   onChange={(v) => setC('phone', v)}   type="tel" placeholder="010-0000-0000" />
          <Field label="주소"               value={customer.address} onChange={(v) => setC('address', v)} placeholder="방문지 주소" />
        </Section>

        {/* ── 의뢰 정보 ── */}
        <Section title="의뢰 정보">
          <Field label="고장 접수일" value={job.receiptDate} onChange={(v) => setJ('receiptDate', v)} type="date" />
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">방문 예약일</label>
            <input
              type="date"
              value={job.visitDate}
              onChange={(e) => setJ('visitDate', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
          <TimeSelect
            label="방문 시간"
            value={job.visitTime}
            onChange={(v) => setJ('visitTime', v)}
          />
        </Section>

        {/* ── 증상 (새 의뢰 + 편집 공통) ── */}
        <Section title="고장 내역">
          <Textarea label="증상 (고객 설명)" value={job.symptom} onChange={(v) => setJ('symptom', v)} placeholder="고객이 말한 증상을 입력하세요" />
        </Section>

        {/* ── 새 의뢰 저장 버튼 ── */}
        {isNew && (
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gray-900 text-white text-base font-semibold rounded-xl"
          >
            저장
          </button>
        )}

        {/* ── 편집 모드 전용 필드 ── */}
        {!isNew && (
          <>
            {/* 음성 빠른 입력 */}
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
                  : <><Mic size={15} strokeWidth={1.5} />녹음 시작</>}
              </button>
              {transcript && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">인식된 내용</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{transcript}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setTranscript('')} className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-500">지우기</button>
                    <button onClick={handleAiClassify} disabled={aiLoading}
                      className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                      <Sparkles size={13} strokeWidth={1.5} />
                      {aiLoading ? 'AI 분류 중...' : 'AI로 자동 정리'}
                    </button>
                  </div>
                </div>
              )}
            </Section>

            <Section title="고장 내역">
              <Textarea label="증상 (고객 설명)" value={job.symptom}    onChange={(v) => setJ('symptom', v)}    placeholder="고객이 말한 증상" />
              <Textarea label="진단 결과"        value={job.diagnosis} onChange={(v) => setJ('diagnosis', v)} placeholder="현장 점검 후 진단 내용" />
            </Section>

            <Section title="준비 자재">
              <Textarea label="자재 목록" value={job.materials} onChange={(v) => setJ('materials', v)}
                placeholder={'예) 압축기 캐패시터 50μF\n냉매 R-22 1kg'} rows={4} />
            </Section>

            <Section title="수리 완료 내용">
              <Textarea label="수리 내용" value={job.workDone} onChange={(v) => setJ('workDone', v)} placeholder="완료된 수리 작업 내용" />
            </Section>

            <Section title="금액 청구">
              <Field label="부품비 (원)" value={job.partsCost} onChange={(v) => setJ('partsCost', v)} type="number" placeholder="0" />
              <Field label="공임비 (원)" value={job.laborCost} onChange={(v) => setJ('laborCost', v)} type="number" placeholder="0" />
              {(job.partsCost || job.laborCost) && (
                <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg flex justify-between text-sm font-semibold">
                  <span className="text-gray-500">합계</span>
                  <span className="text-gray-900">{totalCost.toLocaleString()} 원</span>
                </div>
              )}
            </Section>

            <Section title="현장 사진">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-24 h-24">
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50">
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-xs">촬영/추가</span>
                </button>
              </div>
            </Section>

            <Section title="기타 사항">
              <Textarea label="메모" value={job.notes} onChange={(v) => setJ('notes', v)} placeholder="특이사항, 다음 방문 주의사항 등" />
            </Section>
          </>
        )}

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-3 shadow-sm">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400" />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none" />
    </div>
  )
}

const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'))  // 06~22
const MINS  = ['00', '10', '20', '30', '40', '50']

function TimeSelect({ label, value, onChange }) {
  const [h, m] = value ? value.split(':') : ['', '']

  function update(newH, newM) {
    if (!newH && !newM) { onChange(''); return }
    onChange(`${newH || '09'}:${newM || '00'}`)
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">
        {label} <span className="text-gray-400 font-normal">(선택)</span>
      </label>
      <div className="flex gap-2">
        <select
          value={h ?? ''}
          onChange={(e) => update(e.target.value, m)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">시</option>
          {HOURS.map((hh) => <option key={hh} value={hh}>{hh}시</option>)}
        </select>
        <select
          value={m ?? ''}
          onChange={(e) => update(h, e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">분</option>
          {MINS.map((mm) => <option key={mm} value={mm}>{mm}분</option>)}
        </select>
      </div>
    </div>
  )
}
