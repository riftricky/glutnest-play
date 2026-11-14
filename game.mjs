const HOUR = 60 * 60 * 1000
const CARE_DELAY = 45 * 1000
const REST_DURATION = 20 * 60 * 1000
const MIN_NEED = 18
const MAX_XP = 1_000_000
const MAX_GLOW = 1_000_000
const LEVEL_STARTS = [0, 24, 60, 110, 175, 250]
const NEED_DECAY = { fullness: 3.4, joy: 2.5, bond: 0.8, energy: 2.1 }

export const BOARD_SIZE = 7

export const CARE = {
  feed: { label: 'Füttern', stat: 'fullness', icon: '🍓', gain: 32, message: 'Die Glutbeeren sind im Nu verputzt.' },
  play: { label: 'Spielen', stat: 'joy', icon: '🪁', gain: 30, message: 'Ein kleiner Luftsprung! Das hat Spaß gemacht.' },
  cuddle: { label: 'Kuscheln', stat: 'bond', icon: '💗', gain: 25, message: 'Ein leises Schnurren. Hier fühlt sich jemand geborgen.' },
  rest: { label: 'Schlafen', stat: 'energy', icon: '🌙', gain: 34, message: 'Zusammengerollt schlummert es sich besonders gut.' },
}

export const SHOP = [
  { id: 'moss-cushion', label: 'Mooskissen', description: 'Weich genug für die kleinsten Drachenpfoten.', cost: 20, level: 1, icon: '🪴', slot: 'ground' },
  { id: 'firefly-lantern', label: 'Glühwürmchenlaterne', description: 'Ein warmes Licht für lange Höhlenabende.', cost: 32, level: 2, icon: '🏮', slot: 'light' },
  { id: 'moon-flowers', label: 'Mondblumen', description: 'Öffnen ihre Blüten, wenn der Mond aufgeht.', cost: 38, level: 2, icon: '🌸', slot: 'plants' },
  { id: 'star-mobile', label: 'Sternenmobile', description: 'Ein kleines Sternbild über dem Nest.', cost: 48, level: 3, icon: '✨', slot: 'light' },
  { id: 'cloud-blanket', label: 'Wolkendecke', description: 'Zum Einkuscheln nach dem Fliegen.', cost: 54, level: 3, icon: '☁️', slot: 'ground' },
  { id: 'comet-rug', label: 'Kometenteppich', description: 'Ein Platz für zwei kleine Drachen.', cost: 75, level: 4, icon: '☄️', slot: 'ground' },
]

export const TILES = [
  { id: 'ember', label: 'Glutstein', icon: '🔥' },
  { id: 'leaf', label: 'Blatt', icon: '🍃' },
  { id: 'moon', label: 'Mond', icon: '🌙' },
  { id: 'dew', label: 'Tautropfen', icon: '💧' },
  { id: 'star', label: 'Stern', icon: '⭐' },
  { id: 'bloom', label: 'Blüte', icon: '🌸' },
]

export const SPECIALS = {
  row: { label: 'Waagerechter Funkenstrahl', description: 'Räumt beim nächsten Treffer seine ganze Reihe ab.' },
  column: { label: 'Senkrechter Funkenstrahl', description: 'Räumt beim nächsten Treffer seine ganze Spalte ab.' },
  burst: { label: 'Sternenfunke', description: 'Räumt beim nächsten Treffer auch die acht Nachbarfelder ab.' },
}

const EGG_MISSION = 'sternenhoehle'
const AFTER_HATCH_MISSION = 'gluehlichtung'

export const MISSIONS = [
  { id: 'glutfeld', label: 'Glutfeld', description: 'Am warmen Rand des Waldes liegen die ersten Fundstücke.', moves: 12, targetScore: 130, targetTiles: {}, reward: 24 },
  { id: 'mondbach', label: 'Mondbach', description: 'Sammle Blätter und Tautropfen im silbernen Bach.', moves: 16, targetScore: 0, targetTiles: { dew: 8, leaf: 8 }, reward: 34 },
  { id: EGG_MISSION, label: 'Sternenhöhle', description: 'Tief in der Höhle leuchtet etwas im Sternenstaub.', moves: 20, targetScore: 0, targetTiles: { ember: 12, star: 10 }, reward: 50 },
  { id: AFTER_HATCH_MISSION, label: 'Glühlichtung', description: 'Knöpfchen hat die ersten Funken auf der Lichtung hinterlassen.', moves: 22, targetScore: 650, targetTiles: {}, targetSpecials: 3, reward: 64 },
]

