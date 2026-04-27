import { useEffect, useRef, Component } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import { useAuth } from './hooks/useAuth.jsx'
import LoginPage from './pages/LoginPage'
import { showToast } from './utils/toast'

const QUICK_DOUBLE_BACK_MS = 600  // 이 시간 안에 두 번 누르면 앱 종료

// 동작:
//   - 단일 뒤로가기 → 평소처럼 한 페이지 이전 (브라우저 기본)
//   - 앱 첫 진입 페이지(__appRoot)에서 뒤로가기 → 종료 안 하고 토스트
//   - 토스트 뜬 뒤 600ms 안에 다시 뒤로가기 → 앱 종료
function useBackExit() {
  const stateRef = useRef({ lastRootBack: 0 })

  useEffect(() => {
    // 앱 진입점을 표시(replace)하고, 그 위에 sentinel 1개를 올림
    // 이렇게 하면 사용자는 sentinel 위에서 자유롭게 navigate/back 가능
    if (!window.history.state?.__appRoot && !window.history.state?.__exitSentinel) {
      window.history.replaceState({ __appRoot: true }, '')
      window.history.pushState({ __exitSentinel: true }, '')
    }

    const onPop = (e) => {
      const s = stateRef.current

      // 진입점(__appRoot)까지 내려왔다 = 사용자가 앱 밖으로 나가려는 시도
      if (e.state?.__appRoot) {
        const now = Date.now()
        const wasFast = (now - s.lastRootBack) < QUICK_DOUBLE_BACK_MS
        s.lastRootBack = now

        if (wasFast) {
          // 빠른 두 번째 → 진짜 종료 (한 칸 더 뒤로)
          window.history.back()
          return
        }

        // 첫 누름 → sentinel 다시 올려서 종료 막고 안내
        window.history.pushState({ __exitSentinel: true }, '')
        showToast(i18n.t('common.pressAgainToExit', { count: 1 }))
        return
      }

      // sentinel 또는 다른 페이지로 내려간 경우 = 정상 뒤로가기
      // 타이머 리셋 (깊은 페이지에서 빠르게 연타해도 진입점에서 한 번은 토스트가 뜨도록)
      s.lastRootBack = 0
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
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
import DisclaimerModal from './components/DisclaimerModal'
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
      <DisclaimerModal />
    </div>
  )
}
