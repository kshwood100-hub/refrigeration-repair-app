import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { REFRIGERATION_BASICS } from '../data/refrigerationTypes'

export default function RefrigerationBasicsPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)

  return (
    <div className="p-4 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        뒤로
      </button>
      <h2 className="text-base font-semibold text-gray-900 mb-5">냉동 기초 지식</h2>

      <p className="text-xs text-gray-400 mb-4">현장에서 꼭 알아야 할 냉동기 기본 개념 정리</p>

      <div className="space-y-2">
        {REFRIGERATION_BASICS.map((item) => (
          <div key={item.id} className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === item.id ? null : item.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
            >
              <span className="text-xl w-7 text-center">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-800">{item.title}</span>
              <ChevronDown
                size={15} strokeWidth={1.5}
                className={`text-gray-400 transition-transform shrink-0 ${open === item.id ? 'rotate-180' : ''}`}
              />
            </button>
            {open === item.id && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
