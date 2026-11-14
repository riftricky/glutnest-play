import {
  BOARD_SIZE, CARE, MISSIONS, SHOP, SPECIALS, TILES, buyItem, care, careForEgg,
  getHint, getLevel, getMood, isMissionUnlocked, normalizeState,
  playMove, renameDragon, startRound, tick, toggleItem,
} from './game.mjs'
import { GUIDE_KEY, GUIDE_STEPS, beginGuide, guideEvent, normalizeGuide } from './guide.mjs'
import { STORIES, chooseStory, normalizeStories, recordStoryEvent, storyStatus } from './stories.mjs?v=lebendiges-nest'
import { FIRST_REWARD_ID, firstRewardAction, rewardItemAction } from './reward.mjs'
import { companionReaction } from './companion.mjs'
import { FIND_ITEMS, displayedFind, normalizeFinds, recordGardenFind, setDisplayedFind } from './finds.mjs'
import { renderPostcard, canSharePostcard, sharePostcard } from './postcard.mjs'
import { MASTERY_GOALS, normalizeMastery, beginMasteryRound, recordMasteryMove, masteryStatus } from './mastery.mjs'

const $ = (id) => document.getElementById(id)
const key = 'glutnest.save.v2'
const legacyKey = 'glutnest.save.v1'
const settingsKey = 'glutnest.settings.v1'
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
const paths = {
  flame:'<path d="M12 22c4.1 0 7-2.9 7-6.5 0-3.4-2.1-5.7-4.2-7.2.1 2-1 2.9-1.6 3.2C14 7 11 3.6 9.3 2.4c.3 4.8-4.3 7.9-4.3 12.9C5 19.5 8.2 22 12 22Z"/><path d="M12 22c-2 0-3.4-1.4-3.4-3.1 0-1.8 1.3-2.8 2.3-3.7.2 1 .8 1.5 1.1 1.6.9-.6 1.2-1.6 1.1-2.5 1.7 1.3 2.3 2.8 2.3 4.3 0 1.9-1.6 3.4-3.4 3.4Z"/>',
  book:'<path d="M12 6c-2-2-6-3-10-2v15c4-1 8 0 10 2 2-2 6-3 10-2V4c-4-1-8 0-10 2Zm0 0v15M5 8c2 0 3 .3 4 1m6 0c1-.7 2-1 4-1"/>',
  ray:'<path d="M3 12h18M7 8l-4 4 4 4m10-8 4 4-4 4"/>',
  home:'<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  gem:'<path d="m3 9 4-5h10l4 5-9 12zM3 9h18M7 4l2 5 3 12 3-12 2-5"/>',
  camera:'<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
  bag:'<path d="M5 8h14l2 12H3zM8 8V6a4 4 0 0 1 8 0v2"/><path d="M9 13v1m6-1v1"/>',
  sparkles:'<path d="M10 3 12 9l6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM19 3v4m-2-2h4"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="m10 3-.7 2.4-2 .9-2.2-.9-2.1 3.7 1.8 1.6v2.6L3 15l2.1 3.6 2.2-.8 2 .8.7 2.4h4l.7-2.4 2-.8 2.2.8L21 15l-1.8-1.7v-2.6L21 9.1l-2.1-3.7-2.2.9-2-.9L14 3z"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  egg:'<path d="M12 2c4.1 0 8 6.9 8 12.4A7.7 7.7 0 0 1 12 22a7.7 7.7 0 0 1-8-7.6C4 8.9 7.9 2 12 2Z"/><path d="m5.5 12 4 2.5 2.5-3 2.7 2.9 3.8-2.1"/>',
  berry:'<path d="M12 6c-1-2-3.1-3-5-3 .1 1.9 1.4 3.5 3 4m2-1c1-2 3.1-3 5-3-.1 1.9-1.4 3.5-3 4m-2 15c-2 0-8-4.8-8-9.8 0-3.7 3.8-5.7 8-4 4.2-1.7 8 .3 8 4 0 5-6 9.8-8 9.8Z"/><path d="M9 12v1m6-1v1m-3 3v1"/>',
  leaf:'<path d="M20.5 3.5c-2.7 1.5-9.6-.5-14 3.9a7 7 0 0 0 9.9 9.9c4.4-4.4 2.4-11.3 4.1-13.8ZM4 20 15 9"/>',
  heart:'<path d="M20.7 4.9a5.2 5.2 0 0 0-7.4 0L12 6.2l-1.3-1.3a5.2 5.2 0 1 0-7.4 7.4l1.3 1.3L12 21l7.4-7.4 1.3-1.3a5.2 5.2 0 0 0 0-7.4Z"/>',
  moon:'<path d="M20.9 13.3A9 9 0 1 1 10.7 3.1a7 7 0 0 0 10.2 10.2Z"/><path d="M17 2v4m-2-2h4"/>',
  dew:'<path d="M12 2c2.3 4.5 7 8.6 7 12.3a7 7 0 0 1-14 0C5 10.6 9.7 6.5 12 2Z"/><path d="M8.2 14.8c.2 1.5 1.3 2.7 2.8 3.2"/>',
  star:'<path d="m12 2 3 6.4 7 .9-5.1 5 1.1 7-6-3.3-6 3.3 1.1-7L2 9.3l7-.9z"/>',
  bloom:'<path d="M12 9c-4-7 4-8 4-2 6-3 7 5 1 6 4 5-2 9-5 4-3 5-9 1-5-4-6-1-5-9 1-6 0-6 8-5 4 2Z"/><circle cx="12" cy="12" r="2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  x:'<path d="m5 5 14 14M19 5 5 19"/>',
  cushion:'<path d="M4 8c5-3 11-3 16 0l2 8c-5 4-15 4-20 0z"/><path d="M6 13c4 1 8 1 12 0m-8-3 2 1 2-1"/>',
  lantern:'<path d="M8 5h8l2 4v10H6V9zM9 5V3h6v2M6 9h12m-12 8h12m-6-6c-1 1-2 2-2 3a2 2 0 0 0 4 0c0-1-1-2-2-3z"/>',
  cloud:'<path d="M7 19h11a4 4 0 1 0-.5-8 6 6 0 0 0-11.6 1A3.5 3.5 0 0 0 7 19Z"/>',
  comet:'<circle cx="16" cy="8" r="5"/><path d="M13 12 4 21m5-11-5 5m11-1-5 6"/>',
}
const icon = (name) => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] ?? paths.sparkles) + '</svg>'
const fillIcons = (root = document) => root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon) })
const tileIcon = { ember:'flame', leaf:'leaf', moon:'moon', dew:'dew', star:'star', bloom:'bloom' }
const shopIcon = { 'moss-cushion':'cushion', 'firefly-lantern':'lantern', 'moon-flowers':'bloom', 'star-mobile':'star', 'cloud-blanket':'cloud', 'comet-rug':'comet' }
const statMeta = {
  fullness: ['Sattheit','berry'], joy: ['Freude','leaf'], bond: ['Geborgenheit','heart'], energy: ['Energie','moon'],
}
const actionIcon = { feed:'berry', play:'leaf', cuddle:'heart', rest:'moon' }
const actionEmoji = { feed:'🍓', play:'✧', cuddle:'♥', rest:'z z z', egg:'✦' }
const tileMap = Object.fromEntries(TILES.map(tile => [tile.id, tile]))
const missionMap = Object.fromEntries(MISSIONS.map(mission => [mission.id, mission]))
const pages = ['nest', 'garten', 'nestbuch', 'sammlung']
const storyMap = new Map(STORIES.map(story => [story.id, story]))
let stories, keepsake, finds, mastery, openedStory, storyOpener
let page, state, settings, storageOK = true
let selection = null, focused = 0, hinted = [], playingAnimation = false, pointer = null
let reactionTimer, toastTimer, tabRefreshTimer, findFeedbackTimer
const tiles = []
let confirmResolve = null

