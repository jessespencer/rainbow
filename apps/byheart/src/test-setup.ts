import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no layout and no media queries. Tests start on a desktop with a mouse.
export const setDevice = (fine: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: fine && query.includes('hover'), media: query }))

Element.prototype.scrollIntoView = () => {}
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  setDevice(true)
})

setDevice(true)
