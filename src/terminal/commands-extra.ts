
/* ---------- Package-provided & system commands (appended to registry) ---------- */
import { COMMANDS, neofetchText, PACKAGE_COMMANDS, type ExecResult, type ShellContext, type ShellSession } from './commands'
import { expandToken, parseLine } from './ShellParser'
import { normalizePath } from '../filesystem/PathResolver'
export { COMMANDS }

export { PACKAGE_COMMANDS } from './commands'

type CmdFn = (args: string[], stdin: string, s: ShellSession, ctx: ShellContext, sudo: boolean) => string | { output: string; clear?: boolean }

Object.assign(COMMANDS, {
  neofetch: (_a: string[], _i: string, s: ShellSession, ctx: ShellContext) => neofetchText(s, ctx),
  fastfetch: (_a: string[], _i: string, s: ShellSession, ctx: ShellContext) => neofetchText(s, ctx, true),
  htop: (_a: string[], _i: string, _s: ShellSession, ctx: ShellContext) => COMMANDS.top([], '', _s, ctx, false) + '\n(htop interactive view is represented by this snapshot; open System Monitor for live graphs.)',
  btop: (_a: string[], _i: string, _s: ShellSession, ctx: ShellContext) => COMMANDS.top([], '', _s, ctx, false),
  cowsay: (args: string[]) => {
    const msg = args.join(' ') || 'Moo!'
    const top = ' ' + '_'.repeat(msg.length + 2)
    const bottom = ' ' + '-'.repeat(msg.length + 2)
    return [top, `< ${msg} >`, bottom, '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||'].join('\n')
  },
  cmatrix: () => '(cmatrix: the matrix rain is best seen in a real terminal — this shell prints a snapshot)\nﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃ0123456789Z=*+-<>¦╌ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃ',
  sl: () => '      ====        ________                \n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|  \n   /     |  |   H  |  |     |   |         ||_| |_||  \n  |      |  |   H  |__--------------------| [___] |  \n  | ________|___H__/__|_____/[][]~\\_______|       |  \n  |/ |   |-----------I_____I [][] []  D   |=======|__\n(you typed `sl` instead of `ls`)',
  jq: (_a: string[], stdin: string) => {
    if (!stdin.trim()) return 'jq: no input (pipe JSON into jq, e.g. echo \'{"a":1}\' | jq .)'
    try { return JSON.stringify(JSON.parse(stdin), null, 2) } catch { throw new Error('jq: parse error: invalid JSON') }
  },
  git: (args: string[]) => {
    if (args[0] === '--version' || args[0] === 'version') return 'git version 2.43.0'
    if (args[0] === 'status') return 'fatal: not a git repository (or any of the parent directories): .git'
    if (args[0] === 'clone') return 'Cloning requires network access, which this desktop session does not use for git.'
    return `git: '${args[0] ?? ''}' — supported here: --version, status, clone (see Help)`
  },
  curl: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext) => {
    const url = args.filter((a) => !a.startsWith('-')).pop()
    if (!url) throw new Error('curl: no URL specified')
    if (!ctx.isOnline()) return `curl: (6) Could not resolve host (connection is down in this session)`
    if (url.includes('example')) return '<!doctype html><html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><p>Served from local data in this session.</p></body></html>'
    return `curl: (7) Failed to connect — ${url} is not part of the local page set in this session`
  },
  wget: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext) => {
    const url = args.filter((a) => !a.startsWith('-')).pop() ?? ''
    if (!ctx.isOnline()) return `wget: unable to resolve host address (connection is down in this session)`
    return `wget: ${url} is not part of the local page set in this session; nothing was downloaded`
  },
  python3: (args: string[]) => {
    if (args[0] === '--version' || args[0] === '-V') return 'Python 3.12.3'
    if (args[0]) return `python3: executing arbitrary code is outside this session's shell — open ${args[0]} in the Code Editor instead`
    return 'Python 3.12.3 (interactive REPL is not part of this shell — use the Code Editor)'
  },
  apt: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext, sudo: boolean) => aptImpl(args, ctx, sudo, 'apt'),
  'apt-get': (args: string[], _i: string, _s: ShellSession, ctx: ShellContext, sudo: boolean) => aptImpl(args, ctx, sudo, 'apt-get'),
  dpkg: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext) => {
    if (args[0] === '-l') return ctx.pm.list().filter((p) => p.installed).map((p) => `ii  ${p.name.padEnd(24)} ${p.version.padEnd(16)} amd64  ${p.description}`).join('\n')
    if (args[0] === '-s' && args[1]) { const p = ctx.pm.get(args[1]); if (!p) throw new Error(`dpkg-query: package '${args[1]}' is not installed`); return `Package: ${p.name}\nStatus: ${p.installed ? 'install ok installed' : 'deinstall ok config-files'}\nVersion: ${p.version}\nDescription: ${p.description}` }
    return 'Usage: dpkg -l | dpkg -s <package>'
  },
} satisfies Record<string, CmdFn>)

