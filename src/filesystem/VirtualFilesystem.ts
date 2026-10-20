import { basename, dirname, normalizePath } from './PathResolver'
import { canAccess, type FSNode } from './types'

export interface StatInfo {
  path: string
  node: FSNode
  size: number
}

export class FSError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const MAX_SYMLINK_DEPTH = 16

/**
 * In-memory virtual filesystem with a realistic FHS tree.
 * Persistence is handled by an adapter (IndexedDB) that serializes `root`.
 */
export class VirtualFilesystem {
  root: FSNode
  home = '/home/user'
  version = 0
  private listeners = new Set<() => void>()

  constructor(root: FSNode) {
    this.root = root
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private touch() {
    this.version++
    for (const fn of this.listeners) fn()
  }

  /** Resolve a path to a node, following symlinks. Returns null if missing. */
  resolve(path: string, cwd = this.home, depth = 0): FSNode | null {
    if (depth > MAX_SYMLINK_DEPTH) return null
    const abs = normalizePath(path, cwd, this.home)
    if (abs === '/') return this.root
    const parts = abs.split('/').filter(Boolean)
    let cur: FSNode = this.root
    let curPath = ''
    for (const part of parts) {
      if (cur.type !== 'dir' || !cur.children) return null
      const next = cur.children[part]
      if (!next) return null
      curPath += '/' + part
      if (next.type === 'symlink' && next.target) {
        const targetAbs = normalizePath(next.target, dirname(curPath), this.home)
        const resolved = this.resolve(targetAbs, '/', depth + 1)
        if (!resolved) return null
        cur = resolved
      } else {
        cur = next
      }
    }
    return cur
  }

  exists(path: string, cwd = this.home): boolean {
    return this.resolve(path, cwd) !== null
  }

  stat(path: string, cwd = this.home): StatInfo | null {
    const abs = normalizePath(path, cwd, this.home)
    const node = this.resolve(abs)
    if (!node) return null
    return { path: abs, node, size: this.sizeOf(node) }
  }

  sizeOf(node: FSNode): number {
    if (node.type === 'file') return new Blob([node.content ?? '']).size
    if (node.type === 'symlink') return (node.target ?? '').length
    let total = 4096
    for (const child of Object.values(node.children ?? {})) total += this.sizeOf(child)
    return total
  }

  list(path: string, cwd = this.home, user = 'user', sudo = false): FSNode[] {
    const node = this.resolve(path, cwd)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    if (node.type !== 'dir') throw new FSError('ENOTDIR', `Not a directory: ${path}`)
    if (!canAccess(node, user, 'r', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    return Object.values(node.children ?? {}).sort((a, b) => a.name.localeCompare(b.name))
  }

  read(path: string, cwd = this.home, user = 'user', sudo = false): string {
    const node = this.resolve(path, cwd)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    if (node.type === 'dir') throw new FSError('EISDIR', `Is a directory: ${path}`)
    if (!canAccess(node, user, 'r', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    return node.content ?? ''
  }

  private parentOf(path: string, cwd: string): { parent: FSNode; name: string; abs: string } {
    const abs = normalizePath(path, cwd, this.home)
    const name = basename(abs)
    const parentPath = dirname(abs)
    const parent = this.resolve(parentPath)
    if (!parent) throw new FSError('ENOENT', `No such file or directory: ${parentPath}`)
    if (parent.type !== 'dir') throw new FSError('ENOTDIR', `Not a directory: ${parentPath}`)
    return { parent, name, abs }
  }

  write(path: string, content: string, cwd = this.home, user = 'user', sudo = false, append = false): void {
    const existing = this.resolve(path, cwd)
    if (existing) {
      if (existing.type === 'dir') throw new FSError('EISDIR', `Is a directory: ${path}`)
      if (!canAccess(existing, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
      existing.content = append ? (existing.content ?? '') + content : content
      existing.modified = Date.now()
      this.touch()
      return
    }
    const { parent, name } = this.parentOf(path, cwd)
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    parent.children![name] = {
      name, type: 'file', content, mode: 0o644, owner: user, group: user, modified: Date.now(),
    }
    this.touch()
  }

  mkdir(path: string, cwd = this.home, user = 'user', sudo = false, parents = false): void {
    const abs = normalizePath(path, cwd, this.home)
    if (this.exists(abs)) {
      if (parents) return
      throw new FSError('EEXIST', `File exists: ${path}`)
    }
    if (parents) {
      let cur = ''
      for (const part of abs.split('/').filter(Boolean)) {
        cur += '/' + part
        if (!this.exists(cur)) this.mkdir(cur, '/', user, sudo, false)
      }
      return
    }
    const { parent, name } = this.parentOf(abs, '/')
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    parent.children![name] = {
      name, type: 'dir', mode: 0o755, owner: user, group: user, modified: Date.now(), children: {},
    }
    this.touch()
  }

  remove(path: string, cwd = this.home, user = 'user', sudo = false, recursive = false): void {
    const abs = normalizePath(path, cwd, this.home)
    if (abs === '/') throw new FSError('EPERM', 'Refusing to remove /')
    const node = this.resolve(abs)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    if (node.type === 'dir' && !recursive && Object.keys(node.children ?? {}).length > 0)
      throw new FSError('ENOTEMPTY', `Directory not empty: ${path}`)
    const { parent, name } = this.parentOf(abs, '/')
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    delete parent.children![name]
    this.touch()
  }

  copy(src: string, dst: string, cwd = this.home, user = 'user', sudo = false): void {
    const srcNode = this.resolve(src, cwd)
    if (!srcNode) throw new FSError('ENOENT', `No such file or directory: ${src}`)
    let dstAbs = normalizePath(dst, cwd, this.home)
    const dstNode = this.resolve(dstAbs)
    if (dstNode?.type === 'dir') dstAbs = dstAbs + '/' + basename(normalizePath(src, cwd, this.home))
    const clone = structuredClone(srcNode)
    clone.name = basename(dstAbs)
    const { parent, name } = this.parentOf(dstAbs, '/')
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${dst}`)
    parent.children![name] = clone
    this.touch()
  }

  move(src: string, dst: string, cwd = this.home, user = 'user', sudo = false): void {
    this.copy(src, dst, cwd, user, sudo)
    this.remove(src, cwd, user, sudo, true)
  }

  rename(path: string, newName: string, cwd = this.home, user = 'user', sudo = false): void {
    const abs = normalizePath(path, cwd, this.home)
    const node = this.resolve(abs)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    const { parent, name } = this.parentOf(abs, '/')
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${path}`)
    if (parent.children![newName]) throw new FSError('EEXIST', `File exists: ${newName}`)
    const n = parent.children![name]
    delete parent.children![name]
    n.name = newName
    n.modified = Date.now()
    parent.children![newName] = n
    this.touch()
  }

  chmod(path: string, mode: number, cwd = this.home, user = 'user', sudo = false): void {
    const node = this.resolve(path, cwd)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    if (node.owner !== user && !sudo && user !== 'root') throw new FSError('EPERM', `Operation not permitted: ${path}`)
    node.mode = mode
    node.modified = Date.now()
    this.touch()
  }

  chown(path: string, owner: string, cwd = this.home, sudo = false): void {
    const node = this.resolve(path, cwd)
    if (!node) throw new FSError('ENOENT', `No such file or directory: ${path}`)
    if (!sudo) throw new FSError('EPERM', 'chown: changing ownership requires sudo (simulated)')
    node.owner = owner
    node.group = owner
    this.touch()
  }

  makeSymlink(target: string, linkPath: string, cwd = this.home, user = 'user', sudo = false): void {
    const { parent, name } = this.parentOf(linkPath, cwd)
    if (!canAccess(parent, user, 'w', sudo)) throw new FSError('EACCES', `Permission denied: ${linkPath}`)
    parent.children![name] = {
      name, type: 'symlink', target, mode: 0o777, owner: user, group: user, modified: Date.now(),
    }
    this.touch()
  }

  /** Recursive walk returning absolute paths matching a predicate. */
  walk(start: string, cwd = this.home, maxResults = 500): string[] {
    const out: string[] = []
    const startAbs = normalizePath(start, cwd, this.home)
    const visit = (node: FSNode, path: string) => {
      if (out.length >= maxResults) return
      out.push(path)
      if (node.type === 'dir') {
        for (const child of Object.values(node.children ?? {})) {
          visit(child, (path === '/' ? '' : path) + '/' + child.name)
        }
      }
    }
    const node = this.resolve(startAbs)
    if (node) visit(node, startAbs)
    return out
  }

  serialize(): string {
    return JSON.stringify(this.root)
  }
  static deserialize(json: string): FSNode {
    return JSON.parse(json) as FSNode
  }
}
