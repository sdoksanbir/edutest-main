/** Tema kimlikleri — bağımlılık döngüsü olmadan paylaşılır */

import { MM_TO_PT, RUNNING_TEXT_STRIPE_GAP_MM, STYLE_1_RUNNING_TOTAL_PT } from './modernCorporateHeaderShared'

export type HeaderStyleId =
  | 'style_1'
  | 'style_2'
  | 'style_3'
  | 'style_4'
  | 'style_5'
  | 'style_6'
  | 'style_7'
  | 'style_8'

const LEGACY_MAP: Record<string, HeaderStyleId> = {
  corporate: 'style_1',
  style1: 'style_1',
  style_1: 'style_1',
  style2: 'style_2',
  style_2: 'style_2',
  style3: 'style_3',
  style_3: 'style_3',
  style4: 'style_4',
  style_4: 'style_4',
  style5: 'style_5',
  style_5: 'style_5',
  style6: 'style_6',
  style_6: 'style_6',
  style7: 'style_7',
  style_7: 'style_7',
  style8: 'style_8',
  style_8: 'style_8',
}

export function normalizeHeaderStyleId(id: string | undefined): HeaderStyleId {
  if (!id) return 'style_1'
  return LEGACY_MAP[id] ?? 'style_1'
}

/** Minimal kartı — klasik sol/orta/sağ şerit + açıklama kutusu (kurumsal değil) */
export function isClassicTestBannerHeader(styleId: string | undefined): boolean {
  return normalizeHeaderStyleId(styleId) === 'style_2'
}

/** Yaprak Test (style_5) — kurumsal ilk sayfa, Minimal sayfa çerçevesi (footer/ayırıcı/2+ banner) */
export function isSeritHeader(styleId: string | undefined): boolean {
  return normalizeHeaderStyleId(styleId) === 'style_5'
}

/** Klasik (style_8) — yuvarlatılmış dikdörtgen çerçeve; tek ince footer; 2+ dikdörtgen banner */
export function isKlasikHeader(styleId: string | undefined): boolean {
  return normalizeHeaderStyleId(styleId) === 'style_8'
}

/** 2+ sayfa Minimal/Yaprak/Klasik sayfa çerçevesi (kurumsal running değil) */
export function usesClassicOtherPageChrome(styleId: string | undefined): boolean {
  return isSeritHeader(styleId) || isKlasikHeader(styleId)
}

export function isAltHeaderStyle(styleId: string | undefined): boolean {
  const n = normalizeHeaderStyleId(styleId)
  return n === 'style_5' || n === 'style_6' || n === 'style_7' || n === 'style_8'
}

export function isThemeHeader(styleId: string | undefined): boolean {
  const n = normalizeHeaderStyleId(styleId)
  return n === 'style_1' || n === 'style_3' || n === 'style_4' || isAltHeaderStyle(n)
}

export const STYLE_1_FIRST_H_PT = 64
export const STYLE_2_FIRST_H_PT = 56
export const STYLE_3_FIRST_H_PT = 58
export const STYLE_4_FIRST_H_PT = 14
/** Yaprak Test — referans geometrik yatay bant */
export const STYLE_5_FIRST_H_PT = 36
/** @deprecated UI'dan kaldırıldı — geriye uyum */
export const STYLE_6_FIRST_H_PT = 64
/** @deprecated UI'dan kaldırıldı — geriye uyum */
export const STYLE_7_FIRST_H_PT = 56
/** Klasik — alt konu açıkken üst sınır (dinamik yükseklik için fallback) */
export const STYLE_8_FIRST_H_PT = 44
/** Klasik dış çerçeve köşe yarıçapı (pt) */
export const KLASIK_FRAME_RADIUS_PT = 9.5
/** Klasik dış çerçeve çizgi kalınlığı (pt) */
export const KLASIK_FRAME_LINE_PT = 1.6
/** Klasik orta konu kutusu köşe yarıçapı (pt) */
export const KLASIK_TOPIC_PILL_RADIUS_PT = 5

export const THEME_RUNNING_BODY_H_PT = 22
export const THEME_RUNNING_STRIPE_GAP_PT = RUNNING_TEXT_STRIPE_GAP_MM * MM_TO_PT
export const THEME_RUNNING_STRIPE_H_PT = 1.0
export const THEME_RUNNING_GAP_BELOW_PT = 5.5

export function themeRunningHeaderTotalPt(styleId?: string): number {
  if (normalizeHeaderStyleId(styleId) === 'style_1') {
    return STYLE_1_RUNNING_TOTAL_PT
  }
  return (
    THEME_RUNNING_STRIPE_H_PT +
    THEME_RUNNING_STRIPE_GAP_PT +
    THEME_RUNNING_BODY_H_PT +
    THEME_RUNNING_STRIPE_GAP_PT +
    THEME_RUNNING_STRIPE_H_PT +
    THEME_RUNNING_GAP_BELOW_PT
  )
}