function aptImpl(args: string[], ctx: ShellContext, sudo: boolean, prog: string): string {
  const sub = args[0]
  const rest = args.slice(1).filter((a) => !a.startsWith('-'))
  if (!sub || sub === 'help') return `Usage: ${prog} [update|install|remove|search|list|show] ...`
  if (sub === 'update') {
    if (!sudo) throw new Error(`E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/\n(Hint: use sudo — in this session the sudo password is "ubuntu".)`)
    return ctx.pm.update().output
  }
  if (sub === 'install') {
    if (!sudo) throw new Error('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock. (Hint: use sudo — password "ubuntu".)')
    if (!rest[0]) throw new Error('E: No packages specified')
    return rest.map((name) => ctx.pm.install(name, ctx.fs).output).join('\n')
  }
  if (sub === 'remove' || sub === 'purge') {
    if (!sudo) throw new Error('E: Permission denied. (Hint: use sudo — password "ubuntu".)')
    if (!rest[0]) throw new Error('E: No packages specified')
    return rest.map((name) => ctx.pm.remove(name, ctx.fs).output).join('\n')
  }
  if (sub === 'search') {
    if (!rest[0]) return 'Usage: apt search <term>'
    const found = ctx.pm.search(rest[0])
    return found.length ? found.map((p) => `${p.name}/noble ${p.version} amd64\n  ${p.description}`).join('\n') : `No packages match "${rest[0]}".`
  }
  if (sub === 'list') {
    const installedOnly = args.includes('--installed')
    const list = installedOnly ? ctx.pm.installed() : ctx.pm.list()
    return list.map((p) => `${p.name}/noble ${p.version} amd64${p.installed ? ' [installed]' : ''}`).join('\n')
  }
  if (sub === 'show') {
    const p = ctx.pm.get(rest[0] ?? '')
    if (!p) throw new Error(`E: No packages found`)
    return `Package: ${p.name}\nVersion: ${p.version}\nSection: ${p.category}\nSize: ${p.sizeKB} kB (package record)\nDescription: ${p.description}`
  }
  throw new Error(`E: Invalid operation ${sub}`)
}

