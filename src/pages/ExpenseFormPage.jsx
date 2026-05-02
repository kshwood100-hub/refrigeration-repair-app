import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Plus, Trash2, Camera, X, ChevronDown, Check } from 'lucide-react'
import { db } from '../db'
import DateInput from '../components/DateInput'
import TrialLimitModal from '../components/TrialLimitModal'
import { consumeTrial } from '../utils/trial'

const today = () => new Date().toISOString().slice(0, 10)

function formatAmount(val) {
  if (val === '' || val == null) return ''
  const [int, dec] = String(val).split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${intFormatted}.${dec}` : intFormatted
}

function parseAmount(val) {
  return val.replace(/,/g, '').replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1')
}

const CATEGORIES = [
  '출장비', '자재비', '시간인건비', '식대', '숙박비', '시간외수당', '기타'
]
const ITEM_CAT_KEYS = {
  '출장비': 'expense.itemTravel', '자재비': 'expense.itemMaterial', '시간인건비': 'expense.itemLabor',
  '식대': 'expense.itemMeal', '숙박비': 'expense.itemLodging', '시간외수당': 'expense.itemOvertime',
  '기타': 'expense.itemOther',
}

const EMPTY_ITEM = { category: '출장비', description: '', amount: '' }

export default function ExpenseFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const isNew = !id

  const existing = useLiveQuery(() => id ? db.expenses.get(Number(id)) : undefined, [id])
  const jobs = useLiveQuery(() => db.service_jobs.orderBy('receiptDate').reverse().filter((r) => !r.deletedAt).toArray(), [])
  const customers = useLiveQuery(() => db.customers.orderBy('name').filter((r) => !r.deletedAt).toArray(), [])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [jobId, setJobId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState([])
  const [initialized, setInitialized] = useState(false)
  const [trialBlocked, setTrialBlocked] = useState(null)
  const [saving, setSaving] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [jobOpen, setJobOpen] = useState(false)
  const [categoryOpenIdx, setCategoryOpenIdx] = useState(-1)
  const fileRef = useRef()
  const customerRef = useRef()
  const jobRef = useRef()
  const categoryRef = useRef()

  useEffect(() => {
    function onClickOutside(e) {
      if (customerRef.current && !customerRef.current.contains(e.target)) setCustomerOpen(false)
      if (jobRef.current && !jobRef.current.contains(e.target)) setJobOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpenIdx(-1)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('touchstart', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('touchstart', onClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isNew && existing && !initialized) {
      setTitle(existing.title ?? '')
      setDate(existing.date ?? today())
      setJobId(existing.jobId ? String(existing.jobId) : '')
      const fallbackCid = existing.customerId
        ?? (existing.jobId && jobs ? jobs.find((j) => j.id === existing.jobId)?.customerId : null)
      setCustomerId(fallbackCid ? String(fallbackCid) : '')
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
    if (saving) return
    setSaving(true)
    try {
      if (isNew) {
        try {
          await consumeTrial('finance')
        } catch (e) {
          if (String(e?.message || e).includes('Trial limit')) {
            setTrialBlocked('finance')
            setSaving(false)
            return
          }
        }
      }
      // items 합계를 amount/total에 반영 — 회계 통계·필터·정렬에서 합계 직접 사용
      const itemsSum = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
      const data = {
        title: title.trim(),
        date,
        jobId: jobId ? Number(jobId) : null,
        customerId: customerId ? Number(customerId) : null,
        items,
        amount: itemsSum,
        total:  itemsSum,
        notes: notes.trim(),
        photos,
        updatedAt: new Date().toISOString(),
      }
      if (isNew) {
        await db.expenses.add({ ...data, createdAt: new Date().toISOString() })
      } else {
        await db.expenses.update(Number(id), data)
      }
      navigate('/finance', { replace: true })
    } catch (e) {
      console.error('Expense save failed:', e)
      setSaving(false)
    }
  }

  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">{t('expense.back')}</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">{isNew ? t('expense.newTitle') : t('expense.editTitle')}</h2>
        {!isNew && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-1.5 text-white text-sm font-bold rounded-lg ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700'}`}
          >
            {saving ? t('common.saving') : t('expense.save')}
          </button>
        )}
      </div>

      <div className="space-y-4">

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500">{t('expense.basicInfo')}</p>
          <div ref={customerRef} className="relative">
            <label className="text-xs text-gray-400 block mb-1">{t('expense.labelLinkCustomer')}</label>
            <button
              type="button"
              onClick={() => setCustomerOpen((v) => !v)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-emerald-600 flex items-center justify-between"
            >
              <span className="text-white font-medium">
                {customerId ? customerMap[Number(customerId)]?.name ?? t('expense.noLink') : t('expense.noLink')}
              </span>
              <ChevronDown size={14} strokeWidth={1.5} className="text-white" />
            </button>
            {customerOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setCustomerId(''); setJobId(''); setCustomerOpen(false) }}
                  className="w-full px-3 py-2 text-sm text-left flex items-center justify-between active:bg-slate-700"
                >
                  <span className="text-slate-300">{t('expense.noLink')}</span>
                  {!customerId && <Check size={14} className="text-emerald-400" />}
                </button>
                {(customers ?? []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCustomerId(String(c.id)); setJobId(''); setCustomerOpen(false) }}
                    className="w-full px-3 py-2 text-sm text-left flex items-center justify-between active:bg-slate-700 border-t border-slate-700"
                  >
                    <span className="text-white">{c.name}</span>
                    {String(c.id) === customerId && <Check size={14} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {customerId && (jobs ?? []).some((j) => j.customerId === Number(customerId)) && (
            <div ref={jobRef} className="relative">
              <label className="text-xs text-gray-400 block mb-1">{t('expense.labelLinkJob')}</label>
              <button
                type="button"
                onClick={() => setJobOpen((v) => !v)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-blue-600 flex items-center justify-between"
              >
                <span className="text-white font-medium">
                  {(() => {
                    if (!jobId) return t('expense.noJobLink')
                    const j = (jobs ?? []).find((x) => x.id === Number(jobId))
                    return j ? `${j.receiptDate}${(j.symptoms ?? j.symptom) ? ` — ${j.symptoms ?? j.symptom}` : ''}` : t('expense.noJobLink')
                  })()}
                </span>
                <ChevronDown size={14} strokeWidth={1.5} className="text-white" />
              </button>
              {jobOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setJobId(''); setJobOpen(false) }}
                    className="w-full px-3 py-2 text-sm text-left flex items-center justify-between active:bg-slate-700"
                  >
                    <span className="text-slate-300">{t('expense.noJobLink')}</span>
                    {!jobId && <Check size={14} className="text-blue-400" />}
                  </button>
                  {(jobs ?? []).filter((j) => j.customerId === Number(customerId)).map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => { setJobId(String(j.id)); setJobOpen(false) }}
                      className="w-full px-3 py-2 text-sm text-left flex items-center justify-between active:bg-slate-700 border-t border-slate-700"
                    >
                      <span className="text-white">{j.receiptDate}{(j.symptoms ?? j.symptom) ? ` — ${j.symptoms ?? j.symptom}` : ''}</span>
                      {String(j.id) === jobId && <Check size={14} className="text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('expense.labelTitle')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('expense.phTitle')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('expense.labelDate')}</label>
            <DateInput value={date} onChange={setDate} />
          </div>
        </div>

        {/* 경비 항목 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">{t('expense.itemsLabel')}</p>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-300 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div ref={categoryOpenIdx === idx ? categoryRef : null} className="relative">
                    <button
                      type="button"
                      onClick={() => setCategoryOpenIdx(categoryOpenIdx === idx ? -1 : idx)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-slate-600 rounded-lg flex items-center gap-1.5"
                    >
                      <span>{t(ITEM_CAT_KEYS[item.category] ?? item.category)}</span>
                      <ChevronDown size={12} strokeWidth={2} className="text-white" />
                    </button>
                    {categoryOpenIdx === idx && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setItem(idx, 'category', c); setCategoryOpenIdx(-1) }}
                            className="w-full px-3 py-2 text-sm text-left flex items-center justify-between active:bg-slate-700 border-t border-slate-700 first:border-t-0"
                          >
                            <span className="text-white">{t(ITEM_CAT_KEYS[c] ?? c)}</span>
                            {item.category === c && <Check size={14} className="text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-gray-300">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <input
                  value={item.description}
                  onChange={(e) => setItem(idx, 'description', e.target.value)}
                  placeholder={t('expense.phDesc')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatAmount(item.amount)}
                  onChange={(e) => setItem(idx, 'amount', parseAmount(e.target.value))}
                  placeholder={t('expense.phAmount')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 bg-slate-600 active:bg-slate-700"
          >
            <Plus size={14} strokeWidth={2} />
            {t('expense.addItem')}
          </button>

          <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">{t('expense.total')}</span>
            <span className="text-lg font-bold text-gray-900">{total.toLocaleString()}</span>
          </div>
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <label className="text-xs font-semibold text-gray-500 block mb-2">{t('expense.memo')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('expense.phMemo')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400 resize-none"
          />
        </div>

        {/* 영수증 사진 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">{t('expense.receipt')}</p>
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
              <span className="text-xs">{t('expense.photoCapture')}</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 text-white text-base font-semibold rounded-xl border-2 shadow-md ${saving ? 'bg-gray-400 border-gray-300 cursor-not-allowed' : 'bg-slate-700 border-slate-400 active:bg-slate-600'}`}
        >
          {saving ? t('common.saving') : t('expense.save')}
        </button>

      </div>
      {trialBlocked && <TrialLimitModal category={trialBlocked} onClose={() => setTrialBlocked(null)} />}
    </div>
  )
}
