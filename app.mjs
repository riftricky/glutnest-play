import {
  BOARD_SIZE, CARE, MISSIONS, SHOP, SPECIALS, TILES, buyItem, care, careForEgg,
  getHint, getLevel, getMood, isMissionUnlocked, normalizeState,
  playMove, renameDragon, startRound, tick, toggleItem,
} from './game.mjs?v=nest-gestalten'
import { GUIDE_KEY, beginGuide, guideEvent, nestJourney, normalizeGuide } from './guide.mjs?v=nest-gestalten'
import { STORIES, chooseStory, nextUnreadStory, normalizeStories, recordStoryEvent, storyStatus } from './stories.mjs?v=nest-gestalten'
import { FIRST_REWARD_ID, firstRewardAction, rewardItemAction } from './reward.mjs'
import { companionReaction } from './companion.mjs'
import { NEST_FURNISHINGS, nestFurnishing } from './decor.mjs'
import { normalizeLayout, furnishingPosition, moveFurnishing, resetFurnishing } from './layout.mjs'
import { FIND_ITEMS, displayedFind, normalizeFinds, recordGardenFind, setDisplayedFind } from './finds.mjs'
import { renderPostcard, canSharePostcard, sharePostcard } from './postcard.mjs?v=nest-gestalten'
import { LANTERN_LIGHTS, normalizeLantern, beginLanternRound, recordLanternMove, lanternStatus, selectLanternLight, availableLanternLights, selectedLanternLight } from './lantern.mjs'
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
const slotLabel = { ground:'Liegeplatz', light:'Lichtschmuck', plants:'Pflanzen' }
const statMeta = {
  fullness: ['Sattheit','berry'], joy: ['Freude','leaf'], bond: ['Geborgenheit','heart'], energy: ['Energie','moon'],
}
const actionIcon = { feed:'berry', play:'leaf', cuddle:'heart', rest:'moon' }
const actionEmoji = { feed:'', play:'', cuddle:'♥', rest:'z z z', egg:'✦' }
const tileMap = Object.fromEntries(TILES.map(tile => [tile.id, tile]))
const missionMap = Object.fromEntries(MISSIONS.map(mission => [mission.id, mission]))
const pages = ['nest', 'garten', 'nestbuch', 'sammlung']
const storyMap = new Map(STORIES.map(story => [story.id, story]))
let stories, keepsake, finds, mastery, lantern
let storyReading = false
let storyOpener = null
let page, state, settings, nestLayout, storageOK = true
let layoutEditing = false, layoutSelected = '', layoutDrag = null, suppressLayoutClick = false
let selection = null, focused = 0, hinted = [], playingAnimation = false, pointer = null
let reactionTimer, toastTimer, tabRefreshTimer, findFeedbackTimer, lanternFeedbackTimer, furnishingFeedbackTimer
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
  nestLayout = normalizeLayout(savedState?.nestLayout)
  mastery = normalizeMastery(savedState?.mastery, state)
  lantern = normalizeLantern(savedState?.lantern, mastery, state)
  keepsake = storyMap.has(savedState?.keepsake) && storyStatus(stories, savedState.keepsake) === 'complete'
    ? savedState.keepsake
    : null
}
function saveProgress() { return { ...state, stories, keepsake, finds, mastery, lantern, nestLayout } }
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
  const ready = nextUnreadStory(stories)
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
function createStoryPage(story) {
  const chapter = element('article', '', 'story-page')
  chapter.dataset.storyPage = story.id
  chapter.setAttribute('aria-labelledby', 'story-heading-' + story.id)

  const art = element('div', '', 'story-dialog-art')
  art.dataset.art = story.art
  art.style.backgroundImage = 'url("' + storyArt[story.art] + '")'
  art.setAttribute('aria-hidden', 'true')

  const content = element('div', '', 'story-dialog-content')
  const heading = element('h3', story.title)
  heading.id = 'story-heading-' + story.id
  heading.dataset.storyHeading = ''
  heading.tabIndex = -1

  const chosen = story.choices.find(choice => choice.id === stories.completed[story.id])
  chapter.dataset.publishedChoice = chosen?.id ?? ''
  content.append(heading, element('p', story.body.replaceAll('{name}', () => state.name)))
  if (chosen) {
    const ending = element('p', chosen.ending.replaceAll('{name}', () => state.name), 'story-ending')
    ending.dataset.storyEnding = ''
    ending.tabIndex = -1
    const keepsakeLine = element('div', story.reward.symbol + ' Andenken: ' + story.reward.title, 'story-keepsake')
    const display = element('button', '', 'small-button story-display')
    display.type = 'button'
    display.dataset.storyDisplay = story.id
    content.append(ending, keepsakeLine, display)
  } else {
    const choices = element('div', '', 'story-choices')
    for (const choice of story.choices) {
      const button = element('button', choice.label, 'small-button')
      button.type = 'button'
      button.dataset.choice = choice.id
      choices.append(button)
    }
    content.append(choices)
  }
  chapter.dataset.dragonName = state.name
  chapter.append(art, content)
  return chapter
}

function renderStoryKeepsakeButtons() {
  for (const display of $('story-pages').querySelectorAll('[data-story-display]')) {
    const shown = keepsake === display.dataset.storyDisplay
    display.textContent = shown ? 'Aus dem Nest nehmen' : 'Im Nest zeigen'
    display.setAttribute('aria-pressed', String(shown))
  }
}

function continueStory() {
  if (!storyReading) return
  const pages = $('story-pages')
  const current = pages.lastElementChild?.dataset.storyPage
  if (!current || storyStatus(stories, current) !== 'complete') return
  const following = nextUnreadStory(stories, current)
  const note = $('story-continuation')
  note.hidden = !!following
  if (following) {
    pages.append(createStoryPage(following))
    $('story-reader-announcement').textContent = 'Die nächste Geschichte ist geöffnet. ' + following.title
  } else {
    note.textContent = countStories('locked')
      ? 'Neue Geschichten warten auf deine nächsten Entdeckungen.'
      : 'Du hast alle Geschichten gelesen.'
    $('story-reader-announcement').textContent = note.textContent
  }
}

