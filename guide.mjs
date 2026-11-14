import { BOARD_SIZE } from './game.mjs'

export const GUIDE_KEY = 'glutnest.guide.v1'
export const GUIDE_STEPS = ['feed', 'garden', 'pair', 'reward', 'journal']

const cleanStep = (status, step = null, pair = null) => ({ status, step, pair, selected: null })

export function beginGuide() {
  return cleanStep('active', 'feed')
}

function validIndex(index) {
  return Number.isInteger(index) && index >= 0 && index < BOARD_SIZE ** 2
}

function validPair(pair) {
  if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(validIndex)) return false
  const [first, second] = pair
  const columnDistance = Math.abs(first % BOARD_SIZE - second % BOARD_SIZE)
  const rowDistance = Math.abs(Math.floor(first / BOARD_SIZE) - Math.floor(second / BOARD_SIZE))
  return columnDistance + rowDistance === 1
}

function samePair(first, second) {
  return validPair(first) && validPair(second)
    && first.includes(second[0]) && first.includes(second[1])
}

export function normalizeGuide(raw, { hasSave = false } = {}) {
  if (raw?.status === 'finished') return cleanStep('finished')
  if (['active', 'paused'].includes(raw?.status) && GUIDE_STEPS.includes(raw.step)) {
    const pair = raw.step === 'pair' && validPair(raw.pair) ? raw.pair.slice() : null
    return cleanStep(raw.status, raw.step, pair)
  }
  return hasSave ? cleanStep('finished') : beginGuide()
}

export function guideEvent(guide, event) {
  if (guide.status === 'finished') return guide
  if (event.type === 'skip') return cleanStep('finished')
  if (event.type === 'pause' && guide.status === 'active') {
    return cleanStep('paused', guide.step, guide.pair)
  }
  if (event.type === 'resume' && guide.status === 'paused') {
    return cleanStep('active', guide.step, guide.pair)
  }
  if (guide.status !== 'active') return guide

  switch (guide.step) {
    case 'feed':
      return event.type === 'fed' ? cleanStep('active', 'garden') : guide
    case 'garden':
      return event.type === 'garden' ? cleanStep('active', 'pair') : guide
    case 'pair': {
      if (event.type === 'pair-set' && !samePair(guide.pair, event.pair)) {
        const pair = validPair(event.pair) ? event.pair.slice() : null
        return cleanStep('active', 'pair', pair)
      }
      if (event.type === 'tile-selected') {
        const selected = guide.pair?.includes(event.index) ? event.index : null
        return selected === guide.selected ? guide : { ...guide, selected }
      }
      if (event.type === 'move-committed' && samePair(guide.pair, [event.from, event.to])) {
        return cleanStep('active', 'reward')
      }
      return guide
    }
    case 'reward':
      return event.type === 'continue' ? cleanStep('active', 'journal') : guide
    case 'journal':
      return event.type === 'continue' || event.type === 'journal' ? cleanStep('finished') : guide
    default:
      return guide
  }
}
