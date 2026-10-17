/**
 * Klasik (style_8) — dış çerçeve + konu kutusu inset + opsiyonel alt konu bandı.
 */

import type { HeaderConfig } from './corporateHeaderLayout'
import { visibleSubTopicText } from './headerFieldVisibility'

/** Varsayılan ana renk — APP_COLOR_SWATCH_PALETTE «Turuncu» */
export const KLASIK_DEFAULT_PRIMARY = '#F08C2E'

/** Dış çerçevenin dikey yüksekliği (pt) — konu kutusu için üst/alt boşluk bırakır */
export const KLASIK_FRAME_BODY_H_PT = 30
/** Konu kutusu ↔ dış çerçeve dikey boşluk (pt) */
export const KLASIK_TOPIC_INSET_PT = 3.5
/** Alt konu üst boşluk + satır (+ alt boşluk) */
export const KLASIK_SUBTOPIC_BAND_PT = 18
/** Alt konu yan süs noktaları */
export const KLASIK_SUBTOPIC_DOTS = '·····'
/** Alt konu yokken alt kenar boşluğu */
export const KLASIK_BOTTOM_PAD_PT = 2
/** Üst kenar boşluğu */
export const KLASIK_TOP_PAD_PT = 2

export function klasikHasSubTopic(config?: HeaderConfig | null): boolean {
  if (!config) return false
  return Boolean(visibleSubTopicText(config).trim())
}

/** İlk sayfa toplam başlık yüksekliği (alt konu açıksa büyür) */
export function klasikFirstPageHeaderHeightPt(config?: HeaderConfig | null): number {
  const sub = klasikHasSubTopic(config) ? KLASIK_SUBTOPIC_BAND_PT : KLASIK_BOTTOM_PAD_PT
  return KLASIK_TOP_PAD_PT + KLASIK_FRAME_BODY_H_PT + sub
}
