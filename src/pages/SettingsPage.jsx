import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UNITS } from '../data/refrigerantsData'
import { loadSettings, saveSettings } from '../utils/settings'
import { createBackup, listBackups, downloadBackup, restoreBackup, formatSize, importAllData } from '../utils/backup'
import { Download, RotateCcw, Upload, QrCode, ScanLine, Lock, CreditCard, CheckCircle2, LogOut, RefreshCw } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { firestore } from '../firebase'
import { apiFetch } from '../utils/apiClient'
import { useAuth } from '../hooks/useAuth'
import QRExportModal from '../components/QRExportModal'
import QRImportModal from '../components/QRImportModal'
import { useTranslation } from 'react-i18next'
import { showToast } from '../utils/toast'
import ConfirmModal from '../components/ConfirmModal'
import { getCheckoutUrl } from '../utils/checkout'
import { getTrialStatus } from '../utils/trial'
import { db } from '../db'
import { SYNC_COLLECTIONS, safeSyncAll, syncAll } from '../utils/cloudSync'

const LANGUAGES = [
  { code: 'en', short: 'EN', label: 'ENGLISH' },
  { code: 'zh', short: 'CN', label: '中文'    },
  { code: 'es', short: 'ES', label: 'ESPAÑOL' },
  { code: 'hi', short: 'IN', label: 'हिन्दी' },
  { code: 'ja', short: 'JP', label: '日本語'  },
  { code: 'ko', short: 'KR', label: '한국어'  },
  { code: 'vi', short: 'VN', label: 'Tiếng Việt' },
  { code: 'th', short: 'TH', label: 'ไทย'      },
  { code: 'id', short: 'ID', label: 'Indonesia' },
  { code: 'ar', short: 'AR', label: 'العربية'  },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState(loadSettings)
  const [backups, setBackups] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const importRef = useRef()
  const [qrExportOpen, setQrExportOpen] = useState(false)
  const [qrImportOpen, setQrImportOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [trialState, setTrialState] = useState(null)
  const [showManageInfo, setShowManageInfo] = useState(false)
  const [bizLocked, setBizLocked] = useState(() => {
    const s = loadSettings()
    return !!(s.bizName || s.bizOwner || s.bizPhone || s.bizAddress || s.bizRegNo)
  })
  const [taxLocked, setTaxLocked] = useState(() => {
    const s = loadSettings()
    return Number(s.taxRate) > 0
  })

  const [syncStatus, setSyncStatus] = useState(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [forceSyncing, setForceSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState(null)

  useEffect(() => {
    // force=true — 결제 직후 진입하는 경우 캐시 무시하고 fresh 조회
    getTrialStatus(true).then(setTrialState).catch(() => {})
  }, [])

  // 동기화 상태 진단 — 컬렉션별 IDB row count + _synced=false 박힌 row 수 + lastPull/lastPush 시점
  // 출시 의무 도구 — 일회용 디버그 X. 결함 신고 시 사용자 1번 클릭으로 진단
  async function loadSyncStatus() {
    setSyncLoading(true)
    try {
      const rows = []
      for (const c of SYNC_COLLECTIONS) {
        const all = await db.table(c).toArray()
        const active = all.filter((r) => !r.deletedAt)
        const tombstone = all.length - active.length
        const pending = all.filter((r) => r._synced === false).length
        const pushState = await db.sync_state.get(`lastPush:${c}`)
        const pullState = await db.sync_state.get(`lastPull:${c}`)
        rows.push({
          name: c,
          total: all.length,
          active: active.length,
          tombstone,
          pending,
          lastPushAt: pushState?.value || 0,
          lastPullAt: pullState?.value || 0,
        })
      }
      setSyncStatus({ rows, fetchedAt: Date.now() })
    } catch (e) {
      showToast(e?.message || 'Load failed')
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleForceSync() {
    setForceSyncing(true)
    setSyncResults(null)
    try {
      // syncAll 직접 호출 — 컬렉션별 push/pull/error 결과 받음 (safeSyncAll은 결과 X)
      const out = await syncAll()
      setSyncResults({ ok: out.ok, results: out.results || {}, reason: out.reason || null, ranAt: Date.now() })
      await loadSyncStatus()
      if (out.ok) showToast(t('settings.sync.syncDone'))
      else showToast(`Sync skipped: ${out.reason || 'unknown'}`)
    } catch (e) {
      setSyncResults({ ok: false, error: e?.message || String(e), ranAt: Date.now() })
      showToast(e?.message || 'Sync failed')
    } finally {
      setForceSyncing(false)
    }
  }

  function formatTs(ms) {
    if (!ms) return t('settings.sync.never')
    const d = new Date(ms)
    return d.toLocaleString()
  }

  function update(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  function toggleShareConsent() {
    const next = !settings.shareConsent
    setConfirmMsg(next
      ? t('settings.shareConsentConfirmEnable')
      : t('settings.shareConsentConfirmDisable'))
    setConfirmAction(() => async () => {
      update({ shareConsent: next })
      if (!user?.email) return
      try {
        const ref = doc(firestore, 'allowed_users', user.email)
        await updateDoc(ref, { shareConsent: next })
      } catch (e) {
        console.warn('Share consent sync failed:', e?.message)
      }
      try {
        await apiFetch('/api/notify-share-consent', { enabled: next })
      } catch (e) {
        console.warn('Share consent notify failed:', e?.message)
      }
    })
  }

  async function openBackup() {
    const list = await listBackups()
    setBackups(list)
    setBackupOpen(true)
  }

  async function handleCreate() {
    setBackupLoading(true)
    try {
      await createBackup()
      const list = await listBackups()
      setBackups(list)
    } catch (e) {
      showToast(t('settings.errBackup') + e.message)
    } finally {
      setBackupLoading(false)
    }
  }

  const pendingImportFile = useRef(null)

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    pendingImportFile.current = file
    setConfirmMsg(t('settings.confirmImport'))
    setConfirmAction(() => async () => {
      try {
        await importAllData(pendingImportFile.current)
        showToast(t('settings.doneImport'))
      } catch (err) {
        showToast(t('settings.errImport') + err.message)
      }
    })
  }

  function handleRestore(b) {
    setConfirmMsg(`${b.createdAt.slice(0, 16)} ${t('settings.confirmRestore')}`)
    setConfirmAction(() => async () => {
      try {
        await restoreBackup(b)
        setBackupOpen(false)
        showToast(t('settings.doneRestore'))
      } catch (e) {
        showToast(t('settings.errRestore') + e.message)
      }
    })
  }

  return (
    <div className="p-4 pb-8">
      <h2 className="text-lg font-bold mb-5">{t('settings.title')}</h2>

      {/* 언어 선택 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('settings.language')}</div>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map(({ code, short, label }) => {
            const active = (LANGUAGES.find(l => i18n.language.startsWith(l.code))?.code ?? 'ko') === code
            return (
              <button
                key={code}
                onClick={() => { i18n.changeLanguage(code); localStorage.setItem('i18nextLng', code); localStorage.setItem('rfg_lang', code) }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 font-medium active:bg-gray-50'
                }`}
              >
                <span className="text-[11px] opacity-80">{short}</span>
                <span className="text-sm">{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 테마 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.theme')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          {[
            { val: 'dark',  label: t('settings.themeDark'),  desc: t('settings.themeDarkDesc') },
            { val: 'gray',  label: t('settings.themeGray'),  desc: t('settings.themeGrayDesc') },
          ].map(({ val, label, desc }, i) => (
            <button
              key={val}
              onClick={() => {
                update({ theme: val })
                document.documentElement.className = `theme-${val}`
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 text-xs">{label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                settings.theme === val ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {settings.theme === val && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 글자 크기 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.fontSize')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          {[
            { val: 'medium', label: t('settings.fontMedium'), desc: t('settings.fontMediumDesc') },
            { val: 'large',  label: t('settings.fontLarge'),  desc: t('settings.fontLargeDesc') },
          ].map(({ val, label, desc }, i) => (
            <button
              key={val}
              onClick={() => {
                update({ fontSize: val })
                const { theme } = settings
                const cls = [`theme-${theme}`]
                if (val !== 'medium') cls.push(`font-${val === 'large' ? 'large' : 'xlarge'}`)
                document.documentElement.className = cls.join(' ')
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 text-xs">{label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                (settings.fontSize ?? 'medium') === val ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {(settings.fontSize ?? 'medium') === val && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 압력 단위 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.pressureUnit')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          {Object.entries(UNITS).map(([key, u], i) => (
            <button
              key={key}
              onClick={() => update({ unitKey: key })}
              className={`w-full flex items-center justify-between px-3 py-2 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <span className="font-medium text-gray-800 text-xs">{u.label}</span>
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                settings.unitKey === key ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {settings.unitKey === key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 게이지 / 절대 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.pressureMode')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          {[
            { val: true,  label: t('settings.gauge'),    desc: t('settings.gaugeDesc') },
            { val: false, label: t('settings.absolute'), desc: t('settings.absoluteDesc') },
          ].map(({ val, label, desc }, i) => (
            <button
              key={String(val)}
              onClick={() => update({ isGauge: val })}
              className={`w-full flex items-center gap-2 px-3 py-2 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 text-xs">{label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                settings.isGauge === val ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {settings.isGauge === val && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>


      {/* 구독 (FastSpring) */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <CreditCard size={11} strokeWidth={2} className="text-blue-500" />
          <span>{t('subscription.title')}</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="px-3 py-2.5">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{t('subscription.priceLine')}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{t('subscription.trialLine')}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-1">{t('subscription.shareLine')}</p>
                {trialState?.trial && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
                    {t('subscription.trialStatus')}
                    {trialState.remaining && Object.entries(trialState.remaining).map(([cat, n]) => (
                      <span key={cat} className="ml-1">· {t(`trial.cat.${cat}`)}: {n}/{trialState.limits[cat]}</span>
                    ))}
                  </p>
                )}
                {trialState && trialState.trial === false && (
                  <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={11} />{t('subscription.activeStatus')}
                  </p>
                )}
              </div>
            </div>
            {trialState?.trial === false ? (
              trialState?.manageUrl ? (
                <a
                  href={trialState.manageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2.5 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg active:bg-blue-800"
                >
                  {t('subscription.manageBtn')}
                </a>
              ) : (
                <button
                  onClick={() => setShowManageInfo(true)}
                  className="block w-full mt-2.5 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg active:bg-blue-800"
                >
                  {t('subscription.manageBtn')}
                </button>
              )
            ) : (
              <a
                href={getCheckoutUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2.5 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg active:bg-blue-800"
              >
                {t('subscription.subscribeBtn')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 사용자 정보 (영수증 발행) */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('settings.bizSection')}</div>
          <button
            type="button"
            onClick={() => setBizLocked(prev => !prev)}
            className={`px-3 py-1 text-xs font-semibold rounded-md text-white shadow-md ${bizLocked ? 'bg-emerald-600' : 'bg-blue-600'}`}
          >
            {bizLocked ? t('settings.bizEdit') : t('settings.bizSave')}
          </button>
        </div>
        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 space-y-2">
          {[
            { key: 'bizName',    label: t('settings.bizName'),    ph: t('settings.bizNamePh') },
            { key: 'bizOwner',   label: t('settings.bizOwner'),   ph: t('settings.bizOwnerPh') },
            { key: 'bizPhone',   label: t('settings.bizPhone'),   ph: t('settings.bizPhonePh') },
            { key: 'bizAddress', label: t('settings.bizAddress'), ph: t('settings.bizAddressPh') },
            { key: 'bizRegNo',   label: t('settings.bizRegNo'),   ph: t('settings.bizRegNoPh') },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="text-[11px] font-medium text-gray-500 block mb-0.5">{label}</label>
              <input
                type="text"
                value={settings[key] ?? ''}
                onChange={(e) => update({ [key]: e.target.value })}
                placeholder={ph}
                disabled={bizLocked}
                className={`w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 outline-none ${bizLocked ? 'opacity-50 cursor-default' : 'text-gray-800 focus:border-blue-400'}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 세율 (매출 등록 시 세금 자동 계산용) */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('settings.taxSection')}</div>
          <button
            type="button"
            onClick={() => setTaxLocked(prev => !prev)}
            className={`px-3 py-1 text-xs font-semibold rounded-md text-white shadow-md ${taxLocked ? 'bg-emerald-600' : 'bg-blue-600'}`}
          >
            {taxLocked ? t('settings.taxEdit') : t('settings.taxApply')}
          </button>
        </div>
        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2.5">
          <label className="text-[11px] font-medium text-gray-500 block mb-0.5">{t('settings.taxRate')}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.1"
              value={settings.taxRate || ''}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  update({ taxRate: 0 })
                } else {
                  const n = Number(v)
                  if (!isNaN(n) && n >= 0 && n <= 100) update({ taxRate: n })
                }
              }}
              placeholder="0"
              disabled={taxLocked}
              className={`flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 outline-none ${taxLocked ? 'opacity-50 cursor-default text-gray-500' : 'text-gray-800 focus:border-blue-400'}`}
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{t('settings.taxRateDesc')}</p>
        </div>
      </section>

      {/* 설비기록 공유 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {t('settings.shareSection')}
        </div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-xs">{t('settings.shareToggle')}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{t('settings.shareDesc')}</p>
                <p className="text-[11px] text-blue-600 font-medium mt-1">{t('settings.shareDiscount')}</p>
                <p className="text-[10px] text-amber-700 mt-1">{t('settings.shareApplyNote')}</p>
              </div>
              <button
                type="button"
                onClick={toggleShareConsent}
                aria-pressed={!!settings.shareConsent}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${settings.shareConsent ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.shareConsent ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-50 text-[10px] text-gray-500 leading-relaxed space-y-0.5">
            <div><span className="font-semibold text-gray-700">{t('settings.shareWhat')}:</span> {t('settings.shareWhatDesc')}</div>
            <div><span className="font-semibold text-gray-700">{t('settings.shareWhy')}:</span> {t('settings.shareWhyDesc')}</div>
            <div><span className="font-semibold text-gray-700">{t('settings.shareKeep')}:</span> {t('settings.shareKeepDesc')}</div>
            <div><span className="font-semibold text-gray-700">{t('settings.shareWithdraw')}:</span> {t('settings.shareWithdrawDesc')}</div>
          </div>
        </div>
      </section>

      {/* 앱 업데이트 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.update')}</div>
        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2.5">
          <p className="text-[11px] text-gray-400 mb-2">{t('settings.updateDesc')}</p>
          <button
            onClick={async () => {
              const overlay = document.createElement('div')
              overlay.style.cssText = 'height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;color:white;font-family:sans-serif;gap:12px'
              const img = document.createElement('img')
              img.src = '/logo-transparent.png'
              img.style.cssText = 'width:72px;height:72px'
              const title = document.createElement('div')
              title.style.cssText = 'font-size:18px;font-weight:700'
              title.textContent = 'R-Pro'
              const msg = document.createElement('div')
              msg.style.cssText = 'font-size:13px;color:#94a3b8'
              msg.textContent = t('settings.updating')
              overlay.append(img, title, msg)
              document.body.replaceChildren(overlay)
              try {
                const keys = await caches.keys()
                await Promise.all(keys.map(k => caches.delete(k)))
                const regs = await navigator.serviceWorker.getRegistrations()
                await Promise.all(regs.map(r => r.unregister()))
              } catch {}
              setTimeout(() => { window.location.href = '/' }, 600)
            }}
            className="w-full py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg active:bg-emerald-700"
          >
            {t('settings.updateBtn')}
          </button>
        </div>
      </section>

      {/* 데이터 내보내기 / 가져오기 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.dataTransfer')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-100">
          <button
            onClick={() => setQrExportOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs active:bg-gray-50"
          >
            <QrCode size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 text-xs">{t('settings.qrExport')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('settings.qrExportDesc')}</p>
            </div>
          </button>
          <button
            onClick={() => setQrImportOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs active:bg-gray-50"
          >
            <ScanLine size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 text-xs">{t('settings.qrImport')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('settings.qrImportDesc')}</p>
            </div>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs active:bg-gray-50"
          >
            <Upload size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800 text-xs">{t('settings.fileImport')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('settings.fileImportDesc')}</p>
            </div>
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <p className="text-[11px] text-amber-600 mt-1.5 px-1">{t('settings.voiceExcludedNote')}</p>
      </section>

      {qrExportOpen && <QRExportModal onClose={() => setQrExportOpen(false)} />}
      {qrImportOpen && (
        <QRImportModal
          onClose={() => setQrImportOpen(false)}
          onDone={() => setQrImportOpen(false)}
        />
      )}

      {/* 데이터 백업 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.backup')}</div>
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={openBackup}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs active:bg-gray-50"
          >
            <span className="font-medium text-gray-800 text-xs">{t('settings.backupManage')}</span>
            <span className="text-[11px] text-gray-400">{t('settings.backupKeep')}</span>
          </button>
        </div>
      </section>

      {/* 저장 확인 메시지 */}
      <p className="text-xs text-gray-400 text-center">{t('settings.autoSave')}</p>

      {/* 백업 패널 */}
      {backupOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('settings.backup')}</h3>
              <button onClick={() => setBackupOpen(false)} className="text-gray-400 text-sm">{t('settings.close')}</button>
            </div>
            <button
              onClick={handleCreate}
              disabled={backupLoading}
              className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl mb-2 disabled:opacity-50"
            >
              {backupLoading ? t('settings.backupCreating') : t('settings.backupCreate')}
            </button>
            <p className="text-xs text-amber-600 mb-4 px-1">{t('settings.voiceExcludedNote')}</p>
            {backups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">{t('settings.backupEmpty')}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-2">{t('settings.backupAutoKeep')}</p>
                {backups.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800">
                        {i === 0 ? `${t('settings.backupLatest')}  ` : ''}{b.createdAt.slice(0, 16).replace('T', ' ')}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatSize(b.size)}</div>
                    </div>
                    <button onClick={() => downloadBackup(b)} className="p-2 text-gray-500 border border-gray-300 rounded-lg">
                      <Download size={14} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleRestore(b)} className="p-2 text-gray-500 border border-gray-300 rounded-lg">
                      <RotateCcw size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 회사 정보·약관 (마케팅 사이트 외부 링크는 페이지 안에서 처리) */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.companySection')}</div>
        <button
          type="button"
          onClick={() => navigate('/company-info')}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 flex items-center justify-between active:bg-gray-50"
        >
          <span className="text-sm font-medium text-gray-800">{t('settings.companyMenu')}</span>
          <span className="text-gray-400">›</span>
        </button>
      </section>

      {/* 앱 정보 */}
      <section className="mt-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.appInfo')}</div>
        <div className="bg-white border border-gray-300 rounded-lg divide-y divide-gray-100">
          <div className="flex justify-between px-3 py-2 text-xs">
            <span className="text-gray-600">{t('settings.appInfoName')}</span>
            <span className="font-medium text-gray-800">R-Pro</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-xs">
            <span className="text-gray-600">{t('settings.version')}</span>
            <span className="font-medium text-gray-800">1.0.0</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-xs">
            <span className="text-gray-600">{t('settings.refrigerantCount')}</span>
            <span className="font-medium text-gray-800">{t('settings.refrigerantCountValue')}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-xs">
            <span className="text-gray-600">{t('settings.ptData')}</span>
            <span className="font-medium text-gray-800">NIST WebBook</span>
          </div>
        </div>
      </section>

      {/* 동기화 상태 진단 — 결함 신고 시 1번 클릭으로 검증 */}
      <section className="mt-6 mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.sync.title')}</div>
        <div className="bg-white border border-gray-300 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadSyncStatus}
              disabled={syncLoading}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm active:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} strokeWidth={2} className={syncLoading ? 'animate-spin' : ''} />
              {t('settings.sync.checkBtn')}
            </button>
            <button
              type="button"
              onClick={handleForceSync}
              disabled={forceSyncing}
              className="flex-1 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-sm active:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} strokeWidth={2} className={forceSyncing ? 'animate-spin' : ''} />
              {forceSyncing ? t('settings.sync.syncing') : t('settings.sync.forceSyncBtn')}
            </button>
          </div>

          {syncResults && (
            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-[11px]">
              <div className="font-semibold text-purple-900 mb-1">
                Sync run @ {new Date(syncResults.ranAt).toLocaleTimeString()}
                {syncResults.ok === false && <span className="ml-1.5 text-red-600">FAILED</span>}
              </div>
              {syncResults.reason && <div className="text-red-700">reason: {syncResults.reason}</div>}
              {syncResults.error && <div className="text-red-700 break-all">error: {syncResults.error}</div>}
              {syncResults.results && Object.keys(syncResults.results).length > 0 && (
                <div className="space-y-0.5 mt-1">
                  {Object.entries(syncResults.results).map(([c, r]) => (
                    <div key={c} className="flex justify-between gap-2">
                      <span className="font-medium text-gray-700">{c}</span>
                      <span className={r.error ? 'text-red-700 font-bold' : 'text-gray-600'}>
                        {r.error ? `❌ ${r.error}` : `↑${r.pushed ?? 0} ↓${r.pulled ?? 0}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {syncStatus && (
            <div className="mt-2 space-y-1.5">
              <div className="text-[10px] text-gray-400 text-right">
                {t('settings.sync.fetchedAt')}: {new Date(syncStatus.fetchedAt).toLocaleTimeString()}
              </div>
              {syncStatus.rows.map((r) => {
                const warn = r.pending > 0
                return (
                  <div key={r.name} className={`text-[11px] border rounded px-2 py-1.5 ${warn ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-gray-800">{r.name}</span>
                      <span className="text-gray-600">
                        {r.active}/{r.total}
                        {r.pending > 0 && <span className="ml-1.5 text-yellow-700 font-bold">⚠ {r.pending} {t('settings.sync.pending')}</span>}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>↑ {formatTs(r.lastPushAt)}</span>
                      <span>↓ {formatTs(r.lastPullAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-2 px-1">{t('settings.account')}</h2>
        <div className="bg-white border border-gray-300 rounded-lg p-3">
          {user?.email && (
            <div className="text-xs text-gray-600 mb-3 px-1 break-all">
              {user.email}
            </div>
          )}
          <button
            onClick={() => {
              setConfirmMsg(t('settings.logoutConfirm'))
              setConfirmAction(() => async () => {
                try {
                  await logout()
                  navigate('/login', { replace: true })
                } catch (e) {
                  showToast(e?.message || 'Logout failed')
                }
              })
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-700 text-white text-sm font-bold rounded-lg active:bg-gray-800"
          >
            <LogOut size={16} strokeWidth={2} />
            {t('settings.logout')}
          </button>
        </div>
      </section>

      {confirmAction && (
        <ConfirmModal
          message={confirmMsg}
          onConfirm={() => { confirmAction(); setConfirmAction(null) }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {showManageInfo && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowManageInfo(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('subscription.manageTitle')}</h3>
            <p className="text-xs text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
              {t('subscription.manageBody')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowManageInfo(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:bg-gray-200"
              >
                {t('common.close')}
              </button>
              <a
                href="mailto:support@r-pro.app?subject=Subscription%20Management"
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl active:bg-blue-700 text-center"
              >
                {t('subscription.contactSupport')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
