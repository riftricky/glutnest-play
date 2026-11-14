export const FIND_ITEMS = [
  {
    id: 'river-pebble',
    missionId: 'mondbach',
    name: 'Bachkiesel',
    asset: 'assets/find-river-pebble.webp',
    description: 'Ein rund geschliffener Kiesel mit einer hellen Welle aus dem Mondbach.',
    reaction: {
      adult: { kind: 'sniff', message: '{name} schnuppert am Bachkiesel und legt den Kopf schief.' },
      baby: { kind: 'nudge', message: 'Knöpfchen stupst den Kiesel mit der Nase an. Er kullert ein kleines Stück.' },
    },
  },
  {
    id: 'ember-feather',
    missionId: 'gluehlichtung',
    name: 'Glutfeder',
    asset: 'assets/find-ember-feather.webp',
    description: 'Eine kupferfarbene Feder, die auf der Glühlichtung zwischen den Kristallen lag.',
    reaction: {
      adult: { kind: 'wonder', message: '{name} hebt die Schnauze und schaut der schimmernden Feder nach.' },
      baby: { kind: 'flutter', message: 'Knöpfchen flattert, bis die Glutfeder im Luftzug wippt.' },
    },
  },
]

export function normalizeFinds(savedFinds, state) {
  const wonMissions = new Set(state.progress.wins)
  const owned = FIND_ITEMS.filter(find => wonMissions.has(find.missionId)).map(find => find.id)
  const displayed = owned.includes(savedFinds?.displayed) ? savedFinds.displayed : null
  return { owned, displayed }
}

export function recordGardenFind(previousFinds, state) {
  const finds = normalizeFinds(previousFinds, state)
  const missionId = state.round?.status === 'won' ? state.round.missionId : null
  const discovered = FIND_ITEMS.find(find =>
    find.missionId === missionId && finds.owned.includes(find.id) && !previousFinds.owned.includes(find.id)
  ) ?? null

  if (discovered && previousFinds.owned.length === 0) {
    return { finds: setDisplayedFind(finds, discovered.id), discovered }
  }
  return { finds, discovered }
}

export function setDisplayedFind(finds, id) {
  if (id === finds.displayed || (id !== null && !finds.owned.includes(id))) return finds
  return { ...finds, displayed: id }
}

export function displayedFind(finds) {
  return FIND_ITEMS.find(find => find.id === finds.displayed) ?? null
}