function load(keyName) {
  try { return JSON.parse(localStorage.getItem(keyName)) }
  catch { return null }
}
function store(keyName, value) {
  try { localStorage.setItem(keyName, JSON.stringify(value)); return true }
  catch { return false }
}
const saved = load(key) ?? load(legacyKey)
let guide = normalizeGuide(load(GUIDE_KEY), { hasSave:!!saved })
store(GUIDE_KEY, guide)
readProgress(saved)
settings = { quiet: load(settingsKey)?.quiet === true }
function readProgress(savedState) {
  state = normalizeState(savedState)
  stories = normalizeStories(savedState?.stories, state)
  finds = normalizeFinds(savedState?.finds, state)
  mastery = normalizeMastery(savedState?.mastery, state)
  keepsake = storyMap.has(savedState?.keepsake) && storyStatus(stories, savedState.keepsake) === 'complete'
    ? savedState.keepsake
    : null
}
function saveProgress() { return { ...state, stories, keepsake, finds, mastery } }
function persist() {
  storageOK = store(key, saveProgress())
  $('save-note').textContent = storageOK
    ? 'Dein Spielstand bleibt in diesem Browser. Über eine Sicherung kannst du ihn auf ein anderes Gerät mitnehmen.'
    : 'Dieser Browser speichert den Spielstand gerade nicht. Lade eine Sicherung, bevor du das Fenster schließt.'
}
function tell(message) {
  if (!message) return
  clearTimeout(toastTimer)
  $('toast').textContent = message
  $('toast').classList.add('show')
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3300)
}
function wallet() {
  $('wallet').textContent = state.glow.toLocaleString('de-DE')
  $('wallet').parentNode.setAttribute('aria-label', state.glow + ' Glutsterne')
}
function setProgress(bar, value, fill = bar.firstElementChild) {
  bar.setAttribute('aria-valuenow', value)
  fill.style.width = value + '%'
}

function initializeCare() {
  $('stats').innerHTML = Object.entries(statMeta).map(([id, [label, symbol]]) =>
    '<div class="stat" data-stat="' + id + '"><span class="stat-icon">' + icon(symbol) + '</span><div><div class="stat-meta"><span>' + label + '</span><strong id="stat-value-' + id + '"></strong></div><div id="stat-' + id + '" class="stat-track" role="progressbar" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="100"><span></span></div></div></div>').join('')
  for (const [id, item] of Object.entries(CARE)) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'care-action'
    button.id = 'care-' + id
    button.innerHTML = icon(actionIcon[id]) + '<span>' + item.label + '</span>'
    button.addEventListener('click', () => doCare(id))
    $('care-actions').append(button)
  }
}
const storyArt = {
  nest: new URL('./assets/nestbuch.webp', import.meta.url).href,
  garden: new URL('./assets/nest.webp', import.meta.url).href,
  baby: new URL('./assets/dragon-awake.webp', import.meta.url).href,
}
const storyDecor = { mooskissen:'moss-cushion', laternenlicht:'firefly-lantern', mondblumennacht:'moon-flowers' }

function countStories(status) {
  return STORIES.filter(story => storyStatus(stories, story.id) === status).length
}
function renderBookLink() {
  const ready = countStories('ready')
  const label = ready === 1 ? 'Eine neue Geschichte ist da' : ready + ' neue Geschichten'
  $('nav-story-count').hidden = ready === 0
  $('nav-story-count').textContent = ready
  $('nav-story-count').parentElement.setAttribute('aria-label', ready ? 'Nestbuch, ' + label : 'Nestbuch')
  $('nest-book-title').textContent = ready ? label : 'Das Nestbuch'
  $('nest-book-detail').textContent = ready ? 'Blättere um und entscheide, wie es weitergeht.' : countStories('complete') + ' von ' + STORIES.length + ' Geschichten gelesen'
}
function storyEvent(event) {
  const before = countStories('ready')
  stories = recordStoryEvent(stories, state, event)
  renderBookLink()
  return countStories('ready') > before
}
function storyMessage(message, discovered) {
  return discovered ? message + ' Im Nestbuch wartet eine neue Geschichte.' : message
}
function element(tag, text, className) {
  const node = document.createElement(tag)
  if (text) node.textContent = text
  if (className) node.className = className
  return node
}
function storyButton(story, label, className) {
  const button = element('button', label, className)
  button.type = 'button'
  button.dataset.story = story.id
  button.setAttribute('aria-label', label + ': ' + story.title)
  return button
}
function renderBook() {
  renderBookLink()
  $('book-progress').textContent = countStories('complete') + ' von ' + STORIES.length + ' Geschichten gelesen'
  const ready = STORIES.find(story => storyStatus(stories, story.id) === 'ready')
  const locked = STORIES.find(story => storyStatus(stories, story.id) === 'locked')
  const feature = $('book-feature')
  feature.replaceChildren()
  const featureCopy = element('div')
  if (ready || locked) {
    const story = ready || locked
    featureCopy.append(element('p', ready ? 'Jetzt im Nestbuch' : 'Nächste Entdeckung', 'eyebrow'), element('h2', story.title), element('p', story.teaser))
    if (ready) {
      feature.append(featureCopy, storyButton(ready, 'Geschichte lesen', 'primary'))
    } else {
      const decor = storyDecor[story.id]
      const destination = decor && !state.owned.includes(decor) ? 'sammlung' : story.art === 'garden' ? 'garten' : 'nest'
      const destinations = { sammlung:'Zur Sammlung', garten:'Zum Kristallgarten', nest:'Zum Nest' }
      const link = element('a', destinations[destination], 'small-button')
      link.href = '#' + destination
      feature.append(featureCopy, link)
    }
  } else {
    featureCopy.append(element('h2', 'Das Nestbuch ist komplett.'), element('p', 'Deine Geschichten und Andenken kannst du jederzeit wieder ansehen.'))
    feature.append(featureCopy)
  }

  const cards = STORIES.map(story => {
    const status = storyStatus(stories, story.id)
    const card = element('article', '', 'panel story-card')
    card.dataset.status = status
    const marker = element('span', status === 'complete' ? story.reward.symbol : '', 'story-marker')
    if (status !== 'complete') marker.innerHTML = icon(status === 'locked' ? 'lock' : 'book')
    marker.setAttribute('aria-hidden', 'true')
    const copy = element('div')
    copy.append(element('h2', story.title), element('p', status === 'complete' ? story.reward.title : story.teaser))
    if (status === 'locked') copy.append(element('span', 'Noch nicht entdeckt', 'sr-only'))
    card.append(marker, copy)
    if (status !== 'locked') {
      card.append(storyButton(story, status === 'ready' ? 'Lesen' : 'Nachlesen', 'small-button'))
    }
    return card
  })
  $('story-list').replaceChildren(...cards)
}
function paintStory() {
  const story = openedStory
  if (!story) return
  $('story-title').textContent = story.title
  $('story-body').textContent = story.body.replaceAll('{name}', state.name)
  $('story-dialog-art').dataset.art = story.art
  $('story-dialog-art').style.backgroundImage = 'url("' + storyArt[story.art] + '")'
  const chosen = story.choices.find(choice => choice.id === stories.completed[story.id])
  $('story-ending').hidden = !chosen
  $('story-ending').textContent = chosen ? chosen.ending.replaceAll('{name}', state.name) : ''
  $('story-keepsake').hidden = !chosen
  $('story-keepsake').textContent = chosen ? story.reward.symbol + ' Andenken: ' + story.reward.title : ''
  $('story-display').hidden = !chosen
  $('story-display').textContent = keepsake === story.id ? 'Aus dem Nest nehmen' : 'Im Nest zeigen'
  $('story-display').setAttribute('aria-pressed', String(keepsake === story.id))
  const choices = chosen ? [] : story.choices.map(choice => {
    const button = element('button', choice.label, 'small-button')
    button.type = 'button'
    button.dataset.choice = choice.id
    return button
  })
  $('story-choices').replaceChildren(...choices)
}
function openStory(story, opener) {
  if (storyStatus(stories, story.id) === 'locked') return
  storyOpener = opener
  openedStory = story
  paintStory()
  $('story-dialog').showModal()
  $('story-title').focus()
}
$('view-nestbuch').addEventListener('click', event => {
  const button = event.target.closest('[data-story]')
  const story = button && storyMap.get(button.dataset.story)
  if (story) openStory(story, button)
})
$('story-choices').addEventListener('click', event => {
  const button = event.target.closest('[data-choice]')
  if (!button || !openedStory) return
  const result = chooseStory(stories, openedStory.id, button.dataset.choice)
  if (!result.ok) return
  stories = result.stories
  persist()
  paintStory()
  $('story-ending').focus()
})
$('story-display').addEventListener('click', () => {
  if (!openedStory || storyStatus(stories, openedStory.id) !== 'complete') return
  keepsake = keepsake === openedStory.id ? null : openedStory.id
  persist()
  paintStory()
})
$('close-story').addEventListener('click', () => $('story-dialog').close())
$('story-dialog').addEventListener('close', () => {
  const id = openedStory?.id
  openedStory = null
  if (page !== 'nestbuch') return
  const oldButton = storyOpener
  renderBook()
  if (oldButton?.isConnected) oldButton.focus()
  else if (id) $('story-list').querySelector('[data-story="' + id + '"]')?.focus()
})

