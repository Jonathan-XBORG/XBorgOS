import { useEffect, useRef } from 'react'

// The wallpaper redrawn in WebGL as a grid of squares, like the XBorg 3D
// wallpaper: each 16px square is the average colour of the image under it,
// on black. The pointer pushes the squares back into depth: around it they
// recede (smaller, darker, drawn towards the pointer, each to its own depth),
// as if the image came apart under it. The path keeps the dent for a moment
// and a click sends a soft ring outwards. Drawn in two passes: one texel per
// square (colour + depth), then the squares themselves. The CSS wallpaper
// underneath stays as the fallback (no WebGL) and shows until the image is
// on the GPU.

const MAX_RIPPLES = 16
const RIPPLE_LIFE = 0.7 // seconds a trail spot takes to fade
const SPAWN_DIST = 28 // css px between two trail spots
const MAX_PIXELS = 4_200_000 // keeps very wide screens smooth
// A click sends a ring of squares outwards, further and slower than the trail.
const MAX_SPLASHES = 4
const SPLASH_LIFE = 1.2 // seconds
const CELL = 16 // css px per square, gap included (same as XBorg 3D)
const GAP = 2
const RADIUS = 1.5

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const GRID_FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_css;
uniform vec2 u_img;
uniform float u_opacity;
uniform float u_time;
uniform vec4 u_r[${MAX_RIPPLES}];
uniform vec4 u_c[${MAX_SPLASHES}];
uniform vec2 u_mouse;
uniform float u_hover;
varying vec2 v_uv;

vec3 image(vec2 frag) {
  vec2 uv = frag / u_css;
  float ra = u_css.x / u_css.y;
  float ia = u_img.x / u_img.y;
  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  vec2 tuv = (uv - 0.5) * s + 0.5;
  tuv.y = 1.0 - tuv.y;
  return texture2D(u_tex, clamp(tuv, 0.0, 1.0)).rgb;
}

// How strongly a point is pixelated, 0 to 1.
float amount(vec2 p) {
  float m = 0.0;
  vec2 dm = p - u_mouse;
  m += exp(-dot(dm, dm) / (2.0 * 90.0 * 90.0)) * u_hover;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = u_r[i];
    if (r.w <= 0.0) continue;
    float age = u_time - r.z;
    if (age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
    vec2 d = p - r.xy;
    float fade = 1.0 - age / ${RIPPLE_LIFE.toFixed(1)};
    m += exp(-dot(d, d) / (2.0 * 55.0 * 55.0)) * fade * fade * r.w;
  }
  for (int i = 0; i < ${MAX_SPLASHES}; i++) {
    vec4 c = u_c[i];
    if (c.w <= 0.0) continue;
    float age = u_time - c.z;
    if (age < 0.0 || age > ${SPLASH_LIFE.toFixed(1)}) continue;
    float dist = length(p - c.xy);
    float k = (dist - age * 480.0) / 40.0;
    float fade = 1.0 - age / ${SPLASH_LIFE.toFixed(1)};
    m += exp(-k * k) * fade * 0.55 * c.w;
    // The drop itself: the squares under the pointer, fading fast.
    m += exp(-dist * dist / (2.0 * 80.0 * 80.0)) * exp(-age * 6.0) * 0.45 * c.w;
  }
  return clamp(m, 0.0, 1.0);
}

