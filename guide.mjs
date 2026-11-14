import { BOARD_SIZE, MISSIONS, SHOP, isMissionUnlocked } from './game.mjs'
import { LANTERN_LIGHTS } from './lantern.mjs'
import { MASTERY_GOALS } from './mastery.mjs'
import { FIRST_REWARD_ID } from './reward.mjs'

export const GUIDE_KEY = 'glutnest.guide.v1'
const GUIDE_STEPS = ['feed', 'garden', 'pair', 'reward', 'win', 'furnish', 'settle', 'journal']

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
      if (event.type === 'move-committed' && validPair([event.from, event.to])) {
        return cleanStep('active', 'reward')
      }
      return guide
    }
    case 'reward':
      return event.type === 'continue' ? cleanStep('active', 'win') : guide
    case 'win':
      return event.type === 'won-first' ? cleanStep('active', 'furnish') : guide
    case 'furnish':
      return event.type === 'furnished' ? cleanStep('active', 'settle') : guide
    case 'settle':
      return event.type === 'saw-cushion' ? cleanStep('finished') : guide
    case 'journal':
      return event.type === 'continue' || event.type === 'journal' ? cleanStep('finished') : guide
    default:
      return guide
  }
}

const firstMission = MISSIONS[0]
const firstFurnishing = SHOP.find(item => item.id === FIRST_REWARD_ID)
const missionById = new Map(MISSIONS.map(mission => [mission.id, mission]))
const bonusLights = Object.values(LANTERN_LIGHTS).filter(light => light.goal)

export function nestJourney(state, mastery, lantern) {
  const { round, egg, progress, owned, glow } = state
  const active = round?.status === 'playing' ? missionById.get(round.missionId) : null
  if (active) {
    return { href:'#garten/fortsetzen', icon:'gem', title:active.label + ' fortsetzen', detail:round.movesLeft === 1 ? 'Dir bleibt noch ein Zug.' : 'Dir bleiben noch ' + round.movesLeft + ' Züge.' }
  }
  if (egg.stage === 'egg') {
    return { href:'#nest/ei', icon:'egg', title:'Drachenei wärmen', detail:'Das Ei liegt im Moos. Noch ' + (3 - egg.warmth) + ' Mal wärmen, dann schlüpft Knöpfchen.' }
  }
  if (progress.wins.length === 1 && !owned.includes(FIRST_REWARD_ID) && glow >= firstFurnishing.cost) {
    return { href:'#sammlung/mooskissen', icon:'cushion', title:'Ein Mooskissen fürs Nest', detail:'Deine Glutsterne reichen für einen weichen Schlafplatz.' }
  }
  const next = MISSIONS.find(mission => !progress.wins.includes(mission.id) && isMissionUnlocked(state, mission.id))
  if (next) {
    const detail = next === firstMission ? 'Finde die ersten Glutsterne für dein Nest.' : next.description
    return { href:'#garten/abenteuer/' + next.id, icon:'gem', title:next.label + ' entdecken', detail }
  }
  if (!lantern.unlocked) {
    return { href:'#garten/abzeichen', icon:'star', title:'Sternabzeichen suchen', detail:mastery.earned.length + ' von ' + Object.keys(MASTERY_GOALS).length + ' gesammelt. Alle vier bringen die Sternenlaterne ins Nest.' }
  }
  const remaining = bonusLights.filter(light => !lantern.earned.includes(light.id))
  if (remaining.length) {
    return { href:'#garten/lichtsuche', icon:'lantern', title:'Weiter auf Lichtsuche', detail:remaining.length === 1 ? remaining[0].title + ' fehlt dir noch für die Sternenlaterne.' : 'Bachleuchten und Sternentanz warten auf dich.' }
  }
  return { href:'#garten', icon:'gem', title:'In den Kristallgarten', detail:'Spiele deine Lieblingsrunde noch einmal.' }
}