const itemById = new Map(SHOP.map(item => [item.id, item]))
const tileIds = TILES.map(tile => tile.id)
const tileIdSet = new Set(tileIds)
const missionById = new Map(MISSIONS.map(mission => [mission.id, mission]))
const boardLength = BOARD_SIZE ** 2

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const numberIn = (value, min, max, fallback = min) => Number.isFinite(value)
  ? Math.min(max, Math.max(min, value))
  : fallback
const intIn = (value, min, max, fallback = min) => Math.trunc(numberIn(value, min, max, fallback))
const uniqueKnown = (values, known) => Array.isArray(values)
  ? [...new Set(values.filter(value => known.has(value)))]
  : []

function cleanName(value) {
  if (typeof value !== 'string') return ''
  return Array.from(value.replace(/[\p{Cc}\u202A-\u202E\u2066-\u2069]/gu, '').trim().replace(/\s+/g, ' ')).slice(0, 20).join('')
}

export function createState(now = Date.now()) {
  return {
    version: 1,
    name: 'Fünkchen',
    needs: { fullness: 72, joy: 76, bond: 68, energy: 80 },
    xp: 0,
    glow: 8,
    owned: [],
    equipped: [],
    egg: { stage: 'locked', warmth: 0 },
    progress: { wins: [], rounds: 0, bestScore: 0 },
    createdAt: now,
    updatedAt: now,
    careAt: {},
    restUntil: 0,
    round: null,
  }
}

function targetMet(mission, score, tiles, activatedSpecials) {
  return score >= mission.targetScore
    && Object.entries(mission.targetTiles).every(([id, count]) => tiles[id] >= count)
    && activatedSpecials >= (mission.targetSpecials ?? 0)
}

function normalizeSpecials(value) {
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([key, type]) => {
    const index = Number(key)
    return Number.isInteger(index) && index >= 0 && index < boardLength && String(index) === key
      && typeof type === 'string' && Object.hasOwn(SPECIALS, type)
  }))
}

function normalizeRound(value, wins, egg) {
  if (!isRecord(value)) return null
  const mission = missionById.get(value.missionId)
  if (!mission || !isMissionUnlocked({ progress: { wins }, egg }, mission.id)) return null
  if (!Array.isArray(value.board) || value.board.length !== boardLength) return null
  const board = Array.from(value.board)
  if (!board.every(id => tileIdSet.has(id)) || findRuns(board).length > 0) return null

  const specials = normalizeSpecials(value.specials)
  const activatedSpecials = intIn(value.activatedSpecials, 0, 50_000)
  const score = intIn(value.score, 0, 1_000_000)
  const movesLeft = intIn(value.movesLeft, 0, mission.moves, mission.moves)
  const tiles = Object.fromEntries(tileIds.map(id => [id, intIn(value.tiles?.[id], 0, 50_000)]))
  const goalReached = targetMet(mission, score, tiles, activatedSpecials)
  const status = goalReached ? 'won' : movesLeft === 0 ? 'lost' : 'playing'

  // A persisted terminal round is already rewarded. A malformed save must not award it twice.
  if (status === 'won' && !wins.includes(mission.id)) return null
  if (status === 'playing' && !findHint(board)) return null
  return { missionId: mission.id, board, specials, activatedSpecials, movesLeft, score, tiles, goalReached, status }
}

