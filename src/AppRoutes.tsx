import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import ControllerEntry from './pages/ControllerEntry'
import CsvImport from './pages/CsvImport'
import DeliveryNotePage from './pages/DeliveryNotePage'
import DeliveryReportPage from './pages/DeliveryReportPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

// ERP Module Pages
import PlanningPage from './pages/PlanningPage'
import ProductionPage from './pages/ProductionPage'
import StockyardPage from './pages/StockyardPage'
import LogisticsPlanningPage from './pages/LogisticsPlanningPage'
import MasterDataPage from './pages/MasterDataPage'
import MaintenancePage from './pages/MaintenancePage'
import QrScannerPage from './pages/QrScannerPage'

// Unified ERP framework pages
import ModuleWorkspace from './components/erp/ModuleWorkspace'
import CastingSchedulePage from './pages/CastingSchedulePage'
import GatePassPage from './pages/GatePassPage'
import ProjectAutoImportPage from './pages/ProjectAutoImportPage'
import ReportsHubPage from './pages/ReportsHubPage'
import PermissionsPage from './pages/PermissionsPage'

export default function AppRoutes(){
  const [mobileOpen, setMobileOpen] = useState(false)

  const ALL = ["viewer","controller","admin"]
  const OPS = ["controller","admin"]

  return (
    <AuthProvider>
      <BrowserRouter>
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

                {/* Legacy tabbed module pages (kept — linked from new nav) */}
                <Route path="/planning" element={<ProtectedRoute allowedRoles={ALL}><PlanningPage /></ProtectedRoute>} />
                <Route path="/production" element={<ProtectedRoute allowedRoles={ALL}><ProductionPage /></ProtectedRoute>} />
                <Route path="/stockyard" element={<ProtectedRoute allowedRoles={ALL}><StockyardPage /></ProtectedRoute>} />
                <Route path="/logistics/planning" element={<ProtectedRoute allowedRoles={ALL}><LogisticsPlanningPage /></ProtectedRoute>} />
                <Route path="/master" element={<ProtectedRoute allowedRoles={ALL}><MasterDataPage /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute allowedRoles={ALL}><MaintenancePage /></ProtectedRoute>} />
                <Route path="/qr-scanner" element={<ProtectedRoute allowedRoles={ALL}><QrScannerPage /></ProtectedRoute>} />

                {/* Unified ERP framework */}
                <Route path="/m/:moduleId" element={<ProtectedRoute allowedRoles={ALL}><ModuleWorkspace /></ProtectedRoute>} />
                <Route path="/casting-schedule" element={<ProtectedRoute allowedRoles={ALL}><CastingSchedulePage /></ProtectedRoute>} />
                <Route path="/gate-pass" element={<ProtectedRoute allowedRoles={ALL}><GatePassPage /></ProtectedRoute>} />
                <Route path="/project-import" element={<ProtectedRoute allowedRoles={OPS}><ProjectAutoImportPage /></ProtectedRoute>} />
                <Route path="/reports-hub" element={<ProtectedRoute allowedRoles={ALL}><ReportsHubPage /></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute allowedRoles={["admin"]}><PermissionsPage /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>

        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
