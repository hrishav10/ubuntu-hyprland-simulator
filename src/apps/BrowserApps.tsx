import { useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Globe, Home, Lock, Plus, RotateCw, Search, Shield,
  ShieldAlert, ShieldCheck, Star, X,
} from 'lucide-react'
import { useStore } from '../system/store'

/* ----------------------------- Shared bits ----------------------------- */

interface Tab { id: number; url: string; history: string[]; hIdx: number }
let tabSeq = 1

function normalizeUrl(input: string): string {
  const t = input.trim()
  if (!t) return 'start'
  if (t === 'start' || t.startsWith('about:') || t.endsWith('.onion') || LOCAL_SITES[t]) return t
  if (/^[\w-]+(\.[\w-]+)+/.test(t) && !t.includes(' ')) return t.replace(/^https?:\/\//, '')
  return `search:${t}`
}

const LOCAL_SITES: Record<string, { title: string; body: React.ReactNode }> = {}

function SiteShell({ title, children, accent = '#e95420' }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10 px-6" style={{ userSelect: 'text' }}>
      <h1 className="text-[26px] font-bold mb-1" style={{ color: accent }}>{title}</h1>
      <div className="text-[14px] leading-relaxed text-[var(--text)] space-y-3">{children}</div>
    </div>
  )
}

LOCAL_SITES['ubuntu.com'] = {
  title: 'Ubuntu',
  body: (
    <SiteShell title="Ubuntu" accent="#e95420">
      <p className="text-[17px]">The open-source operating system that powers millions of PCs, servers and devices.</p>
      <p>Ubuntu 24.04 LTS “Noble Numbat” ships the Linux 6.8 kernel, GNOME 46 and a refreshed installer. This local page is a recreation served from data bundled with your desktop session — try the other bookmarks, or search from the start page.</p>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {['Ubuntu Desktop', 'Ubuntu Server', 'Ubuntu Cloud', 'Ubuntu Core'].map((c) => (
          <div key={c} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="font-semibold">{c}</div>
            <div className="text-[13px] text-[var(--muted)]">Overview, downloads and documentation.</div>
          </div>
        ))}
      </div>
    </SiteShell>
  ),
}
LOCAL_SITES['wiki.hypr.land'] = {
  title: 'Hyprland Wiki',
  body: (
    <SiteShell title="Hyprland Wiki" accent="#58c4dc">
      <p>Hyprland is a dynamic tiling Wayland compositor. Its configuration lives in <span className="mono">~/.config/hypr/hyprland.conf</span> and uses variables such as <span className="mono">general:gaps_in</span>, <span className="mono">decoration:rounding</span> and binds like <span className="mono">bind = $mainMod, Q, exec, kitty</span>.</p>
      <p>You can read the copy of that config inside this desktop: open Files → .config → hypr → hyprland.conf, or run <span className="mono">cat ~/.config/hypr/hyprland.conf</span> in the terminal.</p>
    </SiteShell>
  ),
}
LOCAL_SITES['example.local'] = {
  title: 'Example Domain',
  body: (
    <SiteShell title="Example Domain" accent="#6aa6ff">
      <p>This domain is for use in illustrative examples in documents. This recreation is served from local session data.</p>
    </SiteShell>
  ),
}
LOCAL_SITES['news.local'] = {
  title: 'Session News',
  body: (
    <SiteShell title="Session News" accent="#38b2ac">
      <p><strong>Hyprland-style tiling arrives on the desktop.</strong> Workspaces 1–5 now support dwindle, master-stack, floating and fullscreen layouts. Press Super+T to cycle.</p>
      <p><strong>Package records refreshed.</strong> The Software app can search the package registry and manage installs for this session.</p>
      <p><strong>Weather in Kolkata:</strong> warm and humid, 31°C, chance of evening showers.</p>
    </SiteShell>
  ),
}

