import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { useLocalField } from '../hooks/useLang'

export default function SymptomsPage() {
  const { t } = useTranslation()
  const lf = useLocalField()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const symptoms = useLiveQuery(() => db.symptoms.toArray(), [])

  if (!symptoms) return <div className="p-4 text-gray-400">{t('logs.loading')}</div>

  const categories = ['all', ...new Set(symptoms.map((s) => s.category))]

  const filtered = symptoms.filter((s) => {
    const matchCategory = activeCategory === 'all' || s.category === activeCategory
    const title = lf(s, 'title').toLowerCase()
    const cat = lf(s, 'category').toLowerCase()
    const matchSearch = title.includes(search.toLowerCase()) || cat.includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">{t('symptoms.title')}</h2>

      <input
        type="search"
        placeholder={t('symptoms.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {cat === 'all' ? t('symptoms.all') : lf(symptoms.find(s => s.category === cat) ?? {}, 'category') || cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <Link
            key={s.id}
            to={`/symptoms/${s.id}`}
            className="block p-4 bg-white border border-gray-300 rounded-xl active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                  {lf(s, 'category')}
                </span>
                <div className="mt-1 font-medium text-gray-800">{lf(s, 'title')}</div>
              </div>
              <span className="text-gray-400">›</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-10 text-sm">{t('symptoms.empty')}</div>
        )}
      </div>
    </div>
  )
}
