import { useState, useRef } from 'react'
import { UNITS } from '../data/refrigerantsData'
import { loadSettings, saveSettings } from '../utils/settings'
import { createBackup, listBackups, downloadBackup, restoreBackup, formatSize, exportAllData, importAllData } from '../utils/backup'
import { Download, RotateCcw, Upload } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState(loadSettings)
  const [backups, setBackups] = useState([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const importRef = useRef()

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
      alert('백업 오류: ' + e.message)
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleExport() {
    setExportLoading(true)
    try {
      await exportAllData()
    } catch (e) {
      alert('내보내기 오류: ' + e.message)
    } finally {
      setExportLoading(false)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!confirm('현재 기기의 모든 데이터가 파일 데이터로 교체됩니다.\n계속하시겠습니까?')) return
    try {
      await importAllData(file)
      alert('가져오기 완료')
    } catch (err) {
      alert('가져오기 오류: ' + err.message)
    }
  }

  async function handleRestore(b) {
    if (!confirm(`${b.createdAt.slice(0, 16)} 백업으로 복원하시겠습니까?\n현재 데이터가 모두 교체됩니다.`)) return
    try {
      await restoreBackup(b)
      setBackupOpen(false)
      alert('복원 완료')
    } catch (e) {
      alert('복원 오류: ' + e.message)
    }
  }

  return (
    <div className="p-4 pb-8">
      <h2 className="text-lg font-bold mb-5">⚙️ 설정</h2>

      {/* 압력 단위 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">압력 단위 기본값</div>
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
          {Object.entries(UNITS).map(([key, u], i) => (
            <button
              key={key}
              onClick={() => update({ unitKey: key })}
              className={`w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <span className="font-medium text-gray-800">{u.label}</span>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                settings.unitKey === key ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {settings.unitKey === key && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 게이지 / 절대 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">압력 표시 방식 기본값</div>
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
          {[
            { val: true,  label: '게이지 압력 (g)', desc: '대기압 기준 — 현장 압력계 수치' },
            { val: false, label: '절대 압력 (a)',   desc: '진공 기준 — 이론/계산용' },
          ].map(({ val, label, desc }, i) => (
            <button
              key={String(val)}
              onClick={() => update({ isGauge: val })}
              className={`w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 ${i > 0 ? 'border-t border-gray-300' : ''}`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 text-sm">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                settings.isGauge === val ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
              }`}>
                {settings.isGauge === val && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Claude API 키 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI 기능 설정</div>
        <div className="bg-white border border-gray-300 rounded-xl px-4 py-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Claude API 키</label>
          <input
            type="password"
            value={settings.claudeApiKey}
            onChange={(e) => update({ claudeApiKey: e.target.value })}
            placeholder="sk-ant-api03-..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            음성 자동 분류 AI 기능에 사용됩니다.<br />
            키는 이 기기에만 저장되며 외부로 전송되지 않습니다.
          </p>
        </div>
      </section>

      {/* 데이터 내보내기 / 가져오기 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">데이터 이전</div>
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden divide-y divide-gray-100">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm active:bg-gray-50 disabled:opacity-50"
          >
            <Download size={16} strokeWidth={1.5} className="text-gray-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">{exportLoading ? '파일 생성 중...' : '데이터 내보내기'}</p>
              <p className="text-xs text-gray-400 mt-0.5">메일·드라이브·카카오 등 원하는 앱으로 전송</p>
            </div>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm active:bg-gray-50"
          >
            <Upload size={16} strokeWidth={1.5} className="text-gray-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">데이터 가져오기</p>
              <p className="text-xs text-gray-400 mt-0.5">JSON 파일에서 복원 (기존 데이터 교체)</p>
            </div>
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </section>

      {/* 데이터 백업 */}
      <section className="mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">데이터 백업</div>
        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
          <button
            onClick={openBackup}
            className="w-full flex items-center justify-between px-4 py-3 text-sm active:bg-gray-50"
          >
            <span className="font-medium text-gray-800">백업 관리</span>
            <span className="text-xs text-gray-400">최근 3개 유지</span>
          </button>
        </div>
      </section>

      {/* 저장 확인 메시지 */}
      <p className="text-xs text-gray-400 text-center">변경 사항은 즉시 저장됩니다.</p>

      {/* 백업 패널 */}
      {backupOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">데이터 백업</h3>
              <button onClick={() => setBackupOpen(false)} className="text-gray-400 text-sm">닫기</button>
            </div>
            <button
              onClick={handleCreate}
              disabled={backupLoading}
              className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl mb-4 disabled:opacity-50"
            >
              {backupLoading ? '백업 생성 중...' : '+ 지금 백업 생성'}
            </button>
            {backups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">저장된 백업이 없습니다</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-2">최근 3개 자동 유지</p>
                {backups.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800">
                        {i === 0 ? '최신  ' : ''}{b.createdAt.slice(0, 16).replace('T', ' ')}
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

      {/* 앱 정보 */}
      <section className="mt-8">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">앱 정보</div>
        <div className="bg-white border border-gray-300 rounded-xl divide-y divide-gray-100">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-600">앱 이름</span>
            <span className="font-medium text-gray-800">냉동기수리실무</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-600">버전</span>
            <span className="font-medium text-gray-800">1.0.0</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-600">냉매 종류</span>
            <span className="font-medium text-gray-800">11종</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-gray-600">PT 데이터</span>
            <span className="font-medium text-gray-800">NIST WebBook</span>
          </div>
        </div>
      </section>
    </div>
  )
}
