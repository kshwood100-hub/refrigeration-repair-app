import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { db } from '../db'
import { showToast } from '../utils/toast'
import KnowhowFormBody, { EMPTY_KNOWHOW } from '../components/KnowhowFormBody'

export default function KnowhowFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { t } = useTranslation()
  const isNew = !id || id === 'new'

  const existing = useLiveQuery(
    () => !isNew ? db.knowhow.get(Number(id)) : undefined, [id]
  )

  const [form, setForm] = useState(EMPTY_KNOWHOW)
  const [initialized, setInitialized] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  // 음성 메모에서 진입 — 거래처/본문 미리 채우기
  useEffect(() => {
    if (!isNew) return
    const st = location.state
    if (!st) return
    setForm((p) => ({
      ...p,
      customerId: st.customerId ?? p.customerId,
      notes: st.prefilledNotes ? (p.notes ? `${p.notes}\n\n${st.prefilledNotes}` : st.prefilledNotes) : p.notes,
    }))
  }, [isNew, location.state])

  if (!isNew && existing && !initialized) {
    setForm({
      customerId:     existing.customerId     ?? null,
      title:          existing.title          ?? '',
      category:       existing.category       ?? '기타',
      location:       existing.location       ?? '기타',
      compressorType: existing.compressorType ?? '',
      compressorStr:  existing.compressorStr  ?? '',
      coolingMethod:  existing.coolingMethod  ?? '',
      tempRange:      existing.tempRange      ?? '',
      refrigerant:    existing.refrigerant    ?? '',
      systemType:     existing.systemType     ?? '',
      symptoms:       existing.symptoms       ?? '',
      cause:          existing.cause          ?? '',
      checkSteps:     existing.checkSteps     ?? '',
      solution:       existing.solution       ?? '',
      parts:          existing.parts          ?? '',
      notes:          existing.notes          ?? '',
    })
    setInitialized(true)
  }

  async function handleSave() {
    if (!form.customerId) { showToast(t('knowhow.errCustomer')); return }
    if (!form.title.trim()) { showToast(t('knowhow.errTitle')); return }
    const now = new Date().toISOString()
    try {
      if (isNew) {
        await db.knowhow.add({ ...form, createdAt: now, updatedAt: now })
        navigate('/knowhow', { replace: true })
      } else {
        await db.knowhow.update(Number(id), { ...form, updatedAt: now })
        navigate(`/knowhow/${id}`, { replace: true })
      }
    } catch (e) {
      showToast(t('knowhow.errSave') + e.message)
    }
  }

  async function handleDelete() {
    await db.knowhow.delete(Number(id))
    navigate('/knowhow', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">{t('knowhow.back')}</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900">{isNew ? t('knowhow.newTitle') : t('knowhow.editTitle')}</h2>
        <button onClick={handleSave} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg">
          {t('knowhow.save')}
        </button>
      </div>

      <KnowhowFormBody form={form} setForm={setForm} />

      <div className="mt-4 space-y-4">
        {/* 저장 버튼 (하단) */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-slate-700 text-white text-base font-semibold rounded-xl border-2 border-slate-400 shadow-md active:bg-slate-600"
        >
          {t('knowhow.save')}
        </button>

        {/* 삭제 */}
        {!isNew && (
          <div className="pt-2">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 font-medium border border-red-100 rounded-xl"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                {t('knowhow.deleteBtn')}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-red-600 mb-3">{t('knowhow.deleteConfirm')}</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDelete(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-600">{t('knowhow.cancel')}</button>
                  <button onClick={handleDelete} className="flex-1 py-2 text-sm font-medium bg-red-500 text-white rounded-lg">{t('knowhow.delete')}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
