import { useEffect, useRef, useState } from 'react'
import { Activity, Cpu, HardDrive, MemoryStick, Play, RefreshCw, Square, Trash2 } from 'lucide-react'
import { useStore } from '../system/store'
import { snapshotResources } from '../system/ResourceModel'

export default function MonitorApp() {
  const processes = useStore((s) => s.processes)
  const closeWindow = useStore((s) => s.closeWindow)
  const notify = useStore((s) => s.notify)
  const [, setTick] = useState(0)
  const [selectedPid, setSelectedPid] = useState<number | null>(null)
  const [history, setHistory] = useState<{ cpu: number[]; mem: number[] }>({ cpu: [], mem: [] })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      processes.tick()
      const r = snapshotResources(processes)
      setHistory((h) => ({
        cpu: [...h.cpu.slice(-59), r.cpuPercent],
        mem: [...h.mem.slice(-59), (r.memUsedMB / r.memTotalMB) * 100],
      }))
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [processes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    const g = canvas.getContext('2d')
    if (!g) return
    g.scale(2, 2)
    const draw = (series: number[], color: string, yOff: number, h: number) => {
      g.strokeStyle = color
      g.fillStyle = color + '33'
      g.lineWidth = 1.5
      g.beginPath()
      series.forEach((v, i) => {
        const x = (i / 59) * rect.width
        const y = yOff + h - (Math.min(100, v) / 100) * h
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y)
      })
      g.stroke()
      g.lineTo(((series.length - 1) / 59) * rect.width, yOff + h)
      g.lineTo(0, yOff + h)
      g.closePath()
      g.fill()
    }
    const half = rect.height / 2 - 8
    draw(history.cpu, '#e95420', 4, half)
    draw(history.mem, '#77216f', half + 12, half)
  }, [history])

  const r = snapshotResources(processes)
  const list = [...processes.processes].sort((a, b) => b.cpu - a.cpu)
  const selected = list.find((p) => p.pid === selectedPid)

  const endProcess = () => {
    if (!selected) return
    if (selected.pid === 1) { notify('System Monitor', 'Protected', 'PID 1 (init) cannot be ended.'); return }
    processes.kill(selected.pid)
    if (selected.windowId) closeWindow(selected.windowId)
    setSelectedPid(null)
    setTick((t) => t + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-3 p-3 pb-0">
        <Stat icon={<Cpu size={16} />} label="CPU" value={`${r.cpuPercent.toFixed(1)}%`} />
        <Stat icon={<MemoryStick size={16} />} label="Memory" value={`${(r.memUsedMB / 1024).toFixed(1)} / ${(r.memTotalMB / 1024).toFixed(0)} GiB`} />
        <Stat icon={<HardDrive size={16} />} label="Disk" value="32 / 100 GB" />
      </div>
      <div className="mx-3 mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] relative" style={{ height: 150 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        <span className="absolute top-1.5 left-2 text-[11px] text-[#e95420] flex items-center gap-1"><Activity size={11} /> CPU %</span>
        <span className="absolute bottom-1.5 left-2 text-[11px] text-[#b478e0]">Memory %</span>
        <span className="absolute top-1.5 right-2 text-[11px] text-[var(--muted)]">last 60 seconds · simulated load model</span>
      </div>

      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <h3 className="text-[13px] font-semibold">Processes</h3>
        <span className="text-[11.5px] text-[var(--muted)]">{list.length} running · load tied to open windows</span>
        <div className="flex-1" />
        <button onClick={() => setTick((t) => t + 1)} className="p-1.5 rounded hover:bg-[var(--hover)] text-[var(--muted)]"><RefreshCw size={14} /></button>
        <button onClick={endProcess} disabled={!selected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-600/90 text-white text-[12px] disabled:opacity-40">
          <Trash2 size={13} /> End process
        </button>
      </div>
      <div className="flex-1 overflow-auto px-3 pb-3">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
            <th className="py-1.5 font-medium">Process</th><th className="font-medium">User</th><th className="font-medium">% CPU</th><th className="font-medium">Memory</th><th className="font-medium">PID</th><th className="font-medium">Status</th>
          </tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.pid} onClick={() => setSelectedPid(p.pid)}
                className={`cursor-default ${selectedPid === p.pid ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]' : 'hover:bg-[var(--hover)]'}`}>
                <td className="py-1.5 pr-2 max-w-[280px] truncate">{p.command}</td>
                <td className="text-[var(--muted)]">{p.user}</td>
                <td className="mono">{p.cpu.toFixed(1)}</td>
                <td className="mono">{(p.mem * 160).toFixed(0)} MB</td>
                <td className="mono text-[var(--muted)]">{p.pid}</td>
                <td className="text-[var(--muted)]">{p.state === 'R' ? 'Running' : 'Sleeping'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 border-t border-[var(--border)] text-[11.5px] text-[var(--muted)] flex items-center gap-3">
        <Play size={11} /> Uptime {Math.floor(r.uptimeSec / 3600)}h {Math.floor((r.uptimeSec % 3600) / 60)}m
        <Square size={11} /> Load average {r.loadAvg.join('  ')}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">{icon}{label}</div>
      <div className="text-[16px] font-semibold mt-0.5">{value}</div>
    </div>
  )
}
