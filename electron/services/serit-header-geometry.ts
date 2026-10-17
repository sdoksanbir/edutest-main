/**
 * Şerit / Yaprak Test (style_5) — src/utils/seritHeaderGeometry.ts ile aynı.
 */

export const SERIT_H_PT = 36
export const SERIT_CORAL = '#C9675B'

export type SeritGeom = {
  w: number
  h: number
  navyTop: number
  navyBot: number
  goldTopL: number
  goldTopR: number
  goldTipX: number
  goldBotL: number
  goldBotR: number
  coralTop: number
  coralBot: number
  whiteT: number
  endBar: number
  endGap: number
}

export function computeSeritGeom(contentW: number, h = SERIT_H_PT): SeritGeom {
  const w = Math.max(120, contentW)
  const whiteT = Math.max(2.4, Math.min(3.6, h * 0.09))
  const goldWTop = Math.max(28, Math.min(52, w * 0.065))
  const navyTop = w * 0.155
  const goldTopL = navyTop + whiteT
  const goldTopR = goldTopL + goldWTop
  const goldTipX = (goldTopL + goldTopR) / 2
  const navyBot = goldTipX - whiteT
  const coralTop = goldTopR + whiteT
  const coralBot = goldTipX + whiteT
  return {
    w,
    h,
    navyTop,
    navyBot,
    goldTopL,
    goldTopR,
    goldTipX,
    goldBotL: goldTipX,
    goldBotR: goldTipX,
    coralTop,
    coralBot,
    whiteT,
    endBar: 1.6,
    endGap: 1.2,
  }
}

export function seritTitleMaxWidth(g: SeritGeom): number {
  return Math.max(40, g.w - g.coralTop - g.endBar - g.endGap - 16)
}

export function seritTitleStartX(g: SeritGeom): number {
  return g.coralTop + 10
}

export function seritNumberCenter(g: SeritGeom): { x: number; y: number } {
  return {
    x: g.goldTipX,
    y: g.h * 0.36,
  }
}

export function seritTestCenter(g: SeritGeom): { x: number; y: number } {
  return {
    x: (g.navyTop + g.navyBot) * 0.25,
    y: g.h * 0.52,
  }
}

export function polyPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return ''
  const [first, ...rest] = pts
  return [
    `M ${first!.x},${first!.y}`,
    ...rest.map((p) => `L ${p.x},${p.y}`),
    'Z',
  ].join(' ')
}
