// The desktop's sky: a dithered cloud field drawn in WebGL behind every window.
// Ported from the TinyMails site (site/src/scripts/sky.ts) and changed for a desktop:
// each app names a scene and the field eases into it over about a second, and the
// clouds thin out around the window in front, so the sky parts behind what you read.
//
// Two passes. The clouds are worked out once per dot cell into a small texture
// (an 8x8 ordered dither decides which cells take the next colour up), then the
// full size pass draws each cell as a round cornered dot. Without WebGL the canvas
// is never added and the workspace keeps its gradient wallpaper. Under reduced
// motion the clouds hold still and only scene changes redraw.

export type SceneId = 'night' | 'stake' | 'earn' | 'propr' | 'fanbase' | 'trigr'

type Scene = {
  // four levels, darkest first; the last one only ever shows as sparse dots
  pal: [string, string, string, string]
  cover: number
  contrast: number
  scale: number
  calm: number
}

// One accent across the site, so every scene stays in the violet family. The
// products lean a few degrees towards their own colour, never further.
export const SCENES: Record<SceneId, Scene> = {
  // the workspace: a slow violet night, clouds gathering low and to the sides
  night: { pal: ['#09090d', '#110f1d', '#1e1940', '#6656d8'], cover: -0.04, contrast: 1.8, scale: 1.35, calm: 0.42 },
  // Stake holds money, so its sky is the calmest: darker, thinner, almost still
  stake: { pal: ['#08080c', '#0e0d19', '#191534', '#4a3eae'], cover: -0.1, contrast: 1.6, scale: 1.7, calm: 0.5 },
  // Earn is still empty, a little brighter than Stake
  earn: { pal: ['#08080c', '#100e1c', '#1d1a3c', '#5a4cc4'], cover: -0.1, contrast: 1.7, scale: 1.5, calm: 0.46 },
  // Propr leans blue
  propr: { pal: ['#08090e', '#0d101d', '#161d3c', '#3c4fae'], cover: -0.12, contrast: 1.7, scale: 1.35, calm: 0.46 },
  // FanBase leans magenta
  fanbase: { pal: ['#0a080d', '#120d1b', '#231536', '#7a3ea6'], cover: -0.12, contrast: 1.7, scale: 1.35, calm: 0.46 },
  // Trigr leans teal
  trigr: { pal: ['#08090c', '#0c1118', '#12242e', '#2f7a8c'], cover: -0.12, contrast: 1.7, scale: 1.35, calm: 0.46 },
}

type Params = { pal: number[][]; cover: number; contrast: number; scale: number; calm: number }

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const params = (s: Scene): Params => ({ pal: s.pal.map(hex), cover: s.cover, contrast: s.contrast, scale: s.scale, calm: s.calm })
const ease = (from: number, to: number, k: number) => from + (to - from) * k

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'

// pass 1, one fragment per dot cell: the cloud value, cut into four levels by an 8x8 ordered dither
const CLOUDS = `precision highp float;
uniform vec2 uGrid; uniform float uTime; uniform float uDrift; uniform float uScale; uniform float uCover; uniform float uContrast;
uniform float uCalm; uniform vec4 uWin;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * n(p); p = r * p * 2.03 + 11.7; a *= 0.5; } return v; }
float b2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float b8(vec2 a){ return (b2(0.25*a)*0.25 + b2(0.5*a))*0.25 + b2(a); }
void main(){
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 uv = (cell + 0.5) / uGrid.y;                    // square units, 1 = the screen's height, y up
  float y = (cell.y + 0.5) / uGrid.y;
  vec2 p = uv * uScale + vec2(uTime * 0.014, -uDrift * 0.3 * uScale);
  vec2 w = vec2(fbm(p + vec2(0.0, uTime * 0.008)), fbm(p + vec2(5.2, 1.3) - uTime * 0.01));
  float v = fbm(p + 1.4 * w);
  // clouds settle towards the bottom of the screen, where the dock sits
  v = (v - 0.5) * uContrast + 0.5 + uCover + 0.22 * (0.5 - y);
  // the window in front: a rounded box (centre, half size) the clouds thin out around
  vec2 q = abs(uv - uWin.xy) - uWin.zw;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  v -= uCalm * (1.0 - smoothstep(-0.06, 0.26, d));
  float lv = clamp(v, 0.0, 0.999) * 3.0;
  float base = floor(lv);
  float on = step(b8(cell), fract(lv));
  gl_FragColor = vec4(base / 3.0, on, 0.0, 1.0);
}`