export function normalizeState(input, now = Date.now()) {
  const defaults = createState(now)
  if (!isRecord(input)) return defaults
  const createdAt = intIn(input.createdAt, 0, now, now)
  const updatedAt = intIn(input.updatedAt, createdAt, now, now)
  const owned = uniqueKnown(input.owned, itemById)
  const equipped = []
  const usedSlots = new Set()
  for (const id of uniqueKnown(input.equipped, itemById)) {
    const slot = itemById.get(id).slot
    if (owned.includes(id) && !usedSlots.has(slot)) {
      equipped.push(id)
      usedSlots.add(slot)
    }
  }
  const wins = []
  const savedWins = uniqueKnown(input.progress?.wins, missionById)
  const egg = { stage: 'locked', warmth: 0 }
  for (const mission of MISSIONS) {
    if (!savedWins.includes(mission.id) || !isMissionUnlocked({ progress: { wins }, egg }, mission.id)) break
    wins.push(mission.id)
    if (mission.id === EGG_MISSION) {
      egg.warmth = intIn(input.egg?.warmth, 0, 3)
      egg.stage = egg.warmth === 3 ? 'hatched' : 'egg'
    }
  }
  const careAt = {}
  for (const id of Object.keys(CARE)) {
    if (Number.isFinite(input.careAt?.[id])) careAt[id] = intIn(input.careAt[id], 0, now)
  }
  const state = {
    version: defaults.version,
    name: cleanName(input.name) || defaults.name,
    needs: Object.fromEntries(Object.keys(NEED_DECAY).map(id => [
      id, numberIn(input.needs?.[id], MIN_NEED, 100, defaults.needs[id]),
    ])),
    xp: intIn(input.xp, 0, MAX_XP),
    glow: intIn(input.glow, 0, MAX_GLOW, defaults.glow),
    owned,
    equipped,
    egg,
    progress: {
      wins,
      rounds: intIn(input.progress?.rounds, wins.length, 100_000),
      bestScore: intIn(input.progress?.bestScore, 0, 1_000_000),
    },
    createdAt,
    updatedAt,
    careAt,
    restUntil: intIn(input.restUntil, 0, now + REST_DURATION),
    round: normalizeRound(input.round, wins, egg),
  }
  return tick(state, now)
}

export function tick(state, now = Date.now()) {
  if (now <= state.updatedAt) return state
  const elapsed = Math.min((now - state.updatedAt) / HOUR, 48)
  const restTime = Math.min(elapsed, Math.max(0, (state.restUntil - state.updatedAt) / HOUR))
  const needs = Object.fromEntries(Object.entries(NEED_DECAY).map(([id, rate]) => {
    const hours = id === 'energy' ? elapsed - restTime : elapsed
    return [id, Math.max(MIN_NEED, state.needs[id] - rate * hours)]
  }))
  return { ...state, needs, updatedAt: now }
}

export function getLevel(state) {
  const index = LEVEL_STARTS.filter(threshold => state.xp >= threshold).length - 1
  const base = LEVEL_STARTS[index]
  const next = LEVEL_STARTS[index + 1]
  if (next === undefined) {
    return { level: LEVEL_STARTS.length, current: 1, target: 1, percent: 100, maxed: true }
  }
  const current = state.xp - base
  const target = next - base
  return { level: index + 1, current, target, percent: Math.round(current / target * 100), maxed: false }
}

const failure = (state, message) => ({ state, ok: false, message })
const success = (state, message) => ({ state, ok: true, message })
const addXp = (state, amount) => Math.min(MAX_XP, state.xp + amount)
const addGlow = (state, amount) => Math.min(MAX_GLOW, state.glow + amount)

export function care(state, action, now = Date.now()) {
  const definition = Object.hasOwn(CARE, action) ? CARE[action] : undefined
  if (!definition) return failure(state, 'Diese Aktion gibt es im Nest nicht.')
  const current = tick(state, now)
  const last = current.careAt[action]
  if (last !== undefined && now - last < CARE_DELAY) {
    return failure(current, 'Gib dem kleinen Drachen einen Moment.')
  }
  const gain = Math.min(definition.gain, 100 - current.needs[definition.stat])
  if (gain < 1 && action !== 'rest') {
    return failure(current, 'Gerade ist alles bestens. Versuch es später wieder.')
  }
  if (action === 'rest' && current.restUntil > now) {
    return failure(current, 'Dein Drache schläft schon ganz gemütlich.')
  }
  const needs = { ...current.needs, [definition.stat]: current.needs[definition.stat] + gain }
  return success({
    ...current,
    needs,
    xp: addXp(current, gain >= 3 ? 6 : 0),
    restUntil: action === 'rest' ? now + REST_DURATION : 0,
    careAt: { ...current.careAt, [action]: now },
  }, definition.message)
}

