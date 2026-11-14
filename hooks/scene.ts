// Black Hole: a dark sky with one black hole in the upper right, away from the words in the middle.
// A tilted disk of glowing gas turns around a black circle; its far side shows bent over the top as a ring of light.
// Once a minute a small ship drifts in, circles the hole faster and faster, stretches and falls in.
// Pure string building, gradients only (no filters), so it needs no GPU.

const WIDTH = 1600
const HEIGHT = 1000
const HOLE_X = 1120
const HOLE_Y = 320
const SHADOW = 92
const TILT = -14
const FLAT = 0.26

/** A repeatable number in [0, 1): every build draws the same sky. */
function makeRandom(seed: number): () => number {
  let state = seed

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0

    return (state >>> 0) / 4294967296
  }
}

function soft(id: string, color: string, peak: number): string {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${peak}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
}

/** The stars, in three groups that twinkle at their own pace. None sit on the hole. */
function stars(): string {
  const random = makeRandom(20261114)
  const groups = ['', '', '']
  const tints = ['#ffffff', '#cfe0ff', '#ffe6c4']

  for (let i = 0; i < 170; i++) {
    const x = random() * WIDTH
    const y = random() * HEIGHT
    const size = 0.6 + random() * random() * 2.2
    const tint = tints[Math.floor(random() * tints.length)]
    const opacity = 0.35 + random() * 0.55

    if (Math.hypot(x - HOLE_X, y - HOLE_Y) < 215) {
      continue
    }
    groups[i % 3] += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${size.toFixed(1)}" fill="${tint}" opacity="${opacity.toFixed(2)}"/>`
  }

  return groups.map((dots, i) => `<g class="twinkle t${i}">${dots}</g>`).join('')
}

/**
 * The gas is not smooth: it churns, and clumps of it flare and fade as they go round, the inner ones faster and whiter,
 * the outer ones slower and redder. Soft blobs only, each on its own orbit with its own flicker.
 */
function turbulence(): string {
  const random = makeRandom(8128)
  let blobs = ''

  for (let i = 0; i < 24; i++) {
    const radius = 120 + random() * 200
    const paint = radius < 170 ? 'clumpHot' : radius < 245 ? 'clumpMid' : 'clumpRed'
    const across = 12 + random() * 20
    const along = 46 + random() * 70
    const start = random() * 360
    const orbit = 26 * Math.pow(radius / 140, 1.5)
    const flicker = 2.4 + random() * 3.8

    blobs += `<g transform="rotate(${start.toFixed(0)})"><g class="orb" style="animation-duration:${orbit.toFixed(1)}s"><ellipse class="flick" cx="${radius.toFixed(0)}" cy="0" rx="${across.toFixed(0)}" ry="${along.toFixed(0)}" fill="url(#${paint})" style="animation-duration:${flicker.toFixed(1)}s;animation-delay:-${(random() * 6).toFixed(1)}s"/></g></g>`
  }

  return blobs
}

/** The ring of bent light is uneven too: brighter patches drift round it and waver. */
function ringShimmer(): string {
  const random = makeRandom(496)
  let patches = ''

  for (let i = 0; i < 6; i++) {
    const start = i * 60 + random() * 30
    const size = 30 + random() * 22
    const orbit = 44 + random() * 30
    const flicker = 3 + random() * 3.5

    patches += `<g transform="rotate(${start.toFixed(0)})"><g class="orb" style="animation-duration:${orbit.toFixed(1)}s"><circle class="flick" cx="${SHADOW + 20}" cy="0" r="${size.toFixed(0)}" fill="url(#${i % 2 === 0 ? 'clumpMid' : 'clumpRed'})" style="animation-duration:${flicker.toFixed(1)}s;animation-delay:-${(random() * 6).toFixed(1)}s"/></g></g>`
  }

  return patches
}

/** The disk of gas, seen from straight above; the caller tilts and flattens it. Drawn twice: behind the hole and in front. */
function disk(): string {
  return `<g transform="scale(1 ${FLAT})">
<circle r="340" fill="url(#disk)"/>
<circle class="spin s1" r="140" fill="none" stroke="#fff1cf" stroke-width="10" stroke-dasharray="60 30 120 50" stroke-linecap="round" opacity="0.55"/>
<circle class="spin s2" r="185" fill="none" stroke="#ffc56b" stroke-width="14" stroke-dasharray="90 70 30 110" stroke-linecap="round" opacity="0.5"/>
<circle class="spin s3" r="235" fill="none" stroke="#ff8a3c" stroke-width="16" stroke-dasharray="140 90 60 120" stroke-linecap="round" opacity="0.42"/>
<circle class="spin s4" r="292" fill="none" stroke="#e0501c" stroke-width="14" stroke-dasharray="200 160" stroke-linecap="round" opacity="0.3"/>
${turbulence()}
<g class="fall"><circle cx="310" cy="0" r="9" fill="#fff4dc"/></g>
<g class="fall f2"><circle cx="-300" cy="40" r="7" fill="#ffd9a0"/></g>
<g class="fall f3"><circle cx="60" cy="-320" r="8" fill="#ffe9c9"/></g>
</g>`
}

