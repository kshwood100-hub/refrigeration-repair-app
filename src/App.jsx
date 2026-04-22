import { useEffect, useRef, Component } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { useAuth } from './hooks/useAuth.jsx'
import LoginPage from './pages/LoginPage'
import { showToast } from './utils/toast'

const TOP_LEVEL_PATHS = ['/home', '/diagnosis', '/service', '/finance', '/knowhow', '/settings']
const EXIT_PRESS_COUNT = 7   // 종료에 필요한 뒤로가기 누름 횟수
const EXIT_WINDOW_MS = 2000  // 연속 누름으로 인정할 시간(ms)

const SENTINEL_BUFFER = 30  // 센티넬 미리 푸시 개수 (브라우저별 popstate 타이밍 이슈 방지)

function useBackExit() {
  const location = useLocation()
  const isTopLevel = TOP_LEVEL_PATHS.includes(location.pathname)
  const stateRef = useRef({ lastBack: 0, pressCount: 0, exiting: false })

  useEffect(() => {
    if (!isTopLevel) return
    const s = stateRef.current
    s.pressCount = 0
    s.lastBack = 0
    s.exiting = false
    // 센티넬을 여러 개 미리 푸시 — 일부 브라우저가 popstate 전에 복수 엔트리를 소비해도 버티게
    // 이미 센티넬 위에 있으면 중복 푸시 방지 (누적 방지)
    if (!window.history.state?.__exitSentinel) {
      for (let i = 0; i < SENTINEL_BUFFER; i++) {
        window.history.pushState({ __exitSentinel: true, n: i }, '')
      }
    }

    const onPop = () => {
      if (s.exiting) {
        s.exiting = false
        return
      }
      // 소비된 만큼 새 센티넬 보충
      window.history.pushState({ __exitSentinel: true }, '')

      const now = Date.now()
      if (now - s.lastBack > EXIT_WINDOW_MS) s.pressCount = 0
      s.pressCount += 1
      s.lastBack = now

      if (s.pressCount >= EXIT_PRESS_COUNT) {
        s.exiting = true
        // 남은 센티넬을 모두 제거하고 /home 엔트리까지 벗어나도록
        window.history.go(-(SENTINEL_BUFFER + 1))
        return
      }
      const remaining = EXIT_PRESS_COUNT - s.pressCount
      showToast(i18n.t('common.pressAgainToExit', { count: remaining }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isTopLevel, location.pathname])
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff', fontSize: 14 }}>
          <b>Error:</b> {this.state.error?.message}<br />
          <pre style={{ fontSize: 11, marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
import { seedIfEmpty } from './db'
import { loadSettings } from './utils/settings'
import { autoBackupIfDue } from './utils/backup'
import BottomNav from './components/BottomNav'
import UpdateBanner from './components/UpdateBanner'
import HomePage from './pages/HomePage'
import DiagnosisSearchPage from './pages/DiagnosisSearchPage'
import ChecklistPage from './pages/ChecklistPage'
import RepairLogPage from './pages/RepairLogPage'
import RefrigerantSliderPage from './pages/RefrigerantSliderPage'
import SettingsPage from './pages/SettingsPage'
import ServicePage from './pages/ServicePage'
import JobFormPage from './pages/JobFormPage'
import JobDetailPage from './pages/JobDetailPage'
import KnowhowPage from './pages/KnowhowPage'
import KnowhowDetailPage from './pages/KnowhowDetailPage'
import KnowhowFormPage from './pages/KnowhowFormPage'
import RefrigerationBasicsPage from './pages/RefrigerationBasicsPage'
import BusinessCardPage from './pages/BusinessCardPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import ExpensePage from './pages/ExpensePage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import LandingPage from './pages/LandingPage'
import ReceiptPage from './pages/ReceiptPage'
import BillingPage from './pages/BillingPage'
import AlarmPage from './pages/AlarmPage'
import VoiceMemoPage from './pages/VoiceMemoPage'
import EquipmentScanPage from './pages/EquipmentScanPage'
import FinancePage from './pages/FinancePage'
import SupplierFormPage from './pages/SupplierFormPage'
import SupplierDetailPage from './pages/SupplierDetailPage'
import SupplierTransactionFormPage from './pages/SupplierTransactionFormPage'
import SupplierTransactionDetailPage from './pages/SupplierTransactionDetailPage'
import SupplierPaymentFormPage from './pages/SupplierPaymentFormPage'

export default function App() {
  const { user } = useAuth()

  useEffect(() => {
    seedIfEmpty()
    const { theme, fontSize } = loadSettings()
    const cls = [`theme-${theme}`]
    if (fontSize && fontSize !== 'medium') cls.push(`font-${fontSize === 'large' ? 'large' : 'xlarge'}`)
    document.documentElement.className = cls.join(' ')
    autoBackupIfDue()
  }, [])

  // 로딩 중
  if (user === undefined) return null

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
        <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

const RESET_AFTER_MS = 5 * 60 * 1000  // 5분 이상 숨겨져 있다가 돌아오면 홈으로 리셋

// 폼 작성 중 리셋 방지 — 해당 경로에선 자동 리셋 스킵
function isFormPath(pathname) {
  return /\/(new|edit|billing|receipt|transactions\/new|payments\/new|flow-edit)/.test(pathname)
}

function useAutoResetToHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const hiddenAtRef = useRef(0)
  const pathRef = useRef(location.pathname)

  useEffect(() => { pathRef.current = location.pathname }, [location.pathname])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
      } else if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - hiddenAtRef.current
        if (hiddenAtRef.current > 0 && elapsed >= RESET_AFTER_MS && !isFormPath(pathRef.current)) {
          navigate('/home', { replace: true })
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [navigate])
}

function AppLayout() {
  useBackExit()
  useAutoResetToHome()
  return (
    <div className="flex flex-col h-full max-w-lg mx-auto" style={{ backgroundColor: 'var(--app-bg)' }}>
      <UpdateBanner />
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/diagnosis" element={<DiagnosisSearchPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/logs" element={<RepairLogPage />} />
          <Route path="/refrigerant" element={<RefrigerantSliderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/service/new" element={<JobFormPage />} />
          <Route path="/service/:id" element={<JobDetailPage />} />
          <Route path="/service/:id/edit" element={<JobFormPage />} />
          <Route path="/service/:id/billing" element={<BillingPage />} />
          <Route path="/service/:id/receipt" element={<ReceiptPage />} />
          <Route path="/knowhow" element={<KnowhowPage />} />
          <Route path="/knowhow/new" element={<KnowhowFormPage />} />
          <Route path="/knowhow/:id" element={<KnowhowDetailPage />} />
          <Route path="/knowhow/:id/edit" element={<KnowhowFormPage />} />
          <Route path="/basics" element={<RefrigerationBasicsPage />} />
          <Route path="/business-cards" element={<BusinessCardPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/expenses" element={<ExpensePage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
          <Route path="/suppliers/new" element={<SupplierFormPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
          <Route path="/suppliers/:id/transactions/new" element={<SupplierTransactionFormPage />} />
          <Route path="/suppliers/:id/payments/new" element={<SupplierPaymentFormPage />} />
          <Route path="/supplier-transactions/:id" element={<SupplierTransactionDetailPage />} />
          <Route path="/alarms" element={<AlarmPage />} />
          <Route path="/voice-memo" element={<VoiceMemoPage />} />
          <Route path="/scan/equipment" element={<EquipmentScanPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
