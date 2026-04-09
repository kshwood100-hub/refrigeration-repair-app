import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { useLocalField } from '../hooks/useLang'

export default function SymptomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lf = useLocalField()

  const symptom = useLiveQuery(() => db.symptoms.get(Number(id)), [id])

  if (!symptom) return <div className="p-4 text-gray-400">{t('logs.loading')}</div>

  const causes = lf(symptom, 'causes')
  const procedures = lf(symptom, 'procedures')
  const notes = lf(symptom, 'notes')

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">
        {t('symptoms.back')}
      </button>

      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
        {lf(symptom, 'category')}
      </span>
      <h2 className="text-xl font-bold mt-2 mb-4">{lf(symptom, 'title')}</h2>

      <section className="mb-5">
        <h3 className="text-base font-semibold text-gray-700 mb-2">{t('symptoms.causes')}</h3>
        <ul className="space-y-2">
          {causes.map((cause, i) => (
            <li key={i} className="flex gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-sm">
              <span className="text-red-500 font-bold">{i + 1}</span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-5">
        <h3 className="text-base font-semibold text-gray-700 mb-2">{t('symptoms.procedures')}</h3>
        <ol className="space-y-2">
          {procedures.map((step, i) => (
            <li key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {notes && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-yellow-700 mb-1">⚠ {t('symptoms.notes')}</div>
          <div className="text-sm text-yellow-900">{notes}</div>
        </section>
      )}
    </div>
  )
}