function setGuide(event) {
  const next = guideEvent(guide, event)
  if (next !== guide) {
    guide = next
    store(GUIDE_KEY, guide)
  }
}
let guidePrimary, guideSecondary, guideTarget, guideViewport, guideMatchPoints
const guideRoute = (id) => () => { location.hash = id }
const guideContinue = () => {
  setGuide({ type:'continue' })
  renderGuide(true)
  if (guide.status === 'finished') $('view-' + page).querySelector('h1').focus({ preventScroll:true })
}

function renderGuide(focus = false) {
  const card = $('guide-card')
  if (guideTarget) {
    guideTarget.classList.remove('guide-target')
    const described = (guideTarget.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== 'guide-note')
    if (described.length) guideTarget.setAttribute('aria-describedby', described.join(' '))
    else guideTarget.removeAttribute('aria-describedby')
    guideTarget = null
  }
  card.hidden = guide.status !== 'active'
  if (card.hidden) return

  if (guide.step === 'garden' && page === 'garten' && state.round?.status === 'playing') {
    setGuide({ type:'garden' })
  }
  if (guide.step === 'pair' && page === 'garten' && state.round?.status === 'playing') {
    const nextPair = getHint(state.round)
    if (!guide.pair || !nextPair || !guide.pair.every(index => nextPair.includes(index))) {
      setGuide({ type:'pair-set', pair:nextPair })
    }
    setGuide({ type:'tile-selected', index:selection })
  }
  const name = state.name
  const stepNumber = GUIDE_STEPS.indexOf(guide.step) + 1
  const current = state.round
  const hasRound = current?.status === 'playing'
  let title, note, action, other, target
  let place = page === 'nest' ? $('guide-nest-slot') : page === 'garten' ? $('guide-garden-slot') : $('view-' + page)
  if (guide.step === 'feed') {
    title = 'Hi, ich bin ' + name + '!'
    note = 'Ich wohne jetzt in diesem Nest. Tippe auf „Füttern“, um mir eine Glutbeere zu geben. Am Balken „Sattheit“ siehst du, wie hungrig ich bin.'
    if (page === 'nest') {
      target = $('care-feed')
      const ready = Date.now() - (state.careAt.feed ?? 0) >= 45000 && state.needs.fullness < 99
      action = ready ? ['Füttern', () => doCare('feed')] : ['Weiter', () => {
        setGuide({ type:'fed' })
        renderGuide(true)
      }]
      if (!ready) note = 'So sieht mein Nest aus. Gerade bin ich satt. Am Balken „Sattheit“ siehst du, wann ich wieder eine Glutbeere brauche.'
    } else {
      action = ['Zum Nest', guideRoute('nest')]
    }
  } else if (guide.step === 'garden') {
    title = 'Komm mit in den Kristallgarten'
    note = 'Denk auch ans Spielen, Kuscheln und Schlafen. Tippe auf „Zum Kristallgarten“. Dort finden wir Glutsterne fürs Nest.'
    if (page === 'garten') {
      title = 'Öffne das Glutfeld'
      note = 'Tippe auf „Glutfeld spielen“. Für jeden Zug kannst du dir Zeit lassen.'
      target = $('first-round').closest('[hidden]') ? $('mission-list').querySelector('[data-mission="glutfeld"]') : $('first-round')
      action = ['Glutfeld spielen', () => begin(MISSIONS[0].id)]
    } else {
      target = page === 'nest' ? $('nest-garden-link') : document.querySelector('[data-page="garten"]')
      action = ['Zum Kristallgarten', guideRoute('garten')]
    }
  } else if (guide.step === 'pair' && page === 'garten' && hasRound && guide.pair) {
    place = $('guide-board-slot')
    const [first, second] = guide.pair
    const next = guide.selected === null ? first : guide.selected === first ? second : first
    const row = Math.floor(next / BOARD_SIZE) + 1
    const col = next % BOARD_SIZE + 1
    target = tiles[next]
    title = guide.selected === null ? 'Wähle den markierten Kristall' : 'Jetzt den markierten Nachbarn'
    note = tileMap[current.board[next]].label + ' in Reihe ' + row + ', Spalte ' + col + '. Beim Tausch verschwinden drei oder mehr gleiche Kristalle in einer Linie.'
    other = ['Zum markierten Feld', () => {
      target.focus({ preventScroll:true })
      target.scrollIntoView({ block:'nearest' })
    }]
  } else if (guide.step === 'pair') {
    title = 'Jetzt probieren wir einen Zug'
    note = 'Ich zeige dir ein Kristallpaar, das du tauschen kannst.'
    action = page === 'garten' ? ['Glutfeld spielen', () => begin(MISSIONS[0].id)] : ['Zum Kristallgarten', guideRoute('garten')]
  } else if (guide.step === 'reward') {
    if (page === 'garten' && current) place = $('guide-board-slot')
    title = current?.status === 'won' ? 'Deine ersten Glutsterne!' : 'So entstehen Punkte!'
    const resultNote = guideMatchPoints ? 'Dieser Tausch hat dir ' + guideMatchPoints + ' Punkte gebracht. ' : ''
    note = current?.status === 'won'
      ? resultNote + 'Deine Glutsterne stehen oben im Spiel. In der Sammlung kannst du sie gegen Deko fürs Nest tauschen.'
      : resultNote + 'Oben siehst du dein Ziel und die übrigen Züge. Schaffst du das Ziel, bekommst du Glutsterne für Nestdeko. Mit „Tipp“ findest du den nächsten Tausch.'
    target = page === 'garten' && hasRound ? $('hint') : null
    action = ['Weiter', guideContinue]
  } else {
    title = 'Ein Buch für unsere Abenteuer'
    note = 'Pflege, Deko und Rätsel schalten Geschichten frei. Im Nestbuch entscheidest du, wie sie ausgehen.'
    action = ['Einführung abschließen', guideContinue]
    if (page !== 'nestbuch') {
      other = ['Nestbuch ansehen', () => {
        setGuide({ type:'journal' })
        location.hash = 'nestbuch'
        renderGuide()
      }]
    }
  }
  if (card.parentElement !== place) place.prepend(card)
  $('guide-status').textContent = name + ' begleitet dich · ' + stepNumber + ' / ' + GUIDE_STEPS.length
  if ($('guide-title').textContent !== title || $('guide-note').textContent !== note) {
    $('guide-title').textContent = title
    $('guide-note').textContent = note
  }
  guidePrimary = action?.[1]
  guideSecondary = other?.[1]
  $('guide-action').classList.toggle('guide-action-marked', !!target && (guide.step === 'feed' || guide.step === 'garden'))
  $('guide-action').hidden = !guidePrimary
  $('guide-other').hidden = !guideSecondary
  if (action) $('guide-action').textContent = action[0]
  if (other) $('guide-other').textContent = other[0]
  if (target) {
    target.classList.add('guide-target')
    const descriptions = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
    target.setAttribute('aria-describedby', [...new Set([...descriptions, 'guide-note'])].join(' '))
    guideTarget = target
  }
  if (focus) {
    cancelAnimationFrame(guideViewport)
    guideViewport = requestAnimationFrame(() => {
      if (card.hidden || document.querySelector('dialog[open]')) return
      const heading = $('guide-title')
      heading.tabIndex = -1
      heading.focus({ preventScroll:true })
      card.scrollIntoView({ block:'nearest' })
    })
  }
}