function renderPage(url: string, go: (u: string) => void): React.ReactNode {
  if (url === 'start') {
    return (
      <div className="max-w-xl mx-auto pt-20 px-6 text-center" style={{ userSelect: 'text' }}>
        <div className="text-[34px] font-bold mb-2">Browse the local web</div>
        <p className="text-[var(--muted)] mb-8">A small set of sites is bundled with this session. Try one:</p>
        <div className="grid grid-cols-2 gap-3 text-left">
          {Object.entries(LOCAL_SITES).map(([host, site]) => (
            <button key={host} onClick={() => go(host)} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--accent)] text-left">
              <div className="flex items-center gap-2 font-semibold"><Globe size={15} /> {site.title}</div>
              <div className="mono text-[12px] text-[var(--muted)] mt-1">{host}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (url.startsWith('search:')) {
    const q = url.slice(7)
    const hits = Object.keys(LOCAL_SITES).filter((h) => h.includes(q.toLowerCase()) || LOCAL_SITES[h].title.toLowerCase().includes(q.toLowerCase()))
    return (
      <div className="max-w-2xl mx-auto py-10 px-6" style={{ userSelect: 'text' }}>
        <h2 className="text-[18px] font-semibold mb-4">Results for “{q}”</h2>
        {hits.length === 0 && <p className="text-[var(--muted)]">No local sites match. The bundled directory contains: {Object.keys(LOCAL_SITES).join(', ')}.</p>}
        {hits.map((h) => (
          <button key={h} onClick={() => go(h)} className="block text-left mb-4 group">
            <div className="mono text-[12px] text-[var(--muted)]">{h}</div>
            <div className="text-[16px] text-[#6aa6ff] group-hover:underline">{LOCAL_SITES[h].title}</div>
          </button>
        ))}
      </div>
    )
  }
  const site = LOCAL_SITES[url]
  if (site) return site.body
  return (
    <div className="max-w-lg mx-auto pt-24 px-6 text-center" style={{ userSelect: 'text' }}>
      <h2 className="text-[20px] font-semibold mb-2">Hmm. We’re having trouble finding that site.</h2>
      <p className="text-[var(--muted)] text-[14px]">“{url}” isn’t part of the site set bundled with this session. Check the address, or return to the start page.</p>
    </div>
  )
}

/* ----------------------------- Web Browser ----------------------------- */

export function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: tabSeq++, url: 'start', history: ['start'], hIdx: 0 }])
  const [active, setActive] = useState(0)
  const [addr, setAddr] = useState('')
  const tab = tabs[active]

  const go = (raw: string) => {
    const url = normalizeUrl(raw)
    setTabs((ts) => ts.map((t, i) => (i === active ? { ...t, url, history: [...t.history.slice(0, t.hIdx + 1), url], hIdx: t.hIdx + 1 } : t)))
    setAddr(url === 'start' ? '' : url)
  }
  const step = (d: number) => {
    setTabs((ts) => ts.map((t, i) => {
      if (i !== active) return t
      const hIdx = Math.max(0, Math.min(t.history.length - 1, t.hIdx + d))
      return { ...t, hIdx, url: t.history[hIdx] }
    }))
  }
  const newTab = () => {
    setTabs((ts) => [...ts, { id: tabSeq++, url: 'start', history: ['start'], hIdx: 0 }])
    setActive(tabs.length)
    setAddr('')
  }
  const closeTab = (idx: number) => {
    if (tabs.length === 1) return
    const nt = tabs.filter((_, i) => i !== idx)
    setTabs(nt)
    setActive(Math.max(0, Math.min(active, nt.length - 1)))
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <div className="flex items-end gap-1 px-2 pt-2">
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => { setActive(i); setAddr(t.url === 'start' ? '' : t.url) }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[12.5px] max-w-[180px] ${i === active ? 'bg-[var(--surface-2)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}>
            <Globe size={13} />
            <span className="truncate">{t.url === 'start' ? 'New Tab' : LOCAL_SITES[t.url]?.title ?? t.url}</span>
            <X size={12} onClick={(e) => { e.stopPropagation(); closeTab(i) }} />
          </button>
        ))}
        <button onClick={newTab} className="p-1.5 mb-0.5 rounded hover:bg-[var(--hover)] text-[var(--muted)]"><Plus size={14} /></button>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-2)] border-y border-[var(--border)]">
        <NavBtn onClick={() => step(-1)}><ArrowLeft size={15} /></NavBtn>
        <NavBtn onClick={() => step(1)}><ArrowRight size={15} /></NavBtn>
        <NavBtn onClick={() => go(tab.url)}><RotateCw size={14} /></NavBtn>
        <NavBtn onClick={() => go('start')}><Home size={15} /></NavBtn>
        <div className="flex-1 flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1.5">
          {tab.url !== 'start' && <Lock size={12} className="text-green-500 shrink-0" />}
          <input value={addr} placeholder="Search or enter a site name"
            onChange={(e) => setAddr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(addr)}
            onFocus={(e) => e.target.select()}
            className="flex-1 bg-transparent outline-none text-[13px]" />
          <Star size={14} className="text-[var(--muted)]" />
        </div>
      </div>
      <div className="flex gap-4 px-3 py-1.5 text-[12.5px] text-[var(--muted)] border-b border-[var(--border)]">
        <span className="font-medium text-[var(--text)]">Bookmarks</span>
        {Object.keys(LOCAL_SITES).map((h) => (
          <button key={h} onClick={() => go(h)} className="hover:text-[var(--text)]">{LOCAL_SITES[h].title}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">{renderPage(tab.url, go)}</div>
    </div>
  )
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]">{children}</button>
}