// pass 2, every screen pixel: its cell's level, drawn as a dot of the next colour up on the level's own colour
const DOTS = `precision highp float;
uniform sampler2D uLevels; uniform vec2 uGrid; uniform float uCell; uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
vec3 pal(float i){ return i < 0.5 ? uC0 : i < 1.5 ? uC1 : i < 2.5 ? uC2 : uC3; }
void main(){
  vec2 g = gl_FragCoord.xy / uCell;
  vec4 L = texture2D(uLevels, (floor(g) + 0.5) / uGrid);
  float base = floor(L.r * 3.0 + 0.5);
  vec2 q = abs(fract(g) - 0.5);
  float d = length(max(q - 0.18, 0.0)) + min(max(q.x, q.y) - 0.18, 0.0);
  float m = 1.0 - smoothstep(0.2 - 0.7 / uCell, 0.2 + 0.7 / uCell, d);
  gl_FragColor = vec4(mix(pal(base), pal(min(base + 1.0, 3.0)), L.g * m), 1.0);
}`

export type SkyController = {
  setScene: (id: SceneId) => void
  setDrift: (value: number) => void
  destroy: () => void
}

// The window the clouds part around: an open app window if there is one, else the chat.
function frontWindow(root: HTMLElement): DOMRect | null {
  const open = [...root.querySelectorAll<HTMLElement>('.window[role="dialog"] .window-frame')]
  const pick = open.find((el) => el.closest('[data-front="true"]')) ?? open[open.length - 1]
  const el = pick ?? root.querySelector<HTMLElement>('.window-xborg .window-frame')
  const rect = el?.getBoundingClientRect()
  return rect && rect.width > 0 ? rect : null
}