export function renameDragon(state, name) {
  const cleaned = cleanName(name)
  if (!cleaned) return failure(state, 'Gib deinem Drachen einen Namen.')
  return success({ ...state, name: cleaned }, `Hallo, ${cleaned}!`)
}

export function getMood(state, now = Date.now()) {
  const name = state.name
  if (state.restUntil > now) return { key: 'resting', label: 'Schlummert', message: `${name} träumt von warmen Glutbeeren.` }
  const lowest = Object.keys(state.needs).reduce((first, key) => state.needs[first] <= state.needs[key] ? first : key)
  if (state.needs[lowest] < 42) {
    return {
      fullness: { key: 'hungry', label: 'Hungrig', message: `${name} schnuppert nach Glutbeeren.` },
      joy: { key: 'bored', label: 'Verspielt', message: `${name} wartet auf ein Spiel mit dir.` },
      bond: { key: 'lonely', label: 'Kuschelbereit', message: `${name} rückt ein bisschen näher.` },
      energy: { key: 'sleepy', label: 'Müde', message: `${name} gähnt und sucht einen weichen Platz.` },
    }[lowest]
  }
  if (state.egg.stage === 'hatched') return { key: 'happy', label: 'Glücklich', message: `${name} passt auf den kleinen Neuankömmling auf.` }
  if (state.needs[lowest] >= 78) return { key: 'happy', label: 'Glücklich', message: `${name} strahlt bis in die Schwanzspitze.` }
  return { key: 'cozy', label: 'Zufrieden', message: `${name} macht es sich im Nest gemütlich.` }
}

function equip(state, item) {
  return [...state.equipped.filter(id => itemById.get(id)?.slot !== item.slot), item.id]
}

export function buyItem(state, id) {
  const item = itemById.get(id)
  if (!item) return failure(state, 'Dieses Stück ist nicht im Laden.')
  if (state.owned.includes(id)) return failure(state, 'Das gehört dir schon.')
  if (getLevel(state).level < item.level) return failure(state, `Ab Stufe ${item.level} verfügbar.`)
  if (state.glow < item.cost) return failure(state, 'Dir fehlen noch Glutsterne.')
  return success({
    ...state,
    glow: state.glow - item.cost,
    owned: [...state.owned, id],
    equipped: equip(state, item),
  }, `${item.label} ist jetzt in deinem Nest.`)
}

export function toggleItem(state, id) {
  const item = itemById.get(id)
  if (!item || !state.owned.includes(id)) return failure(state, 'Das gehört dir noch nicht.')
  const active = state.equipped.includes(id)
  const equipped = active ? state.equipped.filter(other => other !== id) : equip(state, item)
  return success({ ...state, equipped }, active ? `${item.label} verstaut.` : `${item.label} aufgestellt.`)
}

export function careForEgg(state, now = Date.now()) {
  if (state.egg.stage === 'locked') return failure(state, 'Das Ei wartet in der Sternenhöhle.')
  if (state.egg.stage === 'hatched') return failure(state, 'Der kleine Drache ist bereits geschlüpft.')
  const warmth = state.egg.warmth + 1
  const stage = warmth === 3 ? 'hatched' : 'egg'
  const current = tick(state, now)
  const messages = [
    'Das Ei fühlt sich unter deinen Händen warm an.',
    'Psst. Unter der Schale bewegt sich etwas.',
    'Knack! Ein kleiner Drache schaut aus dem Ei.',
  ]
  return success({ ...current, xp: addXp(current, 8), egg: { stage, warmth } }, messages[warmth - 1])
}

export function isMissionUnlocked(state, id) {
  if (id === AFTER_HATCH_MISSION) {
    return state.egg?.stage === 'hatched' && state.progress.wins.includes(EGG_MISSION)
  }
  const index = MISSIONS.findIndex(mission => mission.id === id)
  return index === 0 || (index > 0 && state.progress.wins.includes(MISSIONS[index - 1].id))
}

