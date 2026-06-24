import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save, Camera, X, Sparkles, Plus, Trash2 } from 'lucide-react'
import { db } from '../db'
import { scanInvoice } from '../utils/scanInvoice'
import DateInput from '../components/DateInput'
import { todayLocal } from '../utils/date'
import { consumeTrial } from '../utils/trial'
import { showToast } from '../utils/toast'
import { captureAttr } from '../utils/deviceCapture'
import { fmtNumInput, parseNumInput } from '../utils/money'

const EMPTY_ROW = { name: '', qty: '', price: '' }

const EMPTY = {
  date: todayLocal(),
  items: [],
  subtotal: '',
  tax: '',
  total: '',
  memo: '',
  invoicePhoto: '',
}

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

export default function SupplierTransactionFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const supplierId = Number(id)
  const [form, setForm] = useState(EMPTY)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const appendFileRef = useRef(null)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  function updateRow(i, k, v) {
    setForm((p) => {
      const items = [...p.items]
      items[i] = { ...items[i], [k]: v }
      return { ...p, items }
    })
  }
  function addRow() {
    setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ROW }] }))
  }
  function removeRow(i) {
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      // 트라이얼 cap — 매입거래는 회계(finance) 카테고리에 통합
      try {
        await consumeTrial('finance')
      } catch (e) {
        if (String(e?.message || e).includes('Trial limit')) {
          showToast(t('trial.limitTitle'))
          setSaving(false)
          return
        }
      }
      const now = new Date().toISOString()
      // items가 있으면 합계 자동 계산. 사용자가 직접 입력한 값(form.subtotal/tax/total)이 우선.
      const itemsSum = form.items.reduce(
        (s, it) => s + (Number(it.qty || 0) * Number(it.price || 0)),
        0
      )
      const subtotalVal = form.subtotal !== '' ? Number(form.subtotal) : (itemsSum || null)
      const taxVal      = form.tax      !== '' ? Number(form.tax)      : null
      const totalVal    = form.total    !== '' ? Number(form.total)    : (
        subtotalVal != null ? subtotalVal + (taxVal || 0) : null
      )
      await db.supplier_transactions.add({
        supplierId,
        ...form,
        subtotal: subtotalVal,
        tax:      taxVal,
        total:    totalVal,
        createdAt: now,
      })
      navigate(`/suppliers/${supplierId}`)
    } catch (e) {
      console.error('Transaction save failed:', e)
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
      // 1단계: 사진 즉시 박기 (사용자가 미리보기 보면서 AI 분석 대기)
      set('invoicePhoto', dataUrl)
      // 2단계: AI 분석 (백그라운드)
      const result = await scanInvoice(dataUrl)
      const items = (result.items ?? []).map((it) => ({
        name:  it.name ?? '',
        qty:   it.qty  ?? '',
        price: num(it.price ?? it.amount),
      }))
      setForm((p) => ({
        ...p,
        date:         result.date  || p.date,
        items:        items.length ? items : p.items,
        subtotal:     num(result.subtotal),
        tax:          num(result.tax),
        total:        num(result.total),
      }))
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  // 다음 장 스캔 — 한 거래에 여러 장 명세서 누적. items append + 합계 누적.
  async function handleScanAppend(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScanError('')
    setScanLoading(true)
    try {
      const dataUrl = await compressImage(file)
      const result = await scanInvoice(dataUrl)
      const newItems = (result.items ?? []).map((it) => ({
        name:  it.name ?? '',
        qty:   it.qty  ?? '',
        price: num(it.price ?? it.amount),
      }))
      const sumNum = (a, b) => String(Number(num(a) || 0) + Number(num(b) || 0))
      setForm((p) => ({
        ...p,
        items:    [...p.items, ...newItems],
        subtotal: sumNum(p.subtotal, result.subtotal),
        tax:      sumNum(p.tax,      result.tax),
        total:    sumNum(p.total,    result.total),
      }))
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('supplier.back')}
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-900">{t('tx.addTitle')}</h1>

      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          {...captureAttr()}
          className="hidden"
          onChange={handleScan}
        />
        <input
          ref={appendFileRef}
          type="file"
          accept="image/*"
          {...captureAttr()}
          className="hidden"
          onChange={handleScanAppend}
        />
        {form.invoicePhoto ? (
          <div className="relative w-fit mx-auto">
            <img src={form.invoicePhoto} alt="" className="h-48 w-auto block rounded-xl border border-gray-300" />
            <button
              onClick={() => set('invoicePhoto', '')}
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
              <><Camera size={16} strokeWidth={2} /> {t('tx.scanInvoice')}</>
            )}
          </button>
        )}
        {scanError && <p className="text-xs text-red-500 mt-2">{scanError}</p>}
        {!form.invoicePhoto && !scanLoading && (
          <p className="text-xs text-gray-500 mt-2 text-center">{t('tx.scanInvoiceHint')}</p>
        )}
        {form.invoicePhoto && (
          <button
            onClick={() => appendFileRef.current?.click()}
            disabled={scanLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700 disabled:opacity-60"
          >
            {scanLoading ? (
              <><Sparkles size={14} strokeWidth={2} className="animate-pulse" /> {t('supplier.aiAnalyzing')}</>
            ) : (
              <><Plus size={14} strokeWidth={2} /> {t('tx.scanAppend')}</>
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Field label={t('tx.field.date')} type="date" value={form.date} onChange={(v) => set('date', v)} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">{t('tx.field.itemsLabel', { n: form.items.length })}</label>
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg active:bg-blue-700"
            >
              <Plus size={12} strokeWidth={2.5} />
              {t('tx.field.addRow')}
            </button>
          </div>

          {form.items.length === 0 ? (
            <button
              onClick={addRow}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white text-sm font-bold rounded-xl active:bg-violet-700 shadow-md"
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('tx.field.manualAdd')}
            </button>
          ) : (
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                    placeholder={t('tx.field.itemName')}
                    className="flex-1 min-w-0 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500"
                  />
                  <input
                    value={it.qty}
                    onChange={(e) => updateRow(i, 'qty', e.target.value)}
                    placeholder={t('tx.field.itemQty')}
                    className="w-16 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500"
                  />
                  <input
                    value={fmtNumInput(it.price)}
                    onChange={(e) => updateRow(i, 'price', parseNumInput(e.target.value))}
                    inputMode="decimal"
                    placeholder={t('tx.field.itemPrice')}
                    className="w-24 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-amber-700 outline-none focus:border-blue-500 text-right"
                  />
                  <button
                    onClick={() => removeRow(i)}
                    className="w-6 h-6 flex items-center justify-center text-red-500 active:text-red-600 shrink-0"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <NumField label={t('tx.field.subtotal')} value={form.subtotal} onChange={(v) => set('subtotal', v)} />
          <NumField label={t('tx.field.tax')}      value={form.tax}      onChange={(v) => set('tax', v)} />
          <NumField label={t('tx.field.total')}    value={form.total}    onChange={(v) => set('total', v)} />
        </div>
        <Field label={t('tx.field.memo')} placeholder={t('supplier.field.memoPlaceholder')} value={form.memo} onChange={(v) => set('memo', v)} multiline />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (!form.total && form.items.length === 0)}
        className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700 disabled:opacity-50'}`}
      >
        <Save size={16} strokeWidth={2} />
        {saving ? t('common.saving') : t('supplier.save')}
      </button>
    </div>
  )
}

function NumField({ label, value, onChange }) {
  const display = fmtNumInput(value)
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => onChange(parseNumInput(e.target.value))}
        placeholder="0"
        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
      />
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text', multiline }) {
  if (type === 'date') {
    return (
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
        <DateInput value={value} onChange={onChange} placeholder={placeholder} />
      </div>
    )
  }
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