$('guide-action').addEventListener('click', () => guidePrimary?.())
$('guide-other').addEventListener('click', () => guideSecondary?.())
$('guide-skip').addEventListener('click', () => {
  setGuide({ type:'skip' })
  renderGuide()
  $('view-' + page).querySelector('h1').focus({ preventScroll:true })
})
$('guide-replay').addEventListener('click', () => {
  guide = beginGuide()
  guideMatchPoints = null
  store(GUIDE_KEY, guide)
  $('settings-dialog').close()
  if (page !== 'nest') location.hash = 'nest'
  else renderGuide(true)
})

let hatchTransition = null
let companionPlays = 0
let companionFeedbackTimer

function renderNest() {
  const now = Date.now()
  const level = getLevel(state)
  const mood = getMood(state, now)
  $('care-title').textContent = state.name
  $('scene-name').textContent = state.name
  $('scene').setAttribute('aria-label', 'Das Waldnest von ' + state.name)
  $('pet').setAttribute('aria-label', state.name + ' streicheln')
  $('mood').textContent = mood.message
  $('level').textContent = 'Stufe ' + level.level
  setProgress($('xp-progress'), level.percent, $('xp-fill'))
  $('xp-progress').setAttribute('aria-valuetext', level.maxed ? 'Höchste Stufe erreicht' : level.current + ' von ' + level.target + ' Erfahrung bis zur nächsten Stufe')
  const hasCushion = state.equipped.includes(FIRST_REWARD_ID)
  $('scene').classList.toggle('has-moss-cushion', hasCushion)
  $('scene-moss-cushion').hidden = !hasCushion
  if (!hasCushion) $('scene').classList.remove('is-settling')
  $('scene').classList.toggle('is-resting', mood.key === 'resting')
  if (!$('scene').dataset.action) $('pet-reaction').textContent = mood.key === 'resting' ? 'z z z' : ''
  $('scene-time').textContent = mood.label
  for (const [id, value] of Object.entries(state.needs)) {
    const percent = Math.round(value)
    $('stat-value-' + id).textContent = percent + '%'
    setProgress($('stat-' + id), percent)
  }
  for (const id of Object.keys(CARE)) {
    const seconds = Math.max(0, Math.ceil((Number(state.careAt[id] ?? 0) + 45000 - now) / 1000))
    const button = $('care-' + id)
    button.dataset.cooling = String(seconds > 0)
    button.title = seconds ? 'Wieder bereit in ' + seconds + ' Sekunden' : CARE[id].label
  }
  renderBookLink()
  const next = MISSIONS.find(m => isMissionUnlocked(state, m.id) && !state.progress.wins.includes(m.id))
  const active = state.round?.status === 'playing' ? missionMap[state.round.missionId] : null
  $('quest-kicker').textContent = active ? 'DEIN OFFENES SPIEL' : 'DEIN NÄCHSTES ABENTEUER'
  $('quest-title').textContent = active ? active.label + ' fortsetzen' : !next ? 'Zurück in den Kristallgarten' : next === MISSIONS[0] ? 'Auf in den Kristallgarten!' : next.label + ' entdecken'
  $('quest-detail').textContent = active ? 'Du hast noch ' + state.round.movesLeft + ' Züge für diese Runde.' : next === MISSIONS[0] ? 'Kombiniere Kristalle und sammle Glutsterne fürs Nest.' : next ? next.description : 'Spiele deine Lieblingsrunde noch einmal und sammle Glutsterne.'
  const stage = hatchTransition ? 'hatching' : state.egg.stage
  const hatching = stage === 'hatching'
  $('egg-title').textContent = stage === 'locked' ? 'Ein kleines Geheimnis' : hatching ? 'Die Schale bricht auf!' : stage === 'egg' ? 'Ein warmes Drachenei' : 'Hallo, Knöpfchen!'
  $('egg-description').textContent = stage === 'locked' ? 'Tief im Garten wartet ein Drachenei auf dich.' : hatching ? 'Unter der Schale bewegt sich etwas.' : stage === 'egg' ? ['Das Ei liegt im Moos. Tippe es an, um es zu wärmen.', 'Ein feiner Riss ist zu sehen. Wärme das Ei noch zweimal.', 'Die Schale knackt. Wärme das Ei noch einmal.'][state.egg.warmth] : 'Knöpfchen übt schon kleine Flügelschläge. Tippe es im Nest an und spiel mit ihm.'
  $('egg-action').hidden = stage === 'locked'
  $('egg-action').textContent = hatching ? 'Knöpfchen schlüpft …' : stage === 'hatched' ? 'Mit Knöpfchen spielen' : 'Ei wärmen'
  for (const id of ['egg-action', 'scene-egg-button']) {
    if (hatching) $(id).setAttribute('aria-disabled', 'true')
    else $(id).removeAttribute('aria-disabled')
  }
  const souvenir = keepsake && storyMap.get(keepsake)?.reward
  $('scene-keepsake').hidden = !souvenir
  $('scene-keepsake').textContent = souvenir ? souvenir.symbol + ' ' + souvenir.title : ''
  renderNestFind()
  const comp = $('scene-companion')
  if (comp.dataset.stage !== stage) {
    comp.dataset.stage = stage
    comp.classList.toggle('baby', stage === 'hatched')
    delete comp.dataset.reaction
    if (stage !== 'hatched') companionPlays = 0
    comp.hidden = stage === 'locked'
    const sceneButton = $('scene-egg-button')
    sceneButton.hidden = stage === 'locked'
    sceneButton.classList.remove('is-warming')
    sceneButton.setAttribute('aria-label', hatching ? 'Knöpfchen schlüpft' : stage === 'hatched' ? 'Mit Knöpfchen spielen' : 'Drachenei wärmen')
    $('egg-icon').classList.toggle('is-real-egg', hatching || stage === 'egg')
    $('egg-icon').innerHTML = icon(stage === 'hatched' ? 'heart' : 'egg')
  }
  comp.dataset.warmth = String(hatching ? 2 : state.egg.warmth)
  $('egg-icon').dataset.warmth = comp.dataset.warmth
  if ($('den-decor').dataset.items !== state.equipped.join(',')) {
    $('den-decor').dataset.items = state.equipped.join(',')
    $('den-decor').innerHTML = state.equipped.filter(id => id !== FIRST_REWARD_ID).map(id => '<span class="den-item" data-decor="' + id + '">' + icon(shopIcon[id]) + '</span>').join('')
  }
}
function react(action) {
  clearTimeout(reactionTimer)
  delete $('scene').dataset.action
  void $('pet').offsetWidth
  $('scene').dataset.action = action
  $('pet-reaction').textContent = actionEmoji[action]
  reactionTimer = setTimeout(() => {
    delete $('scene').dataset.action
    $('pet-reaction').textContent = getMood(state).key === 'resting' ? 'z z z' : ''
  }, 1380)
}
function doCare(action) {
  const result = care(state, action)
  state = result.state
  const newStory = result.ok && storyEvent({ type:'care', action })
  persist()
  renderNest()
  if (result.ok) {
    clearFindReaction()
    $('scene').classList.remove('is-settling')
    react(action)
  }
  const advancesGuide = result.ok && action === 'feed' && guide.status === 'active' && guide.step === 'feed'
  if (advancesGuide) setGuide({ type:'fed' })
  renderGuide(advancesGuide)
  tell(storyMessage(result.message, newStory))
}
function renderNestFind() {
  const item = displayedFind(finds)
  const button = $('scene-find')
  button.hidden = !item
  $('nest-finds-link').hidden = finds.owned.length === 0
  if (!item) {
    $('scene-find-image').removeAttribute('src')
    return
  }
  const url = './' + item.asset
  if ($('scene-find-image').getAttribute('src') !== url) $('scene-find-image').src = url
  button.setAttribute('aria-label', item.name + ' den Drachen zeigen')
}

