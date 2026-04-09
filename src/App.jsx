import { useEffect } from 'react'
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

export default function App() {
  useEffect(() => {
    seedIfEmpty()
  }, [])

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diagnosis" element={<DiagnosisPage />} />
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
          <Route path="/knowhow/new" element={<KnowhowFormPage />} />
          <Route path="/knowhow/:id" element={<KnowhowDetailPage />} />
          <Route path="/knowhow/:id/edit" element={<KnowhowFormPage />} />
          <Route path="/basics" element={<RefrigerationBasicsPage />} />
          <Route path="/business-cards" element={<BusinessCardPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
