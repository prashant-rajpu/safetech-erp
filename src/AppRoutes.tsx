import React, { useState, lazy, Suspense } from 'react'
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
const GatePassPage = lazy(() => import('./pages/GatePassPage'))
const ProjectAutoImportPage = lazy(() => import('./pages/ProjectAutoImportPage'))
const ReportsHubPage = lazy(() => import('./pages/ReportsHubPage'))
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'))
const BackupPage = lazy(() => import('./pages/BackupPage'))

const PageLoader = () => (
  <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">
    Loading module…
  </div>
)

export default function AppRoutes(){
  const [mobileOpen, setMobileOpen] = useState(false)

  const ALL = ["viewer","controller","admin"]
  const OPS = ["controller","admin"]

  return (
    <AuthProvider>
      {/* basename follows Vite's base so the app works at / locally and
          under /safetech-erp/ on GitHub Pages */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen concrete-bg flex flex-col md:flex-row transition-colors duration-200">

          {/* Responsive Sidebar Menu */}
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Layout Area */}
          <div className="flex-grow flex flex-col md:pl-64 min-w-0 min-h-screen">

            {/* Top mobile header bar (Visible only on mobile screen sizes) */}
            <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#0c0c0f] border-b border-slate-200 dark:border-red-500/10 z-30 no-print">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-slate-600 dark:text-slate-300 focus:outline-none text-xl p-1 font-bold"
                aria-label="Open Navigation Sidebar"
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <img src="/safetech_logo.png" alt="Safetech" className="w-6 h-6 object-contain" />
                <span className="font-black text-xs tracking-tight text-neutral-900 dark:text-white uppercase leading-none">SAFETECH</span>
              </div>
              <div className="w-6" /> {/* Spacer */}
            </header>

            {/* Sub-page router body */}
            <main className="flex-grow p-4 md:p-6 z-10 w-full max-w-7xl mx-auto box-border overflow-x-hidden">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={ALL}><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>} />
                <Route path="/entry" element={<ProtectedRoute allowedRoles={OPS}><ControllerEntry /></ProtectedRoute>} />
                <Route path="/dispatch" element={<ProtectedRoute allowedRoles={OPS}><ControllerEntry defaultTab="dispatch" /></ProtectedRoute>} />
                <Route path="/fleet" element={<ProtectedRoute allowedRoles={OPS}><ControllerEntry defaultTab="fleet" /></ProtectedRoute>} />
                <Route path="/import" element={<ProtectedRoute allowedRoles={["admin"]}><CsvImport /></ProtectedRoute>} />
                <Route path="/delivery-note" element={<ProtectedRoute allowedRoles={OPS}><DeliveryNotePage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute allowedRoles={ALL}><DeliveryReportPage /></ProtectedRoute>} />

                {/* Legacy tabbed module pages (kept — linked from new nav).
                    /planning and /master were retired in the data-model
                    consolidation: their duplicated tools now live in the
                    registry modules and Casting Schedule. */}
                <Route path="/planning" element={<Navigate to="/casting-schedule" replace />} />
                <Route path="/master" element={<Navigate to="/m/projects" replace />} />
                <Route path="/production" element={<ProtectedRoute allowedRoles={ALL}><ProductionPage /></ProtectedRoute>} />
                <Route path="/stockyard" element={<ProtectedRoute allowedRoles={ALL}><StockyardPage /></ProtectedRoute>} />
                <Route path="/logistics/planning" element={<ProtectedRoute allowedRoles={ALL}><LogisticsPlanningPage /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute allowedRoles={ALL}><MaintenancePage /></ProtectedRoute>} />
                <Route path="/qr-scanner" element={<ProtectedRoute allowedRoles={ALL}><QrScannerPage /></ProtectedRoute>} />

                {/* Unified ERP framework */}
                <Route path="/m/:moduleId" element={<ProtectedRoute allowedRoles={ALL}><ModuleWorkspace /></ProtectedRoute>} />
                <Route path="/casting-schedule" element={<ProtectedRoute allowedRoles={ALL}><CastingSchedulePage /></ProtectedRoute>} />
                <Route path="/gate-pass" element={<ProtectedRoute allowedRoles={ALL}><GatePassPage /></ProtectedRoute>} />
                <Route path="/project-import" element={<ProtectedRoute allowedRoles={OPS}><ProjectAutoImportPage /></ProtectedRoute>} />
                <Route path="/reports-hub" element={<ProtectedRoute allowedRoles={ALL}><ReportsHubPage /></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute allowedRoles={["admin"]}><PermissionsPage /></ProtectedRoute>} />
                <Route path="/backup" element={<ProtectedRoute allowedRoles={["admin"]}><BackupPage /></ProtectedRoute>} />

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
