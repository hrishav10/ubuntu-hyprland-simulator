import type { ProcessManager } from './ProcessManager'

export interface ResourceSnapshot {
  cpuPercent: number
  memUsedMB: number
  memTotalMB: number
  swapUsedMB: number
  uptimeSec: number
  loadAvg: [number, number, number]
  batteryPercent: number
  batteryCharging: boolean
}

export const BOOT_TIME = Date.now()

export function snapshotResources(pm: ProcessManager): ResourceSnapshot {
  const cpu = Math.min(99, pm.processes.reduce((s, p) => s + p.cpu, 0))
  const memTotalMB = 16384
  const memUsedMB = Math.round(memTotalMB * Math.min(0.92, pm.processes.reduce((s, p) => s + p.mem, 0) / 100 + 0.18))
  const uptimeSec = Math.floor((Date.now() - BOOT_TIME) / 1000) + 3725
  // Battery drains slowly, charges when > 95 resets — purely simulated.
  const elapsedMin = (Date.now() - BOOT_TIME) / 60000
  const batteryPercent = Math.max(5, Math.round(87 - elapsedMin * 0.7))
  return {
    cpuPercent: Math.round(cpu * 10) / 10,
    memUsedMB,
    memTotalMB,
    swapUsedMB: 212,
    uptimeSec,
    loadAvg: [Math.round(cpu / 28 * 100) / 100, 0.42, 0.31],
    batteryPercent,
    batteryCharging: false,
  }
}

export function formatUptime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}
