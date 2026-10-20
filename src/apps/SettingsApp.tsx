import { useRef, useState } from 'react'
import { Info, Keyboard, Network, Palette, RotateCcw, Upload } from 'lucide-react'
import { useStore, type ThemeId } from '../system/store'

const THEMES: Array<{ id: ThemeId; name: string; swatch: string }> = [
  { id: 'ubuntu-dark', name: 'Ubuntu Dark', swatch: 'linear-gradient(135deg,#2e2a35,#17141a)' },
  { id: 'ubuntu-light', name: 'Ubuntu Light', swatch: 'linear-gradient(135deg,#ffffff,#e8e4ec)' },
  { id: 'hyprland-minimal', name: 'Hyprland Minimal', swatch: 'linear-gradient(135deg,#1a1a1e,#0c0c0e)' },
  { id: 'midnight', name: 'Midnight', swatch: 'linear-gradient(135deg,#182444,#05070f)' },
  { id: 'high-contrast', name: 'High Contrast', swatch: 'linear-gradient(135deg,#000,#333)' },
]
export const ACCENTS = ['#e95420', '#77216f', '#0e8420', '#00629b', '#c7162b', '#e8a33d', '#12a594', '#b478e0']
export const WALLPAPERS = [
  { id: 'ridge', name: 'Noble Ridge' },
  { id: 'dusk', name: 'Dusk Grid' },
  { id: 'forest', name: 'Forest Depth' },
  { id: 'sunset', name: 'Sunset Mesa' },
  { id: 'mono', name: 'Graphite' },
]

export const KEYBINDS: Array<[string, string]> = [
  ['Q', 'Open terminal'], ['R', 'Application launcher'], ['E', 'File manager'],
  ['C', 'Close focused window'], ['V', 'Toggle floating'], ['F', 'Toggle fullscreen / maximize'],
  ['T', 'Cycle tiling layout (dwindle → master → floating → fullscreen)'],
  ['L', 'Lock screen'], ['M', 'Minimize focused window'], ['Tab', 'Cycle windows'],
  ['1–5', 'Switch workspace'], ['Shift + 1–5', 'Move focused window to workspace'],
  ['H / J / K / L or ←↓↑→', 'Focus adjacent window'],
  ['Mouse drag title bar', 'Move window (floating layout)'], ['Mouse drag window edge', 'Resize window'],
  ['Drag to top edge', 'Snap maximize'], ['Drag to left/right edge', 'Snap half'],
]

type Section = 'appearance' | 'keybinds' | 'about'

