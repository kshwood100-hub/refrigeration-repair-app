import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Calendar, Trash2 } from 'lucide-react'
import { db } from '../db'

export default function ExpensePage() {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(null)

  const expenses = useLiveQuery(
    () => db.expenses.orderBy('date').reverse().toArray(), []
  )
  const jobs = useLiveQuery(() => db.service_jobs.toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  if (!expenses || !jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>
  }

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]))
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))

  async function handleDelete(id) {
    await db.expenses.delete(id)
    setDeleting(null)
  }

  return (
    <div className="p-4 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">경비 내역</h2>
        <button
          onClick={() => navigate('/expenses/new')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
        >
          <Plus size={13} strokeWidth={2} />
          새 경비
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-sm">경비 내역이 없습니다</div>
          <button
            onClick={() => navigate('/expenses/new')}
            className="mt-3 text-xs text-blue-600 font-medium"
          >
            첫 경비 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => {
            const job = jobMap[exp.jobId]
            const customer = job ? customerMap[job.customerId] : null
            const total = (exp.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
            return (
              <button
                key={exp.id}
                onClick={() => navigate(`/expenses/${exp.id}`)}
                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left active:bg-gray-50 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {exp.title || customer?.name || '제목 없음'}
                      </span>
                    </div>
                    {customer && (
                      <p className="text-xs text-gray-400 mb-1">수리의뢰: {customer.name}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.5} />
                        {exp.date}
                      </span>
                      <span className="ml-auto font-semibold text-gray-700">
                        {total.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">경비 내역을 삭제하시겠습니까?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600">
                취소
              </button>
              <button onClick={() => handleDelete(deleting)}
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
