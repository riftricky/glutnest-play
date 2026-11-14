export const MASTERY_GOALS = {
  glutfeld: {
    id: 'glutfeld',
    title: 'Glutspur',
    description: 'Gewinne mit mindestens 8 übrigen Zügen. Große Treffer bringen dich schneller ans Ziel.',
    target: 8,
  },
  mondbach: {
    id: 'mondbach',
    title: 'Bachfunkeln',
    description: 'Erzeuge mindestens 2 Spezialkristalle und gewinne. Vier gleiche Kristalle in einer Linie ergeben einen Funkenstrahl.',
    target: 2,
  },
  sternenhoehle: {
    id: 'sternenhoehle',
    title: 'Sternenlicht',
    description: 'Löse mindestens 1 Spezialkristall aus und gewinne. Bilde dazu einen Treffer, der den markierten Kristall einschließt.',
    target: 1,
  },
  gluehlichtung: {
    id: 'gluehlichtung',
    title: 'Funkenwirbel',
    description: 'Räume ab dem zweiten Zug mindestens 12 Kristalle in einem Zug ab und gewinne. Kombiniere Spezialkristalle oder löse eine Kettenreaktion aus.',
    target: 12,
  },
}

function availableGoal(state) {
  const missionId = state.round?.missionId
  return Object.hasOwn(MASTERY_GOALS, missionId) && state.progress.wins.includes(missionId)
    ? MASTERY_GOALS[missionId]
    : null
}

function boundedCount(value, max) {
  return Number.isSafeInteger(value) && value >= 0 ? Math.min(value, max) : 0
}

export function normalizeMastery(saved, state) {
  const won = state.progress.wins
  const savedEarned = Array.isArray(saved?.earned) ? saved.earned : []
  const earned = Object.keys(MASTERY_GOALS).filter(id => won.includes(id) && savedEarned.includes(id))
  const goal = availableGoal(state)
  const stored = saved?.active
  if (!goal || state.round.status !== 'playing' || stored?.missionId !== goal.id ||
      stored.movesLeft !== state.round.movesLeft || earned.includes(goal.id)) {
    return { earned, active: null }
  }
  return {
    earned,
    active: {
      missionId: goal.id,
      movesLeft: state.round.movesLeft,
      created: boundedCount(stored.created, MASTERY_GOALS.mondbach.target),
      peak: boundedCount(stored.peak, MASTERY_GOALS.gluehlichtung.target),
      firstMovePending: stored.firstMovePending !== false,
    },
  }
}

export function beginMasteryRound(mastery, state) {
  const goal = availableGoal(state)
  if (!goal || state.round.status !== 'playing' || mastery.earned.includes(goal.id)) {
    return { ...mastery, active: null }
  }
  return {
    ...mastery,
    active: { missionId: goal.id, movesLeft: state.round.movesLeft, created: 0, peak: 0, firstMovePending: true },
  }
}

function measure(goal, round, active) {
  switch (goal.id) {
    case 'glutfeld': return round.movesLeft
    case 'mondbach': return active.created
    case 'sternenhoehle': return round.activatedSpecials
    case 'gluehlichtung': return active.peak
  }
}

export function recordMasteryMove(mastery, state, summary) {
  const { active } = mastery
  const goal = availableGoal(state)
  if (!active || !goal || active.missionId !== goal.id || active.movesLeft - 1 !== state.round.movesLeft) {
    return { mastery, earned: null }
  }

  const updated = {
    ...active,
    movesLeft: state.round.movesLeft,
    created: Math.min(active.created + summary.createdSpecials, MASTERY_GOALS.mondbach.target),
    peak: active.firstMovePending
      ? 0
      : Math.max(active.peak, Math.min(summary.cleared, MASTERY_GOALS.gluehlichtung.target)),
    firstMovePending: false,
  }

  if (state.round.status === 'playing') return { mastery: { ...mastery, active: updated }, earned: null }

  const earned = state.round.status === 'won' && !summary.firstWin &&
    measure(goal, state.round, updated) >= goal.target && !mastery.earned.includes(goal.id) ? goal : null
  return {
    mastery: { earned: earned ? [...mastery.earned, earned.id] : mastery.earned, active: null },
    earned,
  }
}

export function masteryStatus(mastery, state) {
  const goal = availableGoal(state)
  if (!goal || state.round.status !== 'playing' || mastery.active?.missionId !== goal.id ||
      mastery.active.movesLeft !== state.round.movesLeft || mastery.earned.includes(goal.id)) return null
  return { goal, progress: measure(goal, state.round, mastery.active), target: goal.target }
}
