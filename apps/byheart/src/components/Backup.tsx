import { useRef, useState } from 'react'
import { BackupError, downloadBackup, readBackup, restoreBackup } from '../lib/backup'

// Progress lives only in this browser, so the colophon offers a copy to keep elsewhere.
export const Backup = () => {
  const picker = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState('')

  const restore = async (file: File) => {
    try {
      const stores = readBackup(await file.text())
      if (!window.confirm('Replace the progress in this browser with the backup?')) return
      restoreBackup(stores)
      window.location.reload()
    } catch (e) {
      setProblem(e instanceof BackupError ? e.message : 'That backup couldn’t be read.')
    }
  }

  return (
    <p>
      Your progress is kept in this browser only.{' '}
      <button type="button" className="link" onClick={downloadBackup}>
        Save a backup
      </button>{' '}
      or{' '}
      <button type="button" className="link" onClick={() => picker.current?.click()}>
        restore one
      </button>
      .
      <input
        ref={picker}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="Backup file"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          setProblem('')
          if (file) void restore(file)
        }}
      />
      {problem && (
        <>
          {' '}
          <span className="rubric" role="alert">
            {problem}
          </span>
        </>
      )}
    </p>
  )
}
