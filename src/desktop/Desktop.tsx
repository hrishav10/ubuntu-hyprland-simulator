import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilePlus2, Folder, FolderPlus, Image as ImageIcon, RefreshCw, Settings as SettingsIcon, TerminalSquare } from 'lucide-react'
import { useStore } from '../system/store'
import { computeLayout, type LayoutMode } from './tiling'
import Window from './Window'
import { fileIconColor, openFileWith } from '../apps/shared'

const PANEL_H = 36

export default function Desktop() {
  const settings = useStore((s) => s.settings)
  const windows = useStore((s) => s.windows)
  const activeWorkspace = useStore((s) => s.activeWorkspace)
  const layouts = useStore((s) => s.layouts)
  const focusedId = useStore((s) => s.focusedId)
  const fs = useStore((s) => s.fs)
  useStore((s) => s.fsVersion)
  const openApp = useStore((s) => s.openApp)
  const notifications = useStore((s) => s.notifications)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [iconPos, setIconPos] = useState<Record<string, { x: number; y: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('hypr-sim-icon-pos') ?? '{}') as Record<string, { x: number; y: number }> } catch { return {} }
  })
  const [toastDismissed, setToastDismissed] = useState<Set<number>>(new Set())
  const areaRef = useRef<HTMLDivElement>(null)

  const layout = layouts[activeWorkspace] ?? 'floating'
  const wsWindows = windows.filter((w) => w.workspace === activeWorkspace && !w.minimized)

  const rects = useMemo(() => {
    const area = { x: 0, y: PANEL_H, w: typeof window !== 'undefined' ? window.innerWidth : 1280, h: (typeof window !== 'undefined' ? window.innerHeight : 800) - PANEL_H }
    return computeLayout(
      wsWindows.map((w) => ({ id: w.id, floating: w.floating, maximized: w.maximized, rect: w.rect })),
      layout, area, settings.gapsIn, settings.gapsOut, focusedId,
    )
  }, [wsWindows, layout, settings.gapsIn, settings.gapsOut, focusedId])

  const desktopEntries = useMemo(() => {
    if (!fs) return []
    try { return fs.list('/home/user/Desktop', '/') } catch { return [] }
  }, [fs])

  const cycleWallpaper = useCallback(() => {
    const ids = ['ridge', 'dusk', 'forest', 'sunset', 'mono']
    const cur = ids.indexOf(settings.wallpaper)
    useStore.getState().updateSettings({ wallpaper: ids[(cur + 1) % ids.length] })
  }, [settings.wallpaper])

  /* ------------------------------ Keybinds ------------------------------ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const st = useStore.getState()
      const mod = st.settings.mainMod
      const modDown = mod === 'SUPER' ? e.metaKey : mod === 'ALT' ? e.altKey : e.ctrlKey && e.shiftKey ? false : e.ctrlKey
      // For CTRL mainMod, require Ctrl alone (not terminal Ctrl+C conflicts handled by checking key set below)
      if (!modDown) return
      const key = e.key.toLowerCase()
      const handled = () => { e.preventDefault(); e.stopPropagation() }
      if (key === 'q') { handled(); st.openApp('terminal') }
      else if (key === 'r') { handled(); st.setLauncherOpen(!st.launcherOpen) }
      else if (key === 'e') { handled(); st.openApp('files') }
      else if (key === 'l' && mod !== 'CTRL') { handled(); st.setPowerState('locked') }
      else if (key === 't') {
        handled()
        const modes: LayoutMode[] = ['dwindle', 'master', 'floating', 'fullscreen']
        const cur = st.layouts[st.activeWorkspace] ?? 'floating'
        const next = modes[(modes.indexOf(cur) + 1) % modes.length]
        st.setLayout(next)
        st.notify('Hyprland', 'Layout changed', `Workspace ${st.activeWorkspace}: ${next}`)
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        handled()
        const n = parseInt(key, 10)
        if (e.shiftKey && st.focusedId) st.moveWindowToWorkspace(st.focusedId, n)
        else st.switchWorkspace(n)
      } else if (key === 'c' && st.focusedId && mod !== 'CTRL') { handled(); st.closeWindow(st.focusedId) }
      else if (key === 'v' && st.focusedId) { handled(); st.toggleFloating(st.focusedId) }
      else if (key === 'f' && st.focusedId) { handled(); st.toggleMaximize(st.focusedId) }
      else if (key === 'm' && st.focusedId && mod !== 'CTRL') { handled(); st.minimizeWindow(st.focusedId) }
      else if (key === 'tab') {
        handled()
        const ws = st.windows.filter((w) => w.workspace === st.activeWorkspace)
        if (ws.length > 1) {
          const idx = ws.findIndex((w) => w.id === st.focusedId)
          st.focusWindow(ws[(idx + 1) % ws.length].id)
        }
      } else if (['h', 'j', 'k', 'l'].includes(key) || ['arrowleft', 'arrowdown', 'arrowup', 'arrowright'].includes(key)) {
        if (key === 'l' && mod !== 'CTRL') return // handled above as lock when alone; HJKL with SUPER still reaches here if not locked path
        handled()
        focusAdjacent(key)
      }
    }
    const focusAdjacent = (key: string) => {
      const st = useStore.getState()
      const cur = st.windows.find((w) => w.id === st.focusedId)
      if (!cur) return
      const others = st.windows.filter((w) => w.workspace === st.activeWorkspace && w.id !== cur.id && !w.minimized)
      const dir = key === 'h' || key === 'arrowleft' ? 'l' : key === 'l' || key === 'arrowright' ? 'r' : key === 'k' || key === 'arrowup' ? 'u' : 'd'
      const scored = others.map((w) => {
        const dx = (w.rect.x + w.rect.w / 2) - (cur.rect.x + cur.rect.w / 2)
        const dy = (w.rect.y + w.rect.h / 2) - (cur.rect.y + cur.rect.h / 2)
        const primary = dir === 'l' ? -dx : dir === 'r' ? dx : dir === 'u' ? -dy : dy
        const secondary = Math.abs(dir === 'l' || dir === 'r' ? dy : dx)
        return { w, score: primary > 0 ? primary + secondary * 2 : Infinity }
      }).sort((a, b) => a.score - b.score)
      if (scored[0] && scored[0].score !== Infinity) st.focusWindow(scored[0].w.id)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])

  /* -------------------------------- Toasts ------------------------------- */
  const toasts = notifications.filter((n) => !n.read && Date.now() - n.time < 6000 && !toastDismissed.has(n.id)).slice(0, 3)
  useEffect(() => {
    if (toasts.length === 0) return
    const id = setTimeout(() => useStore.getState().markNotificationsRead(), 6000)
    return () => clearTimeout(id)
  }, [toasts.length])

  const wallpaperStyle: React.CSSProperties = settings.wallpaper === 'custom' && settings.wallpaperData
    ? {
        backgroundImage: `url(${settings.wallpaperData})`,
        backgroundSize: settings.wallpaperMode === 'fill' ? 'cover' : settings.wallpaperMode === 'stretch' ? '100% 100%' : settings.wallpaperMode === 'fit' ? 'contain' : 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0d0a14',
      }
    : {}

  return (
    <div ref={areaRef} className="absolute inset-0 overflow-hidden"
      onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}
      onClick={() => { setMenu(null); setSelectedIcon(null) }}>

      {/* Wallpaper */}
      <div className={`absolute inset-0 ${settings.wallpaper !== 'custom' ? `wallpaper-${settings.wallpaper}` : ''}`} style={wallpaperStyle} />

      {/* Desktop icons */}
      {settings.showDesktopIcons && (
        <div className="absolute left-3 z-0" style={{ top: PANEL_H + 14 }}>
          {desktopEntries.map((node, i) => {
            const pos = iconPos[node.name] ?? { x: 0, y: i * 96 }
            const abs = '/home/user/Desktop/' + node.name
            return (
              <button key={node.name}
                className={`absolute flex flex-col items-center gap-1 w-[86px] p-2 rounded-lg ${selectedIcon === node.name ? 'bg-white/15 ring-1 ring-white/30' : 'hover:bg-white/10'}`}
                style={{ left: pos.x, top: pos.y }}
                onClick={(e) => { e.stopPropagation(); setSelectedIcon(node.name) }}
                onDoubleClick={() => {
                  if (node.type === 'dir') openApp('files', { path: abs })
                  else openFileWith(abs, openApp)
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return
                  const startX = e.clientX, startY = e.clientY
                  const orig = pos
                  let moved = false
                  const mv = (ev: PointerEvent) => {
                    const dx = ev.clientX - startX, dy = ev.clientY - startY
                    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
                    if (moved) setIconPos((p) => ({ ...p, [node.name]: { x: Math.max(0, orig.x + dx), y: Math.max(0, orig.y + dy) } }))
                  }
                  const up = () => {
                    window.removeEventListener('pointermove', mv)
                    window.removeEventListener('pointerup', up)
                    setIconPos((p) => { try { localStorage.setItem('hypr-sim-icon-pos', JSON.stringify(p)) } catch { /* ignore */ } return p })
                  }
                  window.addEventListener('pointermove', mv)
                  window.addEventListener('pointerup', up)
                }}
              >
                {node.type === 'dir'
                  ? <Folder size={36} style={{ color: '#e8a33d' }} fill="currentColor" strokeWidth={1} />
                  : <ImageIcon size={32} style={{ color: fileIconColor(node.name, node.type) }} strokeWidth={1.2} className="hidden" />}
                {node.type !== 'dir' && <FileGlyph name={node.name} />}
                <span className="text-[11.5px] text-white leading-tight text-center break-all line-clamp-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{node.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Windows */}
      {wsWindows.map((w) => {
        const rect = rects.get(w.id) ?? w.rect
        const tiled = layout !== 'floating' && !w.floating && !w.maximized
        return <Window key={w.id} win={w} rect={rect} tiled={tiled} />
      })}

      {/* Toasts (Dunst-style) */}
      <div className="absolute right-3 z-[90] flex flex-col gap-2 w-[320px]" style={{ top: PANEL_H + 10 }}>
        {useStore.getState().dnd ? null : toasts.map((n) => (
          <div key={n.id} className="toast-in rounded-xl border border-[var(--border)] p-3 shadow-2xl backdrop-blur-md"
            style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)' }}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--muted)]">{n.app}</div>
                <div className="text-[13.5px] font-semibold leading-snug">{n.title}</div>
                <div className="text-[12.5px] text-[var(--muted)] leading-snug break-words">{n.body}</div>
              </div>
              <button className="text-[var(--muted)] hover:text-[var(--text)] text-[15px] leading-none px-1"
                onClick={() => setToastDismissed((s) => new Set(s).add(n.id))}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop context menu */}
      {menu && fs && (
        <div className="absolute z-[95] w-56 rounded-lg border border-[var(--border)] shadow-2xl py-1 text-[13px]"
          style={{ left: menu.x, top: menu.y, background: 'color-mix(in srgb, var(--surface-2) 97%, transparent)' }}
          onClick={(e) => e.stopPropagation()}>
          <CtxItem icon={<FolderPlus size={14} />} label="New Folder" onClick={() => {
            let name = 'New Folder'
            let i = 2
            while (fs.exists('/home/user/Desktop/' + name)) name = `New Folder ${i++}`
            fs.mkdir('/home/user/Desktop/' + name, '/')
            setMenu(null)
          }} />
          <CtxItem icon={<FilePlus2 size={14} />} label="New Text File" onClick={() => {
            let name = 'new-file.txt'
            let i = 2
            while (fs.exists('/home/user/Desktop/' + name)) name = `new-file-${i++}.txt`
            fs.write('/home/user/Desktop/' + name, '', '/')
            setMenu(null)
          }} />
          <CtxItem icon={<TerminalSquare size={14} />} label="Open Terminal Here" onClick={() => { openApp('terminal'); setMenu(null) }} />
          <div className="my-1 border-t border-[var(--border)]" />
          <CtxItem icon={<ImageIcon size={14} />} label="Change Wallpaper" onClick={() => { cycleWallpaper(); setMenu(null) }} />
          <CtxItem icon={<SettingsIcon size={14} />} label="Display Settings" onClick={() => { openApp('settings'); setMenu(null) }} />
          <CtxItem icon={<RefreshCw size={14} />} label="Refresh" onClick={() => setMenu(null)} />
          <div className="px-3 py-1.5 text-[11px] text-[var(--muted)]">Workspace {activeWorkspace} · layout: {layout}</div>
        </div>
      )}
    </div>
  )
}

function FileGlyph({ name }: { name: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={fileIconColor(name, 'file')} strokeWidth="1.4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(255,255,255,0.08)" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function CtxItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[var(--hover)]">
      {icon}{label}
    </button>
  )
}
