import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Trash2, Camera, X } from 'lucide-react'
import { db } from '../db'

const today = () => new Date().toISOString().slice(0, 10)

const CATEGORIES = [
  '출장비', '자재비', '시간인건비', '식대', '숙박비', '시간외수당', '기타'
]

const EMPTY_ITEM = { category: '출장비', description: '', amount: '' }

export default function ExpenseFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id

  const existing = useLiveQuery(() => id ? db.expenses.get(Number(id)) : undefined, [id])
  const jobs = useLiveQuery(() => db.service_jobs.orderBy('receiptDate').reverse().toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [jobId, setJobId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState([])
  const [initialized, setInitialized] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (!isNew && existing && !initialized) {
      setTitle(existing.title ?? '')
      setDate(existing.date ?? today())
      setJobId(existing.jobId ? String(existing.jobId) : '')
      setItems(existing.items?.length ? existing.items : [{ ...EMPTY_ITEM }])
      setNotes(existing.notes ?? '')
      setPhotos(existing.photos ?? [])
      setInitialized(true)
    }
  }, [existing, isNew, initialized])

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
      setPhotos((p) => [...p, dataUrl])
    }
    e.target.value = ''
  }

  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]))

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  function setItem(idx, field, val) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    const data = {
      title: title.trim(),
      date,
      jobId: jobId ? Number(jobId) : null,
      items,
      notes: notes.trim(),
      photos,
      updatedAt: new Date().toISOString(),
    }
    if (isNew) {
      const newId = await db.expenses.add({ ...data, createdAt: new Date().toISOString() })
      navigate(`/expenses/${newId}`)
    } else {
      await db.expenses.update(Number(id), data)
      navigate(`/expenses/${id}`)
    }
  }

  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">{isNew ? '새 경비 내역' : '경비 수정'}</h2>
        {!isNew && (
          <button onClick={handleSave} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
            저장
          </button>
        )}
      </div>

      <div className="space-y-4">

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500">기본 정보</p>
          <div>
            <label className="text-xs text-gray-400 block mb-1">제목 (선택)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 3월 현장 출장 경비"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">수리 의뢰 연결 (선택)</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400 bg-white"
            >
              <option value="">연결 안 함</option>
              {(jobs ?? []).map((j) => {
                const c = customerMap[j.customerId]
                return (
                  <option key={j.id} value={j.id}>
                    {c?.name ?? '고객 미등록'} — {j.receiptDate}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* 경비 항목 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">경비 항목</p>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-300 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <select
                    value={item.category}
                    onChange={(e) => setItem(idx, 'category', e.target.value)}
                    className="text-sm font-medium text-gray-700 border-none outline-none bg-transparent"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-gray-300">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <input
                  value={item.description}
                  onChange={(e) => setItem(idx, 'description', e.target.value)}
                  placeholder="내역 (예: 왕복 120km, 4시간 작업)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => setItem(idx, 'amount', e.target.value)}
                    placeholder="금액"
                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                </div>
              </div>
            ))}
          </div>

          {/* 항목 추가 버튼 - 항목 아래 */}
          <button
            onClick={addItem}
            className="w-full mt-3 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 flex items-center justify-center gap-1.5 active:bg-gray-50"
          >
            <Plus size={14} strokeWidth={2} />
            항목 추가
          </button>

          {/* 합계 */}
          <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">합계</span>
            <span className="text-lg font-bold text-gray-900">{total.toLocaleString()}원</span>
          </div>
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <label className="text-xs font-semibold text-gray-500 block mb-2">메모</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항, 영수증 번호 등"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400 resize-none"
          />
        </div>

        {/* 영수증 사진 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">영수증 사진</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
          <div className="flex gap-2 flex-wrap">
            {photos.map((dataUrl, i) => (
              <div key={i} className="relative w-24 h-24">
                <img src={dataUrl} alt="" className="w-full h-full object-cover rounded-xl" />
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
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-gray-900 text-white text-base font-semibold rounded-xl"
        >
          저장
        </button>

      </div>
    </div>
  )
}
