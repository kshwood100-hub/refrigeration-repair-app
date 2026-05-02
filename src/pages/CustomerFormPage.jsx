import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save, Camera, Sparkles, Trash2 } from 'lucide-react'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { scanBusinessCard } from '../utils/scanBusinessCard'
import { consumeTrial } from '../utils/trial'

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

const EMPTY = { name: '', phone: '', email: '', address: '', traits: '', sitePhotos: [] }
const MAX_SITE_PHOTOS = 6

export default function CustomerFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const returnTo = location.state?.returnTo
  const returnState = location.state?.returnState

  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!isEdit)
  const [saving, setSaving] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const fileRef = useRef(null)
  const siteFileRef = useRef(null)

  useEffect(() => {
    if (!isEdit) return
    db.customers.get(Number(id)).then((c) => {
      if (c) setForm({
        name:       c.name       ?? '',
        phone:      c.phone      ?? '',
        email:      c.email      ?? '',
        address:    c.address    ?? '',
        traits:     c.traits     ?? '',
        sitePhotos: Array.isArray(c.sitePhotos) ? c.sitePhotos : [],
      })
      setLoaded(true)
    })
  }, [id, isEdit])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

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
        name:    result.company || result.name || p.name,
        phone:   result.mobile || result.phone || p.phone,
        email:   result.email   || p.email,
        address: result.address || p.address,
      }))
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  async function handleSitePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const cur = (form.sitePhotos ?? []).length
    if (cur >= MAX_SITE_PHOTOS) {
      showToast(t('customerForm.sitePhotosMaxReached', { max: MAX_SITE_PHOTOS }))
      return
    }
    try {
      const dataUrl = await compressImage(file)
      setForm((p) => ({ ...p, sitePhotos: [...(p.sitePhotos ?? []), dataUrl] }))
    } catch (err) {
      showToast(String(err.message || err))
    }
  }

  function removeSitePhoto(idx) {
    setForm((p) => ({ ...p, sitePhotos: (p.sitePhotos ?? []).filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (saving) return
    if (!form.name.trim()) {
      showToast(t('customerForm.nameRequired'))
      return
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        traits: (form.traits ?? '').trim(),
        sitePhotos: Array.isArray(form.sitePhotos) ? form.sitePhotos : [],
        updatedAt: now,
      }
      if (isEdit) {
        await db.customers.update(Number(id), data)
        if (returnTo) {
          navigate(returnTo, { replace: true, state: { ...(returnState || {}), customerId: Number(id) } })
        } else {
          navigate(`/customers/${id}`, { replace: true })
        }
      } else {
        try {
          await consumeTrial('customers')
        } catch (e) {
          if (String(e?.message || e).includes('Trial limit')) {
            showToast(t('trial.limitTitle'))
            setSaving(false)
            return
          }
        }
        const newId = await db.customers.add({ ...data, createdAt: now })
        if (returnTo) {
          navigate(returnTo, { replace: true, state: { ...(returnState || {}), customerId: newId } })
        } else {
          navigate(`/customers/${newId}`, { replace: true })
        }
      }
    } catch (e) {
      console.error('Customer save failed:', e)
      showToast(String(e?.message || e))
      setSaving(false)
    }
  }

  if (!loaded) return <div className="p-4 text-gray-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">{t('customerForm.back')}</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {isEdit ? t('customerForm.editTitle') : t('customerForm.title')}
        </h2>
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className={`px-3 py-1.5 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-1 ${
            saving || !form.name.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 active:bg-emerald-700'
          }`}
        >
          <Save size={14} strokeWidth={2} />
          {saving ? t('common.saving') : t('customerForm.save')}
        </button>
      </div>

      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleScan}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white text-sm font-bold rounded-xl active:bg-violet-700 disabled:opacity-60 shadow-sm"
        >
          {scanLoading ? (
            <><Sparkles size={16} strokeWidth={2} className="animate-pulse" /> {t('customerForm.aiAnalyzing')}</>
          ) : (
            <><Camera size={16} strokeWidth={2} /> {t('customerForm.scanCardBtn')}</>
          )}
        </button>
        {scanError && <p className="text-xs text-red-500 mt-2">{scanError}</p>}
        {!scanLoading && !scanError && (
          <p className="text-[11px] text-gray-400 mt-1.5 text-center">{t('customerForm.scanCardHint')}</p>
        )}
      </div>

      <div className="space-y-3">
        <Field label={t('job.labelCustomerName')} value={form.name}    onChange={(v) => set('name', v)}    placeholder={t('job.phCustomer')} />
        <Field label={t('job.labelPhone')}        value={form.phone}   onChange={(v) => set('phone', v)}   type="tel" placeholder="010-0000-0000" />
        <Field label={t('job.labelEmail')}        value={form.email}   onChange={(v) => set('email', v)}   type="email" placeholder="example@email.com" />
        <Field label={t('job.labelAddress')}      value={form.address} onChange={(v) => set('address', v)} placeholder={t('job.phAddress')} />

        {/* 고객 성향 메모 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('customerForm.traits')}</label>
          <textarea
            value={form.traits ?? ''}
            onChange={(e) => set('traits', e.target.value)}
            placeholder={t('customerForm.traitsPlaceholder')}
            rows={3}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* 현장 사진 (배관/드레인/창고 위치 등) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500">{t('customerForm.sitePhotos')}</label>
            <span className="text-[11px] text-gray-400">{(form.sitePhotos ?? []).length} / {MAX_SITE_PHOTOS}</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-2">{t('customerForm.sitePhotosHint')}</p>
          <input
            ref={siteFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleSitePhoto}
          />
          <div className="flex flex-wrap gap-2">
            {(form.sitePhotos ?? []).map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-300" />
                <button
                  onClick={() => removeSitePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border border-gray-300 text-gray-600 rounded-full flex items-center justify-center shadow-sm"
                  aria-label="remove"
                >
                  <Trash2 size={11} strokeWidth={2} />
                </button>
              </div>
            ))}
            {(form.sitePhotos ?? []).length < MAX_SITE_PHOTOS && (
              <button
                onClick={() => siteFileRef.current?.click()}
                className="w-20 h-20 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50"
              >
                <Camera size={20} strokeWidth={1.5} />
                <span className="text-[10px]">{t('customerForm.addSitePhoto')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
      />
    </div>
  )
}
