import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, Camera, User, Building2, Phone, Mail,
  MapPin, Loader, Check, Trash2, CreditCard, Plus,
} from 'lucide-react'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import { showToast } from '../utils/toast'
import { scanBusinessCard } from '../utils/scanBusinessCard'
import TrialLimitModal from '../components/TrialLimitModal'
import { consumeTrial } from '../utils/trial'
import { softDelete } from '../utils/cloudSync'
import { captureAttr, isMobile } from '../utils/deviceCapture'
import MediaImage from '../components/MediaImage'

const EMPTY = {
  name: '', company: '', title: '', phone: '', mobile: '', email: '', address: '', memo: '',
}

export default function BusinessCardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileRef = useRef()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  const [mode, setMode] = useState('list')   // 'list' | 'confirm'
  const [photoUrl, setPhotoUrl] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [trialBlocked, setTrialBlocked] = useState(null)

  useEffect(() => {
    // PC 흐름: ServicePage 명함스캔에서 이미 사진 골라 state로 들고 옴 → 확인 뷰 직행
    const incoming = location.state?.scanDataUrl
    if (incoming) {
      navigate(location.pathname, { replace: true, state: null })
      handleDataUrl(incoming)
      return
    }
    if (searchParams.get('scan') === '1') {
      // 모바일만 자동 카메라 호출. PC는 user activation 필요해서 차단됨.
      if (isMobile()) fileRef.current?.click()
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cards = useLiveQuery(
    () => db.business_cards.orderBy('createdAt').reverse().filter((r) => !r.deletedAt).toArray(), []
  )
  const customers = useLiveQuery(() => db.customers.filter((r) => !r.deletedAt).toArray(), [])
  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]))

  function setField(key, val) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function handleDataUrl(dataUrl) {
    setPhotoUrl(dataUrl)
    setForm(EMPTY)
    setMode('confirm')

    setScanning(true)
    try {
      const result = await scanBusinessCard(dataUrl)
      setForm({
        name:    result.name    ?? '',
        company: result.company ?? '',
        title:   result.title   ?? '',
        phone:   result.phone   ?? '',
        mobile:  result.mobile  ?? '',
        email:   result.email   ?? '',
        address: result.address ?? '',
        memo:    result.memo    ?? '',
      })
    } catch (err) {
      showToast(t('bc.errScan') + err.message)
    } finally {
      setScanning(false)
    }
  }

  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => handleDataUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast(t('bc.errName')); return }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const primaryPhone = form.mobile.trim() || form.phone.trim()

      let customerId = null
      const existing = (customers ?? []).find(
        (c) => c.name === form.name.trim() && (c.phone === primaryPhone || !primaryPhone)
      )
      if (existing) {
        customerId = existing.id
      } else {
        try {
          await consumeTrial('customers')
        } catch (e) {
          if (String(e?.message || e).includes('Trial limit')) {
            setTrialBlocked('customers')
            setSaving(false)
            return
          }
        }
        customerId = await db.customers.add({
          name:    form.name.trim(),
          phone:   primaryPhone,
          address: form.address.trim(),
        })
      }

      await db.business_cards.add({
        customerId,
        dataUrl:  photoUrl,
        name:     form.name.trim(),
        company:  form.company.trim(),
        title:    form.title.trim(),
        phone:    form.phone.trim(),
        mobile:   form.mobile.trim(),
        email:    form.email.trim(),
        address:  form.address.trim(),
        memo:     form.memo.trim(),
        createdAt: now,
      })

      setMode('list')
      setPhotoUrl('')
      setForm(EMPTY)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await softDelete('business_cards', id)
    setDeleting(null)
  }

  /* ── CONFIRM VIEW ───────────────────────────────────────── */
  if (mode === 'confirm') {
    const fields = [
      { key: 'name',    label: t('bc.fieldName'),    Icon: User,      required: true },
      { key: 'company', label: t('bc.fieldCompany'), Icon: Building2 },
      { key: 'title',   label: t('bc.fieldTitle'),   Icon: null },
      { key: 'mobile',  label: t('bc.fieldMobile'),  Icon: Phone },
      { key: 'phone',   label: t('bc.fieldPhone'),   Icon: Phone },
      { key: 'email',   label: t('bc.fieldEmail'),   Icon: Mail },
      { key: 'address', label: t('bc.fieldAddress'), Icon: MapPin },
      { key: 'memo',    label: t('bc.fieldMemo'),    Icon: null },
    ]
    return (
      <div className="p-4 pb-12">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setMode('list'); setPhotoUrl('') }} className="text-gray-500">
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <h2 className="text-base font-semibold text-gray-900">{t('bc.confirmInfo')}</h2>
        </div>

        {/* 명함 사진 */}
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center">
          <img src={photoUrl} alt={t('bc.title')} className="w-full max-h-44 object-contain" />
        </div>

        {/* 스캔 중 */}
        {scanning && (
          <div className="flex items-center justify-center gap-2 py-3 mb-3 text-blue-600 text-sm bg-blue-50 rounded-xl">
            <Loader size={15} className="animate-spin" strokeWidth={2} />
            {t('bc.scanning')}
          </div>
        )}

        {!scanning && (
          <button
            onClick={async () => {
              setScanning(true)
              try {
                const result = await scanBusinessCard(photoUrl)
                setForm({
                  name:    result.name    ?? '',
                  company: result.company ?? '',
                  title:   result.title   ?? '',
                  phone:   result.phone   ?? '',
                  mobile:  result.mobile  ?? '',
                  email:   result.email   ?? '',
                  address: result.address ?? '',
                  memo:    result.memo    ?? '',
                })
              } catch (err) {
                showToast(t('bc.errScan') + err.message)
              } finally {
                setScanning(false)
              }
            }}
            className="w-full py-2 mb-3 text-xs font-medium bg-blue-50 border border-blue-300 text-blue-700 rounded-xl"
          >
            {t('bc.rescan')}
          </button>
        )}

        {/* 폼 */}
        <div className="space-y-2.5">
          {fields.map(({ key, label, Icon, required }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 mb-0.5 block">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <div className="relative">
                {Icon && (
                  <Icon
                    size={13}
                    strokeWidth={1.5}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                )}
                <input
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={label}
                  className={`w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-gray-400 bg-white`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => { setMode('list'); setPhotoUrl('') }}
            className="flex-1 py-3 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
          >
            {t('bc.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || scanning || saving}
            className="flex-2 px-6 py-3 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md active:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {saving
              ? <Loader size={14} className="animate-spin" />
              : <Check size={14} strokeWidth={2} />}
            {saving ? t('bc.saving') : t('bc.saveAndRegister')}
          </button>
        </div>
      </div>
    )
  }

  /* ── LIST VIEW ──────────────────────────────────────────── */
  return (
    <div className="p-4 pb-10">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{t('bc.title')}</h2>
          {cards && cards.length > 0 && (
            <span className="text-xs text-gray-400">{t('bc.cardCount', { count: cards.length })}</span>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        {...captureAttr()}
        className="hidden"
        onChange={handleCapture}
      />

      {(!cards || cards.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CreditCard size={52} strokeWidth={1} className="mb-4 opacity-25" />
          <p className="text-lg mb-2 font-bold text-gray-600">{t('bc.empty')}</p>
          <p className="text-sm text-center leading-relaxed whitespace-pre-line text-gray-400">
            {t('bc.emptyDesc')}
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gray-800 text-white text-base font-semibold rounded-xl active:bg-gray-700"
          >
            <Camera size={16} strokeWidth={2} />
            {t('bc.firstScan')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => {
            const customer = customerMap[card.customerId]
            return (
              <div
                key={card.id}
                onClick={() => card.customerId && navigate(`/customers/${card.customerId}`)}
                className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {(card.dataUrl || card.storagePath) ? (
                    <MediaImage
                      dataUrl={card.dataUrl}
                      storagePath={card.storagePath}
                      alt={t('bc.title')}
                      className="w-16 h-10 object-cover rounded-lg border border-gray-300 shrink-0 bg-gray-50"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                      <CreditCard size={18} strokeWidth={1} className="text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {card.name || t('bc.noName')}
                        </p>
                        {(card.company || card.title) && (
                          <p className="text-xs text-gray-500 truncate">
                            {[card.company, card.title].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {(card.mobile || card.phone) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {card.mobile || card.phone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(card.id) }}
                        className="p-1 text-gray-300 shrink-0"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {customer && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customers/${card.customerId}`) }}
                          className="text-xs text-emerald-600 font-medium"
                        >
                          ✓ {t('bc.viewHistory')}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/service/new', { state: { customerId: card.customerId } }) }}
                        className="ml-auto flex items-center gap-1 text-xs text-blue-600 font-medium"
                      >
                        <Plus size={11} strokeWidth={2} />
                        {t('bc.newRequest')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('bc.deleteConfirm')}</p>
            <p className="text-sm text-gray-400 mb-5">{t('bc.deleteDesc')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                {t('bc.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
              >
                {t('bc.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {trialBlocked && <TrialLimitModal category={trialBlocked} onClose={() => setTrialBlocked(null)} />}
    </div>
  )
}
