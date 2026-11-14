export const STORIES = [
  {
    id: 'erste-glut',
    title: 'Die erste kleine Glut',
    teaser: 'Verbring einen Moment mit deinem Drachen und schau, was passiert.',
    art: 'nest',
    body: '{name} stupst deine Hand an. Im selben Moment löst sich ein winziger Funke von seiner Schwanzspitze und bleibt zwischen euch in der Luft stehen.',
    choices: [
      { id: 'hueten', label: 'Die Hand schützend darum halten', ending: 'Der Funke wärmt deine Hand, dann schwebt er ins Nest. Dein Drache rückt ein kleines Stück näher.' },
      { id: 'fliegen', label: 'Den Funken fliegen lassen', ending: 'Der Funke zieht einen Bogen durch die Höhle. Dein Drache blinzelt ihm nach, bis er wie ein winziger Stern verlischt.' },
    ],
    reward: { symbol: '✦', title: 'Erster Funke' },
  },
  {
    id: 'mooskissen',
    title: 'Ein Platz für zwei',
    teaser: 'Hol das Mooskissen aus der Sammlung und kuschle mit deinem Drachen.',
    art: 'nest',
    body: '{name} dreht sich dreimal auf dem Mooskissen. Dann schiebt er es mit der Nase zur Seite und macht ein bisschen Platz für dich.',
    choices: [
      { id: 'bleiben', label: 'Mich dazusetzen', ending: 'Kaum sitzt du, liegt schon eine warme Drachenschnauze auf deinem Knie. Die nächste Weile bewegt sich nur noch sein Schwanz.' },
      { id: 'decke', label: 'Eine Decke heranziehen', ending: 'Unter der Decke wird es so gemütlich, dass dein Drache im Schlaf mit einer Pfote nach deinem Ärmel greift.' },
    ],
    reward: { symbol: '❧', title: 'Weiches Moos' },
  },
  {
    id: 'laternenlicht',
    title: 'Das Licht bleibt an',
    teaser: 'Hol die Glühwürmchenlaterne aus der Sammlung und lass deinen Drachen schlafen.',
    art: 'nest',
    body: 'In der Laterne blinken drei Lichter. Kurz bevor {name} einschläft, antwortet seine Schwanzspitze mit einem eigenen kleinen Blinken.',
    choices: [
      { id: 'zaehlen', label: 'Die Lichter mit ihm zählen', ending: 'Bei drei hebt er die Schnauze. Bei vier fallen ihm die Augen zu. Bei fünf zählst du allein.' },
      { id: 'summen', label: 'Ein Schlaflied summen', ending: 'Die Lichter blinken langsamer. Dein Drache rollt sich ein, und das Summen verstummt erst, als er gleichmäßig atmet.' },
    ],
    reward: { symbol: '✶', title: 'Laternenschein' },
  },
  {
    id: 'regenmelodie',
    title: 'Das Lied vom Mondbach',
    teaser: 'Sammle im Kristallgarten Blätter und Tautropfen. Sie müssen nicht im selben Zug fallen.',
    art: 'garden',
    body: '{name} legt ein Blatt auf einen flachen Stein. Ein Tautropfen fällt darauf, und der Mondbach klingt plötzlich wie eine leise Spieluhr.',
    choices: [
      { id: 'lauschen', label: 'Leise zuhören', ending: 'Beim letzten Ton schlägt der Drache mit dem Schwanz auf den Boden. Der Bach antwortet mit einem letzten hellen Pling.' },
      { id: 'takten', label: 'Den Takt mitklopfen', ending: 'Dein Drache steigt sofort ein. Er ist ein bisschen zu schnell, und irgendwann müsst ihr beide über euer schiefes Duett lachen.' },
    ],
    reward: { symbol: '♪', title: 'Bachmelodie' },
  },
  {
    id: 'kristallregen',
    title: 'Als die Kristalle tanzten',
    teaser: 'Löse im Kristallgarten eine Kettenreaktion aus.',
    art: 'garden',
    body: 'Die ersten Kristalle fallen, dann gleich noch einmal. {name} spannt die Flügel auf, als könnte er den ganzen funkelnden Regen auffangen.',
    choices: [
      { id: 'staunen', label: 'Mit nach oben schauen', ending: 'Ihr zählt die letzten Lichtpunkte. Dein Drache bleibt noch einen Moment mit offenen Flügeln sitzen, obwohl längst alles still ist.' },
      { id: 'auffangen', label: 'Einen Lichtpunkt auffangen', ending: 'Du erwischst einen winzigen Splitter. Dein Drache schiebt ihn in eine Felsspalte, wo er wie eine kleine Lampe weiterglimmt.' },
    ],
    reward: { symbol: '✧', title: 'Kristallsplitter' },
  },
  {
    id: 'waldleuchten',
    title: 'Wenn der Wald aufleuchtet',
    teaser: 'Aktiviere im Kristallgarten einen besonderen Kristall.',
    art: 'garden',
    body: 'Vom besonderen Kristall läuft ein Licht über den Boden und bis in die Baumkronen. Für einen Atemzug sind selbst die fernsten Äste zu sehen.',
    choices: [
      { id: 'winken', label: 'Den Lichtern nachwinken', ending: 'Aus der Ferne blinkt ein Licht zurück. Vielleicht war es nur ein Glühwürmchen. Dein Drache winkt jedenfalls noch einmal.' },
      { id: 'zeichnen', label: 'Das Muster ins Moos zeichnen', ending: 'Dein Drache drückt die letzte Linie mit dem Schwanz ins Moos. So könnt ihr euch später erinnern, wie das Licht durch den Wald lief.' },
    ],
    reward: { symbol: '✴', title: 'Waldlicht' },
  },
  {
    id: 'sternenspur',
    title: 'Der Weg aus Sternen',
    teaser: 'Schließe die Sternenhöhle ab und sieh dich dort nach einem Ei um.',
    art: 'garden',
    body: 'Tief in der Höhle führt eine Spur aus Sternenstaub zu einer Mulde. Dort liegt ein warmes Ei. {name} senkt die Nase, bis sein Atem die Schale beschlägt.',
    choices: [
      { id: 'tragen', label: 'Das Ei behutsam nach Hause tragen', ending: 'Dein Drache läuft voraus und schiebt unterwegs jeden Kiesel aus dem Weg. Im Nest legt er sich neben das Ei und hält Wache.' },
      { id: 'gruessen', label: 'Dem Ei leise Hallo sagen', ending: 'Aus dem Ei kommt ein kaum hörbares Klopfen. Dein Drache antwortet mit einem leisen Brummen und weicht dir auf dem Heimweg nicht von der Seite.' },
    ],
    reward: { symbol: '⋆', title: 'Sternenstaub' },
  },
  {
    id: 'kleines-knacken',
    title: 'Ein winziges Knacken',
    teaser: 'Wärme das Ei, bis Knöpfchen schlüpft.',
    art: 'baby',
    body: 'Erst wackelt das Ei, dann fliegt ein Stück Schale davon. Knöpfchen streckt eine Pfote heraus und versucht, sie mit der Nase zu fangen.',
    choices: [
      { id: 'pfote', label: 'Einen Finger hinhalten', ending: 'Knöpfchen hält deinen Finger mit beiden Vorderpfoten fest. Der große Drache schaut so stolz zu, als hätte er diesen Händedruck geübt.' },
      { id: 'anfeuern', label: 'Knöpfchen leise anfeuern', ending: 'Knöpfchen blinzelt, stemmt sich hoch und purzelt ins Moos. Dann ist das Nest voller Drachenschnaufen und leiser, vergnügter Laute.' },
    ],
    reward: { symbol: '♡', title: 'Erste Eierschale' },
  },
  {
    id: 'erste-flugstunde',
    title: 'Die erste Flugstunde',
    teaser: 'Spiel nach dem Schlüpfen mit Knöpfchen.',
    art: 'baby',
    body: 'Beim Spielen flattert Knöpfchen einem Glühfunken hinterher. {name} sieht zu, wie das Kleine auf eine Wurzel klettert und beide Flügel ausbreitet.',
    choices: [
      { id: 'kissen', label: 'Unter der Wurzel warten', ending: 'Knöpfchen springt, flattert zweimal und landet in deinen Händen. Für Knöpfchen war das ganz bestimmt schon Fliegen.' },
      { id: 'vormachen', label: 'Mit den Armen mitflattern', ending: 'Zwei kleine Flügel und zwei große Arme rudern um die Wette. Knöpfchen hüpft herunter und landet mit einem unerwartet stolzen Plumps.' },
    ],
    reward: { symbol: '↟', title: 'Mutiger Hüpfer' },
  },
  {
    id: 'mondblumennacht',
    title: 'Wenn die Mondblumen aufgehen',
    teaser: 'Hol die Mondblumen aus der Sammlung und lass deinen Drachen schlafen, wenn Knöpfchen da ist.',
    art: 'baby',
    body: 'Neben dem schlafenden Drachen öffnet sich die erste Mondblume. Knöpfchen versucht, das Licht in der Blüte mit einer Pfote zu berühren.',
    choices: [
      { id: 'zeigen', label: 'Die Blüte mit Knöpfchen betrachten', ending: 'Knöpfchen legt den Kopf schief. In der Blüte spiegelt sich für einen Moment die ganze kleine Drachenschnauze.' },
      { id: 'fluestern', label: 'Knöpfchen die Geschichte der Blume zuflüstern', ending: 'Noch bevor die Geschichte zu Ende ist, schläft Knöpfchen neben dem großen Drachen. Die Blüte leuchtet weiter, bis beide tief atmen.' },
    ],
    reward: { symbol: '❀', title: 'Mondblüte' },
  },
  {
    id: 'lichtungsschatz',
    title: 'Was auf der Lichtung blieb',
    teaser: 'Schließe nach Knöpfchens Schlüpfen die Glühlichtung ab.',
    art: 'garden',
    body: 'In der Mitte der Lichtung liegt ein Stein mit zwei winzigen Mulden. {name} legt eine Pfote hinein. Knöpfchen passt mit beiden Vorderpfoten in die andere.',
    choices: [
      { id: 'mitnehmen', label: 'Einen Kiesel als Andenken mitnehmen', ending: 'Der Kiesel kommt ins Nest. Knöpfchen stupst ihn später im Schlaf an, als würde es den Weg zurück zur Lichtung träumen.' },
      { id: 'dalassen', label: 'Den Stein für den nächsten Besuch dortlassen', ending: 'Ihr zeichnet mit einem Zweig einen kleinen Kreis ins Moos. Knöpfchen setzt mitten hinein einen krummen Pfotenabdruck.' },
    ],
    reward: { symbol: '◈', title: 'Abdruck im Moos' },
  },
]

