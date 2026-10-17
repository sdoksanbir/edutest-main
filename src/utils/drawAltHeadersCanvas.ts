/**
 * Alt şablonlar: Yaprak Test (style_5), Klasik (style_8); style_6/7 geriye uyum.
 * Önizleme çizimi — PDF `alt-header-draw.ts` ile aynı yerleşim.
 */

import type { HeaderConfig } from './corporateHeaderLayout'
import { HEADER_FONT_FAMILY_CANVAS } from './corporateHeaderConstants'
import {
  KLASIK_FRAME_LINE_PT,
  KLASIK_FRAME_RADIUS_PT,
  KLASIK_TOPIC_PILL_RADIUS_PT,
  normalizeHeaderStyleId,
  STYLE_5_FIRST_H_PT,
  STYLE_6_FIRST_H_PT,
  STYLE_7_FIRST_H_PT,
} from './headerStyleIds'
import {
  KLASIK_DEFAULT_PRIMARY,
  KLASIK_FRAME_BODY_H_PT,
  KLASIK_SUBTOPIC_DOTS,
  KLASIK_TOP_PAD_PT,
  KLASIK_TOPIC_INSET_PT,
  klasikFirstPageHeaderHeightPt,
} from './klasikHeaderGeometry'
import { classicTextBaselineCanvas } from './classicBannerTopRow'
import {
  headerFieldDisplayText,
  visibleSubTopicText,
  visibleTopicText,
} from './headerFieldVisibility'
import { headerFieldColor, headerFieldUnderline } from './headerFieldFonts'
import {
  SERIT_CORAL,
  SERIT_CORAL_LIGHT,
  SERIT_GOLD,
  SERIT_GOLD_SHADE,
  SERIT_NAVY,
  SERIT_NAVY_DARK,
  SERIT_NUM_INK,
  SERIT_TEST_GOLD,
  SERIT_WHITE,
  computeSeritGeom,
  seritNumberCenter,
  seritTestCenter,
} from './seritHeaderGeometry'

const FONT = HEADER_FONT_FAMILY_CANVAS

export type AltHeaderCanvasParams = {
  ctx: CanvasRenderingContext2D
  scale: number
  ml: number
  pageWpx: number
  mr: number
  headerTopCanvas: number
  config: HeaderConfig
  styleId: string
}