// One texel per square: the average colour of the image under it (rgb) and
// how far the pointer pushes it back (alpha).
void main() {
  vec2 origin = floor(gl_FragCoord.xy) * ${CELL}.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      sum += image(origin + (vec2(float(i), float(j)) + 0.5) * ${(CELL / 4).toFixed(1)});
    }
  }
  gl_FragColor = vec4(sum / 16.0 * u_opacity, amount(origin + 0.5 * ${CELL}.0));
}`

const SHOW_FRAG = `
precision highp float;
uniform sampler2D u_grid;
uniform vec2 u_gridSize;
uniform vec2 u_css;
uniform vec2 u_mouse;
varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 frag = v_uv * u_css;
  vec2 home = floor(frag / ${CELL}.0);
  vec3 col = vec3(0.0);
  float nearest = 9.0;
  // A pushed square can drift up to two cells, so look at the neighbours
  // and keep the one closest to the viewer.
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 id = home + vec2(float(x), float(y));
      if (id.x < 0.0 || id.y < 0.0 || id.x >= u_gridSize.x || id.y >= u_gridSize.y) continue;
      vec4 g = texture2D(u_grid, (id + 0.5) / u_gridSize);
      // Each square goes to its own depth, so the surface breaks up.
      float z = g.a * (0.45 + 0.55 * hash(id));
      vec2 centre = (id + 0.5) * ${CELL}.0;
      // Receding: drawn towards the pointer, the vanishing point, plus a
      // small random drift.
      vec2 pull = (u_mouse - centre) * 0.22 * z;
      float len = length(pull);
      if (len > ${(CELL * 1.3).toFixed(1)}) pull *= ${(CELL * 1.3).toFixed(1)} / len;
      vec2 drift = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * ${(CELL * 0.5).toFixed(1)} * z;
      vec2 c = centre + pull + drift;
      float side = ${(CELL - GAP).toFixed(1)} / (1.0 + 1.8 * z);
      float r = min(${RADIUS.toFixed(1)}, side * 0.2);
      vec2 d = abs(frag - c) - (0.5 * side - r);
      float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
      float inside = clamp(0.5 - sd, 0.0, 1.0);
      if (inside > 0.0 && z < nearest) {
        nearest = z;
        // Deeper squares fade into the black.
        vec3 sq = g.rgb * (1.0 - 0.75 * z) * mix(0.8, 1.0, clamp(-sd - 0.5, 0.0, 1.0));
        col = sq * inside;
      }
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
  return sh
}

