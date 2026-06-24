import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save, Camera, X, Sparkles, Plus, Trash2 } from 'lucide-react'
import { db } from '../db'
import { scanBusinessCard } from '../utils/scanBusinessCard'
import { consumeTrial } from '../utils/trial'
import { showToast } from '../utils/toast'
import { captureAttr } from '../utils/deviceCapture'
import { todayLocal } from '../utils/date'
import { fmtNumInput, parseNumInput, parseNum } from '../utils/money'

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

// 스캔으로 영수증을 찍으면 거래처 정보와 함께 잡히는 첫 거래내역 (선택)
const EMPTY_TX = { date: '', items: [], subtotal: '', tax: '', total: '' }
// 스캔 결과(OpenAI 표준형식: 점=소수점) 정리 — 콤마 천단위 제거, 소수점 보존
const num = (v) => String(v ?? '').replace(/,/g, '').replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1')

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
  const [tx, setTx] = useState(EMPTY_TX)        // 스캔으로 잡힌 거래내역 (있을 때만 저장)
  const [loaded, setLoaded] = useState(!isEdit)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const hasTx = tx.items.length > 0 || (tx.total ?? '') !== ''
  const setTxField = (k, v) => setTx((p) => ({ ...p, [k]: v }))
  function updateTxRow(i, k, v) {
    setTx((p) => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items } })
  }
  const addTxRow = () => setTx((p) => ({ ...p, items: [...p.items, { name: '', qty: '', price: '' }] }))
  const removeTxRow = (i) => setTx((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  const clearTx = () => setTx(EMPTY_TX)

  useEffect(() => {
    if (!isEdit) return
    db.suppliers.get(Number(id)).then((s) => {
      if (s) setForm({ ...EMPTY, ...s })
      setLoaded(true)
    })
  }, [id, isEdit])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  // 잡힌 거래내역을 supplier_transactions에 함께 저장 (영수증 스캔 시)
  async function saveTxFor(supplierId, now) {
    if (!hasTx) return
    try { await consumeTrial('finance') } catch (e) { /* cap 초과 시 거래만 생략, 거래처는 저장 */ if (String(e?.message || e).includes('Trial limit')) return }
    const items = tx.items
      .filter((it) => (it.name || '').trim() || parseNum(it.price))
      .map((it) => ({ name: it.name || '', qty: it.qty || '', price: parseNum(it.price) }))
    const itemsSum = items.reduce((s, it) => s + Number(it.price || 0), 0) // price = 행 합계금액(scanInvoice 규약)
    const subtotalVal = (tx.subtotal ?? '') !== '' ? parseNum(tx.subtotal) : (itemsSum || null)
    const taxVal      = (tx.tax ?? '')      !== '' ? parseNum(tx.tax)      : null
    const totalVal    = (tx.total ?? '')    !== '' ? parseNum(tx.total)    : (subtotalVal != null ? subtotalVal + (taxVal || 0) : null)
    await db.supplier_transactions.add({
      supplierId,
      date: tx.date || todayLocal(),
      items,
      subtotal: subtotalVal,
      tax: taxVal,
      total: totalVal,
      memo: '',
      invoicePhoto: form.cardPhoto || '',
      createdAt: now,
    })
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (isEdit) {
        await db.suppliers.update(Number(id), { ...form, updatedAt: now })
        await saveTxFor(Number(id), now)
        navigate(`/suppliers/${id}`)
      } else {
        // 트라이얼 cap — 거래처(customers) 카테고리에 통합 (project_pricing_confirmed.md 정책)
        try {
          await consumeTrial('customers')
        } catch (e) {
          if (String(e?.message || e).includes('Trial limit')) {
            showToast(t('trial.limitTitle'))
            setSaving(false)
            return
          }
        }
        const newId = await db.suppliers.add({ ...form, createdAt: now, updatedAt: now })
        await saveTxFor(newId, now)
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
      // 영수증이면 거래내역도 함께 채움
      const scanned = (result.items ?? [])
        .map((it) => ({ name: it.name ?? '', qty: it.qty ?? '', price: num(it.price ?? it.amount) }))
        .filter((it) => it.name.trim() || it.price)
      if (scanned.length || num(result.total)) {
        setTx({
          date: result.date || '',
          items: scanned,
          subtotal: num(result.subtotal),
          tax: num(result.tax),
          total: num(result.total),
        })
      }
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
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('supplier.back')}
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? t('supplier.editTitle') : t('supplier.addTitle')}</h1>

      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          {...captureAttr()}
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

      {/* 영수증 스캔 시 함께 잡힌 거래내역 — 저장하면 첫 거래로 등록 */}
      {hasTx && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-blue-800">{t('supplier.txSection')}</span>
            <button onClick={clearTx} className="text-xs text-gray-400 active:text-gray-600 flex items-center gap-1">
              <X size={12} strokeWidth={2} /> {t('supplier.txRemove')}
            </button>
          </div>
          <p className="text-xs text-blue-600 mb-3">{t('supplier.txHint')}</p>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-12 shrink-0">{t('tx.field.date')}</span>
              <input
                value={tx.date}
                onChange={(e) => setTxField('date', e.target.value)}
                placeholder="2026-06-06"
                className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
            {tx.items.map((it, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5">
                <input value={it.name} onChange={(e) => updateTxRow(i, 'name', e.target.value)} placeholder={t('tx.field.itemName')}
                  className="flex-1 min-w-0 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500" />
                <input value={it.qty} onChange={(e) => updateTxRow(i, 'qty', e.target.value)} placeholder={t('tx.field.itemQty')}
                  className="w-14 bg-white border border-gray-300 rounded px-1.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500" />
                <input value={fmtNumInput(it.price)} onChange={(e) => updateTxRow(i, 'price', parseNumInput(e.target.value))}
                  inputMode="decimal" placeholder={t('tx.field.itemPrice')}
                  className="w-20 bg-white border border-gray-300 rounded px-1.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500 text-right" />
                <button onClick={() => removeTxRow(i)} className="w-6 h-6 flex items-center justify-center text-red-500 active:text-red-600 shrink-0">
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button onClick={addTxRow} className="w-full flex items-center justify-center gap-1 py-2 bg-white border border-blue-300 text-blue-700 text-xs font-semibold rounded-lg active:bg-blue-100">
              <Plus size={12} strokeWidth={2.5} /> {t('tx.field.addRow')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <TxNum label={t('tx.field.subtotal')} value={tx.subtotal} onChange={(v) => setTxField('subtotal', v)} />
            <TxNum label={t('tx.field.tax')}      value={tx.tax}      onChange={(v) => setTxField('tax', v)} />
            <TxNum label={t('tx.field.total')}    value={tx.total}    onChange={(v) => setTxField('total', v)} />
          </div>
        </div>
      )}

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

function TxNum({ label, value, onChange }) {
  const display = fmtNumInput(value)
  return (
    <div>
      <label className="text-[11px] text-gray-500 mb-1 block">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => onChange(parseNumInput(e.target.value))}
        placeholder="0"
        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 text-right"
      />
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
