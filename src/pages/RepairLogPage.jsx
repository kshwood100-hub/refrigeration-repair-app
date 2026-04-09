import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../db'

export default function RepairLogPage() {
  const { t } = useTranslation()
  const logs = useLiveQuery(() => db.repair_logs.orderBy('date').reverse().toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', equipmentName: '', symptom: '', action: '', result: '' })

  const handleSave = async () => {
    if (!form.date || !form.equipmentName) return
    await db.repair_logs.add({ ...form })
    setForm({ date: '', equipmentName: '', symptom: '', action: '', result: '' })
    setShowForm(false)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('logs.title')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg active:bg-blue-700"
        >
          {t('logs.add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder={t('logs.equipmentPlaceholder')}
            value={form.equipmentName}
            onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder={t('logs.symptomPlaceholder')}
            value={form.symptom}
            onChange={(e) => setForm({ ...form, symptom: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <textarea
            placeholder={t('logs.actionPlaceholder')}
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <input
            placeholder={t('logs.resultPlaceholder')}
            value={form.result}
            onChange={(e) => setForm({ ...form, result: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium active:bg-blue-700"
          >
            {t('logs.save')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {logs?.map((log) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-gray-800">{log.equipmentName}</span>
              <span className="text-xs text-gray-400">{log.date}</span>
            </div>
            {log.symptom && <div className="text-sm text-gray-600">{t('logs.symptomLabel')}: {log.symptom}</div>}
            {log.action && <div className="text-sm text-gray-600">{t('logs.actionLabel')}: {log.action}</div>}
            {log.result && (
              <div className="text-sm text-green-700 font-medium mt-1">{t('logs.resultLabel')}: {log.result}</div>
            )}
          </div>
        ))}
        {logs?.length === 0 && (
          <div className="text-center text-gray-400 py-10 text-sm">{t('logs.empty')}</div>
        )}
      </div>
    </div>
  )
}
