import { describe, expect, it } from 'vitest'
import { BOOKS, findBooks } from './bible'

const names = (query: string) => findBooks(query).matches.map((b) => b.name)

describe('findBooks', () => {
  it('finds every book by its full name, its code and its squashed name', () => {
    for (const book of BOOKS) {
      expect(findBooks(book.name).best).toBe(book)
      expect(findBooks(book.code).matches).toContain(book)
      expect(findBooks(book.name.replace(/ /g, '')).best).toBe(book)
    }
  })

  it.each([
    ['eph', 'Ephesians'],
    ['phil', 'Philippians'],
    ['phm', 'Philemon'],
    ['1 cor', '1 Corinthians'],
    ['1cor', '1 Corinthians'],
    ['cor', '1 Corinthians'],
    ['john', 'John'],
    ['1 john', '1 John'],
    ['3 john', '3 John'],
    ['jude', 'Jude'],
    ['psalm', 'Psalms'],
    ['song', 'Song of Solomon'],
    ['mk', 'Mark'],
    ['lk', 'Luke'],
    ['jn', 'John'],
    ['mt', 'Matthew'],
    ['sos', 'Song of Solomon'],
    ['EPH', 'Ephesians'],
  ])('reads %s as %s', (query, name) => {
    expect(findBooks(query).best?.name).toBe(name)
  })

  it('keeps the matches in canon order so the arrow keys walk the page', () => {
    expect(names('phil')).toEqual(['Philippians', 'Philemon'])
  })

  it('falls back to scattered letters only when nothing matches cleanly', () => {
    expect(names('1 th')).toEqual(['1 Thessalonians'])
    expect(names('john')).toEqual(['John', '1 John', '2 John', '3 John'])
    expect(names('mk')).toEqual(['Mark'])
  })

  it.each([
    ['rom 8', 'Romans', 8],
    ['rom8', 'Romans', 8],
    ['1 cor 13', '1 Corinthians', 13],
    ['john 3:16', 'John', 3],
    ['ps 23', 'Psalms', 23],
  ])('splits %s into a book and a chapter', (query, name, chapter) => {
    expect(findBooks(query)).toMatchObject({ best: { name }, chapter })
  })

  it('treats a leading number as part of the book, not a chapter', () => {
    expect(findBooks('1').chapter).toBeUndefined()
    expect(findBooks('1').best?.name).toBe('1 Samuel')
    expect(findBooks('2 john').chapter).toBeUndefined()
  })

  it('ignores a chapter of zero', () => {
    expect(findBooks('rom 0')).toMatchObject({ best: { name: 'Romans' }, chapter: undefined })
  })

  it('finds nothing for letters no book contains', () => {
    expect(findBooks('qq')).toMatchObject({ matches: [], best: undefined })
  })
})
