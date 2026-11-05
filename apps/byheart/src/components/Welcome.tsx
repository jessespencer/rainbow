import { useState } from 'react'
import { getBook, getTranslation } from '../lib/bible'
import { HeartMark } from './Heart'
import { BookPicker, TranslationPicker } from './Picker'

interface WelcomeProps {
  book: string
  translation: string
  onBegin: (book: string, translation: string, chapter: number) => void
}

export const Welcome = ({ book, translation, onBegin }: WelcomeProps) => {
  const [chosenBook, setChosenBook] = useState(book)
  const [chosenChapter, setChosenChapter] = useState(1)
  const [chosenTranslation, setChosenTranslation] = useState(translation)
  return (
    <main className="welcome">
      <span className="wordmark">
        <HeartMark />
        By Heart
      </span>
      <h1>What will you hide in your heart?</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onBegin(chosenBook, chosenTranslation, chosenChapter)
        }}
      >
        <div className="welcome-choice">
          <span>The book of</span>
          <BookPicker
            book={getBook(chosenBook)}
            chapter={chosenChapter}
            translation={chosenTranslation}
            progress={{}}
            onPick={(code, chapter = 1) => {
              setChosenBook(code)
              setChosenChapter(chapter)
            }}
          />
        </div>
        <div className="welcome-choice">
          <span>In the</span>
          <TranslationPicker translation={chosenTranslation} progress={{}} spelledOut onPick={setChosenTranslation} />
        </div>
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
