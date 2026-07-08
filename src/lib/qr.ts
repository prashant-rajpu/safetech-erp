// ─────────────────────────────────────────────────────────────────────────────
// Self-contained QR Code generator (byte mode, EC level M, versions 1–13).
// No network or npm dependency — labels must work on a pure LAN deployment.
// Returns an SVG string; use qrSvg() for printable element labels, gate
// passes, and document headers.
// ─────────────────────────────────────────────────────────────────────────────

// GF(256) tables, primitive polynomial 0x11D
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

// Reed-Solomon generator polynomial of given degree
function rsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i])
      next[j + 1] ^= poly[j]
    }
    poly = next
  }
  return poly.reverse()
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen)
  const res = new Uint8Array(data.length + ecLen)
  res.set(data)
  for (let i = 0; i < data.length; i++) {
    const factor = res[i]
    if (factor === 0) continue
    for (let j = 1; j < gen.length; j++) {
      res[i + j] ^= gfMul(gen[j], factor)
    }
  }
  return Array.from(res.slice(data.length))
}

// EC level M block structure per version: [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]
const BLOCKS_M: Record<number, [number, number, number, number, number]> = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],
  8: [22, 2, 38, 2, 39],
  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
  11: [30, 1, 50, 4, 51],
  12: [22, 6, 36, 2, 37],
  13: [22, 8, 37, 1, 38]
}

const ALIGNMENT: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 52],
  11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62]
}

function dataCapacityBytes(version: number): number {
  const [ec, g1b, g1d, g2b, g2d] = BLOCKS_M[version]
  const dataCW = g1b * g1d + g2b * g2d
  const countBits = version <= 9 ? 8 : 16
  // mode(4) + count + terminator(<=4) must fit alongside 8*len
  return Math.floor((dataCW * 8 - 4 - countBits - 4) / 8) + 0
}

function pickVersion(len: number): number {
  for (let v = 1; v <= 13; v++) {
    if (dataCapacityBytes(v) >= len) return v
  }
  throw new Error(`QR payload too long (${len} bytes; max ${dataCapacityBytes(13)})`)
}

class BitBuffer {
  bits: number[] = []
  push(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((val >> i) & 1)
  }
}

function buildCodewords(text: string): { version: number; codewords: number[] } {
  const bytes: number[] = []
  // UTF-8 encode
  for (const ch of unescape(encodeURIComponent(text))) bytes.push(ch.charCodeAt(0))
  const version = pickVersion(bytes.length)
  const [ecPerBlock, g1b, g1d, g2b, g2d] = BLOCKS_M[version]
  const totalDataCW = g1b * g1d + g2b * g2d

  const buf = new BitBuffer()
  buf.push(0b0100, 4) // byte mode
  buf.push(bytes.length, version <= 9 ? 8 : 16)
  for (const b of bytes) buf.push(b, 8)
  // terminator
  const capacityBits = totalDataCW * 8
  buf.push(0, Math.min(4, capacityBits - buf.bits.length))
  while (buf.bits.length % 8 !== 0) buf.bits.push(0)
  const data: number[] = []
  for (let i = 0; i < buf.bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | buf.bits[i + j]
    data.push(byte)
  }
  const pads = [0xec, 0x11]
  let p = 0
  while (data.length < totalDataCW) data.push(pads[p++ % 2])

  // split into blocks
  const blocks: number[][] = []
  let offset = 0
  for (let i = 0; i < g1b; i++) { blocks.push(data.slice(offset, offset + g1d)); offset += g1d }
  for (let i = 0; i < g2b; i++) { blocks.push(data.slice(offset, offset + g2d)); offset += g2d }
  const ecBlocks = blocks.map(b => rsEncode(b, ecPerBlock))

  // interleave
  const codewords: number[] = []
  const maxData = Math.max(g1d, g2d)
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) codewords.push(b[i])
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of ecBlocks) codewords.push(b[i])
  }
  return { version, codewords }
}

type Matrix = (0 | 1 | null)[][]

