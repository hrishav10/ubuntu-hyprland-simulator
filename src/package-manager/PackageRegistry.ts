export interface PackageInfo {
  name: string
  version: string
  description: string
  category: string
  sizeKB: number
  /** provides a terminal command of the same name */
  isCommand?: boolean
  /** provides a desktop app id */
  appId?: string
  installed: boolean
}

export const PACKAGE_REGISTRY: PackageInfo[] = [
  { name: 'kitty', version: '0.32.2-1', description: 'Fast, feature-rich GPU terminal emulator (simulated)', category: 'System', sizeKB: 5420, installed: true },
  { name: 'thunar', version: '4.18.10-1', description: 'Modern file manager for Xfce (simulated)', category: 'System', sizeKB: 3100, installed: true },
  { name: 'waybar', version: '0.10.3-1', description: 'Highly customizable Wayland bar (simulated)', category: 'System', sizeKB: 1800, installed: true },
  { name: 'wofi', version: '1.4.1-1', description: 'Application launcher for wlroots compositors (simulated)', category: 'System', sizeKB: 420, installed: true },
  { name: 'dunst', version: '1.9.2-1', description: 'Lightweight notification daemon (simulated)', category: 'System', sizeKB: 310, installed: true },
  { name: 'neofetch', version: '7.1.0-2', description: 'Command-line system information tool', category: 'Utilities', sizeKB: 380, isCommand: true, installed: false },
  { name: 'fastfetch', version: '2.13.2-1', description: 'Fast system information tool, successor to neofetch', category: 'Utilities', sizeKB: 2900, isCommand: true, installed: false },
  { name: 'htop', version: '3.3.0-2', description: 'Interactive process viewer', category: 'Utilities', sizeKB: 640, isCommand: true, installed: false },
  { name: 'tree', version: '2.1.1-2', description: 'Recursive directory listing program', category: 'Utilities', sizeKB: 58, isCommand: true, installed: false },
  { name: 'cowsay', version: '3.03+dfsg2-8', description: 'Configurable talking cow', category: 'Games', sizeKB: 42, isCommand: true, installed: false },
  { name: 'cmatrix', version: '2.0-3', description: 'Simulates the screen from The Matrix', category: 'Games', sizeKB: 36, isCommand: true, installed: false },
  { name: 'btop', version: '1.3.2-1', description: 'Resource monitor with a modern interface', category: 'Utilities', sizeKB: 2100, isCommand: true, installed: false },
  { name: 'vlc', version: '3.0.20-3', description: 'Multimedia player (unlocks Media Player app)', category: 'Multimedia', sizeKB: 42000, appId: 'media', installed: true },
  { name: 'gimp', version: '2.10.36-2', description: 'GNU Image Manipulation Program (simulated entry)', category: 'Graphics', sizeKB: 98000, installed: false },
  { name: 'firefox', version: '128.0-1', description: 'Web browser (simulated build)', category: 'Internet', sizeKB: 76000, appId: 'browser', installed: true },
  { name: 'torbrowser-launcher', version: '0.3.7-2', description: 'Helps download/update Tor Browser — SIMULATION ONLY in this project; never connects to Tor', category: 'Internet', sizeKB: 120, appId: 'tor-browser', installed: true },
  { name: 'code', version: '1.92.0-1', description: 'Visual Studio Code (simulated build)', category: 'Development', sizeKB: 112000, appId: 'code-editor', installed: true },
  { name: 'git', version: '1:2.43.0-1', description: 'Distributed version control system (simulated commands)', category: 'Development', sizeKB: 8400, isCommand: true, installed: true },
  { name: 'curl', version: '8.5.0-2', description: 'Command line tool for transferring data with URLs (simulated, offline)', category: 'Internet', sizeKB: 520, isCommand: true, installed: true },
  { name: 'jq', version: '1.7.1-3', description: 'Command-line JSON processor', category: 'Development', sizeKB: 410, isCommand: true, installed: false },
  { name: 'python3', version: '3.12.3-0', description: 'Interactive high-level object-oriented language (simulated REPL note)', category: 'Development', sizeKB: 26000, isCommand: true, installed: true },
  { name: 'sl', version: '5.02-1', description: 'Correct you if you type `sl` instead of `ls`', category: 'Games', sizeKB: 18, isCommand: true, installed: false },
]

export type Pkg = PackageInfo

export function initialPackages(): Pkg[] {
  return PACKAGE_REGISTRY.map((p) => ({ ...p }))
}