const CARE_ACTIONS = ['feed', 'play', 'cuddle', 'rest', 'greet']
const TILE_TYPES = ['ember', 'leaf', 'moon', 'dew', 'star', 'bloom']
const STORY_BY_ID = new Map(STORIES.map(story => [story.id, story]))

function knownValues(values, allowed) {
  if (!Array.isArray(values)) return []
  return allowed.filter(value => values.includes(value))
}

function completedChoices(input) {
  return Object.fromEntries(STORIES.flatMap(story => {
    const choice = input?.[story.id]
    return story.choices.some(option => option.id === choice) ? [[story.id, choice]] : []
  }))
}

function discoveryRules(stories, petState) {
  const owns = id => petState?.owned?.includes(id) === true
  const won = id => petState?.progress?.wins?.includes(id) === true
  const seen = action => stories.seenCare.includes(action)
  const babySeen = action => stories.seenAfterHatch.includes(action)
  const hatched = petState?.egg?.stage === 'hatched'
  return {
    'erste-glut': stories.seenCare.some(action => action !== 'greet'),
    mooskissen: owns('moss-cushion') && seen('cuddle'),
    laternenlicht: owns('firefly-lantern') && seen('rest'),
    regenmelodie: stories.matched.includes('dew') && stories.matched.includes('leaf'),
    kristallregen: stories.cascadeMax >= 2,
    waldleuchten: stories.specialSeen,
    sternenspur: won('sternenhoehle'),
    'kleines-knacken': hatched,
    'erste-flugstunde': hatched && (stories.babyPlayed || (babySeen('greet') && babySeen('play'))),
    mondblumennacht: hatched && owns('moon-flowers') && babySeen('rest'),
    lichtungsschatz: hatched && won('gluehlichtung'),
  }
}