function adjacent(from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return false
  if (from < 0 || to < 0 || from >= boardLength || to >= boardLength) return false
  const dx = Math.abs(from % BOARD_SIZE - to % BOARD_SIZE)
  const dy = Math.abs(Math.floor(from / BOARD_SIZE) - Math.floor(to / BOARD_SIZE))
  return dx + dy === 1
}

function findRuns(board) {
  const runs = []
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (const [type, start, step] of [['row', i * BOARD_SIZE, 1], ['column', i, BOARD_SIZE]]) {
      let run = [start]
      for (let offset = 1; offset < BOARD_SIZE; offset++) {
        const index = start + offset * step
        if (board[index] === board[run[0]]) {
          run.push(index)
        } else {
          if (run.length >= 3) runs.push({ type, indices: run })
          run = [index]
        }
      }
      if (run.length >= 3) runs.push({ type, indices: run })
    }
  }
  return runs
}

function swap(board, from, to) {
  const swapped = board.slice()
  swapped[from] = board[to]
  swapped[to] = board[from]
  return swapped
}

function swapSpecials(specials, from, to) {
  if (!specials[from] && !specials[to]) return specials
  const swapped = { ...specials }
  delete swapped[from]
  delete swapped[to]
  if (specials[from]) swapped[to] = specials[from]
  if (specials[to]) swapped[from] = specials[to]
  return swapped
}

function specialTargets(index, type) {
  const row = Math.floor(index / BOARD_SIZE)
  const col = index % BOARD_SIZE
  if (type === 'row') return Array.from({ length: BOARD_SIZE }, (_, i) => row * BOARD_SIZE + i)
  if (type === 'column') return Array.from({ length: BOARD_SIZE }, (_, i) => i * BOARD_SIZE + col)
  const targets = []
  for (let y = Math.max(0, row - 1); y <= Math.min(BOARD_SIZE - 1, row + 1); y++) {
    for (let x = Math.max(0, col - 1); x <= Math.min(BOARD_SIZE - 1, col + 1); x++) {
      targets.push(y * BOARD_SIZE + x)
    }
  }
  return targets
}

function resolveMatches(runs, specials, preferred = []) {
  const hits = new Set(runs.flatMap(run => run.indices))
  const activated = []
  // Set iteration includes fields added by a blast, so each special fires at most once.
  for (const index of hits) {
    if (!specials[index]) continue
    activated.push(index)
    for (const target of specialTargets(index, specials[index])) hits.add(target)
  }

  const groups = []
  for (const run of runs) {
    const overlaps = groups.filter(group => run.indices.some(index => group.indices.has(index)))
    const indices = new Set(run.indices)
    for (const group of overlaps) {
      for (const index of group.indices) indices.add(index)
      groups.splice(groups.indexOf(group), 1)
    }
    groups.push({ indices, runs: [run, ...overlaps.flatMap(group => group.runs)] })
  }

  const created = {}
  for (const group of groups) {
    const indices = [...group.indices]
    if (indices.some(index => specials[index])) continue
    const hasCross = group.runs.length > 1
    if (!hasCross && indices.length < 4) continue
    const shared = indices.find(index => group.runs.every(run => run.indices.includes(index)))
    const center = shared ?? indices[Math.floor(indices.length / 2)]
    const index = preferred.find(candidate => group.indices.has(candidate)) ?? center
    created[index] = hasCross || indices.length >= 5 ? 'burst' : group.runs[0].type
    hits.delete(index)
  }
  return { hits: [...hits].sort((a, b) => a - b), activated, created }
}

