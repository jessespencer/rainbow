import { memo } from 'react'
import type { Token } from '../lib/text'

export type WordState = 'plain' | 'todo' | 'current' | 'done' | 'helped' | 'gone'
export type Reveal = 'ghost' | 'initial' | 'shape' | 'blank'

interface WordProps {
  token: Token
  state: WordState
  reveal: Reveal
  shaking: boolean
}

const Word = memo(({ token, state, reveal, shaking }: WordProps) => {
  const inked = state === 'done' || state === 'helped' || state === 'plain'
  const classes = ['w', `w-${state}`, inked ? '' : `r-${reveal}`, shaking ? 'w-wrong' : '']
  const firstLetterShown = !inked && reveal === 'initial'
  return (
    <span className={classes.join(' ')} data-word={token.id}>
      {token.before && <span className="p">{token.before}</span>}
      {firstLetterShown ? (
        <>
          <span className="first">{token.word.charAt(0)}</span>
          <span className="rest">{token.word.slice(1)}</span>
        </>
      ) : (
        <span className="core">{token.word}</span>
      )}
      {token.after && <span className="p">{token.after}</span>}
    </span>
  )
})

interface PassageTextProps {
  lines: Token[][]
  reveal: Reveal | ((token: Token) => Reveal)
  stateOf: (token: Token) => WordState
  wrong?: { id: number; nonce: number }
  verseNumbers?: number[]
}

export const PassageText = ({ lines, reveal, stateOf, wrong, verseNumbers }: PassageTextProps) => {
  const tokenCount = lines.reduce((sum, line) => sum + line.length, 0)
  const size = tokenCount > 70 ? 'long' : tokenCount > 38 ? 'medium' : 'short'
  return (
    <div className={`passage passage-${size}`}>
      {lines.map((line, i) => {
        const startsVerse = i === 0 || lines[i - 1][0].verseIndex !== line[0].verseIndex
        return (
          <p key={line[0].id} className={`sense ${startsVerse ? 'sense-first' : ''}`}>
            {verseNumbers && startsVerse && <span className="sense-number">{verseNumbers[line[0].verseIndex]}</span>}
            {line.map((token) => (
              <Word
                // A fresh key on the wrong word restarts its shake without touching the others.
                key={wrong?.id === token.id ? `${token.id}-${wrong.nonce}` : token.id}
                token={token}
                state={stateOf(token)}
                reveal={typeof reveal === 'function' ? reveal(token) : reveal}
                shaking={wrong?.id === token.id}
              />
            ))}
          </p>
        )
      })}
    </div>
  )
}
