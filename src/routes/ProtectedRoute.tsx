import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { usePermissions } from '../lib/erp/usePermissions'
import type { SectionKey } from '../lib/erp/registry'
import type { PermAction } from '../lib/erp/permissionEngine'

// Page-level guard driven by the dynamic permission engine (role ∪ department
// grants), not hardcoded role lists. A route names the section it belongs to and
// optionally the action it needs (defaults to 'view'); access follows whatever
// the Permissions matrix currently grants — change it and the guard changes with
// it. Routes with no section are auth-only (e.g. /m/:moduleId, gated internally).
export function ProtectedRoute(
  { section, action = 'view', children }:
  { section?: SectionKey, action?: PermAction, children: React.ReactNode }
){
  const { user, profile, loading } = useAuth()
  const { can, loaded } = usePermissions()

  if(loading) return <div className="p-6 text-neutral-400">Loading…</div>
  if(!user) return <Navigate to="/login" replace />
  if(!profile) return <div className="p-6 text-neutral-400">Loading profile…</div>

  if(section){
    // wait for grants before deciding, so an authorized user never flashes a denial
    if(!loaded) return <div className="p-6 text-neutral-400">Loading permissions…</div>
    if(!can(section, action)) return <div className="p-6 text-yellow-300">You do not have access to this page.</div>
  }

  return <>{children}</>
}
