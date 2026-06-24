import { useState } from 'react'
import { money } from '../utils/money'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { db } from '../db'
import { softDelete } from '../utils/cloudSync'

const ITEM_CAT_KEYS = {
  '출장비': 'expense.itemTravel', '자재비': 'expense.itemMaterial', '시간인건비': 'expense.itemLabor',
  '식대': 'expense.itemMeal', '숙박비': 'expense.itemLodging', '시간외수당': 'expense.itemOvertime',
  '기타': 'expense.itemOther',
}

export default function ExpenseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState(false)

  const expense = useLiveQuery(async () => {
    const r = await db.expenses.get(Number(id))
    return r?.deletedAt ? null : r
  }, [id])
  const jobs = useLiveQuery(() => db.service_jobs.filter((r) => !r.deletedAt).toArray(), [])
  const customers = useLiveQuery(() => db.customers.filter((r) => !r.deletedAt).toArray(), [])

  if (!expense || !jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">{t('expense.loading')}</div>
  }

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]))
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))
  const job = jobMap[expense.jobId]
  const customer = customerMap[expense.customerId] ?? (job ? customerMap[job.customerId] : null)
  const total = (expense.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)

  async function handleDelete() {
    await softDelete('expenses', Number(id))
    navigate('/finance', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('expense.backToList')}
      </button>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">{t('expense.detailTitle')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/expenses/${id}/edit`)} className="p-1.5 text-gray-500">
            <Pencil size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => setDeleting(true)} className="p-1.5 text-red-400">
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="space-y-3">

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-2">
          {expense.title && (
            <p className="font-semibold text-gray-900">{expense.title}</p>
          )}
          <p className="text-sm text-gray-500">{expense.date}</p>
          {customer && (
            <p className="text-sm text-gray-500">
              {job
                ? t('expense.linkedJobDate', { name: customer.name, date: job.receiptDate })
                : t('expense.linkedCustomer', { name: customer.name })}
            </p>
          )}
        </div>

        {/* 경비 항목 */}
        <div className="bg-white rounded-xl border border-gray-300 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">{t('expense.itemsLabel')}</p>
          <div className="space-y-2">
            {(expense.items ?? []).map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{t(ITEM_CAT_KEYS[item.category] ?? item.category)}</span>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800 shrink-0">
                  {money(Number(item.amount))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">{t('expense.total')}</span>
            <span className="text-xl font-bold text-gray-900">{money(total)}</span>
          </div>
        </div>

        {/* 메모 */}
        {expense.notes && (
          <div className="bg-white rounded-xl border border-gray-300 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">{t('expense.memo')}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}

        {/* 영수증 사진 */}
        {expense.photos?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-300 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">{t('expense.receipt')}</p>
            <div className="flex gap-2 flex-wrap">
              {expense.photos.map((dataUrl, i) => (
                <img key={i} src={dataUrl} alt="" className="w-24 h-24 object-cover rounded-xl" />
              ))}
            </div>
          </div>
        )}

      </div>

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('expense.deleteConfirm')}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleting(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600">
                {t('expense.cancel')}
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl">
                {t('expense.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