Object.assign(COMMANDS, {
  systemctl: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext, sudo: boolean) => {
    const sub = args[0]
    if (!sub || sub === 'status') {
      return `● ubuntu-hypr\n    State: running\n    Units: ${ctx.services.length} loaded (session service list)\n    Jobs: 0 queued\n   Failed: 0 units`
    }
    if (sub === 'list-units') return ctx.services.map((x) => `${x.name.padEnd(28)} loaded ${x.active ? 'active running' : 'inactive dead'}  ${x.description}`).join('\n')
    if (['start', 'stop', 'restart'].includes(sub)) {
      const name = args[1]
      if (!name) throw new Error(`systemctl: missing unit name`)
      const svc = ctx.services.find((x) => x.name === name || x.name === name + '.service')
      if (!svc) throw new Error(`Failed to ${sub} ${name}: Unit ${name} not found.`)
      if (!sudo) throw new Error(`Failed to ${sub} ${name}: Interactive authentication required. (Hint: use sudo — password "ubuntu".)`)
      ctx.setService(svc.name, sub !== 'stop')
      return ''
    }
    if (sub === 'is-active') { const svc = ctx.services.find((x) => x.name === args[1] || x.name === args[1] + '.service'); return svc ? (svc.active ? 'active' : 'inactive') : 'unknown' }
    return `systemctl: unknown command "${sub}" (supported: status, list-units, start, stop, restart, is-active)`
  },
  hyprctl: (args: string[], _i: string, _s: ShellSession, ctx: ShellContext) => {
    const sub = args[0]
    if (sub === 'version') return 'Hyprland, built from branch main at commit simulated.\nTag: v0.41.2-12 (session build)'
    if (sub === 'monitors') return 'Monitor eDP-1 (ID 0):\n\t1920x1080@60.00000 at 0x0\n\tdescription: Simulated internal display\n\tactive workspace: see workspaces\n\tscale: 1.00'
    if (sub === 'workspaces') return ctx.processes.processes.length ? [1, 2, 3, 4, 5].map((n) => `workspace ID ${n}\n\twindows: ${'' + 0}\n\tmonitor: eDP-1`).join('\n') : ''
    if (sub === 'clients') return ctx.processes.processes.filter((p) => p.windowId).map((p) => `Window ${p.windowId} -> ${p.command}:\n\tmapped: 1\n\tpid: ${p.pid}`).join('\n\n') || 'no clients'
    if (sub === 'reload') return 'ok'
    if (sub === 'dispatch' && args[1] === 'workspace' && args[2]) { ctx.switchWorkspace(parseInt(args[2], 10)); return 'ok' }
    if (sub === 'keyword') return 'ok'
    return 'usage: hyprctl [version|monitors|workspaces|clients|reload|dispatch workspace N|keyword ...]'
  },
  nano: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => {
    if (!args[0]) throw new Error('nano: missing file')
    ctx.openApp('editor', { path: normalizePath(args[0], s.cwd) })
    return `(opened ${args[0]} in the Text Editor window)`
  },
  vim: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => {
    if (!args[0]) return 'vim: the modal editor is represented by the Code Editor in this session — run: vim <file>'
    ctx.openApp('code-editor', { path: normalizePath(args[0], s.cwd) })
    return `(opened ${args[0]} in the Code Editor window)`
  },
  vi: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => COMMANDS.vim(args, '', s, ctx, false),
  code: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => {
    if (args[0]) ctx.openApp('code-editor', { path: normalizePath(args[0], s.cwd) })
    else ctx.openApp('code-editor')
    return ''
  },
  xdg_open: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => {
    if (!args[0]) throw new Error('xdg-open: missing file')
    const abs = normalizePath(args[0], s.cwd)
    if (/\.(png|jpe?g|svg|gif|webp)$/i.test(abs)) ctx.openApp('image-viewer', { path: abs })
    else if (/\.pdf$/i.test(abs)) ctx.openApp('pdf-viewer', { path: abs })
    else if (/\.(mp3|mp4|mkv|webm)$/i.test(abs)) ctx.openApp('media', { path: abs })
    else if (/\.zip$/i.test(abs)) ctx.openApp('archive', { path: abs })
    else ctx.openApp('editor', { path: abs })
    return ''
  },
  'xdg-open': (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => COMMANDS.xdg_open(args, '', s, ctx, false),
  open: (args: string[], _i: string, s: ShellSession, ctx: ShellContext) => COMMANDS.xdg_open(args, '', s, ctx, false),
  exit: () => '',
  logout: () => '',
  sleep: () => '',
  ssh: (args: string[]) => `ssh: connect to host ${args[0] ?? ''} port 22: Network is unreachable in this session (no outbound SSH)`,
  scp: () => 'scp: transfers are not part of this session',
  sensors: () => 'coretemp-isa-0000\nAdapter: ISA adapter\nCore 0:        +47.0°C  (representative reading)\nCore 1:        +45.0°C',
  lsusb: () => 'Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub\nBus 001 Device 003: ID 8087:0a2b Intel Corp. Bluetooth wireless interface',
  exit_: () => '',
} satisfies Record<string, CmdFn>)

