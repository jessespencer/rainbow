import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

const Broken = () => {
  throw new Error('bad verse')
}

it('shows a way back instead of a blank page when rendering fails', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  )
  expect(screen.getByText(/your verses are safe/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open the page again' })).toBeInTheDocument()
  vi.restoreAllMocks()
})
