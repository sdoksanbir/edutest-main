/**
 * Klasik (style_8) geometri — src/utils/klasikHeaderGeometry.ts ile aynı.
 */

import type { HeaderConfig } from './corporate-header-layout.js'
import { visibleSubTopicText } from './header-field-visibility.js'

/** Varsayılan ana renk — APP_COLOR_SWATCH_PALETTE «Turuncu» */
export const KLASIK_DEFAULT_PRIMARY = '#F08C2E'
export const KLASIK_FRAME_BODY_H_PT = 30
export const KLASIK_TOPIC_INSET_PT = 3.5
export const KLASIK_SUBTOPIC_BAND_PT = 18
export const KLASIK_SUBTOPIC_DOTS = '·····'
export const KLASIK_BOTTOM_PAD_PT = 2
export const KLASIK_TOP_PAD_PT = 2

export function klasikHasSubTopic(config?: HeaderConfig | null): boolean {
  if (!config) return false
  return Boolean(visibleSubTopicText(config).trim())
}

export function klasikFirstPageHeaderHeightPt(config?: HeaderConfig | null): number {
  const sub = klasikHasSubTopic(config) ? KLASIK_SUBTOPIC_BAND_PT : KLASIK_BOTTOM_PAD_PT
  return KLASIK_TOP_PAD_PT + KLASIK_FRAME_BODY_H_PT + sub
}