function findHint(board, { neededTiles, specials = {}, neededSpecials = 0 } = {}) {
  let best = null
  let bestValue = -1
  for (let from = 0; from < boardLength; from++) {
    const candidates = []
    if (from % BOARD_SIZE < BOARD_SIZE - 1) candidates.push(from + 1)
    if (from < boardLength - BOARD_SIZE) candidates.push(from + BOARD_SIZE)
    for (const to of candidates) {
      if (board[from] === board[to]) continue
      const swapped = swap(board, from, to)
      const runs = findRuns(swapped)
      if (runs.length === 0) continue
      if (!neededTiles) return [from, to]
      const impact = resolveMatches(runs, swapSpecials(specials, from, to), [to, from])
      const goals = { ...neededTiles }
      let value = impact.hits.length + Object.keys(impact.created).length * (neededSpecials > 0 ? 8 : 2)
      value += Math.min(impact.activated.length, Math.max(0, neededSpecials)) * boardLength
      for (const index of impact.hits) {
        const id = swapped[index]
        if (goals[id] > 0) {
          goals[id]--
          value += boardLength
        }
      }
      if (value > bestValue) {
        best = [from, to]
        bestValue = value
      }
    }
  }
  return best
}

export function getHint(round) {
  if (round?.status !== 'playing') return null
  const mission = missionById.get(round.missionId)
  if (!mission) return null
  const neededTiles = Object.fromEntries(Object.entries(mission.targetTiles).map(([id, count]) => [id, count - round.tiles[id]]))
  return findHint(round.board, {
    neededTiles,
    specials: round.specials,
    neededSpecials: (mission.targetSpecials ?? 0) - (round.activatedSpecials ?? 0),
  })
}

function pick(values, rng) {
  const index = intIn(rng() * values.length, 0, values.length - 1)
  return values[index]
}

function fallbackBoard() {
  const board = Array.from({ length: boardLength }, (_, index) =>
    tileIds[(index % BOARD_SIZE + 2 * Math.floor(index / BOARD_SIZE)) % tileIds.length])
  board[2] = tileIds[0]
  board[BOARD_SIZE + 1] = tileIds[0]
  return board
}

function makeBoard(rng) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const board = []
    for (let index = 0; index < boardLength; index++) {
      const excludes = []
      if (index % BOARD_SIZE >= 2 && board[index - 1] === board[index - 2]) {
        excludes.push(board[index - 1])
      }
      if (index >= 2 * BOARD_SIZE && board[index - BOARD_SIZE] === board[index - 2 * BOARD_SIZE]) {
        excludes.push(board[index - BOARD_SIZE])
      }
      board.push(pick(tileIds.filter(tile => !excludes.includes(tile)), rng))
    }
    if (findHint(board)) return board
  }
  return fallbackBoard()
}

function openingBoard(missionId, rng) {
  if (missionId !== AFTER_HATCH_MISSION) return { board: makeBoard(rng), specials: {} }
  const board = fallbackBoard()
  // The first row gives players an immediate, visible opportunity to chain two specials.
  const extras = tileIds.slice(1)
  const replacement = pick(extras, rng)
  if (replacement !== tileIds[1]) {
    for (let index = 0; index < boardLength; index++) {
      if (board[index] === tileIds[1]) board[index] = replacement
      else if (board[index] === replacement) board[index] = tileIds[1]
    }
  }
  return { board, specials: { 0: 'row', 5: 'burst' } }
}

function dropTiles(board, specials, hits, refill, rng) {
  const result = board.slice()
  const shifted = {}
  const cleared = new Set(hits)
  for (let col = 0; col < BOARD_SIZE; col++) {
    let destination = boardLength - BOARD_SIZE + col
    for (let source = destination; source >= 0; source -= BOARD_SIZE) {
      if (cleared.has(source)) continue
      result[destination] = board[source]
      if (specials[source]) shifted[destination] = specials[source]
      destination -= BOARD_SIZE
    }
    for (; destination >= 0; destination -= BOARD_SIZE) {
      result[destination] = pick(refill, rng)
    }
  }
  return { board: result, specials: shifted }
}

export function startRound(state, missionId, rng = Math.random) {
  const mission = missionById.get(missionId)
  if (!mission) return failure(state, 'Dieser Ort liegt nicht auf der Karte.')
  if (!isMissionUnlocked(state, missionId)) {
    return failure(state, missionId === AFTER_HATCH_MISSION
      ? 'Die Lichtung öffnet sich, sobald Knöpfchen geschlüpft ist.'
      : 'Schließe zuerst die vorherige Mission ab.')
  }
  const round = {
    missionId,
    ...openingBoard(missionId, rng),
    activatedSpecials: 0,
    movesLeft: mission.moves,
    score: 0,
    tiles: Object.fromEntries(tileIds.map(id => [id, 0])),
    goalReached: false,
    status: 'playing',
  }
  return success({ ...state, round }, `${mission.label} wartet auf dich.`)
}

