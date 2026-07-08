import { describe, it, expect } from 'vitest'
import { MODULES, NAV_SECTIONS, getModule } from '../../src/lib/erp/registry'

// Guards the ERP's structural contract: every navigation link must resolve,
// module ids must be unique, and the mandated scope exclusions must hold.

const EXCLUDED_DOMAINS = /finance|accounting|payroll|billing|taxation|procurement|invoice/i

describe('module registry', () => {
  it('has unique module ids', () => {
    const ids = MODULES.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every module has a table, title, section and at least one field', () => {
    for (const m of MODULES) {
      expect(m.table, m.id).toBeTruthy()
      expect(m.title, m.id).toBeTruthy()
      expect(m.section, m.id).toBeTruthy()
      expect(m.fields.length, m.id).toBeGreaterThan(0)
    }
  })

  it('contains no excluded business domains (scope mandate)', () => {
    for (const m of MODULES) {
      expect(m.title).not.toMatch(EXCLUDED_DOMAINS)
      expect(m.table).not.toMatch(EXCLUDED_DOMAINS)
    }
    for (const s of NAV_SECTIONS) {
      expect(s.name).not.toMatch(EXCLUDED_DOMAINS)
      for (const item of s.items) expect(item.name).not.toMatch(EXCLUDED_DOMAINS)
    }
  })
})

describe('navigation integrity', () => {
  it('has all 11 mandated sections', () => {
    expect(NAV_SECTIONS.map(s => s.key)).toEqual([
      'dashboard', 'master', 'design', 'planning', 'production',
      'qaqc', 'stockyard', 'dispatch', 'logistics', 'reports', 'admin'
    ])
  })

  it('every /m/<id> nav link resolves to a defined module', () => {
    for (const s of NAV_SECTIONS) {
      for (const item of s.items) {
        const match = item.path.match(/^\/m\/([a-z0-9-]+)$/)
        if (match) {
          expect(getModule(match[1]), `${s.name} → ${item.name}`).toBeTruthy()
        }
      }
    }
  })

  it('has no duplicate paths within a section', () => {
    for (const s of NAV_SECTIONS) {
      const paths = s.items.map(i => i.path)
      expect(new Set(paths).size, s.name).toBe(paths.length)
    }
  })

  it('Master Data offers the 12 mandated masters', () => {
    const master = NAV_SECTIONS.find(s => s.key === 'master')!
    expect(master.items.length).toBe(12)
  })
})
