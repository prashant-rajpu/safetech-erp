import type { SectionKey } from './registry'

// ─────────────────────────────────────────────────────────────────────────────
// Permission engine — pure logic, no React/storage dependency (unit-tested).
//
// Model:
//   roles                  dynamic role catalogue (role_key)
//   permissions            action catalogue (view/create/edit/delete/approve)
//   role_permissions       role_key × section_key × 5 action flags
//   department_permissions department_key × section_key × 5 action flags
//   users                  carry role + department
//
// Effective permission = UNION of the user's role grant and department grant
// (either one granting is enough). Missing rows deny. The built-in 'admin'
// role always has full access and cannot be edited or deleted.
// ─────────────────────────────────────────────────────────────────────────────

export type PermAction = 'view' | 'create' | 'edit' | 'delete' | 'approve'

export const PERM_ACTIONS: PermAction[] = ['view', 'create', 'edit', 'delete', 'approve']

export type PermFlags = {
  can_view?: boolean
  can_create?: boolean
  can_edit?: boolean
  can_delete?: boolean
  can_approve?: boolean
}

export type RolePermRow = PermFlags & { role_key: string; section_key: string }
export type DeptPermRow = PermFlags & { department_key: string; section_key: string }

export const ADMIN_ROLE = 'admin'

/**
 * Whether a single grant row allows an action. Legacy rows (created before
 * the 5-action model) may lack the new flags: create falls back to the edit
 * grant, delete and approve default to denied — never silently wider.
 */
export function rowAllows(row: PermFlags | undefined, action: PermAction): boolean {
  if (!row) return false
  switch (action) {
    case 'view': return !!row.can_view
    case 'create': return row.can_create !== undefined ? !!row.can_create : !!row.can_edit
    case 'edit': return !!row.can_edit
    case 'delete': return !!row.can_delete
    case 'approve': return !!row.can_approve
  }
}

export type PermContext = {
  role: string
  department?: string
  rolePerms: RolePermRow[]
  deptPerms: DeptPermRow[]
}

/** Union of role grant and department grant; admin always allowed. */
export function hasPermission(ctx: PermContext, section: SectionKey | string, action: PermAction): boolean {
  if (ctx.role === ADMIN_ROLE) return true
  const roleRow = ctx.rolePerms.find(p => p.role_key === ctx.role && p.section_key === section)
  if (rowAllows(roleRow, action)) return true
  if (ctx.department) {
    const deptRow = ctx.deptPerms.find(p => p.department_key === ctx.department && p.section_key === section)
    if (rowAllows(deptRow, action)) return true
  }
  return false
}

/** Consistency rules applied when toggling a flag in the permission editors:
 *  - granting any non-view action grants view
 *  - revoking view revokes everything else                                   */
export function normalizeFlags(flags: Required<PermFlags>): Required<PermFlags> {
  const out = { ...flags }
  if (out.can_create || out.can_edit || out.can_delete || out.can_approve) out.can_view = true
  if (!out.can_view) { out.can_create = false; out.can_edit = false; out.can_delete = false; out.can_approve = false }
  return out
}
