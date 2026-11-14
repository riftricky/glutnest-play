export function companionReaction(state, repeatIndex = 0) {
  if (state.egg?.stage !== 'hatched') return null

  if (repeatIndex % 2 === 0) {
    return {
      kind: 'flap',
      message: 'Knöpfchen flattert einem Funken hinterher. Nach zwei Flügelschlägen landet es wieder im Moos.',
    }
  }

  return {
    kind: 'peek',
    message: 'Knöpfchen duckt sich ins Moos. Einen Moment später schaut die kleine Schnauze wieder hervor.',
  }
}
