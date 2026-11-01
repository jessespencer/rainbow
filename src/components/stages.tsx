import { useEffect, useMemo, useRef, useState } from 'react'
import { cleanWord, shuffled, vanishOrder, type Token } from '../lib/text'
import { PassageText, type Reveal, type WordState } from './PassageText'

interface TypedStageProps {
  tokens: Token[]
  lines: Token[][]
  reveal: Reveal
  targets: number[]
  verseNumbers?: number[]
  onDone: (helped: Set<number>) => void
  onSpeak?: () => void
}

// One engine for every typing stage. They differ only in what is left on the page.
export const TypedStage = ({ tokens, lines, reveal, targets, verseNumbers, onDone, onSpeak }: TypedStageProps) => {
  const [position, setPosition] = useState(0)
  const [helped, setHelped] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<{ id: number; nonce: number }>()
  const input = useRef<HTMLInputElement>(null)
  const live = useRef({ position: 0, misses: 0, helped: new Set<number>() })
  const longPassage = tokens.length > 70
  const targetSet = useMemo(() => new Set(targets), [targets])

  useEffect(() => {
    input.current?.focus()
  }, [])

  useEffect(() => {
    if (!longPassage) return
    document
      .querySelector(`[data-word="${targets[position]}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [longPassage, position, targets])

  const step = (asHelp: boolean) => {
    const state = live.current
    if (state.position >= targets.length) return
    if (asHelp) {
      state.helped.add(targets[state.position])
      setHelped(new Set(state.helped))
    }
    state.position += 1
    state.misses = 0
    setPosition(state.position)
    if (state.position === targets.length) onDone(state.helped)
  }

  const press = (char: string) => {
    const typed = cleanWord(char)
    const state = live.current
    if (!typed || state.position >= targets.length) return
    const id = targets[state.position]
    if (typed === tokens[id].initial) return step(false)
    state.misses += 1
    if (state.misses >= 2) return step(true)
    setWrong({ id, nonce: Date.now() })
  }

  const stateOf = (token: Token): WordState => {
    if (!targetSet.has(token.id)) return 'plain'
    if (helped.has(token.id)) return 'helped'
    const at = targets[position]
    if (token.id === at) return 'current'
    return token.id < (at ?? Infinity) ? 'done' : 'todo'
  }

  return (
    <div className="typed" onClick={() => input.current?.focus()}>
      <PassageText
        lines={lines}
        reveal={reveal}
        stateOf={stateOf}
        wrong={wrong}
        verseNumbers={verseNumbers}
      />
      <input
        ref={input}
        className="typed-input"
        aria-label="Type the first letter of each word"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        value=""
        onChange={(e) => [...e.target.value].forEach(press)}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            step(true)
          }
        }}
      />
      <div className="stage-tools">
        <button type="button" className="quiet" onClick={() => step(true)}>
          Peek <kbd>Tab</kbd>
        </button>
        {onSpeak && (
          <button type="button" className="quiet" onClick={onSpeak}>
            Say it aloud instead
          </button>
        )}
      </div>
    </div>
  )
}

interface OrderStageProps {
  lines: Token[][]
  onDone: (misses: number) => void
}

const phrase = (line: Token[]) =>
  line.map((t) => `${t.before}${t.word}${t.after}`).join(' ')

export const OrderStage = ({ lines, onDone }: OrderStageProps) => {
  const chunks = useMemo(() => {
    if (lines.length >= 3) return lines
    const words = lines.flat()
    const size = Math.max(2, Math.ceil(words.length / 4))
    const out: Token[][] = []
    for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size))
    return out
  }, [lines])
  const [placed, setPlaced] = useState(0)
  const [wrong, setWrong] = useState<{ index: number; nonce: number }>()
  const misses = useRef(0)
  const order = useMemo(() => {
    const indices = chunks.map((_, i) => i)
    let mixed = shuffled(indices)
    while (mixed.length > 1 && mixed.every((v, i) => v === i)) mixed = shuffled(indices)
    return mixed
  }, [chunks])

  const choose = (index: number) => {
    if (index !== placed) {
      misses.current += 1
      setWrong({ index, nonce: Date.now() })
      return
    }
    setPlaced(placed + 1)
    if (placed + 1 === chunks.length) onDone(misses.current)
  }

  const chooseRef = useRef(choose)
  chooseRef.current = choose
  const remaining = order.filter((i) => i >= placed)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const pick = remaining[Number(e.key) - 1]
      if (pick !== undefined) chooseRef.current(pick)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="order">
      <div className="order-placed">
        {chunks.map((chunk, i) => (
          <p key={chunk[0].id} className={`sense ${i < placed ? 'order-in' : 'order-slot'}`}>
            {i < placed ? phrase(chunk) : ' '}
          </p>
        ))}
      </div>
      <ol className="order-pile">
        {remaining.map((index, i) => (
          <li key={`${index}-${wrong?.index === index ? wrong.nonce : 0}`}>
            <button
              type="button"
              className={wrong?.index === index ? 'w-wrong' : ''}
              onClick={() => choose(index)}
            >
              <span className="order-key">{i + 1}</span>
              {phrase(chunks[index])}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

const VANISH_ROUNDS = [0, 0.3, 0.55, 0.8, 1]

interface VanishStageProps {
  tokens: Token[]
  lines: Token[][]
  seed: string
  onDone: () => void
}

export const VanishStage = ({ tokens, lines, seed, onDone }: VanishStageProps) => {
  const [round, setRound] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const order = useMemo(() => vanishOrder(tokens, seed), [tokens, seed])
  const finalRound = round === VANISH_ROUNDS.length - 1
  const hidden = useMemo(
    () => new Set(order.slice(0, Math.round(order.length * VANISH_ROUNDS[round]))),
    [order, round],
  )

  const next = () => (finalRound ? onDone() : setRound(round + 1))
  const nextRef = useRef(next)
  nextRef.current = next

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) nextRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="vanish">
      <PassageText
        lines={lines}
        reveal="blank"
        stateOf={(t) => (hidden.has(t.id) && !peeking ? 'gone' : 'plain')}
      />
      <div className="stage-tools">
        <button type="button" className="primary" onClick={next}>
          {finalRound ? 'I said it' : round === 0 ? 'I said it. Let some go' : 'Again. Let more go'}
        </button>
        <button
          type="button"
          className="quiet"
          onPointerDown={() => setPeeking(true)}
          onPointerUp={() => setPeeking(false)}
          onPointerLeave={() => setPeeking(false)}
        >
          Hold to peek
        </button>
      </div>
    </div>
  )
}

interface SpeechResultLike {
  0: { transcript: string }
}

interface RecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: { results: ArrayLike<SpeechResultLike> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type RecognitionConstructor = new () => RecognitionLike

const recognitionClass = () => {
  const w = window as unknown as Record<string, RecognitionConstructor | undefined>
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export const canSpeak = () => !!recognitionClass()

// Forgiving match: speech engines hear "unto" as "onto", so a close spelling counts.
const sounds = (expected: string, heard: string) => {
  if (expected === heard) return true
  if (expected.length < 4 || heard.length < 4) return false
  return expected.slice(0, 3) === heard.slice(0, 3)
}

export const alignSpeech = (tokens: Token[], transcript: string) => {
  const skipped = new Set<number>()
  let position = 0
  for (const raw of transcript.split(/\s+/)) {
    const heard = cleanWord(raw)
    if (!heard) continue
    for (let i = position; i < Math.min(position + 4, tokens.length); i++) {
      if (sounds(cleanWord(tokens[i].word), heard)) {
        for (let s = position; s < i; s++) skipped.add(tokens[s].id)
        position = i + 1
        break
      }
    }
  }
  return { position, skipped }
}

interface ReciteStageProps {
  tokens: Token[]
  lines: Token[][]
  verseNumbers?: number[]
  onDone: (helped: Set<number>) => void
  onCancel: () => void
}

export const ReciteStage = ({ tokens, lines, verseNumbers, onDone, onCancel }: ReciteStageProps) => {
  const [progress, setProgress] = useState({ position: 0, skipped: new Set<number>() })
  const [problem, setProblem] = useState('')
  const latest = useRef({ tokens, onDone })
  latest.current = { tokens, onDone }

  useEffect(() => {
    const Recognition = recognitionClass()
    if (!Recognition) return
    const recognition = new Recognition()
    let active = true
    let heardBefore = ''
    let session = ''
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      session = Array.from(e.results, (r) => r[0].transcript).join(' ')
      const next = alignSpeech(latest.current.tokens, `${heardBefore} ${session}`)
      setProgress(next)
      if (next.position === latest.current.tokens.length) {
        active = false
        recognition.stop()
        latest.current.onDone(next.skipped)
      }
    }
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        active = false
        setProblem('The microphone is blocked for this page.')
      }
    }
    // Browsers end recognition after a pause, so carry on from what was already heard.
    recognition.onend = () => {
      if (!active) return
      heardBefore = `${heardBefore} ${session}`
      session = ''
      recognition.start()
    }
    recognition.start()
    return () => {
      active = false
      recognition.stop()
    }
  }, [])

  const stateOf = (token: Token): WordState => {
    if (progress.skipped.has(token.id)) return 'helped'
    const at = tokens[progress.position]?.id
    if (token.id === at) return 'current'
    return token.id < (at ?? Infinity) ? 'done' : 'todo'
  }

  return (
    <div className="typed">
      <PassageText lines={lines} reveal="blank" stateOf={stateOf} verseNumbers={verseNumbers} />
      <div className="stage-tools">
        <span className="listening">{problem || 'Listening'}</span>
        <button type="button" className="quiet" onClick={onCancel}>
          Back to typing
        </button>
      </div>
    </div>
  )
}
