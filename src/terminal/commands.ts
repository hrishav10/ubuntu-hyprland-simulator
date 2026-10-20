import { basename, dirname, normalizePath } from '../filesystem/PathResolver'
import { modeToString } from '../filesystem/types'
import { MANUAL_PAGES } from '../filesystem/seed'
import { formatUptime, snapshotResources } from '../system/ResourceModel'
import type { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import type { PackageManager } from '../package-manager/PackageManager'
import type { ProcessManager } from '../system/ProcessManager'
import type { SimService } from '../system/store'

/** Commands provided by installable packages (gated by the package manager). */
export const PACKAGE_COMMANDS = new Set(['neofetch', 'fastfetch', 'htop', 'btop', 'cowsay', 'cmatrix', 'sl', 'jq', 'git', 'curl', 'python3'])

export interface ShellContext {
  fs: VirtualFilesystem
  pm: PackageManager
  processes: ProcessManager
  services: SimService[]
  setService: (name: string, active: boolean) => void
  openApp: (appId: string, data?: Record<string, unknown>) => void
  closeWindowForPid: (pid: number) => void
  switchWorkspace: (n: number) => void
  isOnline: () => boolean
}

export class ShellSession {
  cwd = '/home/user'
  user = 'user'
  hostname = 'ubuntu-hypr'
  sudoAuthed = false
  sudoTime = 0
  history: string[] = []
  env: Record<string, string> = {
    HOME: '/home/user',
    USER: 'user',
    LOGNAME: 'user',
    SHELL: '/bin/bash',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    PWD: '/home/user',
    TERM: 'xterm-kitty',
    LANG: 'en_IN.UTF-8',
    XDG_SESSION_TYPE: 'wayland',
    HYPRLAND_INSTANCE_SIGNATURE: 'a1b2c3d4e5f6_1729500000',
  }
}

export interface ExecResult {
  output: string
  clear?: boolean
  /** when set, the terminal should prompt for a sudo password, then run this command */
  sudoPromptFor?: string
}

type CmdFn = (args: string[], stdin: string, s: ShellSession, ctx: ShellContext, sudo: boolean) => string | ExecResult

function err(m: string): never { throw new Error(m) }

function humanSize(n: number): string {
  if (n < 1024) return `${n}`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)}K`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)}M`
  return `${(n / 1024 ** 3).toFixed(1)}G`
}

function lsLong(fs: VirtualFilesystem, path: string, cwd: string, user: string, sudo: boolean, human: boolean): string {
  const node = fs.resolve(path, cwd)
  if (!node) err(`ls: cannot access '${path}': No such file or directory`)
  const size = (n: number) => (human ? humanSize(n) : `${n}`)
  const line = (name: string, type: typeof node.type, mode: number, owner: string, group: string, sz: number, modified: number, target?: string) =>
    `${modeToString(mode, type)} 1 ${owner} ${group} ${size(sz).padStart(6)} ${new Date(modified).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })} ${new Date(modified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ${name}${target ? ` -> ${target}` : ''}`
  if (node!.type !== 'dir') {
    return line(basename(normalizePath(path, cwd)), node!.type, node!.mode, node!.owner, node!.group, fs.sizeOf(node!), node!.modified, node!.target)
  }
  const entries = fs.list(path, cwd, user, sudo)
  return entries.map((e) => line(e.name, e.type, e.mode, e.owner, e.group, fs.sizeOf(e), e.modified, e.target)).join('\n')
}

const NEOFETCH_LOGO = [
  '            .-/+oossssoo+/-.',
  '        `:+ssssssssssssssssss+:`',
  '      -+ssssssssssssssssssyyssss+-',
  '    .ossssssssssssssssssdMMMNysssso.',
  '   /ssssssssssshdmmNNmmyNMMMMhssssss/',
  '  +ssssssssshmydMMMMMMMNddddyssssssss+',
  ' /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/',
  '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
  '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
  'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
  'ossyNMMMNyMMhsssssssssssssshmmmhssssssso',
  '+sssshhhyNMMNyssssssssssssyNMMMysssssss+',
  '.ssssssssdMMMNhsssssssssshNMMMdssssssss.',
  ' /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/',
  '  +sssssssssdmydMMMMMMMMddddyssssssss+',
  '   /ssssssssssshdmNNNNmyNMMMMhssssss/',
  '    .ossssssssssssssssssdMMMNysssso.',
  '      -+sssssssssssssssssyyyssss+-',
  '        `:+ssssssssssssssssss+:`',
  '            .-/+oossssoo+/-.',
]

