import { useEffect, useState } from 'react'
import { useAuth } from '../useAuth'
import { fetchRows } from './db'
import type { SectionKey } from './registry'

type PermRow = { role_key: string; section_key: string; can_view: boolean; can_edit: boolean }

/**
 * Role-based section permissions, driven by the role_permissions table so
 * admins can adjust access from the Permissions screen without code changes.
 * Unknown roles fall back to view-only; missing rows deny access.
 */
export function usePermissions() {
  const { profile } = useAuth()
  const [perms, setPerms] = useState<PermRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchRows('role_permissions').then(rows => {
      if (!mounted) return
      setPerms(rows as PermRow[])
      setLoaded(true)
    })
    return () => { mounted = false }
  }, [])

  const role = profile?.role || 'viewer'

  const canView = (section: SectionKey): boolean => {
    if (!loaded) return true // avoid nav flicker before permissions load
    const row = perms.find(p => p.role_key === role && p.section_key === section)
    if (row) return !!row.can_view
    return role === 'admin'
  }

  const canEdit = (section: SectionKey): boolean => {
    const row = perms.find(p => p.role_key === role && p.section_key === section)
    if (row) return !!row.can_edit
    return role === 'admin'
  }

  return { role, loaded, canView, canEdit }
}