function revealStories(stories, petState) {
  const unlocked = discoveryRules(stories, petState)
  const revealed = STORIES.map(story => story.id).filter(id =>
    stories.revealed.includes(id) || Object.hasOwn(stories.completed, id) || unlocked[id]
  )
  return { ...stories, revealed }
}

export function normalizeStories(input, petState) {
  const cascadeMax = Number.isSafeInteger(input?.cascadeMax) ? Math.max(0, Math.min(input.cascadeMax, 10)) : 0
  return revealStories({
    seenCare: knownValues(input?.seenCare, CARE_ACTIONS),
    seenAfterHatch: knownValues(input?.seenAfterHatch, CARE_ACTIONS),
    matched: knownValues(input?.matched, TILE_TYPES),
    cascadeMax,
    specialSeen: input?.specialSeen === true,
    babyPlayed: input?.babyPlayed === true && petState?.egg?.stage === 'hatched',
    completed: completedChoices(input?.completed),
    revealed: knownValues(input?.revealed, STORIES.map(story => story.id)),
  }, petState)
}

export function recordStoryEvent(stories, petState, event) {
  const current = normalizeStories(stories, petState)
  if (event?.type === 'care' && CARE_ACTIONS.includes(event.action)) {
    current.seenCare = knownValues([...current.seenCare, event.action], CARE_ACTIONS)
    if (petState?.egg?.stage === 'hatched') {
      current.seenAfterHatch = knownValues([...current.seenAfterHatch, event.action], CARE_ACTIONS)
    }
  }
  if (event?.type === 'baby-play' && petState?.egg?.stage === 'hatched') current.babyPlayed = true
  if (event?.type === 'match') {
    const cleared = knownValues(event.cleared, TILE_TYPES)
    if (Number.isSafeInteger(event.activatedSpecials) && event.activatedSpecials > 0) current.specialSeen = true
    current.matched = knownValues([...current.matched, ...cleared], TILE_TYPES)
    if (Number.isSafeInteger(event.chains)) {
      current.cascadeMax = Math.max(current.cascadeMax, Math.min(event.chains, 10))
    }
  }
  return revealStories(current, petState)
}

export function storyStatus(stories, storyId) {
  if (!STORY_BY_ID.has(storyId)) return 'locked'
  if (Object.hasOwn(stories?.completed ?? {}, storyId)) return 'complete'
  return stories?.revealed?.includes(storyId) ? 'ready' : 'locked'
}

export function nextUnreadStory(stories, afterStoryId) {
  const start = STORIES.findIndex(story => story.id === afterStoryId) + 1
  const readingOrder = [...STORIES.slice(start), ...STORIES.slice(0, start)]
  return readingOrder.find(story => storyStatus(stories, story.id) === 'ready') ?? null
}

export function chooseStory(stories, storyId, choiceId) {
  const story = STORY_BY_ID.get(storyId)
  const choice = story?.choices.find(option => option.id === choiceId)
  if (!choice || storyStatus(stories, storyId) !== 'ready') {
    return { stories, ok: false, message: 'Dieser Nestmoment ist noch nicht verfügbar oder bereits festgehalten.' }
  }
  return {
    stories: { ...stories, completed: { ...stories.completed, [storyId]: choiceId } },
    ok: true,
    message: 'Ein neuer Moment steht im Nestbuch.',
  }
}
