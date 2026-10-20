import { useEffect, useState } from 'react'
import { Power } from 'lucide-react'
import { useStore } from './system/store'
import Desktop from './desktop/Desktop'
import StatusBar from './panel/StatusBar'
import Launcher from './launcher/Launcher'

const BOOT_LINES = [
  '[  OK  ] Created slice system-modprobe.slice',
  '[  OK  ] Reached target Local File Systems',
  '[  OK  ] Started NetworkManager (session)',
  '[  OK  ] Reached target Network',
  '[  OK  ] Started D-Bus System Message Bus',
  '[  OK  ] Started User Manager for UID 1000',
  '[  OK  ] Started Hyprland session (simulated compositor)',
  '[  OK  ] Started waybar.service',
  '[  OK  ] Reached target Graphical Interface',
]

export default function App() {
  const init = useStore((s) => s.init)
  const booted = useStore((s) => s.booted)
  const settings = useStore((s) => s.settings)
  const powerState = useStore((s) => s.powerState)
  const setPowerState = useStore((s) => s.setPowerState)
  const brightness = useStore((s) => s.brightness)
  const [bootPhase, setBootPhase] = useState<'booting' | 'done'>('booting')
  const [bootCount, setBootCount] = useState(0)

  useEffect(() => { void init() }, [init])

  useEffect(() => {
    if (!booted || bootPhase === 'done') return
    const id = setInterval(() => setBootCount((c) => c + 1), 110)
    const done = setTimeout(() => setBootPhase('done'), 1250)
    return () => { clearInterval(id); clearTimeout(done) }
  }, [booted, bootPhase])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.style.setProperty('--accent', settings.accent)
    root.style.setProperty('--win-opacity', String(settings.opacity))
    root.style.setProperty('--ui-font-size', `${settings.fontSize}px`)
    root.style.setProperty('--rounding', `${settings.rounding}px`)
  }, [settings])

  useEffect(() => {
    const unlock = (e: KeyboardEvent) => {
      if (powerState === 'locked' && (e.key === 'Enter' || e.key === ' ')) setPowerState('on')
    }
    window.addEventListener('keydown', unlock)
    return () => window.removeEventListener('keydown', unlock)
  }, [powerState, setPowerState])

  if (powerState === 'off') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center gap-4 text-neutral-500">
        <button onClick={() => { setPowerState('on'); setBootPhase('booting'); setBootCount(0) }}
          className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center hover:border-neutral-400 hover:text-neutral-200 transition-colors" title="Power on">
          <Power size={26} />
        </button>
        <p className="text-[13px]">System is off</p>
      </div>
    )
  }

  if (!booted || bootPhase === 'booting') {
    return (
      <div className="h-full bg-[#0c0710] text-neutral-300 mono text-[12.5px] p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[17px]" style={{ background: '#e95420' }}>U</div>
          <span className="text-[15px] text-white font-sans font-semibold">Ubuntu 24.04.1 LTS</span>
          <span className="text-neutral-500 font-sans text-[12px]">starting session…</span>
        </div>
        {BOOT_LINES.slice(0, bootCount).map((l, i) => <div key={i} className="leading-[1.7]">{l}</div>)}
        <div className="mt-6 h-1 w-64 bg-neutral-800 rounded overflow-hidden">
          <div className="h-full bg-[#e95420] transition-all duration-150" style={{ width: `${Math.min(100, bootCount * 12)}%` }} />
        </div>
        <button className="mt-4 text-[12px] text-neutral-500 hover:text-neutral-200 font-sans" onClick={() => setBootPhase('done')}>Skip →</button>
      </div>
    )
  }

  return (
    <div className="h-full relative" style={{ filter: `brightness(${0.55 + (brightness / 100) * 0.45})` }}>
      <Desktop />
      <StatusBar />
      <Launcher />
      {powerState === 'locked' && <LockScreen onUnlock={() => setPowerState('on')} />}
    </div>
  )
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{ background: 'linear-gradient(160deg,#241533,#0d0a14)', backdropFilter: 'blur(8px)' }}
      onClick={onUnlock}>
      <div className="text-white text-[64px] font-light leading-none">
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-white/70 mt-2 text-[15px]">
        {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div className="mt-14 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#e95420] text-white flex items-center justify-center text-[24px] font-bold">U</div>
        <div className="text-white font-medium">user</div>
        <div className="text-white/50 text-[12.5px]">Click or press Enter to unlock · session state is preserved</div>
      </div>
    </div>
  )
}
