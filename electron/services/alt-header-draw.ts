/**
 * Deneme şablonları — PDF. Önizleme `drawAltHeadersCanvas.ts` ile aynı yerleşim.
 */

import { rgb, type PDFDocument, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import type { HeaderConfig } from './corporate-header-layout.js'
import {
  KLASIK_FRAME_LINE_PT,
  KLASIK_FRAME_RADIUS_PT,
  KLASIK_TOPIC_PILL_RADIUS_PT,
  normalizeHeaderStyleId,
  STYLE_5_FIRST_H_PT,
  STYLE_6_FIRST_H_PT,
  STYLE_7_FIRST_H_PT,
} from './header-styles.js'
import {
  KLASIK_DEFAULT_PRIMARY,
  KLASIK_FRAME_BODY_H_PT,
  KLASIK_SUBTOPIC_DOTS,
  KLASIK_TOP_PAD_PT,
  KLASIK_TOPIC_INSET_PT,
  klasikFirstPageHeaderHeightPt,
} from './klasik-header-geometry.js'
import { classicTextBaselinePdf } from './classic-banner-top-row.js'
import { headerFieldUnderline } from './header-field-fonts.js'
import {
  headerFieldDisplayText,
  visibleSubTopicText,
  visibleTopicText,
} from './header-field-visibility.js'
import { headerFieldColor } from './header-field-fonts.js'
import {
  computeSeritGeom,
  polyPath,
  seritNumberCenter,
  seritTestCenter,
} from './serit-header-geometry.js'

function hex(color: string): RGB {
  const s = (color || '').trim().replace(/^#/, '')
  if (s.length !== 6) return rgb(0.04, 0.1, 0.19)
  return rgb(
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  )
}

function texts(config: HeaderConfig) {
  /** Görünürse kurum adı; gizli/boşsa '' (Klasik varsayılan kapalı) */
  const brand = headerFieldDisplayText(config, 'brandName').slice(0, 22)
  const subject = (headerFieldDisplayText(config, 'subject') || 'MATEMATİK').slice(0, 28)
  const topic = visibleTopicText(config).slice(0, 36)
  const subTopic = visibleSubTopicText(config).slice(0, 40)
  /** Klasik sağ damga: sınav türü (varsayılan kapalı) */
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

/** Canvas roundRect ile aynı dairesel köşe (cubic ≈ arc) */
const ROUND_BEZIER_K = 0.5522847498

function roundPath(w: number, h: number, r: number): string {
  const rad = Math.min(r, w / 2, h / 2)
  if (rad <= 0) {
    return `M 0,0 L ${w},0 L ${w},${h} L 0,${h} Z`
  }
  const k = ROUND_BEZIER_K * rad
  return [
    `M ${rad},0`,
    `L ${w - rad},0`,
    `C ${w - rad + k},0 ${w},${rad - k} ${w},${rad}`,
    `L ${w},${h - rad}`,
    `C ${w},${h - rad + k} ${w - rad + k},${h} ${w - rad},${h}`,
    `L ${rad},${h}`,
    `C ${rad - k},${h} 0,${h - rad + k} 0,${h - rad}`,
    `L 0,${rad}`,
    `C 0,${rad - k} ${rad - k},0 ${rad},0`,
    'Z',
  ].join(' ')
}

/** Dolgu + çerçeve ayrı — pdf-lib fill+border birlikte güvenilir değil */
function drawRoundRectPdf(
  page: PDFPage,
  x: number,
  yTop: number,
  w: number,
  h: number,
  r: number,
  opts: { fill?: RGB; stroke?: RGB; strokeWidth?: number },
) {
  const path = roundPath(w, h, r)
  if (opts.fill) {
    page.drawSvgPath(path, { x, y: yTop, color: opts.fill, borderWidth: 0 })
  }
  if (opts.stroke && (opts.strokeWidth ?? 0) > 0) {
    page.drawSvgPath(path, {
      x,
      y: yTop,
      borderColor: opts.stroke,
      borderWidth: opts.strokeWidth,
    })
  }
}

function fitSize(font: PDFFont, text: string, maxW: number, size: number) {
  let fs = size
  while (fs > 7 && font.widthOfTextAtSize(text, fs) > maxW) fs -= 0.5
  return fs
}

function baseline(bottom: number, height: number, size: number) {
  return bottom + height / 2 - size * 0.35
}

export async function drawAltHeaderPdf(
  pdf: PDFDocument,
  page: PDFPage,
  config: HeaderConfig,
  geom: { page_w_pt: number; page_h_pt: number; ml: number; mr: number },
  mt: number,
  fonts: { regular: PDFFont; bold: PDFFont },
  styleId: string,
) {
  const id = normalizeHeaderStyleId(styleId)
  const t = texts(config)
  const contentW = geom.page_w_pt - geom.ml - geom.mr
  const top = geom.page_h_pt - mt
  const ink = rgb(0.07, 0.07, 0.07)
  const white = rgb(1, 1, 1)
  const primary = hex(t.primary)
  const accent = hex(t.accent)

  if (id === 'style_5') {
    const g = computeSeritGeom(contentW, STYLE_5_FIRST_H_PT)
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
    const navy = rgb(0.133, 0.216, 0.31)
    const navyDark = rgb(0.102, 0.169, 0.239)
    const gold = rgb(1, 0.886, 0.49)
    const goldShade = rgb(0.91, 0.784, 0.416)
    const coral = rgb(0.788, 0.404, 0.357)
    const coralLight = rgb(0.851, 0.541, 0.494)
    const testGold = rgb(0.894, 0.757, 0.29)
    const numInk = rgb(0.361, 0.165, 0.141)
    const subjectColor = hex(headerFieldColor(config, 'subject', '#FFFFFF'))
    const topicColor = hex(headerFieldColor(config, 'topic', '#FFFFFF'))
    const originX = geom.ml
    const originTop = top
    // pdf-lib drawSvgPath: y = şeklin ÜST kenarı; path y aşağı artar
    const drawPoly = (
      pts: Array<{ x: number; y: number }>,
      color: RGB,
    ) => {
      page.drawSvgPath(polyPath(pts), { x: originX, y: originTop, color })
    }

    // Mercan — yatay iki eşit şerit: üst açık, alt koyu
    const coralMidY = g.h * 0.5
    const coralMidX = g.coralTop + (g.coralBot - g.coralTop) * 0.5
    drawPoly(
      [
        { x: coralMidX, y: coralMidY },
        { x: g.w, y: coralMidY },
        { x: g.w, y: g.h },
        { x: g.coralBot, y: g.h },
      ],
      coral,
    )
    drawPoly(
      [
        { x: g.coralTop, y: 0 },
        { x: g.w, y: 0 },
        { x: g.w, y: coralMidY },
        { x: coralMidX, y: coralMidY },
      ],
      coralLight,
    )
    drawPoly(
      [
        { x: 0, y: 0 },
        { x: g.navyTop, y: 0 },
        { x: g.navyBot, y: g.h },
        { x: 0, y: g.h },
      ],
      navy,
    )
    drawPoly(
      [
        { x: 0, y: 0 },
        { x: g.navyTop * 0.72, y: 0 },
        { x: g.navyTop * 0.28, y: g.h * 0.62 },
        { x: 0, y: g.h * 0.5 },
      ],
      navyDark,
    )
    const tip = g.goldTipX
    drawPoly(
      [
        { x: g.navyTop, y: 0 },
        { x: g.goldTopL, y: 0 },
        { x: tip, y: g.h },
        { x: g.navyBot, y: g.h },
      ],
      white,
    )
    drawPoly(
      [
        { x: g.goldTopR, y: 0 },
        { x: g.coralTop, y: 0 },
        { x: g.coralBot, y: g.h },
        { x: tip, y: g.h },
      ],
      white,
    )
    drawPoly(
      [
        { x: g.goldTopL, y: 0 },
        { x: g.goldTopR, y: 0 },
        { x: tip, y: g.h },
      ],
      gold,
    )
    drawPoly(
      [
        { x: g.goldTopL, y: 0 },
        { x: tip, y: 0 },
        { x: tip, y: g.h },
      ],
      goldShade,
    )

    const endX = g.w - g.endBar
    page.drawRectangle({
      x: originX + endX - g.endGap,
      y: top - g.h,
      width: g.endGap,
      height: g.h,
      color: white,
    })
    page.drawRectangle({
      x: originX + endX,
      y: top - g.h,
      width: g.endBar,
      height: g.h,
      color: navy,
    })

    const tc = seritTestCenter(g)
    const label = testLabel || 'TEST'
    const testSize = Math.min(11, g.h * 0.38)
    const chars = label.split('')
    const gap = testSize * 0.55
    const widths = chars.map((ch) => fonts.bold.widthOfTextAtSize(ch, testSize))
    const totalW =
      widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, chars.length - 1)
    let cx = originX + tc.x - totalW / 2
    const ty = top - tc.y - testSize * 0.35
    for (let i = 0; i < chars.length; i += 1) {
      page.drawText(chars[i]!, {
        x: cx,
        y: ty,
        size: testSize,
        font: fonts.bold,
        color: testGold,
      })
      cx += widths[i]! + gap
    }

    const nc = seritNumberCenter(g)
    const noSize = fitSize(
      fonts.bold,
      testNo,
      g.goldTopR - g.goldTopL + 10,
      Math.min(16, g.h * 0.58),
    )
    const noW = fonts.bold.widthOfTextAtSize(testNo, noSize)
    page.drawText(testNo, {
      x: originX + nc.x - noW / 2,
      y: top - nc.y - noSize * 0.35,
      size: noSize,
      font: fonts.bold,
      color: numInk,
    })

    const endPad = g.endBar + g.endGap + 6
    const gradeMax = Math.min(90, g.w * 0.22)
    // Üst açık mercan ortası (ders); alt koyu mercan ortası (konu)
    const ySubject = g.h * 0.25
    const yTopic = g.h * 0.75
    const gradeSize = fitSize(fonts.bold, grade, gradeMax, Math.min(9, g.h * 0.28))
    const gradeW = fonts.bold.widthOfTextAtSize(grade, gradeSize)
    page.drawText(grade, {
      x: originX + g.w - endPad - gradeW,
      y: top - ySubject - gradeSize * 0.35,
      size: gradeSize,
      font: fonts.bold,
      color: white,
    })
    const midMax = Math.max(48, g.w * 0.52)
    const pageMidX = originX + g.w / 2
    if (subject) {
      const subjectSize = fitSize(fonts.bold, subject, midMax, Math.min(10, g.h * 0.3))
      const sw = fonts.bold.widthOfTextAtSize(subject, subjectSize)
      page.drawText(subject, {
        x: pageMidX - sw / 2,
        y: top - ySubject - subjectSize * 0.35,
        size: subjectSize,
        font: fonts.bold,
        color: subjectColor,
      })
    }
    if (topicLine) {
      const topicSize = fitSize(fonts.bold, topicLine, midMax, Math.min(9.5, g.h * 0.28))
      const tw = fonts.bold.widthOfTextAtSize(topicLine, topicSize)
      page.drawText(topicLine, {
        x: pageMidX - tw / 2,
        y: top - yTopic - topicSize * 0.35,
        size: topicSize,
        font: fonts.bold,
        color: topicColor,
      })
    }
    return
  }

  if (id === 'style_6') {
    const navy = 18
    const mid = 28
    const gray = 18
    page.drawRectangle({ x: geom.ml, y: top - navy, width: contentW, height: navy, color: primary })
    page.drawRectangle({
      x: geom.ml,
      y: top - navy - mid,
      width: contentW,
      height: mid,
      color: accent,
    })
    page.drawRectangle({
      x: geom.ml,
      y: top - navy - mid - gray,
      width: contentW,
      height: gray,
      color: rgb(0.93, 0.93, 0.93),
    })
    const brandSize = fitSize(fonts.bold, t.brand, contentW * 0.62, 12)
    page.drawText(t.brand, {
      x: geom.ml + 10,
      y: baseline(top - navy, navy, brandSize),
      size: brandSize,
      font: fonts.bold,
      color: white,
    })
    const bSize = 8
    const bw = fonts.bold.widthOfTextAtSize(t.badge, bSize) + 16
    const bh = 12
    const bx = geom.ml + contentW - bw - 8
    const by = top - navy + (navy - bh) / 2
    page.drawSvgPath(roundPath(bw, bh, bh / 2), { x: bx, y: by + bh, color: white })
    const btw = fonts.bold.widthOfTextAtSize(t.badge, bSize)
    page.drawText(t.badge, {
      x: bx + (bw - btw) / 2,
      y: baseline(by, bh, bSize),
      size: bSize,
      font: fonts.bold,
      color: primary,
    })
    const subSize = fitSize(fonts.bold, t.subject, contentW - 20, 18)
    const subW = fonts.bold.widthOfTextAtSize(t.subject, subSize)
    page.drawText(t.subject, {
      x: geom.ml + (contentW - subW) / 2,
      y: baseline(top - navy - mid, mid, subSize),
      size: subSize,
      font: fonts.bold,
      color: white,
    })
    if (t.topic) {
      const topicSize = fitSize(fonts.bold, t.topic, contentW - 20, 11)
      page.drawText(t.topic, {
        x: geom.ml + 10,
        y: baseline(top - navy - mid - gray, gray, topicSize),
        size: topicSize,
        font: fonts.bold,
        color: ink,
      })
    }
    return
  }

  if (id === 'style_7') {
    const h = STYLE_7_FIRST_H_PT
    page.drawRectangle({ x: geom.ml, y: top - h, width: contentW, height: h, color: white })
    page.drawLine({
      start: { x: geom.ml, y: top - 1 },
      end: { x: geom.ml + contentW, y: top - 1 },
      thickness: 1.2,
      color: primary,
    })
    const tile = 28
    const tileX = geom.ml + 2
    const tileTop = top - 8
    page.drawSvgPath(roundPath(tile, tile, 6), { x: tileX, y: tileTop, color: primary })
    const monoSize = 12
    const monoW = fonts.bold.widthOfTextAtSize(t.mono, monoSize)
    page.drawText(t.mono, {
      x: tileX + (tile - monoW) / 2,
      y: tileTop - tile + (tile - monoSize) / 2 + 1,
      size: monoSize,
      font: fonts.bold,
      color: white,
    })
    const brandSize = 7
    page.drawText(t.brand, {
      x: tileX,
      y: tileTop - tile - 10,
      size: brandSize,
      font: fonts.bold,
      color: primary,
    })
    const pillX = tileX + tile + 10
    const subSize = 14
    const subW = fonts.bold.widthOfTextAtSize(t.subject, subSize)
    const pillW = Math.min(contentW - (pillX - geom.ml) - 70, Math.max(48, subW + 22))
    const pillH = 24
    const pillTop = top - 10
    page.drawSvgPath(roundPath(pillW, pillH, pillH / 2), { x: pillX, y: pillTop, color: accent })
    const drawnSub = fitSize(fonts.bold, t.subject, pillW - 16, subSize)
    const drawnW = fonts.bold.widthOfTextAtSize(t.subject, drawnSub)
    page.drawText(t.subject, {
      x: pillX + (pillW - drawnW) / 2,
      y: baseline(pillTop - pillH, pillH, drawnSub),
      size: drawnSub,
      font: fonts.bold,
      color: white,
    })
    if (t.topic) {
      const topicSize = 9
      page.drawText(t.topic, {
        x: pillX + 4,
        y: pillTop - pillH - 12,
        size: topicSize,
        font: fonts.bold,
        color: primary,
      })
      const tw = Math.min(fonts.bold.widthOfTextAtSize(t.topic, topicSize), 70)
      page.drawLine({
        start: { x: pillX + 4, y: pillTop - pillH - 15 },
        end: { x: pillX + 4 + tw, y: pillTop - pillH - 15 },
        thickness: 1.4,
        color: accent,
      })
    }
    const bSize = 8
    const bw = Math.max(36, fonts.bold.widthOfTextAtSize(t.badge, bSize) + 14)
    const bh = 16
    const bx = geom.ml + contentW - bw - 6
    const bTop = top - 16
    page.drawSvgPath(roundPath(bw, bh, 4), { x: bx, y: bTop, color: primary })
    const btw = fonts.bold.widthOfTextAtSize(t.badge, bSize)
    page.drawText(t.badge, {
      x: bx + (bw - btw) / 2,
      y: baseline(bTop - bh, bh, bSize),
      size: bSize,
      font: fonts.bold,
      color: white,
    })
    return
  }

  if (id === 'style_8') {
    const h = klasikFirstPageHeaderHeightPt(config)
    const klasikInk = hex((config.primaryColor || '').trim() || KLASIK_DEFAULT_PRIMARY)
    // Unicode sistem fontu (StandardFonts Türkçe kırar) — macOS’ta Arial ≈ önizleme Helvetica/Arial
    const face = fonts.regular
    const faceBold = fonts.bold
    page.drawRectangle({ x: geom.ml, y: top - h, width: contentW, height: h, color: white })
    const y1 = top - KLASIK_TOP_PAD_PT
    const frameH = KLASIK_FRAME_BODY_H_PT
    const y2 = y1 - frameH
    const frameR = Math.min(KLASIK_FRAME_RADIUS_PT, contentW / 2, frameH / 2)
    const inset = KLASIK_TOPIC_INSET_PT
    drawRoundRectPdf(page, geom.ml, y1, contentW, frameH, frameR, {
      fill: white,
      stroke: klasikInk,
      strokeWidth: KLASIK_FRAME_LINE_PT,
    })

    const centerTitle = (t.topic || '').trim()
    if (centerTitle) {
      const maxPillH = Math.max(12, frameH - inset * 2)
      let titleSize = fitSize(faceBold, centerTitle, contentW * 0.42, 12)
      let padY = 4.5
      let pillH = titleSize + padY * 2
      if (pillH > maxPillH) {
        padY = Math.max(2, (maxPillH - titleSize) / 2)
        pillH = titleSize + padY * 2
        if (pillH > maxPillH) {
          titleSize = Math.max(8, maxPillH - 4)
          padY = Math.max(2, (maxPillH - titleSize) / 2)
          pillH = Math.min(maxPillH, titleSize + padY * 2)
        }
      }
      const padX = 12
      const tw = faceBold.widthOfTextAtSize(centerTitle, titleSize)
      const pillW = tw + padX * 2
      const pillX = geom.ml + (contentW - pillW) / 2
      const pillBottom = y2 + (frameH - pillH) / 2
      const pillTop = pillBottom + pillH
      drawRoundRectPdf(page, pillX, pillTop, pillW, pillH, KLASIK_TOPIC_PILL_RADIUS_PT, {
        fill: klasikInk,
        stroke: klasikInk,
        strokeWidth: 1.1,
      })
      const pillMidY = pillBottom + pillH / 2
      page.drawText(centerTitle, {
        x: geom.ml + (contentW - tw) / 2,
        y: classicTextBaselinePdf(pillMidY, titleSize),
        size: titleSize,
        font: faceBold,
        color: white,
      })
    }

    if (t.badge) {
      const bSize = 7.5
      const stampW = Math.max(28, faceBold.widthOfTextAtSize(t.badge, bSize) + 12)
      const stampH = Math.min(16, frameH - inset * 2)
      const sx = geom.ml + contentW - stampW - 6
      const sy = y2 + (frameH - stampH) / 2
      const stampMidY = sy + stampH / 2
      drawRoundRectPdf(page, sx, sy + stampH, stampW, stampH, 3, {
        fill: white,
        stroke: klasikInk,
        strokeWidth: 1.0,
      })
      const btw = faceBold.widthOfTextAtSize(t.badge, bSize)
      page.drawText(t.badge, {
        x: sx + (stampW - btw) / 2,
        y: classicTextBaselinePdf(stampMidY, bSize),
        size: bSize,
        font: faceBold,
        color: klasikInk,
      })
    }

    if (t.subTopic) {
      const dots = KLASIK_SUBTOPIC_DOTS
      const gap = '  '
      const label = `${dots}${gap}${t.subTopic}${gap}${dots}`
      const topicSize = fitSize(face, label, contentW - 20, 9)
      const tw = face.widthOfTextAtSize(label, topicSize)
      const textY = y2 - 5 - topicSize
      page.drawText(label, {
        x: geom.ml + (contentW - tw) / 2,
        y: textY,
        size: topicSize,
        font: face,
        color: klasikInk,
      })
      if (headerFieldUnderline(config, 'subTopic', true)) {
        const textW = face.widthOfTextAtSize(t.subTopic, topicSize)
        const lineY = textY - 2.5
        page.drawLine({
          start: { x: geom.ml + (contentW - textW) / 2, y: lineY },
          end: { x: geom.ml + (contentW + textW) / 2, y: lineY },
          thickness: 0.9,
          color: klasikInk,
        })
      }
    }
  }
}
