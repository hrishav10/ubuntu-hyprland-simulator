import { create } from 'zustand'
import type { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { loadFilesystem, resetFilesystem, scheduleFilesystemSave } from '../persistence/FilesystemStore'
import { PackageManager } from '../package-manager/PackageManager'
import { ProcessManager } from './ProcessManager'
import { networkModel, type NetworkModel } from './NetworkModel'
import { appById } from '../launcher/ApplicationRegistry'
import type { LayoutMode, Rect } from '../desktop/tiling'
import { clampRectToViewport } from '../desktop/tiling'

export type ThemeId = 'ubuntu-dark' | 'ubuntu-light' | 'hyprland-minimal' | 'midnight' | 'high-contrast'
export type PowerState = 'on' | 'locked' | 'off'

export interface Settings {
  theme: ThemeId
  accent: string
  wallpaper: string
  wallpaperData?: string
  wallpaperMode: 'fill' | 'fit' | 'center' | 'stretch'
  opacity: number
  fontSize: number
  density: 'comfortable' | 'compact'
  gapsIn: number
  gapsOut: number
  rounding: number
  mainMod: 'SUPER' | 'ALT' | 'CTRL'
  showDesktopIcons: boolean
}

export interface WinState {
  id: string
  appId: string
  title: string
  workspace: number
  rect: Rect
  prevRect?: Rect
  minimized: boolean
  maximized: boolean
  floating: boolean
  z: number
  /** per-window app state (open file path, etc.) */
  data: Record<string, unknown>
}

export interface SimNotification {
  id: number
  app: string
  title: string
  body: string
  time: number
  read: boolean
}

export interface SimService {
  name: string
  description: string
  active: boolean
}

interface Store {
  booted: boolean
  fs: VirtualFilesystem | null
  fsVersion: number
  pm: PackageManager
  pkgVersion: number
  processes: ProcessManager
  network: NetworkModel
  windows: WinState[]
  focusedId: string | null
  activeWorkspace: number
  layouts: Record<number, LayoutMode>
  workspaceNames: Record<number, string>
  settings: Settings
  notifications: SimNotification[]
  clipboardText: string
  clipboardFiles: string[]
  volume: number
  muted: boolean
  brightness: number
  dnd: boolean
  launcherOpen: boolean
  powerState: PowerState
  services: SimService[]
  recents: string[]
  pinned: string[]
  appData: Record<string, Record<string, unknown>>
  zCounter: number

  init: () => Promise<void>
  resetFs: () => Promise<void>
  bumpFs: () => void
  openApp: (appId: string, data?: Record<string, unknown>, workspace?: number) => string | null
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  toggleFloating: (id: string) => void
  setRect: (id: string, rect: Rect) => void
  setWindowData: (id: string, data: Record<string, unknown>) => void
  switchWorkspace: (n: number) => void
  moveWindowToWorkspace: (id: string, n: number) => void
  setLayout: (mode: LayoutMode) => void
  updateSettings: (patch: Partial<Settings>) => void
  notify: (app: string, title: string, body: string) => void
  markNotificationsRead: () => void
  clearNotifications: () => void
  setClipboard: (text: string) => void
  setClipboardFiles: (files: string[]) => void
  setVolume: (v: number) => void
  setPowerState: (s: PowerState) => void
  setLauncherOpen: (open: boolean) => void
  setAppData: (appId: string, data: Record<string, unknown>) => void
  toggleService: (name: string, active: boolean) => void
  installPackage: (name: string) => string
  removePackage: (name: string) => string
}

const SETTINGS_KEY = 'hypr-sim-settings-v1'
const SESSION_KEY = 'hypr-sim-session-v1'
const PKG_KEY = 'hypr-sim-packages-v1'

const DEFAULT_SETTINGS: Settings = {
  theme: 'ubuntu-dark',
  accent: '#e95420',
  wallpaper: 'ridge',
  wallpaperMode: 'fill',
  opacity: 0.94,
  fontSize: 14,
  density: 'comfortable',
  gapsIn: 6,
  gapsOut: 10,
  rounding: 10,
  mainMod: 'SUPER',
  showDesktopIcons: true,
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

function loadPackages(pm: PackageManager) {
  try {
    const raw = localStorage.getItem(PKG_KEY)
    if (raw) {
      const installed = new Set(JSON.parse(raw) as string[])
      for (const p of pm.packages) p.installed = installed.has(p.name)
    }
  } catch { /* ignore */ }
}
function savePackages(pm: PackageManager) {
  try {
    localStorage.setItem(PKG_KEY, JSON.stringify(pm.installed().map((p) => p.name)))
  } catch { /* ignore */ }
}

let notifId = 1
let winCounter = 0

export const useStore = create<Store>((set, get) => ({
  booted: false,
  fs: null,
  fsVersion: 0,
  pm: (() => { const pm = new PackageManager(); loadPackages(pm); return pm })(),
  pkgVersion: 0,
  processes: new ProcessManager(),
  network: networkModel,
  windows: [],
  focusedId: null,
  activeWorkspace: 1,
  layouts: { 1: 'dwindle', 2: 'master', 3: 'floating', 4: 'dwindle', 5: 'floating' },
  workspaceNames: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' },
  settings: loadSettings(),
  notifications: [],
  clipboardText: '',
  clipboardFiles: [],
  volume: 65,
  muted: false,
  brightness: 90,
  dnd: false,
  launcherOpen: false,
  powerState: 'on',
  services: [
    { name: 'NetworkManager.service', description: 'Network Manager', active: true },
    { name: 'systemd-udevd.service', description: 'udev Kernel Device Manager', active: true },
    { name: 'cron.service', description: 'Regular background program processing daemon', active: true },
    { name: 'bluetooth.service', description: 'Bluetooth service', active: false },
    { name: 'cups.service', description: 'CUPS Scheduler', active: false },
    { name: 'sshd.service', description: 'OpenBSD Secure Shell server', active: false },
    { name: 'ufw.service', description: 'Uncomplicated firewall', active: true },
    { name: 'docker.service', description: 'Docker Application Container Engine', active: false },
  ],
  recents: [],
  pinned: ['terminal', 'files', 'browser', 'code-editor', 'settings'],
  appData: {},
  zCounter: 10,

  init: async () => {
    if (get().booted) return
    const fs = await loadFilesystem()
    fs.subscribe(() => {
      scheduleFilesystemSave(fs)
      set({ fsVersion: get().fsVersion + 1 })
    })
    get().pm.syncToFilesystem(fs)
    set({ fs, booted: true, fsVersion: 1 })
    // Restore session windows (app ids + geometry only)
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Array<{ appId: string; rect: Rect; workspace: number; data: Record<string, unknown> }>
        for (const w of saved) {
          if (appById(w.appId)) get().openApp(w.appId, w.data, w.workspace)
        }
      }
    } catch { /* ignore */ }
    if (get().windows.length === 0) {
      get().openApp('terminal')
      get().notify('Hyprland', 'Welcome', 'Press Super+R for the launcher, Super+Q for a terminal. Your files persist in this browser.')
    }
  },

  resetFs: async () => {
    const fs = await resetFilesystem()
    fs.subscribe(() => {
      scheduleFilesystemSave(fs)
      set({ fsVersion: get().fsVersion + 1 })
    })
    get().pm.syncToFilesystem(fs)
    set({ fs, fsVersion: get().fsVersion + 1 })
  },

  bumpFs: () => set({ fsVersion: get().fsVersion + 1 }),

  openApp: (appId, data = {}, workspace) => {
    const meta = appById(appId)
    if (!meta) return null
    const state = get()
    if (meta.packageName && !state.pm.isInstalled(meta.packageName)) {
      state.notify('Software', 'Not installed', `${meta.name} needs the package "${meta.packageName}". Open Software to install it.`)
      return null
    }
    if (appId === 'app-grid') {
      set({ launcherOpen: true })
      return null
    }
    if (meta.singleInstance) {
      const existing = state.windows.find((w) => w.appId === appId)
      if (existing) {
        set({
          activeWorkspace: existing.workspace,
          windows: state.windows.map((w) => (w.id === existing.id ? { ...w, minimized: false, data: { ...w.data, ...data } } : w)),
        })
        get().focusWindow(existing.id)
        return existing.id
      }
    }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(meta.defaultSize.w, vw - 24)
    const h = Math.min(meta.defaultSize.h, vh - 70)
    const cascade = (state.windows.length % 5) * 28
    const rect = clampRectToViewport(
      { x: Math.max(8, (vw - w) / 2 + cascade - 40), y: Math.max(40, (vh - h) / 2 + cascade - 20), w, h },
      vw, vh,
    )
    const id = `win-${++winCounter}-${Date.now().toString(36)}`
    const ws = workspace ?? state.activeWorkspace
    const z = state.zCounter + 1
    const win: WinState = {
      id, appId, title: meta.name, workspace: ws, rect,
      minimized: false, maximized: false, floating: get().layouts[ws] === 'floating',
      z, data,
    }
    state.processes.spawn(meta.processName, appId, id)
    set({
      windows: [...state.windows, win],
      focusedId: id,
      zCounter: z,
      recents: [appId, ...state.recents.filter((r) => r !== appId)].slice(0, 6),
    })
    persistSession(get())
    return id
  },

  closeWindow: (id) => {
    const state = get()
    state.processes.killByWindow(id)
    const remaining = state.windows.filter((w) => w.id !== id)
    set({
      windows: remaining,
      focusedId: state.focusedId === id ? (remaining.filter((w) => w.workspace === state.activeWorkspace && !w.minimized).sort((a, b) => b.z - a.z)[0]?.id ?? null) : state.focusedId,
    })
    persistSession(get())
  },

  focusWindow: (id) => {
    const state = get()
    const z = state.zCounter + 1
    set({
      focusedId: id,
      zCounter: z,
      activeWorkspace: state.windows.find((w) => w.id === id)?.workspace ?? state.activeWorkspace,
      windows: state.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
    })
  },

  minimizeWindow: (id) => {
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      focusedId: get().focusedId === id ? null : get().focusedId,
    })
  },

  toggleMaximize: (id) => {
    const state = get()
    set({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w
        if (w.maximized) return { ...w, maximized: false, rect: w.prevRect ?? w.rect, prevRect: undefined }
        return { ...w, maximized: true, prevRect: w.rect }
      }),
    })
    get().focusWindow(id)
  },

  toggleFloating: (id) => {
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, floating: !w.floating } : w)) })
  },

  setRect: (id, rect) => {
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, rect } : w)) })
    persistSession(get())
  },

  setWindowData: (id, data) => {
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, data: { ...w.data, ...data } } : w)) })
  },

  switchWorkspace: (n) => {
    if (n < 1 || n > 5) return
    const state = get()
    const top = state.windows.filter((w) => w.workspace === n && !w.minimized).sort((a, b) => b.z - a.z)[0]
    set({ activeWorkspace: n, focusedId: top?.id ?? null })
  },

  moveWindowToWorkspace: (id, n) => {
    if (n < 1 || n > 5) return
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, workspace: n } : w)) })
    persistSession(get())
  },

  setLayout: (mode) => {
    set({ layouts: { ...get().layouts, [get().activeWorkspace]: mode } })
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
    set({ settings })
  },

  notify: (app, title, body) => {
    const n: SimNotification = { id: notifId++, app, title, body, time: Date.now(), read: false }
    set({ notifications: [n, ...get().notifications].slice(0, 50) })
  },
  markNotificationsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
  clearNotifications: () => set({ notifications: [] }),
  setClipboard: (text) => set({ clipboardText: text }),
  setClipboardFiles: (files) => set({ clipboardFiles: files }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(100, v)), muted: v === 0 ? get().muted : false }),
  setPowerState: (s) => set({ powerState: s }),
  setLauncherOpen: (open) => set({ launcherOpen: open }),
  setAppData: (appId, data) => set({ appData: { ...get().appData, [appId]: { ...get().appData[appId], ...data } } }),
  toggleService: (name, active) => set({ services: get().services.map((s) => (s.name === name ? { ...s, active } : s)) }),

  installPackage: (name) => {
    const state = get()
    const res = state.pm.install(name, state.fs ?? undefined)
    if (res.changed) { savePackages(state.pm); set({ pkgVersion: state.pkgVersion + 1 }) }
    return res.output
  },
  removePackage: (name) => {
    const state = get()
    const res = state.pm.remove(name, state.fs ?? undefined)
    if (res.changed) { savePackages(state.pm); set({ pkgVersion: state.pkgVersion + 1 }) }
    return res.output
  },
}))

function persistSession(state: Store) {
  try {
    const data = state.windows.map((w) => ({ appId: w.appId, rect: w.rect, workspace: w.workspace, data: w.data }))
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useAppData<T extends Record<string, unknown>>(appId: string): [T, (patch: Partial<T>) => void] {
  const data = useStore((s) => s.appData[appId]) as T | undefined
  const setAppData = useStore((s) => s.setAppData)
  return [(data ?? {}) as T, (patch) => setAppData(appId, patch as Record<string, unknown>)]
}