function texts(config: HeaderConfig) {
  /** Görünürse kurum adı; gizli/boşsa '' (Klasik varsayılan kapalı) */
  const brand = headerFieldDisplayText(config, 'brandName').slice(0, 22)
  const subject = (headerFieldDisplayText(config, 'subject') || 'MATEMATİK').slice(0, 28)
  const topic = visibleTopicText(config).slice(0, 36)
  const subTopic = visibleSubTopicText(config).slice(0, 40)
  /** Klasik sağ damga: sınav türü (varsayılan kapalı); sınıf/test no yok */
  const badge = headerFieldDisplayText(config, 'examType').slice(0, 16)
  const primary = (config.primaryColor || '#0A1931').trim() || '#0A1931'
  const accent = (config.accentColor || '#F34A2F').trim() || '#F34A2F'
  const brandForMono = brand || 'EDUMATH'
  const letters = brandForMono.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, '')
  const mono =
    letters.length >= 4
      ? (letters[0]! + letters[Math.floor(letters.length / 2)]!).toUpperCase()
      : (letters.slice(0, 2) || 'EM').toUpperCase()
  return { brand, subject, topic, subTopic, badge, primary, accent, mono }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, rad)
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  size: number,
  weight: 'bold' | 'normal',
  family: string,
) {
  let fs = size
  const prefix = weight === 'bold' ? 'bold ' : ''
  ctx.font = `${prefix}${fs}px ${family}`
  while (fs > 7 && ctx.measureText(text).width > maxW) {
    fs -= 0.5
    ctx.font = `${prefix}${fs}px ${family}`
  }
  return fs
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  scale: number,
  fill: string,
  opts: { circle?: boolean; stroke?: string },
) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${8 * scale}px ${FONT}`
  const tw = ctx.measureText(text).width
  if (opts.circle && text.length <= 6) {
    const r = Math.max(13 * scale, tw / 2 + 7 * scale)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, cx, cy)
    ctx.restore()
    return r * 2
  }
  const h = 16 * scale
  const w = Math.max(h, tw + 14 * scale)
  const x = cx - w / 2
  const y = cy - h / 2
  roundRect(ctx, x, y, w, h, opts.stroke ? 3 * scale : h / 2)
  if (opts.stroke) {
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.lineWidth = 1.1 * scale
    ctx.strokeStyle = opts.stroke
    ctx.stroke()
    ctx.fillStyle = '#111111'
  } else {
    ctx.fillStyle = fill
    ctx.fill()
    ctx.fillStyle = '#ffffff'
  }
  ctx.fillText(text, cx, cy)
  ctx.restore()
  return w
}

function seritBits(config: HeaderConfig, t: ReturnType<typeof texts>) {
  const rawNo = headerFieldDisplayText(config, 'testNumber') || '1'
  const testNo = rawNo.replace(/^0+(?=\d)/, '').slice(0, 4) || '1'
  const testLabel = (headerFieldDisplayText(config, 'testType') || 'TEST')
    .slice(0, 8)
    .toUpperCase()
  const subject = (headerFieldDisplayText(config, 'subject') || t.subject).slice(0, 40)
  const topic = visibleTopicText(config).replace(/\s+/g, ' ').trim()
  const sub = visibleSubTopicText(config).replace(/\s+/g, ' ').trim()
  let topicLine = ''
  if (topic && sub) topicLine = `${topic} - ${sub}`
  else topicLine = topic || sub
  topicLine = topicLine.slice(0, 90)
  const grade = (
    (config.gradeLevel || '').trim() ||
    headerFieldDisplayText(config, 'examType') ||
    t.badge ||
    'SINIF'
  ).slice(0, 18)
  return { testNo, testLabel, subject, topicLine, grade }
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  color: string,
) {
  if (pts.length < 3) return
  ctx.beginPath()
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i]!.x, pts[i]!.y)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

/** Referans görsel — tek yatay geometrik şerit */
function drawSerit(p: AltHeaderCanvasParams, t: ReturnType<typeof texts>) {
  const { ctx, scale: s, ml, headerTopCanvas: y0 } = p
  const contentW = (p.pageWpx - ml - p.mr) / s
  const g = computeSeritGeom(contentW, STYLE_5_FIRST_H_PT)
  const bits = seritBits(p.config, t)
  const ox = ml
  const oy = y0
  const sx = (x: number) => ox + x * s
  const sy = (y: number) => oy + y * s
  const pt = (x: number, y: number) => ({ x: sx(x), y: sy(y) })

  ctx.save()
  ctx.beginPath()
  ctx.rect(ox, oy, g.w * s, g.h * s)
  ctx.clip()

  // 1) Mercan zemin — yatay iki eşit şerit: üst açık, alt koyu
  const coralMidY = g.h * 0.5
  const coralMidX = g.coralTop + (g.coralBot - g.coralTop) * 0.5
  fillPoly(
    ctx,
    [
      pt(coralMidX, coralMidY),
      pt(g.w, coralMidY),
      pt(g.w, g.h),
      pt(g.coralBot, g.h),
    ],
    SERIT_CORAL,
  )
  fillPoly(
    ctx,
    [
      pt(g.coralTop, 0),
      pt(g.w, 0),
      pt(g.w, coralMidY),
      pt(coralMidX, coralMidY),
    ],
    SERIT_CORAL_LIGHT,
  )

  // 2) Lacivert TEST alanı
  fillPoly(
    ctx,
    [pt(0, 0), pt(g.navyTop, 0), pt(g.navyBot, g.h), pt(0, g.h)],
    SERIT_NAVY,
  )
  // Koyu lacivert üst katman
  fillPoly(
    ctx,
    [
      pt(0, 0),
      pt(g.navyTop * 0.72, 0),
      pt(g.navyTop * 0.28, g.h * 0.62),
      pt(0, g.h * 0.5),
    ],
    SERIT_NAVY_DARK,
  )

  // 3) Beyaz ayırıcılar — üçgen kenarlarına paralel (simetrik)
  const tip = g.goldTipX
  fillPoly(
    ctx,
    [
      pt(g.navyTop, 0),
      pt(g.goldTopL, 0),
      pt(tip, g.h),
      pt(g.navyBot, g.h),
    ],
    SERIT_WHITE,
  )
  fillPoly(
    ctx,
    [
      pt(g.goldTopR, 0),
      pt(g.coralTop, 0),
      pt(g.coralBot, g.h),
      pt(tip, g.h),
    ],
    SERIT_WHITE,
  )

  // 4) Sarı ikizkenar ters üçgen + sol gölge yarısı
  fillPoly(
    ctx,
    [pt(g.goldTopL, 0), pt(g.goldTopR, 0), pt(tip, g.h)],
    SERIT_GOLD,
  )
  fillPoly(
    ctx,
    [
      pt(g.goldTopL, 0),
      pt(tip, 0),
      pt(tip, g.h),
    ],
    SERIT_GOLD_SHADE,
  )

  // 5) Sağ bitiş: ince beyaz + lacivert
  const endX = g.w - g.endBar
  ctx.fillStyle = SERIT_WHITE
  ctx.fillRect(sx(endX - g.endGap), oy, g.endGap * s, g.h * s)
  ctx.fillStyle = SERIT_NAVY
  ctx.fillRect(sx(endX), oy, g.endBar * s, g.h * s)

  // TEST — yatay, harf aralıklı
  const tc = seritTestCenter(g)
  const label = bits.testLabel || 'TEST'
  ctx.fillStyle = SERIT_TEST_GOLD
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const testSize = Math.min(11 * s, g.h * s * 0.38)
  ctx.font = `700 ${testSize}px ${FONT}`
  const chars = label.split('')
  const gap = testSize * 0.55
  const totalW =
    chars.reduce((acc, ch) => acc + ctx.measureText(ch).width, 0) +
    gap * Math.max(0, chars.length - 1)
  let cx = sx(tc.x) - totalW / 2
  const cy = sy(tc.y)
  for (const ch of chars) {
    const cw = ctx.measureText(ch).width
    ctx.fillText(ch, cx + cw / 2, cy)
    cx += cw + gap
  }

  // Numara
  const nc = seritNumberCenter(g)
  ctx.fillStyle = SERIT_NUM_INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const noSize = Math.min(16 * s, g.h * s * 0.58)
  fitFont(ctx, bits.testNo, (g.goldTopR - g.goldTopL + 10) * s, noSize, 'bold', FONT)
  ctx.fillText(bits.testNo, sx(nc.x), sy(nc.y))

  // Mercan alan: ders + konu sayfa ortasında; sınıf sağda
  const endPad = (g.endBar + g.endGap + 6) * s
  const gradeMax = Math.min(90 * s, g.w * s * 0.22)
  const pageMidX = sx(g.w / 2)
  const midMax = Math.max(48 * s, g.w * s * 0.52)
  // Üst açık mercan bandı ortası (ders); alt koyu mercan bandı ortası (konu)
  const ySubject = g.h * 0.25
  const yTopic = g.h * 0.75
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.fillStyle = SERIT_WHITE
  fitFont(ctx, bits.grade, gradeMax, Math.min(9 * s, g.h * s * 0.28), 'bold', FONT)
  ctx.fillText(bits.grade, sx(g.w) - endPad, sy(ySubject))

  ctx.textAlign = 'center'
  if (bits.subject) {
    ctx.fillStyle = headerFieldColor(p.config, 'subject', SERIT_WHITE)
    fitFont(ctx, bits.subject, midMax, Math.min(10 * s, g.h * s * 0.3), 'bold', FONT)
    ctx.fillText(bits.subject, pageMidX, sy(ySubject))
  }
  if (bits.topicLine) {
    ctx.fillStyle = headerFieldColor(p.config, 'topic', SERIT_WHITE)
    fitFont(ctx, bits.topicLine, midMax, Math.min(9.5 * s, g.h * s * 0.28), 'bold', FONT)
    ctx.fillText(bits.topicLine, pageMidX, sy(yTopic))
  }

  ctx.restore()
}

function drawCift(p: AltHeaderCanvasParams, t: ReturnType<typeof texts>) {
  const { ctx, scale: s, ml, headerTopCanvas: y0 } = p
  const w = p.pageWpx - ml - p.mr
  const navy = 18 * s
  const mid = 28 * s
  const gray = 18 * s
  ctx.fillStyle = t.primary
  ctx.fillRect(ml, y0, w, navy)
  ctx.fillStyle = t.accent
  ctx.fillRect(ml, y0 + navy, w, mid)
  ctx.fillStyle = '#ececec'
  ctx.fillRect(ml, y0 + navy + mid, w, gray)

  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  const brandLabel = t.brand || 'EDUMATH'
  fitFont(ctx, brandLabel, w * 0.62, 13 * s, 'bold', FONT)
  ctx.fillText(brandLabel, ml + 10 * s, y0 + navy / 2)

  ctx.font = `bold ${8 * s}px ${FONT}`
  const bw = ctx.measureText(t.badge).width + 16 * s
  const bh = 12 * s
  const bx = ml + w - bw - 8 * s
  const by = y0 + (navy - bh) / 2
  roundRect(ctx, bx, by, bw, bh, bh / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.fillStyle = t.primary
  ctx.textAlign = 'center'
  ctx.fillText(t.badge, bx + bw / 2, by + bh / 2)

  ctx.fillStyle = '#ffffff'
  const subSize = fitFont(ctx, t.subject, w - 20 * s, 20 * s, 'bold', FONT)
  ctx.textAlign = 'center'
  ctx.fillText(t.subject, ml + w / 2, y0 + navy + mid / 2 + subSize * 0.02)

  if (t.topic) {
    ctx.fillStyle = '#111111'
    ctx.textAlign = 'left'
    fitFont(ctx, t.topic, w - 20 * s, 11 * s, 'bold', FONT)
    ctx.fillText(t.topic, ml + 10 * s, y0 + navy + mid + gray / 2)
  }
}

function drawRozet(p: AltHeaderCanvasParams, t: ReturnType<typeof texts>) {
  const { ctx, scale: s, ml, headerTopCanvas: y0 } = p
  const w = p.pageWpx - ml - p.mr
  const h = STYLE_7_FIRST_H_PT * s
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(ml, y0, w, h)
  ctx.strokeStyle = t.primary
  ctx.lineWidth = 1.4 * s
  ctx.beginPath()
  ctx.moveTo(ml, y0 + 1 * s)
  ctx.lineTo(ml + w, y0 + 1 * s)
  ctx.stroke()

  const tile = 28 * s
  const tileY = y0 + 8 * s
  roundRect(ctx, ml + 2 * s, tileY, tile, tile, 6 * s)
  ctx.fillStyle = t.primary
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${12 * s}px ${FONT}`
  ctx.fillText(t.mono, ml + 2 * s + tile / 2, tileY + tile / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = t.primary
  ctx.font = `bold ${7 * s}px ${FONT}`
  ctx.fillText(t.brand, ml + 2 * s, tileY + tile + 3 * s)

  const badgeW = 46 * s
  const pillX = ml + tile + 12 * s
  const pillMax = w - (pillX - ml) - badgeW - 16 * s
  ctx.font = `bold ${16 * s}px ${FONT}`
  const subW = Math.min(pillMax, ctx.measureText(t.subject).width + 22 * s)
  const pillH = 26 * s
  const pillY = y0 + 10 * s
  roundRect(ctx, pillX, pillY, Math.max(subW, 40 * s), pillH, pillH / 2)
  ctx.fillStyle = t.accent
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fitFont(ctx, t.subject, Math.max(subW, 40 * s) - 16 * s, 15 * s, 'bold', FONT)
  ctx.fillText(t.subject, pillX + Math.max(subW, 40 * s) / 2, pillY + pillH / 2)

  if (t.topic) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = t.primary
    const topicSize = fitFont(ctx, t.topic, pillMax, 10 * s, 'bold', FONT)
    const topicY = pillY + pillH + 4 * s
    ctx.fillText(t.topic, pillX + 4 * s, topicY)
    const tw = ctx.measureText(t.topic).width
    ctx.strokeStyle = t.accent
    ctx.lineWidth = 2 * s
    ctx.beginPath()
    ctx.moveTo(pillX + 4 * s, topicY + topicSize + 2 * s)
    ctx.lineTo(pillX + 4 * s + Math.min(tw, 70 * s), topicY + topicSize + 2 * s)
    ctx.stroke()
  }

  drawBadge(ctx, t.badge, ml + w - 8 * s - badgeW / 2, y0 + h * 0.42, s, t.primary, {})
}

