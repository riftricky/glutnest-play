import { NEST_FURNISHINGS } from './decor.mjs'

const assetRatios = {
  'moss-cushion': 342 / 640,
  'cloud-blanket': 283 / 464,
  'comet-rug': 152 / 576,
  'firefly-lantern': 437 / 336,
  'moon-flowers': 386 / 400,
  'star-mobile': 454 / 410,
}

// The postcard is wider than the interactive scene. Keep the whole sprite in both.
const widestSceneRatio = 1126 / 649
const sceneProps = new Map(NEST_FURNISHINGS.map(item => [
  item.id,
  { x: item.x, y: item.y, width: item.width, ratio: assetRatios[item.id] },
]))
sceneProps.set('river-pebble', { x: .25, y: .74, width: .17, ratio: 1 })
sceneProps.set('ember-feather', { x: .25, y: .74, width: .17, ratio: 1 })
sceneProps.set('star-lantern', { x: .835, y: .29, width: .20, ratio: 1 })

function clampCoordinate(value, margin) {
  // Round inward at the edges so the serialized value stays in bounds on reload.
  const precision = 10_000
  const minimum = Math.ceil((margin - Number.EPSILON) * precision)
  return Math.min(precision - minimum, Math.max(minimum, Math.round(value * precision))) / precision
}

function validPosition(item, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  const xMargin = item.width / 2 + .012
  const yMargin = Math.max(.15, item.width * item.ratio * widestSceneRatio / 2 + .012)
  return { x: clampCoordinate(x, xMargin), y: clampCoordinate(y, yMargin) }
}

export function normalizeLayout(saved) {
  const layout = {}
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return layout
  for (const [id, item] of sceneProps) {
    if (!Object.hasOwn(saved, id)) continue
    const position = saved[id]
    if (!position || !Object.hasOwn(position, 'x') || !Object.hasOwn(position, 'y')) continue
    const safe = validPosition(item, position.x, position.y)
    if (safe) layout[id] = safe
  }
  return layout
}

export function furnishingPosition(layout, id) {
  const item = sceneProps.get(id)
  if (!item) return null
  const saved = layout && Object.hasOwn(layout, id) ? layout[id] : null
  const { x, y } = saved ?? item
  return { x, y }
}

export function moveFurnishing(layout, id, x, y) {
  const item = sceneProps.get(id)
  const position = item && validPosition(item, x, y)
  if (!position) return layout
  const previous = layout && Object.hasOwn(layout, id) ? layout[id] : null
  if (previous?.x === position.x && previous.y === position.y) return layout
  return { ...layout, [id]: position }
}

export function resetFurnishing(layout, id) {
  if (!sceneProps.has(id) || !layout || !Object.hasOwn(layout, id)) return layout
  const next = { ...layout }
  delete next[id]
  return next
}