function refreshStoryReader() {
  const pages = $('story-pages')
  for (const chapter of [...pages.children]) {
    const id = chapter.dataset.storyPage
    if (storyStatus(stories, id) === 'locked') {
      chapter.remove()
    } else if (chapter.dataset.publishedChoice !== (stories.completed[id] ?? '') ||
        chapter.dataset.dragonName !== state.name) {
      const containedFocus = chapter.contains(document.activeElement)
      const updated = createStoryPage(storyMap.get(id))
      chapter.replaceWith(updated)
      if (containedFocus) {
        const target = updated.querySelector('[data-story-ending]') ?? updated.querySelector('[data-story-heading]')
        target.focus({ preventScroll:true })
      }
    }
  }
  if (!pages.firstElementChild) {
    $('story-dialog').close()
    return
  }
  continueStory()
  renderStoryKeepsakeButtons()
}

function openStory(story, opener) {
  const status = storyStatus(stories, story.id)
  if (status === 'locked') return
  storyReading = status === 'ready'
  storyOpener = { id:story.id, featured:opener.closest('#book-feature') !== null }
  $('story-continuation').hidden = true
  $('story-reader-announcement').textContent = ''
  const chapter = createStoryPage(story)
  $('story-pages').replaceChildren(chapter)
  renderStoryKeepsakeButtons()
  const dialog = $('story-dialog')
  dialog.showModal()
  chapter.querySelector('[data-story-heading]').focus({ preventScroll:true })
  dialog.scrollTop = 0
}

