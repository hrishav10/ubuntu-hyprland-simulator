import { useEffect, useMemo, useRef, useState } from 'react'
import { Pin, Search } from 'lucide-react'
import { useStore } from '../system/store'
import { APPS, APP_CATEGORIES } from './ApplicationRegistry'

export default function Launcher() {
  const open = useStore((s) => s.launcherOpen)
  const setOpen = useStore((s) => s.setLauncherOpen)
  const openApp = useStore((s) => s.openApp)
  const recents = useStore((s) => s.recents)
  const pinned = useStore((s) => s.pinned)
  const pm = useStore((s) => s.pm)
  useStore((s) => s.pkgVersion)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setCategory('All')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open ])

  const available = useMemo(() => APPS.filter((a) => a.id !== 'app-grid' && (!a.packageName || pm.isInstalled(a.packageName))), [pm])
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return available.filter((a) =>
      (category === 'All' || a.category === category) &&
      (q === '' || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)))
  }, [available, query, category])

  useEffect(() => { setCursor(0) }, [results.length, query])

  if (!open) return null

  const launch = (id: string) => {
    setOpen(false)
    openApp(id)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(results.length - 1, c + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)) }
    else if (e.key === 'Enter') { const a = results[cursor]; if (a) launch(a.id) }
  }

  const showSections = query === '' && category === 'All'
  const pinnedApps = pinned.map((id) => APPS.find((a) => a.id === id)).filter(Boolean)
  const recentApps = recents.map((id) => APPS.find((a) => a.id === id)).filter(Boolean)

  return (
    <div className="absolute inset-0 z-[70] flex items-start justify-center pt-[12vh]" style={{ background: 'rgba(5,4,10,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={() => setOpen(false)}>
      <div className="w-[640px] max-w-[92vw] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden win-in"
        style={{ background: 'color-mix(in srgb, var(--surface) 96%, transparent)' }}
        onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
          <Search size={18} className="text-[var(--muted)]" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications…"
            className="flex-1 bg-transparent outline-none text-[16px]" />
          <kbd className="mono text-[10.5px] text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="flex gap-1 px-3 py-2 border-b border-[var(--border)] overflow-x-auto">
          {APP_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2.5 py-1 rounded-full text-[12px] whitespace-nowrap ${category === c ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="max-h-[52vh] overflow-auto p-2">
          {showSections && pinnedApps.length > 0 && (
            <>
              <SectionLabel>Pinned</SectionLabel>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {pinnedApps.map((a) => a && <AppRow key={a.id} app={a} active={false} onClick={() => launch(a.id)} pinned />)}
              </div>
            </>
          )}
          {showSections && recentApps.length > 0 && (
            <>
              <SectionLabel>Recent</SectionLabel>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {recentApps.slice(0, 4).map((a) => a && <AppRow key={a.id} app={a} active={false} onClick={() => launch(a.id)} />)}
              </div>
            </>
          )}
          <SectionLabel>{showSections ? 'All applications' : `${results.length} result${results.length === 1 ? '' : 's'}`}</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            {results.map((a, i) => (
              <AppRow key={a.id} app={a} active={i === cursor} onClick={() => launch(a.id)}
                onHover={() => setCursor(i)} />
            ))}
          </div>
          {results.length === 0 && <p className="text-center text-[var(--muted)] text-[13px] py-8">No applications match “{query}”.</p>}
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] text-[11.5px] text-[var(--muted)] flex gap-4">
          <span>↑↓ navigate</span><span>↵ launch</span><span>esc close</span>
          <span className="ml-auto">wofi --show drun</span>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{children}</div>
}

function AppRow({ app, active, onClick, onHover, pinned }: {
  app: (typeof APPS)[number]; active: boolean; onClick: () => void; onHover?: () => void; pinned?: boolean
}) {
  const Icon = app.icon
  return (
    <button onClick={onClick} onMouseEnter={onHover}
      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-left ${active ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-[var(--surface-3)]'}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13.5px] font-medium leading-tight">
          {app.name}
          {pinned && <Pin size={11} className="opacity-60" />}
        </span>
        <span className={`block text-[11.5px] leading-tight truncate ${active ? 'text-white/75' : 'text-[var(--muted)]'}`}>{app.description}</span>
      </span>
    </button>
  )
}