/* ----------------------------- Tor Browser ------------------------------
   Presentation follows the user's steering: immersive Tor Browser look,
   neutral circuit/status wording (no claim of a real Tor connection or
   anonymity), and the disclosure kept to one small-print line in About.
------------------------------------------------------------------------- */

const RELAY_POOL: Array<[string, string]> = [
  ['Germany', 'guard'], ['Netherlands', 'middle'], ['France', 'middle'], ['Sweden', 'exit'],
  ['Finland', 'guard'], ['Austria', 'middle'], ['Switzerland', 'exit'], ['Canada', 'middle'],
  ['Romania', 'exit'], ['Iceland', 'guard'], ['Poland', 'middle'], ['Norway', 'exit'],
]

const ONION_SITES: Record<string, { title: string; desc: string; body: React.ReactNode }> = {
  'directory.onion': {
    title: 'Onion Directory',
    desc: 'A small index of onion services bundled with this session.',
    body: (
      <SiteShell title="Onion Service Directory" accent="#b478e0">
        <p>Onion services are services accessible only through onion routing, identified by <span className="mono">.onion</span> addresses. The entries below are part of this session’s local directory.</p>
      </SiteShell>
    ),
  },
  'notes.onion': {
    title: 'Dead Drop Notes',
    desc: 'A minimal paste-and-notes onion service.',
    body: (
      <SiteShell title="Dead Drop Notes" accent="#b478e0">
        <p>A minimal notes board. Posts are stored only for this session and disappear when the window closes.</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 mono text-[12.5px]">No notes yet. The board is quiet — as it should be.</div>
      </SiteShell>
    ),
  },
  'library.onion': {
    title: 'The Open Library',
    desc: 'Public-domain texts and manuals.',
    body: (
      <SiteShell title="The Open Library" accent="#b478e0">
        <p>Public-domain reading: the Linux man-pages, the Filesystem Hierarchy Standard summary, and the Hyprland configuration guide — the same references your desktop’s Help app points to.</p>
      </SiteShell>
    ),
  },
}

type SecurityLevel = 'standard' | 'safer' | 'safest'
const SECURITY_INFO: Record<SecurityLevel, { name: string; icon: React.ReactNode; desc: string }> = {
  standard: { name: 'Standard', icon: <ShieldCheck size={16} />, desc: 'All browser and website features are enabled.' },
  safer: { name: 'Safer', icon: <Shield size={16} />, desc: 'Disables website features that are often dangerous: JavaScript on non-HTTPS sites, some fonts and math symbols, and autoplaying media.' },
  safest: { name: 'Safest', icon: <ShieldAlert size={16} />, desc: 'Only allows website features required for static sites and basic services. JavaScript is disabled by default on all sites.' },
}

