import { useEffect, useRef } from 'react'

// The wallpaper redrawn in WebGL so the pointer can pixelate it, like the
// XBorg 3D wallpaper: around the cursor and along its path the image turns
// into a grid of small squares (each one the average colour of what it
// covers, bigger the closer to the pointer), and a click sends a ring of
// squares outwards. The CSS wallpaper underneath stays as the fallback (no
// WebGL, touch screens, reduced motion) and shows until the image is on the
// GPU.

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

const FRAG = `
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
  m += exp(-dot(dm, dm) / (2.0 * 70.0 * 70.0)) * u_hover;
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
    float k = (dist - age * 480.0) / 50.0;
    float fade = 1.0 - age / ${SPLASH_LIFE.toFixed(1)};
    m += exp(-k * k) * fade * 1.3 * c.w;
    // The drop itself: the squares under the pointer, fading fast.
    m += exp(-dist * dist / (2.0 * 90.0 * 90.0)) * exp(-age * 6.0) * c.w;
  }
  return clamp(m, 0.0, 1.0);
}

void main() {
  vec2 frag = v_uv * u_css;
  vec3 col = image(frag);
  vec2 id = floor(frag / ${CELL}.0);
  vec2 centre = (id + 0.5) * ${CELL}.0;
  float m = amount(centre);
  if (m > 0.02) {
    // The square's colour: the average of the image under the cell.
    vec3 avg = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        avg += image(id * ${CELL}.0 + (vec2(float(i), float(j)) + 0.5) * ${(CELL / 4).toFixed(1)});
      }
    }
    avg /= 16.0;
    // The gaps go dark, the square grows with the amount.
    col = mix(col, vec3(0.0), smoothstep(0.0, 0.6, m) * 0.85);
    float size = (${CELL}.0 - ${GAP}.0) * clamp(0.2 + m * 1.2, 0.0, 1.0);
    float r = min(${RADIUS.toFixed(1)}, 0.2 * size);
    vec2 d = abs(frag - centre) - (0.5 * size - r);
    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
    float inside = clamp(0.5 - sd, 0.0, 1.0);
    avg *= mix(0.8, 1.0, clamp(-sd - 0.5, 0.0, 1.0));
    col = mix(col, avg, inside * smoothstep(0.02, 0.25, m));
  }
  gl_FragColor = vec4(col * u_opacity, 1.0);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
  return sh
}

export default function WallpaperWave({ src, small, opacity }: { src: string; small: string; opacity: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const props = useRef({ src, small, opacity })
  props.current = { src, small, opacity }
  const api = useRef<{ load: () => void } | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const gl = el.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false })
    if (!gl) return

    let prog: WebGLProgram
    try {
      prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    } catch {
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(prog, name)
    const uCss = u('u_css')
    const uImg = u('u_img')
    const uOpacity = u('u_opacity')
    const uTime = u('u_time')
    const uR = u('u_r')
    const uC = u('u_c')
    const uMouse = u('u_mouse')
    const uHover = u('u_hover')

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
      gl!.viewport(0, 0, el!.width, el!.height)
      wake()
    }

    let loadId = 0
    function load() {
      const id = ++loadId
      const wide = window.innerWidth * (window.devicePixelRatio || 1) > 2200
      const image = new Image()
      image.decoding = 'async'
      image.src = wide ? props.current.src : props.current.small
      image
        .decode()
        .then(() => {
          if (id !== loadId) return
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
      const t = now()
      // Time based easing, so the hover spot settles at the same speed at any fps.
      mouse.hover += (mouse.target - mouse.hover) * (1 - Math.exp(-(t - lastFrame) * 6))
      lastFrame = t
      gl!.uniform2f(uCss, css.w, css.h)
      gl!.uniform2f(uImg, img.w, img.h)
      gl!.uniform1f(uOpacity, props.current.opacity)
      gl!.uniform1f(uTime, t)
      gl!.uniform4fv(uR, ripples)
      gl!.uniform4fv(uC, splashes)
      gl!.uniform2f(uMouse, mouse.x, css.h - mouse.y)
      gl!.uniform1f(uHover, mouse.hover)
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
      if (e.pointerType !== 'mouse' || e.button !== 0) return
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
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
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
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      el.classList.remove('is-ready')
    }
  }, [])

  // A new wallpaper from Preferences: upload the new image.
  useEffect(() => {
    api.current?.load()
  }, [src, small])

  return <canvas ref={canvas} className="os-wallpaper-gl" aria-hidden="true" />
}