function renderFinds() {
  const list = $('find-list')
  list.replaceChildren(...FIND_ITEMS.map(item => {
    const owned = finds.owned.includes(item.id)
    const shown = finds.displayed === item.id
    const card = element('article', '', 'find-card')
    const art = element('div', '', 'find-art')
    if (owned) {
      const image = element('img')
      image.src = './' + item.asset
      image.alt = ''
      art.append(image)
    } else {
      art.innerHTML = icon('lock')
    }
    const copy = element('div', '', 'find-copy')
    copy.append(element('h3', item.name), element('p', owned ? item.description : 'Gewinne ' + missionMap[item.missionId].label + '.'))
    card.append(art, copy)
    if (owned) {
      const button = element('button', shown ? 'Weglegen' : 'Im Nest aufstellen', 'small-button')
      button.type = 'button'
      button.dataset.find = item.id
      button.setAttribute('aria-label', item.name + ': ' + button.textContent)
      copy.append(button)
      if (shown) {
        const link = element('a', 'Im Nest ansehen', 'small-button')
        link.href = '#nest/fund'
        copy.append(link)
      }
    }
    return card
  }))
}

function clearFindReaction() {
  clearTimeout(findFeedbackTimer)
  findFeedbackTimer = undefined
  delete $('scene').dataset.findReaction
  delete $('scene-companion').dataset.findReaction
}

function showFindReaction() {
  const item = displayedFind(finds)
  if (!item || hatchTransition) return
  clearFindReaction()
  const baby = $('scene-companion')
  clearTimeout(companionFeedbackTimer)
  delete baby.dataset.reaction
  const scene = $('scene')
  void scene.offsetWidth
  const adult = item.reaction.adult
  scene.dataset.findReaction = adult.kind
  let message = adult.message.replaceAll('{name}', () => state.name)
  if (state.egg.stage === 'hatched') {
    baby.dataset.findReaction = item.reaction.baby.kind
    message += ' ' + item.reaction.baby.message
  }
  findFeedbackTimer = setTimeout(clearFindReaction, 2400)
  tell(message)
}

function showFindDestination() {
  const target = page === 'sammlung' ? $('finds-title') : $('scene-find')
  if (target.hidden) return
  target.focus({ preventScroll:true })
  target.scrollIntoView({ block:'nearest' })
  if (page === 'nest') showFindReaction()
}

$('scene-find').addEventListener('click', showFindReaction)
$('find-list').addEventListener('click', event => {
  const button = event.target.closest('[data-find]')
  if (!button) return
  const id = button.dataset.find
  const remove = finds.displayed === id
  const next = setDisplayedFind(finds, remove ? null : id)
  if (next === finds) return
  finds = next
  persist()
  renderFinds()
  const control = Array.from($('find-list').querySelectorAll('[data-find]')).find(item => item.dataset.find === id)
  if (remove) control?.focus()
  else control?.nextElementSibling?.focus()
  tell(remove ? 'Das Fundstück ist wieder in der Sammlung.' : 'Das Fundstück steht im Nest.')
})

let postcardSession
function clearPostcard() {
  if (postcardSession?.url) URL.revokeObjectURL(postcardSession.url)
  postcardSession = null
  $('postcard-preview').hidden = true
  $('postcard-preview').removeAttribute('src')
  $('postcard-download').hidden = true
  $('postcard-download').removeAttribute('href')
  $('postcard-share').hidden = true
}

$('postcard-open').addEventListener('click', async () => {
  clearPostcard()
  const session = {}
  postcardSession = session
  $('postcard-status').textContent = 'Deine Postkarte wird gemalt …'
  $('postcard-dialog').showModal()
  const item = displayedFind(finds)
  const reward = keepsake && storyMap.get(keepsake)?.reward
  const scene = $('scene')
  const pose = scene.classList.contains('is-resting') || scene.classList.contains('is-settling') ? 'rest' : scene.dataset.action === 'cuddle' ? 'cuddle' : 'awake'
  try {
    const card = await renderPostcard({
      name: state.name,
      pose,
      egg: state.egg.stage,
      warmth: state.egg.warmth,
      equipped: [...state.equipped],
      find: item ? { id:item.id, label:item.name } : null,
      keepsake: reward || null,
    })
    if (postcardSession !== session || !$('postcard-dialog').open) return
    session.card = card
    session.url = URL.createObjectURL(card.blob)
    const preview = $('postcard-preview')
    preview.src = session.url
    preview.alt = card.alt
    preview.hidden = false
    const download = $('postcard-download')
    download.href = session.url
    download.download = card.filename
    download.hidden = false
    $('postcard-share').hidden = !canSharePostcard(card)
    $('postcard-status').textContent = $('postcard-share').hidden ? 'Die Postkarte ist fertig. Du kannst das Bild als PNG speichern.' : 'Die Postkarte ist fertig.'
  } catch {
    if (postcardSession === session && $('postcard-dialog').open) $('postcard-status').textContent = 'Das Bild konnte nicht erstellt werden. Öffne die Postkarte erneut.'
  }
})
$('postcard-close').addEventListener('click', () => $('postcard-dialog').close())
$('postcard-dialog').addEventListener('close', () => {
  if (!$('postcard-dialog').open) clearPostcard()
})
$('postcard-share').addEventListener('click', async () => {
  if (!postcardSession?.card) return
  const session = postcardSession
  try {
    await sharePostcard(session.card)
  } catch (error) {
    if (error?.name !== 'AbortError' && session === postcardSession && $('postcard-dialog').open) {
      $('postcard-status').textContent = 'Teilen ist gerade nicht möglich. Du kannst die Postkarte als PNG speichern.'
    }
  }
})

function renderShop() {
  renderFinds()
  const active = document.activeElement?.dataset.shop
  $('shop').innerHTML = SHOP.map(item => {
    const owned = state.owned.includes(item.id)
    const equipped = state.equipped.includes(item.id)
    const locked = getLevel(state).level < item.level
    const cost = locked && !owned ? 'Ab Stufe ' + item.level : owned ? equipped ? 'Im Nest' : 'In deiner Sammlung' : item.cost + ' Glutsterne'
    const reward = rewardItemAction(state, item.id)
    const action = reward?.action === 'view' ? 'Verstauen' : reward?.label ?? (owned ? equipped ? 'Verstauen' : 'Aufstellen' : 'Freischalten')
    const art = reward ? '<img src="./assets/moss-cushion.webp" alt="">' : icon(shopIcon[item.id])
    const view = reward?.action === 'view' ? '<a class="primary shop-view" href="#nest/mooskissen">Im Nest ansehen</a>' : ''
    const spotlight = item.id === FIRST_REWARD_ID && location.hash === '#sammlung/mooskissen' ? ' reward-spotlight' : ''
    return '<article class="panel shop-card' + spotlight + '" id="shop-' + item.id + '"><div class="shop-art">' + art + '</div><h2>' + item.label + '</h2><p>' + item.description + '</p><div class="shop-foot"><span>' + icon(owned ? 'check' : locked ? 'lock' : 'sparkles') + cost + '</span><button type="button" class="small-button" data-shop="' + item.id + '" aria-label="' + item.label + ': ' + action + '"' + (locked && !owned ? ' disabled' : '') + '>' + action + '</button>' + view + '</div></article>'
  }).join('')
  if (active) $('shop').querySelector('[data-shop="' + active + '"]')?.focus({ preventScroll: true })
}
function describeGoal(mission) {
  const goals = []
  if (mission.targetScore) goals.push(mission.targetScore + ' Punkte')
  for (const [id, count] of Object.entries(mission.targetTiles)) goals.push(count + ' × ' + tileMap[id].label)
  if (mission.targetSpecials) goals.push(mission.targetSpecials + ' Spezialkristalle zünden')
  return goals.join(' · ')
}
function renderMasteryBook() {
  const goals = MISSIONS.filter(mission => state.progress.wins.includes(mission.id) && MASTERY_GOALS[mission.id])
  $('mastery-guide').hidden = !goals.length
  $('mastery-summary').textContent = 'Sternabzeichen (' + mastery.earned.length + '/' + Object.keys(MASTERY_GOALS).length + ')'
  $('mastery-list').replaceChildren(...goals.map(mission => {
    const goal = MASTERY_GOALS[mission.id]
    const earned = mastery.earned.includes(mission.id)
    const row = element('li')
    row.append(element('strong', (earned ? '✦ ' : '') + mission.label + ' · ' + goal.title),
      element('span', earned ? 'Verdient' : goal.description))
    return row
  }))
}

