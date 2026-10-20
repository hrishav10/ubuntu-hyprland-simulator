export type LayoutMode = 'master' | 'dwindle' | 'floating' | 'fullscreen'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface TiledWindow {
  id: string
  floating: boolean
  maximized: boolean
  rect: Rect
}

/**
 * Compute tiled rectangles for a workspace. Pure function — unit tested.
 * Order matters: windows[0] is the master in master-stack layout.
 */
export function computeLayout(
  windows: TiledWindow[],
  layout: LayoutMode,
  area: Rect,
  gapsIn: number,
  gapsOut: number,
  focusedId: string | null,
): Map<string, Rect> {
  const result = new Map<string, Rect>()
  const inner: Rect = {
    x: area.x + gapsOut,
    y: area.y + gapsOut,
    w: Math.max(0, area.w - gapsOut * 2),
    h: Math.max(0, area.h - gapsOut * 2),
  }
  const tiled = windows.filter((w) => !w.floating)
  for (const w of windows) {
    if (w.floating) result.set(w.id, w.rect)
    if (w.maximized) result.set(w.id, { ...area })
  }
  const active = tiled.filter((w) => !w.maximized)
  if (layout === 'floating') {
    for (const w of active) if (!result.has(w.id)) result.set(w.id, w.rect)
    return result
  }
  if (layout === 'fullscreen') {
    for (const w of active) result.set(w.id, w.id === focusedId ? { ...inner } : w.rect)
    return result
  }
  if (active.length === 0) return result
  if (active.length === 1) {
    result.set(active[0].id, inner)
    return result
  }
  if (layout === 'master') {
    const masterW = Math.floor(inner.w * 0.55)
    result.set(active[0].id, { x: inner.x, y: inner.y, w: masterW - gapsIn / 2, h: inner.h })
    const stack = active.slice(1)
    const eachH = (inner.h - gapsIn * (stack.length - 1)) / stack.length
    stack.forEach((w, i) => {
      result.set(w.id, {
        x: inner.x + masterW + gapsIn / 2,
        y: inner.y + i * (eachH + gapsIn),
        w: inner.w - masterW - gapsIn / 2,
        h: eachH,
      })
    })
    return result
  }
  // dwindle: recursive binary split, alternating direction by depth
  const place = (wins: TiledWindow[], rect: Rect, depth: number) => {
    if (wins.length === 1) {
      result.set(wins[0].id, rect)
      return
    }
    const half = Math.ceil(wins.length / 2)
    const first = wins.slice(0, half)
    const rest = wins.slice(half)
    if (depth % 2 === 0) {
      const w1 = (rect.w - gapsIn) * (first.length / wins.length)
      place(first, { x: rect.x, y: rect.y, w: w1, h: rect.h }, depth + 1)
      place(rest, { x: rect.x + w1 + gapsIn, y: rect.y, w: rect.w - w1 - gapsIn, h: rect.h }, depth + 1)
    } else {
      const h1 = (rect.h - gapsIn) * (first.length / wins.length)
      place(first, { x: rect.x, y: rect.y, w: rect.w, h: h1 }, depth + 1)
      place(rest, { x: rect.x, y: rect.y + h1 + gapsIn, w: rect.w, h: rect.h - h1 - gapsIn }, depth + 1)
    }
  }
  place(active, inner, 0)
  return result
}

export function clampRectToViewport(r: Rect, vw: number, vh: number, minVisible = 80): Rect {
  const w = Math.min(r.w, vw)
  const h = Math.min(r.h, vh)
  return {
    w, h,
    x: Math.max(-w + minVisible, Math.min(r.x, vw - minVisible)),
    y: Math.max(0, Math.min(r.y, vh - 32)),
  }
}
