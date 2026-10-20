import type { ComponentType } from 'react'
import {
  Archive, BookOpen, Calculator, Calendar, Code2, FileText, Film, Folder,
  Globe, HelpCircle, Image as ImageIcon, LayoutGrid, Monitor, Music,
  Package, Settings, Shield, StickyNote, Terminal, Wifi,
} from 'lucide-react'

export interface AppMeta {
  id: string
  name: string
  description: string
  category: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  singleInstance: boolean
  defaultSize: { w: number; h: number }
  /** package that must be installed for this app to be available */
  packageName?: string
  /** command name used for the simulated process */
  processName: string
}

export const APPS: AppMeta[] = [
  { id: 'terminal', name: 'Terminal', description: 'Kitty-style terminal emulator with a simulated bash shell', category: 'System', icon: Terminal, singleInstance: false, defaultSize: { w: 860, h: 540 }, processName: 'kitty' },
  { id: 'files', name: 'Files', description: 'Thunar-style file manager for the virtual filesystem', category: 'System', icon: Folder, singleInstance: true, defaultSize: { w: 900, h: 560 }, processName: 'thunar' },
  { id: 'editor', name: 'Text Editor', description: 'Plain text editor (gedit-style) saving to the virtual filesystem', category: 'Accessories', icon: FileText, singleInstance: false, defaultSize: { w: 760, h: 520 }, processName: 'gedit' },
  { id: 'code-editor', name: 'Code Editor', description: 'Code editor with syntax highlighting, saves to the virtual filesystem', category: 'Development', icon: Code2, singleInstance: false, defaultSize: { w: 920, h: 580 }, packageName: 'code', processName: 'code' },
  { id: 'browser', name: 'Web Browser', description: 'Web browser with a built-in start page and local sites', category: 'Internet', icon: Globe, singleInstance: true, defaultSize: { w: 980, h: 620 }, packageName: 'firefox', processName: 'firefox' },
  { id: 'tor-browser', name: 'Tor Browser (Simulated)', description: 'Privacy browser with circuit view, security levels and onion-site directory', category: 'Internet', icon: Shield, singleInstance: true, defaultSize: { w: 980, h: 640 }, packageName: 'torbrowser-launcher', processName: 'tor-browser' },
  { id: 'software', name: 'Software', description: 'Package manager — search, install and remove packages (apt)', category: 'System', icon: Package, singleInstance: true, defaultSize: { w: 920, h: 580 }, processName: 'gnome-software' },
  { id: 'settings', name: 'Settings', description: 'Themes, wallpaper, keybinds, appearance and system information', category: 'System', icon: Settings, singleInstance: true, defaultSize: { w: 900, h: 600 }, processName: 'gnome-control-center' },
  { id: 'monitor', name: 'System Monitor', description: 'Processes and resource graphs tied to open windows', category: 'System', icon: Monitor, singleInstance: true, defaultSize: { w: 860, h: 560 }, processName: 'gnome-system-monitor' },
  { id: 'network', name: 'Network', description: 'Wi-Fi networks and connection settings', category: 'System', icon: Wifi, singleInstance: true, defaultSize: { w: 760, h: 520 }, processName: 'nm-connection-editor' },
  { id: 'media', name: 'Media Player', description: 'Media player for files in your Music folder', category: 'Multimedia', icon: Film, singleInstance: true, defaultSize: { w: 780, h: 520 }, packageName: 'vlc', processName: 'vlc' },
  { id: 'music', name: 'Music', description: 'Music library', category: 'Multimedia', icon: Music, singleInstance: true, defaultSize: { w: 700, h: 480 }, processName: 'lollypop' },
  { id: 'image-viewer', name: 'Image Viewer', description: 'View images stored in the virtual filesystem', category: 'Graphics', icon: ImageIcon, singleInstance: false, defaultSize: { w: 780, h: 560 }, processName: 'eog' },
  { id: 'pdf-viewer', name: 'Document Viewer', description: 'Read documents from the virtual filesystem as paged documents', category: 'Accessories', icon: BookOpen, singleInstance: false, defaultSize: { w: 760, h: 600 }, processName: 'evince' },
  { id: 'calculator', name: 'Calculator', description: 'Calculator with history', category: 'Accessories', icon: Calculator, singleInstance: true, defaultSize: { w: 340, h: 480 }, processName: 'gnome-calculator' },
  { id: 'calendar', name: 'Calendar', description: 'Month calendar with events saved as files', category: 'Accessories', icon: Calendar, singleInstance: true, defaultSize: { w: 760, h: 540 }, processName: 'gnome-calendar' },
  { id: 'notes', name: 'Notes', description: 'Notes stored as files in ~/Notes in the virtual filesystem', category: 'Accessories', icon: StickyNote, singleInstance: true, defaultSize: { w: 800, h: 520 }, processName: 'gnote' },
  { id: 'archive', name: 'Archive Manager', description: 'Inspect archives and extract them into the filesystem', category: 'Accessories', icon: Archive, singleInstance: true, defaultSize: { w: 720, h: 480 }, processName: 'file-roller' },
  { id: 'help', name: 'Help', description: 'How this simulator works, keyboard shortcuts and honesty notes', category: 'System', icon: HelpCircle, singleInstance: true, defaultSize: { w: 780, h: 560 }, processName: 'yelp' },
  { id: 'app-grid', name: 'All Applications', description: 'Open the application launcher', category: 'System', icon: LayoutGrid, singleInstance: true, defaultSize: { w: 700, h: 500 }, processName: 'wofi' },
]

export function appById(id: string): AppMeta | undefined {
  return APPS.find((a) => a.id === id)
}
export const APP_CATEGORIES = ['All', ...Array.from(new Set(APPS.map((a) => a.category)))]
