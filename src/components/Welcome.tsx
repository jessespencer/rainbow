import { useState } from 'react'
import { BOOKS, TRANSLATIONS, getTranslation } from '../lib/bible'

interface WelcomeProps {
  book: string
  translation: string
  onBegin: (book: string, translation: string) => void
}

export const Welcome = ({ book, translation, onBegin }: WelcomeProps) => {
  const [chosenBook, setChosenBook] = useState(book)
  const [chosenTranslation, setChosenTranslation] = useState(translation)
  return (
    <main className="welcome">
      <span className="wordmark">By Heart</span>
      <h1>What will you hide in your heart?</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onBegin(chosenBook, chosenTranslation)
        }}
      >
        <label className="welcome-choice">
          <span>The book of</span>
          <select value={chosenBook} onChange={(e) => setChosenBook(e.target.value)}>
            {BOOKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="welcome-choice">
          <span>In the</span>
          <select value={chosenTranslation} onChange={(e) => setChosenTranslation(e.target.value)}>
            {TRANSLATIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {getTranslation(chosenTranslation).keySource && (
          <p className="welcome-key">The {chosenTranslation} needs a free key, which you add on the next page.</p>
        )}
        <button type="submit" className="primary">
          Open the book
        </button>
      </form>
      <ul className="welcome-notes">
        <li>Verses begin in grey and darken as you learn them.</li>
        <li>Learn a verse a day, and each comes back as it starts to fade.</li>
        <li>Progress is kept per translation, in this browser only.</li>
      </ul>
    </main>
  )
}
