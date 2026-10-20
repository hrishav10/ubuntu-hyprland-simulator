import { describe, expect, it } from 'vitest'
import { parseLine, tokenize } from '../terminal/ShellParser'

describe('ShellParser', () => {
  it('tokenizes plain words', () => {
    expect(tokenize('ls -la /home').map((t) => t.value)).toEqual(['ls', '-la', '/home'])
  })
  it('keeps quoted strings together', () => {
    expect(tokenize(`echo "hello world" 'single quoted'`).map((t) => t.value)).toEqual(['echo', 'hello world', 'single quoted'])
  })
  it('marks single-quoted tokens (no expansion)', () => {
    const toks = tokenize(`echo '$HOME' "$HOME"`)
    expect(toks[1].singleQuoted).toBe(true)
    expect(toks[2].singleQuoted).toBe(false)
  })
  it('handles escapes', () => {
    expect(tokenize(String.raw`echo a\ b`).map((t) => t.value)).toEqual(['echo', 'a b'])
  })
  it('splits pipelines and parses redirection', () => {
    const parsed = parseLine('ls /home | grep txt > out.txt')
    expect(parsed.segments).toHaveLength(2)
    expect(parsed.segments[0].tokens.map((t) => t.value)).toEqual(['ls', '/home'])
    expect(parsed.segments[1].redirectOut).toBe('out.txt')
    const appended = parseLine('echo hi >> log.txt')
    expect(appended.segments[0].redirectAppend).toBe('log.txt')
    const glued = parseLine('echo hi >file.txt')
    expect(glued.segments[0].redirectOut).toBe('file.txt')
  })
  it('does not split on quoted pipes', () => {
    const parsed = parseLine('echo "a|b"')
    expect(parsed.segments).toHaveLength(1)
  })
})
