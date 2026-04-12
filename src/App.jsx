import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { seedIfEmpty } from './db'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import DiagnosisPage from './pages/DiagnosisPage'
import DiagnosisFlowPage from './pages/DiagnosisFlowPage'
import SymptomsPage from './pages/SymptomsPage'
import SymptomDetailPage from './pages/SymptomDetailPage'
import ChecklistPage from './pages/ChecklistPage'
import RepairLogPage from './pages/RepairLogPage'
import FlowEditPage from './pages/FlowEditPage'
import RefrigerantSliderPage from './pages/RefrigerantSliderPage'
import SettingsPage from './pages/SettingsPage'
import ServicePage from './pages/ServicePage'
import JobFormPage from './pages/JobFormPage'
import JobDetailPage from './pages/JobDetailPage'
import KnowhowPage from './pages/KnowhowPage'
import KnowhowDetailPage from './pages/KnowhowDetailPage'
import KnowhowFormPage from './pages/KnowhowFormPage'
import RefrigerationBasicsPage from './pages/RefrigerationBasicsPage'
import DiagnosisResultPage from './pages/DiagnosisResultPage'
import BusinessCardPage from './pages/BusinessCardPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import ExpensePage from './pages/ExpensePage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import FailureCasesPage from './pages/FailureCasesPage'
import SearchDiagPage from './pages/SearchDiagPage'
import LandingPage from './pages/LandingPage'

export default function App() {
  const [showBanner, setShowBanner] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    seedIfEmpty()
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setShowBanner(true)
            }
          })
        })
      })
    }
  }, [])

  function doUpdate() {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
    setShowBanner(false)
    window.location.reload()
  }

  return (
    <>
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gray-900 text-white text-sm shadow-lg max-w-lg mx-auto">
          <span>새 버전이 있습니다</span>
          <button onClick={doUpdate} className="px-3 py-1 bg-blue-500 rounded-lg text-xs font-semibold">
            업데이트
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </>
  )
}

function AppLayout() {
  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-slate-200">
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/diagnosis" element={<DiagnosisPage />} />
          <Route path="/diagnosis/search" element={<SearchDiagPage />} />
          <Route path="/diagnosis/:categoryId" element={<DiagnosisFlowPage />} />
          <Route path="/diagnosis/:categoryId/results" element={<DiagnosisResultPage />} />
          <Route path="/symptoms" element={<SymptomsPage />} />
          <Route path="/symptoms/:id" element={<SymptomDetailPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/logs" element={<RepairLogPage />} />
          <Route path="/flow-edit" element={<FlowEditPage />} />
          <Route path="/refrigerant" element={<RefrigerantSliderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/service/new" element={<JobFormPage />} />
          <Route path="/service/:id" element={<JobDetailPage />} />
          <Route path="/service/:id/edit" element={<JobFormPage />} />
          <Route path="/knowhow" element={<KnowhowPage />} />
          <Route path="/knowhow/failure-cases" element={<FailureCasesPage />} />
          <Route path="/knowhow/new" element={<KnowhowFormPage />} />
          <Route path="/knowhow/:id" element={<KnowhowDetailPage />} />
          <Route path="/knowhow/:id/edit" element={<KnowhowFormPage />} />
          <Route path="/basics" element={<RefrigerationBasicsPage />} />
          <Route path="/business-cards" element={<BusinessCardPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/expenses" element={<ExpensePage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
