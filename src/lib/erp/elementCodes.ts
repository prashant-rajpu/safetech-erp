// ─────────────────────────────────────────────────────────────────────────────
// Plant element-code generation — the single source of truth for the
// "00-<MARK><NN>-<YYMM>M-<serial>" format (e.g. 00-IW01-2502M-002).
// Shared by CastingSchedulePage.tsx and CastBedPlanPage.tsx so both entry
// points into casting planning produce identical, non-colliding codes.
// ─────────────────────────────────────────────────────────────────────────────

// Element mark prefix by element type — matches existing plant code style.
const TYPE_MARK: Record<string, string> = {
  'WL/PC': 'IW', 'WL': 'IW', 'HCS': 'HC', 'BW': 'BW', 'CL': 'CL', 'BM': 'BM'
}

/** Generate `qty` unique element codes in plant format for the given drawing. */
export function generateElementCodes(
  drawing: any,
  qty: number,
  existingCodes: Set<string>,
  drawings: any[]
): string[] {
  const mark = TYPE_MARK[drawing?.element_type] || 'EL'
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  // per-mark group number derived from drawing sequence within project
  const sameType = drawings.filter(d => d.project_no === drawing.project_no && d.element_type === drawing.element_type)
  const groupNo = String(Math.max(1, sameType.findIndex(d => d.drawing_no === drawing.drawing_no) + 1)).padStart(2, '0')
  const codes: string[] = []
  let serial = existingCodes.size + 1
  while (codes.length < qty) {
    const code = `00-${mark}${groupNo}-${yymm}M-${String(serial).padStart(3, '0')}`
    if (!existingCodes.has(code)) codes.push(code)
    serial++
  }
  return codes
}
