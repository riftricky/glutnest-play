import { MASTERY_GOALS } from './mastery.mjs'

const DEFAULT_LIGHT = 'abendglut'
const FIRST_LIGHTS = [DEFAULT_LIGHT, 'mondschein']

export const LANTERN_LIGHTS = {
  abendglut: {
    id: 'abendglut',
    title: 'Abendglut',
    description: 'Warmes Licht wie vom Feuer im Nest.',
    color: '#ffc879',
    adult: { kind: 'abendglut', message: '{name} streckt die Schnauze ins warme Licht und schließt die Augen.' },
    baby: { kind: 'abendglut', message: 'Knöpfchen rückt näher an die Laterne und macht es sich gemütlich.' },
  },
  mondschein: {
    id: 'mondschein',
    title: 'Mondschein',
    description: 'Blasses Mondlicht fällt auf das Moos.',
    color: '#a5c8ff',
    adult: { kind: 'mondschein', message: '{name} hebt den Kopf und beobachtet einen hellen Lichtfleck.' },
    baby: { kind: 'mondschein', message: 'Knöpfchen schleicht auf den Mondfleck zu und hält eine Pfote hinein.' },
  },
  bachleuchten: {
    id: 'bachleuchten',
    title: 'Bachleuchten',
    description: 'Grünblaue Lichtwellen wandern über das Nest.',
    color: '#70e2d2',
    adult: { kind: 'bachleuchten', message: '{name} neigt den Kopf und schaut den Lichtwellen zu.' },
    baby: { kind: 'bachleuchten', message: 'Knöpfchen jagt einer Lichtwelle nach und landet mit beiden Pfoten im Moos.' },
    goal: {
      missionId: 'mondbach',
      description: 'Sammle am Mondbach mindestens 10 Blätter und gewinne die Runde. Sammle zuerst Blätter, wenn dir noch Tautropfen fehlen.',
      target: 10,
      unit: 'Blätter',
    },
  },
  sternentanz: {
    id: 'sternentanz',
    title: 'Sternentanz',
    description: 'Kleine violette Sterne tanzen im Laternenlicht.',
    color: '#d1a5ff',
    adult: { kind: 'sternentanz', message: '{name} schaut nach oben und folgt einem tanzenden Stern mit der Schnauze.' },
    baby: { kind: 'sternentanz', message: 'Knöpfchen flattert los und versucht, einen Stern mit den Vorderpfoten zu fangen.' },
    goal: {
      missionId: 'gluehlichtung',
      description: 'Erzeuge auf der Glühlichtung ab Zug 2 mindestens 2 neue Spezialkristalle und gewinne. Suche nach Reihen aus vier oder mehr gleichen Kristallen.',
      target: 2,
      unit: 'Spezialkristalle erzeugt',
    },
  },
}

const bonusLights = Object.values(LANTERN_LIGHTS).filter(light => light.goal)

function hasAllMedals(mastery) {
  return Object.keys(MASTERY_GOALS).every(id => mastery.earned.includes(id))
}

function goalForRound(state, earned) {
  return bonusLights.find(light =>
    light.goal.missionId === state.round?.missionId && !earned.includes(light.id)
  ) ?? null
}

function usableLight(lantern, id) {
  return lantern.unlocked && (FIRST_LIGHTS.includes(id) || lantern.earned.includes(id))
}

export function normalizeLantern(saved, mastery, state) {
  const unlocked = hasAllMedals(mastery)
  const savedEarned = Array.isArray(saved?.earned) ? saved.earned : []
  const earned = unlocked ? bonusLights.filter(light => savedEarned.includes(light.id)).map(light => light.id) : []
  const lantern = { unlocked, earned, selected: unlocked ? DEFAULT_LIGHT : null, active: null }
  if (usableLight(lantern, saved?.selected)) lantern.selected = saved.selected
  if (!unlocked) return lantern

  const light = goalForRound(state, earned)
  const stored = saved?.active
  const round = state.round
  if (light && round.status === 'playing' && stored?.id === light.id && stored.movesLeft === round.movesLeft) {
    lantern.active = {
      id: light.id,
      movesLeft: round.movesLeft,
      firstMovePending: stored.firstMovePending !== false,
      created: Number.isSafeInteger(stored.created)
        ? Math.max(0, Math.min(light.goal.target, stored.created))
        : 0,
    }
  }
  return lantern
}

export function beginLanternRound(lantern, mastery, state) {
  const normalized = normalizeLantern(lantern, mastery, state)
  const light = normalized.unlocked ? goalForRound(state, normalized.earned) : null
  const active = light && state.round.status === 'playing'
    ? { id: light.id, movesLeft: state.round.movesLeft, firstMovePending: true, created: 0 }
    : null
  return { ...normalized, active }
}

function progressFor(light, state, active) {
  return light.id === 'bachleuchten' ? (state.round.tiles.leaf ?? 0) : active.created
}

export function recordLanternMove(lantern, mastery, state, summary) {
  const { active } = lantern
  const normalized = normalizeLantern(lantern, mastery, state)
  const light = normalized.unlocked ? goalForRound(state, normalized.earned) : null
  if (!light || active?.id !== light.id || active.movesLeft - 1 !== state.round.movesLeft) {
    return { lantern: normalized, earned: null }
  }

  const updated = {
    ...active,
    movesLeft: state.round.movesLeft,
    firstMovePending: false,
    created: active.firstMovePending
      ? 0
      : Math.min(light.goal.target, active.created + summary.createdSpecials),
  }
  if (state.round.status === 'playing') return { lantern: { ...normalized, active: updated }, earned: null }

  const earned = state.round.status === 'won' && !summary.firstWin &&
    progressFor(light, state, updated) >= light.goal.target ? light : null
  if (earned) normalized.earned = [...normalized.earned, earned.id]
  return { lantern: normalized, earned }
}

export function lanternStatus(lantern, mastery, state) {
  if (!lantern.unlocked || !hasAllMedals(mastery) || state.round?.status !== 'playing') return null
  const light = goalForRound(state, lantern.earned)
  const { active } = lantern
  if (!light || active?.id !== light.id || active.movesLeft !== state.round.movesLeft) return null
  const { goal } = light
  return { light, goal, progress: progressFor(light, state, active), target: goal.target }
}

export function availableLanternLights(lantern) {
  return Object.values(LANTERN_LIGHTS).filter(light => usableLight(lantern, light.id))
}

export function selectedLanternLight(lantern) {
  return usableLight(lantern, lantern.selected) ? LANTERN_LIGHTS[lantern.selected] : null
}

export function selectLanternLight(lantern, id) {
  if (!usableLight(lantern, id) || lantern.selected === id) return lantern
  return { ...lantern, selected: id }
}
