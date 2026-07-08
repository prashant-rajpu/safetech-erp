import { describe, it, expect } from 'vitest'
import { qrMatrix, qrSvg, _buildCodewords, _BLOCKS_M } from '../../src/lib/qr'

// Structural checks on the offline QR encoder. Full RS-syndrome and format-BCH
// verification lives in the standalone harness used during development; these
// tests guard the invariants that would break scanners if regressed.

const SAMPLE = 'SPBM-EL|00-IW01-2607M-001|Proj:P-2044|Dwg:D-1102-R0'

function matrixFor(text: string) {
  return qrMatrix(text)
}

function isFinder(m: boolean[][], top: number, left: number) {
  // 7×7 finder: dark ring border, light ring inside, 3×3 dark core
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const onBorder = r === 0 || r === 6 || c === 0 || c === 6
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
      const expected = onBorder || inCore
      if (m[top + r][left + c] !== expected) return false
    }
  }
  return true
}

describe('qrMatrix structure', () => {
  it('produces a square odd-sized matrix of a valid version size', () => {
    const m = matrixFor(SAMPLE)
    const size = m.length
    expect(size % 2).toBe(1)
    expect(size).toBeGreaterThanOrEqual(21) // version 1
    expect(size).toBeLessThanOrEqual(21 + 4 * 12) // version 13
    expect((size - 21) % 4).toBe(0)
    for (const row of m) expect(row.length).toBe(size)
  })

  it('places the three finder patterns', () => {
    const m = matrixFor(SAMPLE)
    const n = m.length
    expect(isFinder(m, 0, 0)).toBe(true)
    expect(isFinder(m, 0, n - 7)).toBe(true)
    expect(isFinder(m, n - 7, 0)).toBe(true)
  })

  it('has alternating timing patterns on row/column 6', () => {
    const m = matrixFor(SAMPLE)
    const n = m.length
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0)
      expect(m[i][6]).toBe(i % 2 === 0)
    }
  })

  it('sets the dark module', () => {
    const m = matrixFor(SAMPLE)
    const version = (m.length - 21) / 4 + 1
    expect(m[4 * version + 9][8]).toBe(true)
  })

  it('is deterministic', () => {
    expect(matrixFor(SAMPLE)).toEqual(matrixFor(SAMPLE))
  })

  it('scales version with payload length', () => {
    const short = matrixFor('A')
    const long = matrixFor('X'.repeat(250))
    expect(long.length).toBeGreaterThan(short.length)
  })
})

describe('codeword construction', () => {
  it('emits the exact total codeword count for the chosen version', () => {
    for (const text of ['A', SAMPLE, 'Y'.repeat(100)]) {
      const { codewords, version } = _buildCodewords(text)
      const [ec, g1n, g1k, g2n, g2k] = _BLOCKS_M[version]
      const total = g1n * (g1k + ec) + g2n * (g2k + ec)
      expect(codewords.length).toBe(total)
    }
  })

  it('starts with byte-mode indicator 0100', () => {
    const { codewords } = _buildCodewords(SAMPLE)
    expect(codewords[0] >> 4).toBe(0b0100)
  })
})

describe('qrSvg', () => {
  it('returns valid self-contained SVG', () => {
    const svg = qrSvg(SAMPLE, { size: 128 })
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    // No external resource loads (the xmlns namespace URI is not a fetch) — LAN-safe
    expect(svg).not.toMatch(/href=|src=|url\(/)
  })
})
