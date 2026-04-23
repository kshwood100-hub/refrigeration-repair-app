import { useState, useRef } from 'react'
import { UNITS } from '../data/refrigerantsData'
import { loadSettings, saveSettings } from '../utils/settings'
import { createBackup, listBackups, downloadBackup, restoreBackup, formatSize, importAllData } from '../utils/backup'
import { Download, RotateCcw, Upload, QrCode, ScanLine } from 'lucide-react'
import QRExportModal from '../components/QRExportModal'
import QRImportModal from '../components/QRImportModal'
import { useTranslation } from 'react-i18next'
import { showToast } from '../utils/toast'
import ConfirmModal from '../components/ConfirmModal'
import { insertTestData, deleteAllTestData } from '../utils/testData'

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
  const [settings, setSettings] = useState(loadSettings)
  const [backups, setBackups] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const importRef = useRef()
  const [qrExportOpen, setQrExportOpen] = useState(false)
  const [qrImportOpen, setQrImportOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [testLoading, setTestLoading] = useState(false)

  function update(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
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
            { val: 'lavender', label: t('settings.themeLavender'), desc: t('settings.themeLavenderDesc') },
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
            { val: 'xlarge', label: t('settings.fontXlarge'), desc: t('settings.fontXlargeDesc') },
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


      {/* 영수증 발급 정보 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.bizSection')}</div>
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
                className="w-full text-xs text-gray-800 border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 앱 업데이트 */}
      <section className="mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('settings.update')}</div>
        <div className="bg-white border border-gray-300 rounded-lg px-3 py-2.5">
          <p className="text-[11px] text-gray-400 mb-2">{t('settings.updateDesc')}</p>
          <button
            onClick={async () => {
              document.body.innerHTML = `<div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;color:white;font-family:sans-serif;gap:12px"><img src="/logo-transparent.png" style="width:72px;height:72px"/><div style="font-size:18px;font-weight:700">R-Pro</div><div style="font-size:13px;color:#94a3b8">${t('settings.updating')}</div></div>`
              try {
                const keys = await caches.keys()
                await Promise.all(keys.map(k => caches.delete(k)))
                const regs = await navigator.serviceWorker.getRegistrations()
                await Promise.all(regs.map(r => r.unregister()))
              } catch {}
              setTimeout(() => { window.location.href = '/' }, 600)
            }}
            className="w-full py-2 text-xs font-medium bg-gray-900 text-white rounded-lg active:bg-gray-700"
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

      {/* 임시 테스트 데이터 (출시 전 제거) */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">테스트 데이터 (임시)</div>
        <div className="bg-white border border-red-300 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs text-gray-500 mb-2">11개 테이블 총 1,440개 레코드 삽입/삭제</p>
          <button
            disabled={testLoading}
            onClick={async () => {
              setTestLoading(true)
              try {
                const res = await insertTestData()
                showToast(`테스트 데이터 ${res.total}개 삽입 완료`)
              } catch (e) {
                showToast('삽입 실패: ' + e.message)
              } finally {
                setTestLoading(false)
              }
            }}
            className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-50"
          >
            {testLoading ? '처리 중...' : '테스트 데이터 생성 (1,440개)'}
          </button>
          <button
            disabled={testLoading}
            onClick={() => {
              setConfirmMsg('모든 사용자 데이터(고객/수리의뢰/이력 등)가 삭제됩니다. 진행하시겠습니까?')
              setConfirmAction(() => async () => {
                setTestLoading(true)
                try {
                  await deleteAllTestData()
                  showToast('테스트 데이터 전체 삭제 완료')
                } catch (e) {
                  showToast('삭제 실패: ' + e.message)
                } finally {
                  setTestLoading(false)
                }
              })
            }}
            className="w-full py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl active:bg-red-700 disabled:opacity-50"
          >
            전체 사용자 데이터 삭제
          </button>
        </div>
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

      {confirmAction && (
        <ConfirmModal
          message={confirmMsg}
          onConfirm={() => { confirmAction(); setConfirmAction(null) }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