export default function SettingsApp() {
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  const notify = useStore((s) => s.notify)
  const resetFs = useStore((s) => s.resetFs)
  const openApp = useStore((s) => s.openApp)
  const [section, setSection] = useState<Section>('appearance')
  const fileRef = useRef<HTMLInputElement>(null)

  const onWallpaperUpload = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 1280 / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        update({ wallpaper: 'custom', wallpaperData: canvas.toDataURL('image/jpeg', 0.82) })
        notify('Settings', 'Wallpaper updated', f.name)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="flex h-full">
      <div className="w-48 shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] p-2 space-y-0.5">
        <SideItem active={section === 'appearance'} onClick={() => setSection('appearance')} icon={<Palette size={15} />} label="Appearance" />
        <SideItem active={section === 'keybinds'} onClick={() => setSection('keybinds')} icon={<Keyboard size={15} />} label="Keyboard" />
        <button onClick={() => openApp('network')} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] hover:bg-[var(--hover)] text-left">
          <Network size={15} /> Wi-Fi & Network
        </button>
        <SideItem active={section === 'about'} onClick={() => setSection('about')} icon={<Info size={15} />} label="About" />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {section === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-semibold mb-2">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button key={t.id} onClick={() => update({ theme: t.id })}
                    className={`rounded-lg border p-2 text-left ${settings.theme === t.id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)] hover:bg-[var(--hover)]'}`}>
                    <div className="h-12 rounded-md mb-1.5" style={{ background: t.swatch }} />
                    <span className="text-[12.5px]">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Accent colour</h3>
              <div className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button key={a} onClick={() => update({ accent: a })} title={a}
                    className="w-8 h-8 rounded-full border-2"
                    style={{ background: a, borderColor: settings.accent === a ? 'var(--text)' : 'transparent' }} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Wallpaper</h3>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.map((w) => (
                  <button key={w.id} onClick={() => update({ wallpaper: w.id })}
                    className={`rounded-lg border overflow-hidden text-left ${settings.wallpaper === w.id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)]'}`}>
                    <div className={`h-14 wallpaper-${w.id} relative`} />
                    <div className="px-2 py-1 text-[12px]">{w.name}</div>
                  </button>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 py-3 hover:bg-[var(--hover)]">
                  <Upload size={16} className="text-[var(--muted)]" />
                  <span className="text-[12px]">Upload image</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onWallpaperUpload(f) }} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-[13px]">
                <span className="text-[var(--muted)]">Mode</span>
                {(['fill', 'fit', 'center', 'stretch'] as const).map((m) => (
                  <button key={m} onClick={() => update({ wallpaperMode: m })}
                    className={`px-2 py-1 rounded capitalize ${settings.wallpaperMode === m ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>{m}</button>
                ))}
              </div>
            </div>

            <Slider label="Window opacity" value={Math.round(settings.opacity * 100)} min={55} max={100} unit="%"
              onChange={(v) => update({ opacity: v / 100 })} />
            <Slider label="Font size" value={settings.fontSize} min={12} max={18} unit="px"
              onChange={(v) => update({ fontSize: v })} />
            <Slider label="Tiling gaps (inside)" value={settings.gapsIn} min={0} max={24} unit="px"
              onChange={(v) => update({ gapsIn: v })} />
            <Slider label="Tiling gaps (outside)" value={settings.gapsOut} min={0} max={32} unit="px"
              onChange={(v) => update({ gapsOut: v })} />
            <Slider label="Corner rounding" value={settings.rounding} min={0} max={20} unit="px"
              onChange={(v) => update({ rounding: v })} />

            <div className="flex items-center justify-between">
              <span className="text-[13.5px]">Interface density</span>
              <div className="flex gap-1">
                {(['comfortable', 'compact'] as const).map((d) => (
                  <button key={d} onClick={() => update({ density: d })}
                    className={`px-2.5 py-1.5 rounded-md text-[13px] capitalize ${settings.density === d ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px]">Show desktop icons</span>
              <button onClick={() => update({ showDesktopIcons: !settings.showDesktopIcons })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${settings.showDesktopIcons ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'}`}>
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${settings.showDesktopIcons ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {section === 'keybinds' && (
          <div className="max-w-xl">
            <h3 className="font-semibold mb-1">Keyboard shortcuts</h3>
            <p className="text-[13px] text-[var(--muted)] mb-3">
              Primary modifier (the “mainMod” in <span className="mono">~/.config/hypr/hyprland.conf</span>):
            </p>
            <div className="flex gap-1 mb-4">
              {(['SUPER', 'ALT', 'CTRL'] as const).map((m) => (
                <button key={m} onClick={() => update({ mainMod: m })}
                  className={`px-3 py-1.5 rounded-md text-[13px] mono ${settings.mainMod === m ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>{m}</button>
              ))}
            </div>
            <table className="w-full text-[13px]">
              <tbody>
                {KEYBINDS.map(([key, desc]) => (
                  <tr key={key + desc} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3 whitespace-nowrap"><kbd className="mono text-[12px] bg-[var(--surface-3)] border border-[var(--border)] rounded px-1.5 py-0.5">{settings.mainMod === 'SUPER' ? 'Super' : settings.mainMod} + {key}</kbd></td>
                    <td className="py-2 text-[var(--muted)]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[12.5px] text-[var(--muted)] mt-3">The full binding set also lives in the virtual filesystem at <span className="mono">~/.config/hypr/hyprland.conf</span> — open it in the Code Editor.</p>
          </div>
        )}

        {section === 'about' && (
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[26px] font-bold" style={{ background: 'linear-gradient(135deg,#e95420,#77216f)' }}>U</div>
              <div>
                <h3 className="text-[18px] font-semibold">Ubuntu 24.04.1 LTS</h3>
                <p className="text-[13px] text-[var(--muted)]">Noble Numbat · Hyprland-inspired desktop session</p>
              </div>
            </div>
            <dl className="text-[13px] space-y-2">
              <AboutRow k="Operating system" v="Ubuntu 24.04.1 LTS (reference environment)" />
              <AboutRow k="Kernel" v="6.8.0-45-generic" />
              <AboutRow k="Desktop" v="Hyprland-style tiling session (Waybar · Wofi · Dunst style)" />
              <AboutRow k="Windowing" v="Simulated compositor in the browser — not a real Wayland compositor" />
              <AboutRow k="Device name" v="ubuntu-hypr" />
              <AboutRow k="Memory" v="16 GiB (session resource model)" />
              <AboutRow k="Disk" v="100 GB virtual filesystem (IndexedDB in this browser)" />
              <AboutRow k="Graphics" v="Browser renderer (Canvas / DOM)" />
            </dl>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed mt-4">
              About this project: Ubuntu Desktop Simulator is a browser-based simulation built for learning and
              exploration. It does not run a real Linux kernel, execute commands on your computer, install real
              packages, or connect to the Tor network. Full disclosure and limitations are documented in the
              project README and docs (SECURITY_MODEL.md, KNOWN_LIMITATIONS.md).
            </p>
            <div className="flex gap-2 mt-5">
              <button onClick={async () => { await resetFs(); notify('Settings', 'Filesystem reset', 'The virtual filesystem was restored to its factory seed.') }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[var(--border)] text-[13px] hover:bg-[var(--hover)]">
                <RotateCcw size={14} /> Reset virtual filesystem
              </button>
              <button onClick={() => { localStorage.clear(); location.reload() }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[var(--border)] text-[13px] hover:bg-[var(--hover)]">
                <RotateCcw size={14} /> Reset all session data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SideItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-left ${active ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>
      {icon}{label}
    </button>
  )
}

function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13.5px] w-44">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#e95420]" />
      <span className="mono text-[12.5px] w-14 text-right">{value}{unit}</span>
    </div>
  )
}

function AboutRow({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-3"><dt className="w-36 text-[var(--muted)]">{k}</dt><dd>{v}</dd></div>
}
