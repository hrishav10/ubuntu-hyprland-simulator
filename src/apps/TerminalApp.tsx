import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useStore } from '../system/store'
import { ShellSession, type ShellContext } from '../terminal/commands'
import { executeLine, executeWithSudo, COMMANDS } from '../terminal/commands-extra'
import { tokenize } from '../terminal/ShellParser'

const SUDO_PASSWORD = 'ubuntu' // disclosed openly in Help/man sudo: this is a simulation

export default function TerminalApp({ windowId }: { windowId: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Ubuntu Mono", ui-monospace, monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      scrollback: 4000,
      theme: {
        background: '#16131b',
        foreground: '#e6e1ef',
        cursor: '#e95420',
        selectionBackground: 'rgba(233,84,32,0.35)',
        black: '#241f2e', red: '#e5484d', green: '#46a758', yellow: '#f5d90a',
        blue: '#3e9bff', magenta: '#b478e0', cyan: '#12a594', white: '#e6e1ef',
        brightBlack: '#6e6590', brightRed: '#ff6369', brightGreen: '#71d99a', brightYellow: '#ffe94d',
        brightBlue: '#70b8ff', brightMagenta: '#d0a5f5', brightCyan: '#3ddbd9', brightWhite: '#ffffff',
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    try { fit.fit() } catch { /* not laid out yet */ }

    const session = new ShellSession()
    let buffer = ''
    let cursor = 0
    let historyIdx = -1
    let sudoPending: string | null = null
    let sudoAttempts = 0
    let disposed = false

    const ctx = (): ShellContext => {
      const st = useStore.getState()
      return {
        fs: st.fs!,
        pm: st.pm,
        processes: st.processes,
        services: st.services,
        setService: st.toggleService,
        openApp: (id, data) => { st.openApp(id, data) },
        closeWindowForPid: (pid) => {
          const proc = st.processes.processes.find((p) => p.pid === pid)
          if (proc?.windowId) st.closeWindow(proc.windowId)
        },
        switchWorkspace: st.switchWorkspace,
        isOnline: () => st.network.online,
      }
    }

    const promptText = () => {
      const cwd = session.cwd.replace(session.env.HOME, '~')
      return `\x1b[1;32m${session.user}@${session.hostname}\x1b[0m:\x1b[1;34m${cwd}\x1b[0m$ `
    }
    const promptPlainLen = `${session.user}@${session.hostname}:${session.cwd.replace(session.env.HOME, '~')}$ `.length

    const redrawLine = () => {
      term.write('\r\x1b[K' + promptText() + buffer + `\r\x1b[${promptPlainLen + cursor}C`)
    }
    const newPrompt = () => {
      term.write('\r\n' + promptText())
      buffer = ''
      cursor = 0
      historyIdx = -1
    }

    term.writeln('\x1b[1mWelcome to Ubuntu 24.04.1 LTS\x1b[0m (GNU/Linux 6.8.0-45-generic x86_64)')
    term.writeln('Type \x1b[1mhelp\x1b[0m for the list of commands. This terminal is a shell session on your simulated desktop.')
    term.write(promptText())

    const runLine = (line: string) => {
      const c = ctx()
      if (!c.fs) { term.writeln('filesystem not ready'); newPrompt(); return }
      const res = executeLine(session, line, c)
      if (res.sudoPromptFor !== undefined) {
        sudoPending = res.sudoPromptFor
        sudoAttempts = 0
        term.write('\r\n[sudo] password for user: ')
        buffer = ''
        cursor = 0
        return
      }
      if (res.clear) term.clear()
      if (res.output) term.write('\r\n' + res.output.replace(/\n/g, '\r\n'))
      newPrompt()
    }

    const complete = () => {
      const before = buffer.slice(0, cursor)
      const parts = before.split(/\s+/)
      const last = parts[parts.length - 1]
      let candidates: string[] = []
      if (parts.length === 1) {
        candidates = [...Object.keys(COMMANDS), 'sudo', 'nano', 'vim'].filter((c) => c.startsWith(last))
      } else {
        const c = ctx()
        if (c.fs) {
          const dirPart = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : ''
          const base = last.slice(dirPart.length)
          try {
            const dirAbs = dirPart ? dirPart : session.cwd
            candidates = c.fs.list(dirAbs, session.cwd).filter((n) => n.name.startsWith(base)).map((n) => dirPart + n.name + (n.type === 'dir' ? '/' : ''))
          } catch { candidates = [] }
        }
      }
      if (candidates.length === 1) {
        const replacement = candidates[0]
        buffer = buffer.slice(0, cursor - last.length) + replacement + buffer.slice(cursor)
        cursor = cursor - last.length + replacement.length
        redrawLine()
      } else if (candidates.length > 1) {
        term.write('\r\n' + candidates.join('  '))
        term.write('\r\n' + promptText() + buffer)
      }
    }

    const disposable = term.onData((data) => {
      if (disposed) return
      // Paste / multi-char input
      if (data.length > 1 && !data.startsWith('\x1b')) {
        if (sudoPending) return // ignore paste at password prompt
        buffer = buffer.slice(0, cursor) + data.replace(/[\r\n]/g, '') + buffer.slice(cursor)
        cursor += data.length
        redrawLine()
        return
      }
      switch (data) {
        case '\r': { // Enter
          if (sudoPending) {
            const pw = buffer
            buffer = ''
            cursor = 0
            if (pw === SUDO_PASSWORD) {
              const cmd = sudoPending
              sudoPending = null
              term.write('\r\n')
              const res = executeWithSudo(session, cmd, ctx())
              if (res.output) term.write(res.output.replace(/\n/g, '\r\n') + '\r\n')
              term.write(promptText())
            } else {
              sudoAttempts++
              if (sudoAttempts >= 3) {
                sudoPending = null
                term.write('\r\nsudo: 3 incorrect password attempts\r\n')
                term.write(promptText())
              } else {
                term.write('\r\nSorry, try again.\r\n[sudo] password for user: ')
              }
            }
            return
          }
          term.write('\r\n')
          runLine(buffer)
          return
        }
        case '\x7f': // Backspace
          if (cursor > 0) {
            buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor)
            cursor--
            redrawLine()
          }
          return
        case '\x1b[D': if (cursor > 0) { cursor--; term.write('\x1b[D') } return
        case '\x1b[C': if (cursor < buffer.length) { cursor++; term.write('\x1b[C') } return
        case '\x1b[H': cursor = 0; redrawLine(); return
        case '\x1b[F': cursor = buffer.length; redrawLine(); return
        case '\x1b[A': { // history up
          if (sudoPending) return
          if (session.history.length === 0) return
          historyIdx = historyIdx === -1 ? session.history.length - 1 : Math.max(0, historyIdx - 1)
          buffer = session.history[historyIdx] ?? buffer
          cursor = buffer.length
          redrawLine()
          return
        }
        case '\x1b[B': { // history down
          if (sudoPending) return
          if (historyIdx === -1) return
          historyIdx++
          if (historyIdx >= session.history.length) { historyIdx = -1; buffer = '' } else buffer = session.history[historyIdx]
          cursor = buffer.length
          redrawLine()
          return
        }
        case '\t':
          if (!sudoPending) complete()
          return
        case '\x03': // Ctrl+C
          if (sudoPending) { sudoPending = null; term.write('^C\r\n'); term.write(promptText()); buffer = ''; cursor = 0; return }
          term.write('^C')
          buffer = ''
          cursor = 0
          newPrompt()
          return
        case '\x0c': // Ctrl+L
          term.clear()
          term.write(promptText() + buffer)
          return
        case '\x15': // Ctrl+U
          buffer = ''
          cursor = 0
          redrawLine()
          return
        case '\x01': cursor = 0; redrawLine(); return // Ctrl+A
        case '\x05': cursor = buffer.length; redrawLine(); return // Ctrl+E
        case '\x04': return // Ctrl+D ignored (does not close the simulated shell)
        default:
          if (data >= ' ' && data !== '\x7f') {
            if (sudoPending) { buffer += data; cursor++; return } // no echo for password
            buffer = buffer.slice(0, cursor) + data + buffer.slice(cursor)
            cursor++
            if (cursor === buffer.length) term.write(data)
            else redrawLine()
          }
      }
    })

    const ro = new ResizeObserver(() => { try { fit.fit() } catch { /* ignore */ } })
    ro.observe(host)
    term.focus()

    // Expose focus for parent clicks
    const onFocusRequest = () => term.focus()
    host.addEventListener('pointerdown', onFocusRequest)

    return () => {
      disposed = true
      ro.disconnect()
      disposable.dispose()
      host.removeEventListener('pointerdown', onFocusRequest)
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId])

  void win
  return <div ref={hostRef} className="h-full w-full bg-[#16131b]" data-terminal />
}

/** Tab-completion tokenize helper re-exported for tests. */
export { tokenize }