export function neofetchText(s: ShellSession, ctx: ShellContext, fast = false): string {
  const r = snapshotResources(ctx.processes)
  const info = [
    `${s.user}@${s.hostname}`,
    '-'.repeat(`${s.user}@${s.hostname}`.length),
    'OS: Ubuntu 24.04.1 LTS x86_64',
    'Host: Browser VM',
    'Kernel: 6.8.0-45-generic',
    `Uptime: ${formatUptime(r.uptimeSec)}`,
    `Packages: ${ctx.pm.installed().length} (apt)`,
    'Shell: bash 5.2.21',
    'DE: Hyprland',
    'WM: Hyprland',
    'Terminal: kitty',
    'CPU: Browser Engine (8) @ 4.20GHz',
    `Memory: ${r.memUsedMB}MiB / ${r.memTotalMB}MiB`,
  ]
  if (fast) return info.join('\n')
  const lines = NEOFETCH_LOGO.map((logo, i) => `${logo.padEnd(42)}${info[i] ?? ''}`)
  if (info.length > NEOFETCH_LOGO.length) lines.push(...info.slice(NEOFETCH_LOGO.length).map((t) => `${''.padEnd(42)}${t}`))
  return lines.join('\n')
}

function calText(year: number, month: number): string {
  const first = new Date(year, month, 1)
  const days = new Date(year, month + 1, 0).getDate()
  const name = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const lines = [`     ${name}`, 'Su Mo Tu We Th Fr Sa']
  let week = '   '.repeat(first.getDay())
  for (let d = 1; d <= days; d++) {
    week += String(d).padStart(2) + ' '
    if ((first.getDay() + d) % 7 === 0) { lines.push(week.trimEnd()); week = '' }
  }
  if (week.trim()) lines.push(week.trimEnd())
  return lines.join('\n')
}