export function createSky(canvas: HTMLCanvasElement, root: HTMLElement, initial: SceneId): SkyController | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' })
  if (!gl) return null
  const reducedQ = window.matchMedia('(prefers-reduced-motion: reduce)')

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  const program = (frag: string) => {
    const p = gl.createProgram()!
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag))
    gl.bindAttribLocation(p, 0, 'p')
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link')
    return p
  }
  let clouds: WebGLProgram
  let dots: WebGLProgram
  try {
    clouds = program(CLOUDS)
    dots = program(DOTS)
  } catch {
    return null
  }

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  for (const [k, v] of [
    [gl.TEXTURE_MIN_FILTER, gl.NEAREST],
    [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ])
    gl.texParameteri(gl.TEXTURE_2D, k, v)
  const fbo = gl.createFramebuffer()
  const u = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name)
  const U = {
    grid: u(clouds, 'uGrid'),
    time: u(clouds, 'uTime'),
    drift: u(clouds, 'uDrift'),
    scale: u(clouds, 'uScale'),
    cover: u(clouds, 'uCover'),
    contrast: u(clouds, 'uContrast'),
    calm: u(clouds, 'uCalm'),
    win: u(clouds, 'uWin'),
    dGrid: u(dots, 'uGrid'),
    cell: u(dots, 'uCell'),
    levels: u(dots, 'uLevels'),
    c: [u(dots, 'uC0'), u(dots, 'uC1'), u(dots, 'uC2'), u(dots, 'uC3')],
  }

  let W = 0
  let H = 0
  let GW = 0
  let GH = 0
  let cellPx = 0
  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const css = rect.width < 640 ? 3.5 : 4 // one dot cell, in CSS pixels
    W = Math.max(1, Math.round(rect.width * dpr))
    H = Math.max(1, Math.round(rect.height * dpr))
    cellPx = css * dpr
    GW = Math.ceil(W / cellPx)
    GH = Math.ceil(H / cellPx)
    canvas.width = W
    canvas.height = H
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GW, GH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  // current values ease towards the target scene and the front window every frame
  let target = params(SCENES[initial])
  const now = params(SCENES[initial])
  let win = [0, 0, 0, 0]
  let winTarget = [0, 0, 0, 0]
  let drift = 0
  let driftTarget = 0
  let settled = false

  const readWindow = () => {
    const r = frontWindow(root)
    const box = canvas.getBoundingClientRect()
    if (!r || !box.height) {
      winTarget = [-10, -10, 0, 0] // nothing in front: the calm zone leaves the screen
      return
    }
    const s = 1 / box.height
    const cx = (r.left + r.width / 2 - box.left) * s
    const cy = 1 - (r.top + r.height / 2 - box.top) * s
    winTarget = [cx, cy, (r.width / 2) * s, (r.height / 2) * s]
  }

  const start = performance.now()
  let held = 0
  let lastFrame = start
  const draw = (t: number) => {
    const dt = Math.min(0.1, (t - lastFrame) / 1000)
    lastFrame = t
    const still = reducedQ.matches
    // about 90 percent of the way to a new scene in a second; the window zone follows faster
    const kScene = still ? 1 : 1 - Math.exp(-dt / 0.42)
    const kWin = still || !settled ? 1 : 1 - Math.exp(-dt / 0.12)
    settled = true
    readWindow()
    now.cover = ease(now.cover, target.cover, kScene)
    now.contrast = ease(now.contrast, target.contrast, kScene)
    now.scale = ease(now.scale, target.scale, kScene)
    now.calm = ease(now.calm, target.calm, kScene)
    now.pal = now.pal.map((c, i) => c.map((x, k) => ease(x, target.pal[i][k], kScene)))
    win = win.map((x, i) => ease(x, winTarget[i], kWin))
    drift = ease(drift, driftTarget, still ? 1 : 1 - Math.exp(-dt / 0.3))
    const time = still ? held : (held = (t - start) / 1000)

    gl.useProgram(clouds)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, GW, GH)
    gl.uniform2f(U.grid, GW, GH)
    gl.uniform1f(U.time, time)
    gl.uniform1f(U.drift, still ? 0 : drift)
    gl.uniform1f(U.scale, now.scale)
    gl.uniform1f(U.cover, now.cover)
    gl.uniform1f(U.contrast, now.contrast)
    // on a phone the chat fills the screen, so the clouds only thin a little behind it
    gl.uniform1f(U.calm, now.calm * (W / Math.min(2, window.devicePixelRatio || 1) < 900 ? 0.45 : 1))
    gl.uniform4f(U.win, win[0], win[1], win[2], win[3])
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.useProgram(dots)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, W, H)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(U.levels, 0)
    gl.uniform2f(U.dGrid, GW, GH)
    gl.uniform1f(U.cell, cellPx)
    U.c.forEach((loc, k) => gl.uniform3f(loc, now.pal[k][0], now.pal[k][1], now.pal[k][2]))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // about 30 frames a second while drifting; under reduced motion only changes redraw
  let raf = 0
  let last = 0
  let dirty = true
  let alive = true
  const loop = (t: number) => {
    raf = 0
    if (!alive || document.hidden) return
    const still = reducedQ.matches
    if (dirty || (!still && t - last > 33)) {
      last = t
      dirty = false
      draw(t)
    }
    if (!still) raf = requestAnimationFrame(loop)
  }
  const kick = () => {
    dirty = true
    if (!raf && alive) raf = requestAnimationFrame(loop)
  }

  const observer = new ResizeObserver(() => {
    resize()
    kick()
  })
  observer.observe(canvas)
  // windows move, resize and open without telling the sky; a cheap watch keeps it in step
  const mutations = new MutationObserver(kick)
  mutations.observe(root, { subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-front'], childList: true })
  const onLost = (event: Event) => {
    event.preventDefault()
    alive = false
    cancelAnimationFrame(raf)
    canvas.dataset.lost = 'true'
  }
  canvas.addEventListener('webglcontextlost', onLost)
  document.addEventListener('visibilitychange', kick)
  reducedQ.addEventListener?.('change', kick)

  resize()
  draw(performance.now())
  kick()

  return {
    setScene(id) {
      target = params(SCENES[id])
      kick()
    },
    setDrift(value) {
      driftTarget = value
      kick()
    },
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
      observer.disconnect()
      mutations.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      document.removeEventListener('visibilitychange', kick)
      reducedQ.removeEventListener?.('change', kick)
    },
  }
}