function drawKlasik(p: AltHeaderCanvasParams, t: ReturnType<typeof texts>) {
  const { ctx, scale: s, ml, headerTopCanvas: y0, config } = p
  const w = p.pageWpx - ml - p.mr
  const hPt = klasikFirstPageHeaderHeightPt(config)
  const h = hPt * s
  /** PDF Arial/Helvetica ile aynı metrik — önizleme ≠ PDF farkını azaltır */
  const fontFamily = HEADER_FONT_FAMILY_CANVAS
  const ink =
    (config.primaryColor || '').trim() || KLASIK_DEFAULT_PRIMARY
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(ml, y0, w, h)
  const y1 = y0 + KLASIK_TOP_PAD_PT * s
  const frameH = KLASIK_FRAME_BODY_H_PT * s
  const y2 = y1 + frameH
  const frameR = Math.min(KLASIK_FRAME_RADIUS_PT * s, w / 2, frameH / 2)
  const midY = y1 + frameH / 2
  const inset = KLASIK_TOPIC_INSET_PT * s
  ctx.strokeStyle = ink
  ctx.lineWidth = KLASIK_FRAME_LINE_PT * s
  roundRect(ctx, ml, y1, w, frameH, frameR)
  ctx.stroke()

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = ink

  // Orta: konu — dış çerçeve içinde üst/alt boşluklu kutu (sol kurum adı yok)
  const centerTitle = (t.topic || '').trim()
  if (centerTitle) {
    const maxPillH = Math.max(12 * s, frameH - inset * 2)
    let titleSize = fitFont(ctx, centerTitle, w * 0.42, 12 * s, 'bold', fontFamily)
    const padX = 12 * s
    let padY = 4.5 * s
    let pillH = titleSize + padY * 2
    if (pillH > maxPillH) {
      padY = Math.max(2 * s, (maxPillH - titleSize) / 2)
      pillH = titleSize + padY * 2
      if (pillH > maxPillH) {
        titleSize = Math.max(8 * s, maxPillH - 4 * s)
        ctx.font = `bold ${titleSize}px ${fontFamily}`
        padY = Math.max(2 * s, (maxPillH - titleSize) / 2)
        pillH = Math.min(maxPillH, titleSize + padY * 2)
      }
    }
    const tw = ctx.measureText(centerTitle).width
    const pillW = tw + padX * 2
    const pillX = ml + (w - pillW) / 2
    const pillY = midY - pillH / 2
    const pillMidY = pillY + pillH / 2
    const pillR = Math.min(KLASIK_TOPIC_PILL_RADIUS_PT * s, pillH / 2)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.1 * s
    roundRect(ctx, pillX, pillY, pillW, pillH, pillR)
    ctx.fill()
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(
      centerTitle,
      ml + w / 2,
      classicTextBaselineCanvas(pillMidY, titleSize),
    )
  }

  // Sağ: sınav türü — varsayılan kapalı
  if (t.badge) {
    const bSize = 7.5 * s
    ctx.font = `bold ${bSize}px ${fontFamily}`
    const stampW = Math.max(28 * s, 10 * s + ctx.measureText(t.badge).width)
    const stampH = Math.min(16 * s, frameH - inset * 2)
    const sx = ml + w - stampW - 6 * s
    const sy = midY - stampH / 2
    const stampMidY = sy + stampH / 2
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.0 * s
    roundRect(ctx, sx, sy, stampW, stampH, 3 * s)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = ink
    ctx.fillText(
      t.badge,
      sx + stampW / 2,
      classicTextBaselineCanvas(stampMidY, bSize),
    )
  }

  // Alt: alt konu — yanlarda 5 nokta; varsayılan altı çizili
  if (t.subTopic) {
    const dots = KLASIK_SUBTOPIC_DOTS
    const gap = '  '
    const label = `${dots}${gap}${t.subTopic}${gap}${dots}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const subSize = fitFont(ctx, label, w - 20 * s, 9 * s, 'normal', fontFamily)
    const subY = y2 + 5 * s
    ctx.fillStyle = ink
    ctx.fillText(label, ml + w / 2, subY)
    if (headerFieldUnderline(config, 'subTopic', true)) {
      const textW = ctx.measureText(t.subTopic).width
      const lineY = subY + subSize + 2.5 * s
      ctx.strokeStyle = ink
      ctx.lineWidth = Math.max(0.7 * s, 0.9)
      ctx.beginPath()
      ctx.moveTo(ml + w / 2 - textW / 2, lineY)
      ctx.lineTo(ml + w / 2 + textW / 2, lineY)
      ctx.stroke()
    }
  }
}

export function drawAltHeaderCanvas(p: AltHeaderCanvasParams): number {
  const id = normalizeHeaderStyleId(p.styleId)
  const t = texts(p.config)
  switch (id) {
    case 'style_5':
      drawSerit(p, t)
      return STYLE_5_FIRST_H_PT
    case 'style_6':
      drawCift(p, t)
      return STYLE_6_FIRST_H_PT
    case 'style_7':
      drawRozet(p, t)
      return STYLE_7_FIRST_H_PT
    case 'style_8':
      drawKlasik(p, t)
      return klasikFirstPageHeaderHeightPt(p.config)
    default:
      return 0
  }
}