$('view-nestbuch').addEventListener('click', event => {
  const button = event.target.closest('[data-story]')
  const story = button && storyMap.get(button.dataset.story)
  if (story) openStory(story, button)
})
$('story-pages').addEventListener('click', event => {
  const chapter = event.target.closest('[data-story-page]')
  if (!chapter) return
  const id = chapter.dataset.storyPage
  const choice = event.target.closest('[data-choice]')
  if (choice) {
    const result = chooseStory(stories, id, choice.dataset.choice)
    if (!result.ok) return
    stories = result.stories
    persist()
    renderBookLink()
    const completed = createStoryPage(storyMap.get(id))
    chapter.replaceWith(completed)
    continueStory()
    renderStoryKeepsakeButtons()
    completed.querySelector('[data-story-ending]').focus()
  } else if (event.target.closest('[data-story-display]') && storyStatus(stories, id) === 'complete') {
    keepsake = keepsake === id ? null : id
    persist()
    renderStoryKeepsakeButtons()
  }
})
$('close-story').addEventListener('click', () => $('story-dialog').close())
$('story-dialog').addEventListener('close', () => {
  if ($('story-dialog').open) return
  $('story-pages').replaceChildren()
  const opener = storyOpener
  storyOpener = null
  storyReading = false
  if (page !== 'nestbuch') return
  renderBook()
  const selector = opener && '[data-story="' + opener.id + '"]'
  const featured = opener?.featured ? $('book-feature').querySelector(selector) : null
  const card = opener && $('story-list').querySelector(selector)
  const focusTarget = featured ?? card ?? $('book-title')
  focusTarget.focus()
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
  if (state.progress.wins.includes(MISSIONS[0].id)) setGuide({ type:'won-first' })
  if (state.equipped.includes(FIRST_REWARD_ID)) setGuide({ type:'furnished' })
  const name = state.name
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
    title = 'Mir fehlt noch ein weicher Schlafplatz'
    note = 'Hilfst du mir? Im Kristallgarten finden wir Glutsterne für ein Mooskissen.'
    if (page === 'garten') {
      title = 'Öffne das Glutfeld'
      note = 'Im Glutfeld liegen die ersten Glutsterne. Gewinne eine Runde, dann können wir ein Mooskissen aufstellen.'
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
      ? 'Geschafft! Die Glutsterne aus dem Glutfeld gehören dir.'
      : resultNote + 'Oben siehst du das Ziel und deine Züge. Mit „Tipp“ findest du einen möglichen Tausch.'
    target = page === 'garten' && hasRound ? $('hint') : null
    action = ['Weiter', guideContinue]
  } else if (guide.step === 'win') {
    title = 'Sammle Glutsterne für unser Mooskissen'
    note = 'Gewinne eine Runde im Glutfeld. Auch nach einer verlorenen Runde kannst du es sofort wieder versuchen.'
    if (page === 'garten' && current?.missionId === MISSIONS[0].id) {
      place = $('guide-board-slot')
      if (hasRound) {
        note = 'Tausche weiter, bis du das Punkteziel oben erreicht hast.'
        other = ['Möglichen Tausch zeigen', () => showHint()]
      } else {
        action = ['Glutfeld erneut spielen', () => begin(MISSIONS[0].id)]
      }
    } else if (page === 'garten') {
      action = ['Glutfeld spielen', () => begin(MISSIONS[0].id)]
    } else {
      action = ['Zum Glutfeld', guideRoute('garten/abenteuer/glutfeld')]
    }
  } else if (guide.step === 'furnish') {
    const reward = rewardItemAction(state, FIRST_REWARD_ID)
    title = 'Ein Platz zum Einkuscheln'
    note = 'In der Sammlung kannst du das Mooskissen für dein Nest aufstellen.'
    if (reward.action === 'buy' && !reward.affordable) {
      note = 'Ein Mooskissen kostet ' + reward.cost + ' Glutsterne. Im Glutfeld kannst du weiter sammeln.'
      action = page === 'garten' ? ['Glutfeld spielen', () => begin(MISSIONS[0].id)] : ['Zum Glutfeld', guideRoute('garten/abenteuer/glutfeld')]
    } else if (page === 'sammlung') {
      target = $('shop-' + FIRST_REWARD_ID).querySelector('[data-shop]')
      action = [reward.action === 'buy' ? 'Mooskissen freischalten' : 'Mooskissen aufstellen', () => target.click()]
    } else {
      action = ['Zum Mooskissen', guideRoute('sammlung/mooskissen')]
    }
  } else if (guide.step === 'settle') {
    title = 'Komm, wir probieren es aus'
    note = 'Das Kissen liegt im Nest. Schau vorbei und sieh, wie ich mich hineinkuschle.'
    action = ['Kissen im Nest ansehen', guideRoute('nest/mooskissen')]
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
  $('guide-status').textContent = name
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
  if (!hasCushion) $('scene').classList.remove('is-settling')
  $('scene').classList.toggle('is-resting', mood.key === 'resting')
  $('scene').dataset.mood = mood.key
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
  const journey = nestJourney(state, mastery, lantern)
  $('nest-garden-link').href = journey.href
  $('quest-icon').innerHTML = icon(journey.icon)
  $('quest-title').textContent = journey.title
  $('quest-detail').textContent = journey.detail
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
  renderLantern()
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
  renderFurnishings()
  renderLayoutEditor()
}
function renderFurnishings() {
  const decor = $('den-decor')
  const equipped = NEST_FURNISHINGS.filter(item => state.equipped.includes(item.id))
  const signature = equipped.map(item => item.id).join(',')
  if (decor.dataset.items === signature) return
  clearFurnishingReaction()
  decor.dataset.items = signature
  decor.replaceChildren(...equipped.map(item => {
    const prop = element('div', '', 'den-prop')
    prop.dataset.furnishing = item.id
    prop.style.setProperty('--decor-x', item.x * 100 + '%')
    prop.style.setProperty('--decor-y', item.y * 100 + '%')
    prop.style.setProperty('--decor-width', item.width * 100 + '%')
    const visual = element('span', '', 'den-visual')
    visual.setAttribute('aria-hidden', 'true')
    if (item.id === FIRST_REWARD_ID) visual.id = 'scene-moss-cushion'
    const picture = element('img')
    picture.src = './' + item.asset
    picture.alt = ''
    visual.append(picture)
    const button = element('button', '', 'den-item')
    button.type = 'button'
    button.setAttribute('aria-label', item.action)
    button.dataset.decor = item.id
    button.dataset.layoutId = item.id
    prop.append(visual, button)
    return prop
  }))
}

const layoutDirections = { left:[-.04, 0], up:[0, -.04], down:[0, .04], right:[.04, 0] }
const layoutKeys = { ArrowLeft:'left', ArrowUp:'up', ArrowDown:'down', ArrowRight:'right' }

function visibleLayoutItems() {
  const propIds = state.equipped.map(id => [id, SHOP.find(item => item.id === id).label])
  const find = displayedFind(finds)
  if (find) propIds.push([find.id, find.name])
  if (selectedLanternLight(lantern)) propIds.push(['star-lantern', 'Sternenlaterne'])
  return propIds
}

function layoutElement(id) {
  return $('scene').querySelector('[data-layout-id="' + id + '"]')
}

function applyLayout(positions) {
  const scene = $('scene')
  for (const button of scene.querySelectorAll('[data-layout-id]')) {
    const id = button.dataset.layoutId
    const item = button.closest('.den-prop') ?? button
    const position = Object.hasOwn(positions, id) ? positions[id] : null
    item.classList.toggle('has-custom-position', !!position)
    const selected = layoutEditing && id === layoutSelected
    button.classList.toggle('layout-selected', selected)
    if (layoutEditing) button.setAttribute('aria-pressed', String(selected))
    else button.removeAttribute('aria-pressed')
    if (position) {
      item.style.setProperty('--layout-x', position.x * 100 + '%')
      item.style.setProperty('--layout-y', position.y * 100 + '%')
    } else {
      item.style.removeProperty('--layout-x')
      item.style.removeProperty('--layout-y')
    }
  }
  const lanternPosition = positions['star-lantern']
  if (lanternPosition && !$('scene-star-lantern').hidden) {
    scene.style.setProperty('--layout-light-x', lanternPosition.x * 100 + '%')
    scene.style.setProperty('--layout-light-y', lanternPosition.y * 100 + '%')
  } else {
    scene.style.removeProperty('--layout-light-x')
    scene.style.removeProperty('--layout-light-y')
  }
  const cushion = positions[FIRST_REWARD_ID]
  if (cushion) {
    scene.style.setProperty('--layout-cushion-x', cushion.x * 100 + '%')
    scene.style.setProperty('--layout-cushion-y', cushion.y * 100 + '%')
  } else {
    scene.style.removeProperty('--layout-cushion-x')
    scene.style.removeProperty('--layout-cushion-y')
  }
}

function renderLayoutEditor() {
  const items = visibleLayoutItems()
  if (!items.length && layoutEditing) {
    layoutEditing = false
    layoutDrag = null
  }
  $('scene').classList.toggle('layout-editing', layoutEditing)
  $('nest-layout-toggle').hidden = !items.length
  $('nest-layout-toggle').setAttribute('aria-expanded', String(layoutEditing))
  $('nest-layout-toggle').textContent = layoutEditing ? 'Fertig' : 'Nest gestalten'
  $('nest-layout-tools').hidden = !layoutEditing
  for (const id of ['pet', 'pet-label', 'scene-egg-button']) $(id).inert = layoutEditing
  const select = $('nest-layout-item')
  if (layoutEditing) {
    const signature = items.map(([id]) => id).join(',')
    if (select.dataset.items !== signature) {
      select.dataset.items = signature
      select.replaceChildren(...items.map(([id, name]) => new Option(name, id)))
    }
    if (!items.some(([id]) => id === layoutSelected)) layoutSelected = items[0][0]
    select.value = layoutSelected
    $('nest-layout-reset').disabled = !Object.hasOwn(nestLayout, layoutSelected)
  }
  applyLayout(layoutDrag?.draft ?? nestLayout)
}

function setLayoutEditing(active) {
  if (layoutDrag?.draft) suppressLayoutClick = true
  layoutDrag = null
  layoutEditing = active
  if (active) {
    clearFurnishingReaction()
    clearFindReaction()
    clearLanternReaction()
    $('scene').classList.remove('is-settling')
  }
  renderLayoutEditor()
  if (page !== 'nest') return
  if (active) $('nest-layout-item').focus()
  else $('nest-layout-toggle').focus()
}

function scenePoint(x, y) {
  const box = $('scene').getBoundingClientRect()
  return { x:(x - box.left) / box.width, y:(y - box.top) / box.height }
}

function currentLayoutPoint(id) {
  if (Object.hasOwn(nestLayout, id)) return furnishingPosition(nestLayout, id)
  const button = layoutElement(id)
  if (!button) return furnishingPosition(nestLayout, id)
  const visual = button.previousElementSibling?.classList.contains('den-visual') ? button.previousElementSibling : button
  const box = visual.getBoundingClientRect()
  return box.width && box.height ? scenePoint(box.left + box.width / 2, box.top + box.height / 2) : furnishingPosition(nestLayout, id)
}

function saveLayout(next) {
  if (next !== nestLayout) {
    nestLayout = next
    persist()
    const position = furnishingPosition(nestLayout, layoutSelected)
    $('nest-layout-status').textContent = $('nest-layout-item').selectedOptions[0].textContent + ' · ' +
      Math.round(position.x * 100) + '% von links, ' + Math.round(position.y * 100) + '% von oben.'
  }
  renderLayoutEditor()
}

function nudgeLayout(direction) {
  const [dx, dy] = layoutDirections[direction]
  const point = currentLayoutPoint(layoutSelected)
  if (point) saveLayout(moveFurnishing(nestLayout, layoutSelected, point.x + dx, point.y + dy))
}

$('nest-layout-toggle').addEventListener('click', () => setLayoutEditing(!layoutEditing))
$('nest-layout-item').addEventListener('change', event => {
  layoutSelected = event.target.value
  renderLayoutEditor()
})
$('nest-layout-arrows').addEventListener('click', event => {
  const button = event.target.closest('[data-layout-move]')
  if (button) nudgeLayout(button.dataset.layoutMove)
})
$('nest-layout-reset').addEventListener('click', () => {
  saveLayout(resetFurnishing(nestLayout, layoutSelected))
  $('nest-layout-item').focus({ preventScroll:true })
})
$('nest-layout-tools').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); setLayoutEditing(false) }
})
$('scene').addEventListener('keydown', event => {
  if (!layoutEditing) return
  if (event.key === 'Escape') { event.preventDefault(); setLayoutEditing(false); return }
  const item = event.target.closest('[data-layout-id]')
  const direction = layoutKeys[event.key]
  if (!item || !direction) return
  event.preventDefault()
  layoutSelected = item.dataset.layoutId
  nudgeLayout(direction)
})
$('scene').addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return
  suppressLayoutClick = false
  if (!layoutEditing) return
  const item = event.target.closest('[data-layout-id]')
  if (!item) return
  layoutSelected = item.dataset.layoutId
  renderLayoutEditor()
  layoutDrag = { id:layoutSelected, target:item, pointer:event.pointerId, x:event.clientX, y:event.clientY, origin:currentLayoutPoint(layoutSelected), draft:null }
})
$('scene').addEventListener('pointermove', event => {
  if (!layoutDrag || layoutDrag.pointer !== event.pointerId) return
  const dx = event.clientX - layoutDrag.x
  const dy = event.clientY - layoutDrag.y
  if (!layoutDrag.draft && Math.hypot(dx, dy) < 6) return
  if (!layoutDrag.draft && !layoutDrag.target.hasPointerCapture(event.pointerId)) {
    layoutDrag.target.setPointerCapture(event.pointerId)
  }
  const box = $('scene').getBoundingClientRect()
  layoutDrag.draft = moveFurnishing(nestLayout, layoutDrag.id, layoutDrag.origin.x + dx / box.width, layoutDrag.origin.y + dy / box.height)
  applyLayout(layoutDrag.draft)
})
function finishLayoutDrag(event) {
  if (!layoutDrag || layoutDrag.pointer !== event.pointerId) return
  if (event.type === 'lostpointercapture' && event.target !== layoutDrag.target) return
  const { draft, id } = layoutDrag
  layoutDrag = null
  if (draft) suppressLayoutClick = true
  if (event.type === 'pointerup' && draft) {
    layoutSelected = id
    const position = furnishingPosition(draft, id)
    saveLayout(moveFurnishing(nestLayout, id, position.x, position.y))
  } else renderLayoutEditor()
}
$('scene').addEventListener('pointerup', finishLayoutDrag)
$('scene').addEventListener('pointercancel', finishLayoutDrag)
$('scene').addEventListener('lostpointercapture', finishLayoutDrag)
$('scene').addEventListener('click', event => {
  if (event.detail && suppressLayoutClick) {
    suppressLayoutClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
    return
  }
  if (!layoutEditing) return
  event.preventDefault()
  event.stopImmediatePropagation()
  const item = event.target.closest('[data-layout-id]')
  if (item) {
    layoutSelected = item.dataset.layoutId
    renderLayoutEditor()
  } else if (event.detail && layoutSelected) {
    const point = scenePoint(event.clientX, event.clientY)
    saveLayout(moveFurnishing(nestLayout, layoutSelected, point.x, point.y))
  }
}, true)

