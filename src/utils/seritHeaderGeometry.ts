/**
 * Şerit (style_5) — ikizkenar ters üçgen; lacivert ↔ mercan simetrik.
 * Canvas / PDF aynı oranları kullanır (pt biriminde, contentW’ye göre ölçeklenir).
 */

export const SERIT_NAVY = '#22374F'
export const SERIT_NAVY_DARK = '#1A2B3D'
export const SERIT_GOLD = '#FFE27D'
export const SERIT_GOLD_SHADE = '#E8C86A'
export const SERIT_CORAL = '#C9675B'
export const SERIT_CORAL_LIGHT = '#D98A7E'
export const SERIT_TEST_GOLD = '#E4C14A'
export const SERIT_NUM_INK = '#5C2A24'
export const SERIT_WHITE = '#FFFFFF'

/** İnce yatay şerit yüksekliği (pt) */
export const SERIT_H_PT = 36

export type SeritGeom = {
  w: number
  h: number
  /** Lacivert üst sağ x */
  navyTop: number
  /** Lacivert alt sağ x (üçgen ucuna doğru simetrik) */
  navyBot: number
  /** Sarı ikizkenar üçgen üst sol / üst sağ */
  goldTopL: number
  goldTopR: number
  /** Sarı ters üçgen alt uç (tabanın orta noktası) */
  goldTipX: number
  /** @deprecated uyumluluk — goldTipX */
  goldBotL: number
  /** @deprecated uyumluluk — goldTipX */
  goldBotR: number
  /** Mercan sol üst / sol alt (navyBot’un cx’e göre aynası) */
  coralTop: number
  coralBot: number
  /** Beyaz ayırıcı yatay kalınlık (pt) */
  whiteT: number
  endBar: number
  endGap: number
}

/**
 * Orta: ikizkenar ▼; lacivert sağ kenar ↔ mercan sol kenar üçgene göre ayna.
 */
export function computeSeritGeom(contentW: number, h = SERIT_H_PT): SeritGeom {
  const w = Math.max(120, contentW)
  const whiteT = Math.max(2.4, Math.min(3.6, h * 0.09))
  const goldWTop = Math.max(28, Math.min(52, w * 0.065))
  const navyTop = w * 0.155
  const goldTopL = navyTop + whiteT
  const goldTopR = goldTopL + goldWTop
  const goldTipX = (goldTopL + goldTopR) / 2
  /** Üçgen sol kenarına paralel lacivert alt uç */
  const navyBot = goldTipX - whiteT
  /** Ayna: mercan sol üst / alt */
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

/** Sarı ikizkenar üçgenin optik merkezi (numara) */
export function seritNumberCenter(g: SeritGeom): { x: number; y: number } {
  return {
    x: g.goldTipX,
    y: g.h * 0.36,
  }
}

/** TEST metni — lacivert alanın ortası */
export function seritTestCenter(g: SeritGeom): { x: number; y: number } {
  return {
    x: (g.navyTop + g.navyBot) * 0.25,
    y: g.h * 0.52,
  }
}
