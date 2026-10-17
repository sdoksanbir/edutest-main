/**
 * İlk sayfa başlık ↔ soru boşluğu — her başlık teması bağımsız.
 */

import {
  normalizeHeaderStyleId,
  type HeaderStyleId,
} from './headerStyleIds'

export type HeaderBottomGapByStyle = Partial<Record<HeaderStyleId, number>>

/** Diğer temalarla aynı canlı varsayılan (mm) */
export const DEFAULT_STYLE_HEADER_BOTTOM_GAP_MM = 1.5
/** Şerit — başlık ↔ soru standart boşluk (mm) */
export const STYLE_5_DEFAULT_HEADER_BOTTOM_GAP_MM = 2

export function clampHeaderBottomGapMm(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STYLE_HEADER_BOTTOM_GAP_MM
  return Math.max(0, Math.min(50, Math.round(value * 10) / 10))
}

export function defaultHeaderBottomGapMmForStyle(styleId?: string): number {
  const id = normalizeHeaderStyleId(styleId)
  if (id === 'style_5') return STYLE_5_DEFAULT_HEADER_BOTTOM_GAP_MM
  return DEFAULT_STYLE_HEADER_BOTTOM_GAP_MM
}

export function parseHeaderBottomGapByStyle(raw: unknown): HeaderBottomGapByStyle {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const out: HeaderBottomGapByStyle = {}
  for (const key of Object.keys(o)) {
    const id = normalizeHeaderStyleId(key)
    const n = Number(o[key])
    if (Number.isFinite(n)) out[id] = clampHeaderBottomGapMm(n)
  }
  return out
}

export function resolveHeaderBottomGapMm(
  styleId: string | undefined,
  byStyle: HeaderBottomGapByStyle | undefined,
  liveFallback?: number,
): number {
  const id = normalizeHeaderStyleId(styleId)
  const stored = byStyle?.[id]
  if (stored != null && Number.isFinite(stored)) return clampHeaderBottomGapMm(stored)
  if (liveFallback != null && Number.isFinite(liveFallback)) {
    return clampHeaderBottomGapMm(liveFallback)
  }
  return defaultHeaderBottomGapMmForStyle(id)
}

/** Tema değişiminde: eski temanın boşluğunu kaydet, yenisini yükle */
export function switchHeaderBottomGap(
  fromStyleId: string | undefined,
  toStyleId: string | undefined,
  currentGapMm: number,
  byStyle: HeaderBottomGapByStyle | undefined,
): { headerBottomGapMm: number; headerBottomGapByStyle: HeaderBottomGapByStyle } {
  const from = normalizeHeaderStyleId(fromStyleId)
  const to = normalizeHeaderStyleId(toStyleId)
  const bags: HeaderBottomGapByStyle = { ...(byStyle ?? {}) }
  bags[from] = clampHeaderBottomGapMm(currentGapMm)
  const next =
    bags[to] != null && Number.isFinite(bags[to])
      ? clampHeaderBottomGapMm(bags[to]!)
      : defaultHeaderBottomGapMmForStyle(to)
  bags[to] = next
  return { headerBottomGapMm: next, headerBottomGapByStyle: bags }
}
