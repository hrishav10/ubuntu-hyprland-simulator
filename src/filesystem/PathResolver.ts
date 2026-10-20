/** Pure path utilities: normalization, ~ expansion, . / .. resolution. No VFS access here. */
export function normalizePath(input: string, cwd = '/home/user', home = '/home/user'): string {
  let p = input.trim()
  if (p === '~' || p.startsWith('~/')) p = home + p.slice(1)
  if (!p.startsWith('/')) p = (cwd.endsWith('/') ? cwd : cwd + '/') + p
  const parts: string[] = []
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return '/' + parts.join('/')
}

export function dirname(path: string): string {
  const n = normalizePath(path, '/', '/')
  if (n === '/') return '/'
  const i = n.lastIndexOf('/')
  return i === 0 ? '/' : n.slice(0, i)
}

export function basename(path: string): string {
  const n = normalizePath(path, '/', '/')
  if (n === '/') return '/'
  return n.slice(n.lastIndexOf('/') + 1)
}

export function joinPath(...parts: string[]): string {
  return normalizePath(parts.join('/'), '/', '/')
}
