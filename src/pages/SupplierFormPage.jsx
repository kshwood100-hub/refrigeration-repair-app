import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save, Camera, X, Sparkles } from 'lucide-react'
import { db } from '../db'
import { scanBusinessCard } from '../utils/scanBusinessCard'

const EMPTY = {
  items: '',
  name: '',
  phone: '',
  phone2: '',
  address: '',
  email: '',
  memo: '',
  cardPhoto: '',
}

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

export default function SupplierFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!isEdit)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isEdit) return
    db.suppliers.get(Number(id)).then((s) => {
      if (s) setForm({ ...EMPTY, ...s })
      setLoaded(true)
    })
  }, [id, isEdit])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (isEdit) {
        await db.suppliers.update(Number(id), { ...form, updatedAt: now })
        navigate(`/suppliers/${id}`)
      } else {
        const newId = await db.suppliers.add({ ...form, createdAt: now, updatedAt: now })
        navigate(`/suppliers/${newId}`)
      }
    } catch (e) {
      console.error('Supplier save failed:', e)
      setSaving(false)
    }
  }

  async function handleScan(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScanError('')
    setScanLoading(true)
    try {
      const dataUrl = await compressImage(file)
      const result = await scanBusinessCard(dataUrl)
      setForm((p) => ({
        ...p,
        cardPhoto: dataUrl,
        name:    result.company || result.name || p.name,
        phone:   result.phone   || p.phone,
        phone2:  result.mobile  || p.phone2,
        email:   result.email   || p.email,
        address: result.address || p.address,
        memo:    [result.title, result.memo].filter(Boolean).join(' · ') || p.memo,
      }))
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  if (!loaded) return <div className="p-4 text-gray-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-4 text-gray-600"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span className="text-sm">{t('supplier.back')}</span>
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? t('supplier.editTitle') : t('supplier.addTitle')}</h1>

      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleScan}
        />
        {form.cardPhoto ? (
          <div className="relative w-fit mx-auto">
            <img src={form.cardPhoto} alt="" className="h-40 w-auto block rounded-xl border border-gray-300" />
            <button
              onClick={() => set('cardPhoto', '')}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/70 rounded-full text-white"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={scanLoading}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 text-white text-xs font-semibold rounded-lg active:bg-emerald-700 disabled:opacity-60"
            >
              <Camera size={12} strokeWidth={2} />
              {t('supplier.retake')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-semibold rounded-xl active:bg-emerald-700 disabled:opacity-60"
          >
            {scanLoading ? (
              <><Sparkles size={16} strokeWidth={2} className="animate-pulse" /> {t('supplier.aiAnalyzing')}</>
            ) : (
              <><Camera size={16} strokeWidth={2} /> {t('supplier.scanCard')}</>
            )}
          </button>
        )}
        {scanError && <p className="text-xs text-red-500 mt-2">{scanError}</p>}
        {!form.cardPhoto && !scanLoading && (
          <p className="text-xs text-gray-500 mt-2 text-center">{t('supplier.scanCardHint')}</p>
        )}
      </div>

      <div className="space-y-3">
        <Field label={t('supplier.field.items')}    placeholder={t('supplier.field.itemsPlaceholder')}    value={form.items}   onChange={(v) => set('items', v)} />
        <Field label={t('supplier.field.name')}     placeholder={t('supplier.field.namePlaceholder')}     value={form.name}    onChange={(v) => set('name', v)} />
        <Field label={t('supplier.field.phone')}    placeholder="010-1234-5678"                           value={form.phone}   onChange={(v) => set('phone', v)} />
        <Field label={t('supplier.field.phone2')}   placeholder={t('supplier.field.phone2Placeholder')}   value={form.phone2}  onChange={(v) => set('phone2', v)} />
        <Field label={t('supplier.field.address')}  placeholder={t('supplier.field.addressPlaceholder')}  value={form.address} onChange={(v) => set('address', v)} />
        <Field label={t('supplier.field.email')}    placeholder="contact@company.com"                     value={form.email}   onChange={(v) => set('email', v)} type="email" />
        <Field label={t('supplier.field.memo')}     placeholder={t('supplier.field.memoPlaceholder')}     value={form.memo}    onChange={(v) => set('memo', v)} multiline />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (!form.items.trim() && !form.name.trim())}
        className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700 disabled:opacity-50'}`}
      >
        <Save size={16} strokeWidth={2} />
        {saving ? t('common.saving') : t('supplier.save')}
      </button>
      {!form.items.trim() && !form.name.trim() && (
        <p className="text-xs text-amber-600 mt-2 text-center">{t('supplier.requiredHint')}</p>
      )}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text', multiline }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
        />
      )}
    </div>
  )
}