function clearFurnishingReaction() {
  clearTimeout(furnishingFeedbackTimer)
  delete $('scene').dataset.decorReaction
  delete $('scene-companion').dataset.decorReaction
}

function showFurnishingReaction(item) {
  if (!item?.action || hatchTransition || !state.equipped.includes(item.id)) return
  clearLanternReaction()
  clearFindReaction()
  clearFurnishingReaction()
  clearTimeout(reactionTimer)
  clearTimeout(companionFeedbackTimer)
  const scene = $('scene')
  const baby = $('scene-companion')
  delete scene.dataset.action
  delete baby.dataset.reaction
  const resting = scene.classList.contains('is-resting') || scene.classList.contains('is-settling')
  $('pet-reaction').textContent = scene.classList.contains('is-resting') ? 'z z z' : ''
  void scene.offsetWidth
  scene.dataset.decorReaction = item.id
  if (item.id === FIRST_REWARD_ID) {
    if (!resting) scene.classList.add('is-settling')
    if (guide.step === 'settle') {
      setGuide({ type:'saw-cushion' })
      renderGuide()
    }
  }
  let message = resting ? state.name + ' schlummert im Nest.' : item.adult.replace('{name}', () => state.name)
  if (state.egg.stage === 'hatched') {
    baby.dataset.decorReaction = item.id
    message += ' ' + item.baby
  }
  furnishingFeedbackTimer = setTimeout(clearFurnishingReaction, 2300)
  tell(message)
}

