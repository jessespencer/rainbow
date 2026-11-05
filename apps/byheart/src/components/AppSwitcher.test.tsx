import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppSwitcher } from './AppSwitcher'

const open = async () => {
  render(<AppSwitcher />)
  const user = userEvent.setup()
  const trigger = screen.getByRole('button', { name: 'By Heart: switch app' })
  await user.click(trigger)
  return { user, trigger }
}

describe('AppSwitcher', () => {
  it('lists every app in the family, linked to where it lives', async () => {
    await open()
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual([
      expect.stringContaining('Atlas'),
      expect.stringContaining('Lineage'),
      expect.stringContaining('By Heart'),
    ])
    expect(screen.getByRole('link', { name: /Atlas/ })).toHaveAttribute('href', expect.stringContaining('/bible/atlas/'))
    expect(screen.getByRole('link', { name: /Lineage/ })).toHaveAttribute('href', expect.stringContaining('/bible/lineage/'))
  })

  it('marks By Heart as the app you are in', async () => {
    await open()
    expect(screen.getByRole('link', { name: /By Heart/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Atlas/ })).not.toHaveAttribute('aria-current')
  })

  it('closes on Escape and hands focus back to the wordmark', async () => {
    const { user, trigger } = await open()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Apps' })).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('closes when the page around it or By Heart itself is chosen', async () => {
    const { user } = await open()
    await user.click(document.querySelector('.pick-scrim')!)
    expect(screen.queryByRole('navigation', { name: 'Apps' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'By Heart: switch app' }))
    await user.click(screen.getByRole('link', { name: /By Heart/ }))
    expect(screen.queryByRole('navigation', { name: 'Apps' })).not.toBeInTheDocument()
  })
})
