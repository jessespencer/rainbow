import { flushSync } from 'react-dom'

export const prefersStillness = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let latest: ViewTransition | undefined

// Browsers without view transitions simply change straight away.
export const canTransition = () => !!document.startViewTransition && !prefersStillness()

export const withTransition = (kind: 'screen' | 'theme' | 'page', update: () => void) => {
  if (!canTransition()) return update()
  const root = document.documentElement
  root.dataset.transition = kind
  const transition = document.startViewTransition(() => flushSync(update))
  latest = transition
  // A skipped transition rejects this, but the update itself still runs.
  transition.ready.catch(() => {})
  // A newer transition takes over the marker, so only the latest may clear it.
  transition.finished.finally(() => {
    if (latest === transition) delete root.dataset.transition
  })
}

// The new theme spreads out from the button that asked for it.
export const revealFrom = (origin: HTMLElement, update: () => void) => {
  const { left, top, width, height } = origin.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const style = document.documentElement.style
  style.setProperty('--reveal-x', `${x}px`)
  style.setProperty('--reveal-y', `${y}px`)
  style.setProperty('--reveal-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
  withTransition('theme', update)
}