function showFurnishingDestination(id) {
  const item = nestFurnishing(id)
  const prop = item && $('den-decor').querySelector('[data-decor="' + item.id + '"]')
  if (!prop) return
  prop.focus({ preventScroll:true })
  $('scene').scrollIntoView({ block:'nearest' })
  showFurnishingReaction(item)
}

$('den-decor').addEventListener('click', event => {
  const target = event.target.closest('[data-decor]')
  if (target) showFurnishingReaction(nestFurnishing(target.dataset.decor))
})

function react(action) {
  clearFurnishingReaction()
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
    clearLanternReaction()
    clearFindReaction()
    $('scene').classList.remove('is-settling')
    react(action)
  }
  const advancesGuide = result.ok && action === 'feed' && guide.status === 'active' && guide.step === 'feed'
  if (advancesGuide) setGuide({ type:'fed' })
  renderGuide(advancesGuide)
  tell(storyMessage(result.message, newStory))
}
function renderLantern() {
  const light = selectedLanternLight(lantern)
  const scene = $('scene')
  const button = $('scene-star-lantern')
  const choices = $('star-light-choices')
  button.hidden = !light
  $('star-lantern-panel').hidden = !light
  if (!light) {
    clearLanternReaction()
    delete scene.dataset.starLight
    return
  }
  if (scene.dataset.starLight !== light.id) clearLanternReaction()
  scene.dataset.starLight = light.id
  button.setAttribute('aria-label', 'Sternenlaterne den Drachen zeigen · ' + light.title)
  $('star-lantern-copy').textContent = light.description
  const available = availableLanternLights(lantern)
  const quests = $('star-light-quests')
  quests.hidden = available.length === Object.keys(LANTERN_LIGHTS).length
  const signature = available.map(item => item.id).join(',')
  if (choices.dataset.lights !== signature) {
    choices.dataset.lights = signature
    choices.replaceChildren(...available.map(item => {
      const choice = element('button', item.title, 'small-button')
      choice.type = 'button'
      choice.dataset.light = item.id
      return choice
    }))
  }
  for (const choice of choices.children) {
    choice.setAttribute('aria-pressed', String(choice.dataset.light === light.id))
  }
}

function clearLanternReaction() {
  clearTimeout(lanternFeedbackTimer)
  delete $('scene').dataset.lanternReaction
  delete $('scene-companion').dataset.lanternReaction
}

function showLanternReaction() {
  const light = selectedLanternLight(lantern)
  if (!light || hatchTransition) return
  clearFurnishingReaction()
  clearLanternReaction()
  clearFindReaction()
  clearTimeout(reactionTimer)
  clearTimeout(companionFeedbackTimer)
  const scene = $('scene')
  const baby = $('scene-companion')
  delete scene.dataset.action
  delete baby.dataset.reaction
  $('pet-reaction').textContent = scene.classList.contains('is-resting') ? 'z z z' : ''
  void scene.offsetWidth
  scene.dataset.lanternReaction = light.adult.kind
  const resting = scene.classList.contains('is-resting') || scene.classList.contains('is-settling')
  let message = resting ? state.name + ' schläft weiter im ' + light.title + '.' : light.adult.message.replaceAll('{name}', () => state.name)
  if (state.egg.stage === 'hatched') {
    baby.dataset.lanternReaction = light.baby.kind
    message += ' ' + light.baby.message
  }
  lanternFeedbackTimer = setTimeout(clearLanternReaction, 2450)
  tell(message)
}

function showStarDestination(lightId) {
  const garden = page === 'garten'
  if (garden && $('star-quests').hidden) return
  const target = garden ? $('star-quests-title') : $('scene-star-lantern')
  if (target.hidden) return
  target.focus({ preventScroll:true })
  target.scrollIntoView({ block:'nearest' })
  if (!garden) {
    const choice = selectLanternLight(lantern, lightId)
    if (choice !== lantern) {
      lantern = choice
      persist()
      renderLantern()
    }
    showLanternReaction()
  }
}

function renderLanternQuests() {
  $('star-quests').hidden = !lantern.unlocked
  if (!lantern.unlocked) return
  const list = $('star-quest-list')
  const signature = lantern.earned.join(',')
  if (list.dataset.earned !== signature) {
    list.dataset.earned = signature
    list.replaceChildren(...Object.values(LANTERN_LIGHTS).filter(light => light.goal).map(light => {
      const earned = lantern.earned.includes(light.id)
      const item = element('article', '', 'star-quest')
      item.dataset.light = light.id
      item.append(element('h4', light.title), element('p', earned ? 'Freigeschaltet · im Nest auswählbar' : light.goal.description))
      if (!earned) {
        const button = element('button', missionMap[light.goal.missionId].label + ' spielen', 'small-button')
        button.type = 'button'
        button.dataset.lightMission = light.goal.missionId
        item.append(button)
      }
      return item
    }))
  }
  for (const button of list.querySelectorAll('[data-light-mission]')) {
    const id = button.dataset.lightMission
    const running = state.round?.status === 'playing' && state.round.missionId === id
    button.dataset.restart = String(running && !lanternStatus(lantern, mastery, state))
    button.textContent = missionMap[id].label + (button.dataset.restart === 'true' ? ' neu starten' : running ? ' fortsetzen' : ' spielen')
  }
  $('star-quests-copy').textContent = Object.values(LANTERN_LIGHTS).every(light => !light.goal || lantern.earned.includes(light.id))
    ? 'Alle Lichter leuchten jetzt in deinem Nest.'
    : 'Schalte neue Lichter für die Sternenlaterne frei.'
}

