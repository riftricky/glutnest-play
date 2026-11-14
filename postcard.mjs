import { SHOP } from './game.mjs'

const WIDTH = 1200
const HEIGHT = 825
const SCENE = { x: 37, y: 36, width: 1126, height: 649 }

const artFiles = {
  nest: 'nest.webp',
  awake: 'dragon-awake.webp',
  rest: 'dragon-sleep.webp',
  cuddle: 'dragon-blink.webp',
  egg: 'dragon-egg.webp',
  cracks: 'egg-cracks.svg',
  cushion: 'moss-cushion.webp',
  'river-pebble': 'find-river-pebble.webp',
  'ember-feather': 'find-ember-feather.webp',
}

const findNames = { 'river-pebble': 'Bachkiesel', 'ember-feather': 'Glutfeder' }
const decorById = new Map(SHOP.map(item => [item.id, item]))

const poses = {
  awake: 'awake',
  rest: 'rest',
  cuddle: 'cuddle',
}

const decorPoints = [[.22, .63], [.82, .55], [.78, .31], [.24, .31]]

const decorPaths = {
  'firefly-lantern': 'M8 5h8l2 4v10H6V9zM9 5V3h6v2M6 9h12m-12 8h12m-6-6c-1 1-2 2-2 3a2 2 0 0 0 4 0c0-1-1-2-2-3z',
  'moon-flowers': 'M12 9c-4-7 4-8 4-2 6-3 7 5 1 6 4 5-2 9-5 4-3 5-9 1-5-4-6-1-5-9 1-6 0-6 8-5 4 2Z M14 13a2 2 0 1 1-4 0 2 2 0 1 1 4 0',
  'star-mobile': 'M12 2l3 6.4 7 .9-5.1 5 1.1 7-6-3.3-6 3.3 1.1-7L2 9.3l7-.9z',
  'cloud-blanket': 'M7 19h11a4 4 0 1 0-.5-8 6 6 0 0 0-11.6 1A3.5 3.5 0 0 0 7 19Z',
  'comet-rug': 'M21 8a5 5 0 1 1-10 0 5 5 0 1 1 10 0M13 12l-9 9m5-11-5 5m11-1-5 6',
}

function loadArt(key) {
  const url = new URL('./assets/' + artFiles[key], import.meta.url)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Die Illustration für die Postkarte konnte nicht geladen werden.'))
    image.src = url.href
  })
}

function roundedPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function imageFit(ctx, image, x, y, width, height, cover = false, alignY = .5) {
  const scale = (cover ? Math.max : Math.min)(width / image.width, height / image.height)
  const drawnWidth = image.width * scale
  const drawnHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) * alignY, drawnWidth, drawnHeight)
}

function centered(ctx, image, x, y, width, height, shadow = false) {
  ctx.save()
  if (shadow) {
    ctx.shadowColor = '#21131f9e'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 6
  }
  imageFit(ctx, image, x - width / 2, y - height / 2, width, height)
  ctx.restore()
}

function tintBaby(image) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  imageFit(ctx, image, 0, 0, 256, 256)
  // CanvasRenderingContext2D.filter is unavailable in some Safari versions.
  // The SVG hue rotation matrix matches the CSS tint in the interactive nest.
  const pixels = ctx.getImageData(0, 0, 256, 256)
  const data = pixels.data
  const angle = 318 * Math.PI / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const matrix = [
    .213 + .787 * cos - .213 * sin, .715 - .715 * cos - .715 * sin, .072 - .072 * cos + .928 * sin,
    .213 - .213 * cos + .143 * sin, .715 + .285 * cos + .140 * sin, .072 - .072 * cos - .283 * sin,
    .213 - .213 * cos - .787 * sin, .715 - .715 * cos + .715 * sin, .072 + .928 * cos + .072 * sin,
  ]
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue
    const red = data[i]
    const green = data[i + 1]
    const blue = data[i + 2]
    data[i] = matrix[0] * red + matrix[1] * green + matrix[2] * blue
    data[i + 1] = matrix[3] * red + matrix[4] * green + matrix[5] * blue
    data[i + 2] = matrix[6] * red + matrix[7] * green + matrix[8] * blue
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas
}

function drawDecor(ctx, ids) {
  const emblems = ids.filter(id => decorPaths[id])
  emblems.forEach((id, i) => {
    const [x, y] = decorPoints[i]
    const radius = 31
    ctx.save()
    ctx.translate(SCENE.x + SCENE.width * x, SCENE.y + SCENE.height * y)
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#35243be6'
    ctx.fill()
    ctx.strokeStyle = '#d5a88b99'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.translate(-16, -16)
    ctx.scale(32 / 24, 32 / 24)
    ctx.strokeStyle = '#fcd3b4'
    ctx.lineWidth = 1.65
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke(new Path2D(decorPaths[id]))
    ctx.restore()
  })
}

function drawShadow(ctx, x, y, width, height) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(width / 2, height / 2)
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  shadow.addColorStop(0, '#221420aa')
  shadow.addColorStop(1, '#22142000')
  ctx.fillStyle = shadow
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}