function renderMissions() {
  renderMasteryBook()
  const focusId = document.activeElement?.dataset.mission
  $('mission-list').innerHTML = MISSIONS.map((mission, index) => {
    const unlocked = isMissionUnlocked(state, mission.id)
    const won = state.progress.wins.includes(mission.id)
    const medalGoal = won && MASTERY_GOALS[mission.id]
    const medalNote = medalGoal ? ' · ' + (mastery.earned.includes(mission.id) ? 'Abzeichen verdient' : 'Sternabzeichen möglich') : ''
    return '<button type="button" class="mission" data-mission="' + mission.id + '" ' + (unlocked ? '' : 'disabled ') + (state.round?.missionId === mission.id ? 'aria-current="true" ' : '') + '><span class="mission-index">' + (unlocked ? '0' + (index + 1) : icon('lock')) + '</span><span><strong>' + mission.label + '</strong><small>' + (unlocked ? describeGoal(mission) : mission.id === 'gluehlichtung' ? 'Nachdem Knöpfchen schlüpft' : 'Nach ' + MISSIONS[index - 1].label) + medalNote + '</small></span><span class="mission-end">' + icon(won ? 'check' : unlocked ? 'arrow' : 'lock') + '</span></button>'
  }).join('')
  if (focusId) $('mission-list').querySelector('[data-mission="' + focusId + '"]')?.focus({ preventScroll: true })
}
function makeBoard() {
  for (let row = 0; row < BOARD_SIZE; row++) {
    const line = document.createElement('div')
    line.className = 'board-row'
    line.setAttribute('role', 'row')
    for (let col = 0; col < BOARD_SIZE; col++) {
      const index = row * BOARD_SIZE + col
      const cell = document.createElement('div')
      cell.className = 'cell'
      cell.setAttribute('role', 'gridcell')
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'tile'
      button.dataset.index = index
      button.addEventListener('click', () => chooseTile(index))
      button.addEventListener('focus', () => { focused = index; updateBoardInteraction() })
      cell.append(button)
      line.append(cell)
      tiles.push(button)
    }
    $('board').append(line)
  }
}
function updateBoardInteraction() {
  const active = state.round?.status === 'playing'
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].tabIndex = active && focused === i ? 0 : -1
    tiles[i].setAttribute('aria-disabled', String(!active || playingAnimation))
    tiles[i].setAttribute('aria-pressed', String(selection === i))
    tiles[i].classList.toggle('is-hint', hinted.includes(i))
  }
}
function drawBoard(values, specials = {}, clearing = [], dropping = false) {
  values.forEach((id, i) => {
    const tile = tiles[i]
    const special = specials[i] || ''
    if (tile.dataset.gem !== id || (tile.dataset.special ?? '') !== special) {
      tile.dataset.gem = id
      if (special) tile.dataset.special = special
      else delete tile.dataset.special
      tile.innerHTML = icon(tileIcon[id]) + (special ? '<span class="tile-special" aria-hidden="true">' + (special === 'burst' ? '✦' : special === 'row' ? '↔' : '↕') + '</span>' : '')
      const specialLabel = special ? ', ' + SPECIALS[special].label + (special === 'row' ? ' waagerecht' : special === 'column' ? ' senkrecht' : '') : ''
      tile.setAttribute('aria-label', tileMap[id].label + specialLabel + ', Reihe ' + (Math.floor(i / BOARD_SIZE) + 1) + ', Spalte ' + (i % BOARD_SIZE + 1))
    }
    tile.classList.toggle('is-clearing', clearing.includes(i))
    tile.classList.toggle('is-dropping', dropping)
  })
  updateBoardInteraction()
}
function renderRound(reward = null) {
  const round = state.round
  $('board-empty').hidden = !!round
  $('round').hidden = !round
  $('round').parentElement.setAttribute('aria-labelledby', round ? 'active-round-title' : 'round-title')
  if (!round) return
  const mission = missionMap[round.missionId]
  $('active-round-title').textContent = mission.label
  $('moves-left').textContent = round.movesLeft
  const targets = Object.entries(mission.targetTiles).map(([id,n]) => [tileIcon[id], id, round.tiles[id], n, tileMap[id].label])
  if (mission.targetScore) targets.unshift(['sparkles', '', round.score, mission.targetScore, 'Punkte'])
  if (mission.targetSpecials) targets.push(['ray', '', round.activatedSpecials ?? 0, mission.targetSpecials, 'Gezündet'])
  $('round-goals').innerHTML = targets.map(([symbol,id,value,goal,label]) =>
    '<span class="goal" data-gem="' + id + '">' + icon(value >= goal ? 'check' : symbol) + label + ': <strong>' + Math.min(value, goal) + ' / ' + goal + '</strong></span>').join('')
  drawBoard(round.board, round.specials)
  const masteryGoal = masteryStatus(mastery, state)
  $('mastery-current').hidden = !masteryGoal
  const medalProgress = masteryGoal?.goal.id === 'glutfeld'
    ? masteryGoal.progress + ' Züge übrig'
    : masteryGoal ? masteryGoal.progress + ' von ' + masteryGoal.target : ''
  $('mastery-current').textContent = masteryGoal ? masteryGoal.goal.title + ': ' + masteryGoal.goal.description + ' (' + medalProgress + ')' : ''
  const done = round.status !== 'playing'
  $('hint').disabled = done || playingAnimation
  $('round-result').hidden = !done
  if (done) {
    const won = round.status === 'won'
    const nextMission = MISSIONS[MISSIONS.indexOf(mission) + 1]
    const next = won && nextMission && isMissionUnlocked(state, nextMission.id) ? nextMission : null
    const text = !won ? 'Zwei Glutsterne nimmst du trotzdem mit.' : reward?.eggFound ? 'Du hast ein Drachenei gefunden! Im Nest kannst du es wärmen.' : reward ? 'Du hast ' + reward.glow + ' Glutsterne gesammelt.' : 'Dein Fortschritt und deine Belohnung sind gespeichert.'
    const find = won && FIND_ITEMS.find(item => item.missionId === mission.id && finds.owned.includes(item.id))
    const findLink = find ? '<div class="find-win"><img src="./' + find.asset + '" alt=""><div><strong>' + find.name + '</strong><a class="small-button" href="' + (finds.displayed === find.id ? '#nest/fund' : '#sammlung/funde') + '">' + (finds.displayed === find.id ? 'Fund im Nest ansehen' : 'Zu den Fundstücken') + '</a></div></div>' : ''
    const medal = reward?.medal ? '<p class="medal-win">✦ Sternabzeichen: ' + reward.medal.title + '</p>' : ''
    const furnishing = firstRewardAction(state)
    const furnishingLink = furnishing ? '<a class="primary" href="#sammlung/mooskissen">' + furnishing.label + '</a>' : ''
    $('round-result').innerHTML = '<strong>' + (won ? 'Geschafft!' : 'Die Runde ist zu Ende.') + '</strong><p>' + text + '</p>' + medal + findLink + furnishingLink + (next ? '<button class="' + (furnishing ? 'small-button' : 'primary') + '" type="button" data-next="' + next.id + '">' + next.label + ' spielen</button>' : won && state.egg.stage === 'egg' ? '<a class="primary" href="#nest">Zum Drachenei</a>' : '') + '<button class="small-button" type="button" data-retry="' + mission.id + '">Noch einmal</button>'
  }
}
function renderGarden() { renderMissions(); if (!playingAnimation) renderRound() }
function route(focusHeading = false) {
  const hash = location.hash.slice(1)
  const cushionRoute = hash === 'sammlung/mooskissen' || hash === 'nest/mooskissen'
  const findRoute = hash === 'sammlung/funde' || hash === 'nest/fund'
  const requested = cushionRoute || findRoute ? hash.split('/')[0] : hash
  page = pages.includes(requested) ? requested : 'nest'
  for (const id of pages) {
    $('view-' + id).hidden = id !== page
    const nav = document.querySelector('[data-page="' + id + '"]')
    if (id === page) nav.setAttribute('aria-current','page')
    else nav.removeAttribute('aria-current')
  }
  if (page !== 'nest') {
    endHatch(false)
    clearFindReaction()
    $('scene').classList.remove('is-settling')
  }
  if (page === 'nest') renderNest()
  if (page === 'garten') renderGarden()
  if (page === 'nestbuch') renderBook()
  if (page === 'sammlung') renderShop()
  if (focusHeading) {
    $('view-' + page).querySelector('h1').focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  renderGuide(focusHeading && !cushionRoute && !findRoute)
  if (cushionRoute) showCushionDestination()
  if (findRoute && focusHeading) showFindDestination()
}

function showCushionDestination() {
  if (page === 'sammlung') {
    const shopCard = $('shop-' + FIRST_REWARD_ID)
    shopCard.classList.add('reward-spotlight')
    const target = shopCard.querySelector('.shop-view') ?? shopCard.querySelector('[data-shop]')
    target.focus({ preventScroll:true })
    shopCard.scrollIntoView({ block:'nearest' })
    return
  }
  if (!state.equipped.includes(FIRST_REWARD_ID)) return
  const scene = $('scene')
  scene.tabIndex = -1
  scene.focus({ preventScroll:true })
  scene.scrollIntoView({ block:'nearest' })
  scene.classList.add('is-settling')
  tell(state.name + ' kuschelt sich aufs Mooskissen.')
}
function confirm(title, copy, action) {
  if ($('confirm-dialog').open) return Promise.resolve(false)
  $('confirm-title').textContent = title
  $('confirm-copy').textContent = copy
  $('confirm-action').textContent = action
  $('confirm-dialog').returnValue = 'cancel'
  $('confirm-dialog').showModal()
  return new Promise(resolve => { confirmResolve = resolve })
}
$('confirm-dialog').addEventListener('close', () => {
  confirmResolve?.($('confirm-dialog').returnValue === 'accept')
  confirmResolve = null
})
function showHint(initial = false) {
  if (playingAnimation) return
  const pair = getHint(state.round)
  if (!pair) return
  selection = null
  hinted = pair
  updateBoardInteraction()
  renderGuide()
  if (!initial) {
    const pos = pair.map(i => 'Reihe ' + (Math.floor(i / BOARD_SIZE) + 1) + ', Spalte ' + (i % BOARD_SIZE + 1))
    tell('Versuch es mit den markierten Kristallen: ' + pos.join(' und ') + '.')
  }
}
async function begin(id, replace = false) {
  if (playingAnimation) return
  if (!replace && state.round?.missionId === id && state.round.status === 'playing') {
    $('active-round-title').focus({ preventScroll:true })
    return
  }
  if (state.round?.status === 'playing') {
    if (!await confirm('Ein neues Abenteuer?', 'Damit endet deine offene Runde im ' + missionMap[state.round.missionId].label + '.', 'Neu beginnen')) return
  }
  const result = startRound(state, id)
  if (!result.ok) { tell(result.message); return }
  state = result.state
  mastery = beginMasteryRound(mastery, state)
  selection = null; focused = 0; hinted = []
  persist()
  renderGarden()
  $('board-help').textContent = 'Tippe nacheinander auf zwei benachbarte Kristalle.'
  if (id === MISSIONS[0].id && !state.progress.wins.includes(id) && guide.status !== 'active') showHint(true)
  $('active-round-title').focus({ preventScroll:true })
  if (innerWidth <= 665) $('round').scrollIntoView({ block:'start', behavior:'instant' })
  renderGuide(true)
}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
async function chooseTile(index) {
  if (playingAnimation || state.round?.status !== 'playing') return
  focused = index
  if (selection === null || selection === index) {
    selection = selection === null ? index : null
    updateBoardInteraction()
    renderGuide()
    return
  }
  const from = selection
  const adjacent = Math.abs(index % BOARD_SIZE - from % BOARD_SIZE) + Math.abs(Math.floor(index / BOARD_SIZE) - Math.floor(from / BOARD_SIZE)) === 1
  if (!adjacent) {
    selection = index
    updateBoardInteraction()
    renderGuide()
    return
  }
  selection = null; hinted = []
  const result = playMove(state, from, index)
  if (!result.ok) {
    updateBoardInteraction()
    renderGuide()
    tell(result.message)
    return
  }
  const animate = !settings.quiet && !reduceMotion.matches
  playingAnimation = true
  $('hint').disabled = true
  state = result.state
  const discovery = recordGardenFind(finds, state)
  finds = discovery.finds
  const medal = recordMasteryMove(mastery, state, result.summary)
  mastery = medal.mastery
  const previousGuideStep = guide.step
  setGuide({ type:'move-committed', from, to:index })
  if (previousGuideStep === 'pair' && guide.step === 'reward') guideMatchPoints = result.summary.score
  if (guide.step === 'pair' && state.round.status !== 'playing') setGuide({ type:'pair-set', pair:null })
  const cleared = result.frames.flatMap(frame => frame.cleared.map(i => frame.before[i]))
  const newStory = storyEvent({ type:'match', cleared, chains:result.summary.chains, activatedSpecials:result.summary.activatedSpecials })
  persist()
  wallet()
  if (animate) for (const frame of result.frames.slice(0, 3)) {
    drawBoard(frame.before, frame.beforeSpecials, frame.cleared)
    await wait(120)
    drawBoard(frame.after, frame.afterSpecials, [], true)
    await wait(150)
    if (page !== 'garten') break
  }
  playingAnimation = false
  if (page === 'garten') {
    renderMissions()
    renderRound({ ...result.summary, medal:medal.earned })
    if (result.summary.activatedSpecials) {
      $('board-help').textContent = 'Gezündete Spezialkristalle: ' + result.summary.activatedSpecials
    } else if (result.summary.createdSpecials) {
      $('board-help').textContent = 'Ein Spezialkristall ist entstanden. Kombiniere den markierten Stein erneut.'
    } else if (result.summary.chains > 1) {
      $('board-help').textContent = 'Kettenreaktion ×' + result.summary.chains + '!'
    } else if (result.summary.reshuffled) {
      $('board-help').textContent = 'Die Kristalle wurden neu gemischt.'
    } else {
      $('board-help').textContent = 'Tippe nacheinander auf zwei benachbarte Kristalle.'
    }
    if (state.round.status !== 'playing') {
      $('round-result').tabIndex = -1
      $('round-result').focus({ preventScroll:true })
    }
  }
  if (page === 'nest') renderNest()
  if (page === 'nestbuch') renderBook()
  if (page === 'sammlung') renderShop()
  renderGuide(previousGuideStep === 'pair' && guide.step === 'reward')
  let message = result.message
  if (discovery.discovered) message += ' Gefunden: ' + discovery.discovered.name + '.'
  if (medal.earned) message += ' Sternabzeichen: ' + medal.earned.title + '.'
  tell(storyMessage(message, newStory))
}

$('board').addEventListener('keydown', event => {
  const tile = event.target.closest('[data-index]')
  if (!tile) return
  const i = Number(tile.dataset.index)
  if (event.key === 'Escape') { selection = null; updateBoardInteraction(); renderGuide(); return }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!event.repeat) chooseTile(i)
    return
  }
  const delta = { ArrowLeft: i % BOARD_SIZE > 0 ? -1 : 0, ArrowRight: i % BOARD_SIZE < BOARD_SIZE - 1 ? 1 : 0, ArrowUp: i >= BOARD_SIZE ? -BOARD_SIZE : 0, ArrowDown: i < BOARD_SIZE * (BOARD_SIZE - 1) ? BOARD_SIZE : 0 }
  if (!(event.key in delta)) return
  event.preventDefault()
  if (delta[event.key]) tiles[i + delta[event.key]].focus()
})
$('board').addEventListener('pointerdown', event => {
  const tile = event.target.closest('[data-index]')
  if (!tile || !event.isPrimary || event.button !== 0) return
  pointer = { id:event.pointerId, index:Number(tile.dataset.index), x:event.clientX, y:event.clientY }
})
$('board').addEventListener('pointercancel', () => { pointer = null })
$('board').addEventListener('pointerup', event => {
  if (!pointer || pointer.id !== event.pointerId) return
  const {index, x, y} = pointer
  pointer = null
  const dx = event.clientX - x, dy = event.clientY - y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 17 || playingAnimation || state.round?.status !== 'playing') return
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const offset = horizontal ? Math.sign(dx) : Math.sign(dy) * BOARD_SIZE
  const next = index + offset
  if (next < 0 || next >= tiles.length || (horizontal && Math.floor(next / BOARD_SIZE) !== Math.floor(index / BOARD_SIZE))) return
  event.preventDefault()
  selection = index
  $('board').dataset.swiped = 'true'
  setTimeout(() => { delete $('board').dataset.swiped }, 300)
  chooseTile(next)
})
$('board').addEventListener('click', event => {
  if ($('board').dataset.swiped && event.detail !== 0) { event.stopPropagation(); event.preventDefault() }
}, true)
$('hint').addEventListener('click', () => showHint())
$('first-round').addEventListener('click', () => begin(MISSIONS[0].id))
$('mission-list').addEventListener('click', event => {
  const button = event.target.closest('[data-mission]')
  if (button) begin(button.dataset.mission)
})
$('round-result').addEventListener('click', event => {
  const button = event.target.closest('[data-next],[data-retry]')
  if (button) begin(button.dataset.next ?? button.dataset.retry, true)
})
$('shop').addEventListener('click', event => {
  const button = event.target.closest('[data-shop]')
  if (!button) return
  const id = button.dataset.shop
  const result = (state.owned.includes(id) ? toggleItem : buyItem)(state, id)
  state = result.state
  const newStory = result.ok && state.equipped.includes(id) && storyEvent({ type:'decorate', id })
  persist(); wallet(); renderShop()
  if (result.ok && id === FIRST_REWARD_ID && state.equipped.includes(id)) {
    $('shop-' + id).querySelector('.shop-view').focus({ preventScroll:true })
  }
  tell(storyMessage(result.message, newStory))
})
function endHatch(announce = true) {
  if (!hatchTransition) return
  const { timer, message } = hatchTransition
  clearTimeout(timer)
  hatchTransition = null
  if (page === 'nest') renderNest()
  if (announce) tell(message)
}

