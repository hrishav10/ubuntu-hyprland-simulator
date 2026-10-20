import { useEffect, useMemo, useRef, useState } from 'react'
import { FilePlus2, FolderOpen, Save, X } from 'lucide-react'
import { useStore } from '../system/store'
import { normalizePath } from '../filesystem/PathResolver'
import { ToolbarButton, useFs } from './shared'
import { Modal } from './FilesApp'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Very small regex syntax highlighter for the code editor overlay. */
export function highlight(code: string): string {
  let html = escapeHtml(code)
  const stash: string[] = []
  const keep = (m: string) => { stash.push(m); return `\u0001${stash.length - 1}\u0002` }
  html = html
    .replace(/(\/\/[^\n]*|#[^\n]*)/g, keep)
    .replace(/(&quot;[^&]*?&quot;|"[^"\n]*"|'[^'\n]*')/g, keep)
  html = html
    .replace(/\b(const|let|var|function|return|if|else|elif|for|while|import|from|export|default|class|def|print|include|int|void|char|namespace|using|std|new|delete|public|private|static|async|await|try|except|catch|None|True|False|true|false|null|typeof|interface|type|extends)\b/g, '<span style="color:#c792ea">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#f78c6c">$1</span>')
    .replace(/([A-Za-z_]\w*)(?=\()/g, '<span style="color:#82aaff">$1</span>')
  html = html.replace(/\u0001(\d+)\u0002/g, (_m, i) => {
    const orig = stash[Number(i)]
    const color = orig.startsWith('//') || orig.startsWith('#') ? '#5f5470' : '#c3e88d'
    return `<span style="color:${color}">${orig}</span>`
  })
  return html
}

export default function EditorApp({ windowId, codeMode }: { windowId: string; codeMode?: boolean }) {
  const fs = useFs()
  const win = useStore((s) => s.windows.find((w) => w.id === windowId))
  const setWindowData = useStore((s) => s.setWindowData)
  const notify = useStore((s) => s.notify)
  const initialPath = (win?.data.path as string) ?? null

  const [path, setPath] = useState<string | null>(initialPath)
  const [content, setContent] = useState<string>('')
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saveAsPath, setSaveAsPath] = useState('/home/user/Documents/untitled.txt')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const taRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!fs || !initialPath || loadedFor === initialPath) return
    try {
      setContent(fs.read(initialPath, '/'))
      setPath(initialPath)
      setLoadedFor(initialPath)
      setDirty(false)
    } catch { setLoadedFor(initialPath) }
  }, [fs, initialPath, loadedFor])

  useEffect(() => {
    if (win?.data.path && win.data.path !== path && win.data.path !== loadedFor) {
      setLoadedFor(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win?.data.path])

  const save = (target?: string) => {
    if (!fs) return
    const dest = target ?? path
    if (!dest) { setShowSaveAs(true); return }
    try {
      fs.write(dest, content, '/')
      setPath(dest)
      setLoadedFor(dest)
      setDirty(false)
      setWindowData(windowId, { path: dest })
      notify(codeMode ? 'Code Editor' : 'Text Editor', 'Saved', dest)
    } catch (e) { notify('Editor', 'Save failed', (e as Error).message) }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        // Only when this window is focused in the store
        if (useStore.getState().focusedId === windowId) { e.preventDefault(); save() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, path, fs])

  const updateCursor = () => {
    const ta = taRef.current
    if (!ta) return
    const upto = ta.value.slice(0, ta.selectionStart)
    const lines = upto.split('\n')
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }

  const highlighted = useMemo(() => highlight(content) + '\n', [content])
  const textFiles = useMemo(() => {
    if (!fs) return []
    return fs.walk('/home/user').filter((p) => { const st = fs.stat(p); return st?.node.type === 'file' }).slice(0, 200)
  }, [fs])

  const openPath = (p: string) => {
    if (!fs) return
    try {
      setContent(fs.read(p, '/'))
      setPath(p)
      setLoadedFor(p)
      setDirty(false)
      setWindowData(windowId, { path: p })
      setShowOpen(false)
    } catch (e) { notify('Editor', 'Open failed', (e as Error).message) }
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border)]">
        <ToolbarButton title="New" onClick={() => { setContent(''); setPath(null); setLoadedFor(null); setDirty(false) }}><FilePlus2 size={16} /></ToolbarButton>
        <ToolbarButton title="Open" onClick={() => setShowOpen(true)}><FolderOpen size={16} /></ToolbarButton>
        <ToolbarButton title="Save (Ctrl+S)" onClick={() => save()}><Save size={16} /></ToolbarButton>
        <span className="ml-2 text-[13px] truncate">
          {path ? normalizePath(path, '/') : 'Untitled'}{dirty ? ' •' : ''}
        </span>
        {codeMode && path && <span className="ml-auto mono text-[11px] text-[var(--muted)]">{path.split('.').pop()?.toUpperCase()}</span>}
      </div>

      <div className="flex-1 relative min-h-0 bg-[var(--surface)]">
        {codeMode ? (
          <div className="absolute inset-0 flex">
            <div className="py-3 pr-2 pl-3 text-right mono text-[12.5px] leading-[1.55] text-[var(--muted)] select-none overflow-hidden">
              {content.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div className="relative flex-1 min-w-0">
              <pre ref={preRef} aria-hidden className="absolute inset-0 py-3 px-2 mono text-[12.5px] leading-[1.55] overflow-hidden pointer-events-none whitespace-pre"
                dangerouslySetInnerHTML={{ __html: highlighted }} />
              <textarea ref={taRef} value={content} spellCheck={false}
                onChange={(e) => { setContent(e.target.value); setDirty(true) }}
                onScroll={() => { if (preRef.current && taRef.current) { preRef.current.scrollTop = taRef.current.scrollTop; preRef.current.scrollLeft = taRef.current.scrollLeft } }}
                onClick={updateCursor} onKeyUp={updateCursor}
                className="absolute inset-0 py-3 px-2 mono text-[12.5px] leading-[1.55] bg-transparent resize-none outline-none whitespace-pre overflow-auto"
                style={{ color: 'transparent', caretColor: 'var(--text)' }} />
            </div>
          </div>
        ) : (
          <textarea ref={taRef} value={content} spellCheck={false}
            onChange={(e) => { setContent(e.target.value); setDirty(true) }}
            onClick={updateCursor} onKeyUp={updateCursor}
            placeholder="Start typing… files are saved into the virtual filesystem."
            className="absolute inset-0 p-3 text-[13.5px] leading-relaxed bg-transparent resize-none outline-none" />
        )}
      </div>

      <div className="px-3 py-1 border-t border-[var(--border)] text-[11.5px] text-[var(--muted)] flex gap-4">
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>{content.length} characters</span>
        <span>{content.split('\n').length} lines</span>
        <span className="ml-auto">{path ?? 'not saved yet'}</span>
      </div>

      {showOpen && (
        <Modal onClose={() => setShowOpen(false)}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Open file</h3>
            <button onClick={() => setShowOpen(false)}><X size={16} /></button>
          </div>
          <div className="max-h-64 overflow-auto space-y-0.5">
            {textFiles.map((p) => (
              <button key={p} onClick={() => openPath(p)} className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--hover)] mono text-[12px] truncate">{p}</button>
            ))}
          </div>
        </Modal>
      )}
      {showSaveAs && (
        <Modal onClose={() => setShowSaveAs(false)}>
          <h3 className="font-semibold mb-2">Save as</h3>
          <input value={saveAsPath} onChange={(e) => setSaveAsPath(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2 py-1.5 mono text-[12.5px] outline-none focus:border-[var(--accent)]" />
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-3 py-1.5 rounded-md hover:bg-[var(--hover)] text-[13px]" onClick={() => setShowSaveAs(false)}>Cancel</button>
            <button className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-[13px]" onClick={() => { setShowSaveAs(false); save(normalizePath(saveAsPath, '/home/user')) }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
