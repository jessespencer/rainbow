import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no layout and no media queries. Tests start on a desktop with a mouse.
export const setDevice = (fine: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: fine && query.includes('hover'), media: query }))

// Browsers' scroll methods now return a promise, so an effect that returns one crashes on cleanup.
Element.prototype.scrollIntoView = () => Promise.resolve() as unknown as void
window.scrollTo = () => Promise.resolve() as unknown as void

afterEach(() => {
  cleanup()
  setDevice(true)
})

setDevice(true)