const SHIP_CYCLE_SECONDS = 60
const SHIP_ACTIVE = 0.8

/**
 * One trip of the ship as keyframes: it drifts in from off the right edge, circles the hole in the plane of the disk,
 * faster as it nears, then stretches and drops in. Only transforms and opacity, like every other motion here.
 */
function plungeKeyframes(): string {
  const steps = 2400
  const turns = 2.6
  const radiusAt = (u: number): number => 40 + 680 * (1 - Math.pow(u, 1.5))
  // How far round it has gone by each moment: it turns faster the nearer it is.
  const swept: number[] = [0]

  for (let i = 1; i <= steps; i++) {
    swept.push(swept[i - 1] + Math.pow(Math.max(90, radiusAt((i - 0.5) / steps)), -1.2))
  }
  const angleAt = (u: number): number => {
    const at = Math.min(steps, Math.max(0, u * steps))
    const low = Math.floor(at)
    const high = Math.min(steps, low + 1)
    const part = swept[low] + (swept[high] - swept[low]) * (at - low)

    return (-turns * 2 * Math.PI * part) / swept[steps]
  }
  const placeAt = (u: number): { x: number; y: number } => {
    const radius = radiusAt(u)
    const angle = angleAt(u)

    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) * FLAT }
  }

  // A frame at every twelfth of a turn, and a few evenly through the slow start.
  const moments = new Set<number>()

  for (let i = 0; i <= 40; i++) {
    moments.add(i / 40)
  }
  let last = 0

  for (let i = 1; i <= steps; i++) {
    const angle = Math.abs(angleAt(i / steps))

    if (angle - last >= Math.PI / 6) {
      moments.add(i / steps)
      last = angle
    }
  }

  let heading = 0
  let frames = ''
  let end = ''

  for (const u of [...moments].sort((a, b) => a - b)) {
    const here = placeAt(u)
    const ahead = placeAt(Math.min(1, u + 0.0005))
    const behind = placeAt(Math.max(0, u - 0.0005))
    const raw = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI

    // Keep the turn going the same way from frame to frame, never the long way round.
    heading = raw + Math.round((heading - raw) / 360) * 360
    const near = here.y > 0 ? 1.12 : 0.9
    const size = (1.5 - 0.9 * u) * near
    const pull = u > 0.92 ? Math.pow((u - 0.92) / 0.08, 2) : 0
    const opacity = Math.min(1, u / 0.04, (1 - u) / 0.03)
    const transform = `translate(${here.x.toFixed(1)}px,${here.y.toFixed(1)}px) rotate(${heading.toFixed(1)}deg) scale(${(size * (1 + 2.4 * pull)).toFixed(3)},${(size * (1 - 0.8 * pull)).toFixed(3)})`

    frames += `${(u * SHIP_ACTIVE * 100).toFixed(2)}%{transform:${transform};opacity:${Math.max(0, opacity).toFixed(2)}}`
    end = transform
  }

  return `@keyframes plunge{${frames}100%{transform:${end};opacity:0}}`
}

/** The ship, nose toward +x: a small original craft with swept wings, a blue canopy and a pale engine flame. */
function ship(): string {
  return `<g class="ship">
<ellipse cx="-38" cy="0" rx="22" ry="5" fill="url(#flame)"/>
<path d="M-2 -7 L-17 -19 L-24 -19 L-17 -8Z M-2 7 L-17 19 L-24 19 L-17 8Z" fill="#8f98ab"/>
<path d="M32 0 L10 -7.5 L-18 -8.5 L-25 -4 L-25 4 L-18 8.5 L10 7.5Z" fill="#dfe4ee"/>
<path d="M24 -1.6 L12 -4.6 L8 0 L12 4.6 L24 1.6Z" fill="#6fd0ff"/>
<rect x="-14" y="-1.2" width="18" height="2.4" fill="#ff7a3c"/>
</g>`
}