$('scene-star-lantern').addEventListener('click', showLanternReaction)
$('star-light-choices').addEventListener('click', event => {
  const choice = event.target.closest('button[data-light]')
  if (!choice) return
  lantern = selectLanternLight(lantern, choice.dataset.light)
  persist()
  renderLantern()
  showLanternReaction()
})
$('star-quest-list').addEventListener('click', event => {
  const control = event.target.closest('[data-light-mission]')
  if (control) begin(control.dataset.lightMission, control.dataset.restart === 'true')
})

function renderNestFind() {
  const item = displayedFind(finds)
  const button = $('scene-find')
  button.hidden = !item
  if (item) button.dataset.layoutId = item.id
  else delete button.dataset.layoutId
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
  clearFurnishingReaction()
  clearLanternReaction()
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
  clearLanternReaction()
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
      nestLayout,
      find: item ? { id:item.id, label:item.name } : null,
      keepsake: reward || null,
      starLantern: selectedLanternLight(lantern),
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
    const art = '<img src="./' + nestFurnishing(item.id).asset + '" alt="" loading="lazy">'
    const destination = item.id === FIRST_REWARD_ID ? '#nest/mooskissen' : '#nest/einrichtung/' + item.id
    const view = equipped ? '<a class="small-button shop-view" href="' + destination + '" aria-label="' + item.label + ' im Nest ansehen">Im Nest ansehen</a>' : ''
    const spotlight = item.id === FIRST_REWARD_ID && location.hash === '#sammlung/mooskissen' ? ' reward-spotlight' : ''
    return '<article class="panel shop-card' + spotlight + '" id="shop-' + item.id + '"><div class="shop-art">' + art + '</div><h2>' + item.label + '</h2><span class="shop-slot">' + slotLabel[item.slot] + '</span><p>' + item.description + '</p><div class="shop-foot"><span>' + icon(owned ? 'check' : locked ? 'lock' : 'sparkles') + cost + '</span><button type="button" class="small-button" data-shop="' + item.id + '" aria-label="' + item.label + ': ' + action + '"' + (locked && !owned ? ' disabled' : '') + '>' + action + '</button>' + view + '</div></article>'
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
  $('mastery-reward-note').textContent = lantern.unlocked ? 'Die Sternenlaterne hängt in deinem Nest.' : 'Vier Sternabzeichen bringen dir eine Sternenlaterne fürs Nest.'
  renderLanternQuests()
  $('mastery-list').replaceChildren(...goals.map(mission => {
    const goal = MASTERY_GOALS[mission.id]
    const earned = mastery.earned.includes(mission.id)
    const row = element('li')
    row.append(element('strong', (earned ? '✦ ' : '') + mission.label + ' · ' + goal.title),
      element('span', earned ? 'Verdient' : goal.description))
    return row
  }))
}

const gardenRewards = {
  glutfeld: 'Glutsterne für dein erstes Mooskissen',
  mondbach: 'Bachkiesel fürs Nest',
  sternenhoehle: 'Ein Fund, den du im Nest wärmen kannst',
  gluehlichtung: 'Glutfeder fürs Nest',
}
const gardenIcons = { glutfeld:'flame', mondbach:'dew', sternenhoehle:'star', gluehlichtung:'sparkles' }