export function playMove(state, from, to, rng = Math.random) {
  const round = state.round
  if (round?.status !== 'playing') return failure(state, 'Starte zuerst eine neue Runde.')
  if (!adjacent(from, to)) return failure(state, 'Wähle zwei benachbarte Steine.')
  const mission = missionById.get(round.missionId)
  let board = swap(round.board, from, to)
  let specials = swapSpecials(round.specials ?? {}, from, to)
  let runs = findRuns(board)
  if (runs.length === 0) return failure(state, 'Bilde eine Reihe mit mindestens drei gleichen Steinen.')

  const frames = []
  const tiles = { ...round.tiles }
  let score = 0
  let cleared = 0
  let createdSpecials = 0
  let activatedSpecials = 0
  for (let chain = 1; runs.length > 0 && chain <= 10; chain++) {
    const { hits, activated, created } = resolveMatches(runs, specials, chain === 1 ? [to, from] : [])
    for (const index of hits) tiles[board[index]]++
    const remaining = Object.keys(mission.targetTiles).filter(id => tiles[id] < mission.targetTiles[id])
    const after = dropTiles(board, { ...specials, ...created }, hits, [...tileIds, ...remaining], rng)
    const points = hits.length * 10 * chain
    score += points
    cleared += hits.length
    createdSpecials += Object.keys(created).length
    activatedSpecials += activated.length
    frames.push({
      before: board, beforeSpecials: specials, cleared: hits, after: after.board,
      afterSpecials: after.specials, activated, created, chain, score: points,
    })
    board = after.board
    specials = after.specials
    runs = findRuns(board)
  }

  const total = round.score + score
  const movesLeft = round.movesLeft - 1
  const totalActivated = (round.activatedSpecials ?? 0) + activatedSpecials
  const goalReached = targetMet(mission, total, tiles, totalActivated)
  const status = goalReached ? 'won' : movesLeft === 0 ? 'lost' : 'playing'
  const reshuffled = runs.length > 0 || (status === 'playing' && !findHint(board))
  if (reshuffled) {
    board = makeBoard(rng)
    const kinds = Object.values(specials)
    specials = Object.fromEntries(kinds.map((type, index) => [index, type]))
  }

  const ended = status !== 'playing'
  const firstWin = status === 'won' && !state.progress.wins.includes(mission.id)
  const eggFound = firstWin && mission.id === EGG_MISSION && state.egg.stage === 'locked'
  const glow = status === 'won' ? (firstWin ? mission.reward : Math.ceil(mission.reward / 3)) : status === 'lost' ? 2 : 0
  const xp = status === 'won' ? (firstWin ? 18 : 9) : status === 'lost' ? 4 : 0
  const summary = { score, cleared, chains: frames.length, createdSpecials, activatedSpecials, reshuffled, glow, xp, firstWin, eggFound }
  const next = {
    ...state,
    glow: addGlow(state, glow),
    xp: addXp(state, xp),
    egg: eggFound ? { stage: 'egg', warmth: 0 } : state.egg,
    progress: {
      wins: firstWin ? [...state.progress.wins, mission.id] : state.progress.wins,
      rounds: state.progress.rounds + Number(ended),
      bestScore: Math.max(state.progress.bestScore, total),
    },
    round: { ...round, board, specials, activatedSpecials: totalActivated, score: total, tiles, movesLeft, goalReached, status },
  }
  let message = `+${score} Punkte!`
  if (reshuffled && !ended) message += ' Die Steine wurden neu gemischt.'
  if (status === 'lost') message = 'Die Runde ist zu Ende. Zwei Glutsterne nimmst du trotzdem mit.'
  if (status === 'won') message = `Geschafft! Du erhältst ${glow} Glutsterne.`
  if (eggFound) message += ' Zwischen den Sternen liegt ein warmes Ei.'
  return { ...success(next, message), frames, summary }
}
