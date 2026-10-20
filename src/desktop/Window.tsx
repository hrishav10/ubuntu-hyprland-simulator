import { useRef } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { useStore, type WinState } from '../system/store'
import { appById } from '../launcher/ApplicationRegistry'
import { APP_COMPONENTS } from '../apps'
import type { Rect } from './tiling'
import { clampRectToViewport } from './tiling'

interface Props {
  win: WinState
  rect: Rect
  tiled: boolean
}

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export default function Window({ win, rect, tiled }: Props) {
  const focusWindow = useStore((s) => s.focusWindow)
  const closeWindow = useStore((s) => s.closeWindow)
  const minimizeWindow = useStore((s) => s.minimizeWindow)
  const toggleMaximize = useStore((s) => s.toggleMaximize)
  const setRect = useStore((s) => s.setRect)
  const focusedId = useStore((s) => s.focusedId)
  const settings = useStore((s) => s.settings)
  const dragRef = useRef<{ mode: 'move' | Edge; startX: number; startY: number; orig: Rect } | null>(null)

  const meta = appById(win.appId)
  const AppComp = APP_COMPONENTS[win.appId]
  const focused = focusedId === win.id
  const canDrag = !tiled && !win.maximized

  const onPointerMove = (e: PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    let r = { ...d.orig }
    if (d.mode === 'move') {
      r = clampRectToViewport({ ...r, x: d.orig.x + dx, y: Math.max(36, d.orig.y + dy) }, window.innerWidth, window.innerHeight)
    } else {
      if (d.mode.includes('e')) r.w = Math.max(300, d.orig.w + dx)
      if (d.mode.includes('s')) r.h = Math.max(200, d.orig.h + dy)
      if (d.mode.includes('w')) { const nw = Math.max(300, d.orig.w - dx); r.x = d.orig.x + (d.orig.w - nw); r.w = nw }
      if (d.mode.includes('n')) { const nh = Math.max(200, d.orig.h - dy); r.y = d.orig.y + (d.orig.h - nh); r.h = nh }
      r = clampRectToViewport(r, window.innerWidth, window.innerHeight)
    }
    setRect(win.id, r)
  }
  const endDrag = (e: PointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    if (d?.mode === 'move') {
      // Edge snapping
      if (e.clientY <= 40) toggleMaximize(win.id)
      else if (e.clientX <= 4) setRect(win.id, { x: 0, y: 36, w: window.innerWidth / 2, h: window.innerHeight - 36 })
      else if (e.clientX >= window.innerWidth - 4) setRect(win.id, { x: window.innerWidth / 2, y: 36, w: window.innerWidth / 2, h: window.innerHeight - 36 })
    }
  }
  const startDrag = (mode: 'move' | Edge) => (e: React.PointerEvent) => {
    if (!canDrag && mode !== 'move') return
    if (mode === 'move' && !canDrag) return
    if ((e.target as HTMLElement).closest('button')) return
    focusWindow(win.id)
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: rect }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
  }

  if (!AppComp || !meta) return null
  const Icon = meta.icon
  const edges: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
  const edgeStyle = (edge: Edge): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 30 }
    if (edge === 'n') return { ...base, top: -3, left: 8, right: 8, height: 7, cursor: 'ns-resize' }
    if (edge === 's') return { ...base, bottom: -3, left: 8, right: 8, height: 7, cursor: 'ns-resize' }
    if (edge === 'e') return { ...base, right: -3, top: 8, bottom: 8, width: 7, cursor: 'ew-resize' }
    if (edge === 'w') return { ...base, left: -3, top: 8, bottom: 8, width: 7, cursor: 'ew-resize' }
    if (edge === 'ne') return { ...base, right: -4, top: -4, width: 10, height: 10, cursor: 'nesw-resize' }
    if (edge === 'sw') return { ...base, left: -4, bottom: -4, width: 10, height: 10, cursor: 'nesw-resize' }
    if (edge === 'nw') return { ...base, left: -4, top: -4, width: 10, height: 10, cursor: 'nwse-resize' }
    return { ...base, right: -4, bottom: -4, width: 10, height: 10, cursor: 'nwse-resize' }
  }

  return (
    <section
      className={`window-shell win-in absolute flex flex-col ${focused ? 'window-focused' : ''}`}
      style={{
        left: rect.x, top: rect.y, width: rect.w, height: rect.h,
        zIndex: win.z,
        borderRadius: win.maximized ? 0 : undefined,
        ['--win-opacity' as string]: settings.opacity,
      }}
      onPointerDown={() => focusWindow(win.id)}
      aria-label={win.title}
    >
      {/* Title bar */}
      <header
        className="flex items-center gap-2 pl-3 pr-1.5 shrink-0 select-none"
        style={{
          height: settings.density === 'compact' ? 34 : 38,
          background: focused ? 'color-mix(in srgb, var(--surface-3) 65%, transparent)' : 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
          cursor: canDrag ? 'grab' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={startDrag('move')}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span className="shrink-0 flex" style={{ color: 'var(--accent)' }}><Icon size={15} /></span>
        <span className={`text-[13px] font-medium truncate ${focused ? '' : 'text-[var(--muted)]'}`}>
          {(win.data.path as string) ? `${meta.name} — ${(win.data.path as string).split('/').pop()}` : win.title}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <TitleBtn title="Minimize" onClick={() => minimizeWindow(win.id)}><Minus size={14} /></TitleBtn>
          <TitleBtn title={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)}>
            {win.maximized ? <Copy size={12} /> : <Square size={12} />}
          </TitleBtn>
          <TitleBtn title="Close" danger onClick={() => closeWindow(win.id)}><X size={15} /></TitleBtn>
        </div>
      </header>
      <div className="flex-1 min-h-0 relative">
        <AppComp windowId={win.id} />
      </div>
      {canDrag && edges.map((e) => (
        <div key={e} style={edgeStyle(e)} onPointerDown={startDrag(e)} />
      ))}
    </section>
  )
}

function TitleBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button title={title} onClick={(e) => { e.stopPropagation(); onClick() }} onPointerDown={(e) => e.stopPropagation()}
      className={`p-1.5 rounded-md text-[var(--muted)] transition-colors ${danger ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-[var(--hover)] hover:text-[var(--text)]'}`}>
      {children}
    </button>
  )
}