export function blackHoleSvg(): string {
  const style = `
.twinkle{animation:twinkle 7s ease-in-out infinite alternate}
.t1{animation-duration:11s;animation-delay:-3s}
.t2{animation-duration:16s;animation-delay:-8s}
.spin{animation:spin 26s linear infinite}
.s2{animation-duration:38s}
.s3{animation-duration:56s}
.s4{animation-duration:80s}
.fall{animation:fall 22s ease-in infinite}
.f2{animation-duration:29s;animation-delay:-9s}
.f3{animation-duration:35s;animation-delay:-20s}
.lens{animation:spin 300s linear infinite}
.glow{animation:breathe 12s ease-in-out infinite alternate}
.nebula{animation:breathe 40s ease-in-out infinite alternate}
.orb{animation:spin 30s linear infinite}
.flick{opacity:0.5;animation:flick 4s ease-in-out infinite alternate}
.ship{opacity:0;animation:plunge ${SHIP_CYCLE_SECONDS}s linear infinite}
${plungeKeyframes()}
@keyframes twinkle{from{opacity:0.45}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes fall{from{transform:rotate(0deg) scale(1);opacity:0}10%{opacity:0.9}80%{opacity:0.8}to{transform:rotate(-620deg) scale(0.3);opacity:0}}
@keyframes flick{0%{opacity:0.12}28%{opacity:0.85}52%{opacity:0.3}78%{opacity:1}100%{opacity:0.2}}
@keyframes breathe{from{opacity:0.6}to{opacity:1}}
@media (prefers-reduced-motion: reduce){*{animation:none !important}}`

  const defs = `
<linearGradient id="space" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07061a"/><stop offset="0.6" stop-color="#04040e"/><stop offset="1" stop-color="#020207"/></linearGradient>
${soft('violet', '#6a4cff', 0.2)}${soft('teal', '#2aa8c8', 0.12)}${soft('warm', '#ff8a3c', 0.26)}${soft('hot', '#fff0d0', 0.55)}${soft('clumpHot', '#fff6e0', 0.75)}${soft('clumpMid', '#ffae45', 0.7)}${soft('clumpRed', '#ff3d14', 0.6)}
<radialGradient id="disk"><stop offset="0.3" stop-color="#fff3d6" stop-opacity="0"/><stop offset="0.36" stop-color="#fff3d6" stop-opacity="0.95"/><stop offset="0.52" stop-color="#ffb347" stop-opacity="0.7"/><stop offset="0.76" stop-color="#ff5a1f" stop-opacity="0.32"/><stop offset="1" stop-color="#7a1a08" stop-opacity="0"/></radialGradient>
<radialGradient id="halo"><stop offset="0.58" stop-color="#ffe2b0" stop-opacity="0"/><stop offset="0.64" stop-color="#fff0d0" stop-opacity="0.95"/><stop offset="0.74" stop-color="#ff9a3c" stop-opacity="0.5"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="calm" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#000" stop-opacity="0.14"/><stop offset="0.6" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<clipPath id="front"><rect x="-420" y="0" width="840" height="260"/></clipPath>
<clipPath id="near"><rect x="-900" y="0" width="1800" height="400"/></clipPath>
<radialGradient id="flame"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.4" stop-color="#9fd8ff" stop-opacity="0.7"/><stop offset="1" stop-color="#4f8cff" stop-opacity="0"/></radialGradient>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><style>${style}</style><defs>${defs}</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#space)"/>
<ellipse class="nebula" cx="80" cy="960" rx="620" ry="380" fill="url(#violet)"/>
<ellipse class="nebula" cx="200" cy="60" rx="520" ry="260" fill="url(#teal)" style="animation-delay:-15s"/>
<ellipse class="nebula" cx="1560" cy="940" rx="480" ry="300" fill="url(#teal)" style="animation-delay:-25s"/>
${stars()}
<g transform="translate(${HOLE_X} ${HOLE_Y})">
<circle class="glow" r="430" fill="url(#warm)"/>
<circle class="lens" r="188" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="7 190 3 240 9 150 4 210" stroke-linecap="round" opacity="0.55"/>
<g transform="rotate(${TILT})">${disk()}</g>
<g transform="rotate(${TILT})">${ship()}</g>
<circle r="150" fill="url(#halo)"/>
${ringShimmer()}
<circle class="glow" cx="-104" cy="14" r="80" fill="url(#hot)" opacity="0.5"/>
<circle r="${SHADOW}" fill="#000"/>
<circle r="${SHADOW + 2}" fill="none" stroke="#fff4dc" stroke-width="2.5" opacity="0.85"/>
<g transform="rotate(${TILT})" clip-path="url(#front)">${disk()}</g>
<g transform="rotate(${TILT})" clip-path="url(#near)">${ship()}</g>
</g>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#calm)"/>
</svg>`
}
