import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive as ArchiveIcon, CalendarDays, Download, FileText, Image as ImageIcon,
  Music, Pause, Play, Plus, Search, SkipBack, SkipForward, Trash2, Wifi, WifiOff, X,
} from 'lucide-react'
import { useStore } from '../system/store'
import { useFs, formatBytes } from './shared'
import { KEYBINDS } from './SettingsApp'

/* ------------------------------- Software ------------------------------- */

export function SoftwareApp() {
  const pm = useStore((s) => s.pm)
  useStore((s) => s.pkgVersion)
  const installPackage = useStore((s) => s.installPackage)
  const removePackage = useStore((s) => s.removePackage)
  const notify = useStore((s) => s.notify)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [log, setLog] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const categories = ['All', ...Array.from(new Set(pm.list().map((p) => p.category)))]
  const results = pm.list().filter((p) =>
    (category === 'All' || p.category === category) &&
    (query === '' || p.name.includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase())))

  const run = (name: string, install: boolean) => {
    setBusy(name)
    window.setTimeout(() => {
      const out = install ? installPackage(name) : removePackage(name)
      setLog(`$ sudo apt ${install ? 'install' : 'remove'} ${name}\n${out}`)
      setBusy(null)
      notify('Software', install ? 'Installed' : 'Removed', name)
    }, 450)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search packages (apt)"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-full pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2.5 py-1.5 rounded-full text-[12.5px] whitespace-nowrap ${category === c ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)] text-[var(--muted)]'}`}>{c}</button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-[var(--muted)]">{pm.installed().length} installed</span>
      </div>
      <div className="flex-1 overflow-auto p-3 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 content-start">
        {results.map((p) => (
          <div key={p.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="mono font-semibold text-[13.5px]">{p.name}</span>
              <span className="mono text-[11px] text-[var(--muted)]">{p.version}</span>
              {p.installed && <span className="ml-auto text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">INSTALLED</span>}
            </div>
            <p className="text-[12.5px] text-[var(--muted)] leading-snug flex-1">{p.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11.5px] text-[var(--muted)]">{formatBytes(p.sizeKB * 1024)}</span>
              <span className="text-[11.5px] text-[var(--muted)]">{p.category}</span>
              <button disabled={busy === p.name} onClick={() => run(p.name, !p.installed)}
                className={`ml-auto px-3 py-1.5 rounded-md text-[12.5px] font-medium ${p.installed ? 'border border-[var(--border)] hover:bg-red-600/20 hover:text-red-300' : 'bg-[var(--accent)] text-white'} disabled:opacity-50`}>
                {busy === p.name ? 'Working…' : p.installed ? 'Remove' : 'Install'}
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && <p className="text-[var(--muted)] text-sm">No packages match.</p>}
      </div>
      {log && (
        <div className="border-t border-[var(--border)]">
          <div className="flex items-center px-3 py-1.5 text-[12px] text-[var(--muted)]">
            <span className="mono">apt output</span>
            <button className="ml-auto hover:text-[var(--text)]" onClick={() => setLog(null)}><X size={14} /></button>
          </div>
          <pre className="mono text-[11.5px] leading-relaxed px-3 pb-3 max-h-44 overflow-auto whitespace-pre-wrap">{log}</pre>
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Network -------------------------------- */

export function NetworkApp() {
  const network = useStore((s) => s.network)
  const notify = useStore((s) => s.notify)
  const processes = useStore((s) => s.processes)
  const [, force] = useState(0)
  const [connecting, setConnecting] = useState<string | null>(null)

  const connect = (ssid: string, security: string) => {
    setConnecting(ssid)
    window.setTimeout(() => {
      network.connect(ssid)
      setConnecting(null)
      force((x) => x + 1)
      notify('Network', 'Connected', `${ssid} · 192.168.1.42`)
      void processes
      void security
    }, 700)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-5 overflow-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-semibold flex items-center gap-2"><Wifi size={18} /> Wi-Fi</h3>
          <button onClick={() => { network.wifiEnabled = !network.wifiEnabled; if (!network.wifiEnabled) network.disconnect(); force((x) => x + 1) }}
            className={`w-11 h-6 rounded-full p-0.5 ${network.wifiEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${network.wifiEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--muted)] mb-4">
          {network.wifiEnabled ? (network.connectedNetwork ? `Connected to ${network.connectedNetwork.ssid} · IPv4 192.168.1.42 · Gateway 192.168.1.1 · DNS 1.1.1.1` : 'Not connected') : 'Wi-Fi is off'}
        </p>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[13px] font-medium text-[var(--muted)]">Visible networks</h4>
          <button onClick={() => { network.airplaneMode = !network.airplaneMode; force((x) => x + 1) }}
            className={`text-[12px] px-2 py-1 rounded-md border border-[var(--border)] ${network.airplaneMode ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>
            Airplane mode {network.airplaneMode ? 'on' : 'off'}
          </button>
        </div>
        <div className="space-y-1">
          {network.networks.map((n) => (
            <div key={n.ssid} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 bg-[var(--surface-2)]">
              {n.connected ? <Wifi size={16} className="text-emerald-400" /> : <Wifi size={16} className="text-[var(--muted)]" />}
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium truncate">{n.ssid}</div>
                <div className="text-[11.5px] text-[var(--muted)]">{n.connected ? 'Connected' : n.security} · Signal {n.signal}%</div>
              </div>
              <div className="flex gap-0.5 items-end h-4 mr-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`w-1 rounded-sm ${n.signal > i * 25 ? 'bg-[var(--text)]' : 'bg-[var(--surface-3)]'}`} style={{ height: 4 + i * 3.5 }} />
                ))}
              </div>
              {!n.connected && (
                <button disabled={!network.wifiEnabled || connecting === n.ssid} onClick={() => connect(n.ssid, n.security)}
                  className="px-2.5 py-1.5 rounded-md bg-[var(--accent)] text-white text-[12.5px] disabled:opacity-50">
                  {connecting === n.ssid ? 'Connecting…' : 'Connect'}
                </button>
              )}
              {n.connected && (
                <button onClick={() => { network.disconnect(); force((x) => x + 1) }} className="px-2.5 py-1.5 rounded-md border border-[var(--border)] text-[12.5px] hover:bg-[var(--hover)]">Disconnect</button>
              )}
            </div>
          ))}
        </div>
        {!network.wifiEnabled && <p className="flex items-center gap-2 text-[var(--muted)] text-[13px] mt-4"><WifiOff size={15} /> Turn Wi-Fi on to see networks.</p>}
      </div>
    </div>
  )
}

/* ----------------------------- Media / Music ---------------------------- */

const TRACKS = [
  { name: 'lofi-study', file: '/home/user/Music/lofi-study.mp3', duration: 187 },
  { name: 'ambient-rain', file: '/home/user/Music/ambient-rain.mp3', duration: 243 },
]

export function MediaApp({ windowId, musicOnly }: { windowId: string; musicOnly?: boolean }) {
  void windowId
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const track = TRACKS[idx]

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setPos((p) => {
      if (p + 1 >= track.duration) { setPlaying(false); return 0 }
      return p + 1
    }), 1000)
    return () => clearInterval(id)
  }, [playing, track.duration])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    const draw = () => {
      const g = canvas.getContext('2d')
      if (g) {
        const { width, height } = canvas
        g.clearRect(0, 0, width, height)
        const t = Date.now() / 300
        for (let i = 0; i < 48; i++) {
          const h = playing ? (Math.sin(t + i * 0.7) * 0.5 + 0.5) * (height - 20) * (0.35 + 0.65 * Math.abs(Math.sin(i))) + 4 : 5
          g.fillStyle = i % 6 === 0 ? '#e95420' : 'rgba(180,120,224,0.75)'
          g.fillRect(i * (width / 48) + 2, height - h, width / 48 - 4, h)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col h-full p-5">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#77216f,#e95420)' }}>
          <Music size={34} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-semibold truncate">{track.name}</div>
          <div className="text-[12.5px] text-[var(--muted)] mono truncate">{track.file}</div>
          <div className="text-[12px] text-[var(--muted)] mt-1">Playback is synthesized locally — the .mp3 files in the virtual filesystem are placeholders.</div>
        </div>
      </div>
      <canvas ref={canvasRef} width={640} height={110} className="w-full mt-5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]" />
      <input type="range" min={0} max={track.duration} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full mt-3 accent-[#e95420]" />
      <div className="flex items-center gap-2">
        <span className="mono text-[12px] text-[var(--muted)]">{fmt(pos)}</span>
        <div className="flex-1 flex items-center justify-center gap-2">
          <button className="p-2 rounded-full hover:bg-[var(--hover)]" onClick={() => { setIdx((idx + TRACKS.length - 1) % TRACKS.length); setPos(0) }}><SkipBack size={18} /></button>
          <button className="p-3 rounded-full bg-[var(--accent)] text-white" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={20} /> : <Play size={20} />}</button>
          <button className="p-2 rounded-full hover:bg-[var(--hover)]" onClick={() => { setIdx((idx + 1) % TRACKS.length); setPos(0) }}><SkipForward size={18} /></button>
        </div>
        <span className="mono text-[12px] text-[var(--muted)]">{fmt(track.duration)}</span>
      </div>
      {!musicOnly && (
        <div className="mt-4 space-y-1">
          {TRACKS.map((t, i) => (
            <button key={t.name} onClick={() => { setIdx(i); setPos(0); setPlaying(true) }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13px] ${i === idx ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'hover:bg-[var(--hover)]'}`}>
              <Music size={14} /> {t.name}<span className="ml-auto text-[var(--muted)] mono text-[11.5px]">{fmt(t.duration)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ----------------------------- Image Viewer ----------------------------- */

export function ImageViewerApp({ windowId }: { windowId: string }) {
  const fs = useFs()
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))
  const path = (win?.data.path as string) ?? '/home/user/Pictures/mountains.svg'
  const [zoom, setZoom] = useState(1)
  const content = useMemo(() => { try { return fs?.read(path, '/') ?? '' } catch { return '' } }, [fs, path])
  const isSvg = path.toLowerCase().endsWith('.svg') && content.trim().startsWith('<svg')
  const dataUrl = content.startsWith('data:image') ? content : null

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto flex items-center justify-center p-6" style={{ background: 'repeating-conic-gradient(#20202a 0% 25%, #262633 0% 50%) 0 0/22px 22px' }}>
        {isSvg ? (
          <div style={{ transform: `scale(${zoom})` }} className="shadow-2xl rounded overflow-hidden" dangerouslySetInnerHTML={{ __html: content }} />
        ) : dataUrl ? (
          <img src={dataUrl} alt={path} style={{ transform: `scale(${zoom})`, maxWidth: '90%' }} className="shadow-2xl rounded" />
        ) : (
          <div className="text-center text-[var(--muted)]">
            <ImageIcon size={40} className="mx-auto mb-2" />
            <p className="text-[13px]">This file isn’t a viewable image.<br /><span className="mono text-[12px]">{path}</span></p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--border)] text-[12px] text-[var(--muted)]">
        <span className="mono truncate">{path}</span>
        <div className="ml-auto flex items-center gap-1">
          <button className="px-2 py-1 rounded hover:bg-[var(--hover)]" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>−</button>
          <span className="mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button className="px-2 py-1 rounded hover:bg-[var(--hover)]" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ PDF Viewer ------------------------------ */

export function PdfViewerApp({ windowId }: { windowId: string }) {
  const fs = useFs()
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))
  const path = (win?.data.path as string) ?? '/home/user/Documents/report.txt'
  const [page, setPage] = useState(0)
  const content = useMemo(() => { try { return fs?.read(path, '/') ?? '' } catch { return 'Could not read file.' } }, [fs, path])
  const pages = useMemo(() => {
    const words = content.split(/\s+/)
    const out: string[] = []
    for (let i = 0; i < words.length; i += 320) out.push(words.slice(i, i + 320).join(' '))
    return out.length ? out : ['']
  }, [content])

  return (
    <div className="flex flex-col h-full" style={{ background: '#3a3a40' }}>
      <div className="flex-1 overflow-auto py-6 px-4">
        <div className="max-w-[560px] mx-auto bg-white text-neutral-800 rounded-sm shadow-2xl p-10 min-h-[640px]" style={{ userSelect: 'text' }}>
          <div className="mono text-[10.5px] text-neutral-400 mb-6">{path}</div>
          <p className="text-[13.5px] leading-[1.75] whitespace-pre-wrap">{pages[page]}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-2 text-[12.5px] text-neutral-200">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-2 py-1 rounded hover:bg-white/10 disabled:opacity-40">Previous</button>
        <span className="mono">Page {page + 1} of {pages.length}</span>
        <button disabled={page >= pages.length - 1} onClick={() => setPage(page + 1)} className="px-2 py-1 rounded hover:bg-white/10 disabled:opacity-40">Next</button>
        <span className="text-neutral-400 ml-2">Documents are paginated from the virtual filesystem text.</span>
      </div>
    </div>
  )
}

/* ------------------------------ Calculator ------------------------------ */

export function CalculatorApp() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const press = (k: string) => {
    if (k === 'C') { setExpr(''); setResult(''); return }
    if (k === '⌫') { setExpr(expr.slice(0, -1)); return }
    if (k === '=') {
      try {
        if (!/^[\d+\-*/.() %]+$/.test(expr)) throw new Error('bad')
        const v = Function(`"use strict"; return (${expr})`)() as number
        const r = String(Math.round(v * 1e10) / 1e10)
        setResult(r)
        setHistory((h) => [`${expr} = ${r}`, ...h].slice(0, 8))
      } catch { setResult('Error') }
      return
    }
    setExpr(expr + k)
  }
  const keys = ['C', '⌫', '(', ')', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']
  return (
    <div className="flex flex-col h-full p-3">
      <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5 text-right mb-2 min-h-[64px]">
        <div className="mono text-[13px] text-[var(--muted)] truncate">{expr || ' '}</div>
        <div className="mono text-[24px] font-semibold leading-tight">{result || '0'}</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)}
            className={`rounded-lg text-[16px] font-medium ${k === '=' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)]'}`}>
            {k}
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="mt-2 max-h-20 overflow-auto">
          {history.map((h, i) => <div key={i} className="mono text-[11.5px] text-[var(--muted)] text-right">{h}</div>)}
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Calendar ------------------------------- */

export function CalendarApp() {
  const fs = useFs()
  const notify = useStore((s) => s.notify)
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [newEvent, setNewEvent] = useState('')
  const [, force] = useState(0)

  const events: Record<string, string[]> = useMemo(() => {
    try {
      const raw = fs?.read('/home/user/.local/calendar-events.json', '/')
      return raw ? JSON.parse(raw) as Record<string, string[]> : {}
    } catch { return {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs, view, selectedDay, newEvent === ''])

  const first = new Date(view.y, view.m, 1)
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const today = new Date()
  const key = (d: number) => `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const addEvent = () => {
    if (!fs || selectedDay === null || !newEvent.trim()) return
    const next = { ...events, [key(selectedDay)]: [...(events[key(selectedDay)] ?? []), newEvent.trim()] }
    try { fs.write('/home/user/.local/calendar-events.json', JSON.stringify(next, null, 2), '/') } catch { /* ignore */ }
    setNewEvent('')
    force((x) => x + 1)
    notify('Calendar', 'Event added', `${key(selectedDay)} — ${newEvent.trim()}`)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={18} />
          <h3 className="text-[16px] font-semibold">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
          <div className="ml-auto flex gap-1">
            <button className="px-2 py-1 rounded hover:bg-[var(--hover)]" onClick={() => setView({ y: view.m === 0 ? view.y - 1 : view.y, m: view.m === 0 ? 11 : view.m - 1 })}>‹</button>
            <button className="px-2 py-1 rounded hover:bg-[var(--hover)] text-[12.5px]" onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}>Today</button>
            <button className="px-2 py-1 rounded hover:bg-[var(--hover)]" onClick={() => setView({ y: view.m === 11 ? view.y + 1 : view.y, m: view.m === 11 ? 0 : view.m + 1 })}>›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--muted)] mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: first.getDay() }).map((_, i) => <div key={'x' + i} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1
            const isToday = d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear()
            const has = (events[key(d)] ?? []).length > 0
            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`relative py-2 rounded-lg text-[13px] ${selectedDay === d ? 'bg-[var(--accent)] text-white' : isToday ? 'border border-[var(--accent)] font-semibold' : 'hover:bg-[var(--hover)]'}`}>
                {d}
                {has && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${selectedDay === d ? 'bg-white' : 'bg-[var(--accent)]'}`} />}
              </button>
            )
          })}
        </div>
      </div>
      <div className="w-56 shrink-0 border-l border-[var(--border)] bg-[var(--surface-2)] p-3 flex flex-col">
        <h4 className="text-[13px] font-semibold mb-2">{selectedDay ? `${selectedDay} ${first.toLocaleDateString('en-GB', { month: 'short' })}` : 'Select a day'}</h4>
        {selectedDay && (
          <>
            <div className="space-y-1.5 flex-1 overflow-auto">
              {(events[key(selectedDay)] ?? []).map((e, i) => (
                <div key={i} className="rounded-md bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-[12.5px]">{e}</div>
              ))}
              {(events[key(selectedDay)] ?? []).length === 0 && <p className="text-[12px] text-[var(--muted)]">No events.</p>}
            </div>
            <div className="flex gap-1 mt-2">
              <input value={newEvent} onChange={(e) => setNewEvent(e.target.value)} placeholder="New event"
                onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                className="flex-1 min-w-0 bg-[var(--surface)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[12.5px] outline-none" />
              <button onClick={addEvent} className="p-1.5 rounded-md bg-[var(--accent)] text-white"><Plus size={15} /></button>
            </div>
          </>
        )}
        <p className="text-[11px] text-[var(--muted)] mt-3">Events are stored at ~/.local/calendar-events.json in the virtual filesystem.</p>
      </div>
    </div>
  )
}

/* -------------------------------- Notes --------------------------------- */

export function NotesApp() {
  const fs = useFs()
  const notify = useStore((s) => s.notify)
  const [current, setCurrent] = useState<string>('/home/user/Notes/todo.txt')
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)

  const notes = useMemo(() => {
    if (!fs) return []
    try { return fs.list('/home/user/Notes', '/').filter((n) => n.type === 'file') } catch { return [] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs, dirty, current])

  useEffect(() => {
    if (!fs) return
    try { setContent(fs.read(current, '/')); setDirty(false) } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fs, current])

  const createNote = () => {
    if (!fs) return
    const name = `note-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.txt`
    fs.write('/home/user/Notes/' + name, '', '/')
    setCurrent('/home/user/Notes/' + name)
    notify('Notes', 'Note created', name)
  }
  const save = () => {
    if (!fs) return
    fs.write(current, content, '/')
    setDirty(false)
    notify('Notes', 'Saved', current)
  }

  return (
    <div className="flex h-full">
      <div className="w-52 shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] p-2">
        <button onClick={createNote} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--accent)] text-white text-[13px] mb-2"><Plus size={14} /> New note</button>
        {notes.map((n) => (
          <button key={n.name} onClick={() => setCurrent('/home/user/Notes/' + n.name)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[13px] ${current.endsWith(n.name) ? 'bg-[var(--hover)] font-medium' : 'hover:bg-[var(--hover)]'}`}>
            <FileText size={14} className="shrink-0" /><span className="truncate">{n.name}</span>
          </button>
        ))}
        <p className="text-[11px] text-[var(--muted)] px-2 mt-3">Notes are plain files in ~/Notes — edit them from Files or the terminal too.</p>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
          <span className="mono text-[12.5px] truncate">{current}</span>
          {dirty && <span className="text-[11px] text-[var(--accent)]">unsaved</span>}
          <button onClick={save} className="ml-auto px-2.5 py-1.5 rounded-md bg-[var(--accent)] text-white text-[12.5px]">Save</button>
          <button onClick={() => { try { fs?.remove(current, '/', 'user', false, true); setCurrent('/home/user/Notes/todo.txt') } catch { /* ignore */ } }}
            className="p-1.5 rounded-md hover:bg-[var(--hover)] text-[var(--muted)]"><Trash2 size={15} /></button>
        </div>
        <textarea value={content} onChange={(e) => { setContent(e.target.value); setDirty(true) }}
          className="flex-1 p-4 bg-transparent resize-none outline-none text-[13.5px] leading-relaxed" placeholder="Write your note…" />
      </div>
    </div>
  )
}

/* ------------------------------- Archive -------------------------------- */

export function ArchiveApp({ windowId }: { windowId: string }) {
  const fs = useFs()
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))
  const notify = useStore((s) => s.notify)
  const path = (win?.data.path as string) ?? '/home/user/Downloads/archive.zip'
  const manifest = useMemo(() => {
    try { return fs?.read(path, '/') ?? '' } catch { return '' }
  }, [fs, path])
  const entries = useMemo(() => manifest.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('SIMULATED') && !l.startsWith('Archive')), [manifest])

  const extract = () => {
    if (!fs) return
    const dest = '/home/user/Downloads/archive-extracted'
    try {
      if (!fs.exists(dest)) fs.mkdir(dest, '/')
      for (const entry of entries) {
        const parts = entry.split('/')
        if (parts.length > 1) {
          const dirPath = dest + '/' + parts.slice(0, -1).join('/')
          if (!fs.exists(dirPath)) fs.mkdir(dirPath, '/', 'user', false, true)
        }
        fs.write(dest + '/' + entry, `Extracted from ${path}\n(entry restored by Archive Manager)\n`, '/')
      }
      notify('Archive Manager', 'Extracted', `${entries.length} entries → ${dest}`)
    } catch (e) { notify('Archive Manager', 'Extract failed', (e as Error).message) }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-3 mb-3">
        <ArchiveIcon size={26} className="text-[#b08968]" />
        <div>
          <div className="font-semibold text-[14.5px]">{path.split('/').pop()}</div>
          <div className="mono text-[11.5px] text-[var(--muted)]">{path}</div>
        </div>
        <button onClick={extract} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md bg-[var(--accent)] text-white text-[13px]">
          <Download size={14} /> Extract here
        </button>
      </div>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="bg-[var(--surface-2)] text-left text-[var(--muted)]"><th className="px-3 py-2 font-medium">Name</th><th className="font-medium">Type</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e} className="border-t border-[var(--border)]">
                <td className="px-3 py-2 mono text-[12.5px] flex items-center gap-2"><FileText size={14} />{e}</td>
                <td className="text-[var(--muted)]">{e.includes('/') ? 'path entry' : 'file'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[var(--muted)] mt-3">Archive files in this session store a text manifest of their entries; extraction recreates those entries as real files in the virtual filesystem.</p>
    </div>
  )
}

/* --------------------------------- Help --------------------------------- */

export function HelpApp() {
  const settings = useStore((s) => s.settings)
  const mod = settings.mainMod === 'SUPER' ? 'Super' : settings.mainMod
  return (
    <div className="h-full overflow-auto p-6 max-w-2xl" style={{ userSelect: 'text' }}>
      <h1 className="text-[22px] font-bold mb-1">Ubuntu Desktop — Help</h1>
      <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mb-5">
        This desktop is a fully interactive simulation that runs entirely in your browser: a tiling window
        manager in the style of Hyprland, a working shell over a persistent virtual filesystem, and a set of
        desktop applications. Nothing here runs real system commands on your computer.
      </p>

      <Section title="Getting started">
        <Li>Press <Kbd>{mod} + R</Kbd> for the launcher, <Kbd>{mod} + Q</Kbd> for a terminal.</Li>
        <Li>In the terminal try: <Mono>neofetch</Mono> (install it first: <Mono>sudo apt install neofetch</Mono> — the sudo password is <Mono>ubuntu</Mono>), <Mono>ls /etc</Mono>, <Mono>cat ~/.config/hypr/hyprland.conf</Mono>, <Mono>ls | grep txt</Mono>, <Mono>echo hello &gt; ~/hello.txt</Mono>.</Li>
        <Li>Your files persist between visits (IndexedDB). Settings → About can reset them.</Li>
      </Section>

      <Section title="Keyboard shortcuts">
        <table className="w-full text-[13px]">
          <tbody>
            {KEYBINDS.map(([k, d]) => (
              <tr key={k + d} className="border-b border-[var(--border)]">
                <td className="py-1.5 pr-3 whitespace-nowrap"><Kbd>{mod} + {k}</Kbd></td>
                <td className="py-1.5 text-[var(--muted)]">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Tiling layouts">
        <Li><b>Dwindle</b> — binary-split tiling (Hyprland’s default): windows split the space in a tree.</Li>
        <Li><b>Master</b> — one large master window on the left, the rest stacked on the right.</Li>
        <Li><b>Floating</b> — free windows you drag and resize; drag to the top edge to maximize, sides to snap half.</Li>
        <Li><b>Fullscreen</b> — the focused window takes the whole workspace. Cycle with <Kbd>{mod} + T</Kbd>.</Li>
      </Section>

      <Section title="Honesty notes">
        <Li>The shell, package manager, network, processes and services are simulations with realistic behaviour, operating on in-browser state only.</Li>
        <Li>The Privacy Browser presents the Tor Browser interface with local data only and does not connect to the Tor network — see its About page and the project documentation (SECURITY_MODEL.md) for the full statement.</Li>
        <Li>Package “installs” update the session’s package records and app availability, not your computer.</Li>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[15.5px] font-semibold mb-2">{title}</h2>
      <div className="space-y-1.5 text-[13.5px] leading-relaxed">{children}</div>
    </section>
  )
}
function Li({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-2"><span className="text-[var(--accent)]">•</span><span>{children}</span></p>
}
function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mono text-[11.5px] bg-[var(--surface-3)] border border-[var(--border)] rounded px-1.5 py-0.5 whitespace-nowrap">{children}</kbd>
}
function Mono({ children }: { children: React.ReactNode }) {
  return <span className="mono text-[12.5px] bg-[var(--surface-2)] border border-[var(--border)] rounded px-1 py-0.5">{children}</span>
}