// The picture is either an image (src, small) or a canvas drawn elsewhere
// (source, uploaded again whenever version changes), as Live XBG does.
export default function WallpaperWave({
  src = '',
  small = '',
  opacity,
  source,
  version = 0,
}: {
  src?: string
  small?: string
  opacity: number
  source?: HTMLCanvasElement
  version?: number
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const props = useRef({ src, small, opacity, source })
  props.current = { src, small, opacity, source }
  const api = useRef<{ load: () => void } | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    // The grid shows everywhere; only the pointer effects need a mouse and motion.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = el.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false })
    if (!gl) return

    function program(frag: string) {
      const p = gl!.createProgram()!
      gl!.attachShader(p, compile(gl!, gl!.VERTEX_SHADER, VERT))
      gl!.attachShader(p, compile(gl!, gl!.FRAGMENT_SHADER, frag))
      gl!.bindAttribLocation(p, 0, 'a_pos')
      gl!.linkProgram(p)
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) throw new Error('link')
      return p
    }
    let gridProg: WebGLProgram
    let showProg: WebGLProgram
    try {
      gridProg = program(GRID_FRAG)
      showProg = program(SHOW_FRAG)
    } catch {
      return
    }
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(gridProg, name)
    const uCss = u('u_css')
    const uImg = u('u_img')
    const uOpacity = u('u_opacity')
    const uTime = u('u_time')
    const uR = u('u_r')
    const uC = u('u_c')
    const uMouse = u('u_mouse')
    const uHover = u('u_hover')
    const sGrid = gl.getUniformLocation(showProg, 'u_grid')
    const sGridSize = gl.getUniformLocation(showProg, 'u_gridSize')
    const sCss = gl.getUniformLocation(showProg, 'u_css')
    const sMouse = gl.getUniformLocation(showProg, 'u_mouse')

    // One texel per square, written by the first pass.
    const gridTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, gridTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    const fbo = gl.createFramebuffer()
    let grid = { w: 1, h: 1 }

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    // V2: nearest filtering keeps the dithered pixels sharp.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    const ripples = new Float32Array(MAX_RIPPLES * 4)
    const splashes = new Float32Array(MAX_SPLASHES * 4)
    let nextSplash = 0
    let lastClick = -10
    let next = 0
    let img = { w: 16, h: 9 }
    let ready = false
    let css = { w: 1, h: 1 }
    const mouse = { x: -9999, y: -9999, hover: 0, target: 0 }
    let last = { x: -9999, y: -9999 }
    let lastMove = 0
    let raf = 0
    let lastFrame = 0
    const t0 = performance.now()
    const now = () => (performance.now() - t0) / 1000

    function size() {
      css = { w: el!.clientWidth || window.innerWidth, h: el!.clientHeight || window.innerHeight }
      let scale = Math.min(window.devicePixelRatio || 1, 2)
      if (css.w * css.h * scale * scale > MAX_PIXELS) scale = Math.sqrt(MAX_PIXELS / (css.w * css.h))
      el!.width = Math.round(css.w * scale)
      el!.height = Math.round(css.h * scale)
      grid = { w: Math.ceil(css.w / CELL), h: Math.ceil(css.h / CELL) }
      gl!.bindTexture(gl!.TEXTURE_2D, gridTex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, grid.w, grid.h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, gridTex, 0)
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      wake()
    }

    let disposed = false
    let loadId = 0
    function load() {
      const id = ++loadId
      const from = props.current.source
      if (from) {
        if (!from.width || !from.height) return
        gl!.bindTexture(gl!.TEXTURE_2D, tex)
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, from)
        img = { w: from.width, h: from.height }
        ready = true
        el!.classList.add('is-ready')
        wake()
        return
      }
      const wide = window.innerWidth * (window.devicePixelRatio || 1) > 2200
      const image = new Image()
      image.decoding = 'async'
      image.src = wide ? props.current.src : props.current.small
      image
        .decode()
        .then(() => {
          if (disposed || id !== loadId) return
          gl!.bindTexture(gl!.TEXTURE_2D, tex)
          gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, image)
          img = { w: image.naturalWidth, h: image.naturalHeight }
          ready = true
          el!.classList.add('is-ready')
          wake()
        })
        .catch(() => {})
    }
    api.current = { load }

    function draw() {
      if (disposed) return
      const t = now()
      // Time based easing, so the hover spot settles at the same speed at any fps.
      mouse.hover += (mouse.target - mouse.hover) * (1 - Math.exp(-(t - lastFrame) * 6))
      lastFrame = t
      // Pass 1: colour and depth of every square.
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.viewport(0, 0, grid.w, grid.h)
      gl!.useProgram(gridProg)
      gl!.activeTexture(gl!.TEXTURE0)
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.uniform2f(uCss, css.w, css.h)
      gl!.uniform2f(uImg, img.w, img.h)
      gl!.uniform1f(uOpacity, props.current.opacity)
      gl!.uniform1f(uTime, t)
      gl!.uniform4fv(uR, ripples)
      gl!.uniform4fv(uC, splashes)
      gl!.uniform2f(uMouse, mouse.x, css.h - mouse.y)
      gl!.uniform1f(uHover, mouse.hover)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      // Pass 2: the squares, pushed back by their depth.
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      gl!.viewport(0, 0, el!.width, el!.height)
      gl!.useProgram(showProg)
      gl!.bindTexture(gl!.TEXTURE_2D, gridTex)
      gl!.uniform1i(sGrid, 0)
      gl!.uniform2f(sGridSize, grid.w, grid.h)
      gl!.uniform2f(sCss, css.w, css.h)
      gl!.uniform2f(sMouse, mouse.x, css.h - mouse.y)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      const busy = t - lastMove < RIPPLE_LIFE || t - lastClick < SPLASH_LIFE || Math.abs(mouse.target - mouse.hover) > 0.002
      raf = busy ? requestAnimationFrame(draw) : 0
    }
    function wake() {
      if (ready && !raf) {
        lastFrame = now()
        raf = requestAnimationFrame(draw)
      }
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.target = 1
      lastMove = now()
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      const dist = Math.hypot(dx, dy)
      if (dist > SPAWN_DIST) {
        const strength = Math.min(1, 0.5 + dist / 300)
        ripples.set([e.clientX, css.h - e.clientY, lastMove, strength], next * 4)
        next = (next + 1) % MAX_RIPPLES
        last = { x: e.clientX, y: e.clientY }
      }
      wake()
    }
    function onDown(e: PointerEvent) {
      if (e.button !== 0) return
      lastClick = now()
      splashes.set([e.clientX, css.h - e.clientY, lastClick, 1], nextSplash * 4)
      nextSplash = (nextSplash + 1) % MAX_SPLASHES
      wake()
    }
    function onLeave() {
      mouse.target = 0
      lastMove = now()
      wake()
    }

    size()
    load()
    window.addEventListener('resize', size)
    if (!still) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onDown, { passive: true })
    }
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      api.current = null
      window.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      // Free the GPU objects but keep the context: React's dev mode mounts
      // twice, and a lost context could not be brought back on this canvas.
      gl.deleteTexture(tex)
      gl.deleteTexture(gridTex)
      gl.deleteFramebuffer(fbo)
      gl.deleteBuffer(buf)
      gl.deleteProgram(gridProg)
      gl.deleteProgram(showProg)
      el.classList.remove('is-ready')
    }
  }, [])

  // A new wallpaper from Preferences, or a redrawn source: upload it.
  useEffect(() => {
    api.current?.load()
  }, [src, small, version])

  return <canvas ref={canvas} className="os-wallpaper-gl" aria-hidden="true" />
}