export const COMMANDS: Record<string, CmdFn> = {
  help: () => `Simulated bash — available commands:\n${Object.keys(COMMANDS).sort().join('  ')}\n\nTry: ls, cd, cat, grep, find, pipes (ls | grep txt), redirection (echo hi > file), man <cmd>, neofetch (install it first!). This shell is a simulation: nothing runs on your real computer.`,
  pwd: (_a, _i, s) => s.cwd,
  cd: (args, _i, s, ctx) => {
    const target = args[0] ?? s.env.HOME
    const abs = normalizePath(target, s.cwd)
    const node = ctx.fs.resolve(abs)
    if (!node) err(`bash: cd: ${target}: No such file or directory`)
    if (node.type !== 'dir') err(`bash: cd: ${target}: Not a directory`)
    s.cwd = abs
    s.env.PWD = abs
    return ''
  },
  ls: (args, _i, s, ctx, sudo) => {
    const flags = args.filter((a) => a.startsWith('-')).join('')
    const paths = args.filter((a) => !a.startsWith('-'))
    const path = paths[0] ?? s.cwd
    const node = ctx.fs.resolve(path, s.cwd)
    if (!node) err(`ls: cannot access '${path}': No such file or directory`)
    if (flags.includes('l')) return lsLong(ctx.fs, path, s.cwd, s.user, sudo, flags.includes('h'))
    if (node.type !== 'dir') return basename(normalizePath(path, s.cwd))
    let entries = ctx.fs.list(path, s.cwd, s.user, sudo)
    if (!flags.includes('a')) entries = entries.filter((e) => !e.name.startsWith('.'))
    return entries.map((e) => (e.type === 'dir' ? e.name + '/' : e.type === 'symlink' ? e.name + '@' : e.name)).join('  ')
  },
  cat: (args, stdin, s, ctx, sudo) => {
    if (args.length === 0) return stdin
    return args.map((a) => ctx.fs.read(a, s.cwd, s.user, sudo)).join('')
  },
  echo: (args) => args.join(' '),
  touch: (args, _i, s, ctx, sudo) => {
    if (!args[0]) err('touch: missing file operand')
    for (const a of args) {
      const abs = normalizePath(a, s.cwd)
      if (ctx.fs.exists(abs)) { const st = ctx.fs.stat(abs); if (st) st.node.modified = Date.now() }
      else ctx.fs.write(a, '', s.cwd, s.user, sudo)
    }
    return ''
  },
  mkdir: (args, _i, s, ctx, sudo) => {
    const parents = args.includes('-p')
    const dirs = args.filter((a) => !a.startsWith('-'))
    if (!dirs.length) err('mkdir: missing operand')
    for (const d of dirs) ctx.fs.mkdir(d, s.cwd, s.user, sudo, parents)
    return ''
  },
  rm: (args, _i, s, ctx, sudo) => {
    const recursive = args.some((a) => a.startsWith('-') && (a.includes('r') || a.includes('R')))
    const force = args.some((a) => a.startsWith('-') && a.includes('f'))
    const targets = args.filter((a) => !a.startsWith('-'))
    if (!targets.length) err('rm: missing operand')
    for (const t of targets) {
      try { ctx.fs.remove(t, s.cwd, s.user, sudo, recursive) }
      catch (e) { if (!force) throw e }
    }
    return ''
  },
  rmdir: (args, _i, s, ctx, sudo) => {
    if (!args[0]) err('rmdir: missing operand')
    ctx.fs.remove(args[0], s.cwd, s.user, sudo, false)
    return ''
  },
  cp: (args, _i, s, ctx, sudo) => {
    const operands = args.filter((a) => !a.startsWith('-'))
    if (operands.length < 2) err('cp: missing file operand')
    ctx.fs.copy(operands[0], operands[1], s.cwd, s.user, sudo)
    return ''
  },
  mv: (args, _i, s, ctx, sudo) => {
    const operands = args.filter((a) => !a.startsWith('-'))
    if (operands.length < 2) err('mv: missing file operand')
    ctx.fs.move(operands[0], operands[1], s.cwd, s.user, sudo)
    return ''
  },
  chmod: (args, _i, s, ctx, sudo) => {
    if (args.length < 2) err('chmod: missing operand')
    const [modeArg, ...files] = args
    for (const f of files) {
      const st = ctx.fs.stat(normalizePath(f, s.cwd))
      if (!st) err(`chmod: cannot access '${f}': No such file or directory`)
      let mode = st.node.mode
      if (/^[0-7]{3,4}$/.test(modeArg)) mode = parseInt(modeArg, 8)
      else if (modeArg === '+x') mode |= 0o111
      else if (modeArg === '-x') mode &= ~0o111
      else if (modeArg === '+w') mode |= 0o222
      else if (modeArg === '-w') mode &= ~0o222
      else err(`chmod: invalid mode: '${modeArg}'`)
      ctx.fs.chmod(f, mode, s.cwd, s.user, sudo)
    }
    return ''
  },
  chown: (args, _i, s, ctx, sudo) => {
    if (args.length < 2) err('chown: missing operand')
    for (const f of args.slice(1)) ctx.fs.chown(f, args[0].split(':')[0], s.cwd, sudo || s.user === 'root')
    return ''
  },
  ln: (args, _i, s, ctx, sudo) => {
    const symbolic = args.includes('-s')
    const operands = args.filter((a) => !a.startsWith('-'))
    if (!symbolic) err('ln: hard links are not supported in the simulated filesystem; use ln -s')
    if (operands.length < 2) err('ln: missing file operand')
    ctx.fs.makeSymlink(operands[0], operands[1], s.cwd, s.user, sudo)
    return ''
  },
  find: (args, _i, s, ctx) => {
    let start = s.cwd
    let pattern: string | null = null
    let typeFilter: string | null = null
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name') pattern = args[++i] ?? null
      else if (args[i] === '-type') typeFilter = args[++i] ?? null
      else if (!args[i].startsWith('-')) start = args[i]
    }
    let paths = ctx.fs.walk(start, s.cwd)
    if (pattern) {
      const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
      paths = paths.filter((p) => re.test(basename(p)))
    }
    if (typeFilter) paths = paths.filter((p) => { const st = ctx.fs.stat(p); return st && (typeFilter === 'd' ? st.node.type === 'dir' : st.node.type === 'file') })
    return paths.join('\n')
  },
  grep: (args, stdin, s, ctx, sudo) => {
    const insensitive = args.some((a) => a.startsWith('-') && a.includes('i'))
    const numbered = args.some((a) => a.startsWith('-') && a.includes('n'))
    const operands = args.filter((a) => !a.startsWith('-'))
    if (!operands.length) err('grep: missing pattern')
    const pattern = operands[0]
    const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'i' : '')
    const search = (text: string, prefix = '') =>
      text.split('\n').map((line, i) => ({ line, i })).filter(({ line }) => re.test(line))
        .map(({ line, i }) => `${prefix}${numbered ? `${i + 1}:` : ''}${line}`).join('\n')
    if (operands[1]) {
      const node = ctx.fs.resolve(operands[1], s.cwd)
      if (node?.type === 'dir') {
        // grep pattern dir -> search files in dir (simple -r behaviour)
        const out: string[] = []
        for (const p of ctx.fs.walk(operands[1], s.cwd)) {
          const st = ctx.fs.stat(p)
          if (st?.node.type === 'file') { const r = search(ctx.fs.read(p, '/', s.user, sudo), `${p}:`); if (r) out.push(r) }
        }
        return out.join('\n')
      }
      return search(ctx.fs.read(operands[1], s.cwd, s.user, sudo))
    }
    return search(stdin)
  },
  head: (args, stdin, s, ctx, sudo) => {
    const nIdx = args.indexOf('-n')
    const n = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : 10
    const nVal = nIdx >= 0 ? args[nIdx + 1] : undefined
    const fileArg = args.filter((a) => !a.startsWith('-') && a !== nVal)[0]
    const text = fileArg ? ctx.fs.read(fileArg, s.cwd, s.user, sudo) : stdin
    return text.split('\n').slice(0, n).join('\n')
  },
  tail: (args, stdin, s, ctx, sudo) => {
    const nIdx = args.indexOf('-n')
    const n = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : 10
    const nVal = nIdx >= 0 ? args[nIdx + 1] : undefined
    const fileArg = args.filter((a) => !a.startsWith('-') && a !== nVal)[0]
    const text = fileArg ? ctx.fs.read(fileArg, s.cwd, s.user, sudo) : stdin
    return text.split('\n').slice(-n).join('\n')
  },
  wc: (args, stdin, s, ctx, sudo) => {
    const fileArg = args.filter((a) => !a.startsWith('-'))[0]
    const text = fileArg ? ctx.fs.read(fileArg, s.cwd, s.user, sudo) : stdin
    const lines = text === '' ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const bytes = new Blob([text]).size
    if (args.includes('-l')) return `${lines}${fileArg ? ' ' + fileArg : ''}`
    if (args.includes('-w')) return `${words}${fileArg ? ' ' + fileArg : ''}`
    if (args.includes('-c')) return `${bytes}${fileArg ? ' ' + fileArg : ''}`
    return `${lines} ${words} ${bytes}${fileArg ? ' ' + fileArg : ''}`
  },
  sort: (args, stdin, s, ctx, sudo) => {
    const fileArg = args.filter((a) => !a.startsWith('-'))[0]
    const text = fileArg ? ctx.fs.read(fileArg, s.cwd, s.user, sudo) : stdin
    const lines = text.split('\n')
    if (lines[lines.length - 1] === '') lines.pop()
    if (args.includes('-r')) lines.reverse()
    else lines.sort()
    return lines.join('\n')
  },
  uniq: (_a, stdin) => {
    const out: string[] = []
    for (const line of stdin.split('\n')) if (out[out.length - 1] !== line) out.push(line)
    return out.join('\n')
  },
  ps: (_a, _i, _s, ctx) => {
    const header = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'
    const rows = ctx.processes.processes.map((p) =>
      `${p.user.padEnd(9)} ${String(p.pid).padStart(5)} ${(p.cpu).toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)}  182340  9216 ?        ${p.state}    06:12   0:0${Math.floor(p.cpu)} ${p.command}`)
    return [header, ...rows].join('\n')
  },
  kill: (args, _i, _s, ctx) => {
    const pidArg = args.filter((a) => !a.startsWith('-'))[0]
    if (!pidArg) err('kill: usage: kill [-9] pid')
    const pid = parseInt(pidArg, 10)
    if (pid === 1) err('bash: kill: (1) - Operation not permitted')
    if (!ctx.processes.kill(pid)) err(`bash: kill: (${pid}) - No such process`)
    ctx.closeWindowForPid(pid)
    return ''
  },
  top: (_a, _i, _s, ctx) => {
    const r = snapshotResources(ctx.processes)
    const header = `top - ${new Date().toLocaleTimeString('en-GB')} up ${formatUptime(r.uptimeSec)}, load average: ${r.loadAvg.join(', ')}\n%Cpu(s): ${r.cpuPercent.toFixed(1)} us, 2.1 sy, 0.0 ni, ${(100 - r.cpuPercent).toFixed(1)} id (snapshot — run System Monitor for live graphs)`
    return header + '\n\n' + COMMANDS.ps([], '', new ShellSession(), ctx, false)
  },
  whoami: (_a, _i, s, _ctx, sudo) => (sudo ? 'root' : s.user),
  id: (_a, _i, s, _ctx, sudo) => (sudo ? 'uid=0(root) gid=0(root) groups=0(root)' : `uid=1000(${s.user}) gid=1000(${s.user}) groups=1000(${s.user}),4(adm),27(sudo)`),
  hostname: (_a, _i, s) => s.hostname,
  env: (_a, _i, s) => Object.entries(s.env).map(([k, v]) => `${k}=${v}`).join('\n'),
  printenv: (args, _i, s) => (args[0] ? (s.env[args[0]] ?? '') : COMMANDS.env(args, '', s, undefined as never, false)),
  export: (args, _i, s) => {
    for (const a of args) {
      const m = a.match(/^(\w+)=(.*)$/)
      if (m) s.env[m[1]] = m[2]
    }
    return ''
  },
  unset: (args, _i, s) => { for (const a of args) delete s.env[a]; return '' },
  history: (_a, _i, s) => s.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n'),
  clear: () => ({ output: '', clear: true }),
  uname: (args) => {
    if (args.includes('-a')) return 'Linux ubuntu-hypr 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux'
    if (args.includes('-r')) return '6.8.0-45-generic'
    if (args.includes('-m')) return 'x86_64'
    return 'Linux'
  },
  date: (args) => {
    if (args[0] === '+%Y-%m-%d') return new Date().toISOString().slice(0, 10)
    return new Date().toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST ' + new Date().getFullYear()
  },
  cal: (args) => {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()
    if (args.length === 1) year = parseInt(args[0], 10) || year
    if (args.length >= 2) { month = (parseInt(args[0], 10) || 1) - 1; year = parseInt(args[1], 10) || year }
    if (args.length === 1 && parseInt(args[0], 10) <= 12 && args[0].length <= 2) { month = parseInt(args[0], 10) - 1 }
    return calText(year, month)
  },
  uptime: (_a, _i, _s, ctx) => {
    const r = snapshotResources(ctx.processes)
    return `${new Date().toLocaleTimeString('en-GB')} up ${formatUptime(r.uptimeSec)},  1 user,  load average: ${r.loadAvg.join(', ')}`
  },
  df: () => ['Filesystem      Size  Used Avail Use% Mounted on', '/dev/sda2        100G   32G   68G  32% /', 'tmpfs             16G     0   16G   0% /tmp', 'efivarfs         192K  110K   77K  59% /sys/firmware/efi/efivars'].join('\n'),
  du: (args, _i, s, ctx) => {
    const path = args.filter((a) => !a.startsWith('-'))[0] ?? s.cwd
    const node = ctx.fs.resolve(path, s.cwd)
    if (!node) err(`du: cannot access '${path}': No such file or directory`)
    return `${Math.ceil(ctx.fs.sizeOf(node) / 1024)}\t${normalizePath(path, s.cwd)}`
  },
  free: (_a, _i, _s, ctx) => {
    const r = snapshotResources(ctx.processes)
    return ['               total        used        free      shared  buff/cache   available', `Mem:        ${r.memTotalMB}     ${r.memUsedMB}     ${r.memTotalMB - r.memUsedMB}         128        2048       ${r.memTotalMB - r.memUsedMB + 1024}`, `Swap:        4096         ${r.swapUsedMB}        ${4096 - r.swapUsedMB}`].join('\n')
  },
  ip: (args, _i, _s, ctx) => {
    if (args[0] === 'a' || args[0] === 'addr' || !args[0]) {
      const online = ctx.isOnline()
      return ['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536', '    inet 127.0.0.1/8 scope host lo', '2: wlan0: <BROADCAST,MULTICAST,UP> mtu 1500 qdisc fq_codel state UP', online ? '    inet 192.168.1.42/24 brd 192.168.1.255 scope global wlan0' : '    (no address — not connected)'].join('\n')
    }
    return 'Usage: ip addr'
  },
  ping: (args, _i, _s, ctx) => {
    const host = args.filter((a) => !a.startsWith('-')).pop() ?? 'example.local'
    if (!ctx.isOnline()) return `ping: ${host}: Temporary failure in name resolution`
    const lines = [`PING ${host} (93.184.216.34) 56(84) bytes of data. (SIMULATED — no real packets sent)`]
    for (let i = 1; i <= 4; i++) lines.push(`64 bytes from ${host} (93.184.216.34): icmp_seq=${i} ttl=64 time=${(8 + Math.random() * 14).toFixed(1)} ms`)
    lines.push('', `--- ${host} ping statistics ---`, '4 packets transmitted, 4 received, 0% packet loss')
    return lines.join('\n')
  },
  which: (args, _i, _s, ctx) => {
    const name = args[0]
    if (!name) return ''
    if (COMMANDS[name] || PACKAGE_COMMANDS.has(name)) return `/usr/bin/${name}`
    if (ctx.pm.isInstalled(name)) return `/usr/bin/${name}`
    return ''
  },
  type: (args, _i, _s, ctx) => {
    const name = args[0]
    if (!name) return ''
    if (COMMANDS[name]) return `${name} is a shell builtin`
    if (ctx.pm.isInstalled(name)) return `${name} is /usr/bin/${name}`
    return `bash: type: ${name}: not found`
  },
  man: (args) => {
    const topic = args[0]
    if (!topic) return 'What manual page do you want?'
    const page = MANUAL_PAGES[topic]
    if (!page) err(`No manual entry for ${topic}`)
    return page + '\n\n(Simulated manual page.)'
  },
  stat: (args, _i, s, ctx) => {
    const st = ctx.fs.stat(normalizePath(args[0] ?? '', s.cwd))
    if (!st) err(`stat: cannot statx '${args[0]}': No such file or directory`)
    return [`  File: ${st.path}`, `  Size: ${st.size}\tBlocks: ${Math.ceil(st.size / 512)}    IO Block: 4096   ${st.node.type}`, `  Mode: (${(st.node.mode & 0o777).toString(8)}/${modeToString(st.node.mode, st.node.type)})  Uid: (${st.node.owner === 'root' ? 0 : 1000}/${st.node.owner})  Gid: (${st.node.owner === 'root' ? 0 : 1000}/${st.node.group})`, `Modify: ${new Date(st.node.modified).toISOString()}`].join('\n')
  },
  file: (args, _i, s, ctx) => {
    const st = ctx.fs.stat(normalizePath(args[0] ?? '', s.cwd))
    if (!st) err(`file: cannot open '${args[0]}' (No such file or directory)`)
    if (st.node.type === 'dir') return `${args[0]}: directory`
    if (st.node.type === 'symlink') return `${args[0]}: symbolic link to ${st.node.target}`
    if (args[0].endsWith('.svg')) return `${args[0]}: SVG Scalable Vector Graphics image`
    if (args[0].endsWith('.py')) return `${args[0]}: Python script, ASCII text executable`
    if (args[0].endsWith('.zip')) return `${args[0]}: Zip archive data`
    return `${args[0]}: ASCII text`
  },
  basename: (args) => basename(args[0] ?? ''),
  dirname: (args) => dirname(args[0] ?? ''),
  tree: (args, _i, s, ctx) => {
    const start = args.filter((a) => !a.startsWith('-'))[0] ?? s.cwd
    const abs = normalizePath(start, s.cwd)
    const root = ctx.fs.resolve(abs)
    if (!root) err(`tree: ${start}: No such file or directory`)
    const lines: string[] = [abs]
    const walk = (node: typeof root, prefix: string) => {
      const kids = Object.values(node.children ?? {}).sort((a, b) => a.name.localeCompare(b.name))
      kids.forEach((kid, i) => {
        const last = i === kids.length - 1
        lines.push(`${prefix}${last ? '└── ' : '├── '}${kid.name}`)
        if (kid.type === 'dir') walk(kid, prefix + (last ? '    ' : '│   '))
      })
    }
    walk(root, '')
    return lines.join('\n')
  },
  lsblk: () => ['NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS', 'sda      8:0    0   100G  0 disk', '├─sda1   8:1    0   512M  0 part /boot/efi', '└─sda2   8:2    0  99.5G  0 part /'].join('\n'),
  lscpu: () => ['Architecture: x86_64', 'CPU(s): 8', 'Model name: Browser Engine CPU', 'Thread(s) per core: 2', 'Core(s) per socket: 4'].join('\n'),
  journalctl: (args, _i, s, ctx, sudo) => {
    let text = ''
    try { text = ctx.fs.read('/var/log/syslog', '/', s.user, sudo) } catch { text = '' }
    const extra = 'Oct 20 06:12:01 ubuntu-hypr systemd[1]: systemd 255.4-1ubuntu8 running in system mode.\nOct 20 06:12:04 ubuntu-hypr systemd[1]: Startup finished in 4.085s.'
    const all = (extra + '\n' + text).split('\n')
    const nIdx = args.indexOf('-n')
    const n = nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : all.length
    return all.slice(-n).join('\n')
  },
}
