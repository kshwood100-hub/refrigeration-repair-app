import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ExternalLink } from 'lucide-react'

// External link domain (marketing site)
const SITE = 'https://www.r-pro.app'

export default function CompanyInfoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="p-4 pb-10 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>

      <h2 className="text-base font-semibold text-gray-900">{t('companyInfo.title')}</h2>

      {/* Business info. Values in English. Full details on r-pro.app/terms */}
      <Section title={t('companyInfo.bizSection')}>
        <Row label={t('companyInfo.bizName')}  value="Market Free" />
        <Row label={t('companyInfo.bizRegNo')} value="208-22-97324" />
      </Section>

      {/* Terms */}
      <LinkBlock
        title={t('companyInfo.terms')}
        summary={t('companyInfo.termsSummary')}
        href={`${SITE}/terms`}
        viewMore={t('companyInfo.viewMore')}
      />

      {/* Privacy */}
      <LinkBlock
        title={t('companyInfo.privacy')}
        summary={t('companyInfo.privacySummary')}
        href={`${SITE}/privacy`}
        viewMore={t('companyInfo.viewMore')}
      />

      {/* Refund */}
      <LinkBlock
        title={t('companyInfo.refund')}
        summary={t('companyInfo.refundSummary')}
        href={`${SITE}/refund`}
        viewMore={t('companyInfo.viewMore')}
      />

      {/* Contact */}
      <LinkBlock
        title={t('companyInfo.contact')}
        summary={t('companyInfo.contactSummary')}
        href={`${SITE}`}
        viewMore={t('companyInfo.viewMore')}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

function LinkBlock({ title, summary, href, viewMore }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{title}</p>
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm space-y-2">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 active:underline"
        >
          {viewMore}
          <ExternalLink size={12} strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}
