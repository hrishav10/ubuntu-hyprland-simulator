import { describe, expect, it } from 'vitest'
import { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { buildSeedFilesystem } from '../filesystem/seed'
import { PackageManager } from '../package-manager/PackageManager'
import { ProcessManager } from '../system/ProcessManager'
import { ShellSession, type ShellContext } from '../terminal/commands'
import { executeLine, executeWithSudo, COMMAND_COUNT } from '../terminal/commands-extra'

function makeCtx() {
  const fs = new VirtualFilesystem(buildSeedFilesystem())
  const pm = new PackageManager()
  const processes = new ProcessManager()
  const services = [
    { name: 'cron.service', description: 'cron', active: true },
    { name: 'bluetooth.service', description: 'bt', active: false },
  ]
  const ctx: ShellContext = {
    fs, pm, processes, services,
    setService: (name, active) => { const s = services.find((x) => x.name === name); if (s) s.active = active },
    openApp: () => {},
    closeWindowForPid: () => {},
    switchWorkspace: () => {},
    isOnline: () => true,
  }
  return { ctx, fs, pm, processes, services }
}

describe('shell commands', () => {
  it('exposes at least 40 commands', () => {
    expect(COMMAND_COUNT).toBeGreaterThanOrEqual(40)
  })
  it('pwd / cd / ls flow', () => {
    const { ctx } = makeCtx()
    const s = new ShellSession()
    expect(executeLine(s, 'pwd', ctx).output).toBe('/home/user')
    executeLine(s, 'cd Documents', ctx)
    expect(s.cwd).toBe('/home/user/Documents')
    expect(executeLine(s, 'ls', ctx).output).toContain('report.txt')
    executeLine(s, 'cd /etc', ctx)
    expect(executeLine(s, 'ls', ctx).output).toContain('os-release')
    expect(executeLine(s, 'cd /nonexistent', ctx).output).toContain('No such file or directory')
  })
  it('cat and echo with redirection and append', () => {
    const { ctx, fs } = makeCtx()
    const s = new ShellSession()
    executeLine(s, 'echo hello world > /home/user/out.txt', ctx)
    expect(fs.read('/home/user/out.txt')).toBe('hello world\n')
    executeLine(s, 'echo again >> /home/user/out.txt', ctx)
    expect(executeLine(s, 'cat /home/user/out.txt', ctx).output).toBe('hello world\nagain\n')
  })
  it('pipelines: ls | grep, cat | wc, sort | uniq', () => {
    const { ctx } = makeCtx()
    const s = new ShellSession()
    executeLine(s, 'printf-like > /dev/null', ctx) // unknown pieces tolerated? printf-like is not a command: expect error text, no throw
    executeLine(s, 'echo "banana\napple\napple" > /home/user/list.txt', ctx)
    const s2 = new ShellSession()
    // Build the file via separate writes to keep the test readable
    executeLine(s2, 'echo banana > /home/user/list.txt', ctx)
    executeLine(s2, 'echo apple >> /home/user/list.txt', ctx)
    executeLine(s2, 'echo apple >> /home/user/list.txt', ctx)
    expect(executeLine(s2, 'cat /home/user/list.txt | grep app', ctx).output).toBe('apple\napple')
    expect(executeLine(s2, 'cat /home/user/list.txt | sort | uniq', ctx).output).toBe('apple\nbanana')
    expect(executeLine(s2, 'cat /home/user/list.txt | wc -l', ctx).output).toBe('3')
  })
  it('variable assignment and expansion', () => {
    const { ctx } = makeCtx()
    const s = new ShellSession()
    executeLine(s, 'NAME=Ubuntu', ctx)
    expect(executeLine(s, 'echo $NAME', ctx).output).toBe('Ubuntu')
    expect(executeLine(s, "echo '$NAME'", ctx).output).toBe('$NAME')
    executeLine(s, 'export GREETING=hi', ctx)
    expect(executeLine(s, 'echo $GREETING there', ctx).output).toBe('hi there')
  })
  it('sudo flow: prompts, then executes with privileges', () => {
    const { ctx, fs } = makeCtx()
    const s = new ShellSession()
    const res = executeLine(s, 'sudo touch /etc/rootfile', ctx)
    expect(res.sudoPromptFor).toBe('touch /etc/rootfile')
    expect(fs.exists('/etc/rootfile')).toBe(false)
    executeWithSudo(s, res.sudoPromptFor!, ctx)
    expect(fs.exists('/etc/rootfile')).toBe(true)
    // second sudo within the timeout runs directly
    const res2 = executeLine(s, 'sudo touch /etc/rootfile2', ctx)
    expect(res2.sudoPromptFor).toBeUndefined()
    expect(fs.exists('/etc/rootfile2')).toBe(true)
  })
  it('apt requires sudo and install makes command available', () => {
    const { ctx, pm } = makeCtx()
    const s = new ShellSession()
    expect(executeLine(s, 'neofetch', ctx).output).toContain("can be installed with")
    expect(executeLine(s, 'apt install cowsay', ctx).output).toContain('Permission denied')
    executeLine(s, 'sudo apt install cowsay', ctx)
    // sudo prompts first — authenticate explicitly
    const s2 = new ShellSession()
    const prompt = executeLine(s2, 'sudo apt install cowsay', ctx)
    executeWithSudo(s2, prompt.sudoPromptFor!, ctx)
    expect(pm.isInstalled('cowsay')).toBe(true)
    expect(executeLine(s2, 'cowsay moo', ctx).output).toContain('moo')
  })
  it('systemctl start/stop reflects in services', () => {
    const { ctx, services } = makeCtx()
    const s = new ShellSession()
    executeWithSudo(s, 'systemctl start bluetooth.service', ctx)
    expect(services.find((x) => x.name === 'bluetooth.service')?.active).toBe(true)
    executeWithSudo(s, 'systemctl stop bluetooth.service', ctx)
    expect(services.find((x) => x.name === 'bluetooth.service')?.active).toBe(false)
  })
  it('ps lists processes and kill removes them', () => {
    const { ctx, processes } = makeCtx()
    const s = new ShellSession()
    const out = executeLine(s, 'ps', ctx).output
    expect(out).toContain('Hyprland')
    const spawned = processes.spawn('testproc')
    executeLine(s, `kill ${spawned.pid}`, ctx)
    expect(processes.processes.find((p) => p.pid === spawned.pid)).toBeUndefined()
    expect(executeLine(s, 'kill 1', ctx).output).toContain('not permitted')
  })
  it('misc info commands produce realistic output', () => {
    const { ctx } = makeCtx()
    const s = new ShellSession()
    expect(executeLine(s, 'whoami', ctx).output).toBe('user')
    expect(executeLine(s, 'uname -r', ctx).output).toContain('6.8.0')
    expect(executeLine(s, 'hostname', ctx).output).toBe('ubuntu-hypr')
    expect(executeLine(s, 'cal', ctx).output).toContain('Su Mo Tu We Th Fr Sa')
    expect(executeLine(s, 'man ls', ctx).output).toContain('ls(1)')
    expect(executeLine(s, 'definitelynotacommand', ctx).output).toContain('command not found')
  })
  it('find and tree walk the VFS', () => {
    const { ctx } = makeCtx()
    const s = new ShellSession()
    expect(executeLine(s, 'find /home/user -name "*.txt"', ctx).output).toContain('README.txt')
    expect(executeLine(s, 'tree /home/user/Documents', ctx).output).toContain('report.txt')
    expect(executeLine(s, 'find /home/user/Documents -type f', ctx).output).toContain('ideas.md')
  })
})
