import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Share2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { firestore } from '../firebase'
import { loadSettings, saveSettings } from '../utils/settings'

// 결제 직후 1회 노출 — Firestore allowed_users.shareModalShown 플래그로 제어.
// webhook이 가입 시 shareModalShown:false로 설정 → 사용자 동의/거부 시 true로 마킹.
export default function ShareConsentModal() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user?.email) return
    let cancelled = false
    ;(async () => {
      try {
        const ref = doc(firestore, 'allowed_users', user.email)
        const snap = await getDoc(ref)
        if (cancelled) return
        if (!snap.exists()) return
        const data = snap.data() || {}
        // shareModalShown이 false면 표시. (필드 자체가 없으면 폴백 4개 계정이라 무시.)
        if (data.shareModalShown === false) setOpen(true)
      } catch (e) {
        console.warn('Share modal check failed:', e?.message)
      }
    })()
    return () => { cancelled = true }
  }, [user?.email])

  async function markShown(consent) {
    saveSettings({ shareConsent: consent })
    if (!user?.email) { setOpen(false); return }
    try {
      const ref = doc(firestore, 'allowed_users', user.email)
      await updateDoc(ref, { shareModalShown: true, shareConsent: consent })
    } catch (e) {
      console.warn('Share modal save failed:', e?.message)
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={20} strokeWidth={2} className="text-blue-500 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900">{t('shareModal.title')}</h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-3">{t('shareModal.body')}</p>
        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 leading-relaxed font-medium">
          {t('shareModal.discount')}
        </p>
        <p className="text-[10px] text-gray-500 mb-4">{t('shareModal.later')}</p>

        <div className="flex gap-2">
          <button
            onClick={() => markShown(false)}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:bg-gray-200"
          >
            {t('shareModal.decline')}
          </button>
          <button
            onClick={() => markShown(true)}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl active:bg-blue-700"
          >
            {t('shareModal.agree')}
          </button>
        </div>
      </div>
    </div>
  )
}
