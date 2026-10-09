import { describe, expect, it } from 'vitest'
import { formatBytes, renameFor, savedPercent, uniqueNames } from './format'

describe('formatBytes', () => {
  it('uses friendly units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(250 * 1024)).toBe('250 KB')
    expect(formatBytes(15.5 * 1024 * 1024)).toBe('16 MB')
    expect(formatBytes(2.25 * 1024 * 1024)).toBe('2.3 MB')
  })
})

describe('savedPercent', () => {
  it('rounds down and never goes negative', () => {
    expect(savedPercent(1000, 333)).toBe(66)
    expect(savedPercent(1000, 1000)).toBe(0)
    expect(savedPercent(1000, 1200)).toBe(0)
    expect(savedPercent(0, 0)).toBe(0)
  })
})

describe('renameFor', () => {
  it('swaps the extension when the format changes', () => {
    expect(renameFor('holiday.PNG', 'png', 'webp')).toBe('holiday.webp')
    expect(renameFor('my.photo.jpeg', 'jpeg', 'avif')).toBe('my.photo.avif')
    expect(renameFor('noext', 'png', 'jpeg')).toBe('noext.jpg')
  })

  it('keeps the original name when the format stays', () => {
    expect(renameFor('Scan 01.JPG', 'jpeg', 'jpeg')).toBe('Scan 01.JPG')
  })
})

describe('uniqueNames', () => {
  it('numbers duplicates, ignoring case', () => {
    expect(uniqueNames(['a.jpg', 'A.jpg', 'b.png', 'a.jpg'])).toEqual(['a.jpg', 'A (2).jpg', 'b.png', 'a (3).jpg'])
  })

  it('avoids clashing with a name that already has a number', () => {
    expect(uniqueNames(['a (2).jpg', 'a.jpg', 'a.jpg'])).toEqual(['a (2).jpg', 'a.jpg', 'a (3).jpg'])
  })
})
