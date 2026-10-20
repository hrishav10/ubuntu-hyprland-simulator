export type NodeType = 'dir' | 'file' | 'symlink'

export interface FSNode {
  name: string
  type: NodeType
  /** file content (text). For symlinks this is unused. */
  content?: string
  /** symlink target (absolute or relative) */
  target?: string
  /** permission bits, e.g. 0o644 */
  mode: number
  owner: string
  group: string
  modified: number
  children?: Record<string, FSNode>
}

export function dir(name: string, owner = 'user', mode = 0o755): FSNode {
  return { name, type: 'dir', mode, owner, group: owner, modified: Date.now(), children: {} }
}
export function file(name: string, content = '', owner = 'user', mode = 0o644): FSNode {
  return { name, type: 'file', content, mode, owner, group: owner, modified: Date.now() }
}
export function symlink(name: string, target: string, owner = 'user'): FSNode {
  return { name, type: 'symlink', target, mode: 0o777, owner, group: owner, modified: Date.now() }
}

export function modeToString(mode: number, type: NodeType): string {
  const t = type === 'dir' ? 'd' : type === 'symlink' ? 'l' : '-'
  const bits = [
    [0o400, 'r'], [0o200, 'w'], [0o100, 'x'],
    [0o040, 'r'], [0o020, 'w'], [0o010, 'x'],
    [0o004, 'r'], [0o002, 'w'], [0o001, 'x'],
  ] as const
  return t + bits.map(([b, c]) => (mode & b ? c : '-')).join('')
}

/** Can `user` perform op ('r'|'w'|'x') on node? Root can do anything. Simplified POSIX check. */
export function canAccess(node: FSNode, user: string, op: 'r' | 'w' | 'x', sudo = false): boolean {
  if (sudo || user === 'root') return true
  const bit = op === 'r' ? 4 : op === 'w' ? 2 : 1
  if (node.owner === user) return ((node.mode >> 6) & bit) === bit
  if (node.group === user) return ((node.mode >> 3) & bit) === bit
  return (node.mode & bit) === bit
}
