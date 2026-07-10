import { useEffect, useState } from 'react'
import { useAuth } from '../useAuth'
import { fetchRows } from './db'
import type { SectionKey } from './registry'
import {
  hasPermission, type PermAction, type RolePermRow, type DeptPermRow
} from './permissionEngine'

/**
 * Live permission guard driven by the roles / role_permissions /
 * department_permissions tables — admins adjust access from the Permissions
 * screen and it applies immediately, without code changes.
 *
 * Effective grant = union(role grants, department grants); admin always full;
 * missing rows deny. See permissionEngine.ts for the pure logic (unit-tested).
 */
export function usePermissions() {
  const { profile } = useAuth()
  const [rolePerms, setRolePerms] = useState<RolePermRow[]>([])
  const [deptPerms, setDeptPerms] = useState<DeptPermRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    Promise.all([fetchRows('role_permissions'), fetchRows('department_permissions')]).then(([rp, dp]) => {
      if (!mounted) return
      setRolePerms(rp as RolePermRow[])
      setDeptPerms(dp as DeptPermRow[])
      setLoaded(true)
    })
    return () => { mounted = false }
  }, [])

  const role = profile?.role || 'viewer'
  const department = (profile as any)?.department || ''

  const can = (section: SectionKey | string, action: PermAction): boolean => {
    // avoid nav flicker before permissions load; deny-by-default once loaded
    if (!loaded) return action === 'view'
    return hasPermission({ role, department, rolePerms, deptPerms }, section, action)
  }

  // Back-compat helpers (existing pages use these)
  const canView = (section: SectionKey | string) => can(section, 'view')
  const canEdit = (section: SectionKey | string) => can(section, 'edit')
  const canCreate = (section: SectionKey | string) => can(section, 'create')
  const canDelete = (section: SectionKey | string) => can(section, 'delete')
  const canApprove = (section: SectionKey | string) => can(section, 'approve')

  return { role, department, loaded, can, canView, canEdit, canCreate, canDelete, canApprove }
}