function drawScene(ctx, art, state) {
  ctx.save()
  roundedPath(ctx, SCENE.x, SCENE.y, SCENE.width, SCENE.height, 25)
  ctx.clip()
  imageFit(ctx, art.nest, SCENE.x, SCENE.y, SCENE.width, SCENE.height, true, .57)

  const x = SCENE.x + SCENE.width * .5
  const y = SCENE.y + SCENE.height * .81
  const companionX = SCENE.x + SCENE.width * .758
  const companionY = SCENE.y + SCENE.height * .835
  const findX = SCENE.x + SCENE.width * .265
  const findY = SCENE.y + SCENE.height * .84

  if (art.cushion) {
    centered(ctx, art.cushion, x, y - 4, 464, 244, true)
  }
  drawDecor(ctx, state.equipped)
  if (art.find) {
    drawShadow(ctx, findX, findY + 2, 130, 32)
    centered(ctx, art.find, findX, findY - 62, 147, 132, true)
  }

  drawShadow(ctx, x, y + 4, 340, 72)
  centered(ctx, art.adult, x, y - (art.cushion ? 206 : 194), 425, 425, true)

  if (state.egg === 'hatched') {
    drawShadow(ctx, companionX, companionY, 146, 36)
    centered(ctx, tintBaby(art.baby), companionX, companionY - 79, 164, 164, true)
  } else if (state.egg === 'egg') {
    drawShadow(ctx, companionX, companionY + 2, 132, 34)
    centered(ctx, art.egg, companionX, companionY - 75, 162, 162, true)
    if (art.cracks) {
      ctx.save()
      if (state.warmth === 1) {
        ctx.beginPath()
        ctx.rect(companionX - 46, companionY - 156, 88, 70)
        ctx.clip()
        ctx.globalAlpha = .75
      }
      centered(ctx, art.cracks, companionX, companionY - 75, 162, 162)
      ctx.restore()
    }
  }

  const vignette = ctx.createLinearGradient(0, SCENE.y + SCENE.height * .88, 0, SCENE.y + SCENE.height)
  vignette.addColorStop(0, '#21172800')
  vignette.addColorStop(1, '#201722a0')
  ctx.fillStyle = vignette
  ctx.fillRect(SCENE.x, SCENE.y, SCENE.width, SCENE.height)
  ctx.restore()

  ctx.strokeStyle = '#ae7d8199'
  ctx.lineWidth = 2.5
  roundedPath(ctx, SCENE.x, SCENE.y, SCENE.width, SCENE.height, 25)
  ctx.stroke()
}

function drawCard(ctx, art, state) {
  const paper = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  paper.addColorStop(0, '#3a293c')
  paper.addColorStop(1, '#221827')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.strokeStyle = '#bc889667'
  ctx.lineWidth = 1.5
  roundedPath(ctx, 16, 16, WIDTH - 32, HEIGHT - 32, 35)
  ctx.stroke()
  drawScene(ctx, art, state)

  ctx.fillStyle = '#ffe8d8'
  ctx.font = 'italic 49px Georgia, serif'
  ctx.fillText(state.egg === 'hatched' ? state.name + ' & Knöpfchen' : state.name + ' im Waldnest', 57, 746, 792)

  const captions = [
    state.findName && 'Fund: ' + state.findName,
    state.keepsakeTitle && 'Andenken: ' + state.keepsakeTitle,
  ].filter(Boolean)

  ctx.fillStyle = '#e5c1cc'
  ctx.font = '23px system-ui, sans-serif'
  ctx.fillText(captions.join('   ·   ') || 'Eine Postkarte aus dem Flüsterwald', 60, 781, 730)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#fac3a4'
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.fillText('GLUTNEST  ✦', WIDTH - 59, 782)
}

function normalize(options) {
  const name = typeof options.name === 'string' ? options.name.trim().slice(0, 80) : ''
  const pose = Object.hasOwn(poses, options.pose) ? poses[options.pose] : poses.awake
  const equipped = Array.isArray(options.equipped)
    ? [...new Set(options.equipped)].filter(id => decorById.has(id)).slice(0, decorPoints.length)
    : []
  const egg = ['locked', 'egg', 'hatched'].includes(options.egg) ? options.egg : 'locked'
  const warmth = options.warmth === 1 || options.warmth === 2 ? options.warmth : 0
  const findId = Object.hasOwn(findNames, options.find?.id) ? options.find.id : null
  const keepsakeTitle = typeof options.keepsake?.title === 'string' ? options.keepsake.title.trim().slice(0, 100) : ''
  return { name: name || 'Fünkchen', pose, equipped, egg, warmth, findId, findName: findNames[findId], keepsakeTitle }
}

export async function renderPostcard(options = {}) {
  const state = normalize(options)
  const resources = [['nest', 'nest'], ['adult', state.pose]]
  if (state.equipped.includes('moss-cushion')) resources.push(['cushion', 'cushion'])
  if (state.findId) resources.push(['find', state.findId])
  if (state.egg === 'hatched') resources.push(['baby', 'awake'])
  if (state.egg === 'egg') {
    resources.push(['egg', 'egg'])
    if (state.warmth) resources.push(['cracks', 'cracks'])
  }

  const art = Object.fromEntries(await Promise.all(resources.map(async ([key, source]) => [key, await loadArt(source)])))
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Dieser Browser kann die Postkarte gerade nicht erstellen.')
  drawCard(ctx, art, state)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(image => {
      if (image) resolve(image)
      else reject(new Error('Die PNG-Datei konnte nicht erstellt werden.'))
    }, 'image/png')
  })
  const details = [
    state.name,
    state.egg === 'hatched' ? 'Knöpfchen' : state.egg === 'egg' ? 'Drachenei' : '',
    ...state.equipped.map(id => decorById.get(id).label),
    state.findName,
    state.keepsakeTitle,
  ].filter(Boolean)
  return { blob, filename: 'glutnest-postkarte.png', alt: 'Postkarte aus dem Waldnest mit ' + details.join(', ') + '.' }
}

function postcardFile(result) {
  return new File([result.blob], result.filename, { type: 'image/png' })
}

export function canSharePostcard(result) {
  try {
    return typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function'
      && navigator.canShare({ files: [postcardFile(result)] })
  } catch {
    return false
  }
}

export function sharePostcard(result) {
  // Call directly from a click handler after the PNG preview exists.
  return navigator.share({ files: [postcardFile(result)] })
}
