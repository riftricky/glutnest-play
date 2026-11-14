// Coordinates are relative to the scene, measured to each sprite's center.
export const NEST_FURNISHINGS = [
  {
    id:'moss-cushion', asset:'assets/moss-cushion.webp', x:.50, y:.77, width:.46, layer:'ground',
    action:'Auf das Mooskissen tippen',
    adult:'{name} rollt sich auf dem Mooskissen zusammen.',
    baby:'Knöpfchen stupst das Moos mit der Schnauze an.',
  },
  {
    id:'cloud-blanket', asset:'assets/cloud-blanket.webp', x:.43, y:.74, width:.32, layer:'ground',
    action:'An der Wolkendecke schnuppern',
    adult:'{name} senkt die Schnauze in die weichen Falten.',
    baby:'Knöpfchen drückt die Vorderpfoten in die Decke.',
  },
  {
    id:'comet-rug', asset:'assets/comet-rug.webp', x:.51, y:.77, width:.54, layer:'ground',
    action:'Auf dem Kometenteppich spielen',
    adult:'{name} tippt mit einer Pfote auf die gestickte Kometenspur.',
    baby:'Knöpfchen hüpft der Spur hinterher.',
  },
  {
    id:'firefly-lantern', asset:'assets/firefly-lantern.webp', x:.81, y:.54, width:.18, layer:'prop',
    action:'Glühwürmchenlaterne antippen',
    adult:'{name} folgt den Glühwürmchen im Glas mit den Augen.',
    baby:'Knöpfchen wippt im goldenen Licht.',
  },
  {
    id:'moon-flowers', asset:'assets/moon-flowers.webp', x:.14, y:.61, width:.16, layer:'prop',
    action:'Die Mondblumen zeigen',
    adult:'{name} schnuppert an der nächsten Mondblume.',
    baby:'Knöpfchen neigt den Kopf zu den Blüten.',
  },
  {
    id:'star-mobile', asset:'assets/star-mobile.webp', x:.62, y:.22, width:.20, layer:'prop',
    action:'Sternenmobile anstoßen',
    adult:'{name} hebt den Kopf und schaut den schaukelnden Sternen nach.',
    baby:'Knöpfchen streckt die Vorderpfoten zu den Sternen hoch.',
  },
]

export function nestFurnishing(id) {
  return NEST_FURNISHINGS.find(item => item.id === id)
}
