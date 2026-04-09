import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { db } from '../db'

export default function ExpenseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [deleting, setDeleting] = useState(false)

  const expense = useLiveQuery(() => db.expenses.get(Number(id)), [id])
  const jobs = useLiveQuery(() => db.service_jobs.toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  if (!expense || !jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>
  }

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]))
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))
  const job = jobMap[expense.jobId]
  const customer = job ? customerMap[job.customerId] : null
  const total = (expense.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)

  async function handleDelete() {
    await db.expenses.delete(Number(id))
    navigate('/expenses')
  }

  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/expenses')} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">경비 상세</h2>
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
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          {expense.title && (
            <p className="font-semibold text-gray-900">{expense.title}</p>
          )}
          <p className="text-sm text-gray-500">{expense.date}</p>
          {customer && (
            <p className="text-sm text-gray-500">수리의뢰: {customer.name} ({job.receiptDate})</p>
          )}
        </div>

        {/* 경비 항목 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">경비 항목</p>
          <div className="space-y-2">
            {(expense.items ?? []).map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.category}</span>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800 shrink-0">
                  {Number(item.amount).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">합계</span>
            <span className="text-xl font-bold text-gray-900">{total.toLocaleString()}원</span>
          </div>
        </div>

        {/* 메모 */}
        {expense.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">메모</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}

      </div>

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">경비 내역을 삭제하시겠습니까?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleting(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600">
                취소
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
