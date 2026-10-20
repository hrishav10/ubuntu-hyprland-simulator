import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, ArrowUp, ClipboardPaste, Copy, FilePlus2, Folder, FolderPlus, Home,
  Eye, EyeOff, List, LayoutGrid as GridIcon, Pencil, RefreshCw, Search,
  Trash2, X, FileText, HardDrive, Info, Scissors,
} from 'lucide-react'
import { useStore } from '../system/store'
import { normalizePath, basename } from '../filesystem/PathResolver'
import type { FSNode } from '../filesystem/types'
import { fileIconColor, formatBytes, openFileWith, ToolbarButton, useFs } from './shared'

const PLACES: Array<{ label: string; path: string }> = [
  { label: 'Home', path: '/home/user' },
  { label: 'Desktop', path: '/home/user/Desktop' },
  { label: 'Documents', path: '/home/user/Documents' },
  { label: 'Downloads', path: '/home/user/Downloads' },
  { label: 'Music', path: '/home/user/Music' },
  { label: 'Pictures', path: '/home/user/Pictures' },
  { label: 'Notes', path: '/home/user/Notes' },
  { label: 'Computer', path: '/' },
]

interface CtxMenu { x: number; y: number; node: FSNode | null }

export default function FilesApp({ windowId }: { windowId: string }) {
  const fs = useFs()
  const openApp = useStore((s) => s.openApp)
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))
  const notify = useStore((s) => s.notify)
  const clipboardFiles = useStore((s) => s.clipboardFiles)
  const setClipboardFiles = useStore((s) => s.setClipboardFiles)
  const clipboardMode = useStore((s) => (s.appData['files-clip']?.mode as string) ?? 'copy')
  const setAppData = useStore((s) => s.setAppData)

  const [path, setPath] = useState<string>((win?.data.path as string) ?? '/home/user')
  const [back, setBack] = useState<string[]>([])
  const [forward, setForward] = useState<string[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showHidden, setShowHidden] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState<CtxMenu | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<FSNode | null>(null)
  const [properties, setProperties] = useState<FSNode | null>(null)
  const [creating, setCreating] = useState<'dir' | 'file' | null>(null)
  const [createName, setCreateName] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const entries = useMemo(() => {
    if (!fs) return []
    try {
      let list = fs.list(path, '/')
      if (!showHidden) list = list.filter((e) => !e.name.startsWith('.'))
      if (query) list = list.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
      return list.sort((a, b) => (a.type === 'dir' ? 0 : 1) - (b.type === 'dir' ? 0 : 1) || a.name.localeCompare(b.name))
    } catch {
      return []
    }
  }, [fs, path, showHidden, query])

  if (!fs) return <div className="p-4 text-[var(--muted)]">Loading filesystem…</div>

  const navigate = (next: string) => {
    setBack((b) => [...b, path])
    setForward([])
    setPath(next)
    setSelected(null)
    setQuery('')
  }
  const goBack = () => {
    const prev = back[back.length - 1]
    if (!prev) return
    setBack(back.slice(0, -1))
    setForward((f) => [path, ...f])
    setPath(prev)
  }
  const goForward = () => {
    const next = forward[0]
    if (!next) return
    setForward(forward.slice(1))
    setBack((b) => [...b, path])
    setPath(next)
  }

  const openNode = (node: FSNode) => {
    const abs = normalizePath(path + '/' + node.name, '/')
    if (node.type === 'dir') navigate(abs)
    else if (node.type === 'symlink' && node.target) {
      const target = fs.resolve(node.target, path)
      if (target?.type === 'dir') navigate(normalizePath(node.target, path))
      else openFileWith(abs, openApp)
    } else openFileWith(abs, openApp)
  }

  const doCreate = () => {
    if (!createName.trim() || !creating) return
    try {
      if (creating === 'dir') fs.mkdir(path + '/' + createName.trim(), '/')
      else fs.write(path + '/' + createName.trim(), '', '/')
      notify('Files', creating === 'dir' ? 'Folder created' : 'File created', createName.trim())
    } catch (e) { notify('Files', 'Could not create', (e as Error).message) }
    setCreating(null)
    setCreateName('')
  }

  const doDelete = (node: FSNode) => {
    try {
      fs.remove(path + '/' + node.name, '/', 'user', false, true)
      notify('Files', 'Deleted', node.name)
    } catch (e) { notify('Files', 'Delete failed', (e as Error).message) }
    setConfirmDelete(null)
    setSelected(null)
  }

  const doRename = (node: FSNode) => {
    if (!renameValue.trim() || renameValue === node.name) { setRenaming(null); return }
    try { fs.rename(path + '/' + node.name, renameValue.trim(), '/') }
    catch (e) { notify('Files', 'Rename failed', (e as Error).message) }
    setRenaming(null)
  }

  const copySelection = (node: FSNode, mode: 'copy' | 'cut') => {
    setClipboardFiles([normalizePath(path + '/' + node.name, '/')])
    setAppData('files-clip', { mode })
  }
  const paste = () => {
    for (const src of clipboardFiles) {
      try {
        if (clipboardMode === 'cut') { fs.move(src, path, '/'); setClipboardFiles([]) }
        else fs.copy(src, path, '/')
      } catch (e) { notify('Files', 'Paste failed', (e as Error).message) }
    }
  }

  const crumbs = path === '/' ? ['/'] : path.split('/').filter(Boolean)
  const selectedNode = entries.find((e) => e.name === selected) ?? null

  return (
    <div ref={rootRef} className="flex h-full relative" onClick={() => setMenu(null)}>
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] p-2 flex flex-col gap-0.5">
        {PLACES.map((p) => (
          <button key={p.path} onClick={() => navigate(p.path)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[13px] ${path === p.path ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover)]'}`}>
            {p.path === '/' ? <HardDrive size={15} /> : p.path === '/home/user' ? <Home size={15} /> : <Folder size={15} />}
            {p.label}
          </button>
        ))}
        <div className="mt-auto text-[11px] text-[var(--muted)] px-2 leading-snug">
          Virtual filesystem<br />stored in this browser
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border)]">
          <ToolbarButton title="Back" onClick={goBack}><ArrowLeft size={16} /></ToolbarButton>
          <ToolbarButton title="Forward" onClick={goForward}><ArrowRight size={16} /></ToolbarButton>
          <ToolbarButton title="Up" onClick={() => path !== '/' && navigate(normalizePath(path + '/..', '/'))}><ArrowUp size={16} /></ToolbarButton>
          <div className="flex items-center gap-0.5 ml-1 text-[13px] overflow-hidden whitespace-nowrap">
            <button className="px-1.5 py-1 rounded hover:bg-[var(--hover)]" onClick={() => navigate('/')}>/</button>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center">
                <button className="px-1.5 py-1 rounded hover:bg-[var(--hover)]" onClick={() => navigate('/' + crumbs.slice(0, i + 1).join('/'))}>{c}</button>
                <span className="text-[var(--muted)]">/</span>
              </span>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search folder"
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md pl-7 pr-2 py-1 text-[13px] w-40 outline-none focus:border-[var(--accent)]" />
          </div>
          <ToolbarButton title={showHidden ? 'Hide hidden files' : 'Show hidden files'} onClick={() => setShowHidden(!showHidden)}>{showHidden ? <EyeOff size={16} /> : <Eye size={16} />}</ToolbarButton>
          <ToolbarButton title="Toggle view" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>{view === 'grid' ? <List size={16} /> : <GridIcon size={16} />}</ToolbarButton>
          <ToolbarButton title="New folder" onClick={() => { setCreating('dir'); setCreateName('New Folder') }}><FolderPlus size={16} /></ToolbarButton>
          <ToolbarButton title="New file" onClick={() => { setCreating('file'); setCreateName('new-file.txt') }}><FilePlus2 size={16} /></ToolbarButton>
          <ToolbarButton title="Paste" onClick={paste}><ClipboardPaste size={16} /></ToolbarButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3"
          onContextMenu={(e) => { e.preventDefault(); const r = rootRef.current!.getBoundingClientRect(); setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, node: null }) }}>
          {creating && (
            <div className="mb-3 flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2">
              {creating === 'dir' ? <FolderPlus size={16} /> : <FilePlus2 size={16} />}
              <input autoFocus value={createName} onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doCreate(); if (e.key === 'Escape') setCreating(null) }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-[13px] flex-1 outline-none" />
              <button className="px-2 py-1 rounded bg-[var(--accent)] text-white text-[13px]" onClick={doCreate}>Create</button>
              <button className="px-2 py-1 rounded hover:bg-[var(--hover)] text-[13px]" onClick={() => setCreating(null)}>Cancel</button>
            </div>
          )}
          {entries.length === 0 && <div className="text-[var(--muted)] text-sm p-4">This folder is empty.</div>}
          {view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {entries.map((node) => (
                <button key={node.name}
                  onClick={() => setSelected(node.name)}
                  onDoubleClick={() => openNode(node)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(node.name); const r = rootRef.current!.getBoundingClientRect(); setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, node }) }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border ${selected === node.name ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] border-[var(--accent)]' : 'border-transparent hover:bg-[var(--hover)]'}`}>
                  {node.type === 'dir' ? <Folder size={38} style={{ color: fileIconColor(node.name, node.type) }} fill="currentColor" strokeWidth={1} />
                    : <FileText size={36} style={{ color: fileIconColor(node.name, node.type) }} strokeWidth={1.2} />}
                  {renaming === node.name ? (
                    <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Enter') doRename(node); if (e.key === 'Escape') setRenaming(null) }}
                      onBlur={() => doRename(node)}
                      className="w-full bg-[var(--surface)] border border-[var(--accent)] rounded px-1 py-0.5 text-[12px] text-center outline-none" />
                  ) : (
                    <span className="text-[12px] leading-tight text-center break-all line-clamp-2">{node.name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead><tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                <th className="py-1.5 px-2 font-medium">Name</th><th className="font-medium">Size</th><th className="font-medium">Permissions</th><th className="font-medium">Modified</th>
              </tr></thead>
              <tbody>
                {entries.map((node) => (
                  <tr key={node.name}
                    onClick={() => setSelected(node.name)}
                    onDoubleClick={() => openNode(node)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelected(node.name); const r = rootRef.current!.getBoundingClientRect(); setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, node }) }}
                    className={`cursor-default ${selected === node.name ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]' : 'hover:bg-[var(--hover)]'}`}>
                    <td className="py-1.5 px-2 flex items-center gap-2">
                      {node.type === 'dir' ? <Folder size={16} style={{ color: fileIconColor(node.name, node.type) }} /> : <FileText size={16} style={{ color: fileIconColor(node.name, node.type) }} />}
                      {renaming === node.name ? (
                        <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') doRename(node); if (e.key === 'Escape') setRenaming(null) }}
                          onBlur={() => doRename(node)}
                          className="bg-[var(--surface)] border border-[var(--accent)] rounded px-1 py-0.5 text-[12px] outline-none" />
                      ) : node.name}
                    </td>
                    <td className="text-[var(--muted)]">{node.type === 'dir' ? '—' : formatBytes(fs.sizeOf(node))}</td>
                    <td className="text-[var(--muted)] mono text-[12px]">{(node.mode & 0o777).toString(8)} {node.owner}</td>
                    <td className="text-[var(--muted)]">{new Date(node.modified).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status bar */}
        <div className="px-3 py-1.5 border-t border-[var(--border)] text-[12px] text-[var(--muted)] flex gap-4">
          <span>{entries.length} items</span>
          {selectedNode && <span>{selectedNode.name} — {selectedNode.type === 'dir' ? 'folder' : formatBytes(fs.sizeOf(selectedNode))}</span>}
          <span className="ml-auto mono">{path}</span>
        </div>
      </div>

      {/* Context menu */}
      {menu && (
        <div className="absolute z-50 w-52 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] shadow-2xl py-1 text-[13px]"
          style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {menu.node ? (
            <>
              <MenuItem icon={<FileText size={14} />} label="Open" onClick={() => { openNode(menu.node!); setMenu(null) }} />
              <MenuItem icon={<Pencil size={14} />} label="Rename" onClick={() => { setRenaming(menu.node!.name); setRenameValue(menu.node!.name); setMenu(null) }} />
              <MenuItem icon={<Copy size={14} />} label="Copy" onClick={() => { copySelection(menu.node!, 'copy'); setMenu(null) }} />
              <MenuItem icon={<Scissors size={14} />} label="Cut" onClick={() => { copySelection(menu.node!, 'cut'); setMenu(null) }} />
              <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { setConfirmDelete(menu.node); setMenu(null) }} />
              <div className="my-1 border-t border-[var(--border)]" />
              <MenuItem icon={<Info size={14} />} label="Properties" onClick={() => { setProperties(menu.node); setMenu(null) }} />
            </>
          ) : (
            <>
              <MenuItem icon={<FolderPlus size={14} />} label="New Folder" onClick={() => { setCreating('dir'); setCreateName('New Folder'); setMenu(null) }} />
              <MenuItem icon={<FilePlus2 size={14} />} label="New File" onClick={() => { setCreating('file'); setCreateName('new-file.txt'); setMenu(null) }} />
              <MenuItem icon={<ClipboardPaste size={14} />} label="Paste" onClick={() => { paste(); setMenu(null) }} />
              <MenuItem icon={<RefreshCw size={14} />} label="Refresh" onClick={() => setMenu(null)} />
            </>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <h3 className="font-semibold mb-2">Delete “{confirmDelete.name}”?</h3>
          <p className="text-[13px] text-[var(--muted)] mb-4">This removes the {confirmDelete.type === 'dir' ? 'folder and everything inside it' : 'file'} from the virtual filesystem. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1.5 rounded-md hover:bg-[var(--hover)] text-[13px]" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="px-3 py-1.5 rounded-md bg-red-600 text-white text-[13px]" onClick={() => doDelete(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Properties */}
      {properties && (
        <Modal onClose={() => setProperties(null)}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">{properties.type === 'dir' ? <Folder size={18} /> : <FileText size={18} />} {properties.name}</h3>
          <dl className="text-[13px] space-y-1.5">
            <Row k="Location" v={path} />
            <Row k="Type" v={properties.type} />
            <Row k="Size" v={formatBytes(fs.sizeOf(properties))} />
            <Row k="Owner" v={properties.owner} />
            <Row k="Permissions" v={(properties.mode & 0o777).toString(8)} />
            <Row k="Modified" v={new Date(properties.modified).toLocaleString('en-GB')} />
            {properties.target && <Row k="Link target" v={properties.target} />}
          </dl>
          <div className="flex justify-end mt-4">
            <button className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-[13px]" onClick={() => setProperties(null)}>Close</button>
          </div>
        </Modal>
      )}
      <span className="hidden">{basename(path)}</span>
      <X className="hidden" />
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[var(--hover)] ${danger ? 'text-red-400' : ''}`}>
      {icon}{label}
    </button>
  )
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-3"><dt className="w-24 text-[var(--muted)]">{k}</dt><dd className="mono text-[12px] break-all">{v}</dd></div>
}
