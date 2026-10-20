import type { ReactNode } from 'react'
import { useStore } from '../system/store'
import type { VirtualFilesystem } from '../filesystem/VirtualFilesystem'

export function useFs(): VirtualFilesystem | null {
  useStore((s) => s.fsVersion)
  return useStore((s) => s.fs)
}

export function openFileWith(fsPath: string, openApp: (id: string, data?: Record<string, unknown>) => void) {
  const lower = fsPath.toLowerCase()
  if (/\.(png|jpe?g|svg|gif|webp)$/.test(lower)) openApp('image-viewer', { path: fsPath })
  else if (/\.pdf$/.test(lower)) openApp('pdf-viewer', { path: fsPath })
  else if (/\.(mp3|wav|ogg)$/.test(lower)) openApp('media', { path: fsPath })
  else if (/\.(mp4|mkv|webm)$/.test(lower)) openApp('media', { path: fsPath })
  else if (/\.zip$/.test(lower)) openApp('archive', { path: fsPath })
  else if (/\.(py|cpp|c|h|js|ts|tsx|json|sh|conf|css|md)$/.test(lower)) openApp('code-editor', { path: fsPath })
  else openApp('editor', { path: fsPath })
}

export function ToolbarButton({ title, onClick, children }: { title: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
    >
      {children}
    </button>
  )
}

export function fileIconColor(name: string, type: string): string {
  if (type === 'dir') return '#e95420'
  if (/\.(py)$/.test(name)) return '#4b8bbe'
  if (/\.(cpp|c|h)$/.test(name)) return '#5c8dbc'
  if (/\.(js|ts|tsx)$/.test(name)) return '#e8c33a'
  if (/\.(svg|png|jpg|jpeg|gif)$/.test(name)) return '#a259d9'
  if (/\.(mp3|wav)$/.test(name)) return '#38b2ac'
  if (/\.(mp4|mkv)$/.test(name)) return '#d94f6a'
  if (/\.zip$/.test(name)) return '#b08968'
  if (/\.md$/.test(name)) return '#6aa6ff'
  if (/\.conf$/.test(name)) return '#9a9aa3'
  return '#8f8f99'
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(1)} GB`
}