function buildMatrix(version: number, codewords: number[], mask: number): (0 | 1)[][] {
  const size = 17 + version * 4
  const m: Matrix = Array.from({ length: size }, () => Array(size).fill(null))
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  const setFn = (r: number, c: number, v: 0 | 1) => { m[r][c] = v; reserved[r][c] = true }

  // finder + separators
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r, cc = c0 + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const onRing = inOuter && (r === 0 || r === 6 || c === 0 || c === 6)
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
        setFn(rr, cc, (onRing || inCore) ? 1 : 0)
      }
    }
  }
  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // alignment patterns
  const centers = ALIGNMENT[version]
  for (const cr of centers) {
    for (const cc of centers) {
      // skip overlaps with finders
      if ((cr <= 8 && cc <= 8) || (cr <= 8 && cc >= size - 9) || (cr >= size - 9 && cc <= 8)) continue
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const on = Math.max(Math.abs(r), Math.abs(c)) !== 1
          setFn(cr + r, cc + c, on ? 1 : 0)
        }
      }
    }
  }

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) setFn(6, i, (i % 2 === 0 ? 1 : 0))
    if (!reserved[i][6]) setFn(i, 6, (i % 2 === 0 ? 1 : 0))
  }

  // dark module
  setFn(size - 8, 8, 1)

  // reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; m[8][i] = 0 }
    if (!reserved[i][8]) { reserved[i][8] = true; m[i][8] = 0 }
    if (!reserved[8][size - 1 - i] && i <= 7) { reserved[8][size - 1 - i] = true; m[8][size - 1 - i] = 0 }
    if (!reserved[size - 1 - i][8] && i <= 6) { reserved[size - 1 - i][8] = true; m[size - 1 - i][8] = 0 }
  }

  // version info (v >= 7)
  if (version >= 7) {
    let vInfo = version << 12
    let rem = version << 12
    for (let i = 17; i >= 12; i--) {
      if (rem & (1 << i)) rem ^= 0x1f25 << (i - 12)
    }
    vInfo |= rem
    for (let i = 0; i < 18; i++) {
      const bit = ((vInfo >> i) & 1) as 0 | 1
      const r = Math.floor(i / 3)
      const c = size - 11 + (i % 3)
      setFn(r, c, bit)
      setFn(c, r, bit)
    }
  }

  // place data bits (zigzag)
  const maskFns: Array<(r: number, c: number) => boolean> = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ]
  const maskFn = maskFns[mask]

  let bitIdx = 0
  const totalBits = codewords.length * 8
  let col = size - 1
  let upward = true
  while (col > 0) {
    if (col === 6) col-- // skip vertical timing column
    for (let i = 0; i < size; i++) {
      const r = upward ? size - 1 - i : i
      for (const cc of [col, col - 1]) {
        if (reserved[r][cc]) continue
        let bit = 0
        if (bitIdx < totalBits) {
          bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1
        }
        bitIdx++
        if (maskFn(r, cc)) bit ^= 1
        m[r][cc] = bit as 0 | 1
      }
    }
    upward = !upward
    col -= 2
  }

  // format info (EC M = 00, plus mask)
  let fmt = (0b00 << 3) | mask
  let fRem = fmt << 10
  for (let i = 14; i >= 10; i--) {
    if (fRem & (1 << i)) fRem ^= 0x537 << (i - 10)
  }
  const fmtBits = (((fmt << 10) | fRem) ^ 0x5412)
  const fmtBit = (i: number) => ((fmtBits >> i) & 1) as 0 | 1
  // around top-left finder
  const coordsA: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ]
  for (let i = 0; i < 15; i++) {
    const [r, c] = coordsA[i]
    m[r][c] = fmtBit(14 - i)
  }
  // split copy: bottom-left + top-right
  for (let i = 0; i < 7; i++) m[size - 1 - i][8] = fmtBit(14 - i)
  for (let i = 7; i < 15; i++) m[8][size - 15 + i] = fmtBit(14 - i)

  return m as (0 | 1)[][]
}

function penalty(m: (0 | 1)[][]): number {
  const size = m.length
  let score = 0
  // rule 1: runs of same color
  for (let pass = 0; pass < 2; pass++) {
    for (let r = 0; r < size; r++) {
      let run = 1
      for (let c = 1; c < size; c++) {
        const cur = pass === 0 ? m[r][c] : m[c][r]
        const prev = pass === 0 ? m[r][c - 1] : m[c - 1][r]
        if (cur === prev) {
          run++
          if (run === 5) score += 3
          else if (run > 5) score += 1
        } else run = 1
      }
    }
  }
  // rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c]
      if (m[r][c + 1] === v && m[r + 1][c] === v && m[r + 1][c + 1] === v) score += 3
    }
  }
  // rule 3: finder-like pattern 1011101 with 4 light on either side
  const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
  const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      let m1 = true, m2 = true, m3 = true, m4 = true
      for (let i = 0; i < 11; i++) {
        if (m[r][c + i] !== pat1[i]) m1 = false
        if (m[r][c + i] !== pat2[i]) m2 = false
        if (m[c + i]?.[r] !== pat1[i]) m3 = false
        if (m[c + i]?.[r] !== pat2[i]) m4 = false
      }
      if (m1) score += 40
      if (m2) score += 40
      if (m3) score += 40
      if (m4) score += 40
    }
  }
  // rule 4: dark ratio deviation from 50%
  let dark = 0
  for (const row of m) for (const v of row) dark += v
  const pct = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(pct - 50) / 5) * 10
  return score
}

// Exposed for the encoder self-test — not part of the app-facing API.
export { buildCodewords as _buildCodewords, BLOCKS_M as _BLOCKS_M }

/** Boolean module matrix for the given text (true = dark). */
export function qrMatrix(text: string): boolean[][] {
  const { version, codewords } = buildCodewords(text)
  let best: (0 | 1)[][] | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const candidate = buildMatrix(version, codewords, mask)
    const s = penalty(candidate)
    if (s < bestScore) {
      bestScore = s
      best = candidate
    }
  }
  return best!.map(row => row.map(v => v === 1))
}

export type QrSvgOptions = {
  size?: number      // rendered width/height in px (default 96)
  margin?: number    // quiet zone in modules (default 2)
  dark?: string      // module color (default #000)
  light?: string     // background (default #fff)
}

/** Standalone SVG markup for the QR code — safe to inline into printed docs. */
export function qrSvg(text: string, opts: QrSvgOptions = {}): string {
  const { size = 96, margin = 2, dark = '#000000', light = '#ffffff' } = opts
  const matrix = qrMatrix(text)
  const n = matrix.length + margin * 2
  let path = ''
  matrix.forEach((row, r) => {
    row.forEach((on, c) => {
      if (on) path += `M${c + margin} ${r + margin}h1v1h-1z`
    })
  })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
    `<rect width="${n}" height="${n}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/>` +
    `</svg>`
  )
}

/** data: URI form, handy for <img> tags inside print templates. */
export function qrDataUri(text: string, opts: QrSvgOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(text, opts))}`
}