export function TorBrowserApp() {
  const notify = useStore((s) => s.notify)
  const [url, setUrl] = useState('home')
  const [addr, setAddr] = useState('')
  const [history, setHistory] = useState<string[]>(['home'])
  const [hIdx, setHIdx] = useState(0)
  const [circuitSeed, setCircuitSeed] = useState(3)
  const [level, setLevel] = useState<SecurityLevel>('standard')
  const [panel, setPanel] = useState<'circuit' | 'security' | null>(null)

  const circuit = useMemo(() => {
    const guard = RELAY_POOL[circuitSeed % RELAY_POOL.length]
    const middle = RELAY_POOL[(circuitSeed + 4) % RELAY_POOL.length]
    const exit = RELAY_POOL[(circuitSeed + 8) % RELAY_POOL.length]
    return [
      { label: 'This browser', sub: 'your desktop session' },
      { label: guard[0], sub: 'guard relay' },
      { label: middle[0], sub: 'middle relay' },
      { label: exit[0], sub: 'exit relay' },
      { label: url === 'home' ? 'Start page' : url, sub: 'destination' },
    ]
  }, [circuitSeed, url])

  const go = (raw: string) => {
    let target = raw.trim().replace(/^https?:\/\//, '')
    if (!target || target === 'home') target = 'home'
    else if (target === 'about' || target === 'about:tor') target = 'about'
    else if (!ONION_SITES[target] && !LOCAL_SITES[target] && !target.endsWith('.onion')) target = `search:${target}`
    setUrl(target)
    setHistory((h) => [...h.slice(0, hIdx + 1), target])
    setHIdx((i) => i + 1)
    setPanel(null)
  }
  const step = (d: number) => {
    const ni = Math.max(0, Math.min(history.length - 1, hIdx + d))
    setHIdx(ni)
    setUrl(history[ni])
  }
  const newIdentity = () => {
    setCircuitSeed((s) => s + 5)
    setHistory(['home'])
    setHIdx(0)
    setUrl('home')
    notify('Privacy Browser', 'New identity', 'Session data cleared and a fresh circuit was built.')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1d1428' }}>
      {/* Toolbar — Tor Browser style */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: '#2a1c3d' }}>
        <NavBtn onClick={() => step(-1)}><ArrowLeft size={15} /></NavBtn>
        <NavBtn onClick={() => step(1)}><ArrowRight size={15} /></NavBtn>
        <NavBtn onClick={() => go(url)}><RotateCw size={14} /></NavBtn>
        <button onClick={() => setPanel(panel === 'circuit' ? null : 'circuit')} title="View circuit"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium text-white" style={{ background: '#7d4698' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" /> Circuit
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#170f22' }}>
          <Search size={13} className="text-purple-300/70 shrink-0" />
          <input value={addr} placeholder="Search with DuckDuckGo or enter address"
            onChange={(e) => setAddr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(addr)}
            className="flex-1 bg-transparent outline-none text-[13px] text-purple-50 placeholder:text-purple-300/50" />
        </div>
        <button onClick={() => setPanel(panel === 'security' ? null : 'security')} title="Security level"
          className="p-2 rounded-full hover:bg-white/10 text-purple-100">
          {SECURITY_INFO[level].icon}
        </button>
        <button onClick={newIdentity} className="px-2.5 py-1.5 rounded-md text-[12px] font-medium text-white" style={{ background: '#59316b' }}>
          New Identity
        </button>
      </div>

      {/* Popover panels */}
      {panel && (
        <div className="relative">
          <div className="absolute right-3 top-1 z-20 w-80 rounded-xl border border-purple-300/20 shadow-2xl p-4" style={{ background: '#241631' }}>
            {panel === 'circuit' && (
              <>
                <h4 className="text-[13px] font-semibold text-purple-50 mb-3">Circuit for this site</h4>
                <div className="space-y-0">
                  {circuit.map((node, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-purple-300' : i === circuit.length - 1 ? 'bg-emerald-300' : 'bg-purple-500'}`} />
                        {i < circuit.length - 1 && <span className="w-px flex-1 bg-purple-400/30" style={{ minHeight: 14 }} />}
                      </div>
                      <div className="pb-2.5">
                        <div className="text-[13px] text-purple-50 leading-tight">{node.label}</div>
                        <div className="text-[11px] text-purple-300/70">{node.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setCircuitSeed((s) => s + 1)} className="mt-1 px-2.5 py-1.5 rounded-md text-[12px] text-white" style={{ background: '#7d4698' }}>
                  New circuit for this site
                </button>
              </>
            )}
            {panel === 'security' && (
              <>
                <h4 className="text-[13px] font-semibold text-purple-50 mb-2">Security Level</h4>
                {(Object.keys(SECURITY_INFO) as SecurityLevel[]).map((k) => (
                  <label key={k} className="flex gap-2.5 py-2 cursor-pointer">
                    <input type="radio" name="sec-level" checked={level === k} onChange={() => setLevel(k)} className="mt-0.5 accent-purple-400" />
                    <span>
                      <span className="flex items-center gap-1.5 text-[13px] text-purple-50 font-medium">{SECURITY_INFO[k].icon}{SECURITY_INFO[k].name}</span>
                      <span className="block text-[12px] text-purple-200/70 leading-snug mt-0.5">{SECURITY_INFO[k].desc}</span>
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ background: '#1d1428' }}>
        {url === 'home' && (
          <div className="max-w-xl mx-auto pt-16 px-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: '#7d4698' }}>
              <Globe size={30} className="text-white" />
            </div>
            <h1 className="text-[24px] font-semibold text-purple-50">Explore, privately.</h1>
            <p className="text-purple-200/70 text-[14px] mt-1 mb-8">Onion services in this session’s directory:</p>
            <div className="space-y-2 text-left">
              {Object.entries(ONION_SITES).map(([host, site]) => (
                <button key={host} onClick={() => go(host)} className="w-full rounded-xl border border-purple-300/15 p-4 text-left hover:border-purple-300/40" style={{ background: '#241631' }}>
                  <div className="text-purple-50 font-medium">{site.title}</div>
                  <div className="mono text-[11.5px] text-purple-300/70">{host}</div>
                  <div className="text-[12.5px] text-purple-200/60 mt-0.5">{site.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => go('about')} className="mt-8 text-[12.5px] text-purple-300/80 hover:text-purple-100 underline underline-offset-4">About this browser</button>
          </div>
        )}
        {url === 'about' && (
          <div className="max-w-xl mx-auto py-12 px-6" style={{ userSelect: 'text' }}>
            <h1 className="text-[22px] font-semibold text-purple-50 mb-3">About</h1>
            <p className="text-purple-100/85 text-[14px] leading-relaxed">Privacy Browser — a Tor Browser-style interface for exploring onion-service concepts: multi-relay circuits, security levels and per-site isolation, presented inside your desktop session.</p>
            <h2 className="text-[15px] font-semibold text-purple-50 mt-6 mb-1.5">Settings</h2>
            <p className="text-purple-100/75 text-[13.5px]">Security level: {SECURITY_INFO[level].name}. Circuit nodes are drawn from a fixed relay list for this session and can be rebuilt from the Circuit panel or with New Identity.</p>
            <p className="text-[11.5px] text-purple-200/50 leading-relaxed mt-8">
              Small print: this application ships with the Ubuntu Desktop Simulator project. It renders the Tor
              Browser experience from local data only and does not connect to the Tor network. The clear, full
              disclosure lives in the project documentation (docs/SECURITY_MODEL.md and docs/KNOWN_LIMITATIONS.md)
              and the README.
            </p>
          </div>
        )}
        {url.startsWith('search:') && (
          <div className="max-w-2xl mx-auto py-10 px-6">
            <h2 className="text-purple-50 text-[17px] font-semibold mb-4">Results for “{url.slice(7)}”</h2>
            <p className="text-purple-200/60 text-[13.5px]">No matches in the local directory. Directory entries: {Object.keys(ONION_SITES).join(', ')}.</p>
          </div>
        )}
        {!url.startsWith('search:') && url !== 'home' && url !== 'about' && ONION_SITES[url] && (
          <div className="[&_h1]:!text-purple-50">{ONION_SITES[url].body}</div>
        )}
        {!url.startsWith('search:') && url !== 'home' && url !== 'about' && !ONION_SITES[url] && LOCAL_SITES[url] && LOCAL_SITES[url].body}
        {!url.startsWith('search:') && url !== 'home' && url !== 'about' && !ONION_SITES[url] && !LOCAL_SITES[url] && (
          <div className="max-w-lg mx-auto pt-24 px-6 text-center">
            <h2 className="text-purple-50 text-[19px] font-semibold mb-2">Unable to connect</h2>
            <p className="text-purple-200/60 text-[13.5px]">“{url}” isn’t in this session’s directory of onion services.</p>
          </div>
        )}
      </div>
      <div className="px-3 py-1.5 text-[11.5px] text-purple-200/50 flex items-center gap-2" style={{ background: '#170f22' }}>
        <Lock size={11} /> {url.endsWith('.onion') ? `Onion service · ${url}` : url === 'about' ? 'About' : 'Start page'} · Security level: {SECURITY_INFO[level].name}
      </div>
    </div>
  )
}
