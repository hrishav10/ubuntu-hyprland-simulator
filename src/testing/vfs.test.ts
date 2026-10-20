import { describe, expect, it } from 'vitest'
import { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { buildSeedFilesystem } from '../filesystem/seed'

describe('VirtualFilesystem', () => {
  it('seeds a realistic FHS tree', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    for (const p of ['/home/user', '/home/user/Desktop', '/etc/os-release', '/etc/passwd', '/usr/bin', '/var/log/syslog', '/tmp', '/home/user/.config/hypr/hyprland.conf', '/etc/apt/sources.list.d/ubuntu.sources']) {
      expect(fs.exists(p), p).toBe(true)
    }
    expect(fs.read('/home/user/.config/hypr/hyprland.conf')).toContain('bind = $mainMod, Q, exec, $terminal')
    expect(fs.read('/etc/os-release')).toContain('24.04')
  })
  it('creates, writes, appends and reads files', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    fs.write('/home/user/a.txt', 'hello', '/')
    expect(fs.read('/home/user/a.txt')).toBe('hello')
    fs.write('/home/user/a.txt', ' world', '/', 'user', false, true)
    expect(fs.read('/home/user/a.txt')).toBe('hello world')
  })
  it('mkdir -p, copy, move, rename, remove', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    fs.mkdir('/home/user/x/y/z', '/', 'user', false, true)
    expect(fs.exists('/home/user/x/y/z')).toBe(true)
    fs.write('/home/user/x/y/f.txt', 'data', '/')
    fs.copy('/home/user/x/y/f.txt', '/home/user/copy.txt', '/')
    expect(fs.read('/home/user/copy.txt')).toBe('data')
    fs.move('/home/user/copy.txt', '/home/user/moved.txt', '/')
    expect(fs.exists('/home/user/copy.txt')).toBe(false)
    fs.rename('/home/user/moved.txt', 'renamed.txt', '/')
    expect(fs.exists('/home/user/renamed.txt')).toBe(true)
    fs.remove('/home/user/x', '/', 'user', false, true)
    expect(fs.exists('/home/user/x')).toBe(false)
  })
  it('enforces permissions for regular users but not with sudo', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    expect(() => fs.write('/etc/os-release', 'hacked', '/', 'user', false)).toThrow()
    expect(() => fs.read('/root/.nothing', '/')).toThrow()
    fs.write('/etc/test.conf', 'ok', '/', 'user', true)
    expect(fs.read('/etc/test.conf')).toBe('ok')
    const secret = fs.resolve('/etc/sudoers')!
    expect(secret.mode).toBe(0o440)
    expect(() => fs.read('/etc/sudoers', '/', 'user', false)).toThrow()
    expect(fs.read('/etc/sudoers', '/', 'user', true)).toContain('sudoers')
  })
  it('resolves symlinks', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    const node = fs.resolve('/home/user/docs-link')
    expect(node?.type).toBe('dir')
    expect(fs.read('/home/user/docs-link/report.txt')).toContain('Quarterly notes')
    fs.makeSymlink('/home/user/Documents/report.txt', '/home/user/report-link', '/')
    expect(fs.read('/home/user/report-link')).toContain('Quarterly notes')
  })
  it('chmod updates mode', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    fs.write('/home/user/script.sh', 'echo hi', '/')
    fs.chmod('/home/user/script.sh', 0o755, '/')
    expect(fs.resolve('/home/user/script.sh')?.mode).toBe(0o755)
  })
  it('serialize/deserialize round-trips', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    fs.write('/home/user/persist.txt', 'still here', '/')
    const restored = new VirtualFilesystem(VirtualFilesystem.deserialize(fs.serialize()))
    expect(restored.read('/home/user/persist.txt')).toBe('still here')
  })
})
