import { describe, expect, it } from 'vitest'
import { clampRectToViewport, computeLayout, type TiledWindow } from '../desktop/tiling'

const area = { x: 0, y: 36, w: 1600, h: 864 }
const win = (id: string, extra: Partial<TiledWindow> = {}): TiledWindow => ({
  id, floating: false, maximized: false, rect: { x: 100, y: 100, w: 600, h: 400 }, ...extra,
})

describe('tiling layout engine', () => {
  it('master layout: first window takes ~55% left, rest stack right', () => {
    const rects = computeLayout([win('a'), win('b'), win('c')], 'master', area, 6, 10, 'a')
    const a = rects.get('a')!
    const b = rects.get('b')!
    const c = rects.get('c')!
    expect(a.x).toBe(10)
    expect(a.w).toBeGreaterThan(800)
    expect(b.x).toBeGreaterThan(a.x + a.w)
    expect(c.y).toBeGreaterThan(b.y)
    expect(b.h).toBeCloseTo(c.h, 0)
  })
  it('dwindle layout: windows partition the area without overlap', () => {
    const wins = [win('a'), win('b'), win('c'), win('d')]
    const rects = computeLayout(wins, 'dwindle', area, 6, 10, 'a')
    const list = [...rects.values()]
    expect(list).toHaveLength(4)
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const A = list[i], B = list[j]
        const overlap = A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h
        expect(overlap).toBe(false)
      }
    }
  })
  it('single window fills the inner area in tiling modes', () => {
    const rects = computeLayout([win('a')], 'dwindle', area, 6, 10, 'a')
    expect(rects.get('a')).toEqual({ x: 10, y: 46, w: 1580, h: 844 })
  })
  it('floating layout keeps window rects; floating windows are untouched by tiling', () => {
    const rects = computeLayout([win('a'), win('b', { floating: true })], 'floating', area, 6, 10, 'a')
    expect(rects.get('a')).toEqual({ x: 100, y: 100, w: 600, h: 400 })
    const tiled = computeLayout([win('a'), win('b', { floating: true, rect: { x: 5, y: 5, w: 200, h: 150 } })], 'dwindle', area, 6, 10, 'a')
    expect(tiled.get('b')).toEqual({ x: 5, y: 5, w: 200, h: 150 })
  })
  it('fullscreen layout gives the focused window the inner area', () => {
    const rects = computeLayout([win('a'), win('b')], 'fullscreen', area, 6, 10, 'b')
    expect(rects.get('b')).toEqual({ x: 10, y: 46, w: 1580, h: 844 })
  })
  it('maximized windows take the whole area', () => {
    const rects = computeLayout([win('a', { maximized: true }), win('b')], 'floating', area, 6, 10, 'b')
    expect(rects.get('a')).toEqual(area)
  })
  it('clamp keeps windows reachable inside the viewport', () => {
    const r = clampRectToViewport({ x: -2000, y: -50, w: 500, h: 400 }, 1280, 800)
    expect(r.x).toBeGreaterThanOrEqual(-500 + 80)
    expect(r.y).toBe(0)
    const r2 = clampRectToViewport({ x: 5000, y: 100, w: 400, h: 300 }, 1280, 800)
    expect(r2.x).toBe(1200)
  })
})
