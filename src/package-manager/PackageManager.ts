import type { VirtualFilesystem } from '../filesystem/VirtualFilesystem'
import { initialPackages, type Pkg } from './PackageRegistry'

export interface AptResult {
  output: string
  changed: boolean
}

/**
 * SIMULATED apt/dpkg. Installing updates only this registry, app availability,
 * and marker files inside the virtual filesystem. Nothing real is installed.
 */
export class PackageManager {
  packages: Pkg[]
  lastUpdate: number | null = null

  constructor(packages?: Pkg[]) {
    this.packages = packages ?? initialPackages()
  }

  list(): Pkg[] {
    return [...this.packages].sort((a, b) => a.name.localeCompare(b.name))
  }
  installed(): Pkg[] {
    return this.list().filter((p) => p.installed)
  }
  get(name: string): Pkg | undefined {
    return this.packages.find((p) => p.name === name)
  }
  isInstalled(name: string): boolean {
    return !!this.get(name)?.installed
  }
  search(query: string): Pkg[] {
    const q = query.toLowerCase()
    return this.list().filter((p) => p.name.includes(q) || p.description.toLowerCase().includes(q))
  }

  update(): AptResult {
    this.lastUpdate = Date.now()
    const lines = [
      'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease (simulated — no network traffic)',
      'Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB] (simulated)',
      'Get:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB] (simulated)',
      `Reading package lists... Done`,
      `${this.packages.length} packages can be listed. Run 'apt list' in this simulated system.`,
    ]
    return { output: lines.join('\n'), changed: false }
  }

  install(name: string, fs?: VirtualFilesystem): AptResult {
    const pkg = this.get(name)
    if (!pkg) return { output: `E: Unable to locate package ${name}`, changed: false }
    if (pkg.installed) return { output: `${name} is already the newest version (${pkg.version}).\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`, changed: false }
    pkg.installed = true
    this.syncToFilesystem(fs)
    const lines = [
      `Reading package lists... Done`,
      `Building dependency tree... Done`,
      `The following NEW packages will be installed (SIMULATED):`,
      `  ${pkg.name}`,
      `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`,
      `Need to get ${(pkg.sizeKB / 1024).toFixed(1)} MB of archives (simulated download — no network used).`,
      `After this operation, ${(pkg.sizeKB / 1024).toFixed(1)} MB of additional disk space will be used (in the virtual filesystem only).`,
      `Selecting previously unselected package ${pkg.name}.`,
      `(Reading database ... 184203 files and directories currently installed (simulated).)`,
      `Unpacking ${pkg.name} (${pkg.version}) ...`,
      `Setting up ${pkg.name} (${pkg.version}) ...`,
      `Processing triggers for man-db (simulated) ...`,
    ]
    return { output: lines.join('\n'), changed: true }
  }

  remove(name: string, fs?: VirtualFilesystem): AptResult {
    const pkg = this.get(name)
    if (!pkg) return { output: `E: Unable to locate package ${name}`, changed: false }
    if (!pkg.installed) return { output: `Package '${name}' is not installed, so not removed`, changed: false }
    if (['kitty', 'waybar', 'wofi', 'thunar'].includes(name))
      return { output: `E: This package is essential to the simulated desktop and cannot be removed: ${name}`, changed: false }
    pkg.installed = false
    this.syncToFilesystem(fs)
    return {
      output: `Removing ${name} (${pkg.version}) ... (simulated)\n0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.`,
      changed: true,
    }
  }

  /** Mirror installed set into /var/lib/dpkg/sim-status inside the VFS. */
  syncToFilesystem(fs?: VirtualFilesystem): void {
    if (!fs) return
    const status = this.installed()
      .map((p) => `Package: ${p.name}\nStatus: install ok installed\nVersion: ${p.version}\nDescription: ${p.description}\n`)
      .join('\n')
    try {
      fs.write('/var/lib/dpkg/sim-status', '# simulated dpkg status — updated by the simulated package manager\n\n' + status, '/', 'root', true)
      for (const p of this.installed()) {
        const marker = `/var/lib/sim-packages/${p.name}.installed`
        if (!fs.exists(marker)) {
          if (!fs.exists('/var/lib/sim-packages')) fs.mkdir('/var/lib/sim-packages', '/', 'root', true, true)
          fs.write(marker, `${p.name} ${p.version}\n`, '/', 'root', true)
        }
      }
      for (const p of this.list().filter((x) => !x.installed)) {
        const marker = `/var/lib/sim-packages/${p.name}.installed`
        if (fs.exists(marker)) fs.remove(marker, '/', 'root', true)
      }
    } catch { /* VFS not ready */ }
  }
}