$('scene-companion').addEventListener('animationend', event => {
  if (event.animationName === 'hatch-base') endHatch()
})

function interactWithEgg(event) {
  if (hatchTransition) return
  const inScene = event.currentTarget === $('scene-egg-button')
  if (state.egg.stage === 'hatched') {
    const baby = $('scene-companion')
    clearFindReaction()
    const reaction = companionReaction(state, companionPlays++)
    delete baby.dataset.reaction
    void baby.offsetWidth
    baby.dataset.reaction = reaction.kind
    clearTimeout(companionFeedbackTimer)
    companionFeedbackTimer = setTimeout(() => { delete baby.dataset.reaction }, 1300)
    const newStory = storyEvent({ type:'baby-play' })
    persist()
    if (!inScene) {
      $('scene').scrollIntoView({ block:'nearest' })
      $('scene-egg-button').focus({ preventScroll:true })
    }
    tell(storyMessage(reaction.message, newStory))
    return
  }
  const result = careForEgg(state)
  state = result.state
  const newStory = result.ok && state.egg.stage === 'hatched' && storyEvent({ type:'hatch' })
  persist()
  const message = storyMessage(result.message, newStory)
  if (state.egg.stage === 'hatched' && !settings.quiet && !reduceMotion.matches) {
    hatchTransition = { message, timer:setTimeout(endHatch, 1800) }
    renderNest()
    if (!inScene) {
      $('scene').scrollIntoView({ block:'nearest' })
      $('scene-egg-button').focus({ preventScroll:true })
    }
    return
  }
  renderNest()
  if (result.ok && state.egg.stage === 'egg') {
    const button = $('scene-egg-button')
    button.classList.remove('is-warming')
    void button.offsetWidth
    button.classList.add('is-warming')
  }
  if (state.egg.stage === 'hatched' && !inScene) {
    $('egg-title').tabIndex = -1
    $('egg-title').focus()
  }
  tell(message)
}
$('egg-action').addEventListener('click', interactWithEgg)
$('scene-egg-button').addEventListener('click', interactWithEgg)
$('pet').addEventListener('click', () => doCare('cuddle'))
$('pet-label').addEventListener('click', () => doCare('cuddle'))
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault()
  $('main').focus()
})
$('settings').addEventListener('click', () => {
  $('settings-status').textContent = ''
  $('dragon-name').value = state.name
  $('motion-option').checked = settings.quiet
  $('settings-dialog').showModal()
})
$('close-settings').addEventListener('click', () => $('settings-dialog').close())
$('settings-form').addEventListener('submit', event => {
  event.preventDefault()
  const result = renameDragon(state, $('dragon-name').value)
  if (!result.ok) { $('settings-status').textContent = result.message; $('dragon-name').focus(); return }
  const renamed = state.name !== result.state.name
  state = result.state
  settings.quiet = $('motion-option').checked
  document.documentElement.dataset.quiet = String(settings.quiet)
  store(settingsKey, settings)
  persist()
  if (settings.quiet) endHatch()
  if (page === 'nest') renderNest()
  $('settings-dialog').close()
  tell(renamed ? result.message : 'Einstellungen gespeichert.')
})
$('export-save').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ type:'glutnest-save', state:saveProgress(), settings }, null, 2)], { type:'application/json' }))
  const link = document.createElement('a')
  link.download = 'glutnest-spielstand.json'
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
})
$('import-save').addEventListener('click', () => $('save-file').click())
$('save-file').addEventListener('change', async () => {
  const file = $('save-file').files[0]
  $('save-file').value = ''
  if (!file) return
  let data
  try {
    if (file.size > 128 * 1024) throw new Error()
    data = JSON.parse(await file.text())
    if (data?.type !== 'glutnest-save' || data?.state?.version !== 1 || typeof data.state.name !== 'string' || !data.state.needs) throw new Error()
  } catch { $('settings-status').textContent = 'Diese Datei ist keine gültige Glutnest-Sicherung.'; return }
  if (playingAnimation || !await confirm('Spielstand einspielen?', 'Die Sicherung ersetzt den Spielstand in diesem Browser.', 'Einspielen')) return
  endHatch(false)
  clearFindReaction()
  readProgress(data.state)
  setGuide({ type:'skip' })
  settings.quiet = data.settings?.quiet === true
  document.documentElement.dataset.quiet = String(settings.quiet)
  store(settingsKey, settings)
  selection = null; focused = 0; hinted = []
  persist(); wallet(); renderBookLink(); route()
  $('settings-dialog').close()
  tell('Dein gesicherter Spielstand ist wieder da.')
})
function refreshCare() {
  if (playingAnimation) return
  state = tick(state)
  if (page === 'nest') renderNest()
}
function absorbOtherTab() {
  if (playingAnimation || document.hidden) return
  const other = load(key)
  if (!other) return
  if (other.egg?.stage !== 'hatched') endHatch(false)
  readProgress(other)
  selection = null; hinted = []
  wallet(); renderBookLink(); route()
  if (openedStory) paintStory()
}
addEventListener('storage', event => {
  if (event.key === GUIDE_KEY) {
    guide = normalizeGuide(load(GUIDE_KEY), { hasSave:true })
    renderGuide()
    return
  }
  if (event.key !== key) return
  clearTimeout(tabRefreshTimer)
  tabRefreshTimer = setTimeout(absorbOtherTab, 420)
})
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { endHatch(false); return }
  absorbOtherTab()
  refreshCare()
})
setInterval(() => { if (!document.hidden) refreshCare() }, 15000)
reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) endHatch() })
addEventListener('hashchange', () => route(true))
fillIcons()
initializeCare()
makeBoard()
document.documentElement.dataset.quiet = String(settings.quiet)
persist()
wallet()
renderBookLink()
route()
if (state.round?.missionId === MISSIONS[0].id && state.round.score === 0 && guide.status !== 'active') showHint(true)
if (guide.status === 'active' && page === 'garten') renderGuide(true)
if ('serviceWorker' in navigator && window.isSecureContext) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}), { once:true })
}
