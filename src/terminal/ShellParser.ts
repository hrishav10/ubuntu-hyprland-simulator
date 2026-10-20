export interface Token {
  value: string
  singleQuoted: boolean
}

export interface ParsedSegment {
  tokens: Token[]
  redirectOut?: string
  redirectAppend?: string
  redirectIn?: string
}

export interface ParsedLine {
  segments: ParsedSegment[]
}

/** Tokenize a shell line respecting single/double quotes and backslash escapes. */
export function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  let cur = ''
  let inSingle = false
  let inDouble = false
  let started = false
  let singleQuoted = false
  const push = () => {
    if (started) tokens.push({ value: cur, singleQuoted })
    cur = ''
    started = false
    singleQuoted = false
  }
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inSingle) {
      if (c === "'") inSingle = false
      else cur += c
      continue
    }
    if (inDouble) {
      if (c === '"') inDouble = false
      else if (c === '\\' && i + 1 < line.length) cur += line[++i]
      else cur += c
      continue
    }
    if (c === "'") { inSingle = true; started = true; singleQuoted = true; continue }
    if (c === '"') { inDouble = true; started = true; continue }
    if (c === '\\' && i + 1 < line.length) { cur += line[++i]; started = true; continue }
    if (/\s/.test(c)) { push(); continue }
    cur += c
    started = true
  }
  push()
  return tokens
}

/** Split a line into pipeline segments on unquoted |, handling > >> < per segment. */
export function parseLine(line: string): ParsedLine {
  // Split on unquoted |
  const parts: string[] = []
  let cur = ''
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === "'" && !inDouble) inSingle = !inSingle
    else if (c === '"' && !inSingle) inDouble = !inDouble
    if (c === '|' && !inSingle && !inDouble) { parts.push(cur); cur = '' } else cur += c
  }
  parts.push(cur)

  const segments: ParsedSegment[] = parts.map((part) => {
    const toks = tokenize(part)
    const seg: ParsedSegment = { tokens: [] }
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]
      if (!t.singleQuoted && t.value === '>' && toks[i + 1]) { seg.redirectOut = toks[++i].value; continue }
      if (!t.singleQuoted && t.value === '>>' && toks[i + 1]) { seg.redirectAppend = toks[++i].value; continue }
      if (!t.singleQuoted && t.value === '<' && toks[i + 1]) { seg.redirectIn = toks[++i].value; continue }
      // glued forms: >file, >>file
      if (!t.singleQuoted && /^>>.+/.test(t.value)) { seg.redirectAppend = t.value.slice(2); continue }
      if (!t.singleQuoted && /^>.+/.test(t.value)) { seg.redirectOut = t.value.slice(1); continue }
      seg.tokens.push(t)
    }
    return seg
  })
  return { segments }
}

export function expandToken(token: Token, env: Record<string, string>): string {
  if (token.singleQuoted) return token.value
  return token.value.replace(/\$\{(\w+)\}|\$(\w+)/g, (_m, a: string, b: string) => env[a ?? b] ?? '')
}
