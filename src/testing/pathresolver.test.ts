import { describe, expect, it } from 'vitest'
import { basename, dirname, normalizePath } from '../filesystem/PathResolver'

describe('PathResolver', () => {
  it('expands ~ to home', () => {
    expect(normalizePath('~')).toBe('/home/user')
    expect(normalizePath('~/Documents')).toBe('/home/user/Documents')
  })
  it('resolves relative paths against cwd', () => {
    expect(normalizePath('file.txt', '/home/user')).toBe('/home/user/file.txt')
    expect(normalizePath('./a/../b', '/home/user')).toBe('/home/user/b')
  })
  it('resolves .. and collapses duplicate slashes', () => {
    expect(normalizePath('/home/user/../user//Desktop')).toBe('/home/user/Desktop')
    expect(normalizePath('/..')).toBe('/')
    expect(normalizePath('..', '/home/user')).toBe('/home')
  })
  it('basename and dirname', () => {
    expect(basename('/a/b/c.txt')).toBe('c.txt')
    expect(dirname('/a/b/c.txt')).toBe('/a/b')
    expect(dirname('/a')).toBe('/')
  })
})
