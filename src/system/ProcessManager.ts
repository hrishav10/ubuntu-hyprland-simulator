export interface SimProcess {
  pid: number
  user: string
  command: string
  cpu: number
  mem: number
  state: 'R' | 'S'
  startedAt: number
  appId?: string
  windowId?: string
}

const BASE_PROCESSES: Array<[string, string]> = [
  ['root', '/sbin/init'],
  ['root', '[kthreadd]'],
  ['root', '/usr/lib/systemd/systemd-udevd'],
  ['root', 'NetworkManager'],
  ['root', 'wpa_supplicant'],
  ['user', 'Hyprland'],
  ['user', 'waybar'],
  ['user', 'dunst'],
  ['user', 'xdg-desktop-portal-hyprland'],
]

let nextPid = 1000

export class ProcessManager {
  processes: SimProcess[] = []
  constructor() {
    let pid = 1
    for (const [user, command] of BASE_PROCESSES) {
      this.processes.push({
        pid: pid === 1 ? 1 : pid * 7 + 100,
        user, command,
        cpu: Math.random() * 2, mem: 0.4 + Math.random() * 2,
        state: 'S', startedAt: Date.now() - 3600_000,
      })
      pid++
    }
    nextPid = 1000 + this.processes.length
  }

  spawn(command: string, appId?: string, windowId?: string): SimProcess {
    const p: SimProcess = {
      pid: nextPid++, user: 'user', command, appId, windowId,
      cpu: 1 + Math.random() * 6, mem: 1 + Math.random() * 5,
      state: 'R', startedAt: Date.now(),
    }
    this.processes.push(p)
    return p
  }

  kill(pid: number): boolean {
    if (pid === 1) return false
    const i = this.processes.findIndex((p) => p.pid === pid)
    if (i < 0) return false
    this.processes.splice(i, 1)
    return true
  }

  killByWindow(windowId: string): void {
    this.processes = this.processes.filter((p) => p.windowId !== windowId)
  }

  /** Advance the simulation: jitter cpu/mem so graphs and `ps` feel alive. */
  tick(): void {
    for (const p of this.processes) {
      const drift = (Math.random() - 0.45) * 1.6
      p.cpu = Math.max(0, Math.min(98, p.cpu + drift))
      p.mem = Math.max(0.1, Math.min(40, p.mem + (Math.random() - 0.5) * 0.4))
      p.state = p.cpu > 12 ? 'R' : 'S'
    }
  }
}
