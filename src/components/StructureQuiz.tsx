import { useEffect, useRef, useState } from 'react'
import type { Book } from '../lib/bible'
import type { Progress } from '../lib/memory'
import { quizRound, type Outline, type Question, type Section } from '../lib/outline'
import { shuffled } from '../lib/text'
import { Back } from './Back'

interface StructureQuizProps {
  book: Book
  outline: Outline
  recall: Progress
  focus?: Section
  onGrade: (key: string, clean: boolean) => void
  onExit: () => void
}

const RIGHT_MS = 750

export const StructureQuiz = ({ book, outline, recall, focus, onGrade, onExit }: StructureQuizProps) => {
  const [queue, setQueue] = useState(() => quizRound(outline, recall, focus))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Section>()
  const [firstTime, setFirstTime] = useState(0)
  const [asked, setAsked] = useState(0)
  const graded = useRef(new Set<string>())
  const timer = useRef(0)
  const question = queue[index] as Question | undefined
  const missed = !!picked && picked !== question?.answer

  useEffect(() => {
    window.scrollTo(0, 0)
    return () => clearTimeout(timer.current)
  }, [])

  const advance = () => {
    setPicked(undefined)
    setIndex(index + 1)
  }

  // Only the first answer counts. A miss comes round again at the end, so the round
  // always closes on the right answer.
  const choose = (option: Section) => {
    if (!question || picked) return
    const right = option === question.answer
    setPicked(option)
    if (!graded.current.has(question.key)) {
      graded.current.add(question.key)
      onGrade(question.key, right)
      setAsked(asked + 1)
      if (right) setFirstTime(firstTime + 1)
    }
    if (right) timer.current = window.setTimeout(advance, RIGHT_MS)
    else setQueue([...queue, { ...question, options: shuffled(question.options) }])
  }

  const restart = () => {
    graded.current.clear()
    setQueue(quizRound(outline, recall))
    setIndex(0)
    setFirstTime(0)
    setAsked(0)
  }

  const chooseRef = useRef(choose)
  chooseRef.current = choose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onExit()
      const option = queue[index]?.options[Number(e.key) - 1]
      if (option) chooseRef.current(option)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [queue, index, onExit])

  if (!question) {
    const misses = asked - firstTime
    return (
      <main className="session session-end">
        <p className="fleuron">❦</p>
        <h1>{misses ? 'Nearly held.' : 'It holds.'}</h1>
        <p className="session-message">
          {firstTime} of {asked} at the first asking
          {misses > 0 && `, ${misses} to come back to tomorrow`}.
        </p>
        <button type="button" className="primary" onClick={onExit}>
          Back to the map
        </button>
        <button type="button" className="quiet" onClick={restart}>
          Another round
        </button>
      </main>
    )
  }

  return (
    <main className="session">
      <header className="session-head">
        <Back to="Structure" label="Back to the map" onClick={onExit} />
        <h1 className="session-ref">What comes next?</h1>
        <span className="session-count">
          {index + 1} of {queue.length}
        </span>
      </header>
      <div className="ladder ladder-solo">{question.kind === 'next' ? 'the order' : 'the place'}</div>
      <section className="stage">
        <div className="quiz" key={index}>
          <p className="quiz-lead">{question.kind === 'next' ? 'After' : 'Where in the book is'}</p>
          <p className="quiz-prompt">{question.kind === 'next' ? question.prompt : `${book.name} ${question.prompt}`}</p>
          <p className="quiz-lead">{question.kind === 'next' ? 'comes' : 'found?'}</p>
          <ol className="order-pile">
            {question.options.map((option, i) => {
              const state = !picked ? '' : option === question.answer ? 'quiz-right' : option === picked ? 'quiz-miss w-wrong' : 'quiz-other'
              return (
                <li key={option.id}>
                  <button type="button" className={state} disabled={!!picked} onClick={() => choose(option)}>
                    <span className="order-key">{i + 1}</span>
                    {option.name}
                  </button>
                </li>
              )
            })}
          </ol>
          {missed && (
            <div className="stage-tools" role="status">
              <span className="again-note">It will come round again.</span>
              <button type="button" className="primary" autoFocus onClick={advance}>
                Continue
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
