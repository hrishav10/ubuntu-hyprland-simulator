import { describe, expect, it } from 'vitest'
import { PackageManager } from '../package-manager/PackageManager'
import { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { buildSeedFilesystem } from '../filesystem/seed'

describe('PackageManager (simulated apt)', () => {
  it('has a registry with installed base packages', () => {
    const pm = new PackageManager()
    expect(pm.list().length).toBeGreaterThanOrEqual(20)
    expect(pm.isInstalled('kitty')).toBe(true)
    expect(pm.isInstalled('cowsay')).toBe(false)
  })
  it('search matches name and description', () => {
    const pm = new PackageManager()
    expect(pm.search('cow').map((p) => p.name)).toContain('cowsay')
    expect(pm.search('process viewer').map((p) => p.name)).toContain('htop')
  })
  it('install flips state and produces realistic apt output', () => {
    const pm = new PackageManager()
    const res = pm.install('neofetch')
    expect(res.changed).toBe(true)
    expect(res.output).toContain('Setting up neofetch')
    expect(pm.isInstalled('neofetch')).toBe(true)
    expect(pm.install('neofetch').output).toContain('already the newest version')
    expect(pm.install('does-not-exist').output).toContain('Unable to locate package')
  })
  it('remove flips state and protects essential desktop packages', () => {
    const pm = new PackageManager()
    pm.install('htop')
    expect(pm.remove('htop').changed).toBe(true)
    expect(pm.isInstalled('htop')).toBe(false)
    expect(pm.remove('kitty').output).toContain('essential')
    expect(pm.isInstalled('kitty')).toBe(true)
  })
  it('syncs installed markers into the VFS dpkg status', () => {
    const fs = new VirtualFilesystem(buildSeedFilesystem())
    const pm = new PackageManager()
    pm.install('jq', fs)
    pm.syncToFilesystem(fs)
    expect(fs.read('/var/lib/dpkg/sim-status')).toContain('Package: jq')
    expect(fs.exists('/var/lib/sim-packages/jq.installed')).toBe(true)
    pm.remove('jq', fs)
    expect(fs.exists('/var/lib/sim-packages/jq.installed')).toBe(false)
  })
  it('update produces repository output', () => {
    const pm = new PackageManager()
    expect(pm.update().output).toContain('noble')
  })
})
