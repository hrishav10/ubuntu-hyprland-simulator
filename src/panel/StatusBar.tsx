import { useEffect, useRef, useState } from 'react'
import {
  Battery, BatteryCharging, Bell, CalendarDays, LayoutGrid, Lock, Moon, Power,
  RotateCcw, Sun, Volume2, VolumeX, Wifi, WifiOff,
} from 'lucide-react'
import { useStore } from '../system/store'
import { snapshotResources } from '../system/ResourceModel'
import { appById } from '../launcher/ApplicationRegistry'
import type { LayoutMode } from '../desktop/tiling'

type Pop = 'calendar' | 'network' | 'audio' | 'power' | null

export default function StatusBar() {
  const windows = useStore((s) => s.windows)
  const activeWorkspace = useStore((s) => s.activeWorkspace)
  const switchWorkspace = useStore((s) => s.switchWorkspace)
  const focusedId = useStore((s) => s.focusedId)
  const focusWindow = useStore((s) => s.focusWindow)
  const setLauncherOpen = useStore((s) => s.setLauncherOpen)
  const launcherOpen = useStore((s) => s.launcherOpen)
  const network = useStore((s) => s.network)
  const volume = useStore((s) => s.volume)
  const muted = useStore((s) => s.muted)
  const setVolume = useStore((s) => s.setVolume)
  const brightness = useStore((s) => s.brightness)
  const dnd = useStore((s) => s.dnd)
  const notifications = useStore((s) => s.notifications)
  const markNotificationsRead = useStore((s) => s.markNotificationsRead)
  const clearNotifications = useStore((s) => s.clearNotifications)
  const setPowerState = useStore((s) => s.setPowerState)
  const layouts = useStore((s) => s.layouts)
  const setLayout = useStore((s) => s.setLayout)
  const processes = useStore((s) => s.processes)
  const openApp = useStore((s) => s.openApp)

  const [now, setNow] = useState(new Date())
  const [pop, setPop] = useState<Pop>(null)
  const [, setTick] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setTick((t) => t + 1) }, 2000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const id = setInterval(() => processes.tick(), 4000)
    return () => clearInterval(id)
  }, [processes])

  const res = snapshotResources(processes)
  const focused = windows.find((w) => w.id === focusedId)
  const unread = notifications.filter((n) => !n.read).length
  const layout = layouts[activeWorkspace] ?? 'floating'
  const layoutsCycle: LayoutMode[] = ['dwindle', 'master', 'floating', 'fullscreen']

  const toggle = (p: Pop) => {
    setPop(pop === p ? null : p)
    if (p === 'calendar') markNotificationsRead()
  }

  const clockLabel = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) + '  ' +
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div ref={rootRef} className="absolute top-0 left-0 right-0 z-[80] h-9 flex items-center gap-1 px-2 text-[12.5px]"
      style={{ background: 'var(--panel)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setLauncherOpen(!launcherOpen)} title="Launcher (Super+R)"
        className={`p-1.5 rounded-md ${launcherOpen ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>
        <LayoutGrid size={16} />
      </button>

      {/* Workspaces */}
      <div className="flex items-center gap-0.5 mx-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const has = windows.some((w) => w.workspace === n)
          const active = activeWorkspace === n
          return (
            <button key={n} onClick={() => switchWorkspace(n)} title={`Workspace ${n}`}
              className={`w-6 h-6 rounded-md text-[12px] mono relative ${active ? 'bg-[var(--accent)] text-white font-semibold' : has ? 'text-[var(--text)] hover:bg-[var(--hover)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}>
              {n}
              {has && !active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />}
            </button>
          )
        })}
      </div>

      <button onClick={() => setLayout(layoutsCycle[(layoutsCycle.indexOf(layout) + 1) % layoutsCycle.length])}
        title="Tiling layout (click to cycle, or Super+T)"
        className="mono text-[11px] px-1.5 py-1 rounded hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]">
        [{layout}]
      </button>

      {/* Running apps / focused title */}
      <div className="flex items-center gap-1 ml-1 min-w-0">
        {windows.filter((w) => w.workspace === activeWorkspace).slice(0, 6).map((w) => {
          const meta = appById(w.appId)
          if (!meta) return null
          const Icon = meta.icon
          return (
            <button key={w.id} onClick={() => focusWindow(w.id)} title={w.title}
              className={`p-1.5 rounded-md relative ${w.id === focusedId ? 'bg-[var(--hover)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}>
              <Icon size={15} />
              {w.minimized && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[var(--muted)] rounded" />}
            </button>
          )
        })}
        {focused && <span className="ml-1 truncate max-w-[280px] font-medium hidden md:block">{appById(focused.appId)?.name}</span>}
      </div>

      <div className="flex-1" />

      {/* Resources */}
      <button onClick={() => openApp('monitor')} title="System Monitor"
        className="mono text-[11px] text-[var(--muted)] hover:text-[var(--text)] px-1.5 py-1 rounded hover:bg-[var(--hover)] hidden sm:block">
        CPU {res.cpuPercent.toFixed(0)}% · MEM {(res.memUsedMB / 1024).toFixed(1)}G
      </button>

      <TrayBtn title={network.online ? `Wi-Fi: ${network.connectedNetwork?.ssid}` : 'Network'} onClick={() => toggle('network')}>
        {network.online ? <Wifi size={15} /> : <WifiOff size={15} className="text-red-400" />}
      </TrayBtn>
      <TrayBtn title={`Volume ${muted ? '(muted)' : volume + '%'}`} onClick={() => toggle('audio')}>
        {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </TrayBtn>
      <span className="flex items-center gap-1 px-1 text-[var(--muted)]" title={`Battery ${res.batteryPercent}%`}>
        {res.batteryCharging ? <BatteryCharging size={16} /> : <Battery size={16} />}
        <span className="mono text-[11px] hidden lg:inline">{res.batteryPercent}%</span>
      </span>
      <TrayBtn title="Notifications" onClick={() => toggle('calendar')}>
        <span className="relative">
          <Bell size={15} />
          {unread > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />}
        </span>
      </TrayBtn>
      <button onClick={() => toggle('calendar')} className="mono px-2 py-1 rounded hover:bg-[var(--hover)] font-medium">
        {clockLabel}
      </button>
      <TrayBtn title="Session / power" onClick={() => toggle('power')}>
        <Power size={15} />
      </TrayBtn>

      {/* Popovers */}
      {pop && <div className="fixed inset-0 z-[-1]" onClick={() => setPop(null)} style={{ zIndex: -1 }} />}
      {pop === 'calendar' && (
        <Popover right={8}>
          <MiniCalendar now={now} />
          <div className="border-t border-[var(--border)] mt-2 pt-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="font-semibold text-[13px]">Notifications</span>
              {notifications.length > 0 && <button className="text-[11.5px] text-[var(--muted)] hover:text-[var(--text)]" onClick={clearNotifications}>Clear all</button>}
            </div>
            <div className="max-h-56 overflow-auto space-y-1">
              {notifications.length === 0 && <p className="text-[12.5px] text-[var(--muted)] px-1 py-2">No notifications. You have a quiet desktop.</p>}
              {notifications.slice(0, 12).map((n) => (
                <div key={n.id} className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-2">
                  <div className="text-[11px] text-[var(--muted)]">{n.app} · {new Date(n.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[13px] font-medium leading-snug">{n.title}</div>
                  <div className="text-[12px] text-[var(--muted)] leading-snug">{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        </Popover>
      )}
      {pop === 'network' && (
        <Popover right={110}>
          <h4 className="font-semibold text-[13px] mb-2 flex items-center gap-2"><Wifi size={14} /> Wi-Fi</h4>
          {network.networks.map((n) => (
            <button key={n.ssid} onClick={() => { network.connect(n.ssid); setTick((t) => t + 1) }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--hover)] text-left text-[13px]">
              <Wifi size={13} className={n.connected ? 'text-emerald-400' : 'text-[var(--muted)]'} />
              <span className="flex-1 truncate">{n.ssid}</span>
              <span className="text-[11px] text-[var(--muted)]">{n.connected ? 'Connected' : `${n.signal}%`}</span>
            </button>
          ))}
          <button onClick={() => { openApp('network'); setPop(null) }} className="mt-2 text-[12px] text-[var(--accent)] hover:underline px-2">Network settings…</button>
        </Popover>
      )}
      {pop === 'audio' && (
        <Popover right={70}>
          <h4 className="font-semibold text-[13px] mb-2 flex items-center gap-2"><Volume2 size={14} /> Output volume</h4>
          <div className="flex items-center gap-2 px-1">
            <button onClick={() => useStore.setState({ muted: !muted })}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 accent-[#e95420]" />
            <span className="mono text-[12px] w-10 text-right">{muted ? 'mute' : volume + '%'}</span>
          </div>
          <h4 className="font-semibold text-[13px] mt-4 mb-2 flex items-center gap-2"><Sun size={14} /> Brightness</h4>
          <div className="flex items-center gap-2 px-1">
            <Sun size={15} className="text-[var(--muted)]" />
            <input type="range" min={20} max={100} value={brightness}
              onChange={(e) => useStore.setState({ brightness: Number(e.target.value) })} className="flex-1 accent-[#e95420]" />
            <span className="mono text-[12px] w-10 text-right">{brightness}%</span>
          </div>
        </Popover>
      )}
      {pop === 'power' && (
        <Popover right={8}>
          <div className="flex items-center gap-3 px-1 pb-2">
            <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold">U</div>
            <div>
              <div className="font-semibold text-[13.5px]">user</div>
              <div className="text-[11.5px] text-[var(--muted)]">user@ubuntu-hypr</div>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-2 space-y-0.5">
            <PowerItem icon={dnd ? <Moon size={15} className="text-[var(--accent)]" /> : <Moon size={15} />} label={`Do not disturb ${dnd ? '(on)' : ''}`}
              onClick={() => useStore.setState({ dnd: !dnd })} />
            <PowerItem icon={<Lock size={15} />} label="Lock" onClick={() => { setPop(null); setPowerState('locked') }} />
            <PowerItem icon={<RotateCcw size={15} />} label="Restart…" onClick={() => { setPop(null); location.reload() }} />
            <PowerItem icon={<Power size={15} />} label="Shut Down…" onClick={() => { setPop(null); setPowerState('off') }} />
          </div>
          <p className="text-[11px] text-[var(--muted)] px-1 pt-2">Battery {res.batteryPercent}% · Uptime {Math.floor(res.uptimeSec / 3600)}h {Math.floor((res.uptimeSec % 3600) / 60)}m</p>
        </Popover>
      )}
    </div>
  )
}

function TrayBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return <button onClick={onClick} title={title} className="p-1.5 rounded-md hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]">{children}</button>
}

function Popover({ children, right }: { children: React.ReactNode; right: number }) {
  return (
    <div className="absolute top-10 w-[320px] rounded-xl border border-[var(--border)] shadow-2xl p-3 z-[85]"
      style={{ right, background: 'color-mix(in srgb, var(--surface) 97%, transparent)', backdropFilter: 'blur(16px)', color: 'var(--text)' }}>
      {children}
    </div>
  )
}

function PowerItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--hover)] text-left text-[13px]">
      {icon}{label}
    </button>
  )
}

function MiniCalendar({ now }: { now: Date }) {
  const y = now.getFullYear()
  const m = now.getMonth()
  const first = new Date(y, m, 1)
  const days = new Date(y, m + 1, 0).getDate()
  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-2">
        <CalendarDays size={15} />
        <span className="font-semibold text-[13.5px]">{now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-[var(--muted)] py-0.5">{d}</div>)}
        {Array.from({ length: first.getDay() }).map((_, i) => <div key={'b' + i} />)}
        {Array.from({ length: days }).map((_, i) => (
          <div key={i} className={`py-0.5 rounded ${i + 1 === now.getDate() ? 'bg-[var(--accent)] text-white font-bold' : ''}`}>{i + 1}</div>
        ))}
      </div>
    </div>
  )
}
