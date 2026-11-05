import { beforeEach, describe, expect, it } from 'vitest'
import { BackupError, makeBackup, readBackup, restoreBackup } from './backup'

const progress = JSON.stringify({ 'BSB:EPH:1:1': { stage: 8, box: 3, due: '2026-11-10', lapses: 0 } })

describe('backups', () => {
  beforeEach(() => localStorage.clear())

  it('carries progress, structure recall, place and theme, but never keys or Bible text', () => {
    localStorage.setItem('byheart.progress', progress)
    localStorage.setItem('byheart.theme', 'dark')
    localStorage.setItem('byheart.esvKey', 'secret')
    localStorage.setItem('byheart.text.BSB.EPH.1', '[]')

    expect(makeBackup().stores).toEqual({ 'byheart.progress': progress, 'byheart.theme': 'dark' })
  })

  it('round-trips through a file and restores what was saved', () => {
    localStorage.setItem('byheart.progress', progress)
    const file = JSON.stringify(makeBackup())
    localStorage.clear()

    restoreBackup(readBackup(file))

    expect(localStorage.getItem('byheart.progress')).toBe(progress)
  })

  it('replaces this browser’s progress, clearing stores the backup lacks', () => {
    localStorage.setItem('byheart.structure', '{}')
    restoreBackup({ 'byheart.progress': progress })
    expect(localStorage.getItem('byheart.structure')).toBeNull()
  })

  it('rejects files that are not By Heart backups', () => {
    expect(() => readBackup('not json')).toThrow(BackupError)
    expect(() => readBackup(JSON.stringify({ app: 'other', stores: {} }))).toThrow(BackupError)
    expect(() => readBackup(JSON.stringify({ app: 'by-heart', version: 2, stores: {} }))).toThrow(/newer/)
  })

  it('drops stores it does not know or that are not valid', () => {
    const file = JSON.stringify({
      app: 'by-heart',
      version: 1,
      stores: { 'byheart.esvKey': 'x', 'byheart.progress': '{broken', 'byheart.theme': 'purple', 'byheart.place': '{}' },
    })
    expect(readBackup(file)).toEqual({ 'byheart.place': '{}' })
  })
})
