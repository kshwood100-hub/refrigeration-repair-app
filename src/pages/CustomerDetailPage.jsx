import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Phone, MapPin, Plus, ChevronRight,
  Calendar, CreditCard, Trash2,
} from 'lucide-react'
import { db } from '../db'

const STATUS = {
  received:   { text: '접수',    dot: 'bg-gray-400' },
  scheduled:  { text: '방문예약', dot: 'bg-blue-500' },
  inprogress: { text: '진행중',  dot: 'bg-amber-500' },
  completed:  { text: '완료',    dot: 'bg-emerald-500' },
}

export default function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showDelete, setShowDelete] = useState(false)

  const customer = useLiveQuery(() => db.customers.get(Number(id)), [id])
  const jobs = useLiveQuery(
    () => db.service_jobs.where('customerId').equals(Number(id)).reverse().sortBy('receiptDate'),
    [id]
  )
  const cards = useLiveQuery(
    () => db.business_cards.where('customerId').equals(Number(id)).toArray(),
    [id]
  )

  if (!customer) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  const totalRevenue = (jobs ?? [])
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + (j.cost || 0), 0)

  async function handleDeleteCustomer() {
    await db.service_jobs.where('customerId').equals(Number(id)).delete()
    await db.business_cards.where('customerId').equals(Number(id)).delete()
    await db.customers.delete(Number(id))
    navigate(-1)
  }

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">뒤로</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 text-gray-400"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate('/service/new', { state: { customerId: Number(id) } })}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
          >
            <Plus size={13} strokeWidth={2} />
            새 의뢰
          </button>
        </div>
      </div>

      <div className="space-y-3">

        {/* 고객 정보 카드 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-lg font-bold text-gray-900 mb-1">{customer.name}</p>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium mb-1"
            >
              <Phone size={13} strokeWidth={1.5} />
              {customer.phone}
            </a>
          )}
          {customer.address && (
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <MapPin size={11} strokeWidth={1.5} />
              {customer.address}
            </p>
          )}
          {totalRevenue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">완료 수리 매출 합계</span>
              <span className="text-sm font-semibold text-gray-800">{totalRevenue.toLocaleString()}원</span>
            </div>
          )}
        </div>

        {/* 명함 */}
        {cards && cards.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">명함</p>
            <div className="space-y-2">
              {cards.map((card) => (
                <div key={card.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex gap-3 items-start">
                  {card.dataUrl ? (
                    <img
                      src={card.dataUrl}
                      alt="명함"
                      className="w-20 h-12 object-cover rounded-lg border border-gray-100 shrink-0 bg-gray-50"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                      <CreditCard size={18} strokeWidth={1} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-xs text-gray-500 space-y-0.5">
                    {card.company && <p className="font-medium text-gray-700">{card.company}</p>}
                    {card.title && <p>{card.title}</p>}
                    {card.email && <p className="text-gray-400">{card.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 수리 이력 */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">수리 이력</p>
            <span className="text-xs text-gray-400">{(jobs ?? []).length}건</span>
          </div>
          {(!jobs || jobs.length === 0) ? (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm">
              <p className="text-xs text-gray-400">수리 이력이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const st = STATUS[job.status] ?? STATUS.received
                return (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/service/${job.id}`)}
                    className="w-full bg-white border border-gray-100 rounded-xl p-3.5 text-left shadow-sm active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-1 font-medium">
                          {job.symptom || '증상 미입력'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} strokeWidth={1.5} />
                            {job.receiptDate}
                          </span>
                          {job.cost > 0 && (
                            <span className="font-medium text-gray-600">
                              {Number(job.cost).toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className="text-xs text-gray-500">{st.text}</span>
                        <ChevronRight size={13} strokeWidth={1.5} className="text-gray-300 ml-0.5" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* 삭제 확인 모달 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">고객을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-400 mb-5">수리 이력과 명함이 모두 삭제됩니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
