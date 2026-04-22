import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ExpensePage from './ExpensePage'
import SuppliersPage from './SuppliersPage'

export default function FinancePage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'supplier' ? 'supplier' : 'as'

  const changeTab = (key) => {
    setSearchParams(key === 'supplier' ? { tab: 'supplier' } : {}, { replace: true })
  }

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'as',       label: t('finance.tabAs'),       activeCls: 'bg-blue-600 text-white shadow-sm',  inactiveCls: 'text-blue-500' },
            { key: 'supplier', label: t('finance.tabSupplier'), activeCls: 'bg-amber-600 text-white shadow-sm', inactiveCls: 'text-amber-600' },
          ].map((tb) => (
            <button
              key={tb.key}
              onClick={() => changeTab(tb.key)}
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
                tab === tb.key ? tb.activeCls : tb.inactiveCls
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'as'       ? <ExpensePage hideTitle /> : null}
      {tab === 'supplier' ? <SuppliersPage hideTitle /> : null}
    </div>
  )
}
