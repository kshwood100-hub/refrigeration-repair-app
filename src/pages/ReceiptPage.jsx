import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Download, Share2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import { showToast } from '../utils/toast'

export default function ReceiptPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const receiptRef = useRef()
  const [saving, setSaving] = useState(false)

  const job = useLiveQuery(async () => {
    const r = await db.service_jobs.get(Number(id))
    return r?.deletedAt ? null : r
  }, [id])
  const customer = useLiveQuery(
    () => job?.customerId ? db.customers.get(job.customerId) : undefined,
    [job?.customerId]
  )

  if (!job) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  const settings = loadSettings()
  // 13종 비용 항목 (BillingPage와 동일 순서)
  // discount는 음수로 합산, taxAmount는 자동 계산 결과를 그대로 합산
  const COST_FIELDS = [
    { key: 'generalRevenue',  label: t('billing.generalRevenue'),  sign: 1 },
    { key: 'diagnosisFee',    label: t('billing.diagnosisFee'),    sign: 1 },
    { key: 'emergencyFee',    label: t('billing.emergencyFee'),    sign: 1 },
    { key: 'maintenanceFee',  label: t('billing.maintenanceFee'),  sign: 1 },
    { key: 'demolitionFee',   label: t('billing.demolitionFee'),   sign: 1 },
    { key: 'rentalFee',       label: t('billing.rentalFee'),       sign: 1 },
    { key: 'deliveryFee',     label: t('billing.deliveryFee'),     sign: 1 },
    { key: 'partsCost',       label: t('billing.partsCost'),       sign: 1 },
    { key: 'laborCost',       label: t('billing.laborCost'),       sign: 1 },
    { key: 'travelCost',      label: t('billing.travelCost'),      sign: 1 },
    { key: 'discount',        label: t('billing.discount'),        sign: -1 },
    { key: 'taxAmount',       label: t('billing.taxAmount'),       sign: 1 },
    { key: 'otherCost',       label: t('billing.otherCost'),       sign: 1 },
  ]
  const totalCost = COST_FIELDS.reduce((sum, f) => sum + (Number(job[f.key]) || 0) * f.sign, 0)
  const today = new Date().toLocaleDateString(i18n.language, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const receiptNo = `R-${job.id}-${Date.now().toString().slice(-4)}`

  async function capture() {
    setSaving(true)
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const dataUrl = canvas.toDataURL('image/png')

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `receipt_${customer?.name ?? id}.png`, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: t('receipt.title') })
          return
        }
      }

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `receipt_${customer?.name ?? id}.png`
      a.click()
    } catch (e) {
      showToast(t('receipt.errSave') + e.message)
    } finally {
      setSaving(false)
    }
  }

  // 다운로드 전용 (공유 API 우회)
  async function downloadOnly() {
    if (saving) return
    setSaving(true)
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `receipt_${customer?.name ?? id}.png`
      a.click()
    } catch (e) {
      showToast(t('receipt.errSave') + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('receipt.backToList')}
      </button>

      {/* 영수증 본체 */}
      <div
        ref={receiptRef}
        className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden"
        style={{ fontFamily: 'sans-serif' }}
      >
        {/* 헤더 */}
        <div className="bg-gray-900 text-white px-5 py-4 text-center">
          <p className="text-lg font-bold tracking-widest">{t('receipt.title')}</p>
          <p className="text-xs text-gray-300 mt-0.5">{t('receipt.subtitle')}</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 영수증 번호 / 발행일 */}
          <div className="flex justify-between text-xs text-gray-500 border-b border-gray-100 pb-3">
            <span>{t('receipt.receiptNo')}: <span className="text-gray-700 font-medium">{receiptNo}</span></span>
            <span>{t('receipt.issuedDate')}: <span className="text-gray-700 font-medium">{today}</span></span>
          </div>

          {/* 발행자 정보 */}
          {(settings.bizName || settings.bizOwner || settings.bizPhone) && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('receipt.sectionIssuer')}</p>
              <table className="w-full text-sm">
                <tbody>
                  {settings.bizName    && <BizRow label={t('settings.bizName')}    value={settings.bizName} />}
                  {settings.bizOwner   && <BizRow label={t('settings.bizOwner')}   value={settings.bizOwner} />}
                  {settings.bizPhone   && <BizRow label={t('settings.bizPhone')}   value={settings.bizPhone} />}
                  {settings.bizAddress && <BizRow label={t('settings.bizAddress')} value={settings.bizAddress} />}
                  {settings.bizRegNo   && <BizRow label={t('settings.bizRegNo')}   value={settings.bizRegNo} />}
                </tbody>
              </table>
            </div>
          )}

          <hr className="border-dashed border-gray-200" />

          {/* 고객 정보 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('receipt.sectionCustomer')}</p>
            <table className="w-full text-sm">
              <tbody>
                <BizRow label={t('receipt.fieldName')}    value={customer?.name ?? '-'} />
                {customer?.phone   && <BizRow label={t('receipt.fieldPhone')}   value={customer.phone} />}
                {customer?.address && <BizRow label={t('receipt.fieldAddress')} value={customer.address} />}
              </tbody>
            </table>
          </div>

          <hr className="border-dashed border-gray-200" />

          {/* 수리 내역 */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('receipt.sectionRepair')}</p>
            <table className="w-full text-sm">
              <tbody>
                {(job.symptoms ?? job.symptom)   && <BizRow label={t('receipt.fieldSymptom')}    value={job.symptoms ?? job.symptom} />}
                {(job.cause    ?? job.diagnosis) && <BizRow label={t('receipt.fieldDiagnosis')}  value={job.cause    ?? job.diagnosis} />}
                {(job.solution ?? job.workDone)  && <BizRow label={t('receipt.fieldWorkDone')}   value={job.solution ?? job.workDone} />}
                {(job.parts    ?? job.materials) && <BizRow label={t('receipt.fieldMaterials')}  value={job.parts    ?? job.materials} />}
                {job.receiptDate && <BizRow label={t('receipt.fieldReceiptDate')}  value={job.receiptDate} />}
                {job.visitDate   && <BizRow label={t('receipt.fieldVisitDate')}    value={job.visitDate} />}
              </tbody>
            </table>
          </div>

          {/* 금액 */}
          {totalCost > 0 && (
            <>
              <hr className="border-dashed border-gray-200" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('receipt.sectionCost')}</p>
                <div className="space-y-1 text-sm">
                  {COST_FIELDS.map(({ key, label, sign }) =>
                    job[key] > 0 ? (
                      <div key={key} className="flex justify-between text-gray-600">
                        <span>{label}</span>
                        <span>{sign < 0 ? '-' : ''}{Number(job[key]).toLocaleString()} {t('common.currencyUnit')}</span>
                      </div>
                    ) : null
                  )}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2 mt-1">
                    <span>{t('receipt.total')}</span>
                    <span>{totalCost.toLocaleString()} {t('common.currencyUnit')}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 청구 문구 */}
          <div className="text-center py-3 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-800">{t('receipt.closing')}</p>
          </div>
        </div>
      </div>

      {/* 공유 + 저장 버튼 분리 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {navigator.share && (
          <button
            onClick={capture}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl shadow-md ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 active:bg-blue-700'}`}
          >
            <Share2 size={16} strokeWidth={2} />
            {saving ? t('receipt.saving') : t('receipt.share')}
          </button>
        )}
        <button
          onClick={downloadOnly}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl shadow-md ${navigator.share ? '' : 'col-span-2'} ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 active:bg-emerald-700'}`}
        >
          <Download size={16} strokeWidth={2} />
          {saving ? t('receipt.saving') : t('receipt.download')}
        </button>
      </div>
    </div>
  )
}

function BizRow({ label, value }) {
  return (
    <tr>
      <td className="text-gray-400 pr-3 py-0.5 whitespace-nowrap w-24">{label}</td>
      <td className="text-gray-800">{value}</td>
    </tr>
  )
}
