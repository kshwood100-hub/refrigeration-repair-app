import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Check, X, Loader, Shield } from 'lucide-react'
import { auth, firestore } from '../firebase'
import { collectionGroup, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { showToast } from '../utils/toast'

// 운영자 전용 검수 페이지 — form 본인 email만 접근 가능
// Firestore Rules가 form email만 read 허용 (다른 사용자는 권한 X)
const ADMIN_EMAIL = 'kshwood100@gmail.com'

export default function AdminCurationPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [actioning, setActioning] = useState(false)

  const currentEmail = auth.currentUser?.email
  const isAdmin = currentEmail === ADMIN_EMAIL

  async function loadQueue() {
    if (!isAdmin) return
    setLoading(true)
    try {
      const q = query(
        collectionGroup(firestore, 'community_cases'),
        where('status', '==', 'pending_review')
      )
      const snap = await getDocs(q)
      const rows = []
      snap.forEach((d) => {
        rows.push({ ...d.data(), _docPath: d.ref.path, _docId: d.id })
      })
      // 최신 순
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setItems(rows)
    } catch (e) {
      showToast(t('admin.loadFailed') + ': ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQueue() }, [])

  async function handleAction(item, status) {
    if (actioning) return
    setActioning(true)
    try {
      const ref = doc(firestore, item._docPath)
      await updateDoc(ref, {
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentEmail,
        _serverReviewedAt: serverTimestamp(),
      })
      showToast(status === 'approved' ? t('admin.approved') : t('admin.rejected'))
      setSelected(null)
      // 큐 갱신
      setItems((prev) => prev.filter((it) => it._docPath !== item._docPath))
    } catch (e) {
      showToast(t('admin.actionFailed') + ': ' + e.message)
    } finally {
      setActioning(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <Shield size={48} className="mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-500">{t('admin.noAccess')}</p>
        <button onClick={() => navigate('/home')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          {t('common.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate('/home')}
        className="flex items-center justify-center gap-2 w-full py-3 mb-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Shield size={20} strokeWidth={2} className="text-purple-700" />
        <h1 className="text-lg font-bold text-gray-900">{t('admin.title')}</h1>
        <span className="ml-auto text-xs text-gray-500">{items.length}{t('aiList.unit')}</span>
      </div>

      <div className="bg-purple-700 text-white text-xs leading-snug rounded-lg px-3 py-2.5 mb-3 shadow-md">
        🛡️ {t('admin.intro')}
      </div>

      <button
        onClick={loadQueue}
        disabled={loading}
        className="w-full py-2.5 mb-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-blue-700 disabled:opacity-50"
      >
        {loading ? <Loader size={14} className="inline animate-spin" /> : t('admin.refresh')}
      </button>

      {items.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500">{t('admin.empty')}</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => (
          <button
            key={it._docPath}
            onClick={() => setSelected(it)}
            className="w-full bg-white border-2 border-gray-300 rounded-xl p-3 shadow-sm text-left active:bg-gray-50"
          >
            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{it.userText}</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span>{it.language?.toUpperCase()}</span>
              <span>•</span>
              <span>{it.createdAt ? new Date(it.createdAt).toLocaleString(i18n.language) : ''}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 상세 + 액션 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{t('admin.detailTitle')}</p>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center text-gray-400">
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{t('admin.userTextLabel')}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.userText}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{t('admin.resultLabel')}</p>
                <pre className="bg-white border-2 border-gray-300 rounded-lg p-3 text-sm text-gray-900 whitespace-pre-wrap break-words font-sans leading-relaxed">
                  {selected.rawResponse}
                </pre>
              </div>

              {selected.userMemo && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{t('admin.memoLabel')}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-900 whitespace-pre-wrap">
                    {selected.userMemo}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handleAction(selected, 'approved')}
                  disabled={actioning}
                  className="py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={16} strokeWidth={2} />
                  {t('admin.approve')}
                </button>
                <button
                  onClick={() => handleAction(selected, 'rejected')}
                  disabled={actioning}
                  className="py-3 bg-red-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X size={16} strokeWidth={2} />
                  {t('admin.reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