function renderMissions() {
  renderMasteryBook()
  const focusId = document.activeElement?.dataset.mission
  $('mission-list').innerHTML = MISSIONS.map((mission, index) => {
    const unlocked = isMissionUnlocked(state, mission.id)
    const won = state.progress.wins.includes(mission.id)
    const record = state.progress.records?.[mission.id]
    const gardenDetail = record ? 'Bestwert: ' + record.score + ' Punkte' : won ? 'Noch kein persönlicher Bestwert' : gardenRewards[mission.id]
    const medalGoal = won && MASTERY_GOALS[mission.id]
    const medalNote = medalGoal ? ' · ' + (mastery.earned.includes(mission.id) ? 'Abzeichen verdient' : 'Sternabzeichen möglich') : ''
    return '<button type="button" class="mission" data-mission="' + mission.id + '" ' + (unlocked ? '' : 'disabled ') + (state.round?.missionId === mission.id ? 'aria-current="true" ' : '') + '><span class="mission-index">' + (unlocked ? icon(gardenIcons[mission.id]) : icon('lock')) + '</span><span><strong>' + mission.label + '</strong><small>' + (unlocked ? describeGoal(mission) : mission.id === 'gluehlichtung' ? 'Nachdem Knöpfchen schlüpft' : 'Nach ' + MISSIONS[index - 1].label) + medalNote + '</small>' + (unlocked ? '<small class="mission-reward">' + gardenDetail + '</small>' : '') + '</span><span class="mission-end">' + icon(won ? 'check' : unlocked ? 'arrow' : 'lock') + '</span></button>'
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
      tile.innerHTML = '<span class="tile-crystal" aria-hidden="true">' + icon(tileIcon[id]) + '</span>' + (special ? '<span class="tile-special" aria-hidden="true">' + (special === 'burst' ? '✦' : special === 'row' ? '↔' : '↕') + '</span>' : '')
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
  $('round').dataset.mission = round?.missionId ?? ''
  $('round').parentElement.setAttribute('aria-labelledby', round ? 'active-round-title' : 'round-title')
  if (!round) return
  const mission = missionMap[round.missionId]
  $('active-round-title').textContent = mission.label
  $('moves-left').textContent = round.movesLeft
  const targets = Object.entries(mission.targetTiles).map(([id,n]) => [tileIcon[id], id, round.tiles[id], n, tileMap[id].label])
  if (mission.targetScore) targets.unshift(['sparkles', '', round.score, mission.targetScore, 'Punkte'])
  if (mission.targetSpecials) targets.push(['ray', '', round.activatedSpecials ?? 0, mission.targetSpecials, 'Gezündet'])
  $('round-goals').innerHTML = targets.map(([symbol,id,value,goal,label]) =>
    '<span class="goal" data-gem="' + id + '" data-complete="' + String(value >= goal) + '">' + icon(value >= goal ? 'check' : symbol) + label + ' <strong>' + Math.min(value, goal) + ' / ' + goal + '</strong><progress max="' + goal + '" value="' + Math.min(value, goal) + '" aria-label="' + label + '"></progress></span>').join('')
  drawBoard(round.board, round.specials)
  const masteryGoal = masteryStatus(mastery, state)
  $('mastery-current').hidden = !masteryGoal
  const medalProgress = masteryGoal?.goal.id === 'glutfeld'
    ? masteryGoal.progress + ' Züge übrig'
    : masteryGoal ? masteryGoal.progress + ' von ' + masteryGoal.target : ''
  $('mastery-current').textContent = masteryGoal ? masteryGoal.goal.title + ': ' + masteryGoal.goal.description + ' (' + medalProgress + ')' : ''
  const lightGoal = lanternStatus(lantern, mastery, state)
  $('star-goal-current').hidden = !lightGoal
  $('star-goal-current').textContent = lightGoal ? lightGoal.light.title + ' · ' + lightGoal.goal.unit + ': ' + lightGoal.progress + ' von ' + lightGoal.target + '. Gewinne die Runde.' : ''
  const done = round.status !== 'playing'
  $('board').classList.toggle('board-done', done)
  $('round-footer').hidden = done
  $('hint').disabled = done || playingAnimation
  $('round-result').hidden = !done
  if (done) {
    const won = round.status === 'won'
    const nextMission = MISSIONS[MISSIONS.indexOf(mission) + 1]
    const next = won && nextMission && isMissionUnlocked(state, nextMission.id) ? nextMission : null
    const text = !won ? 'Zwei Glutsterne nimmst du trotzdem mit.' : reward?.eggFound ? 'Du hast ein Drachenei gefunden! Im Nest kannst du es wärmen.' : reward ? 'Du hast ' + reward.glow + ' Glutsterne gesammelt.' : 'Dein Fortschritt und deine Belohnung sind gespeichert.'
    const find = won && FIND_ITEMS.find(item => item.missionId === mission.id && finds.owned.includes(item.id))
    const findLink = find ? '<div class="find-win"><img src="./' + find.asset + '" alt=""><div><strong>' + find.name + '</strong><a class="small-button" href="' + (finds.displayed === find.id ? '#nest/fund' : '#sammlung/funde') + '">' + (finds.displayed === find.id ? 'Fund im Nest ansehen' : 'Zu den Fundstücken') + '</a></div></div>' : ''
    const score = '<p class="round-score"><strong>' + round.score + ' Punkte</strong>' + (reward?.personalBest && !reward.firstWin ? ' Persönlicher Bestwert!' : '') + '</p>'
    const medal = reward?.medal ? '<p class="medal-win">✦ Sternabzeichen: ' + reward.medal.title + '</p>' : ''
    const newLight = reward?.light
    const showLanternLink = won && lantern.unlocked && (reward?.lanternUnlocked || newLight || !reward)
    const lanternLink = showLanternLink ? '<div class="star-reward"><strong>' + (newLight ? 'Neues Licht: ' + newLight.title : 'Sternenlaterne im Nest') + '</strong><a class="small-button" href="#nest/sterne' + (newLight ? '/' + newLight.id : '') + '">' + (newLight ? 'Neues Licht im Nest einschalten' : 'Zur Sternenlaterne') + '</a></div>' : ''
    const furnishing = firstRewardAction(state)
    const furnishingLink = furnishing ? '<a class="primary" href="#sammlung/mooskissen">' + furnishing.label + '</a>' : ''
    $('round-result').innerHTML = '<strong>' + (won ? 'Geschafft!' : 'Die Runde ist zu Ende.') + '</strong><p>' + text + '</p>' + score + medal + lanternLink + findLink + furnishingLink + (next ? '<button class="' + (furnishing ? 'small-button' : 'primary') + '" type="button" data-next="' + next.id + '">' + next.label + ' spielen</button>' : won && state.egg.stage === 'egg' ? '<a class="primary" href="#nest/ei">Zum Drachenei</a>' : '') + '<button class="small-button" type="button" data-retry="' + mission.id + '">Noch einmal</button>'
  }
}
function renderGarden() { renderMissions(); if (!playingAnimation) renderRound() }
function route(focusHeading = false) {
  const hash = location.hash.slice(1)
  const cushionRoute = hash === 'sammlung/mooskissen' || hash === 'nest/mooskissen'
  const furnitureRoute = hash.match(/^nest\/einrichtung\/([a-z-]+)$/)
  const findRoute = hash === 'sammlung/funde' || hash === 'nest/fund'
  const lightRoute = hash.match(/^nest\/sterne(?:\/([a-z]+))?$/)
  const starRoute = lightRoute || hash === 'garten/lichtsuche'
  const missionRoute = hash.match(/^garten\/abenteuer\/([a-z]+)$/)
  const journeyRoute = missionRoute || ['garten/fortsetzen', 'garten/abzeichen', 'nest/ei'].includes(hash)
  const requested = cushionRoute || furnitureRoute || findRoute || starRoute || journeyRoute ? hash.split('/')[0] : hash
  page = pages.includes(requested) ? requested : 'nest'
  if (page !== 'nestbuch' && $('story-dialog').open) $('story-dialog').close()
  for (const id of pages) {
    $('view-' + id).hidden = id !== page
    const nav = document.querySelector('[data-page="' + id + '"]')
    if (id === page) nav.setAttribute('aria-current','page')
    else nav.removeAttribute('aria-current')
  }
  if (page !== 'nest') {
    if (layoutEditing) setLayoutEditing(false)
    endHatch(false)
    clearFurnishingReaction()
    clearLanternReaction()
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
  renderGuide(focusHeading && !furnitureRoute && !cushionRoute && !findRoute && !starRoute && !journeyRoute)
  if (journeyRoute) showJourneyDestination(hash, missionRoute?.[1])
  if (cushionRoute) showCushionDestination()
  if (furnitureRoute && focusHeading) showFurnishingDestination(furnitureRoute[1])
  if (findRoute && focusHeading) showFindDestination()
  if (starRoute && focusHeading) showStarDestination(lightRoute?.[1])
}

function showJourneyDestination(hash, mission) {
  let target
  if (mission) target = $('mission-list').querySelector('[data-mission="' + mission + '"]')
  else if (hash === 'garten/fortsetzen' && state.round?.status === 'playing') target = $('active-round-title')
  else if (hash === 'nest/ei' && state.egg.stage === 'egg') target = $('scene-egg-button')
  else if (hash === 'garten/abzeichen' && !$('mastery-guide').hidden) {
    $('mastery-guide').open = true
    target = $('mastery-summary')
  }
  if (!target || target.disabled) return
  target.focus({ preventScroll:true })
  target.scrollIntoView({ block:'nearest' })
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
  showFurnishingDestination(FIRST_REWARD_ID)
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
    $('round').scrollIntoView({ block:'start', behavior:'instant' })
    return
  }
  if (state.round?.status === 'playing') {
    if (!await confirm('Ein neues Abenteuer?', 'Damit endet deine offene Runde im ' + missionMap[state.round.missionId].label + '.', 'Neu beginnen')) return
  }
  const result = startRound(state, id)
  if (!result.ok) { tell(result.message); return }
  state = result.state
  mastery = beginMasteryRound(mastery, state)
  lantern = beginLanternRound(lantern, mastery, state)
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
function animateSwap(from, to, accepted) {
  if (settings.quiet || reduceMotion.matches || typeof tiles[from].animate !== 'function') return false
  for (const [start, end] of [[from, to], [to, from]]) {
    const tile = tiles[start]
    const a = tile.getBoundingClientRect()
    const b = tiles[end].getBoundingClientRect()
    const x = b.left - a.left
    const y = b.top - a.top
    const frames = [{ transform: 'none' }, { transform: 'translate(' + x + 'px,' + y + 'px)' }]
    if (!accepted) frames.push(frames[0])
    tile.querySelector('.tile-crystal')?.animate(frames, { duration: accepted ? 105 : 210, easing: 'ease-in-out' })
  }
  return true
}
function flashUnmatchedPair(from, to) {
  if (animateSwap(from, to, false)) return
  $('board-help').textContent = 'Diese Kombination passt noch nicht. Suche drei gleiche Kristalle in einer Reihe.'
}
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
    flashUnmatchedPair(from, index)
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
  const hadLantern = lantern.unlocked
  const light = recordLanternMove(lantern, mastery, state, result.summary)
  lantern = light.lantern
  const lanternUnlocked = !hadLantern && lantern.unlocked
  const previousGuideStep = guide.step
  setGuide({ type:'move-committed', from, to:index })
  if (previousGuideStep === 'pair' && guide.step === 'reward') guideMatchPoints = result.summary.score
  if (state.progress.wins.includes(MISSIONS[0].id)) setGuide({ type:'won-first' })
  const cleared = result.frames.flatMap(frame => frame.cleared.map(i => frame.before[i]))
  const newStory = storyEvent({ type:'match', cleared, chains:result.summary.chains, activatedSpecials:result.summary.activatedSpecials })
  persist()
  wallet()
  if (animate && animateSwap(from, index, true)) await wait(105)
  if (animate && page === 'garten') for (const frame of result.frames.slice(0, 3)) {
    drawBoard(frame.before, frame.beforeSpecials, frame.cleared)
    await wait(120)
    drawBoard(frame.after, frame.afterSpecials, [], true)
    await wait(150)
    if (page !== 'garten') break
  }
  playingAnimation = false
  if (page === 'garten') {
    renderMissions()
    renderRound({ ...result.summary, medal:medal.earned, lanternUnlocked, light:light.earned })
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
      $('round-result').scrollIntoView({ block:'nearest', behavior:'instant' })
    }
  }
  if (page === 'nest') renderNest()
  if (page === 'nestbuch') renderBook()
  if (page === 'sammlung') renderShop()
  renderGuide(previousGuideStep !== guide.step)
  let message = result.message
  if (discovery.discovered) message += ' Gefunden: ' + discovery.discovered.name + '.'
  if (medal.earned) message += ' Sternabzeichen: ' + medal.earned.title + '.'
  if (lanternUnlocked) message += ' Die Sternenlaterne leuchtet jetzt in deinem Nest.'
  if (light.earned) message += ' Neues Laternenlicht: ' + light.earned.title + '.'
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
  if (result.ok && state.equipped.includes(id)) {
    if (id === FIRST_REWARD_ID) {
      setGuide({ type:'furnished' })
      renderGuide()
    }
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
  clearFurnishingReaction()
  if (state.egg.stage === 'hatched') {
    const baby = $('scene-companion')
    clearFindReaction()
    clearLanternReaction()
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
  clearFurnishingReaction()
  clearFindReaction()
  clearLanternReaction()
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
  if ($('story-dialog').open) refreshStoryReader()
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
