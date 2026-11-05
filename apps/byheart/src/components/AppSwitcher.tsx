import { APPS, appHref } from '@jessespencer/bible-ui/apps'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { HeartMark } from './Heart'

// The family's app switcher, set in By Heart's own type: the wordmark opens a sheet of the apps.
export const AppSwitcher = () => {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  // Caught on the way down, as in the pickers, so Escape closes the sheet before the page sees it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <div className="apps">
      <button
        ref={trigger}
        type="button"
        className="wordmark apps-trigger"
        aria-label="By Heart: switch app"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <HeartMark />
        By Heart
        <svg className="apps-chevron" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <>
          <div className="pick-scrim" onClick={close} />
          <nav className="pick-panel pick-apps" aria-label="Apps">
            {APPS.map((app) => {
              const here = app.id === 'byheart'
              return (
                <a
                  key={app.id}
                  href={appHref(app)}
                  className={`pick-app ${here ? 'on' : ''}`}
                  aria-current={here ? 'page' : undefined}
                  style={{ '--app-accent': app.accent } as CSSProperties}
                  onClick={(e) => {
                    if (!here) return
                    e.preventDefault()
                    close()
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: app.icon }} />
                  <strong>{app.label}</strong>
                  <span>{app.tagline}</span>
                </a>
              )
            })}
          </nav>
        </>
      )}
    </div>
  )
}