/** Execute one full line: sudo handling, pipelines, redirection, $VAR expansion. */
export function executeLine(session: ShellSession, rawLine: string, ctx: ShellContext): ExecResult {
  const line = rawLine.trim()
  if (!line) return { output: '' }
  session.history.push(line)

  // sudo at start of line
  if (/^sudo(\s|$)/.test(line)) {
    const rest = line.replace(/^sudo\s*/, '')
    if (!rest) return { output: 'usage: sudo command' }
    const authed = session.sudoAuthed && Date.now() - session.sudoTime < 5 * 60_000
    if (!authed) return { output: '', sudoPromptFor: rest }
    return runPipeline(session, rest, ctx, true)
  }
  return runPipeline(session, line, ctx, false)
}

/** Called by the terminal after a correct sudo password was entered. */
export function executeWithSudo(session: ShellSession, command: string, ctx: ShellContext): ExecResult {
  session.sudoAuthed = true
  session.sudoTime = Date.now()
  return runPipeline(session, command, ctx, true)
}

function runPipeline(session: ShellSession, line: string, ctx: ShellContext, sudo: boolean): ExecResult {
  const { segments } = parseLine(line)
  let stdin = ''
  let clear = false
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg.redirectIn) {
      try { stdin = ctx.fs.read(seg.redirectIn, session.cwd, session.user, sudo) }
      catch (e) { return { output: `bash: ${seg.redirectIn}: ${(e as Error).message}` } }
    }
    if (seg.tokens.length === 0) continue
    const expanded = seg.tokens.map((t) => expandToken(t, session.env))
    const [cmd, ...args] = expanded

    // assignments: VAR=value (only when it's the whole command)
    if (segments.length === 1 && /^[A-Za-z_]\w*=/.test(cmd) && args.length === 0) {
      const m = cmd.match(/^(\w+)=(.*)$/)!
      session.env[m[1]] = m[2]
      return { output: '' }
    }

    // cd must mutate the session even inside a pipeline position
    if (PACKAGE_COMMANDS.has(cmd) && !ctx.pm.isInstalled(cmd)) {
      return { output: `Command '${cmd}' not found, but can be installed with:\nsudo apt install ${cmd}` }
    }
    const fn = COMMANDS[cmd]
    if (!fn) return { output: `bash: ${cmd}: command not found` }
    let out: string | ExecResult
    try {
      out = fn(args, stdin, session, ctx, sudo)
    } catch (e) {
      return { output: (e as Error).message }
    }
    const result: ExecResult = typeof out === 'string' ? { output: out } : out
    if (result.clear) clear = true
    stdin = result.output

    const isLast = i === segments.length - 1
    if ((seg.redirectOut || seg.redirectAppend) && isLast) {
      const target = (seg.redirectOut ?? seg.redirectAppend)!
      try {
        ctx.fs.write(target, result.output + (result.output && !result.output.endsWith('\n') ? '\n' : ''), session.cwd, session.user, sudo, !!seg.redirectAppend)
      } catch (e) {
        return { output: `bash: ${target}: ${(e as Error).message}` }
      }
      stdin = ''
    } else if (seg.redirectOut || seg.redirectAppend) {
      stdin = ''
    }
  }
  return { output: stdin, clear }
}

export const COMMAND_COUNT = Object.keys(COMMANDS).filter((k) => !k.includes('_')).length
