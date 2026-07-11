import React, { useState, lazy, Suspense } from 'react'
import { Menu } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import { ProtectedRoute } from './routes/ProtectedRoute'

// Route-level code splitting: only the shell (sidebar, auth, login) ships in
// the main chunk; every page — including Dashboard, which pulls the heavy
// charting library — loads on demand. Keeps the first download small on
// yard phones.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const ControllerEntry = lazy(() => import('./pages/ControllerEntry'))
const CsvImport = lazy(() => import('./pages/CsvImport'))
const DeliveryNotePage = lazy(() => import('./pages/DeliveryNotePage'))
const DeliveryReportPage = lazy(() => import('./pages/DeliveryReportPage'))
const ProductionPage = lazy(() => import('./pages/ProductionPage'))
const StockyardPage = lazy(() => import('./pages/StockyardPage'))
const LogisticsPlanningPage = lazy(() => import('./pages/LogisticsPlanningPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const QrScannerPage = lazy(() => import('./pages/QrScannerPage'))
const ModuleWorkspace = lazy(() => import('./components/erp/ModuleWorkspace'))
const CastingSchedulePage = lazy(() => import('./pages/CastingSchedulePage'))
const CastBedPlanPage = lazy(() => import('./pages/CastBedPlanPage'))
const GatePassPage = lazy(() => import('./pages/GatePassPage'))
const ProjectAutoImportPage = lazy(() => import('./pages/ProjectAutoImportPage'))
const ReportsHubPage = lazy(() => import('./pages/ReportsHubPage'))
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'))
const HSEDashboardPage = lazy(() => import('./pages/HSEDashboardPage'))
const WorkforceDashboardPage = lazy(() => import('./pages/WorkforceDashboardPage'))
const PrestressingDashboardPage = lazy(() => import('./pages/PrestressingDashboardPage'))
const BatchingDashboardPage = lazy(() => import('./pages/BatchingDashboardPage'))
const MaintenanceDashboardPage = lazy(() => import('./pages/MaintenanceDashboardPage'))
const DocumentControlDashboardPage = lazy(() => import('./pages/DocumentControlDashboardPage'))
const HandoverDashboardPage = lazy(() => import('./pages/HandoverDashboardPage'))
const EnvironmentalDashboardPage = lazy(() => import('./pages/EnvironmentalDashboardPage'))
const CastBed3DPage = lazy(() => import('./pages/CastBed3DPage'))
const YardStack3DPage = lazy(() => import('./pages/YardStack3DPage'))
const Erection3DPage = lazy(() => import('./pages/Erection3DPage'))
const TrailerLoadSim3DPage = lazy(() => import('./pages/TrailerLoadSim3DPage'))
const ReportBuilderPage = lazy(() => import('./pages/ReportBuilderPage'))
const DrawingViewerPage = lazy(() => import('./pages/DrawingViewerPage'))

const PageLoader = () => (
  <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">
    Loading module…
  </div>
)

export default function AppRoutes(){
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AuthProvider>
      {/* basename follows Vite's base so the app works at / locally and
          under /safetech-erp/ on GitHub Pages */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen concrete-bg flex flex-col md:flex-row transition-colors duration-200">

          {/* Responsive Sidebar Menu */}
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Layout Area */}
          <div className="flex-grow flex flex-col md:pl-64 print:pl-0 min-w-0 min-h-screen">

            {/* Top mobile header bar (Visible only on mobile screen sizes) */}
            <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#0c0c0f] border-b border-slate-200 dark:border-primary/10 z-30 no-print">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-slate-600 dark:text-slate-300 focus:outline-none text-xl p-1 font-bold"
                aria-label="Open Navigation Sidebar"
              >
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL}safetech_logo.png`} alt="Safetech" className="w-6 h-6 object-contain" />
                <span className="font-black text-xs tracking-tight text-neutral-900 dark:text-white uppercase leading-none">SAFETECH</span>
              </div>
              <div className="w-6" /> {/* Spacer */}
            </header>

            {/* Sub-page router body */}
            <main className="flex-grow p-4 md:p-6 print:p-0 z-10 w-full max-w-7xl print:max-w-none mx-auto print:mx-0 box-border overflow-x-hidden">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute section="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute section="admin"><AdminPanel /></ProtectedRoute>} />
                <Route path="/entry" element={<ProtectedRoute section="dispatch"><ControllerEntry /></ProtectedRoute>} />
                <Route path="/dispatch" element={<ProtectedRoute section="dispatch"><ControllerEntry defaultTab="dispatch" /></ProtectedRoute>} />
                <Route path="/fleet" element={<ProtectedRoute section="logistics"><ControllerEntry defaultTab="fleet" /></ProtectedRoute>} />
                <Route path="/import" element={<ProtectedRoute section="admin"><CsvImport /></ProtectedRoute>} />
                <Route path="/delivery-note" element={<ProtectedRoute section="dispatch"><DeliveryNotePage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute section="reports"><DeliveryReportPage /></ProtectedRoute>} />

                {/* Legacy tabbed module pages (kept — linked from new nav).
                    /planning and /master were retired in the data-model
                    consolidation: their duplicated tools now live in the
                    registry modules and Casting Schedule. */}
                <Route path="/planning" element={<Navigate to="/casting-schedule" replace />} />
                <Route path="/master" element={<Navigate to="/m/projects" replace />} />
                <Route path="/production" element={<ProtectedRoute section="production"><ProductionPage /></ProtectedRoute>} />
                <Route path="/stockyard" element={<ProtectedRoute section="stockyard"><StockyardPage /></ProtectedRoute>} />
                <Route path="/logistics/planning" element={<ProtectedRoute section="dispatch"><LogisticsPlanningPage /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute section="maintenance"><MaintenancePage /></ProtectedRoute>} />
                <Route path="/qr-scanner" element={<ProtectedRoute section="stockyard"><QrScannerPage /></ProtectedRoute>} />

                {/* Unified ERP framework — auth-only at the route; ModuleWorkspace
                    gates view/create/edit/delete by the module's own section. */}
                <Route path="/m/:moduleId" element={<ProtectedRoute><ModuleWorkspace /></ProtectedRoute>} />
                <Route path="/casting-schedule" element={<ProtectedRoute section="planning"><CastingSchedulePage /></ProtectedRoute>} />
                <Route path="/cast-bed-plan" element={<ProtectedRoute section="planning"><CastBedPlanPage /></ProtectedRoute>} />
                <Route path="/gate-pass" element={<ProtectedRoute section="dispatch"><GatePassPage /></ProtectedRoute>} />
                <Route path="/project-import" element={<ProtectedRoute section="planning"><ProjectAutoImportPage /></ProtectedRoute>} />
                <Route path="/reports-hub" element={<ProtectedRoute section="reports"><ReportsHubPage /></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute section="admin"><PermissionsPage /></ProtectedRoute>} />
                <Route path="/hse" element={<ProtectedRoute section="hse"><HSEDashboardPage /></ProtectedRoute>} />
                <Route path="/workforce" element={<ProtectedRoute section="workforce"><WorkforceDashboardPage /></ProtectedRoute>} />
                <Route path="/prestressing" element={<ProtectedRoute section="prestressing"><PrestressingDashboardPage /></ProtectedRoute>} />
                <Route path="/batching" element={<ProtectedRoute section="production"><BatchingDashboardPage /></ProtectedRoute>} />
                <Route path="/maintenance-dashboard" element={<ProtectedRoute section="maintenance"><MaintenanceDashboardPage /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute section="documents"><DocumentControlDashboardPage /></ProtectedRoute>} />
                <Route path="/handover" element={<ProtectedRoute section="handover"><HandoverDashboardPage /></ProtectedRoute>} />
                <Route path="/environmental" element={<ProtectedRoute section="environmental"><EnvironmentalDashboardPage /></ProtectedRoute>} />
                <Route path="/visualization/cast-bed" element={<ProtectedRoute section="production"><CastBed3DPage /></ProtectedRoute>} />
                <Route path="/visualization/yard" element={<ProtectedRoute section="stockyard"><YardStack3DPage /></ProtectedRoute>} />
                <Route path="/visualization/erection" element={<ProtectedRoute section="erection"><Erection3DPage /></ProtectedRoute>} />
                <Route path="/visualization/trailer-loading" element={<ProtectedRoute section="dispatch"><TrailerLoadSim3DPage /></ProtectedRoute>} />
                <Route path="/reports-builder" element={<ProtectedRoute section="reports"><ReportBuilderPage /></ProtectedRoute>} />
                <Route path="/drawings/viewer" element={<ProtectedRoute section="design"><DrawingViewerPage /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              </Suspense>
            </main>
          </div>

        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
